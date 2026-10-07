import React from 'react';
import { NotificationTrigger, Plant } from '../types';
import {
  Bell,
  X,
  Droplets,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Calendar,
  Send,
  Sparkles,
} from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggers: NotificationTrigger[];
  plants: Plant[];
  onWaterPlant: (plantId: string) => void;
  onDismissTrigger: (triggerId: string) => void;
  onMarkAllAsRead: () => void;
  onSendTestNotification: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  triggers,
  plants,
  onWaterPlant,
  onDismissTrigger,
  onMarkAllAsRead,
  onSendTestNotification,
}) => {
  if (!isOpen) return null;

  const pendingTriggers = triggers.filter((t) => t.isPending);
  const resolvedTriggers = triggers.filter((t) => !t.isPending);

  // Динамические алерты на основе реального состояния растений (просрочка / сегодня)
  const overduePlants = plants.filter((p) => {
    const diff = Math.floor(
      (new Date().getTime() - new Date(p.lastWateredDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    return diff > p.wateringFrequencyDays;
  });

  const dueTodayPlants = plants.filter((p) => {
    const diff = Math.floor(
      (new Date().getTime() - new Date(p.lastWateredDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    return diff === p.wateringFrequencyDays;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Шапка модального окна */}
        <div className="px-6 py-4.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <span>Уведомления и напоминания</span>
                {pendingTriggers.length > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                    {pendingTriggers.length}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Цепочка локальных напоминаний по ТЗ ЛР №4
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Панель быстрых действий */}
        <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
          <button
            onClick={onSendTestNotification}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Тестовый пуш</span>
          </button>

          {pendingTriggers.length > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs font-medium transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Прочитать все</span>
            </button>
          )}
        </div>

        {/* Список уведомлений */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Срочные оповещения о просрочке (ЛР №1 & ЛР №4) */}
          {overduePlants.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[11px] font-bold text-red-400 uppercase tracking-wider flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Критичные предупреждения (просрочен полив)</span>
              </h4>
              {overduePlants.map((plant) => {
                const overdueDays = Math.floor(
                  (new Date().getTime() - new Date(plant.lastWateredDate).getTime()) / (1000 * 60 * 60 * 24)
                ) - plant.wateringFrequencyDays;

                return (
                  <div
                    key={`overdue_${plant.id}`}
                    className="p-3.5 rounded-2xl bg-red-950/30 border border-red-500/30 flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 flex-shrink-0 mt-0.5">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-100 flex items-center space-x-2">
                          <span>{plant.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-red-500/20 text-red-400 font-semibold">
                            Просрочено на {overdueDays} дн.
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Тревожный пуш-триггер: требуется немедленный полив растения!
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => onWaterPlant(plant.id)}
                      className="px-3 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold flex items-center space-x-1.5 flex-shrink-0 shadow-sm cursor-pointer transition-all"
                    >
                      <Droplets className="w-3.5 h-3.5" />
                      <span>Полить</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Плановые процедуры на сегодня */}
          {dueTodayPlants.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Запланировано на сегодня (09:00)</span>
              </h4>
              {dueTodayPlants.map((plant) => (
                <div
                  key={`due_${plant.id}`}
                  className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-start justify-between gap-3"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0 mt-0.5">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-100">{plant.name}</div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Плановый день полива (интервал: каждые {plant.wateringFrequencyDays} дн.)
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onWaterPlant(plant.id)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center space-x-1.5 flex-shrink-0 shadow-sm cursor-pointer transition-all"
                  >
                    <Droplets className="w-3.5 h-3.5" />
                    <span>Полить</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Запланированные триггеры из БД */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Системные триггеры уведомлений</span>
            </h4>

            {triggers.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-60" />
                <p className="text-xs text-slate-300 font-semibold">Все растения политы и ухожены</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Активных отложенных триггеров в очереди нет
                </p>
              </div>
            ) : (
              triggers.map((trigger) => (
                <div
                  key={trigger.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    trigger.isPending
                      ? 'bg-slate-800/60 border-slate-700/80'
                      : 'bg-slate-950/40 border-slate-800/40 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          trigger.isPending
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-100 flex items-center space-x-2">
                          <span>{trigger.title}</span>
                          {!trigger.isPending && (
                            <span className="text-[10px] text-slate-500">Выполнено</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                          {trigger.body}
                        </p>
                        <div className="flex items-center space-x-2 mt-2 text-[10px] text-slate-500">
                          <span>Запланировано: {trigger.scheduledDate}</span>
                          <span>•</span>
                          <span>Растение ID: {trigger.plantId}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 flex-shrink-0">
                      {trigger.isPending && (
                        <button
                          onClick={() => {
                            onWaterPlant(trigger.plantId);
                            onDismissTrigger(trigger.id);
                          }}
                          title="Полить и завершить напоминание"
                          className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 cursor-pointer transition-colors"
                        >
                          <Droplets className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => onDismissTrigger(trigger.id)}
                        title="Удалить напоминание"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Футер */}
        <div className="px-6 py-3.5 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Синхронизировано с Isar DB & NotificationService</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
