export interface CodeSnippet {
  id: string;
  title: string;
  filePath: string;
  layer: 'Config' | 'Domain' | 'Data' | 'Presentation' | 'Core' | 'Lab Answers';
  language: 'yaml' | 'dart' | 'markdown';
  description: string;
  code: string;
}

export const flutterCodeSnippets: CodeSnippet[] = [
  {
    id: 'pubspec',
    title: 'pubspec.yaml (Конфигурация зависимостей)',
    filePath: 'pubspec.yaml',
    layer: 'Config',
    language: 'yaml',
    description: 'Полный перечень зависимостей по ТЗ: flutter_bloc, Isar, Realm, Dio, Freezed, mobile_scanner, flutter_local_notifications',
    code: `name: plant_care_organizer
description: "Мобильный органайзер домашних растений (Вариант 7) - Flutter, Cubit, Isar, Realm, Dio, Freezed"
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.2.0 <4.0.0'
  flutter: ">=3.16.0"

dependencies:
  flutter:
    sdk: flutter

  # Стейт-менеджмент (Cubit / BLoC)
  flutter_bloc: ^8.1.3

  # Основная БД: Isar (Реляционная NoSQL со связями)
  isar: ^3.1.0+1
  isar_flutter_libs: ^3.1.0+1
  path_provider: ^2.1.2

  # Вспомогательное хранилище: Realm SDK (Статические справочники)
  realm: ^2.0.0

  # Сетевой слой REST API
  dio: ^5.4.1

  # Сериализация и иммутабельность
  freezed_annotation: ^2.4.1
  json_annotation: ^4.8.1

  # Аппаратные модули и системные сервисы
  mobile_scanner: ^5.0.1
  flutter_local_notifications: ^17.0.0
  timezone: ^0.9.2

  # Утилиты UI
  intl: ^0.19.0
  table_calendar: ^3.1.0
  cached_network_image: ^3.3.1
  flutter_svg: ^2.0.10+1

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.1

  # Кодогенерация (freezed, json_serializable, isar_generator)
  build_runner: ^2.4.8
  freezed: ^2.4.7
  json_serializable: ^6.7.1
  isar_generator: ^3.1.0+1

flutter:
  uses-material-design: true
  assets:
    - assets/icons/
    - assets/images/
    - assets/mock_barcodes/
`,
  },
  {
    id: 'freezed_plant',
    title: 'Freezed Entity: Растение (Plant)',
    filePath: 'lib/domain/entities/plant.dart',
    layer: 'Domain',
    language: 'dart',
    description: 'Иммутабельная доменная сущность Plant на Freezed с динамическим расчетом просрочки полива (ТЗ ЛР №1)',
    code: `// lib/domain/entities/plant.dart
import 'package:freezed_annotation/freezed_annotation.dart';
import '../../core/enums/care_type.dart';

part 'plant.freezed.dart';
part 'plant.g.dart';

/// Статус состояния полива растения (для динамической индикации карточки по ТЗ)
enum PlantWateringStatus {
  healthy,         // В норме (зеленый фон карточки)
  dueToday,        // Полить сегодня (янтарный/желтый фон)
  overdue,         // Просрочка 1-2 дня (красноватый фон)
  criticalOverdue, // Критическая просрочка >2 дней (насыщенный красный с пульсацией)
}

/// Доменная иммутабельная сущность растения на Freezed
@freezed
class Plant with _$Plant {
  const Plant._();

  const factory Plant({
    required int id,
    required String name,
    required String scientificName,
    required String familyId, // Идентификатор семейства из справочника Realm
    required String familyName,
    required String imageUrl,
    required int wateringFrequencyDays,
    required int fertilizingFrequencyDays,
    required DateTime lastWateredDate,
    DateTime? lastFertilizedDate,
    required String lightRequirement,
    required int humidityLevel,
    required String temperatureRange,
    String? notes,
  }) = _Plant;

  factory Plant.fromJson(Map<String, dynamic> json) => _$PlantFromJson(json);

  /// Дата следующего планового полива
  DateTime get nextWateringDate =>
      lastWateredDate.add(Duration(days: wateringFrequencyDays));

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
}
`,
  },
  {
    id: 'freezed_care_log',
    title: 'Freezed Entity: Журнал ухода (CareLog)',
    filePath: 'lib/domain/entities/care_log.dart',
    layer: 'Domain',
    language: 'dart',
    description: 'Иммутабельная сущность записи журнала ухода (полив, подкормка, пересадка) на Freezed',
    code: `// lib/domain/entities/care_log.dart
import 'package:freezed_annotation/freezed_annotation.dart';
import '../../core/enums/care_type.dart';

part 'care_log.freezed.dart';
part 'care_log.g.dart';

/// Иммутабельная сущность записи журнала ухода (Freezed)
@freezed
class CareLog with _$CareLog {
  const factory CareLog({
    required int id,
    required int plantId,
    required CareType type,
    required DateTime timestamp,
    String? notes,
    String? fertilizerName,
  }) = _CareLog;

  factory CareLog.fromJson(Map<String, dynamic> json) => _$CareLogFromJson(json);
}
`,
  },
  {
    id: 'isar_plant',
    title: 'Isar Схема: PlantIsarModel (@collection & IsarLinks)',
    filePath: 'lib/data/models/isar/plant_isar_model.dart',
    layer: 'Data',
    language: 'dart',
    description: 'Схема таблицы растений в NoSQL Isar DB со связями IsarLinks<CareLogIsarModel> и мапперами toDomain/fromDomain',
    code: `// lib/data/models/isar/plant_isar_model.dart
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
`,
  },
  {
    id: 'isar_care_log',
    title: 'Isar Схема: CareLogIsarModel (@collection & @Backlink)',
    filePath: 'lib/data/models/isar/care_log_isar_model.dart',
    layer: 'Data',
    language: 'dart',
    description: 'Схема журнала ухода в Isar со связью @Backlink(to: "careLogs") к PlantIsarModel',
    code: `// lib/data/models/isar/care_log_isar_model.dart
import 'package:isar/isar.dart';
import '../../../core/enums/care_type.dart';
import '../../../domain/entities/care_log.dart';
import 'plant_isar_model.dart';

part 'care_log_isar_model.g.dart';

/// Isar-коллекция записей журнала ухода (Таблица care_logs в NoSQL Isar DB)
@collection
class CareLogIsarModel {
  Id id = Isar.autoIncrement;

  @Index()
  late int plantId;

  /// Хранение типа ухода (water, fertilize, repot, mist)
  @enumerated
  late CareType type;

  @Index()
  late DateTime timestamp;

  String? notes;

  String? fertilizerName;

  /// Обратная связь к сущности растения (1 ко многим)
  @Backlink(to: 'careLogs')
  final plant = IsarLink<PlantIsarModel>();

  CareLogIsarModel();

  /// Фабричный конструктор создания из доменной сущности Freezed
  factory CareLogIsarModel.fromDomain(CareLog domain) {
    final model = CareLogIsarModel()
      ..plantId = domain.plantId
      ..type = domain.type
      ..timestamp = domain.timestamp
      ..notes = domain.notes
      ..fertilizerName = domain.fertilizerName;
    
    if (domain.id > 0) {
      model.id = domain.id;
    }
    return model;
  }

  /// Преобразование в чистую доменную сущность Freezed
  CareLog toDomain() {
    return CareLog(
      id: id,
      plantId: plantId,
      type: type,
      timestamp: timestamp,
      notes: notes,
      fertilizerName: fertilizerName,
    );
  }
}
`,
  },
  {
    id: 'isar_service',
    title: 'Isar Database Service (CRUD & Streams)',
    filePath: 'lib/data/datasources/local/isar_database_service.dart',
    layer: 'Data',
    language: 'dart',
    description: 'Сервис локальной базы данных Isar: инициализация схем, реактивные Streams (watchAll) для Cubit и транзакции writeTxn',
    code: `// lib/data/datasources/local/isar_database_service.dart
import 'package:isar/isar.dart';
import 'package:path_provider/path_provider.dart';
import '../../../core/enums/care_type.dart';
import '../../../domain/entities/plant.dart';
import '../../../domain/entities/care_log.dart';
import '../../models/isar/plant_isar_model.dart';
import '../../models/isar/care_log_isar_model.dart';

/// Локальный источник данных на базе Isar (Data-слой Clean Architecture)
class IsarDatabaseService {
  Isar? _isar;

  Isar get isar {
    if (_isar == null) {
      throw StateError('Isar database is not initialized. Call init() first.');
    }
    return _isar!;
  }

  /// Инициализация БД Isar со схемами коллекций
  Future<void> init({bool isInMemory = false}) async {
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
  }

  /// Реактивный Stream для подписки в PlantListCubit (ТЗ ЛР: отслеживание изменений)
  Stream<List<Plant>> watchAllPlants() {
    return isar.plantIsarModels
        .where()
        .watch(fireImmediately: true)
        .map((models) => models.map((m) => m.toDomain()).toList());
  }

  /// Сохранение или обновление растения
  Future<int> savePlant(Plant plant) async {
    final model = PlantIsarModel.fromDomain(plant);
    return await isar.writeTxn(() async {
      return await isar.plantIsarModels.put(model);
    });
  }

  /// Запись процедуры ухода (ТЗ: полив, подкормка, пересадка)
  Future<void> logCareAction({
    required int plantId,
    required CareType type,
    String? notes,
    String? fertilizerName,
  }) async {
    await isar.writeTxn(() async {
      final plant = await isar.plantIsarModels.get(plantId);
      if (plant == null) return;

      final now = DateTime.now();

      final log = CareLogIsarModel()
        ..plantId = plantId
        ..type = type
        ..timestamp = now
        ..notes = notes
        ..fertilizerName = fertilizerName;

      await isar.careLogIsarModels.put(log);

      if (type == CareType.water) {
        plant.lastWateredDate = now;
      } else if (type == CareType.fertilize) {
        plant.lastFertilizedDate = now;
      }

      plant.careLogs.add(log);
      await plant.careLogs.save();
      await isar.plantIsarModels.put(plant);
    });
  }
}
`,
  },
  {
    id: 'realm_schema',
    title: 'Справочники в Realm SDK (Семейства и Удобрения)',
    filePath: 'lib/data/models/realm/realm_schemas.dart',
    layer: 'Data',
    language: 'dart',
    description: 'Статический справочник по семействам растений и типам удобрений согласно ТЗ (Вариант 7: Вспомогательное хранилище Realm)',
    code: `// lib/data/models/realm/realm_schemas.dart
import 'package:realm/realm.dart';

part 'realm_schemas.realm.dart';

/// Статический справочник семейств растений в Realm
@RealmModel()
class _PlantFamilyRealm {
  @PrimaryKey()
  late String id;

  late String name;
  late String nameLatin;
  late String iconName;
  late String description;
}

/// Статический справочник типов удобрений в Realm
@RealmModel()
class _FertilizerRealm {
  @PrimaryKey()
  late String id;

  late String name;
  late String composition;
  late String iconName;
  late String recommendedSeason;
  late String targetPlants;
}
`,
  },
  {
    id: 'freezed_dto',
    title: 'Freezed DTO для ответа Perenual REST API',
    filePath: 'lib/data/models/api/perenual_plant_dto.dart',
    layer: 'Data',
    language: 'dart',
    description: 'Иммутабельная модель данных с кодогенерацией через freezed + json_serializable',
    code: `// lib/data/models/api/perenual_plant_dto.dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'perenual_plant_dto.freezed.dart';
part 'perenual_plant_dto.g.dart';

@freezed
class PerenualPlantDto with _$PerenualPlantDto {
  const factory PerenualPlantDto({
    required int id,
    @JsonKey(name: 'common_name') required String commonName,
    @JsonKey(name: 'scientific_name') required List<String> scientificName,
    @Default('') String cycle,
    @Default('Average') String watering,
    @JsonKey(name: 'sunlight') @Default([]) List<String> sunlight,
    @JsonKey(name: 'default_image') PerenualImageDto? defaultImage,
  }) = _PerenualPlantDto;

  factory PerenualPlantDto.fromJson(Map<String, dynamic> json) =>
      _$PerenualPlantDtoFromJson(json);
}

@freezed
class PerenualImageDto with _$PerenualImageDto {
  const factory PerenualImageDto({
    @JsonKey(name: 'medium_url') String? mediumUrl,
    @JsonKey(name: 'thumbnail') String? thumbnail,
  }) = _PerenualImageDto;

  factory PerenualImageDto.fromJson(Map<String, dynamic> json) =>
      _$PerenualImageDtoFromJson(json);
}
`,
  },
  {
    id: 'dio_service',
    title: 'Сетевой клиент Dio (Perenual API)',
    filePath: 'lib/data/datasources/remote/perenual_api_service.dart',
    layer: 'Data',
    language: 'dart',
    description: 'Асинхронный сетевой слой на базе Dio с интерцепторами, таймаутами и обработкой ошибок',
    code: `// lib/data/datasources/remote/perenual_api_service.dart
import 'package:dio/dio.dart';
import '../../models/api/perenual_plant_dto.dart';

class PerenualApiService {
  final Dio _dio;
  static const String _baseUrl = 'https://perenual.com/api';
  static const String _apiKey = 'sk-mock-demo-key-variant7'; // Либо реальный ключ с perenual.com

  PerenualApiService({Dio? dio})
      : _dio = dio ??
            Dio(
              BaseOptions(
                baseUrl: _baseUrl,
                connectTimeout: const Duration(seconds: 10),
                receiveTimeout: const Duration(seconds: 10),
                headers: {'Accept': 'application/json'},
              ),
            ) {
    _dio.interceptors.add(
      LogInterceptor(requestBody: true, responseBody: true),
    );
  }

  /// Поиск регламента по отсканированному текстовому наименованию
  Future<List<PerenualPlantDto>> searchPlantByName(String query) async {
    try {
      final response = await _dio.get(
        '/species-list',
        queryParameters: {
          'key': _apiKey,
          'q': query,
        },
      );

      if (response.statusCode == 200 && response.data != null) {
        final List data = response.data['data'] ?? [];
        return data
            .map((item) => PerenualPlantDto.fromJson(item as Map<String, dynamic>))
            .toList();
      }
      return [];
    } on DioException catch (e) {
      // Обработка оффлайн-режима / сетевых ошибок
      throw Exception('Ошибка загрузки данных из Perenual API: \${e.message}');
    }
  }
}
`,
  },
  {
    id: 'notification_service',
    title: 'Сервис локальных напоминаний (flutter_local_notifications)',
    filePath: 'lib/core/services/notification_service.dart',
    layer: 'Core',
    language: 'dart',
    description: 'Генерация цепочки локальных уведомлений о поливе с расчетом триггеров по времени',
    code: `// lib/core/services/notification_service.dart
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest.dart' as tz_data;

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _notificationsPlugin =
      FlutterLocalNotificationsPlugin();

  Future<void> init() async {
    tz_data.initializeTimeZones();

    const AndroidInitializationSettings androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    const DarwinInitializationSettings iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const InitializationSettings initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _notificationsPlugin.initialize(initSettings);
  }

  /// Планирование цепочки напоминаний для полива растения
  Future<void> scheduleWateringChain({
    required int plantId,
    required String plantName,
    required DateTime nextWateringDate,
    required int intervalDays,
  }) async {
    // 1. Уведомление в день полива в 09:00 утра
    final scheduledMorning = DateTime(
      nextWateringDate.year,
      nextWateringDate.month,
      nextWateringDate.day,
      9,
      0,
    );

    if (scheduledMorning.isAfter(DateTime.now())) {
      await _notificationsPlugin.zonedSchedule(
        plantId * 10 + 1,
        '💧 Пора полить $plantName',
        'Сегодня наступил день полива. Проверьте влажность почвы.',
        tz.TZDateTime.from(scheduledMorning, tz.local),
        const NotificationDetails(
          android: AndroidNotificationDetails(
            'plant_watering_channel',
            'Напоминания о поливе',
            importance: Importance.high,
            priority: Priority.high,
          ),
          iOS: DarwinNotificationDetails(sound: 'water_drop.aiff'),
        ),
        androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
        uiLocalNotificationDateInterpretation:
            UILocalNotificationDateInterpretation.absoluteTime,
      );
    }

    // 2. Тревожное напоминание при просрочке (+2 дня)
    final overdueReminder = scheduledMorning.add(const Duration(days: 2));
    if (overdueReminder.isAfter(DateTime.now())) {
      await _notificationsPlugin.zonedSchedule(
        plantId * 10 + 2,
        '⚠️ Просрочен полив: $plantName',
        'Растение ждет полива уже 2 дня! Не допускайте пересыхания корней.',
        tz.TZDateTime.from(overdueReminder, tz.local),
        const NotificationDetails(
          android: AndroidNotificationDetails(
            'plant_watering_urgent',
            'Критичные напоминания',
            importance: Importance.max,
            priority: Priority.high,
          ),
          iOS: DarwinNotificationDetails(),
        ),
        androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
        uiLocalNotificationDateInterpretation:
            UILocalNotificationDateInterpretation.absoluteTime,
      );
    }
  }

  /// Отмена всех уведомлений при удалении растения или перерасчете
  Future<void> cancelPlantNotifications(int plantId) async {
    await _notificationsPlugin.cancel(plantId * 10 + 1);
    await _notificationsPlugin.cancel(plantId * 10 + 2);
  }
}
`,
  },
  {
    id: 'cubit_plant_list',
    title: 'PlantListCubit (Управление состоянием списка и полива)',
    filePath: 'lib/presentation/cubits/plant_list/plant_list_cubit.dart',
    layer: 'Presentation',
    language: 'dart',
    description: 'Cubit с реактивной связью с Isar Watchers (Streams) и мгновенным обновлением статуса полива',
    code: `// lib/presentation/cubits/plant_list/plant_list_cubit.dart
import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../data/models/isar/plant_entity.dart';
import '../../../data/models/isar/care_log_entity.dart';
import '../../../data/datasources/local/isar_database.dart';
import '../../../core/services/notification_service.dart';
import 'plant_list_state.dart';

class PlantListCubit extends Cubit<PlantListState> {
  final IsarDatabase _db;
  final NotificationService _notificationService;
  StreamSubscription? _plantSubscription;

  PlantListCubit({
    required IsarDatabase db,
    required NotificationService notificationService,
  })  : _db = db,
        _notificationService = notificationService,
        super(const PlantListState.initial()) {
    _subscribeToPlants();
  }

  /// Подписка на реактивный Stream изменений в Isar DB
  void _subscribeToPlants() {
    emit(const PlantListState.loading());
    _plantSubscription = _db.watchAllPlants().listen(
      (plants) {
        emit(PlantListState.loaded(plants: plants));
      },
      onError: (error) {
        emit(PlantListState.error(message: error.toString()));
      },
    );
  }

  /// Быстрое действие: полить растение прямо с карточки
  Future<void> waterPlant(int plantId, {String? note}) async {
    try {
      final plant = await _db.getPlantById(plantId);
      if (plant == null) return;

      final now = DateTime.now();
      plant.lastWateredDate = now;

      // Создаем запись в журнале ухода
      final log = CareLogEntity()
        ..plantId = plant.id
        ..careType = 'water'
        ..timestamp = now
        ..notes = note ?? 'Быстрый полив с главного экрана';

      await _db.savePlantAndLog(plant, log);

      // Пересчитываем цепочку уведомлений
      await _notificationService.scheduleWateringChain(
        plantId: plant.id,
        plantName: plant.name,
        nextWateringDate: plant.nextWateringDate,
        intervalDays: plant.wateringFrequencyDays,
      );
    } catch (e) {
      emit(PlantListState.error(message: 'Ошибка сохранения: \$e'));
    }
  }

  @override
  Future<void> close() {
    _plantSubscription?.cancel();
    return super.close();
  }
}
`,
  },
  {
    id: 'lab_answers',
    title: 'Шпаргалка к защите (Ответы на вопросы из методички)',
    filePath: 'LAB_EXAM_PREP.md',
    layer: 'Lab Answers',
    language: 'markdown',
    description: 'Готовые ответы на контрольные вопросы ЛР 1-4 с проекцией на Flutter, Cubit, Isar, Realm и Streams',
    code: `### Контрольные вопросы и ответы (Лабораторные работы №1 - №4)

#### ЛР №1: Пользовательский интерфейс и Декларативный подход
1. **Разница между императивным и декларативным UI (UIKit/Android vs Flutter/SwiftUI):**
   - В императивном подходе разработчик вручную манипулирует деревом view (создает \`button.text = "..."\`, скрывает, анимирует).
   - В декларативном (Flutter/SwiftUI) интерфейс является чистой функцией от состояния: \`UI = f(State)\`. При смене State фреймворк вычисляет diff виртуального дерева и перерисовывает только изменившиеся виджеты.
2. **Контейнеры компоновки (VStack, HStack, ZStack в Flutter):**
   - \`VStack\` -> \`Column\` (вертикальное выравнивание).
   - \`HStack\` -> \`Row\` (горизонтальное выравнивание).
   - \`ZStack\` -> \`Stack\` (наложение слоев по оси Z).
3. **Что такое SafeArea:**
   - Область экрана, свободная от аппаратных вырезов (Dynamic Island, челка, закругления экрана, системная панель жестов Home Indicator). Предотвращает перекрытие контента.

#### ЛР №2: Архитектура MVVM и BLoC/Cubit
1. **Почему Cubit вместо стандартного Bloc?**
   - \`Cubit\` — это легковесный подвид BLoC без явных событий (Events). Вместо диспетчеризации событий (\`add(Event)\`) вызываются простые методы (\`cubit.waterPlant()\`), а наружу эмитятся состояния (\`emit(State)\`). Это сокращает бойлерплейт-код на 50%.
2. **Как работает реактивность через Streams?**
   - \`Stream\` — это асинхронный поток данных. В нашем приложении Isar генерирует реактивный \`Stream<List<PlantEntity>>\`. При вызове \`isar.writeTxn()\` БД автоматически пушит свежую выборку подписчикам через Stream, а \`BlocBuilder\` мгновенно обновляет виджеты без ручного вызова setState!

#### ЛР №3: Хранение данных (Isar vs Realm vs SQLite)
1. **Почему Isar для основной БД и Realm для справочников?**
   - **Isar** — ультрабыстрая NoSQL база данных, написанная на Rust, оптимизированная специально под Flutter. Поддерживает строгую типизацию, композитные индексы и реляционные связи (\`IsarLinks\`, \`@Backlink\`).
   - **Realm** — объектная БД, идеально подходящая для статических read-only справочников (семейства растений, типы удобрений) благодаря неизменяемым объектам и высокой скорости чтения из предварительно запакованного realm-файла.
2. **Как работают связи 1-ко-многим в Isar?**
   - Через поле \`final careLogs = IsarLinks<CareLogEntity>();\`. Связь лениво подгружается (\`await plant.careLogs.load()\`), что экономит оперативную память при выводе сотен карточек.

#### ЛР №4: Сетевой слой (Dio, REST API, Combine vs Streams)
1. **Роль Dio в сравнении с http:**
   - Dio поддерживает Interceptors (логирование, добавление токенов, повтор запросов при сбое), таймауты соединения, автоматическую сериализацию JSON и отмену запросов через CancelToken.
2. **Как работает сканирование и цепочка уведомлений?**
   - Камера с \`mobile_scanner\` захватывает текст с этикетки (например, "Monstera").
   - Cubit отправляет асинхронный запрос в Perenual API через Dio.
   - Ответ маппится через Freezed DTO и преобразуется в \`PlantEntity\` Isar.
   - \`NotificationService\` регистрирует серию отложенных локальных алертов (в день полива и через 2 дня при просрочке).
`,
  },
];
