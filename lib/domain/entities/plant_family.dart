// lib/domain/entities/plant_family.dart

/// Доменная сущность семейства растений (Справочник Realm по ТЗ ЛР №3)
class PlantFamily {
  final String id;
  final String name;
  final String latinName;
  final String description;
  final String icon;
  final int defaultWateringDays;
  final int defaultHumidity;

  const PlantFamily({
    required this.id,
    required this.name,
    required this.latinName,
    required this.description,
    required this.icon,
    required this.defaultWateringDays,
    required this.defaultHumidity,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'latinName': latinName,
        'description': description,
        'icon': icon,
        'defaultWateringDays': defaultWateringDays,
        'defaultHumidity': defaultHumidity,
      };

  factory PlantFamily.fromJson(Map<String, dynamic> json) => PlantFamily(
        id: json['id'] as String? ?? '',
        name: json['name'] as String? ?? '',
        latinName: json['latinName'] as String? ?? '',
        description: json['description'] as String? ?? '',
        icon: json['icon'] as String? ?? '🌿',
        defaultWateringDays: json['defaultWateringDays'] as int? ?? 7,
        defaultHumidity: json['defaultHumidity'] as int? ?? 60,
      );

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is PlantFamily && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;
}
