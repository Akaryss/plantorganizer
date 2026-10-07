// lib/domain/entities/fertilizer.dart

/// Доменная сущность удобрения (Справочник Realm по ТЗ ЛР №3)
class Fertilizer {
  final String id;
  final String name;
  final String composition; // Состав NPK или формула
  final String season; // Сезон применения (весна-лето, осень)
  final String icon;
  final String frequencyNote;

  const Fertilizer({
    required this.id,
    required this.name,
    required this.composition,
    required this.season,
    required this.icon,
    required this.frequencyNote,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'composition': composition,
        'season': season,
        'icon': icon,
        'frequencyNote': frequencyNote,
      };

  factory Fertilizer.fromJson(Map<String, dynamic> json) => Fertilizer(
        id: json['id'] as String? ?? '',
        name: json['name'] as String? ?? '',
        composition: json['composition'] as String? ?? '',
        season: json['season'] as String? ?? '',
        icon: json['icon'] as String? ?? '🧪',
        frequencyNote: json['frequencyNote'] as String? ?? '',
      );
}
