// lib/data/datasources/local/isar_database_service.dart
import 'dart:async';
import 'package:isar/isar.dart';
import 'package:path_provider/path_provider.dart';
import '../../../core/enums/care_type.dart';
import '../../../domain/entities/plant.dart';
import '../../../domain/entities/care_log.dart';
import '../../models/isar/plant_isar_model.dart';
import '../../models/isar/care_log_isar_model.dart';

/// Локальный источник данных на базе Isar (Data-слой Clean Architecture)
/// Поддерживает нативный режим Isar и устойчивый fallback для демо-режима и тестов
class IsarDatabaseService {
  Isar? _isar;
  bool _useFallback = false;

  // Fallback in-memory реактивные хранилища
  final List<Plant> _fallbackPlants = [];
  final List<CareLog> _fallbackLogs = [];
  final _plantsStreamController = StreamController<List<Plant>>.broadcast();
  final Map<int, StreamController<List<CareLog>>> _logControllers = {};

  Isar? get isarInstance => _isar;
  bool get isFallbackMode => _useFallback;

  /// Инициализация БД Isar со схемами коллекций
  Future<void> init({bool isInMemory = false}) async {
    try {
      if (_isar != null && _isar!.isOpen) return;

      String? directory;
      if (!isInMemory) {
        final dir = await getApplicationDocumentsDirectory();
        directory = dir.path;
      }

      _isar = await Isar.open(
        [PlantIsarModelSchema, CareLogIsarModelSchema],
        directory: directory ?? '',
        name: 'plants_db',
      );
    } catch (e) {
      // При отсутствии нативных бинарников Isar (например, быстрый запуск на веб или тестовый прогон)
      // активируется полноценный реактивный Fallback-движок по ТЗ
      _useFallback = true;
      _seedFallbackData();
    }
  }

  void _seedFallbackData() {
    if (_fallbackPlants.isNotEmpty) return;
    final now = DateTime.now();
    _fallbackPlants.addAll([
      Plant(
        id: 1,
        name: 'Монстера Деликатесная',
        scientificName: 'Monstera deliciosa',
        familyId: 'fam_araceae',
        familyName: 'Ароидные',
        imageUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=800&q=80',
        wateringFrequencyDays: 6,
        fertilizingFrequencyDays: 14,
        lastWateredDate: now.subtract(const Duration(days: 9)), // Просрочка 3 дня (критическая)
        lastFertilizedDate: now.subtract(const Duration(days: 20)),
        lightRequirement: 'Яркий рассеянный',
        humidityLevel: 65,
        temperatureRange: '18-26 °C',
        notes: 'Протереть резные листья влажной салфеткой',
        location: 'Гостиная у окна',
      ),
      Plant(
        id: 2,
        name: 'Фикус Лирата',
        scientificName: 'Ficus lyrata',
        familyId: 'fam_moraceae',
        familyName: 'Тутовые',
        imageUrl: 'https://images.unsplash.com/photo-1597055181300-e3633a207518?auto=format&fit=crop&w=800&q=80',
        wateringFrequencyDays: 7,
        fertilizingFrequencyDays: 14,
        lastWateredDate: now.subtract(const Duration(days: 7)), // Полить сегодня
        lastFertilizedDate: now.subtract(const Duration(days: 10)),
        lightRequirement: 'Яркий рассеянный',
        humidityLevel: 55,
        temperatureRange: '20-25 °C',
        notes: 'Чувствителен к холодным сквознякам',
        location: 'Спальня',
      ),
      Plant(
        id: 3,
        name: 'Сансевиерия Лауренти (Щучий хвост)',
        scientificName: 'Dracaena trifasciata',
        familyId: 'fam_asparagaceae',
        familyName: 'Спаржевые',
        imageUrl: 'https://images.unsplash.com/photo-1599598425947-630b5e5251a3?auto=format&fit=crop&w=800&q=80',
        wateringFrequencyDays: 14,
        fertilizingFrequencyDays: 30,
        lastWateredDate: now.subtract(const Duration(days: 4)), // В норме (зеленый)
        lastFertilizedDate: now.subtract(const Duration(days: 15)),
        lightRequirement: 'Теневыносливое',
        humidityLevel: 40,
        temperatureRange: '15-28 °C',
        notes: 'Не переливать, не лить воду в розетку',
        location: 'Коридор',
      ),
      Plant(
        id: 4,
        name: 'Калатея Макоя',
        scientificName: 'Goeppertia makoyana',
        familyId: 'fam_marantaceae',
        familyName: 'Марантовые',
        imageUrl: 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=800&q=80',
        wateringFrequencyDays: 5,
        fertilizingFrequencyDays: 14,
        lastWateredDate: now.subtract(const Duration(days: 6)), // Просрочка 1 день
        lastFertilizedDate: now.subtract(const Duration(days: 12)),
        lightRequirement: 'Полутень',
        humidityLevel: 75,
        temperatureRange: '19-24 °C',
        notes: 'Опрыскивать только дистиллированной водой',
        location: 'Рабочий стол',
      ),
    ]);

    _fallbackLogs.addAll([
      CareLog(
        id: 101,
        plantId: 1,
        type: CareType.water,
        timestamp: now.subtract(const Duration(days: 9)),
        notes: 'Полив отстоянной водой комнатной температуры',
      ),
      CareLog(
        id: 102,
        plantId: 2,
        type: CareType.fertilize,
        timestamp: now.subtract(const Duration(days: 10)),
        fertilizerName: 'Органо-минеральное для фикусов',
      ),
    ]);

    _plantsStreamController.add(List.unmodifiable(_fallbackPlants));
  }

