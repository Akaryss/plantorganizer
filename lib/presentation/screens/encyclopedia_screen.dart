// lib/presentation/screens/encyclopedia_screen.dart
import 'package:flutter/material.dart';
import '../../data/datasources/local/realm_database_service.dart';

class EncyclopediaScreen extends StatelessWidget {
  const EncyclopediaScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final realm = RealmDatabaseService();
    final families = realm.getAllFamilies();
    final fertilizers = realm.getAllFertilizers();

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Справочники Realm 📚', style: TextStyle(fontWeight: FontWeight.bold)),
          bottom: const TabBar(
            tabs: [
              Tab(icon: Icon(Icons.forest), text: 'Семейства растений'),
              Tab(icon: Icon(Icons.science), text: 'Удобрения и NPK'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            // Вкладка 1: Семейства растений (Realm SDK)
            ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: families.length,
              itemBuilder: (context, index) {
                final fam = families[index];
                return Card(
                  margin: const EdgeInsets.symmetric(vertical: 6),
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(fam.icon, style: const TextStyle(fontSize: 28)),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    fam.name,
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                  ),
                                  Text(
                                    fam.latinName,
                                    style: const TextStyle(fontStyle: FontStyle.italic, color: Colors.emerald),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(fam.description, style: Theme.of(context).textTheme.bodyMedium),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            Chip(
                              avatar: const Icon(Icons.water_drop, size: 14),
                              label: Text('Полив: ${fam.defaultWateringDays} дн.'),
                            ),
                            const SizedBox(width: 8),
                            Chip(
                              avatar: const Icon(Icons.water, size: 14),
                              label: Text('Влажность: ${fam.defaultHumidity}%'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),

            // Вкладка 2: Удобрения (Realm SDK)
            ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: fertilizers.length,
              itemBuilder: (context, index) {
                final fert = fertilizers[index];
                return Card(
                  margin: const EdgeInsets.symmetric(vertical: 6),
                  child: ListTile(
                    leading: CircleAvatar(
                      child: Text(fert.icon, style: const TextStyle(fontSize: 20)),
                    ),
                    title: Text(fert.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Формула: ${fert.composition}', style: const TextStyle(color: Colors.amber)),
                        Text('Сезон: ${fert.season}'),
                        Text(fert.frequencyNote, style: Theme.of(context).textTheme.bodySmall),
                      ],
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
