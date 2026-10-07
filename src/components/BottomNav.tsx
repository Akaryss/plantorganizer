import React from 'react';
import { NavigationTab } from '../types';
import { Flower2, Calendar, BookOpen, Settings } from 'lucide-react';

interface BottomNavProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  dueTasksCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  dueTasksCount,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 z-40 px-2 py-1.5 flex items-center justify-around">
      <button
        onClick={() => onSelectTab('home')}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
          activeTab === 'home'
            ? 'text-emerald-400 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Flower2 className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Мой сад</span>
      </button>

      <button
        onClick={() => onSelectTab('calendar')}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer relative ${
          activeTab === 'calendar'
            ? 'text-emerald-400 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className="relative">
          <Calendar className="w-5 h-5" />
          {dueTasksCount > 0 && (
            <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 font-bold text-[9px] flex items-center justify-center">
              {dueTasksCount}
            </span>
          )}
        </div>
        <span className="text-[10px] mt-0.5">Календарь</span>
      </button>

      <button
        onClick={() => onSelectTab('encyclopedia')}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
          activeTab === 'encyclopedia'
            ? 'text-emerald-400 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <BookOpen className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Справочник</span>
      </button>

      <button
        onClick={() => onSelectTab('settings')}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
          activeTab === 'settings'
            ? 'text-emerald-400 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Settings className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Настройки</span>
      </button>
    </nav>
  );
};
