import React, { useState } from 'react';
import {
  Plant,
  CareLog,
  NotificationTrigger,
  CareType,
  NavigationTab,
  AppSettings,
  defaultSettings,
} from './types';
import {
  initialIsarPlants,
  initialIsarLogs,
  initialNotificationTriggers,
  initialRealmFamilies,
  initialRealmFertilizers,
} from './data/plantData';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { PlantCard, getWateringStatus } from './components/PlantCard';
import { CalendarView } from './components/CalendarView';
import { EncyclopediaView } from './components/EncyclopediaView';
import { SettingsView } from './components/SettingsView';
import { PlantDetailModal } from './components/PlantDetailModal';
import { AddPlantModal } from './components/AddPlantModal';
import { EditPlantModal } from './components/EditPlantModal';
import { ScannerModal } from './components/ScannerModal';
import { IPhoneTestModal } from './components/IPhoneTestModal';
import { NotificationsModal } from './components/NotificationsModal';
import {
  Search,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';

export default function App() {
  // Основные состояния данных
  const [plants, setPlants] = useState<Plant[]>(initialIsarPlants);
  const [logs, setLogs] = useState<CareLog[]>(initialIsarLogs);
  const [triggers, setTriggers] = useState<NotificationTrigger[]>(initialNotificationTriggers);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  // Навигация
  const [activeTab, setActiveTab] = useState<NavigationTab>('home');

  // Фильтры для вкладки «Мой сад»
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFamilyFilter, setSelectedFamilyFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'overdue' | 'due_today'>('all');

  // Модальные окна
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [isAddPlantModalOpen, setIsAddPlantModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isIPhoneModalOpen, setIsIPhoneModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);

  // Системный тост
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setNotificationToast(message);
    setTimeout(() => setNotificationToast(null), 3500);
  };

  // Удаление / отклонение триггера уведомления
  const handleDismissTrigger = (triggerId: string) => {
    setTriggers((prev) => prev.filter((t) => t.id !== triggerId));
    showToast('Уведомление скрыто');
  };

  // Отметить все уведомления прочитанными
  const handleMarkAllTriggersAsRead = () => {
    setTriggers((prev) => prev.map((t) => ({ ...t, isPending: false })));
    showToast('Все напоминания отмечены как прочитанные');
  };

  // Симуляция отправки тестового уведомления по ТЗ ЛР №4
  const handleSendTestNotification = () => {
    const randomPlant = plants[Math.floor(Math.random() * plants.length)] || plants[0];
    const newTrigger: NotificationTrigger = {
      id: `test_notif_${Date.now()}`,
      plantId: randomPlant.id,
      plantName: randomPlant.name,
      type: 'water',
      scheduledDate: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      title: `💧 Пора полить «${randomPlant.name}»!`,
      body: 'Плановое системное напоминание в 09:00. Проверьте влажность почвы.',
      isPending: true,
    };

    setTriggers((prev) => [newTrigger, ...prev]);

    // Попытка отправить системный Web Push Notification, если разрешено браузером
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(newTrigger.title, {
        body: newTrigger.body,
        icon: randomPlant.imageUrl,
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    showToast(`🔔 Тестовое уведомление для «${randomPlant.name}» отправлено!`);
  };

  // Полив растения прямо с карточки
  const handleWaterPlant = (plantId: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setPlants((prev) =>
      prev.map((p) => (p.id === plantId ? { ...p, lastWateredDate: todayStr } : p))
    );

    const targetPlant = plants.find((p) => p.id === plantId);
    const newLog: CareLog = {
      id: `log_${Date.now()}`,
      plantId,
      type: 'water',
      date: todayStr,
      notes: 'Полив отстоянной водой комнатной температуры',
    };
    setLogs((prev) => [newLog, ...prev]);

    showToast(`💧 Полив растения «${targetPlant?.name || ''}» зафиксирован`);
  };

  // Подкормка растения
  const handleFertilizePlant = (plantId: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setPlants((prev) =>
      prev.map((p) => (p.id === plantId ? { ...p, lastFertilizedDate: todayStr } : p))
    );

    const targetPlant = plants.find((p) => p.id === plantId);
    const newLog: CareLog = {
      id: `log_${Date.now()}`,
      plantId,
      type: 'fertilize',
      date: todayStr,
      notes: 'Внесение питательного раствора',
    };
    setLogs((prev) => [newLog, ...prev]);

    showToast(`🌿 Подкормка растения «${targetPlant?.name || ''}» зафиксирована`);
  };

  // Добавить запись в журнал ухода из карточки растения
  const handleAddCareLog = (
    plantId: string,
    type: CareType,
    notes?: string,
    fertilizerName?: string
  ) => {
    const todayStr = new Date().toISOString().split('T')[0];

    const newLog: CareLog = {
      id: `log_${Date.now()}`,
      plantId,
      type,
      date: todayStr,
      notes,
      fertilizerName,
    };
    setLogs((prev) => [newLog, ...prev]);

    if (type === 'water') {
      setPlants((prev) =>
        prev.map((p) => (p.id === plantId ? { ...p, lastWateredDate: todayStr } : p))
      );
    } else if (type === 'fertilize') {
      setPlants((prev) =>
        prev.map((p) => (p.id === plantId ? { ...p, lastFertilizedDate: todayStr } : p))
      );
    }

    showToast(`🌿 Запись процедуры сохранена в журнал`);
  };

  // Добавить новое растение (ручное добавление с фото)
  const handleCreatePlantManual = (newPlant: Plant, newTriggers: NotificationTrigger[]) => {
    setPlants((prev) => [newPlant, ...prev]);
    setTriggers((prev) => [...newTriggers, ...prev]);
    showToast(`✨ «${newPlant.name}» успешно добавлено в вашу коллекцию`);
  };

  // Обновление существующего растения
  const handleUpdatePlant = (updatedPlant: Plant) => {
    setPlants((prev) => prev.map((p) => (p.id === updatedPlant.id ? updatedPlant : p)));
    if (selectedPlant?.id === updatedPlant.id) {
      setSelectedPlant(updatedPlant);
    }
    showToast(`Параметры растения «${updatedPlant.name}» обновлены`);
  };

  // Удаление растения
  const handleDeletePlant = (plantId: string) => {
    const target = plants.find((p) => p.id === plantId);
    setPlants((prev) => prev.filter((p) => p.id !== plantId));
    setLogs((prev) => prev.filter((l) => l.plantId !== plantId));
    setTriggers((prev) => prev.filter((t) => t.plantId !== plantId));
    if (selectedPlant?.id === plantId) {
      setSelectedPlant(null);
    }
    showToast(`Растение «${target?.name || ''}» удалено из сада`);
  };

  // Добавить растение через сканер
  const handlePlantAddedFromScanner = (newPlant: Plant, newTriggers: NotificationTrigger[]) => {
    setPlants((prev) => [newPlant, ...prev]);
    setTriggers((prev) => [...newTriggers, ...prev]);
    showToast(`✨ «${newPlant.name}» добавлено в коллекцию`);
  };

  // Тест push-уведомления
  const handleTriggerNow = (trigger: NotificationTrigger) => {
    showToast(`🔔 [Push]: ${trigger.title} — ${trigger.body}`);
  };

  // Подсчет статистики состояния полива
  const stats = plants.reduce(
    (acc, plant) => {
      const status = getWateringStatus(plant).status;
      if (status === 'overdue_critical' || status === 'overdue_minor') {
        acc.overdue += 1;
      } else if (status === 'due_today') {
        acc.dueToday += 1;
      } else {
        acc.healthy += 1;
      }
      return acc;
    },
    { overdue: 0, dueToday: 0, healthy: 0 }
  );

  // Фильтрация растений
  const filteredPlants = plants.filter((plant) => {
    const matchesSearch =
      plant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plant.scientificName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (plant.location && plant.location.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFamily =
      selectedFamilyFilter === 'all' || plant.familyId === selectedFamilyFilter;

    const status = getWateringStatus(plant).status;
    const matchesStatus =
      selectedStatusFilter === 'all' ||
      (selectedStatusFilter === 'overdue' &&
        (status === 'overdue_critical' || status === 'overdue_minor')) ||
      (selectedStatusFilter === 'due_today' && status === 'due_today');

    return matchesSearch && matchesFamily && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased pb-20 md:pb-10">
      {/* Верхняя навигация и шапка */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenAddModal={() => setIsAddPlantModalOpen(true)}
        onOpenIPhoneModal={() => setIsIPhoneModalOpen(true)}
        onOpenNotificationsModal={() => setIsNotificationsModalOpen(true)}
        pendingNotificationsCount={triggers.filter((t) => t.isPending).length}
        plantsCount={plants.length}
        dueTasksCount={stats.overdue + stats.dueToday}
      />

      {/* Всплывающее системное уведомление (Toast) */}
      {notificationToast && (
        <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-emerald-500/50 flex items-center space-x-2.5 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{notificationToast}</span>
        </div>
      )}

      {/* Основной контент вкладок */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* ВКЛАДКА 1: МОЙ САД (ДОМАШНИЙ ЭКРАН) */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            {/* Блоки статусов полива */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <button
                id="status-filter-overdue"
                onClick={() =>
                  setSelectedStatusFilter(
                    selectedStatusFilter === 'overdue' ? 'all' : 'overdue'
                  )
                }
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedStatusFilter === 'overdue'
                    ? 'border-red-500 bg-red-950/40 ring-2 ring-red-400/30 shadow-lg'
                    : 'bg-slate-900 border-slate-800 hover:border-red-500/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-400 flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Просрочен полив</span>
                  </span>
                  <span className="text-xl font-bold text-red-400">{stats.overdue}</span>
                </div>
              </button>

              <button
                id="status-filter-due-today"
                onClick={() =>
                  setSelectedStatusFilter(
                    selectedStatusFilter === 'due_today' ? 'all' : 'due_today'
                  )
                }
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedStatusFilter === 'due_today'
                    ? 'border-amber-500 bg-amber-950/40 ring-2 ring-amber-400/30 shadow-lg'
                    : 'bg-slate-900 border-slate-800 hover:border-amber-500/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Полить сегодня</span>
                  </span>
                  <span className="text-xl font-bold text-amber-400">{stats.dueToday}</span>
                </div>
              </button>

              <button
                id="status-filter-all"
                onClick={() => setSelectedStatusFilter('all')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedStatusFilter === 'all'
                    ? 'border-emerald-500 bg-emerald-950/40 ring-2 ring-emerald-400/30 shadow-lg'
                    : 'bg-slate-900 border-slate-800 hover:border-emerald-500/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>В норме</span>
                  </span>
                  <span className="text-xl font-bold text-emerald-400">{stats.healthy}</span>
                </div>
              </button>
            </div>

            {/* Быстрый переход в календарь */}
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">
                    Интерактивный календарь процедур
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {stats.overdue + stats.dueToday > 0
                      ? `Требуют внимания сегодня: ${stats.overdue + stats.dueToday} процедур`
                      : 'Все растения своевременно политы и удобрены'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('calendar')}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer self-start sm:self-auto"
              >
                <span>Открыть календарь</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Фильтры и поиск по коллекции */}
            <div className="space-y-3.5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Поле поиска */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="plants-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск по названию, латыни или расположению (напр. 'Гостиная')..."
                    className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
                  />
                </div>

                {/* Количество */}
                <div className="text-xs text-slate-400 self-end sm:self-center">
                  Растений: <span className="font-semibold text-slate-200">{filteredPlants.length}</span> из {plants.length}
                </div>
              </div>

              {/* Фильтр по семействам */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-thin">
                <button
                  onClick={() => setSelectedFamilyFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    selectedFamilyFilter === 'all'
                      ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  Все растения ({plants.length})
                </button>

                {initialRealmFamilies.map((fam) => {
                  const count = plants.filter((p) => p.familyId === fam.id).length;
                  return (
                    <button
                      key={fam.id}
                      onClick={() => setSelectedFamilyFilter(fam.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                        selectedFamilyFilter === fam.id
                          ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {fam.name} {count > 0 && <span className="text-[10px] opacity-70 ml-1">({count})</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Сетка растений */}
            {filteredPlants.length === 0 ? (
              <div className="py-16 text-center bg-slate-900/50 rounded-3xl border border-dashed border-slate-800 p-8 space-y-3">
                <p className="text-sm font-medium text-slate-300">
                  Растений по заданному критерию не найдено
                </p>
                <p className="text-xs text-slate-500">
                  Попробуйте изменить поисковый запрос или добавьте новое домашнее растение.
                </p>
                <button
                  onClick={() => setIsAddPlantModalOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Добавить домашнее растение</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredPlants.map((plant) => (
                  <PlantCard
                    key={plant.id}
                    plant={plant}
                    onSelect={(p) => setSelectedPlant(p)}
                    onWater={handleWaterPlant}
                    onEdit={(p) => setEditingPlant(p)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ВКЛАДКА 2: КАЛЕНДАРЬ */}
        {activeTab === 'calendar' && (
          <CalendarView
            plants={plants}
            onWaterPlant={handleWaterPlant}
            onFertilizePlant={handleFertilizePlant}
            onSelectPlant={(plant) => setSelectedPlant(plant)}
          />
        )}

        {/* ВКЛАДКА 3: СПРАВОЧНИК / ЭНЦИКЛОПЕДИЯ */}
        {activeTab === 'encyclopedia' && (
          <EncyclopediaView
            plants={plants}
            onFilterByFamily={(familyId) => {
              setSelectedFamilyFilter(familyId);
              setActiveTab('home');
            }}
            onAddPlantDirectly={(item) => {
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

              const newTriggers: NotificationTrigger[] = [
                {
                  id: `trig_${Date.now()}_1`,
                  plantId,
                  plantName: item.name,
                  type: 'water',
                  scheduledDate: nextWaterDate.toISOString().split('T')[0],
                  title: `💧 Пора полить ${item.name}`,
                  body: `Плановый полив каждые ${item.wateringFrequencyDays} дн.`,
                  isPending: true,
                },
              ];

              handleCreatePlantManual(newPlant, newTriggers);
            }}
          />
        )}

        {/* ВКЛАДКА 4: НАСТРОЙКИ */}
        {activeTab === 'settings' && (
          <SettingsView
            plants={plants}
            logs={logs}
            triggers={triggers}
            settings={settings}
            onUpdateSettings={setSettings}
            onResetData={() => {
              setPlants(initialIsarPlants);
              setLogs(initialIsarLogs);
              setTriggers(initialNotificationTriggers);
              setSettings(defaultSettings);
            }}
            onClearLogs={() => setLogs([])}
            onImportData={(importedPlants, importedLogs) => {
              setPlants(importedPlants);
              setLogs(importedLogs);
            }}
            onDismissTrigger={(id) =>
              setTriggers((prev) => prev.filter((t) => t.id !== id))
            }
            onTriggerNow={handleTriggerNow}
          />
        )}
      </main>

      {/* Мобильная нижняя панель навигации */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        dueTasksCount={stats.overdue + stats.dueToday}
      />

      {/* Модальное окно деталей растения (Журнал ухода + Инфо) */}
      {selectedPlant && (
        <PlantDetailModal
          plant={selectedPlant}
          logs={logs}
          fertilizers={initialRealmFertilizers}
          onClose={() => setSelectedPlant(null)}
          onAddCareLog={handleAddCareLog}
          onWater={handleWaterPlant}
        />
      )}

      {/* Модальное окно добавления растения (свои фото, пресеты, ручной ввод + кнопка сканера) */}
      {isAddPlantModalOpen && (
        <AddPlantModal
          onClose={() => setIsAddPlantModalOpen(false)}
          onPlantCreated={handleCreatePlantManual}
          onOpenScanner={() => {
            setIsAddPlantModalOpen(false);
            setIsScannerOpen(true);
          }}
        />
      )}

      {/* Модальное окно редактирования параметров растения */}
      {editingPlant && (
        <EditPlantModal
          plant={editingPlant}
          onClose={() => setEditingPlant(null)}
          onSave={handleUpdatePlant}
          onDelete={handleDeletePlant}
        />
      )}

      {/* Модальное окно сканирования бирки / названия (mobile_scanner) */}
      {isScannerOpen && (
        <ScannerModal
          onClose={() => setIsScannerOpen(false)}
          onPlantAdded={handlePlantAddedFromScanner}
          userApiKey={settings.geminiApiKey}
        />
      )}

      {/* Модальное окно тестирования на iPhone (QR-код и Safari PWA) */}
      <IPhoneTestModal
        isOpen={isIPhoneModalOpen}
        onClose={() => setIsIPhoneModalOpen(false)}
      />

      {/* Модальное окно уведомлений и напоминаний (Колокольчик) */}
      <NotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        triggers={triggers}
        plants={plants}
        onWaterPlant={handleWaterPlant}
        onDismissTrigger={handleDismissTrigger}
        onMarkAllAsRead={handleMarkAllTriggersAsRead}
        onSendTestNotification={handleSendTestNotification}
      />
    </div>
  );
}
