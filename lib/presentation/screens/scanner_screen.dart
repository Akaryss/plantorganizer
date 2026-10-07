// lib/presentation/screens/scanner_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../cubits/scanner/scanner_cubit.dart';
import '../cubits/scanner/scanner_state.dart';
import '../../data/datasources/remote/perenual_api_service.dart';
import '../../data/datasources/local/isar_database_service.dart';
import '../../data/datasources/local/realm_database_service.dart';
import '../../core/services/notification_service.dart';

class ScannerScreen extends StatelessWidget {
  const ScannerScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (ctx) => ScannerCubit(
        apiService: PerenualApiService(),
        db: ctx.read<IsarDatabaseService>(),
        realm: RealmDatabaseService(),
        notificationService: ctx.read<NotificationService>(),
      ),
      child: const _ScannerView(),
    );
  }
}

class _ScannerView extends StatefulWidget {
  const _ScannerView();

  @override
  State<_ScannerView> createState() => _ScannerViewState();
}

class _ScannerViewState extends State<_ScannerView> {
  final _textController = TextEditingController();

  final List<String> _mockBarcodes = [
    'Monstera',
    'Ficus lyrata',
    'Sansevieria',
    'Calathea',
    'Zamioculcas',
    'Crassula',
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('ИИ-Сканер этикеток 📷', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: BlocConsumer<ScannerCubit, ScannerState>(
        listener: (context, state) {
          if (state.errorMessage != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.errorMessage!), backgroundColor: Colors.red),
            );
          }
          if (state.savedPlant != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('✨ Растение «${state.savedPlant!.name}» успешно добавлено в сад!'),
                backgroundColor: Colors.green,
              ),
            );
            Navigator.pop(context);
          }
        },
        builder: (context, state) {
          final cubit = context.read<ScannerCubit>();

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Видоискатель / Mock-режим камеры по ТЗ
                Container(
                  height: 200,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: Colors.black87,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: const Color(0xFF059669), width: 2),
                  ),
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.qr_code_scanner, size: 56, color: Color(0xFF059669)),
                          const SizedBox(height: 8),
                          const Text(
                            'Наведите камеру на этикетку растения',
                            style: TextStyle(color: Colors.white, fontSize: 13),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Поддерживается OCR-распознавание и поиск в API',
                            style: TextStyle(color: Colors.grey.shade400, fontSize: 11),
                          ),
                        ],
                      ),
                      // Анимированная лазерная рамка сканирования
                      Positioned(
                        bottom: 12,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFF059669).withOpacity(0.3),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Text(
                            '● Mock режим тестирования активен',
                            style: TextStyle(color: Color(0xFF34D399), fontSize: 11),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Тестовые образцы штрихкодов / этикеток (ЛР №2 & №4: тестирование без реального сканера)
                const Text(
                  'Быстрые образцы для демонстрации:',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _mockBarcodes.map((sample) {
                    return ActionChip(
                      avatar: const Icon(Icons.touch_app, size: 14),
                      label: Text(sample),
                      onPressed: () {
                        _textController.text = sample;
                        cubit.onTextScanned(sample);
                      },
                    );
                  }).toList(),
                ),
                const SizedBox(height: 16),

                // Ручной ввод текста с этикетки
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _textController,
                        decoration: const InputDecoration(
                          labelText: 'Или введите название вручную',
                          hintText: 'Например: Monstera',
                          border: OutlineInputBorder(),
                          isDense: true,
                        ),
                        onSubmitted: cubit.onTextScanned,
                      ),
                    ),
                    const SizedBox(width: 8),
                    FilledButton(
                      child: state.isSearching
                          ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : const Text('Найти в API'),
                      onPressed: () => cubit.onTextScanned(_textController.text),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Результаты запроса к REST API (Perenual API DTO)
                if (state.searchResults.isNotEmpty) ...[
                  Text(
                    'Найдено в ботаническом API (${state.searchResults.length}):',
                    style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  ...state.searchResults.map((plantDto) {
                    return Card(
                      margin: const EdgeInsets.only(bottom: 10),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Row(
                          children: [
                            if (plantDto.imageUrl != null)
                              ClipRRect(
                                borderRadius: BorderRadius.circular(10),
                                child: Image.network(
                                  plantDto.imageUrl!,
                                  width: 60,
                                  height: 60,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) => const Text('🌿'),
                                ),
                              ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    plantDto.commonName,
                                    style: const TextStyle(fontWeight: FontWeight.bold),
                                  ),
                                  Text(
                                    plantDto.scientificName.firstOrNull ?? '',
                                    style: const TextStyle(fontStyle: FontStyle.italic, fontSize: 12),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Полив: раз в ${plantDto.wateringFrequencyDays} дн.',
                                    style: theme.textTheme.bodySmall,
                                  ),
                                ],
                              ),
                            ),
                            FilledButton.tonal(
                              child: const Text('Добавить'),
                              onPressed: () => cubit.savePlantFromApi(plantDto),
                            ),
                          ],
                        ),
                      ),
                    );
                  }),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}
