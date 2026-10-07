import React, { useState, useRef } from 'react';
import { Plant, NotificationTrigger, PlantFamily, EncyclopediaPlant } from '../types';
import { initialRealmFamilies, presetPlantPhotos } from '../data/plantData';
import {
  ENCYCLOPEDIA_PLANTS,
  ENCYCLOPEDIA_CATEGORIES,
  searchEncyclopedia,
  searchGbifApiWithAi,
  generateSmartDescription,
  smartTranslateToLatin,
} from '../data/plantEncyclopedia';
import {
  X,
  Upload,
  Camera,
  Image as ImageIcon,
  Sparkles,
  Droplet,
  Sun,
  Wind,
  MapPin,
  Check,
  ScanLine,
  Sliders,
  CheckCircle2,
  Search,
  Globe,
  Loader2,
  BookOpen,
  ArrowRight,
  Info,
  Layers,
} from 'lucide-react';

interface AddPlantModalProps {
  onClose: () => void;
  onPlantAdded?: (newPlant: Plant, triggers: NotificationTrigger[]) => void;
  onPlantCreated?: (newPlant: Plant, triggers: NotificationTrigger[]) => void;
  onOpenScanner?: () => void;
}

const COMMON_LOCATIONS = [
  'Гостиная у окна',
  'Спальня',
  'Кухня',
  'Кабинет',
  'Балкон / Лоджия',
  'Коридор',
  'Ванная',
  'Подоконник южный',
  'Подоконник северный',
];

