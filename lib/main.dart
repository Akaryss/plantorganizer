// lib/main.dart
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'data/datasources/local/isar_database_service.dart';
import 'data/datasources/local/realm_database_service.dart';
import 'core/services/notification_service.dart';
import 'presentation/cubits/plant_list/plant_list_cubit.dart';
import 'presentation/screens/home_screen.dart';
import 'presentation/screens/calendar_screen.dart';
import 'presentation/screens/encyclopedia_screen.dart';
import 'presentation/screens/settings_screen.dart';
import 'presentation/screens/scanner_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // 1. Инициализация хранилищ данных (Data-слой по ТЗ)
  final isarService = IsarDatabaseService();
  await isarService.init();

  final realmService = RealmDatabaseService();
  await realmService.init();

  // 2. Инициализация сервиса локальных уведомлений
  final notificationService = NotificationService();
  await notificationService.init();

  runApp(
    PlantCareApp(
      isarService: isarService,
      realmService: realmService,
      notificationService: notificationService,
    ),
  );
}

class PlantCareApp extends StatelessWidget {
  final IsarDatabaseService isarService;
  final RealmDatabaseService realmService;
  final NotificationService notificationService;

  const PlantCareApp({
    super.key,
    required this.isarService,
    required this.realmService,
    required this.notificationService,
  });

  @override
  Widget build(BuildContext context) {
    return MultiRepositoryProvider(
      providers: [
        RepositoryProvider<IsarDatabaseService>.value(value: isarService),
        RepositoryProvider<RealmDatabaseService>.value(value: realmService),
        RepositoryProvider<NotificationService>.value(value: notificationService),
      ],
      child: MultiBlocProvider(
        providers: [
          BlocProvider<PlantListCubit>(
            create: (ctx) => PlantListCubit(
              db: isarService,
              notificationService: notificationService,
            ),
          ),
        ],
        child: MaterialApp(
          title: 'Органайзер растений (Вариант 7)',
          debugShowCheckedModeBanner: false,
          theme: ThemeData(
            colorScheme: ColorScheme.fromSeed(
              seedColor: const Color(0xFF059669), // Изумрудно-зеленый
              brightness: Brightness.light,
            ),
            useMaterial3: true,
            cardTheme: CardTheme(
              elevation: 1,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
          ),
          darkTheme: ThemeData(
            colorScheme: ColorScheme.fromSeed(
              seedColor: const Color(0xFF10B981),
              brightness: Brightness.dark,
            ),
            useMaterial3: true,
            cardTheme: CardTheme(
              elevation: 1,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
          ),
          themeMode: ThemeMode.system,
          home: const MainNavigationShell(),
        ),
      ),
    );
  }
}

class MainNavigationShell extends StatefulWidget {
  const MainNavigationShell({super.key});

  @override
  State<MainNavigationShell> createState() => _MainNavigationShellState();
}

class _MainNavigationShellState extends State<MainNavigationShell> {
  int _currentIndex = 0;

  void _openScanner() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const ScannerScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final screens = [
      HomeScreen(onOpenScanner: _openScanner),
      const CalendarScreen(),
      const EncyclopediaScreen(),
      const SettingsScreen(),
    ];

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (idx) => setState(() => _currentIndex = idx),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.yard_outlined),
            selectedIcon: Icon(Icons.yard),
            label: 'Мой сад',
          ),
          NavigationDestination(
            icon: Icon(Icons.calendar_month_outlined),
            selectedIcon: Icon(Icons.calendar_month),
            label: 'Календарь',
          ),
          NavigationDestination(
            icon: Icon(Icons.menu_book_outlined),
            selectedIcon: Icon(Icons.menu_book),
            label: 'Справочники',
          ),
          NavigationDestination(
            icon: Icon(Icons.settings_outlined),
            selectedIcon: Icon(Icons.settings),
            label: 'Настройки',
          ),
        ],
      ),
    );
  }
}
