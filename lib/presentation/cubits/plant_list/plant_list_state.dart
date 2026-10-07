// lib/presentation/cubits/plant_list/plant_list_state.dart
import '../../../domain/entities/plant.dart';

enum PlantFilterStatus { all, dueToday, overdue }

class PlantListState {
  final bool isLoading;
  final List<Plant> allPlants;
  final List<Plant> filteredPlants;
  final String searchQuery;
  final String selectedFamilyId;
  final PlantFilterStatus statusFilter;
  final String? errorMessage;

  const PlantListState({
    this.isLoading = false,
    this.allPlants = const [],
    this.filteredPlants = const [],
    this.searchQuery = '',
    this.selectedFamilyId = 'all',
    this.statusFilter = PlantFilterStatus.all,
    this.errorMessage,
  });

  PlantListState copyWith({
    bool? isLoading,
    List<Plant>? allPlants,
    List<Plant>? filteredPlants,
    String? searchQuery,
    String? selectedFamilyId,
    PlantFilterStatus? statusFilter,
    String? errorMessage,
  }) {
    return PlantListState(
      isLoading: isLoading ?? this.isLoading,
      allPlants: allPlants ?? this.allPlants,
      filteredPlants: filteredPlants ?? this.filteredPlants,
      searchQuery: searchQuery ?? this.searchQuery,
      selectedFamilyId: selectedFamilyId ?? this.selectedFamilyId,
      statusFilter: statusFilter ?? this.statusFilter,
      errorMessage: errorMessage,
    );
  }
}
