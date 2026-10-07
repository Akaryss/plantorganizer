// lib/domain/entities/notification_trigger.dart
import '../../core/enums/care_type.dart';

/// Сущность запланированного локального уведомления (ЛР №4)
class NotificationTrigger {
  final String id;
  final int plantId;
  final String plantName;
  final CareType careType;
  final DateTime scheduledDate;
  final String title;
  final String body;
  final bool isPending;

  const NotificationTrigger({
    required this.id,
    required this.plantId,
    required this.plantName,
    required this.careType,
    required this.scheduledDate,
    required this.title,
    required this.body,
    this.isPending = true,
  });

  NotificationTrigger copyWith({
    String? id,
    int? plantId,
    String? plantName,
    CareType? careType,
    DateTime? scheduledDate,
    String? title,
    String? body,
    bool? isPending,
  }) {
    return NotificationTrigger(
      id: id ?? this.id,
      plantId: plantId ?? this.plantId,
      plantName: plantName ?? this.plantName,
      careType: careType ?? this.careType,
      scheduledDate: scheduledDate ?? this.scheduledDate,
      title: title ?? this.title,
      body: body ?? this.body,
      isPending: isPending ?? this.isPending,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'plantId': plantId,
        'plantName': plantName,
        'careType': careType.name,
        'scheduledDate': scheduledDate.toIso8601String(),
        'title': title,
        'body': body,
        'isPending': isPending,
      };

  factory NotificationTrigger.fromJson(Map<String, dynamic> json) {
    CareType parseType(dynamic val) {
      final str = val?.toString().toLowerCase() ?? '';
      if (str.contains('fertiliz')) return CareType.fertilize;
      if (str.contains('repot')) return CareType.repot;
      if (str.contains('mist')) return CareType.mist;
      return CareType.water;
    }

    return NotificationTrigger(
      id: json['id'] as String? ?? '',
      plantId: json['plantId'] is int ? json['plantId'] as int : int.tryParse(json['plantId']?.toString() ?? '0') ?? 0,
      plantName: json['plantName'] as String? ?? '',
      careType: parseType(json['careType']),
      scheduledDate: DateTime.tryParse(json['scheduledDate']?.toString() ?? '') ?? DateTime.now(),
      title: json['title'] as String? ?? '',
      body: json['body'] as String? ?? '',
      isPending: json['isPending'] as bool? ?? true,
    );
  }
}
