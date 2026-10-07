// lib/core/enums/care_type.dart
import 'package:freezed_annotation/freezed_annotation.dart';

/// Тип агротехнической процедуры по ТЗ Варианта 7
enum CareType {
  @JsonValue('water')
  water, // Полив

  @JsonValue('fertilize')
  fertilize, // Подкормка удобрениями

  @JsonValue('repot')
  repot, // Пересадка в новый субстрат

  @JsonValue('mist')
  mist, // Опрыскивание листьев
}

extension CareTypeExtension on CareType {
  String get displayName {
    switch (this) {
      case CareType.water:
        return 'Полив';
      case CareType.fertilize:
        return 'Подкормка';
      case CareType.repot:
        return 'Пересадка';
      case CareType.mist:
        return 'Опрыскивание';
    }
  }

  String get iconAsset {
    switch (this) {
      case CareType.water:
        return 'assets/icons/droplet.png';
      case CareType.fertilize:
        return 'assets/icons/sparkles.png';
      case CareType.repot:
        return 'assets/icons/box.png';
      case CareType.mist:
        return 'assets/icons/cloud-rain.png';
    }
  }
}
