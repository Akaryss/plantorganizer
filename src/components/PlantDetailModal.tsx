import React, { useState } from 'react';
import { Plant, CareLog, CareType, FertilizerType } from '../types';
import {
  X,
  Droplet,
  Sun,
  Wind,
  Thermometer,
  Sparkles,
  RefreshCw,
  Plus,
  Clock,
  Calendar,
  FileText,
  Info,
  Check,
  History,
} from 'lucide-react';
import { getWateringStatus } from './PlantCard';

interface PlantDetailModalProps {
  plant: Plant;
  logs: CareLog[];
  fertilizers: FertilizerType[];
  onClose: () => void;
  onAddCareLog: (plantId: string, type: CareType, notes?: string, fertilizerName?: string) => void;
  onWater: (plantId: string) => void;
}

export const PlantDetailModal: React.FC<PlantDetailModalProps> = ({
  plant,
  logs,
  fertilizers,
  onClose,
  onAddCareLog,
  onWater,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'journal'>('info');
  const [showAddLogModal, setShowAddLogModal] = useState(false);
  const [newLogType, setNewLogType] = useState<CareType>('water');
  const [newLogNotes, setNewLogNotes] = useState('');
  const [selectedFertilizer, setSelectedFertilizer] = useState(fertilizers[0]?.name || '');

  const plantLogs = logs.filter((log) => log.plantId === plant.id);
  const statusInfo = getWateringStatus(plant);

  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();
    onAddCareLog(
      plant.id,
      newLogType,
      newLogNotes,
      newLogType === 'fertilize' ? selectedFertilizer : undefined
    );
    setNewLogNotes('');
    setShowAddLogModal(false);
  };

  const getLogTypeBadge = (type: CareType) => {
    switch (type) {
      case 'water':
        return { label: 'Полив', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300', icon: Droplet };
      case 'fertilize':
        return { label: 'Подкормка', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300', icon: Sparkles };
      case 'repot':
        return { label: 'Пересадка', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300', icon: RefreshCw };
      case 'mist':
        return { label: 'Опрыскивание', color: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300', icon: Wind };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Заголовок с фото и кнопкой закрытия */}
        <div className="relative h-56 sm:h-64 w-full flex-shrink-0 bg-slate-800">
          <img
            src={plant.imageUrl}
            alt={plant.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

          {/* Кнопка закрытия */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-sm transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Заголовок на картинке */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500 text-slate-950">
                {plant.familyName}
              </span>
              {plant.gbifTaxonKey && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-slate-900/80 text-emerald-300 border border-emerald-500/40">
                  GBIF #{plant.gbifTaxonKey}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1.5">
              {plant.name}
            </h2>
            <p className="text-xs sm:text-sm italic text-slate-300">
              {plant.scientificName}
            </p>
          </div>
        </div>

        {/* Табы: Ботаническая справка vs Журнал ухода */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 pt-3 bg-slate-50/70 dark:bg-slate-900/50">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex items-center space-x-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'info'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>Условия содержания</span>
          </button>

          <button
            onClick={() => setActiveTab('journal')}
            className={`flex items-center space-x-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'journal'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Журнал ухода ({plantLogs.length})</span>
          </button>
        </div>

        {/* Контент табов */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {activeTab === 'info' ? (
            <>
              {/* Сетка условий содержания (ТЗ Вариант 7: свет, влажность, температура) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40">
                  <div className="flex items-center space-x-1.5 text-amber-600 dark:text-amber-400 text-xs font-semibold mb-1">
                    <Sun className="w-4 h-4" />
                    <span>Освещение</span>
                  </div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {plant.lightRequirement}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/40">
                  <div className="flex items-center space-x-1.5 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-1">
                    <Droplet className="w-4 h-4" />
                    <span>Полив</span>
                  </div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    Раз в {plant.wateringFrequencyDays} дн.
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200/70 dark:border-teal-900/40">
                  <div className="flex items-center space-x-1.5 text-teal-600 dark:text-teal-400 text-xs font-semibold mb-1">
                    <Wind className="w-4 h-4" />
                    <span>Влажность</span>
                  </div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {plant.humidityLevel}% (оптимум)
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40">
                  <div className="flex items-center space-x-1.5 text-rose-600 dark:text-rose-400 text-xs font-semibold mb-1">
                    <Thermometer className="w-4 h-4" />
                    <span>Температура</span>
                  </div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {plant.temperatureRange}
                  </div>
                </div>
              </div>

              {/* Текущее состояние полива */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Статус регламента полива:
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    {statusInfo.label}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Последний полив: {plant.lastWateredDate}
                  </div>
                </div>
                <button
                  onClick={() => onWater(plant.id)}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-700/20"
                >
                  <Droplet className="w-4 h-4" />
                  <span>Полить сейчас</span>
                </button>
              </div>

              {/* Ботаническое описание */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2">
                  Энциклопедическое описание
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/50 dark:bg-slate-800/30 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  {plant.description}
                </p>
              </div>

              {/* Рекомендации по уходу */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2">
                  Совет эксперта по содержанию
                </h4>
                <div className="text-xs text-emerald-900 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                  💡 {plant.notes}
                </div>
              </div>
            </>
          ) : (
            /* Журнал ухода (CareLog) */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  История процедур
                </span>
                <button
                  onClick={() => setShowAddLogModal(true)}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Добавить запись</span>
                </button>
              </div>

              {plantLogs.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  Записей ухода пока нет. Нажмите «Добавить запись» или «Полить сейчас».
                </div>
              ) : (
                <div className="space-y-2.5">
                  {plantLogs.map((log) => {
                    const badge = getLogTypeBadge(log.type);
                    const IconComp = badge.icon;
                    return (
                      <div
                        key={log.id}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-start space-x-3"
                      >
                        <div className={`p-2 rounded-xl ${badge.color}`}>
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              {badge.label}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {log.date}
                            </span>
                          </div>
                          {log.fertilizerName && (
                            <div className="text-xs font-medium text-amber-600 dark:text-amber-400 mt-0.5">
                              Удобрение: {log.fertilizerName}
                            </div>
                          )}
                          {log.notes && (
                            <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                              {log.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Модальное окно добавления записи в журнал ухода */}
        {showAddLogModal && (
          <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/90 animate-in slide-in-from-bottom-4">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3">
              Новая запись в журнал ухода
            </h4>
            <form onSubmit={handleSaveLog} className="space-y-3">
              <div className="grid grid-cols-4 gap-2">
                {(['water', 'fertilize', 'repot', 'mist'] as CareType[]).map((type) => {
                  const badge = getLogTypeBadge(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewLogType(type)}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border text-center transition-all ${
                        newLogType === type
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {badge.label}
                    </button>
                  );
                })}
              </div>

              {newLogType === 'fertilize' && (
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Тип удобрения
                  </label>
                  <select
                    value={selectedFertilizer}
                    onChange={(e) => setSelectedFertilizer(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    {fertilizers.map((f) => (
                      <option key={f.id} value={f.name}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Заметка (дозировка, объем воды, самочувствие)
                </label>
                <input
                  type="text"
                  value={newLogNotes}
                  onChange={(e) => setNewLogNotes(e.target.value)}
                  placeholder="Например: полив 350 мл отстоянной водой, осмотр листьев"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddLogModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:text-slate-400 cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer"
                >
                  Сохранить запись
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
