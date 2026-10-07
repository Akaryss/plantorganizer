// lib/domain/entities/plant.dart
import '../../core/enums/care_type.dart';

/// Статус состояния полива растения (для динамической индикации карточки по ТЗ ЛР №1)
enum PlantWateringStatus {
  healthy, // В норме (зеленый фон карточки)
  dueToday, // Полить сегодня (янтарный/желтый фон)
  overdue, // Небольшая просрочка 1-2 дня (красноватый фон)
  criticalOverdue, // Критическая просрочка >2 дней (насыщенный красный с предупреждением)
}

/// Доменная иммутабельная сущность растения (Clean Architecture)
class Plant {
  final int id;
  final String name;
  final String scientificName;
  final String familyId; // Идентификатор семейства из справочника Realm
  final String familyName;
  final String imageUrl;
  final int wateringFrequencyDays;
  final int fertilizingFrequencyDays;
  final DateTime lastWateredDate;
  final DateTime? lastFertilizedDate;
  final String lightRequirement;
  final int humidityLevel;
  final String temperatureRange;
  final String? notes;
  final String? location;

  const Plant({
    required this.id,
    required this.name,
    required this.scientificName,
    required this.familyId,
    required this.familyName,
    required this.imageUrl,
    required this.wateringFrequencyDays,
    required this.fertilizingFrequencyDays,
    required this.lastWateredDate,
    this.lastFertilizedDate,
    required this.lightRequirement,
    required this.humidityLevel,
    required this.temperatureRange,
    this.notes,
    this.location,
  });

  /// Дата следующего планового полива
  DateTime get nextWateringDate =>
      lastWateredDate.add(Duration(days: wateringFrequencyDays));

  /// Дата следующей плановой подкормки
  DateTime get nextFertilizingDate {
    final baseDate = lastFertilizedDate ?? lastWateredDate;
    return baseDate.add(Duration(days: fertilizingFrequencyDays));
  }

  /// Разница в днях между текущей датой и плановой датой полива
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

  /// Вычисляемый динамический статус по ТЗ ЛР №1:
  /// Служит триггером для смены цвета карточки в Presentation слое
  PlantWateringStatus get wateringStatus {
    final diff = overdueDays;
    if (diff > 2) return PlantWateringStatus.criticalOverdue;
    if (diff > 0) return PlantWateringStatus.overdue;
    if (diff == 0) return PlantWateringStatus.dueToday;
    return PlantWateringStatus.healthy;
  }

  /// Флаг: Требуется ли полив сегодня или ранее
  bool get needsWatering => overdueDays >= 0;

  Plant copyWith({
    int? id,
    String? name,
    String? scientificName,
    String? familyId,
    String? familyName,
    String? imageUrl,
    int? wateringFrequencyDays,
    int? fertilizingFrequencyDays,
    DateTime? lastWateredDate,
    DateTime? lastFertilizedDate,
    String? lightRequirement,
    int? humidityLevel,
    String? temperatureRange,
    String? notes,
    String? location,
  }) {
    return Plant(
      id: id ?? this.id,
      name: name ?? this.name,
      scientificName: scientificName ?? this.scientificName,
      familyId: familyId ?? this.familyId,
      familyName: familyName ?? this.familyName,
      imageUrl: imageUrl ?? this.imageUrl,
      wateringFrequencyDays: wateringFrequencyDays ?? this.wateringFrequencyDays,
      fertilizingFrequencyDays: fertilizingFrequencyDays ?? this.fertilizingFrequencyDays,
      lastWateredDate: lastWateredDate ?? this.lastWateredDate,
      lastFertilizedDate: lastFertilizedDate ?? this.lastFertilizedDate,
      lightRequirement: lightRequirement ?? this.lightRequirement,
      humidityLevel: humidityLevel ?? this.humidityLevel,
      temperatureRange: temperatureRange ?? this.temperatureRange,
      notes: notes ?? this.notes,
      location: location ?? this.location,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'scientificName': scientificName,
      'familyId': familyId,
      'familyName': familyName,
      'imageUrl': imageUrl,
      'wateringFrequencyDays': wateringFrequencyDays,
      'fertilizingFrequencyDays': fertilizingFrequencyDays,
      'lastWateredDate': lastWateredDate.toIso8601String(),
      'lastFertilizedDate': lastFertilizedDate?.toIso8601String(),
      'lightRequirement': lightRequirement,
      'humidityLevel': humidityLevel,
      'temperatureRange': temperatureRange,
      'notes': notes,
      'location': location,
    };
  }

  factory Plant.fromJson(Map<String, dynamic> json) {
    return Plant(
      id: json['id'] is int ? json['id'] as int : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      name: json['name'] as String? ?? '',
      scientificName: json['scientificName'] as String? ?? '',
      familyId: json['familyId'] as String? ?? 'fam_araceae',
      familyName: json['familyName'] as String? ?? '',
      imageUrl: json['imageUrl'] as String? ?? '',
      wateringFrequencyDays: json['wateringFrequencyDays'] as int? ?? 7,
      fertilizingFrequencyDays: json['fertilizingFrequencyDays'] as int? ?? 14,
      lastWateredDate: json['lastWateredDate'] != null
          ? DateTime.tryParse(json['lastWateredDate'] as String) ?? DateTime.now()
          : DateTime.now(),
      lastFertilizedDate: json['lastFertilizedDate'] != null
          ? DateTime.tryParse(json['lastFertilizedDate'] as String)
          : null,
      lightRequirement: json['lightRequirement'] as String? ?? 'Яркий рассеянный',
      humidityLevel: json['humidityLevel'] as int? ?? 60,
      temperatureRange: json['temperatureRange'] as String? ?? '18-25 °C',
      notes: json['notes'] as String?,
      location: json['location'] as String?,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Plant && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;
}
