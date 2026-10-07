import React, { useState, useRef } from 'react';
import { Plant, PlantFamily } from '../types';
import { initialRealmFamilies, presetPlantPhotos } from '../data/plantData';
import {
  X,
  Upload,
  Image as ImageIcon,
  Droplet,
  Sun,
  Trash2,
  Check,
  MapPin,
  AlertTriangle,
  Sparkles,
  Loader2,
  CheckCircle2,
  Globe,
} from 'lucide-react';
import { generateSmartDescription, smartTranslateToLatin } from '../data/plantEncyclopedia';

interface EditPlantModalProps {
  plant: Plant;
  onClose: () => void;
  onSave: (updatedPlant: Plant) => void;
  onDelete: (plantId: string) => void;
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

export const EditPlantModal: React.FC<EditPlantModalProps> = ({
  plant,
  onClose,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState(plant.name);
  const [scientificName, setScientificName] = useState(plant.scientificName);
  const [familyId, setFamilyId] = useState(plant.familyId);
  const [location, setLocation] = useState(plant.location || 'Гостиная у окна');
  const [wateringFrequencyDays, setWateringFrequencyDays] = useState(
    plant.wateringFrequencyDays
  );
  const [fertilizingFrequencyDays, setFertilizingFrequencyDays] = useState(
    plant.fertilizingFrequencyDays
  );
  const [lightRequirement, setLightRequirement] = useState(plant.lightRequirement);
  const [humidityLevel, setHumidityLevel] = useState(plant.humidityLevel);
  const [temperatureRange, setTemperatureRange] = useState(plant.temperatureRange);
  const [notes, setNotes] = useState(plant.notes);
  const [imageUrl, setImageUrl] = useState(plant.imageUrl);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [autoFillSuccess, setAutoFillSuccess] = useState(false);
  const [isTranslatingLatin, setIsTranslatingLatin] = useState(false);
  const [latinSuccess, setLatinSuccess] = useState(false);
  const [latinBadge, setLatinBadge] = useState<string | null>(null);

  const handleSmartLatinTranslate = async () => {
    if (!name.trim()) return;
    setIsTranslatingLatin(true);
    try {
      const res = await smartTranslateToLatin(name.trim());
      if (res.canonicalLatin) {
        setScientificName(res.canonicalLatin);
        setLatinBadge(`${res.canonicalLatin} • ${res.familyRu}`);
        setLatinSuccess(true);
        setTimeout(() => setLatinSuccess(false), 3000);

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
    } catch (e) {
      console.warn('Smart Latin error:', e);
    } finally {
      setIsTranslatingLatin(false);
    }
  };

  const handleSmartAutoFill = async () => {
    if (!name.trim()) return;
    setIsAutoFilling(true);
    try {
      const latinResult = await smartTranslateToLatin(name.trim());
      if (latinResult.canonicalLatin) {
        setScientificName(latinResult.canonicalLatin);
        setLatinBadge(`${latinResult.canonicalLatin} • ${latinResult.familyRu}`);
        if (latinResult.familyRu) {
          const foundFam = initialRealmFamilies.find(
            (f) =>
              f.name.toLowerCase().includes(latinResult.familyRu.toLowerCase()) ||
              latinResult.familyRu.toLowerCase().includes(f.name.toLowerCase())
          );
          if (foundFam) setFamilyId(foundFam.id);
        }
      }

      const selectedFam = initialRealmFamilies.find((f) => f.id === familyId);
      const aiData = await generateSmartDescription(
        name.trim(),
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

      setAutoFillSuccess(true);
      setTimeout(() => setAutoFillSuccess(false), 3000);
    } catch (e) {
      console.warn('Smart auto-fill error:', e);
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setImageUrl(event.target.result);
        setShowPhotoPicker(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedFamily =
      initialRealmFamilies.find((f) => f.id === familyId) || initialRealmFamilies[0];

    const updated: Plant = {
      ...plant,
      name: name.trim(),
      scientificName: scientificName.trim(),
      familyId: selectedFamily.id,
      familyName: selectedFamily.name,
      imageUrl,
      location,
      wateringFrequencyDays,
      fertilizingFrequencyDays,
      lightRequirement,
      humidityLevel,
      temperatureRange,
      notes: notes.trim(),
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95">
        {/* Шапка */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
          <div>
            <h2 className="text-base font-bold text-slate-100">
              Редактирование растения
            </h2>
            <p className="text-xs text-slate-400">
              Обновите параметры ухода, фото или расположение
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Форма */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {showDeleteConfirm ? (
            <div className="p-5 rounded-2xl bg-red-950/40 border border-red-800/80 space-y-3 animate-in fade-in">
              <div className="flex items-center space-x-2 text-red-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span>Удалить «{plant.name}» из коллекции?</span>
              </div>
              <p className="text-xs text-slate-300">
                Это действие удалит карточку растения и его привязанные напоминания. Журнал ухода в локальной базе останется для истории.
              </p>
              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDelete(plant.id);
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white cursor-pointer shadow-md"
                >
                  Да, удалить растение
                </button>
              </div>
            </div>
          ) : (
            <form id="edit-plant-form" onSubmit={handleSubmit} className="space-y-5">
              {/* Фото и загрузка */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Фото растения
                </label>
                <div className="flex items-center space-x-4 p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800">
                  <img
                    src={imageUrl}
                    alt={name}
                    className="w-20 h-20 rounded-xl object-cover border border-slate-700 shadow-md"
                  />
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Сменить фото</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPhotoPicker(!showPhotoPicker)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer border border-slate-700"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Выбрать из галереи</span>
                      </button>
                    </div>
                  </div>
                </div>

                {showPhotoPicker && (
                  <div className="mt-3 p-3 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2 animate-in fade-in">
                    <div className="text-[11px] font-semibold text-slate-300">
                      Выберите фото:
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {presetPlantPhotos.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setImageUrl(item.url);
                            setShowPhotoPicker(false);
                          }}
                          className={`aspect-square rounded-xl overflow-hidden border-2 cursor-pointer ${
                            imageUrl === item.url
                              ? 'border-emerald-500 ring-2 ring-emerald-500/40'
                              : 'border-slate-700'
                          }`}
                        >
                          <img
                            src={item.url}
                            alt={item.label}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Название */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Название *
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
                          <span>ИИ обновляет...</span>
                        </>
                      ) : autoFillSuccess ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-300">Обновлено!</span>
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
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Ботаническое название (латынь)
                    </label>
                    <button
                      type="button"
                      onClick={handleSmartLatinTranslate}
                      disabled={isTranslatingLatin || !name.trim()}
                      className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 cursor-pointer disabled:opacity-40 transition-colors"
                      title="Определить точную латынь"
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
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500 italic"
                  />
                  {latinBadge && (
                    <div className="mt-1 flex items-center space-x-1.5 text-[10px] text-cyan-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      <span className="truncate">GBIF таксономия: {latinBadge}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Семейство и Расположение */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Семейство
                  </label>
                  <select
                    value={familyId}
                    onChange={(e) => setFamilyId(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {initialRealmFamilies.map((fam) => (
                      <option key={fam.id} value={fam.id}>
                        {fam.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Расположение
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {COMMON_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Интервал полива */}
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                    <Droplet className="w-3.5 h-3.5 text-blue-400" />
                    <span>Интервал полива</span>
                  </span>
                  <span className="text-xs font-bold text-blue-400 bg-blue-950/60 px-2.5 py-0.5 rounded-lg border border-blue-800/50">
                    Каждые {wateringFrequencyDays} дн.
                  </span>
                </div>

                <input
                  type="range"
                  min="1"
                  max="30"
                  value={wateringFrequencyDays}
                  onChange={(e) => setWateringFrequencyDays(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Заметки */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Заметки по уходу
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </form>
          )}
        </div>

        {/* Футер */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/90">
          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/40 cursor-pointer transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>Удалить растение</span>
            </button>
          ) : (
            <div />
          )}

          {!showDeleteConfirm && (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="submit"
                form="edit-plant-form"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Сохранить</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
