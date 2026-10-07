// lib/presentation/screens/home_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../cubits/plant_list/plant_list_cubit.dart';
import '../cubits/plant_list/plant_list_state.dart';
import '../widgets/plant_card.dart';
import 'plant_detail_screen.dart';
import '../../data/datasources/local/realm_database_service.dart';
import '../../domain/entities/plant.dart';

class HomeScreen extends StatelessWidget {
  final VoidCallback onOpenScanner;

  const HomeScreen({super.key, required this.onOpenScanner});

  @override
  Widget build(BuildContext context) {
    final realmService = RealmDatabaseService();
    final families = realmService.getAllFamilies();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Мой сад 🌿', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            tooltip: 'Сканер этикеток',
            icon: const Icon(Icons.qr_code_scanner),
            onPressed: onOpenScanner,
          ),
        ],
      ),
      body: BlocBuilder<PlantListCubit, PlantListState>(
        builder: (context, state) {
          final cubit = context.read<PlantListCubit>();

          final totalCount = state.allPlants.length;
          final dueTodayCount = state.allPlants
              .where((p) => p.wateringStatus == PlantWateringStatus.dueToday)
              .length;
          final overdueCount = state.allPlants
              .where((p) =>
                  p.wateringStatus == PlantWateringStatus.overdue ||
                  p.wateringStatus == PlantWateringStatus.criticalOverdue)
              .length;

          return Column(
            children: [
              // 1. Сводные метрики по саду (ЛР №1)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  children: [
                    _buildMetricChip(
                      label: 'Всего',
                      count: totalCount,
                      color: Colors.blue.shade700,
                    ),
                    const SizedBox(width: 8),
                    _buildMetricChip(
                      label: 'Сегодня',
                      count: dueTodayCount,
                      color: Colors.amber.shade700,
                    ),
                    const SizedBox(width: 8),
                    _buildMetricChip(
                      label: 'Просрочено',
                      count: overdueCount,
                      color: Colors.red.shade700,
                    ),
                  ],
                ),
              ),

              // 2. Строка поиска
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                child: TextField(
                  decoration: InputDecoration(
                    hintText: 'Поиск по названию или латыни...',
                    prefixIcon: const Icon(Icons.search),
                    filled: true,
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(vertical: 10),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide.none,
                    ),
                  ),
                  onChanged: cubit.setSearchQuery,
                ),
              ),

              // 3. Фильтры статуса (Все / Полить сегодня / Просрочено)
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                child: Row(
                  children: [
                    FilterChip(
                      label: const Text('Все растения'),
                      selected: state.statusFilter == PlantFilterStatus.all,
                      onSelected: (_) => cubit.setStatusFilter(PlantFilterStatus.all),
                    ),
                    const SizedBox(width: 8),
                    FilterChip(
                      label: const Text('💧 Полить сегодня'),
                      selected: state.statusFilter == PlantFilterStatus.dueToday,
                      onSelected: (_) => cubit.setStatusFilter(PlantFilterStatus.dueToday),
                    ),
                    const SizedBox(width: 8),
                    FilterChip(
                      label: const Text('⚠️ Просроченные'),
                      selected: state.statusFilter == PlantFilterStatus.overdue,
                      onSelected: (_) => cubit.setStatusFilter(PlantFilterStatus.overdue),
                    ),
                  ],
                ),
              ),

              // 4. Фильтр семейств Realm (ЛР №3)
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
                child: Row(
                  children: [
                    ChoiceChip(
                      label: const Text('Все семейства'),
                      selected: state.selectedFamilyId == 'all',
                      onSelected: (_) => cubit.setFamilyFilter('all'),
                    ),
                    ...families.map((fam) {
                      return Padding(
                        padding: const EdgeInsets.only(left: 6),
                        child: ChoiceChip(
                          avatar: Text(fam.icon),
                          label: Text(fam.name),
                          selected: state.selectedFamilyId == fam.id,
                          onSelected: (_) => cubit.setFamilyFilter(fam.id),
                        ),
                      );
                    }),
                  ],
                ),
              ),
              const Divider(height: 12),

              // 5. Реактивный список карточек растений
              Expanded(
                child: state.isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : state.filteredPlants.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Text('🌱', style: TextStyle(fontSize: 48)),
                                const SizedBox(height: 12),
                                Text(
                                  state.searchQuery.isNotEmpty
                                      ? 'Ничего не найдено по запросу'
                                      : 'В вашем саду пока нет растений',
                                  style: Theme.of(context).textTheme.titleMedium,
                                ),
                              ],
                            ),
                          )
                        : ListView.builder(
                            itemCount: state.filteredPlants.length,
                            itemBuilder: (context, index) {
                              final plant = state.filteredPlants[index];
                              return PlantCard(
                                plant: plant,
                                onTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) => PlantDetailScreen(plantId: plant.id),
                                    ),
                                  );
                                },
                                onWater: () async {
                                  await cubit.waterPlant(plant.id);
                                  if (context.mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text('💧 Полив растения «${plant.name}» зафиксирован!'),
                                        duration: const Duration(seconds: 2),
                                      ),
                                    );
                                  }
                                },
                              );
                            },
                          ),
              ),
            ],
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        icon: const Icon(Icons.add_a_photo_outlined),
        label: const Text('Добавить растение'),
        onPressed: onOpenScanner,
      ),
    );
  }

  Widget _buildMetricChip({
    required String label,
    required int count,
    required Color color,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: color.withOpacity(0.12),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          children: [
            Text(
              '$count',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                color: color.withOpacity(0.9),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
