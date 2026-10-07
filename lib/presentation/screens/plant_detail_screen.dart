// lib/presentation/screens/plant_detail_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../cubits/plant_detail/plant_detail_cubit.dart';
import '../cubits/plant_detail/plant_detail_state.dart';
import '../../data/datasources/local/isar_database_service.dart';
import '../../data/datasources/local/realm_database_service.dart';
import '../../core/services/notification_service.dart';
import '../../core/enums/care_type.dart';
import '../../domain/entities/plant.dart';

class PlantDetailScreen extends StatelessWidget {
  final int plantId;

  const PlantDetailScreen({super.key, required this.plantId});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (ctx) => PlantDetailCubit(
        plantId: plantId,
        db: ctx.read<IsarDatabaseService>(),
        notificationService: ctx.read<NotificationService>(),
      ),
      child: const _PlantDetailView(),
    );
  }
}

class _PlantDetailView extends StatelessWidget {
  const _PlantDetailView();

  @override
  Widget build(BuildContext context) {
    final realmService = RealmDatabaseService();

    return BlocConsumer<PlantDetailCubit, PlantDetailState>(
      listener: (context, state) {
        if (state.errorMessage != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(state.errorMessage!), backgroundColor: Colors.red),
          );
        }
        if (state.successMessage != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(state.successMessage!), backgroundColor: Colors.green),
          );
        }
      },
      builder: (context, state) {
        final plant = state.plant;
        if (state.isLoading || plant == null) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        final family = realmService.getFamilyById(plant.familyId);
        final theme = Theme.of(context);
        final dateFormat = DateFormat('dd.MM.yyyy, HH:mm');

        return Scaffold(
          body: CustomScrollView(
            slivers: [
              // 1. Аппбар с фотографией
              SliverAppBar(
                expandedHeight: 280,
                pinned: true,
                flexibleSpace: FlexibleSpaceBar(
                  title: Text(
                    plant.name,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      shadows: [Shadow(color: Colors.black87, blurRadius: 8)],
                    ),
                  ),
                  background: Stack(
                    fit: StackFit.expand,
                    children: [
                      Image.network(
                        plant.imageUrl,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          color: Colors.grey.shade900,
                          child: const Center(child: Text('🌿', style: TextStyle(fontSize: 64))),
                        ),
                      ),
                      const DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [Colors.transparent, Colors.black87],
                            stops: [0.6, 1.0],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // 2. Детальная карточка и регламент ухода (ЛР №2)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Латинское название и семейство Realm
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  plant.scientificName,
                                  style: theme.textTheme.titleMedium?.copyWith(
                                    fontStyle: FontStyle.italic,
                                    color: const Color(0xFF059669),
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                if (family != null) ...[
                                  const SizedBox(height: 4),
                                  Text(
                                    '${family.icon} Семейство: ${family.name} (${family.latinName})',
                                    style: theme.textTheme.bodyMedium?.copyWith(
                                      color: theme.textTheme.bodySmall?.color,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Сетка микроклимата
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          _buildParamChip(
                            icon: Icons.water_drop_outlined,
                            label: 'Полив: каждые ${plant.wateringFrequencyDays} дн.',
                          ),
                          _buildParamChip(
                            icon: Icons.wb_sunny_outlined,
                            label: plant.lightRequirement,
                          ),
                          _buildParamChip(
                            icon: Icons.water_outlined,
                            label: 'Влажность: ${plant.humidityLevel}%',
                          ),
                          _buildParamChip(
                            icon: Icons.thermostat_outlined,
                            label: plant.temperatureRange,
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      if (plant.notes != null && plant.notes!.isNotEmpty) ...[
                        Card(
                          color: theme.colorScheme.surfaceVariant.withOpacity(0.4),
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Row(
                              children: [
                                const Icon(Icons.info_outline, size: 20),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    plant.notes!,
                                    style: theme.textTheme.bodyMedium,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],

                      // Кнопка фиксации процедуры ухода
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton.icon(
                          icon: const Icon(Icons.add_task),
                          label: const Text('Зафиксировать процедуру ухода'),
                          onPressed: () => _showAddCareModal(context),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Заголовок журнала ухода (ЛР №2 & IsarLinks)
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Журнал процедур (${state.careLogs.length})',
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                    ],
                  ),
                ),
              ),

              // 3. Список записей журнала ухода
              state.careLogs.isEmpty
                  ? const SliverToBoxAdapter(
                      child: Padding(
                        padding: EdgeInsets.all(24),
                        child: Center(
                          child: Text('История процедур пока пуста. Нажмите кнопку выше для добавления.'),
                        ),
                      ),
                    )
                  : SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final log = state.careLogs[index];
                          return Card(
                            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                            child: ListTile(
                              leading: CircleAvatar(
                                child: Text(_getCareEmoji(log.type)),
                              ),
                              title: Text(log.type.displayName),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  if (log.fertilizerName != null)
                                    Text('Удобрение: ${log.fertilizerName!}'),
                                  if (log.notes != null)
                                    Text('Заметка: ${log.notes!}'),
                                  Text(
                                    dateFormat.format(log.timestamp),
                                    style: theme.textTheme.bodySmall,
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                        childCount: state.careLogs.length,
                      ),
                    ),
              const SliverToBoxAdapter(child: SizedBox(height: 40)),
            ],
          ),
        );
      },
    );
  }

  void _showAddCareModal(BuildContext context) {
    CareType selectedType = CareType.water;
    final notesCtrl = TextEditingController();
    final fertCtrl = TextEditingController();
    final realmService = RealmDatabaseService();
    final fertilizers = realmService.getAllFertilizers();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (bottomSheetContext) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 16,
                right: 16,
                top: 20,
                bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Новая запись в журнал ухода',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),

                  // Выбор типа процедуры (Полив / Подкормка / Пересадка / Опрыскивание)
                  SegmentedButton<CareType>(
                    segments: const [
                      ButtonSegment(value: CareType.water, label: Text('Полив')),
                      ButtonSegment(value: CareType.fertilize, label: Text('Подкормка')),
                      ButtonSegment(value: CareType.repot, label: Text('Пересадка')),
                      ButtonSegment(value: CareType.mist, label: Text('Спрей')),
                    ],
                    selected: {selectedType},
                    onSelectionChanged: (val) {
                      setModalState(() => selectedType = val.first);
                    },
                  ),
                  const SizedBox(height: 12),

                  // Если выбрана подкормка — выбор удобрения из Realm
                  if (selectedType == CareType.fertilize) ...[
                    DropdownButtonFormField<String>(
                      decoration: const InputDecoration(
                        labelText: 'Выбор удобрения из Realm SDK',
                        border: OutlineInputBorder(),
                      ),
                      items: fertilizers.map((f) {
                        return DropdownMenuItem(
                          value: f.name,
                          child: Text('${f.icon} ${f.name}'),
                        );
                      }).toList(),
                      onChanged: (val) {
                        fertCtrl.text = val ?? '';
                      },
                    ),
                    const SizedBox(height: 12),
                  ],

                  TextField(
                    controller: notesCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Заметки о процедуре',
                      hintText: 'Например: добавлено 200мл отстоянной воды',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),

                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      child: const Text('Сохранить запись'),
                      onPressed: () {
                        context.read<PlantDetailCubit>().addCareAction(
                          type: selectedType,
                          notes: notesCtrl.text.isEmpty ? null : notesCtrl.text,
                          fertilizerName: fertCtrl.text.isEmpty ? null : fertCtrl.text,
                        );
                        Navigator.pop(bottomSheetContext);
                      },
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildParamChip({required IconData icon, required String label}) {
    return Chip(
      avatar: Icon(icon, size: 16),
      label: Text(label, style: const TextStyle(fontSize: 12)),
    );
  }

  String _getCareEmoji(CareType type) {
    switch (type) {
      case CareType.water:
        return '💧';
      case CareType.fertilize:
        return '🧪';
      case CareType.repot:
        return '🪴';
      case CareType.mist:
        return '💦';
    }
  }
}
