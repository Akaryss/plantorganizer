import React, { useState } from 'react';
import { Plant, PlantFamily, FertilizerType, EncyclopediaPlant } from '../types';
import { initialRealmFamilies, initialRealmFertilizers } from '../data/plantData';
import {
  ENCYCLOPEDIA_PLANTS,
  ENCYCLOPEDIA_CATEGORIES,
  searchEncyclopedia,
} from '../data/plantEncyclopedia';
import {
  BookOpen,
  Leaf,
  FlaskConical,
  Sun,
  Droplets,
  Wind,
  Search,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  Sparkles,
  Plus,
  Info,
  Layers,
} from 'lucide-react';

interface EncyclopediaViewProps {
  plants: Plant[];
  onFilterByFamily: (familyId: string) => void;
  onAddPlantDirectly?: (item: EncyclopediaPlant) => void;
}

export const EncyclopediaView: React.FC<EncyclopediaViewProps> = ({
  plants,
  onFilterByFamily,
  onAddPlantDirectly,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'species' | 'families' | 'fertilizers' | 'climate'>('species');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFamily, setSelectedFamily] = useState<PlantFamily | null>(initialRealmFamilies[0]);
  const [expandedSpeciesId, setExpandedSpeciesId] = useState<string | null>(null);

  // Фильтрация видов растений
  const filteredSpecies = searchEncyclopedia(searchQuery, selectedCategory);

  // Фильтрация семейств
  const filteredFamilies = initialRealmFamilies.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.nameLatin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Фильтрация удобрений
  const filteredFertilizers = initialRealmFertilizers.filter(
    (fert) =>
      fert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fert.composition.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fert.season.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Заголовок раздела */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2.5">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <span>Ботаническая энциклопедия и справочник</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Каталог видов с регламентами ухода, справочник семейств Realm и нормы микроклимата
          </p>
        </div>

        {/* Под-вкладки */}
        <div className="flex items-center space-x-1 p-1 rounded-2xl bg-slate-900 border border-slate-800 self-start sm:self-auto overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('species')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'species'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Виды растений ({ENCYCLOPEDIA_PLANTS.length})
          </button>
          <button
            onClick={() => setActiveSubTab('families')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'families'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Семейства Realm ({initialRealmFamilies.length})
          </button>
          <button
            onClick={() => setActiveSubTab('fertilizers')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'fertilizers'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Удобрения ({initialRealmFertilizers.length})
          </button>
          <button
            onClick={() => setActiveSubTab('climate')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'climate'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Микроклимат
          </button>
        </div>
      </div>

      {/* Поисковая строка */}
      {activeSubTab !== 'climate' && (
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeSubTab === 'species'
                  ? 'Поиск вида по названию (Монстера, Замиокулькас...), латыни, тегам...'
                  : activeSubTab === 'families'
                  ? 'Поиск семейства по названию или латыни...'
                  : 'Поиск удобрения или состава NPK...'
              }
              className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {activeSubTab === 'species' && (
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
              {ENCYCLOPEDIA_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Вкладка 0: Каталог видов растений */}
      {activeSubTab === 'species' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-400">
            Отображено видов: <strong className="text-slate-200">{filteredSpecies.length}</strong> из {ENCYCLOPEDIA_PLANTS.length}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredSpecies.map((species) => {
              const isExpanded = expandedSpeciesId === species.id;
              const inGarden = plants.some((p) => p.name.toLowerCase().includes(species.name.toLowerCase().split(' ')[0]));

              return (
                <div
                  key={species.id}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                >
                  <div className="flex items-start space-x-3.5">
                    <img
                      src={species.imageUrl}
                      alt={species.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-slate-800 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-bold text-sm text-slate-100 truncate">
                          {species.name}
                        </h4>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                            species.difficulty === 'Легкий'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : species.difficulty === 'Средний'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}
                        >
                          {species.difficulty}
                        </span>
                      </div>

                      <div className="text-xs italic text-slate-400 truncate">
                        {species.scientificName} • {species.familyName}
                      </div>

                      <div className="flex flex-wrap gap-1 mt-2">
                        {species.gbifTaxonKey && (
                          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800/80">
                            GBIF #{species.gbifTaxonKey}
                          </span>
                        )}
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-blue-950 text-blue-300 border border-blue-900/60">
                          💧 {species.wateringFrequencyDays} дн.
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-900/60">
                          ☀️ {species.lightRequirement}
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-teal-950 text-teal-300 border border-teal-900/60">
                          💨 {species.humidityLevel}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {species.description}
                  </p>

                  {/* Дополнительная справка */}
                  {isExpanded && (
                    <div className="pt-2 border-t border-slate-800 space-y-2 text-xs animate-in fade-in">
                      <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1 text-[11px]">
                        <div className="text-emerald-400 font-semibold">
                          📋 Регламент полива и содержания:
                        </div>
                        <div className="text-slate-300">
                          {species.careGuide}
                        </div>
                        {species.nativeTo && (
                          <div className="text-slate-400 pt-1">
                            📍 <strong>Ареал обитания:</strong> {species.nativeTo}
                          </div>
                        )}
                        {species.fertilizerRecommendation && (
                          <div className="text-amber-300/90 pt-1">
                            🌿 <strong>Рекомендуемое питание:</strong> {species.fertilizerRecommendation}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Футер карточки */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setExpandedSpeciesId(isExpanded ? null : species.id)}
                      className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {isExpanded ? 'Скрыть подробности' : 'Подробнее об уходе'}
                    </button>

                    {onAddPlantDirectly && (
                      <button
                        type="button"
                        onClick={() => onAddPlantDirectly(species)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                          inGarden
                            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/50'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{inGarden ? 'Добавить ещё' : 'Добавить в сад'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Вкладка 1: Семейства растений */}
      {activeSubTab === 'families' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Список семейств */}
          <div className="lg:col-span-1 space-y-2.5">
            {filteredFamilies.map((fam) => {
              const myPlantsCount = plants.filter((p) => p.familyId === fam.id).length;
              const isSelected = selectedFamily?.id === fam.id;

              return (
                <button
                  key={fam.id}
                  onClick={() => setSelectedFamily(fam)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-emerald-500 ring-1 ring-emerald-500/40 shadow-lg'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Leaf className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-xs text-slate-200 truncate">
                        {fam.name}
                      </div>
                      <div className="text-[11px] text-slate-500 italic truncate">
                        {fam.nameLatin}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 ml-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      В саду: {myPlantsCount}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Детальная карточка семейства */}
          <div className="lg:col-span-2">
            {selectedFamily ? (
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Leaf className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-100">
                        {selectedFamily.name}
                      </h3>
                      <p className="text-xs text-slate-500 italic">
                        {selectedFamily.nameLatin}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onFilterByFamily(selectedFamily.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 text-xs font-semibold flex items-center space-x-1.5 border border-emerald-500/30 cursor-pointer"
                  >
                    <span>Растения в саду</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Ботаническое описание и ареал:
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
                    {selectedFamily.description}
                  </p>
                </div>

                {/* Растения этого семейства в саду пользователя */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Экземпляры в вашей коллекции:
                  </h4>
                  {plants.filter((p) => p.familyId === selectedFamily.id).length === 0 ? (
                    <div className="p-4 rounded-2xl bg-slate-800/20 border border-slate-800 text-center text-xs text-slate-500">
                      У вас пока нет добавленных растений из этого семейства
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {plants
                        .filter((p) => p.familyId === selectedFamily.id)
                        .map((plant) => (
                          <div
                            key={plant.id}
                            className="p-3 rounded-2xl bg-slate-800/60 border border-slate-800 flex items-center space-x-3"
                          >
                            <img
                              src={plant.imageUrl}
                              alt={plant.name}
                              className="w-12 h-12 rounded-xl object-cover"
                            />
                            <div className="min-w-0">
                              <h5 className="font-bold text-xs text-slate-200 truncate">
                                {plant.name}
                              </h5>
                              <p className="text-[11px] text-slate-400 italic truncate">
                                {plant.scientificName}
                              </p>
                              <span className="text-[10px] text-emerald-400">
                                Полив раз в {plant.wateringFrequencyDays} дн.
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-3xl border border-slate-800">
                Выберите семейство из списка
              </div>
            )}
          </div>
        </div>
      )}

      {/* Вкладка 2: Удобрения */}
      {activeSubTab === 'fertilizers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFertilizers.map((fert) => (
            <div
              key={fert.id}
              className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 hover:border-slate-700 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <FlaskConical className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-100">
                      {fert.name}
                    </h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {fert.season}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block mb-0.5">
                    Химический состав и пропорции:
                  </span>
                  <div className="p-2.5 rounded-xl bg-slate-800/60 font-mono text-[11px] text-slate-300 border border-slate-800">
                    {fert.composition}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block mb-0.5">
                    Рекомендованные культуры:
                  </span>
                  <p className="text-slate-300 text-xs">
                    {fert.frequencyNote}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Вкладка 3: Микроклимат */}
      {activeSubTab === 'climate' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sun className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100">
              Освещение и инсоляция
            </h3>
            <ul className="space-y-2 text-xs text-slate-300 leading-relaxed">
              <li className="p-2.5 rounded-xl bg-slate-800/50">
                <strong className="text-amber-300 block mb-0.5">Южные окна:</strong>
                Обилие солнца (кактусы, суккуленты). Летом в полдень лиственные виды требуют притенения тюлем.
              </li>
              <li className="p-2.5 rounded-xl bg-slate-800/50">
                <strong className="text-amber-300 block mb-0.5">Восточные / Западные:</strong>
                Идеальный рассеянный свет для 90% комнатных видов (монстеры, фикусы, калатеи).
              </li>
              <li className="p-2.5 rounded-xl bg-slate-800/50">
                <strong className="text-amber-300 block mb-0.5">Северные окна:</strong>
                Мягкий свет для теневыносливых растений (сансевиерия, замиокулькас, плющ).
              </li>
            </ul>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Droplets className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100">
              Влажность воздуха
            </h3>
            <ul className="space-y-2 text-xs text-slate-300 leading-relaxed">
              <li className="p-2.5 rounded-xl bg-slate-800/50">
                <strong className="text-blue-300 block mb-0.5">Сухой воздух (20-40%):</strong>
                Типичен зимой при работающем отоплении. Провоцирует усыхание кончиков листьев и паутинного клеща.
              </li>
              <li className="p-2.5 rounded-xl bg-slate-800/50">
                <strong className="text-blue-300 block mb-0.5">Оптимум (55-70%):</strong>
                Достигается ультразвуковым увлажнителем или группировкой растений вместе на широком поддоне с керамзитом.
              </li>
              <li className="p-2.5 rounded-xl bg-slate-800/50">
                <strong className="text-blue-300 block mb-0.5">Опрыскивание:</strong>
                Проводить мягкой водой комнатной температуры утром, чтобы влага успела испариться до ночного похолодания.
              </li>
            </ul>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Wind className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100">
              Температура и сквозняки
            </h3>
            <ul className="space-y-2 text-xs text-slate-300 leading-relaxed">
              <li className="p-2.5 rounded-xl bg-slate-800/50">
                <strong className="text-emerald-300 block mb-0.5">Комфорт (18-24 °C):</strong>
                Стабильная температура без резких перепадов. Фикусы особенно не любят холодный пол или сквозняки.
              </li>
              <li className="p-2.5 rounded-xl bg-slate-800/50">
                <strong className="text-emerald-300 block mb-0.5">Зимний период:</strong>
                Отодвигайте горшки от ледяных стекол и радиаторов отопления.
              </li>
              <li className="p-2.5 rounded-xl bg-slate-800/50">
                <strong className="text-emerald-300 block mb-0.5">Проветривание:</strong>
                При зимнем проветривании укрывайте тропические виды бумажным колпаком.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