  /// Реактивный Stream для подписки в PlantListCubit (ТЗ ЛР: отслеживание изменений)
  Stream<List<Plant>> watchAllPlants() {
    if (_useFallback || _isar == null) {
      // Отправляем актуальный снимок немедленно
      scheduleMicrotask(() {
        if (!_plantsStreamController.isClosed) {
          _plantsStreamController.add(List.unmodifiable(_fallbackPlants));
        }
      });
      return _plantsStreamController.stream;
    }

    return _isar!.plantIsarModels
        .where()
        .watch(fireImmediately: true)
        .map((models) => models.map((m) => m.toDomain()).toList());
  }

  /// Получение всех растений единовременно
  Future<List<Plant>> getAllPlants() async {
    if (_useFallback || _isar == null) {
      return List.unmodifiable(_fallbackPlants);
    }
    final models = await _isar!.plantIsarModels.where().findAll();
    return models.map((m) => m.toDomain()).toList();
  }

  /// Получение конкретного растения по ID
  Future<Plant?> getPlantById(int id) async {
    if (_useFallback || _isar == null) {
      try {
        return _fallbackPlants.firstWhere((p) => p.id == id);
      } catch (_) {
        return null;
      }
    }
    final model = await _isar!.plantIsarModels.get(id);
    return model?.toDomain();
  }

  /// Сохранение или обновление растения
  Future<int> savePlant(Plant plant) async {
    if (_useFallback || _isar == null) {
      final existingIndex = _fallbackPlants.indexWhere((p) => p.id == plant.id);
      int finalId = plant.id;
      if (existingIndex >= 0) {
        _fallbackPlants[existingIndex] = plant;
      } else {
        if (finalId <= 0) {
          finalId = _fallbackPlants.isEmpty ? 1 : (_fallbackPlants.map((e) => e.id).reduce((a, b) => a > b ? a : b) + 1);
          final updated = Plant(
            id: finalId,
            name: plant.name,
            scientificName: plant.scientificName,
            familyId: plant.familyId,
            familyName: plant.familyName,
            imageUrl: plant.imageUrl,
            wateringFrequencyDays: plant.wateringFrequencyDays,
            fertilizingFrequencyDays: plant.fertilizingFrequencyDays,
            lastWateredDate: plant.lastWateredDate,
            lastFertilizedDate: plant.lastFertilizedDate,
            lightRequirement: plant.lightRequirement,
            humidityLevel: plant.humidityLevel,
            temperatureRange: plant.temperatureRange,
            notes: plant.notes,
            location: plant.location,
          );
          _fallbackPlants.add(updated);
        } else {
          _fallbackPlants.add(plant);
        }
      }
      _plantsStreamController.add(List.unmodifiable(_fallbackPlants));
      return finalId;
    }

    final model = PlantIsarModel.fromDomain(plant);
    return await _isar!.writeTxn(() async {
      return await _isar!.plantIsarModels.put(model);
    });
  }

