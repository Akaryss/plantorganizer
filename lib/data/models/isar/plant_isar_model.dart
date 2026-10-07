// lib/data/models/isar/plant_isar_model.dart
import 'package:isar/isar.dart';
import '../../../domain/entities/plant.dart';
import 'care_log_isar_model.dart';

part 'plant_isar_model.g.dart';

/// Isar-коллекция комнатных растений (Таблица plants в NoSQL Isar DB)
/// Вариант 7: Мобильный органайзер домашних растений
@collection
class PlantIsarModel {
  Id id = Isar.autoIncrement;

  /// Индекс для быстрого поиска и фильтрации по имени
  @Index(type: IndexType.value, caseSensitive: false)
  late String name;

  @Index(type: IndexType.value, caseSensitive: false)
  late String scientificName;

  /// Ссылка на справочник семейств в Realm
  @Index()
  late String familyId;

  late String familyName;

  late String imageUrl;

  late int wateringFrequencyDays;

  late int fertilizingFrequencyDays;

  @Index()
  late DateTime lastWateredDate;

  DateTime? lastFertilizedDate;

  late String lightRequirement;

  late int humidityLevel;

  late String temperatureRange;

  String? notes;

  /// Реляционная связь со списком записей ухода (1 ко многим)
  final careLogs = IsarLinks<CareLogIsarModel>();

  PlantIsarModel();

  /// Конвертация из доменной Freezed сущности в модель Isar
  factory PlantIsarModel.fromDomain(Plant domain) {
    final model = PlantIsarModel()
      ..name = domain.name
      ..scientificName = domain.scientificName
      ..familyId = domain.familyId
      ..familyName = domain.familyName
      ..imageUrl = domain.imageUrl
      ..wateringFrequencyDays = domain.wateringFrequencyDays
      ..fertilizingFrequencyDays = domain.fertilizingFrequencyDays
      ..lastWateredDate = domain.lastWateredDate
      ..lastFertilizedDate = domain.lastFertilizedDate
      ..lightRequirement = domain.lightRequirement
      ..humidityLevel = domain.humidityLevel
      ..temperatureRange = domain.temperatureRange
      ..notes = domain.notes;

    if (domain.id > 0) {
      model.id = domain.id;
    }
    return model;
  }

  /// Преобразование в иммутабельную доменную сущность Freezed
  Plant toDomain() {
    return Plant(
      id: id,
      name: name,
      scientificName: scientificName,
      familyId: familyId,
      familyName: familyName,
      imageUrl: imageUrl,
      wateringFrequencyDays: wateringFrequencyDays,
      fertilizingFrequencyDays: fertilizingFrequencyDays,
      lastWateredDate: lastWateredDate,
      lastFertilizedDate: lastFertilizedDate,
      lightRequirement: lightRequirement,
      humidityLevel: humidityLevel,
      temperatureRange: temperatureRange,
      notes: notes,
    );
  }

  /// Дата следующего планового полива
  @ignore
  DateTime get nextWateringDate =>
      lastWateredDate.add(Duration(days: wateringFrequencyDays));

  /// Дней просрочки относительно текущего момента
  @ignore
  int get overdueDays {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final target = DateTime(
      nextWateringDate.year,
      nextWateringDate.month,
      nextWateringDate.day,
    );
    return today.difference(target).inDays;
  }

  /// Статус для динамической раскраски карточки по ТЗ
  @ignore
  PlantWateringStatus get wateringStatus {
    final diff = overdueDays;
    if (diff > 2) return PlantWateringStatus.criticalOverdue;
    if (diff > 0) return PlantWateringStatus.overdue;
    if (diff == 0) return PlantWateringStatus.dueToday;
    return PlantWateringStatus.healthy;
  }
}
