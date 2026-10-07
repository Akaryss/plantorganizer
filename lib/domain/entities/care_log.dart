// lib/domain/entities/care_log.dart
import '../../core/enums/care_type.dart';

/// Иммутабельная сущность записи журнала ухода (Clean Architecture)
class CareLog {
  final int id;
  final int plantId;
  final CareType type;
  final DateTime timestamp;
  final String? notes;
  final String? fertilizerName;

  const CareLog({
    required this.id,
    required this.plantId,
    required this.type,
    required this.timestamp,
    this.notes,
    this.fertilizerName,
  });

  CareLog copyWith({
    int? id,
    int? plantId,
    CareType? type,
    DateTime? timestamp,
    String? notes,
    String? fertilizerName,
  }) {
    return CareLog(
      id: id ?? this.id,
      plantId: plantId ?? this.plantId,
      type: type ?? this.type,
      timestamp: timestamp ?? this.timestamp,
      notes: notes ?? this.notes,
      fertilizerName: fertilizerName ?? this.fertilizerName,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'plantId': plantId,
      'type': type.name,
      'timestamp': timestamp.toIso8601String(),
      'notes': notes,
      'fertilizerName': fertilizerName,
    };
  }

  factory CareLog.fromJson(Map<String, dynamic> json) {
    CareType parseType(dynamic val) {
      if (val is CareType) return val;
      final str = val?.toString().toLowerCase() ?? '';
      if (str.contains('fertiliz')) return CareType.fertilize;
      if (str.contains('repot')) return CareType.repot;
      if (str.contains('mist')) return CareType.mist;
      return CareType.water;
    }

    return CareLog(
      id: json['id'] is int ? json['id'] as int : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      plantId: json['plantId'] is int
          ? json['plantId'] as int
          : int.tryParse(json['plantId']?.toString() ?? '0') ?? 0,
      type: parseType(json['type']),
      timestamp: json['timestamp'] != null
          ? DateTime.tryParse(json['timestamp'] as String) ?? DateTime.now()
          : DateTime.now(),
      notes: json['notes'] as String?,
      fertilizerName: json['fertilizerName'] as String?,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is CareLog && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;
}
