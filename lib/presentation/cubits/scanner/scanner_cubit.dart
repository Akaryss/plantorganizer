// lib/presentation/cubits/scanner/scanner_cubit.dart
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../data/datasources/remote/perenual_api_service.dart';
import '../../../data/datasources/local/isar_database_service.dart';
import '../../../data/datasources/local/realm_database_service.dart';
import '../../../core/services/notification_service.dart';
import '../../../data/models/api/perenual_plant_dto.dart';
import '../../../domain/entities/plant.dart';
import 'scanner_state.dart';

/// Cubit модуля сканирования этикеток и автоматизированного добавления (ЛР №2 & №4)
class ScannerCubit extends Cubit<ScannerState> {
  final PerenualApiService _apiService;
  final IsarDatabaseService _db;
  final RealmDatabaseService _realm;
  final NotificationService _notificationService;

  ScannerCubit({
    required PerenualApiService apiService,
    required IsarDatabaseService db,
    required RealmDatabaseService realm,
    required NotificationService notificationService,
  })  : _apiService = apiService,
        _db = db,
        _realm = realm,
        _notificationService = notificationService,
        super(const ScannerState());

  void toggleMockMode(bool enabled) {
    emit(state.copyWith(isMockMode: enabled));
  }

  /// Обработка результата сканирования штрихкода или текста с этикетки (ЛР №4)
  Future<void> onTextScanned(String rawText) async {
    final query = rawText.trim();
    if (query.isEmpty) return;

    emit(state.copyWith(
      isSearching: true,
      scannedQuery: query,
      errorMessage: null,
      savedPlant: null,
    ));

    try {
      final results = await _apiService.searchSpecies(query);
      emit(state.copyWith(
        isSearching: false,
        searchResults: results,
      ));
    } catch (e) {
      emit(state.copyWith(
        isSearching: false,
        errorMessage: 'Ошибка при обращении к REST API: $e',
      ));
    }
  }

  /// Сохранение найденного растения в Isar с регистрацией уведомлений (Реактивная цепочка)
  Future<void> savePlantFromApi(PerenualPlantDto dto, {String? customLocation}) async {
    emit(state.copyWith(isSaving: true, errorMessage: null));
    try {
      // 1. Поиск соответствующего семейства в Realm
      final families = _realm.getAllFamilies();
      final family = families.firstWhere(
        (f) => f.latinName.toLowerCase() == (dto.family?.toLowerCase() ?? ''),
        orElse: () => families.first,
      );

      // 2. Маппинг DTO -> Domain Plant
      final plantToSave = _apiService.mapDtoToDomain(
        dto,
        familyId: family.id,
        familyName: family.name,
      );

      final finalPlant = Plant(
        id: 0,
        name: plantToSave.name,
        scientificName: plantToSave.scientificName,
        familyId: plantToSave.familyId,
        familyName: plantToSave.familyName,
        imageUrl: plantToSave.imageUrl,
        wateringFrequencyDays: plantToSave.wateringFrequencyDays,
        fertilizingFrequencyDays: plantToSave.fertilizingFrequencyDays,
        lastWateredDate: DateTime.now(),
        lightRequirement: plantToSave.lightRequirement,
        humidityLevel: plantToSave.humidityLevel,
        temperatureRange: plantToSave.temperatureRange,
        notes: plantToSave.notes,
        location: customLocation ?? 'Комната',
      );

      // 3. Сохранение в Isar
      final savedId = await _db.savePlant(finalPlant);
      final createdPlant = await _db.getPlantById(savedId);

      // 4. Регистрация локальных уведомлений в системе (день полива и +2 дня просрочка)
      if (createdPlant != null) {
        await _notificationService.scheduleWateringChain(
          plantId: savedId,
          plantName: createdPlant.name,
          nextWateringDate: createdPlant.nextWateringDate,
          intervalDays: createdPlant.wateringFrequencyDays,
        );
      }

      emit(state.copyWith(
        isSaving: false,
        savedPlant: createdPlant ?? finalPlant,
      ));
    } catch (e) {
      emit(state.copyWith(
        isSaving: false,
        errorMessage: 'Ошибка сохранения в базу данных: $e',
      ));
    }
  }
}
