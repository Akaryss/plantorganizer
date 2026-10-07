// lib/presentation/screens/calendar_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../cubits/plant_list/plant_list_cubit.dart';
import '../cubits/plant_list/plant_list_state.dart';
import '../../domain/entities/plant.dart';

/// Интерактивный календарь процедур по ТЗ ЛР №1
class CalendarScreen extends StatefulWidget {
  const CalendarScreen({super.key});

  @override
  State<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends State<CalendarScreen> {
  DateTime _selectedDate = DateTime.now();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final monthFormat = DateFormat('LLLL yyyy', 'ru');
    final dayFormat = DateFormat('dd.MM');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Календарь ухода 📅', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: BlocBuilder<PlantListCubit, PlantListState>(
        builder: (context, state) {
          final plants = state.allPlants;

          // Растения, запланированные на выбранный день
          final selectedDayStart = DateTime(_selectedDate.year, _selectedDate.month, _selectedDate.day);
          final plantsForDay = plants.where((p) {
            final next = p.nextWateringDate;
            final nextDay = DateTime(next.year, next.month, next.day);
            return nextDay.isAtSameMomentAs(selectedDayStart);
          }).toList();

          return Column(
            children: [
              // Выбор дней на ближайшие 2 недели
              Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                color: theme.colorScheme.surfaceVariant.withOpacity(0.3),
                child: Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            monthFormat.format(_selectedDate).toUpperCase(),
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                          Text(
                            'Выбран день: ${dayFormat.format(_selectedDate)}',
                            style: theme.textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 10),

                    // Горизонтальная лента дней
                    SizedBox(
                      height: 74,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        itemCount: 14,
                        itemBuilder: (context, index) {
                          final date = DateTime.now().add(Duration(days: index - 2));
                          final isSelected = date.year == _selectedDate.year &&
                              date.month == _selectedDate.month &&
                              date.day == _selectedDate.day;

                          // Количество поливов в этот день
                          final count = plants.where((p) {
                            final next = p.nextWateringDate;
                            return next.year == date.year &&
                                next.month == date.month &&
                                next.day == date.day;
                          }).length;

                          return Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            child: ChoiceChip(
                              selected: isSelected,
                              showCheckmark: false,
                              label: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    DateFormat('E', 'ru').format(date).toUpperCase(),
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      color: isSelected ? Colors.white : Colors.grey,
                                    ),
                                  ),
                                  Text(
                                    '${date.day}',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: isSelected ? Colors.white : null,
                                    ),
                                  ),
                                  if (count > 0)
                                    Container(
                                      width: 6,
                                      height: 6,
                                      margin: const EdgeInsets.only(top: 2),
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        color: isSelected ? Colors.white : const Color(0xFF059669),
                                      ),
                                    ),
                                ],
                              ),
                              onSelected: (_) {
                                setState(() => _selectedDate = date);
                              },
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),

              // Список процедур на выбранную дату
              Expanded(
                child: plantsForDay.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Text('☕', style: TextStyle(fontSize: 48)),
                            const SizedBox(height: 12),
                            Text(
                              'На этот день процедур не запланировано',
                              style: theme.textTheme.titleMedium,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Все подопечные политы и в порядке!',
                              style: theme.textTheme.bodySmall,
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        itemCount: plantsForDay.length,
                        itemBuilder: (context, index) {
                          final plant = plantsForDay[index];
                          return Card(
                            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                            child: ListTile(
                              leading: ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: Image.network(
                                  plant.imageUrl,
                                  width: 48,
                                  height: 48,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) => const Text('🌿'),
                                ),
                              ),
                              title: Text(plant.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                              subtitle: Text('Полив каждые ${plant.wateringFrequencyDays} дн.'),
                              trailing: IconButton.filledTonal(
                                icon: const Icon(Icons.water_drop),
                                tooltip: 'Полить',
                                onPressed: () {
                                  context.read<PlantListCubit>().waterPlant(plant.id);
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text('💧 Полив растения «${plant.name}» зафиксирован!')),
                                  );
                                },
                              ),
                            ),
                          );
                        },
                      ),
              ),
            ],
          );
        },
      ),
    );
  }
}
