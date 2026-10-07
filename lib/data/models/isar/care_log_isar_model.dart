// lib/data/models/isar/care_log_isar_model.dart
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