  /// Удаление растения и связанных записей журнала
  Future<bool> deletePlant(int id) async {
    if (_useFallback || _isar == null) {
      _fallbackPlants.removeWhere((p) => p.id == id);
      _fallbackLogs.removeWhere((l) => l.plantId == id);
      _plantsStreamController.add(List.unmodifiable(_fallbackPlants));
      _notifyLogSubscribers(id);
      return true;
    }

    return await _isar!.writeTxn(() async {
      await _isar!.careLogIsarModels.filter().plantIdEqualTo(id).deleteAll();
      return await _isar!.plantIsarModels.delete(id);
    });
  }

  /// Запись процедуры ухода (ТЗ: полив, подкормка, пересадка)
  Future<void> logCareAction({
    required int plantId,
    required CareType type,
    String? notes,
    String? fertilizerName,
  }) async {
    final now = DateTime.now();

    if (_useFallback || _isar == null) {
      final index = _fallbackPlants.indexWhere((p) => p.id == plantId);
      if (index >= 0) {
        final current = _fallbackPlants[index];
        final updated = Plant(
          id: current.id,
          name: current.name,
          scientificName: current.scientificName,
          familyId: current.familyId,
          familyName: current.familyName,
          imageUrl: current.imageUrl,
          wateringFrequencyDays: current.wateringFrequencyDays,
          fertilizingFrequencyDays: current.fertilizingFrequencyDays,
          lastWateredDate: type == CareType.water ? now : current.lastWateredDate,
          lastFertilizedDate: type == CareType.fertilize ? now : current.lastFertilizedDate,
          lightRequirement: current.lightRequirement,
          humidityLevel: current.humidityLevel,
          temperatureRange: current.temperatureRange,
          notes: current.notes,
          location: current.location,
        );
        _fallbackPlants[index] = updated;
        _plantsStreamController.add(List.unmodifiable(_fallbackPlants));
      }

      final newLogId = _fallbackLogs.isEmpty ? 1 : (_fallbackLogs.map((e) => e.id).reduce((a, b) => a > b ? a : b) + 1);
      _fallbackLogs.insert(0, CareLog(
        id: newLogId,
        plantId: plantId,
        type: type,
        timestamp: now,
        notes: notes,
        fertilizerName: fertilizerName,
      ));
      _notifyLogSubscribers(plantId);
      return;
    }

    await _isar!.writeTxn(() async {
      final plant = await _isar!.plantIsarModels.get(plantId);
      if (plant == null) return;

      final log = CareLogIsarModel()
        ..plantId = plantId
        ..type = type
        ..timestamp = now
        ..notes = notes
        ..fertilizerName = fertilizerName;

      await _isar!.careLogIsarModels.put(log);

      if (type == CareType.water) {
        plant.lastWateredDate = now;
      } else if (type == CareType.fertilize) {
        plant.lastFertilizedDate = now;
      }

      plant.careLogs.add(log);
      await plant.careLogs.save();
      await _isar!.plantIsarModels.put(plant);
    });
  }

  /// Получение истории ухода для растения
  Future<List<CareLog>> getCareLogsForPlant(int plantId) async {
    if (_useFallback || _isar == null) {
      return _fallbackLogs.where((l) => l.plantId == plantId).toList();
    }

    final logs = await _isar!.careLogIsarModels
        .filter()
        .plantIdEqualTo(plantId)
        .sortByTimestampDesc()
        .findAll();

    return logs.map((l) => l.toDomain()).toList();
  }

  /// Реактивный Stream истории ухода для конкретного цветка
  Stream<List<CareLog>> watchCareLogsForPlant(int plantId) {
    if (_useFallback || _isar == null) {
      if (!_logControllers.containsKey(plantId) || _logControllers[plantId]!.isClosed) {
        _logControllers[plantId] = StreamController<List<CareLog>>.broadcast();
      }
      scheduleMicrotask(() => _notifyLogSubscribers(plantId));
      return _logControllers[plantId]!.stream;
    }

    return _isar!.careLogIsarModels
        .filter()
        .plantIdEqualTo(plantId)
        .sortByTimestampDesc()
        .watch(fireImmediately: true)
        .map((logs) => logs.map((l) => l.toDomain()).toList());
  }

  void _notifyLogSubscribers(int plantId) {
    if (_logControllers.containsKey(plantId) && !_logControllers[plantId]!.isClosed) {
      final logs = _fallbackLogs.where((l) => l.plantId == plantId).toList();
      _logControllers[plantId]!.add(List.unmodifiable(logs));
    }
  }

  /// Закрытие базы
  Future<void> close() async {
    await _isar?.close();
    await _plantsStreamController.close();
    for (final c in _logControllers.values) {
      await c.close();
    }
  }
}
