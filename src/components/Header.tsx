import React from 'react';
import { NavigationTab } from '../types';
import {
  Leaf,
  Plus,
  Bell,
  Calendar,
  BookOpen,
  Settings,
  Flower2,
  Smartphone,
} from 'lucide-react';

interface HeaderProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenAddModal: () => void;
  onOpenIPhoneModal?: () => void;
  onOpenNotificationsModal?: () => void;
  pendingNotificationsCount?: number;
  plantsCount: number;
  dueTasksCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenAddModal,
  onOpenIPhoneModal,
  onOpenNotificationsModal,
  pendingNotificationsCount = 0,
  plantsCount,
  dueTasksCount,
}) => {
  return (
    <header className="bg-slate-900/95 backdrop-blur-md text-white border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Бренд */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => onSelectTab('home')}
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-950/50 border border-emerald-500/20">
              <Leaf className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <span className="font-bold text-base sm:text-lg text-slate-100 tracking-tight block leading-tight">
                Дендрарий
              </span>
              <span className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Органайзер домашних растений
              </span>
            </div>
          </div>

          {/* Десктоп-навигация (Табы) */}
          <nav className="hidden md:flex items-center space-x-1 p-1 rounded-2xl bg-slate-950/60 border border-slate-800">
            <button
              onClick={() => onSelectTab('home')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Flower2 className="w-4 h-4" />
              <span>Мой сад</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-900/80 border border-slate-700/50 opacity-90">
                {plantsCount}
              </span>
            </button>

            <button
              onClick={() => onSelectTab('calendar')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'calendar'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Календарь</span>
              {dueTasksCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-500 text-slate-950 font-bold">
                  {dueTasksCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('encyclopedia')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'encyclopedia'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Справочник</span>
            </button>

            <button
              onClick={() => onSelectTab('settings')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Настройки</span>
            </button>
          </nav>

          {/* Действия */}
          <div className="flex items-center space-x-2.5">
            {onOpenIPhoneModal && (
              <button
                onClick={onOpenIPhoneModal}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 text-emerald-400 hover:text-emerald-300 text-xs font-bold cursor-pointer transition-all shadow-sm active:scale-95"
                title="Открыть и протестировать на iPhone"
              >
                <Smartphone className="w-4 h-4" />
                <span className="hidden sm:inline">📱 Тест на iPhone</span>
              </button>
            )}

            <button
              id="header-notifications-bell-btn"
              onClick={() => {
                if (onOpenNotificationsModal) {
                  onOpenNotificationsModal();
                } else {
                  onSelectTab('settings');
                }
              }}
              title={`${pendingNotificationsCount} активных напоминаний`}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-emerald-400 transition-all cursor-pointer relative"
            >
              <Bell className="w-4 h-4" />
              {pendingNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 font-bold text-[9px] flex items-center justify-center">
                  {pendingNotificationsCount}
                </span>
              )}
            </button>

            <button
              id="header-add-plant-btn"
              onClick={onOpenAddModal}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Добавить растение</span>
              <span className="sm:hidden">Добавить</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
