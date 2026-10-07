// lib/presentation/cubits/plant_detail/plant_detail_state.dart
import '../../../domain/entities/plant.dart';
import '../../../domain/entities/care_log.dart';

class PlantDetailState {
  final bool isLoading;
  final Plant? plant;
  final List<CareLog> careLogs;
  final String? errorMessage;
  final String? successMessage;

  const PlantDetailState({
    this.isLoading = false,
    this.plant,
    this.careLogs = const [],
    this.errorMessage,
    this.successMessage,
  });

  PlantDetailState copyWith({
    bool? isLoading,
    Plant? plant,
    List<CareLog>? careLogs,
    String? errorMessage,
    String? successMessage,
  }) {
    return PlantDetailState(
      isLoading: isLoading ?? this.isLoading,
      plant: plant ?? this.plant,
      careLogs: careLogs ?? this.careLogs,
      errorMessage: errorMessage,
      successMessage: successMessage,
    );
  }
}
