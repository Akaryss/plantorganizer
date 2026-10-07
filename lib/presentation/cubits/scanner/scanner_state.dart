// lib/presentation/cubits/scanner/scanner_state.dart
import '../../../data/models/api/perenual_plant_dto.dart';
import '../../../domain/entities/plant.dart';

class ScannerState {
  final bool isScanning;
  final bool isSearching;
  final bool isSaving;
  final String scannedQuery;
  final List<PerenualPlantDto> searchResults;
  final Plant? savedPlant;
  final String? errorMessage;
  final bool isMockMode;

  const ScannerState({
    this.isScanning = false,
    this.isSearching = false,
    this.isSaving = false,
    this.scannedQuery = '',
    this.searchResults = const [],
    this.savedPlant,
    this.errorMessage,
    this.isMockMode = true,
  });

  ScannerState copyWith({
    bool? isScanning,
    bool? isSearching,
    bool? isSaving,
    String? scannedQuery,
    List<PerenualPlantDto>? searchResults,
    Plant? savedPlant,
    String? errorMessage,
    bool? isMockMode,
  }) {
    return ScannerState(
      isScanning: isScanning ?? this.isScanning,
      isSearching: isSearching ?? this.isSearching,
      isSaving: isSaving ?? this.isSaving,
      scannedQuery: scannedQuery ?? this.scannedQuery,
      searchResults: searchResults ?? this.searchResults,
      savedPlant: savedPlant,
      errorMessage: errorMessage,
      isMockMode: isMockMode ?? this.isMockMode,
    );
  }
}
