import React from 'react';
import { Plant, OverdueStatus } from '../types';
import {
  Droplet,
  Sun,
  Clock,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Edit3,
} from 'lucide-react';

interface PlantCardProps {
  plant: Plant;
  onSelect: (plant: Plant) => void;
  onWater: (plantId: string) => void;
  onEdit?: (plant: Plant) => void;
}

export const getWateringStatus = (plant: Plant): {
  status: OverdueStatus;
  diffDays: number;
  label: string;
  nextDate: string;
} => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const lastDate = new Date(plant.lastWateredDate);
  const nextDate = new Date(lastDate);
  nextDate.setDate(nextDate.getDate() + plant.wateringFrequencyDays);
  
  // Разница между сегодня и датой полива в днях
  const diffTime = today.getTime() - nextDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 2) {
    return {
      status: 'overdue_critical',
      diffDays,
      label: `Критическая просрочка (${diffDays} дн.)`,
      nextDate: nextDate.toLocaleDateString('ru-RU'),
    };
  } else if (diffDays > 0) {
    return {
      status: 'overdue_minor',
      diffDays,
      label: `Просрочено на ${diffDays} дн.`,
      nextDate: nextDate.toLocaleDateString('ru-RU'),
    };
  } else if (diffDays === 0) {
    return {
      status: 'due_today',
      diffDays: 0,
      label: 'Полить сегодня!',
      nextDate: 'Сегодня',
    };
  } else {
    const remainingDays = Math.abs(diffDays);
    return {
      status: 'healthy',
      diffDays,
      label: `Через ${remainingDays} дн. (${nextDate.toLocaleDateString('ru-RU')})`,
      nextDate: nextDate.toLocaleDateString('ru-RU'),
    };
  }
};

export const PlantCard: React.FC<PlantCardProps> = ({
  plant,
  onSelect,
  onWater,
  onEdit,
}) => {
  const statusInfo = getWateringStatus(plant);

  // Стили карточки в зависимости от статуса полива
  const getCardStyle = () => {
    switch (statusInfo.status) {
      case 'overdue_critical':
        return {
          wrapper: 'border-2 border-red-500 bg-red-950/20 shadow-red-500/10 shadow-lg ring-2 ring-red-400/30',
          badge: 'bg-red-600 text-white font-semibold',
          indicator: 'bg-red-500 text-red-300',
        };
      case 'overdue_minor':
        return {
          wrapper: 'border-2 border-rose-500 bg-rose-950/20 shadow-rose-500/10 shadow-md',
          badge: 'bg-rose-500 text-white font-medium',
          indicator: 'bg-rose-500 text-rose-300',
        };
      case 'due_today':
        return {
          wrapper: 'border-2 border-amber-500 bg-amber-950/20 shadow-amber-500/10 shadow-md',
          badge: 'bg-amber-500 text-slate-950 font-semibold',
          indicator: 'bg-amber-500 text-amber-300',
        };
      case 'healthy':
      default:
        return {
          wrapper: 'border border-slate-800 bg-slate-900/90 hover:border-emerald-500/50 shadow-sm hover:shadow-md transition-all',
          badge: 'bg-slate-900/80 text-emerald-300 border border-emerald-500/30 font-medium',
          indicator: 'bg-emerald-500 text-emerald-300',
        };
    }
  };

  const style = getCardStyle();

  return (
    <div
      id={`plant-card-${plant.id}`}
      className={`rounded-3xl overflow-hidden transition-all duration-300 flex flex-col justify-between ${style.wrapper}`}
    >
      <div className="cursor-pointer" onClick={() => onSelect(plant)}>
        {/* Картинка и бейджи */}
        <div className="relative h-44 w-full overflow-hidden bg-slate-950">
          <img
            src={plant.imageUrl}
            alt={plant.name}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

          {/* Индикатор статуса полива */}
          <div className="absolute top-3 right-3">
            <span
              className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs shadow-sm ${style.badge}`}
            >
              {statusInfo.status === 'overdue_critical' || statusInfo.status === 'overdue_minor' ? (
                <AlertTriangle className="w-3.5 h-3.5" />
              ) : statusInfo.status === 'due_today' ? (
                <Clock className="w-3.5 h-3.5" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>{statusInfo.label}</span>
            </span>
          </div>

          {/* Семейство */}
          <div className="absolute bottom-3 left-3 flex items-center space-x-1.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-slate-900/90 text-emerald-300 backdrop-blur-sm border border-emerald-500/30">
              {plant.familyName}
            </span>
            {plant.gbifTaxonKey && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-lg text-[10px] font-mono font-medium bg-slate-950/80 text-emerald-400 backdrop-blur-sm border border-emerald-800/40">
                GBIF #{plant.gbifTaxonKey}
              </span>
            )}
          </div>
        </div>

        {/* Инфо-блок */}
        <div className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-bold text-base text-slate-100 leading-tight truncate">
                {plant.name}
              </h3>
              <p className="text-xs italic text-slate-400 mt-0.5 truncate">
                {plant.scientificName}
              </p>
            </div>

            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(plant);
                }}
                className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-all cursor-pointer flex-shrink-0"
                title="Редактировать параметры"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {plant.location && (
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span className="truncate">{plant.location}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-800 text-xs text-slate-300">
            <div className="flex items-center space-x-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <span className="truncate">{plant.lightRequirement}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Droplet className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              <span>Полив: раз в {plant.wateringFrequencyDays} дн.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Быстрое действие: Полить */}
      <div className="px-4 pb-4 pt-1 flex items-center justify-between border-t border-slate-800/80 mt-auto">
        <div className="text-xs text-slate-400">
          Полив: <span className="font-medium text-slate-200">{plant.lastWateredDate}</span>
        </div>
        <button
          id={`water-btn-${plant.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onWater(plant.id);
          }}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm ${
            statusInfo.status === 'overdue_critical' || statusInfo.status === 'overdue_minor'
              ? 'bg-red-600 hover:bg-red-500 text-white'
              : statusInfo.status === 'due_today'
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
          title="Отметить полив"
        >
          <Droplet className="w-3.5 h-3.5" />
          <span>Полить</span>
        </button>
      </div>
    </div>
  );
};
