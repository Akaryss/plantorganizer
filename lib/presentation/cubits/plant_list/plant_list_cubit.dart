// lib/presentation/cubits/plant_list/plant_list_cubit.dart
import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../data/datasources/local/isar_database_service.dart';
import '../../../core/services/notification_service.dart';
import '../../../core/enums/care_type.dart';
import '../../../domain/entities/plant.dart';
import 'plant_list_state.dart';

/// Cubit управления списком растений (ЛР №2: MVVM / BLoC)
class PlantListCubit extends Cubit<PlantListState> {
  final IsarDatabaseService _db;
  final NotificationService _notificationService;
  StreamSubscription? _plantSub;

  PlantListCubit({
    required IsarDatabaseService db,
    required NotificationService notificationService,
  })  : _db = db,
        _notificationService = notificationService,
        super(const PlantListState(isLoading: true)) {
    _initWatcher();
  }

  void _initWatcher() {
    _plantSub = _db.watchAllPlants().listen((plants) {
      final filtered = _applyFilters(
        plants,
        state.searchQuery,
        state.selectedFamilyId,
        state.statusFilter,
      );
      emit(state.copyWith(
        isLoading: false,
        allPlants: plants,
        filteredPlants: filtered,
      ));
    });
  }

  /// Поиск по названию или латинскому имени
  void setSearchQuery(String query) {
    final filtered = _applyFilters(
      state.allPlants,
      query,
      state.selectedFamilyId,
      state.statusFilter,
    );
    emit(state.copyWith(searchQuery: query, filteredPlants: filtered));
  }

  /// Фильтрация по семейству Realm
  void setFamilyFilter(String familyId) {
    final filtered = _applyFilters(
      state.allPlants,
      state.searchQuery,
      familyId,
      state.statusFilter,
    );
    emit(state.copyWith(selectedFamilyId: familyId, filteredPlants: filtered));
  }

  /// Фильтрация по статусу полива (просрочено, сегодня, все)
  void setStatusFilter(PlantFilterStatus status) {
    final filtered = _applyFilters(
      state.allPlants,
      state.searchQuery,
      state.selectedFamilyId,
      status,
    );
    emit(state.copyWith(statusFilter: status, filteredPlants: filtered));
  }

  /// Полив растения прямо из карточки (ТЗ ЛР №1: мгновенный сброс статуса на здоровый)
  Future<void> waterPlant(int plantId) async {
    try {
      await _db.logCareAction(
        plantId: plantId,
        type: CareType.water,
        notes: 'Быстрый полив из карточки',
      );

      final updatedPlant = await _db.getPlantById(plantId);
      if (updatedPlant != null) {
        await _notificationService.scheduleWateringChain(
          plantId: plantId,
          plantName: updatedPlant.name,
          nextWateringDate: updatedPlant.nextWateringDate,
          intervalDays: updatedPlant.wateringFrequencyDays,
        );
      }
    } catch (e) {
      emit(state.copyWith(errorMessage: 'Ошибка при поливе: $e'));
    }
  }

  /// Удаление растения
  Future<void> deletePlant(int plantId) async {
    try {
      await _db.deletePlant(plantId);
      await _notificationService.cancelPlantNotifications(plantId);
    } catch (e) {
      emit(state.copyWith(errorMessage: 'Ошибка при удалении: $e'));
    }
  }

  List<Plant> _applyFilters(
    List<Plant> plants,
    String query,
    String familyId,
    PlantFilterStatus status,
  ) {
    return plants.where((plant) {
      // 1. Поиск
      if (query.isNotEmpty) {
        final q = query.toLowerCase();
        final match = plant.name.toLowerCase().contains(q) ||
            plant.scientificName.toLowerCase().contains(q);
        if (!match) return false;
      }

      // 2. Семейство
      if (familyId != 'all' && plant.familyId != familyId) {
        return false;
      }

      // 3. Статус полива
      if (status == PlantFilterStatus.dueToday) {
        if (plant.wateringStatus != PlantWateringStatus.dueToday) return false;
      } else if (status == PlantFilterStatus.overdue) {
        if (plant.wateringStatus != PlantWateringStatus.overdue &&
            plant.wateringStatus != PlantWateringStatus.criticalOverdue) {
          return false;
        }
      }

      return true;
    }).toList();
  }

  @override
  Future<void> close() {
    _plantSub?.cancel();
    return super.close();
  }
}
