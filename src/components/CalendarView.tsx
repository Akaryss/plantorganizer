import React, { useState } from 'react';
import { Plant, CareType } from '../types';
import {
  Calendar as CalendarIcon,
  Droplet,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Check,
  CalendarDays,
  Filter,
} from 'lucide-react';

interface CalendarViewProps {
  plants: Plant[];
  onWaterPlant: (plantId: string) => void;
  onFertilizePlant?: (plantId: string) => void;
  onSelectPlant: (plant: Plant) => void;
}

interface DayEvent {
  plant: Plant;
  type: CareType;
  label: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  plants,
  onWaterPlant,
  onFertilizePlant,
  onSelectPlant,
}) => {
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [filterType, setFilterType] = useState<'all' | 'water' | 'fertilize'>('all');
  const [viewMode, setViewMode] = useState<'strip' | 'month'>('strip');
  const [monthOffset, setMonthOffset] = useState(0);

  const todayStr = new Date().toISOString().split('T')[0];

  // Генерация полосы дней (14 дней: 4 назад, 10 вперед)
  const generateDateStrip = () => {
    const days = [];
    const base = new Date();
    for (let i = -4; i <= 10; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const daysStrip = generateDateStrip();

  // Расчет событий для даты
  const getEventsForDate = (dateStr: string): DayEvent[] => {
    const events: DayEvent[] = [];
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);

    plants.forEach((plant) => {
      // 1. Полив
      const lastWatered = new Date(plant.lastWateredDate);
      lastWatered.setHours(0, 0, 0, 0);
      const nextWaterDate = new Date(lastWatered);
      nextWaterDate.setDate(lastWatered.getDate() + plant.wateringFrequencyDays);

      if (nextWaterDate.toISOString().split('T')[0] === dateStr) {
        events.push({
          plant,
          type: 'water',
          label: 'Полив почвы',
        });
      }

      // 2. Подкормка
      if (plant.lastFertilizedDate) {
        const lastFert = new Date(plant.lastFertilizedDate);
        lastFert.setHours(0, 0, 0, 0);
        const nextFertDate = new Date(lastFert);
        nextFertDate.setDate(lastFert.getDate() + plant.fertilizingFrequencyDays);

        if (nextFertDate.toISOString().split('T')[0] === dateStr) {
          events.push({
            plant,
            type: 'fertilize',
            label: 'Внесение удобрения',
          });
        }
      }
    });

    return events;
  };

  const selectedEvents = getEventsForDate(selectedDateStr).filter((e) => {
    if (filterType === 'all') return true;
    return e.type === filterType;
  });

  // Генерация сетки месяца
  const generateMonthDays = () => {
    const now = new Date();
    const currentMonthDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();

    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Понедельник = 0
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Дни предыдущего месяца
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    // Дни текущего месяца
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const d = new Date(year, month, day);
      days.push(d);
    }
    return { days, currentMonthDate };
  };

  const { days: monthDays, currentMonthDate } = generateMonthDays();

  return (
    <div className="space-y-6">
      {/* Шапка календаря */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2.5">
            <CalendarIcon className="w-5 h-5 text-emerald-400" />
            <span>Календарь процедур</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            График поливов и подкормок на основе индивидуальных регламентов растений
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Переключатель вида */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setViewMode('strip')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'strip'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2 недели
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Месяц
            </button>
          </div>

          <button
            onClick={() => {
              setSelectedDateStr(todayStr);
              setMonthOffset(0);
            }}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer"
          >
            Сегодня
          </button>
        </div>
      </div>

      {/* Основной блок календаря */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 shadow-sm">
        {viewMode === 'strip' ? (
          /* Полоса дат */
          <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-thin">
            {daysStrip.map((day) => {
              const dateStr = day.toISOString().split('T')[0];
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDateStr;
              const events = getEventsForDate(dateStr);
              const hasWater = events.some((e) => e.type === 'water');
              const hasFert = events.some((e) => e.type === 'fertilize');

              const weekday = day.toLocaleDateString('ru-RU', { weekday: 'short' });
              const dayNum = day.getDate();

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDateStr(dateStr)}
                  className={`flex-shrink-0 w-16 py-3 px-1 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50 scale-105'
                      : isToday
                      ? 'bg-emerald-950/30 border border-emerald-500/50 text-slate-100'
                      : 'bg-slate-800/60 border border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider ${
                      isSelected ? 'text-emerald-100' : 'text-slate-400'
                    }`}
                  >
                    {weekday}
                  </span>
                  <span className="text-base font-bold my-1">{dayNum}</span>

                  <div className="flex items-center space-x-1 h-2">
                    {hasWater && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-white' : 'bg-blue-400'
                        }`}
                      />
                    )}
                    {hasFert && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-amber-200' : 'bg-amber-400'
                        }`}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          /* Вид полного месяца */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-200 capitalize">
                {currentMonthDate.toLocaleDateString('ru-RU', {
                  month: 'long',
                  year: 'numeric',
                })}
              </span>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setMonthOffset((prev) => prev - 1)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setMonthOffset((prev) => prev + 1)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center">
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => (
                <div key={d} className="text-[11px] font-bold text-slate-500 py-1">
                  {d}
                </div>
              ))}

              {monthDays.map((day, idx) => {
                if (!day) {
                  return <div key={`empty-${idx}`} className="h-12" />;
                }

                const dateStr = day.toISOString().split('T')[0];
                const isSelected = dateStr === selectedDateStr;
                const isToday = dateStr === todayStr;
                const events = getEventsForDate(dateStr);
                const hasWater = events.some((e) => e.type === 'water');
                const hasFert = events.some((e) => e.type === 'fertilize');

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDateStr(dateStr)}
                    className={`h-12 rounded-xl flex flex-col items-center justify-center p-1 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white font-bold'
                        : isToday
                        ? 'border border-emerald-500/60 bg-emerald-950/20 text-slate-100'
                        : 'bg-slate-800/40 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <span className="text-xs">{day.getDate()}</span>
                    <div className="flex items-center space-x-1 h-1.5 mt-0.5">
                      {hasWater && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? 'bg-white' : 'bg-blue-400'
                          }`}
                        />
                      )}
                      {hasFert && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? 'bg-amber-200' : 'bg-amber-400'
                          }`}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Фильтр по типам процедур и заголовок дня */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-300">
              Задачи на{' '}
              {new Date(selectedDateStr).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
              })}
              :
            </span>
            <span className="text-xs text-slate-500">({selectedEvents.length})</span>
          </div>

          <div className="flex items-center space-x-1.5 self-start sm:self-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-slate-800 text-slate-100 font-semibold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Все
            </button>
            <button
              onClick={() => setFilterType('water')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                filterType === 'water'
                  ? 'bg-blue-950/80 text-blue-300 font-semibold border border-blue-800/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Droplet className="w-3 h-3 text-blue-400" />
              <span>Полив</span>
            </button>
            <button
              onClick={() => setFilterType('fertilize')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                filterType === 'fertilize'
                  ? 'bg-amber-950/80 text-amber-300 font-semibold border border-amber-800/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Подкормка</span>
            </button>
          </div>
        </div>

        {/* Список процедур */}
        {selectedEvents.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 bg-slate-800/30 rounded-2xl border border-dashed border-slate-800 p-6">
            🌿 На этот день растения не требуют полива или подкормки.
          </div>
        ) : (
          <div className="space-y-2.5">
            {selectedEvents.map((item, idx) => (
              <div
                key={`${item.plant.id}-${item.type}-${idx}`}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/60 border border-slate-800 hover:border-slate-700 transition-all"
              >
                <div
                  className="flex items-center space-x-3.5 cursor-pointer min-w-0"
                  onClick={() => onSelectPlant(item.plant)}
                >
                  <img
                    src={item.plant.imageUrl}
                    alt={item.plant.name}
                    className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-100 hover:text-emerald-400 transition-colors truncate">
                      {item.plant.name}
                    </h4>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                      <span
                        className={`flex items-center space-x-1 font-medium ${
                          item.type === 'water' ? 'text-blue-400' : 'text-amber-400'
                        }`}
                      >
                        {item.type === 'water' ? (
                          <Droplet className="w-3 h-3" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        <span>{item.label}</span>
                      </span>
                      <span>•</span>
                      <span>{item.plant.familyName}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  {item.type === 'water' ? (
                    <button
                      onClick={() => onWaterPlant(item.plant.id)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm cursor-pointer transition-all active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Выполнено</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onFertilizePlant?.(item.plant.id)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-sm cursor-pointer transition-all active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Удобрено</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
