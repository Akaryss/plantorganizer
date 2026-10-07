// lib/data/models/api/perenual_plant_dto.dart

/// DTO модели ответа ботанического REST API (ЛР №4)
class PerenualPlantDto {
  final int id;
  final String commonName;
  final List<String> scientificName;
  final String cycle;
  final String watering;
  final List<String> sunlight;
  final String? imageUrl;
  final String? family;

  const PerenualPlantDto({
    required this.id,
    required this.commonName,
    required this.scientificName,
    this.cycle = 'Perennial',
    this.watering = 'Average',
    this.sunlight = const [],
    this.imageUrl,
    this.family,
  });

  factory PerenualPlantDto.fromJson(Map<String, dynamic> json) {
    List<String> parseStringList(dynamic val) {
      if (val is List) return val.map((e) => e.toString()).toList();
      if (val is String && val.isNotEmpty) return [val];
      return [];
    }

    String? parseImage(dynamic img) {
      if (img is Map) {
        return (img['medium_url'] ?? img['regular_url'] ?? img['thumbnail'] ?? img['original_url'])?.toString();
      }
      if (img is String && img.startsWith('http')) return img;
      return null;
    }

    return PerenualPlantDto(
      id: json['id'] is int ? json['id'] as int : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      commonName: json['common_name']?.toString() ?? json['name']?.toString() ?? '',
      scientificName: parseStringList(json['scientific_name'] ?? json['scientificName']),
      cycle: json['cycle']?.toString() ?? 'Perennial',
      watering: json['watering']?.toString() ?? 'Average',
      sunlight: parseStringList(json['sunlight']),
      imageUrl: parseImage(json['default_image'] ?? json['imageUrl']),
      family: json['family']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'common_name': commonName,
        'scientific_name': scientificName,
        'cycle': cycle,
        'watering': watering,
        'sunlight': sunlight,
        'imageUrl': imageUrl,
        'family': family,
      };

  /// Конвертация частоты полива по классификации API в количество дней
  int get wateringFrequencyDays {
    final w = watering.toLowerCase();
    if (w.contains('frequent')) return 4;
    if (w.contains('minimum') || w.contains('dry')) return 14;
    return 7; // Average
  }
}
