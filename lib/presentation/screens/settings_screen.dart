// lib/presentation/screens/settings_screen.dart
import 'package:flutter/material.dart';
import '../../core/services/notification_service.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final notifService = NotificationService();

  @override
  Widget build(BuildContext context) {
    final triggers = notifService.activeTriggers;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Настройки & Архитектура ⚙️', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Блок инспектора уведомлений (ЛР №4)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.notifications_active, color: Color(0xFF059669)),
                      const SizedBox(width: 8),
                      Text(
                        'Запланированные уведомления (${triggers.length})',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'По ТЗ ЛР №4 цепочка генерирует напоминание в день полива (09:00) и тревожное предупреждение через +2 дня при просрочке.',
                    style: TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                  const SizedBox(height: 12),
                  if (triggers.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 8),
                      child: Text('Нет активных отложенных триггеров'),
                    )
                  else
                    ...triggers.map((trig) {
                      return ListTile(
                        dense: true,
                        leading: const Icon(Icons.alarm, size: 20),
                        title: Text(trig.title),
                        subtitle: Text('${trig.body}\nВремя: ${trig.scheduledDate}'),
                      );
                    }),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Чеклист соответствия ТЗ Варианта 7
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Соответствие требованиям методички (Вариант 7):',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                  const SizedBox(height: 12),
                  _buildCheckItem('ЛР №1 (UI)', 'Список растений, карточки с динамической цветовой индикацией полива, интерактивный календарь.'),
                  _buildCheckItem('ЛР №2 (Cubit / BLoC)', 'State-management через PlantListCubit, PlantDetailCubit, ScannerCubit; Clean Architecture.'),
                  _buildCheckItem('ЛР №3 (Isar & Realm)', 'Основная реляционная БД Isar (связи 1-ко-многим через IsarLinks, стримы Watchers) + вспомогательное хранилище Realm для справочников.'),
                  _buildCheckItem('ЛР №4 (Dio REST API & Notifications)', 'Dio-клиент с интерцепторами к ботаническому API, фоновые локальные напоминания.'),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCheckItem(String title, String desc) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.check_circle, color: Colors.green, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                Text(desc, style: const TextStyle(fontSize: 12, color: Colors.grey)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
