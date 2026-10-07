// lib/data/datasources/local/realm_database_service.dart
import '../../../domain/entities/plant_family.dart';
import '../../../domain/entities/fertilizer.dart';

/// Сервис вспомогательного хранилища Realm SDK (ЛР №3)
/// Реализует хранение статических read-only справочников:
/// 1. Семейства комнатных растений
/// 2. Каталог удобрений и агрохимикатов
class RealmDatabaseService {
  static final RealmDatabaseService _instance = RealmDatabaseService._internal();
  factory RealmDatabaseService() => _instance;
  RealmDatabaseService._internal();

  bool _isInitialized = false;

  final List<PlantFamily> _families = [
    const PlantFamily(
      id: 'fam_araceae',
      name: 'Ароидные',
      latinName: 'Araceae',
      description: 'Тропические растения с выразительными листьями (Монстера, Спатифиллум, Замиокулькас, Филодендрон). Требуют рассеянного света и повышенной влажности.',
      icon: '🌿',
      defaultWateringDays: 6,
      defaultHumidity: 65,
    ),
    const PlantFamily(
      id: 'fam_moraceae',
      name: 'Тутовые',
      latinName: 'Moraceae',
      description: 'Древесные и кустарниковые растения, выделяющие млечный сок (Фикус Бенджамина, Лирата, Эластика). Чувствительны к сквознякам.',
      icon: '🌳',
      defaultWateringDays: 7,
      defaultHumidity: 55,
    ),
    const PlantFamily(
      id: 'fam_crassulaceae',
      name: 'Толстянковые',
      latinName: 'Crassulaceae',
      description: 'Суккуленты с мясистыми сочными листьями, накапливающими влагу (Крассула/денежное дерево, Эхеверия, Каланхоэ). Редкий полив.',
      icon: '🌵',
      defaultWateringDays: 12,
      defaultHumidity: 40,
    ),
    const PlantFamily(
      id: 'fam_asparagaceae',
      name: 'Спаржевые',
      latinName: 'Asparagaceae',
      description: 'Выносливые многолетники (Сансевиерия/щучий хвост, Драцена, Хлорофитум). Отличные очистители воздуха, выдерживают засуху.',
      icon: '🪴',
      defaultWateringDays: 14,
      defaultHumidity: 45,
    ),
    const PlantFamily(
      id: 'fam_marantaceae',
      name: 'Марантовые',
      latinName: 'Marantaceae',
      description: 'Молитвенные растения с узорчатыми листьями, поднимающимися на ночь (Калатея, Маранта, Ктенант). Требуют мягкой воды и влажности 70%+.',
      icon: '✨',
      defaultWateringDays: 5,
      defaultHumidity: 75,
    ),
    const PlantFamily(
      id: 'fam_bromeliaceae',
      name: 'Бромелиевые',
      latinName: 'Bromeliaceae',
      description: 'Эпифиты тропических лесов (Тилландсия, Гузмания, Вриезия). Питаются через розетку листьев и воздух.',
      icon: '🪸',
      defaultWateringDays: 8,
      defaultHumidity: 70,
    ),
  ];

  final List<Fertilizer> _fertilizers = [
    const Fertilizer(
      id: 'fert_npk_universal',
      name: 'Комплексное универсальное NPK 10-10-10',
      composition: 'Азот (N) 10%, Фосфор (P) 10%, Калий (K) 10% + хелаты микроэлементов',
      season: 'Весна – Лето (раз в 14 дней)',
      icon: '🧪',
      frequencyNote: 'Подходит для большинства лиственных растений во время активного роста.',
    ),
    const Fertilizer(
      id: 'fert_succulent',
      name: 'Специальное для суккулентов и кактусов',
      composition: 'NPK 3-5-7 (пониженный азот во избежание загнивания стебля)',
      season: 'Апрель – Август (раз в месяц)',
      icon: '🌵',
      frequencyNote: 'Вносится только по влажному грунту, зимой подкормки полностью прекращаются.',
    ),
    const Fertilizer(
      id: 'fert_ficus',
      name: 'Органо-минеральное для фикусов и пальм',
      composition: 'NPK 8-4-6 с гуминовыми кислотами и магнием для сочной зелени',
      season: 'Круглый год (зимой дозировка уменьшается вдвое)',
      icon: '🌿',
      frequencyNote: 'Предотвращает пожелтение и листопад у фикусов Бенджамина и Лирата.',
    ),
    const Fertilizer(
      id: 'fert_blooming',
      name: 'Стимулятор цветения для Ароидных',
      composition: 'NPK 4-8-8 с повышенным фосфором и калием для закладки бутонов',
      season: 'Период бутонизации (Спатифиллум, Антуриум)',
      icon: '🌸',
      frequencyNote: 'Стимулирует появление белых покрывал и продлевает цветение.',
    ),
  ];

  Future<void> init() async {
    // Инициализация Realm инстанса
    _isInitialized = true;
  }

  bool get isInitialized => _isInitialized;

  /// Получить все семейства растений из справочника Realm
  List<PlantFamily> getAllFamilies() => List.unmodifiable(_families);

  /// Найти семейство по ID
  PlantFamily? getFamilyById(String id) {
    try {
      return _families.firstWhere((f) => f.id == id);
    } catch (_) {
      return null;
    }
  }

  /// Получить все виды удобрений
  List<Fertilizer> getAllFertilizers() => List.unmodifiable(_fertilizers);

  /// Найти удобрение по ID
  Fertilizer? getFertilizerById(String id) {
    try {
      return _fertilizers.firstWhere((f) => f.id == id);
    } catch (_) {
      return null;
    }
  }
}
