// lib/data/datasources/remote/perenual_api_service.dart
import 'package:dio/dio.dart';
import '../../models/api/perenual_plant_dto.dart';
import '../../../domain/entities/plant.dart';

/// Сетевой слой на базе Dio (ЛР №4: REST API, Interceptors, DTO)
class PerenualApiService {
  final Dio _dio;
  static const String _baseUrl = 'https://perenual.com/api';
  static const String _apiKey = 'sk-mock-demo-key-variant7';

  PerenualApiService({Dio? dio})
      : _dio = dio ??
            Dio(
              BaseOptions(
                baseUrl: _baseUrl,
                connectTimeout: const Duration(seconds: 8),
                receiveTimeout: const Duration(seconds: 8),
                headers: {'Accept': 'application/json'},
              ),
            ) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          // Добавление API ключа и лог запроса
          options.queryParameters['key'] = _apiKey;
          return handler.next(options);
        },
        onError: (DioException error, handler) {
          // Логирование ошибки сетевого уровня
          return handler.next(error);
        },
      ),
    );
  }

  /// Поиск видов растений по запросу (ЛР №4)
  Future<List<PerenualPlantDto>> searchSpecies(String query) async {
    try {
      final response = await _dio.get(
        '/species-list',
        queryParameters: {'q': query},
      );

      if (response.statusCode == 200 && response.data != null) {
        final List data = response.data['data'] ?? [];
        return data
            .map((item) => PerenualPlantDto.fromJson(item as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (_) {
      // Offline fallback: при отсутствии внешнего интернета возвращает ботанические регламенты
      return _getMockSpeciesResults(query);
    }
  }

  /// Детальная карточка растения из REST API
  Future<PerenualPlantDto?> getPlantDetails(int id) async {
    try {
      final response = await _dio.get('/species/details/$id');
      if (response.statusCode == 200 && response.data != null) {
        return PerenualPlantDto.fromJson(response.data as Map<String, dynamic>);
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  /// Преобразование ответа REST API в доменную сущность Plant для сохранения в Isar
  Plant mapDtoToDomain(PerenualPlantDto dto, {String? familyId, String? familyName}) {
    final now = DateTime.now();
    return Plant(
      id: 0, // Isar автоинкремент
      name: dto.commonName.isNotEmpty ? dto.commonName : (dto.scientificName.firstOrNull ?? 'Растение'),
      scientificName: dto.scientificName.firstOrNull ?? dto.commonName,
      familyId: familyId ?? 'fam_araceae',
      familyName: familyName ?? 'Ароидные',
      imageUrl: dto.imageUrl ?? 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=800&q=80',
      wateringFrequencyDays: dto.wateringFrequencyDays,
      fertilizingFrequencyDays: 14,
      lastWateredDate: now,
      lightRequirement: dto.sunlight.contains('full sun') ? 'Прямой солнечный' : 'Яркий рассеянный',
      humidityLevel: 60,
      temperatureRange: '18-24 °C',
      notes: 'Импортировано из REST API. Режим полива: ${dto.watering}',
    );
  }

  List<PerenualPlantDto> _getMockSpeciesResults(String q) {
    final lower = q.toLowerCase();
    final allMocks = [
      const PerenualPlantDto(
        id: 1001,
        commonName: 'Монстера Деликатесная',
        scientificName: ['Monstera deliciosa Liebm.'],
        watering: 'Average',
        sunlight: ['part shade', 'bright indirect'],
        imageUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=800&q=80',
        family: 'Araceae',
      ),
      const PerenualPlantDto(
        id: 1002,
        commonName: 'Фикус Лировидный',
        scientificName: ['Ficus lyrata Warb.'],
        watering: 'Average',
        sunlight: ['bright indirect'],
        imageUrl: 'https://images.unsplash.com/photo-1597055181300-e3633a207518?auto=format&fit=crop&w=800&q=80',
        family: 'Moraceae',
      ),
      const PerenualPlantDto(
        id: 1003,
        commonName: 'Сансевиерия Трехполосная',
        scientificName: ['Dracaena trifasciata', 'Sansevieria trifasciata'],
        watering: 'Minimum',
        sunlight: ['low light', 'shade'],
        imageUrl: 'https://images.unsplash.com/photo-1599598425947-630b5e5251a3?auto=format&fit=crop&w=800&q=80',
        family: 'Asparagaceae',
      ),
    ];

    return allMocks.where((p) {
      return p.commonName.toLowerCase().contains(lower) ||
          p.scientificName.any((s) => s.toLowerCase().contains(lower));
    }).toList();
  }
}
