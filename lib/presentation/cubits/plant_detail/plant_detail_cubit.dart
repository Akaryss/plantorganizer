// lib/presentation/cubits/plant_detail/plant_detail_cubit.dart
import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../data/datasources/local/isar_database_service.dart';
import '../../../core/services/notification_service.dart';
import '../../../core/enums/care_type.dart';
import 'plant_detail_state.dart';

/// Cubit экрана подробной информации и журнала ухода (ЛР №2)
class PlantDetailCubit extends Cubit<PlantDetailState> {
  final int plantId;
  final IsarDatabaseService _db;
  final NotificationService _notificationService;
  StreamSubscription? _logsSub;

  PlantDetailCubit({
    required this.plantId,
    required IsarDatabaseService db,
    required NotificationService notificationService,
  })  : _db = db,
        _notificationService = notificationService,
        super(const PlantDetailState(isLoading: true)) {
    loadPlantData();
  }

  Future<void> loadPlantData() async {
    emit(state.copyWith(isLoading: true));
    final plant = await _db.getPlantById(plantId);
    final logs = await _db.getCareLogsForPlant(plantId);

    _logsSub?.cancel();
    _logsSub = _db.watchCareLogsForPlant(plantId).listen((newLogs) {
      emit(state.copyWith(careLogs: newLogs));
    });

    emit(state.copyWith(
      isLoading: false,
      plant: plant,
      careLogs: logs,
    ));
  }

  /// Запись процедуры ухода (Полив, Подкормка, Пересадка, Опрыскивание)
  Future<void> addCareAction({
    required CareType type,
    String? notes,
    String? fertilizerName,
  }) async {
    try {
      await _db.logCareAction(
        plantId: plantId,
        type: type,
        notes: notes,
        fertilizerName: fertilizerName,
      );

      // Обновляем сущность растения
      final updatedPlant = await _db.getPlantById(plantId);
      if (updatedPlant != null) {
        if (type == CareType.water) {
          await _notificationService.scheduleWateringChain(
            plantId: plantId,
            plantName: updatedPlant.name,
            nextWateringDate: updatedPlant.nextWateringDate,
            intervalDays: updatedPlant.wateringFrequencyDays,
          );
        }
        emit(state.copyWith(
          plant: updatedPlant,
          successMessage: 'Процедура «${type.displayName}» успешно сохранена!',
        ));
      }
    } catch (e) {
      emit(state.copyWith(errorMessage: 'Ошибка при сохранении процедуры: $e'));
    }
  }

  @override
  Future<void> close() {
    _logsSub?.cancel();
    return super.close();
  }
}
