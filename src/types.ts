export type CareType = 'water' | 'fertilize' | 'repot' | 'mist';

export interface CareLog {
  id: string;
  plantId: string;
  type: CareType;
  date: string; // ISO date
  notes?: string;
  fertilizerName?: string;
}

export interface NotificationTrigger {
  id: string;
  plantId: string;
  plantName: string;
  type: CareType;
  scheduledDate: string;
  title: string;
  body: string;
  isPending: boolean;
}

export interface Plant {
  id: string;
  name: string;
  scientificName: string;
  familyId: string; // references Realm PlantFamily
  familyName: string;
  imageUrl: string;
  wateringFrequencyDays: number;
  fertilizingFrequencyDays: number;
  lastWateredDate: string; // ISO date
  lastFertilizedDate: string;
  lightRequirement: 'Прямой солнечный' | 'Яркий рассеянный' | 'Полутень' | 'Теневыносливое';
  humidityLevel: number; // e.g. 60 (%)
  temperatureRange: string; // e.g. "18-24 °C"
  description: string;
  notes: string;
  location?: string; // e.g. "Гостиная у окна", "Спальня", "Балкон"
  gbifTaxonKey?: number;
  gbifCanonicalName?: string;
}

export type NavigationTab = 'home' | 'calendar' | 'encyclopedia' | 'settings';

export interface AppSettings {
  reminderTime: string; // e.g. "09:00"
  enablePush: boolean;
  enableSound: boolean;
  droughtWarningDays: number; // e.g. 2
  temperatureUnit: 'C' | 'F';
  waterVolumeUnit: 'ml' | 'cups';
  seasonalMode: 'summer' | 'winter' | 'auto';
  autoScheduleTriggers: boolean;
  geminiApiKey?: string;
  geminiModel?: string;
  enableAiVision?: boolean;
}

export const defaultSettings: AppSettings = {
  reminderTime: '09:00',
  enablePush: true,
  enableSound: true,
  droughtWarningDays: 2,
  temperatureUnit: 'C',
  waterVolumeUnit: 'ml',
  seasonalMode: 'auto',
  autoScheduleTriggers: true,
  geminiApiKey: '',
  geminiModel: 'gemini-3.8-flash',
  enableAiVision: true,
};

export interface PlantFamily {
  id: string;
  name: string;
  nameLatin: string;
  icon: string;
  description: string;
  count: number;
}

export interface FertilizerType {
  id: string;
  name: string;
  icon: string;
  composition: string;
  season: string;
  frequencyNote: string;
}

export type OverdueStatus = 'healthy' | 'due_today' | 'overdue_minor' | 'overdue_critical';

export interface GbifSpeciesData {
  usageKey: number;
  scientificName: string;
  canonicalName: string;
  rank: string;
  status: string;
  confidence: number;
  matchType: string;
  kingdom: string;
  phylum: string;
  order: string;
  family: string;
  genus: string;
  species: string;
  synonym: boolean;
  common_name?: string;
  watering_days?: number;
  care_level?: string;
  humidity_recommendation?: number;
  default_image?: {
    medium_url: string;
  };
}

// Backward compatibility alias
export type PerenualApiSpecies = GbifSpeciesData;

export interface EncyclopediaPlant {
  id: string;
  name: string;
  scientificName: string;
  canonicalName?: string;
  gbifTaxonKey?: number;
  gbifOrder?: string;
  familyId: string;
  familyName: string;
  imageUrl: string;
  wateringFrequencyDays: number;
  fertilizingFrequencyDays: number;
  lightRequirement: 'Прямой солнечный' | 'Яркий рассеянный' | 'Полутень' | 'Теневыносливое';
  humidityLevel: number;
  temperatureRange: string;
  difficulty: 'Легкий' | 'Средний' | 'Сложный';
  description: string;
  careGuide: string;
  tags: string[];
  aliases?: string[];
  nativeTo?: string;
  fertilizerRecommendation?: string;
  confidenceScore?: number;
  visualHealthAssessment?: string;
  aiIdentified?: boolean;
}
