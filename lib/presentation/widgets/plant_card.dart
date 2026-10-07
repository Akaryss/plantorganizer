// lib/presentation/widgets/plant_card.dart
import 'package:flutter/material.dart';
import '../../domain/entities/plant.dart';

/// Виджет карточки комнатного растения с динамической индикацией (ЛР №1)
/// Цвет фона карточки динамически сигнализирует о состоянии полива:
/// - healthy: изумрудно-зеленый (в норме)
/// - dueToday: янтарно-желтый (полить сегодня)
/// - overdue: оранжево-красный (просрочка 1-2 дня)
/// - criticalOverdue: глубокий красный с предупреждением (критическая засуха >2 дней)
class PlantCard extends StatelessWidget {
  final Plant plant;
  final VoidCallback onTap;
  final VoidCallback onWater;

  const PlantCard({
    super.key,
    required this.plant,
    required this.onTap,
    required this.onWater,
  });

  @override
  Widget build(BuildContext context) {
    final status = plant.wateringStatus;
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    Color cardBg;
    Color borderColor;
    Color statusBadgeBg;
    Color statusBadgeText;
    String statusTitle;
    IconData statusIcon;

    switch (status) {
      case PlantWateringStatus.healthy:
        cardBg = isDark ? const Color(0xFF062E21) : const Color(0xFFECFDF5);
        borderColor = isDark ? const Color(0xFF047857) : const Color(0xFFA7F3D0);
        statusBadgeBg = isDark ? const Color(0xFF065F46) : const Color(0xFFD1FAE5);
        statusBadgeText = isDark ? const Color(0xFF34D399) : const Color(0xFF047857);
        final daysLeft = -plant.overdueDays;
        statusTitle = daysLeft == 1 ? 'Полив завтра' : 'Полив через $daysLeft дн.';
        statusIcon = Icons.check_circle_outline;
        break;

      case PlantWateringStatus.dueToday:
        cardBg = isDark ? const Color(0xFF3B2904) : const Color(0xFFFFFBEB);
        borderColor = isDark ? const Color(0xFFB45309) : const Color(0xFFFDE68A);
        statusBadgeBg = isDark ? const Color(0xFF78350F) : const Color(0xFFFEF3C7);
        statusBadgeText = isDark ? const Color(0xFFFBBF24) : const Color(0xFFB45309);
        statusTitle = '💧 Полить сегодня!';
        statusIcon = Icons.access_time_filled;
        break;

      case PlantWateringStatus.overdue:
        cardBg = isDark ? const Color(0xFF381414) : const Color(0xFFFEF2F2);
        borderColor = isDark ? const Color(0xFFB91C1C) : const Color(0xFFFECACA);
        statusBadgeBg = isDark ? const Color(0xFF7F1D1D) : const Color(0xFFFEE2E2);
        statusBadgeText = isDark ? const Color(0xFFF87171) : const Color(0xFFDC2626);
        statusTitle = '⚠️ Просрочка: ${plant.overdueDays} дн.';
        statusIcon = Icons.warning_amber_rounded;
        break;

      case PlantWateringStatus.criticalOverdue:
        cardBg = isDark ? const Color(0xFF450A0A) : const Color(0xFFFFE4E6);
        borderColor = isDark ? const Color(0xFFE11D48) : const Color(0xFFFDA4AF);
        statusBadgeBg = isDark ? const Color(0xFF881337) : const Color(0xFFFECDD3);
        statusBadgeText = isDark ? const Color(0xFFFB7185) : const Color(0xFF9F1239);
        statusTitle = '🚨 Критическая засуха: +${plant.overdueDays} дн.!';
        statusIcon = Icons.error_outline_rounded;
        break;
    }

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: BorderSide(color: borderColor, width: 1.5),
      ),
      color: cardBg,
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Фото растения с закруглением
              ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: SizedBox(
                  width: 76,
                  height: 76,
                  child: Image.network(
                    plant.imageUrl,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      color: Colors.grey.shade800,
                      child: const Center(
                        child: Text('🌿', style: TextStyle(fontSize: 32)),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 14),

              // Описание и статус
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      plant.name,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      plant.scientificName,
                      style: theme.textTheme.bodySmall?.copyWith(
                        fontStyle: FontStyle.italic,
                        color: theme.textTheme.bodySmall?.color?.withOpacity(0.8),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),

                    // Бейдж статуса полива
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: statusBadgeBg,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(statusIcon, size: 14, color: statusBadgeText),
                          const SizedBox(width: 4),
                          Flexible(
                            child: Text(
                              statusTitle,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: statusBadgeText,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // Кнопка быстрого полива
              IconButton.filledTonal(
                tooltip: 'Полить сейчас',
                icon: const Icon(Icons.water_drop, size: 22),
                style: IconButton.styleFrom(
                  backgroundColor: statusBadgeBg,
                  foregroundColor: statusBadgeText,
                ),
                onPressed: onWater,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
