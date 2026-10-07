import React, { useState } from 'react';
import { Plant, CareLog, NotificationTrigger, PlantFamily, FertilizerType } from '../types';
import { Database, Layers, Table, Bell, Sparkles, BookOpen, Key, Link2, CheckCircle2 } from 'lucide-react';

interface DatabaseInspectorProps {
  plants: Plant[];
  logs: CareLog[];
  triggers: NotificationTrigger[];
  families: PlantFamily[];
  fertilizers: FertilizerType[];
}

export const DatabaseInspector: React.FC<DatabaseInspectorProps> = ({
  plants,
  logs,
  triggers,
  families,
  fertilizers,
}) => {
  const [activeDb, setActiveDb] = useState<'isar' | 'realm'>('isar');
  const [activeIsarCollection, setActiveIsarCollection] = useState<'plants' | 'logs' | 'triggers'>('plants');
  const [activeRealmCollection, setActiveRealmCollection] = useState<'families' | 'fertilizers'>('families');

  return (
    <div className="space-y-6">
      {/* Шапка раздела архитектуры данных */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <Database className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Двухуровневая модель хранения данных (ТЗ Вариант 7)
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Реляционная основная БД (Isar) со связями 1-ко-многим и вспомогательное объектное хранилище (Realm SDK)
            </p>
          </div>

          {/* Переключатель БД */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button
              onClick={() => setActiveDb('isar')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeDb === 'isar'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Основная БД: Isar (NoSQL/Relational)</span>
            </button>
            <button
              onClick={() => setActiveDb('realm')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeDb === 'realm'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Справочники: Realm SDK (Статические)</span>
            </button>
          </div>
        </div>

        {/* Сравнительная архитектурная плашка */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className={`p-4 rounded-2xl border transition-all ${activeDb === 'isar' ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-slate-800'}`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-1.5">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>Isar Database (Дроп-ин замена SQLite/SwiftData)</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                Rust-core • ACIDs
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
              Хранит изменяемые пользовательские данные: сущности растений, журнал поливов (IsarLinks 1-to-many), триггеры уведомлений. Генерирует реактивные Streams для BLoC/Cubit.
            </p>
          </div>

          <div className={`p-4 rounded-2xl border transition-all ${activeDb === 'realm' ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-slate-800'}`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-teal-600" />
                <span>Realm SDK (Справочное хранилище)</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-teal-200/60 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 text-[10px] font-bold">
                Zero-Copy • Read-Only
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
              Хранит базовый неизменяемый справочник по ботаническим семействам растений и спецификации типов удобрений. Векторизованный поиск и сверхбыстрое чтение.
            </p>
          </div>
        </div>
      </div>

      {/* Просмотр таблиц Isar */}
      {activeDb === 'isar' ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-4">
            <button
              onClick={() => setActiveIsarCollection('plants')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeIsarCollection === 'plants'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Таблица: PlantEntity ({plants.length})
            </button>
            <button
              onClick={() => setActiveIsarCollection('logs')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeIsarCollection === 'logs'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Таблица: CareLogEntity ({logs.length})
            </button>
            <button
              onClick={() => setActiveIsarCollection('triggers')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeIsarCollection === 'triggers'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Таблица: NotificationTriggerEntity ({triggers.length})
            </button>
          </div>

          {activeIsarCollection === 'plants' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    <th className="py-2.5 px-3 font-semibold">Id (PK)</th>
                    <th className="py-2.5 px-3 font-semibold">Название</th>
                    <th className="py-2.5 px-3 font-semibold">Семейство (Realm FK)</th>
                    <th className="py-2.5 px-3 font-semibold">Интервал полива</th>
                    <th className="py-2.5 px-3 font-semibold">Последний полив</th>
                    <th className="py-2.5 px-3 font-semibold">Связи IsarLinks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                  {plants.map((plant) => {
                    const plantLogsCount = logs.filter((l) => l.plantId === plant.id).length;
                    return (
                      <tr key={plant.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 text-emerald-600 font-bold">{plant.id}</td>
                        <td className="py-2.5 px-3 font-sans font-semibold text-slate-900 dark:text-slate-100">
                          {plant.name}
                          <div className="text-[10px] text-slate-400 font-normal italic">{plant.scientificName}</div>
                        </td>
                        <td className="py-2.5 px-3 font-sans">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]">
                            {plant.familyId} ({plant.familyName})
                          </span>
                        </td>
                        <td className="py-2.5 px-3">{plant.wateringFrequencyDays} дней</td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{plant.lastWateredDate}</td>
                        <td className="py-2.5 px-3 font-sans">
                          <span className="inline-flex items-center space-x-1 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                            <Link2 className="w-3 h-3" />
                            <span>IsarLinks ({plantLogsCount} записей)</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeIsarCollection === 'logs' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    <th className="py-2.5 px-3 font-semibold">Id</th>
                    <th className="py-2.5 px-3 font-semibold">plantId (Backlink)</th>
                    <th className="py-2.5 px-3 font-semibold">Тип процедуры</th>
                    <th className="py-2.5 px-3 font-semibold">Дата</th>
                    <th className="py-2.5 px-3 font-semibold">Заметка / Удобрение</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 text-emerald-600">{log.id}</td>
                      <td className="py-2.5 px-3 text-blue-600">{log.plantId}</td>
                      <td className="py-2.5 px-3 font-sans font-semibold">
                        <span className="uppercase text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                          {log.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">{log.date}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-300">
                        {log.fertilizerName && <span className="text-amber-600 font-medium">[{log.fertilizerName}] </span>}
                        {log.notes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeIsarCollection === 'triggers' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    <th className="py-2.5 px-3 font-semibold">Id</th>
                    <th className="py-2.5 px-3 font-semibold">Растение</th>
                    <th className="py-2.5 px-3 font-semibold">Дата сработки</th>
                    <th className="py-2.5 px-3 font-semibold">Заголовок push-уведомления</th>
                    <th className="py-2.5 px-3 font-semibold">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                  {triggers.map((trigger) => (
                    <tr key={trigger.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 text-emerald-600">{trigger.id}</td>
                      <td className="py-2.5 px-3 font-sans font-semibold">{trigger.plantName}</td>
                      <td className="py-2.5 px-3 text-amber-600">{trigger.scheduledDate} 09:00</td>
                      <td className="py-2.5 px-3 font-sans text-slate-700 dark:text-slate-200">{trigger.title}</td>
                      <td className="py-2.5 px-3 font-sans">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${trigger.isPending ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                          {trigger.isPending ? 'В очереди (Pending)' : 'Отправлено'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Просмотр справочников Realm */
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-4">
            <button
              onClick={() => setActiveRealmCollection('families')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeRealmCollection === 'families'
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Справочник: Семейства растений ({families.length})
            </button>
            <button
              onClick={() => setActiveRealmCollection('fertilizers')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeRealmCollection === 'fertilizers'
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Справочник: Типы удобрений ({fertilizers.length})
            </button>
          </div>

          {activeRealmCollection === 'families' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {families.map((family) => (
                <div key={family.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {family.name}
                    </span>
                    <span className="text-xs font-mono text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-md">
                      {family.id}
                    </span>
                  </div>
                  <div className="text-xs italic text-slate-400 mt-0.5">{family.nameLatin}</div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    {family.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {fertilizers.map((fert) => (
                <div key={fert.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {fert.name}
                    </span>
                    <span className="text-xs font-mono text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
                      {fert.id}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-1">
                    Состав: <span className="text-slate-500">{fert.composition}</span>
                  </div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                    Сезонность: {fert.season}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