export const AddPlantModal: React.FC<AddPlantModalProps> = ({
  onClose,
  onPlantAdded,
  onPlantCreated,
  onOpenScanner,
}) => {
  // Режимы: 'encyclopedia' (умный поиск), 'manual' (ручной ввод), 'ai_result' (результат ИИ-запроса)
  const [activeMode, setActiveMode] = useState<'encyclopedia' | 'manual'>('encyclopedia');

  // Состояния для умного поиска в энциклопедии
  const [encyclopediaSearchQuery, setEncyclopediaSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiSearchResult, setAiSearchResult] = useState<EncyclopediaPlant | null>(null);
  const [aiSearchError, setAiSearchError] = useState<string | null>(null);
  const [expandedPlantId, setExpandedPlantId] = useState<string | null>(null);

  // Ручной ввод и параметры растения
  const [name, setName] = useState('');
  const [scientificName, setScientificName] = useState('');
  const [familyId, setFamilyId] = useState('fam_araceae');
  const [location, setLocation] = useState('Гостиная у окна');
  const [customLocation, setCustomLocation] = useState('');
  const [wateringFrequencyDays, setWateringFrequencyDays] = useState(7);
  const [fertilizingFrequencyDays, setFertilizingFrequencyDays] = useState(14);
  const [lastWateredDate, setLastWateredDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [lightRequirement, setLightRequirement] = useState<
    'Прямой солнечный' | 'Яркий рассеянный' | 'Полутень' | 'Теневыносливое'
  >('Яркий рассеянный');
  const [humidityLevel, setHumidityLevel] = useState(60);
  const [temperatureRange, setTemperatureRange] = useState('18-25 °C');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState(
    'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=800&q=80'
  );
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [validationError, setValidationError] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [autoFillSuccess, setAutoFillSuccess] = useState(false);
  const [isTranslatingLatin, setIsTranslatingLatin] = useState(false);
  const [latinSuccess, setLatinSuccess] = useState(false);
  const [latinBadge, setLatinBadge] = useState<string | null>(null);

  // Выделенный быстрый умный перевод бытового названия на строгую латынь
  const handleSmartLatinTranslate = async () => {
    const query = name.trim();
    if (!query) {
      setValidationError('Укажите название растения (например: Денежное дерево, Фикус лирата, Монстера)');
      return;
    }
    setIsTranslatingLatin(true);
    setValidationError('');
    try {
      const res = await smartTranslateToLatin(query);
      if (res.canonicalLatin) {
        setScientificName(res.canonicalLatin);
        setLatinBadge(`${res.canonicalLatin} • ${res.familyRu}`);
        setLatinSuccess(true);
        setTimeout(() => setLatinSuccess(false), 3000);

        // Автоматически сопоставляем семейство с каталогом Realm
        if (res.familyRu) {
          const foundFam = initialRealmFamilies.find(
            (f) =>
              f.name.toLowerCase().includes(res.familyRu.toLowerCase()) ||
              res.familyRu.toLowerCase().includes(f.name.toLowerCase())
          );
          if (foundFam) {
            setFamilyId(foundFam.id);
          }
        }
      }
    } catch (err: any) {
      console.warn('Smart Latin translation error:', err);
    } finally {
      setIsTranslatingLatin(false);
    }
  };

  // Умное комплексное автозаполнение параметров ухода и описания через Gemini
  const handleSmartAutoFill = async () => {
    const query = name.trim();
    if (!query) {
      setValidationError('Введите название растения для умного ИИ-автозаполнения');
      return;
    }
    setIsAutoFilling(true);
    setValidationError('');
    try {
      // 1. Сначала определяем точную латынь и семейство
      const latinResult = await smartTranslateToLatin(query);
      if (latinResult.canonicalLatin) {
        setScientificName(latinResult.canonicalLatin);
        setLatinBadge(`${latinResult.canonicalLatin} • ${latinResult.familyRu}`);
        if (latinResult.familyRu) {
          const foundFam = initialRealmFamilies.find(
            (f) =>
              f.name.toLowerCase().includes(latinResult.familyRu.toLowerCase()) ||
              latinResult.familyRu.toLowerCase().includes(f.name.toLowerCase())
          );
          if (foundFam) {
            setFamilyId(foundFam.id);
          }
        }
      }

      const selectedFam = initialRealmFamilies.find((f) => f.id === familyId);
      const aiData = await generateSmartDescription(
        query,
        latinResult.canonicalLatin || scientificName,
        latinResult.familyRu || selectedFam?.name,
        notes
      );
      if (aiData.careGuide) setNotes(aiData.careGuide);
      if (aiData.wateringFrequencyDays) setWateringFrequencyDays(aiData.wateringFrequencyDays);
      if (aiData.fertilizingFrequencyDays) setFertilizingFrequencyDays(aiData.fertilizingFrequencyDays);
      if (aiData.lightRequirement) setLightRequirement(aiData.lightRequirement);
      if (aiData.humidityLevel) setHumidityLevel(aiData.humidityLevel);
      if (aiData.temperatureRange) setTemperatureRange(aiData.temperatureRange);

      const fullLookup = await searchGbifApiWithAi(query);
      if (fullLookup) {
        if (!scientificName.trim() && fullLookup.scientificName) {
          setScientificName(fullLookup.scientificName);
        }
        if (fullLookup.familyId) {
          setFamilyId(fullLookup.familyId);
        }
        if (fullLookup.imageUrl && imageUrl.includes('unsplash.com/photo-1614594975525-e45190c55d0b')) {
          setImageUrl(fullLookup.imageUrl);
        }
      }

      setAutoFillSuccess(true);
      setTimeout(() => setAutoFillSuccess(false), 3500);
    } catch (err: any) {
      console.warn('Smart auto-fill error:', err);
    } finally {
      setIsAutoFilling(false);
    }
  };

  // Список найденных в энциклопедии растений
  const searchResults = searchEncyclopedia(encyclopediaSearchQuery, selectedCategory);

  // Унифицированная функция сохранения растения в родительский компонент
  const dispatchSavePlant = (newPlant: Plant, triggers: NotificationTrigger[]) => {
    if (onPlantAdded) onPlantAdded(newPlant, triggers);
    if (onPlantCreated) onPlantCreated(newPlant, triggers);
    onClose();
  };

  // Быстрое добавление растения из энциклопедии в 1 клик
  const handleDirectAddFromEncyclopedia = (item: EncyclopediaPlant) => {
    const plantId = `plant_${Date.now()}`;
    const todayStr = new Date().toISOString().split('T')[0];

    const newPlant: Plant = {
      id: plantId,
      name: item.name,
      scientificName: item.scientificName,
      familyId: item.familyId,
      familyName: item.familyName,
      imageUrl: item.imageUrl,
      wateringFrequencyDays: item.wateringFrequencyDays,
      fertilizingFrequencyDays: item.fertilizingFrequencyDays,
      lastWateredDate: todayStr,
      lastFertilizedDate: todayStr,
      lightRequirement: item.lightRequirement,
      humidityLevel: item.humidityLevel,
      temperatureRange: item.temperatureRange,
      description: item.description,
      notes: item.careGuide,
      location: 'Гостиная у окна',
    };

    const nextWaterDate = new Date();
    nextWaterDate.setDate(nextWaterDate.getDate() + item.wateringFrequencyDays);

    const triggers: NotificationTrigger[] = [
      {
        id: `trig_${Date.now()}_1`,
        plantId,
        plantName: item.name,
        type: 'water',
        scheduledDate: nextWaterDate.toISOString().split('T')[0],
        title: `💧 Пора полить ${item.name}`,
        body: `Плановый полив по регламенту каждые ${item.wateringFrequencyDays} дн.`,
        isPending: true,
      },
    ];

    dispatchSavePlant(newPlant, triggers);
  };

  // Перенос параметров растения из энциклопедии в форму ручной настройки
  const handleCustomizeEncyclopediaPlant = (item: EncyclopediaPlant) => {
    setName(item.name);
    setScientificName(item.scientificName);
    setFamilyId(item.familyId);
    setImageUrl(item.imageUrl);
    setWateringFrequencyDays(item.wateringFrequencyDays);
    setFertilizingFrequencyDays(item.fertilizingFrequencyDays);
    setLightRequirement(item.lightRequirement);
    setHumidityLevel(item.humidityLevel);
    setTemperatureRange(item.temperatureRange);
    setNotes(item.careGuide);
    setActiveMode('manual');
  };

  // Запуск ИИ-поиска регламента через GBIF API (Dio асинхронный запрос)
  const handleExecuteAiSearch = async () => {
    const query = encyclopediaSearchQuery.trim();
    if (!query) return;

    setIsAiSearching(true);
    setAiSearchError(null);
    setAiSearchResult(null);

    try {
      const result = await searchGbifApiWithAi(query);
      setAiSearchResult(result);
    } catch (err: any) {
      setAiSearchError('Не удалось получить таксономию от GBIF API. Проверьте запрос.');
    } finally {
      setIsAiSearching(false);
    }
  };

  // Обработка загрузки пользовательского файла с фото
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setValidationError('Пожалуйста, выберите файл изображения (JPG, PNG, WebP).');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setImageUrl(event.target.result);
        setShowPhotoPicker(false);
        setValidationError('');
      }
      setIsUploading(false);
    };
    reader.onerror = () => {
      setValidationError('Не удалось прочесть файл изображения.');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // Сохранение из ручной формы
  const handleSubmitManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setValidationError('Укажите название растения.');
      return;
    }

    const selectedFamily =
      initialRealmFamilies.find((f) => f.id === familyId) || initialRealmFamilies[0];
    const finalLocation = location === 'custom' ? customLocation || 'Дом' : location;

    const plantId = `plant_${Date.now()}`;
    const newPlant: Plant = {
      id: plantId,
      name: name.trim(),
      scientificName: scientificName.trim() || name.trim(),
      familyId: selectedFamily.id,
      familyName: selectedFamily.name,
      imageUrl,
      wateringFrequencyDays,
      fertilizingFrequencyDays,
      lastWateredDate,
      lastFertilizedDate: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
      lightRequirement,
      humidityLevel,
      temperatureRange,
      description: `${name}. Содержится в локации: ${finalLocation}.`,
      notes: notes.trim(),
      location: finalLocation,
    };

    // Генерируем напоминания
    const nextWaterDate = new Date(new Date(lastWateredDate).getTime() + wateringFrequencyDays * 86400000);
    const nextWaterDateStr = nextWaterDate.toISOString().split('T')[0];

    const triggers: NotificationTrigger[] = [
      {
        id: `trig_${Date.now()}_1`,
        plantId,
        plantName: newPlant.name,
        type: 'water',
        scheduledDate: nextWaterDateStr,
        title: `💧 Время полить ${newPlant.name}`,
        body: `Плановый полив по регламенту каждые ${wateringFrequencyDays} дн.`,
        isPending: true,
      },
    ];

    dispatchSavePlant(newPlant, triggers);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95">
        
        {/* Шапка модального окна */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center space-x-2">
                <span>Добавление растения</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Perenual API + Isar
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Умный поиск в энциклопедии, оптическое сканирование или ручной ввод
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Переключатель режимов (Табы) */}
        <div className="px-5 py-2.5 bg-slate-900/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-1.5 p-1 rounded-2xl bg-slate-950/70 border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveMode('encyclopedia')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeMode === 'encyclopedia'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Умный поиск в энциклопедии</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('manual')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeMode === 'manual'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Ручная форма и фото</span>
            </button>
          </div>

          {onOpenScanner && (
            <button
              type="button"
              onClick={onOpenScanner}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5 border border-slate-700 transition-all cursor-pointer"
            >
              <ScanLine className="w-3.5 h-3.5 text-emerald-400" />
              <span>Сканер ценника (OCR)</span>
            </button>
          )}
        </div>

        {/* Содержимое окна */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeMode === 'encyclopedia' ? (
            <div className="space-y-4">
              {/* Поисковая строка энциклопедии */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={encyclopediaSearchQuery}
                  onChange={(e) => {
                    setEncyclopediaSearchQuery(e.target.value);
                    setAiSearchResult(null);
                    setAiSearchError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleExecuteAiSearch();
                    }
                  }}
                  placeholder="Введите русское название (Монстера, Замиокулькас...), латынь или семейство..."
                  className="w-full text-xs sm:text-sm pl-10 pr-24 py-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
                />
                {encyclopediaSearchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setEncyclopediaSearchQuery('');
                      setAiSearchResult(null);
                      setAiSearchError(null);
                    }}
                    className="absolute right-12 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleExecuteAiSearch}
                  disabled={isAiSearching || !encyclopediaSearchQuery.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold flex items-center space-x-1 cursor-pointer transition-all"
                  title="ИИ-поиск в GBIF API"
                >
                  {isAiSearching ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Globe className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">GBIF Поиск</span>
                </button>
              </div>

              {/* Категории/теги фильтрации */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
                {ENCYCLOPEDIA_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Блок индикации ИИ-поиска (Gemini AI + GBIF REST) */}
              {isAiSearching && (
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 space-y-2 animate-pulse">
                  <div className="flex items-center space-x-2 text-xs font-bold text-emerald-300">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>Поиск: Gemini 3.1 Flash Lite (легкая модель) → Фото из сети → GBIF...</span>
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400/80 space-y-1">
                    <div className="text-amber-300/90">
                      ⚡ Шаг 1: Автоперевод названия "{encyclopediaSearchQuery}" на латынь (Gemini 3.1 Flash Lite без блокировки квот)
                    </div>
                    <div className="text-cyan-300/90">
                      📷 Шаг 2: Извлечение реальной фотографии цветка из открытого веб-поиска (Wikipedia/Wikimedia)
                    </div>
                    <div className="text-emerald-300/90">
                      🔬 Шаг 3: Верификация таксономии в GBIF API (api.gbif.org/v1/species/match) и расчет регламента
                    </div>
                  </div>
                </div>
              )}

              {/* Результат ИИ-поиска (если найден/сгенерирован) */}
              {aiSearchResult && !isAiSearching && (
                <div className="p-4 rounded-2xl bg-emerald-950/40 border-2 border-emerald-500/60 space-y-3 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                        Верифицировано в GBIF API + Регламент из Gemini API
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                        GBIF Taxon: #{aiSearchResult.gbifTaxonKey || aiSearchResult.id}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start space-x-3">
                      <img
                        src={aiSearchResult.imageUrl}
                        alt={aiSearchResult.name}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-700"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-bold text-slate-100">
                            {aiSearchResult.name}
                          </h4>
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-900/80 text-emerald-300 border border-emerald-700/60">
                            ✓ Латынь верифицирована
                          </span>
                        </div>
                        <p className="text-xs italic text-emerald-400 font-medium">
                          {aiSearchResult.scientificName} • {aiSearchResult.familyName}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800">
                            📷 Фото из веб-поиска
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-950 text-blue-300 border border-blue-800">
                            💧 Полив раз в {aiSearchResult.wateringFrequencyDays} дн.
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-800">
                            ☀️ {aiSearchResult.lightRequirement}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-teal-950 text-teal-300 border border-teal-800">
                            💨 {aiSearchResult.humidityLevel}%
                          </span>
                          {aiSearchResult.fertilizerRecommendation && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-800">
                              🧪 {aiSearchResult.fertilizerRecommendation}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleCustomizeEncyclopediaPlant(aiSearchResult)}
                        className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer transition-all"
                      >
                        Настроить
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDirectAddFromEncyclopedia(aiSearchResult)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-1.5 shadow-lg shadow-emerald-950/50 cursor-pointer transition-all"
                      >
                        <Check className="w-4 h-4" />
                        <span>Добавить в сад</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Список найденных растений из встроенной энциклопедии */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>
                    Найдено в энциклопедии: <strong className="text-slate-200">{searchResults.length}</strong> видов
                  </span>
                  {encyclopediaSearchQuery && (
                    <span className="text-[11px] text-slate-500">
                      По запросу «{encyclopediaSearchQuery}»
                    </span>
                  )}
                </div>

                {searchResults.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-slate-800/40 border border-slate-800 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                      <Search className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">
                        Растение «{encyclopediaSearchQuery}» не найдено в локальном каталоге
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                        Нажмите кнопку ниже, чтобы выполнить умный ИИ-поиск и запросить регламент ухода в глобальной ботанической базе Perenual API.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleExecuteAiSearch}
                      disabled={isAiSearching}
                      className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 cursor-pointer transition-all"
                    >
                      <Globe className="w-4 h-4" />
                      <span>ИИ-поиск регламента в Perenual API</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {searchResults.map((item) => {
                      const isExpanded = expandedPlantId === item.id;
                      return (
                        <div
                          key={item.id}
                          className="p-3.5 sm:p-4 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start space-x-3">
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-slate-700 shrink-0"
                              />
                              <div>
                                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                  <h4 className="text-sm font-bold text-slate-100">
                                    {item.name}
                                  </h4>
                                  <span
                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                      item.difficulty === 'Легкий'
                                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                        : item.difficulty === 'Средний'
                                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                                    }`}
                                  >
                                    {item.difficulty}
                                  </span>
                                </div>
                                <p className="text-xs italic text-slate-400 mt-0.5">
                                  {item.scientificName} • {item.familyName}
                                </p>

                                {/* Бейджи ухода */}
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-950/80 text-blue-300 border border-blue-900/60">
                                    💧 Полив: раз в {item.wateringFrequencyDays} дн.
                                  </span>
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-950/80 text-amber-300 border border-amber-900/60">
                                    ☀️ {item.lightRequirement}
                                  </span>
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-teal-950/80 text-teal-300 border border-teal-900/60">
                                    💨 {item.humidityLevel}%
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Кнопки действий */}
                            <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedPlantId(isExpanded ? null : item.id)
                                }
                                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 cursor-pointer transition-all"
                              >
                                {isExpanded ? 'Скрыть справку' : 'Справка'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCustomizeEncyclopediaPlant(item)}
                                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-700/80 hover:bg-slate-700 text-slate-200 cursor-pointer transition-all"
                              >
                                Настроить
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDirectAddFromEncyclopedia(item)}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-1 shadow-md shadow-emerald-950/50 cursor-pointer transition-all active:scale-95"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Добавить</span>
                              </button>
                            </div>
                          </div>

                          {/* Раскрывающаяся ботаническая справка */}
                          {isExpanded && (
                            <div className="pt-2 border-t border-slate-700/60 space-y-2 text-xs animate-in fade-in">
                              <p className="text-slate-300 leading-relaxed">
                                {item.description}
                              </p>
                              <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 text-[11px] space-y-1">
                                <div className="text-emerald-400 font-semibold flex items-center space-x-1">
                                  <Info className="w-3.5 h-3.5" />
                                  <span>Регламент ухода и содержания:</span>
                                </div>
                                <div className="text-slate-400">
                                  {item.careGuide}
                                </div>
                                {item.fertilizerRecommendation && (
                                  <div className="text-amber-300/90 pt-1">
                                    🌿 <strong>Рекомендуемое питание:</strong> {item.fertilizerRecommendation}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Ручная форма добавления с загрузкой своего фото */
            <form id="add-plant-form" onSubmit={handleSubmitManual} className="space-y-4">
              {validationError && (
                <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs rounded-xl">
                  ⚠️ {validationError}
                </div>
              )}

              {/* Блок фотографии растения */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Фотография растения
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-slate-800 border-2 border-slate-700 shrink-0">
                    <img
                      src={imageUrl}
                      alt="Предпросмотр фото"
                      className="w-full h-full object-cover"
                    />
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center space-x-1.5 cursor-pointer transition-all"
                      >
                        <Upload className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Загрузить свое фото</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowPhotoPicker(!showPhotoPicker)}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center space-x-1.5 cursor-pointer transition-all"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                        <span>Галерея пресетов</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Поддерживаются JPG, PNG, WebP или готовые пресеты высокого качества
                    </p>
                  </div>
                </div>

                {/* Галерея готовых фото */}
                {showPhotoPicker && (
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Выберите подходящую фотографию:</span>
                      <button
                        type="button"
                        onClick={() => setShowPhotoPicker(false)}
                        className="text-[11px] text-emerald-400 hover:underline"
                      >
                        Скрыть
                      </button>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {presetPlantPhotos.map((preset, idx) => (
                        <div
                          key={preset.url || idx}
                          onClick={() => {
                            setImageUrl(preset.url);
                            setShowPhotoPicker(false);
                          }}
                          className={`group relative rounded-xl overflow-hidden aspect-square border cursor-pointer transition-all ${
                            imageUrl === preset.url
                              ? 'border-emerald-500 ring-2 ring-emerald-500/40'
                              : 'border-slate-700 hover:border-slate-500'
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.label}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-black/70 p-1 text-[9px] text-center text-slate-200 truncate">
                            {preset.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Основные текстовые поля */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Название растения *
                    </label>
                    <button
                      type="button"
                      onClick={handleSmartAutoFill}
                      disabled={isAutoFilling || !name.trim()}
                      className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 cursor-pointer disabled:opacity-40 transition-colors"
                    >
                      {isAutoFilling ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                          <span>ИИ рассчитывает...</span>
                        </>
                      ) : autoFillSuccess ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-300">Готово!</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          <span>✨ ИИ-автозаполнение</span>
                        </>
                      )}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Например: Монстера Деликатесная"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Ботаническое имя (латынь)
                    </label>
                    <button
                      type="button"
                      onClick={handleSmartLatinTranslate}
                      disabled={isTranslatingLatin || !name.trim()}
                      className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 cursor-pointer disabled:opacity-40 transition-colors"
                      title="Определить строгое латинское научное название"
                    >
                      {isTranslatingLatin ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                          <span>Перевод...</span>
                        </>
                      ) : latinSuccess ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                          <span className="text-cyan-300">Найдено!</span>
                        </>
                      ) : (
                        <>
                          <Globe className="w-3 h-3" />
                          <span>⚡ Умная латынь</span>
                        </>
                      )}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={scientificName}
                    onChange={(e) => setScientificName(e.target.value)}
                    placeholder="Например: Monstera deliciosa"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 italic"
                  />
                  {latinBadge && (
                    <div className="mt-1 flex items-center space-x-1.5 text-[10px] text-cyan-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      <span className="truncate">GBIF таксономия: {latinBadge}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Семейство и Локация */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Семейство (Realm справочник)
                  </label>
                  <select
                    value={familyId}
                    onChange={(e) => setFamilyId(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    {initialRealmFamilies.map((family) => (
                      <option key={family.id} value={family.id}>
                        {family.name} ({family.nameLatin})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Расположение в доме
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    {COMMON_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                    <option value="custom">Другое место...</option>
                  </select>
                </div>
              </div>

              {location === 'custom' && (
                <div>
                  <input
                    type="text"
                    value={customLocation}
                    onChange={(e) => setCustomLocation(e.target.value)}
                    placeholder="Укажите комнату или место..."
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Параметры ухода */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    💧 Частота полива (дней)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={wateringFrequencyDays}
                    onChange={(e) => setWateringFrequencyDays(Number(e.target.value))}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    🌿 Подкормка (дней)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={fertilizingFrequencyDays}
                    onChange={(e) => setFertilizingFrequencyDays(Number(e.target.value))}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    ☀️ Освещение
                  </label>
                  <select
                    value={lightRequirement}
                    onChange={(e) => setLightRequirement(e.target.value as any)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Яркий рассеянный">Яркий рассеянный</option>
                    <option value="Полутень">Полутень</option>
                    <option value="Прямой солнечный">Прямой солнечный</option>
                    <option value="Теневыносливое">Теневыносливое</option>
                  </select>
                </div>
              </div>

              {/* Влажность и Дата последнего полива */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Влажность воздуха: {humidityLevel}%
                    </label>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="90"
                    step="5"
                    value={humidityLevel}
                    onChange={(e) => setHumidityLevel(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Дата последнего полива
                  </label>
                  <input
                    type="date"
                    value={lastWateredDate}
                    onChange={(e) => setLastWateredDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Заметки */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Заметки и рекомендации по уходу
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Особенности полива, субстрата, опрыскивания или пересадки..."
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </form>
          )}
        </div>

        {/* Футер */}
        <div className="px-5 py-3.5 border-t border-slate-800 flex items-center justify-between bg-slate-900/90 sticky bottom-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer transition-all"
          >
            Отмена
          </button>

          {activeMode === 'manual' ? (
            <button
              type="submit"
              form="add-plant-form"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-emerald-950/50 cursor-pointer transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Сохранить в сад (Isar)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveMode('manual')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 border border-slate-700 cursor-pointer transition-all"
            >
              <span>Заполнить вручную</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
