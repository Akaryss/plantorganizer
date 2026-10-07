// lib/core/services/notification_service.dart
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest.dart' as tz_data;
import '../../domain/entities/notification_trigger.dart';
import '../enums/care_type.dart';

/// Сервис локальных уведомлений и расписания процедур (ЛР №4)
class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _plugin = FlutterLocalNotificationsPlugin();
  bool _isInitialized = false;

  // Локальный журнал активных триггеров для инспектора и UI
  final List<NotificationTrigger> _activeTriggers = [];

  List<NotificationTrigger> get activeTriggers => List.unmodifiable(_activeTriggers);

  Future<void> init() async {
    if (_isInitialized) return;
    try {
      tz_data.initializeTimeZones();

      const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
      const iosSettings = DarwinInitializationSettings(
        requestAlertPermission: true,
        requestBadgePermission: true,
        requestSoundPermission: true,
      );

      const initSettings = InitializationSettings(
        android: androidSettings,
        iOS: iosSettings,
      );

      await _plugin.initialize(initSettings);
      _isInitialized = true;
    } catch (_) {
      // Graceful fallback для веб/десктоп симулятора
      _isInitialized = true;
    }
  }

  /// Регистрация цепочки напоминаний по ТЗ Варианта 7:
  /// 1. В плановый день полива (в 09:00 утра)
  /// 2. При просрочке на 2 дня (тревожное уведомление)
  Future<void> scheduleWateringChain({
    required int plantId,
    required String plantName,
    required DateTime nextWateringDate,
    required int intervalDays,
  }) async {
    await cancelPlantNotifications(plantId);

    // 1. Плановое напоминание в день полива в 09:00
    final plannedDate = DateTime(
      nextWateringDate.year,
      nextWateringDate.month,
      nextWateringDate.day,
      9,
      0,
    );

    final trigger1 = NotificationTrigger(
      id: 'notif_${plantId}_due',
      plantId: plantId,
      plantName: plantName,
      careType: CareType.water,
      scheduledDate: plannedDate,
      title: '💧 Пора полить $plantName',
      body: 'Сегодня день планового полива. Проверьте влажность почвы.',
      isPending: true,
    );
    _activeTriggers.add(trigger1);

    // 2. Тревожное напоминание при задержке на 2 дня
    final overdueDate = plannedDate.add(const Duration(days: 2));
    final trigger2 = NotificationTrigger(
      id: 'notif_${plantId}_overdue',
      plantId: plantId,
      plantName: plantName,
      careType: CareType.water,
      scheduledDate: overdueDate,
      title: '⚠️ Просрочен полив: $plantName',
      body: 'Растение ждет полива уже 2 дня! Не допускайте пересыхания корней.',
      isPending: true,
    );
    _activeTriggers.add(trigger2);

    try {
      if (plannedDate.isAfter(DateTime.now())) {
        await _plugin.zonedSchedule(
          plantId * 10 + 1,
          trigger1.title,
          trigger1.body,
          tz.TZDateTime.from(plannedDate, tz.local),
          const NotificationDetails(
            android: AndroidNotificationDetails(
              'plant_care_channel',
              'Уход за растениями',
              channelDescription: 'Плановые напоминания о поливе и подкормках',
              importance: Importance.high,
              priority: Priority.high,
            ),
            iOS: DarwinNotificationDetails(),
          ),
          androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
          uiLocalNotificationDateInterpretation:
              UILocalNotificationDateInterpretation.absoluteTime,
        );
      }

      if (overdueDate.isAfter(DateTime.now())) {
        await _plugin.zonedSchedule(
          plantId * 10 + 2,
          trigger2.title,
          trigger2.body,
          tz.TZDateTime.from(overdueDate, tz.local),
          const NotificationDetails(
            android: AndroidNotificationDetails(
              'plant_urgent_channel',
              'Срочные напоминания',
              channelDescription: 'Предупреждения о критической засухе',
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
    } catch (_) {
      // Игнорируем в средах без нативных пуш-сервисов
    }
  }

  /// Отмена уведомлений для конкретного цветка
  Future<void> cancelPlantNotifications(int plantId) async {
    _activeTriggers.removeWhere((t) => t.plantId == plantId);
    try {
      await _plugin.cancel(plantId * 10 + 1);
      await _plugin.cancel(plantId * 10 + 2);
    } catch (_) {}
  }
}
