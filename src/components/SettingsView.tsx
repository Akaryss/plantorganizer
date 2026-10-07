import React, { useState, useRef } from 'react';
import { Plant, CareLog, NotificationTrigger, AppSettings } from '../types';
import {
  Settings,
  Bell,
  Clock,
  Volume2,
  Calendar,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Smartphone,
  ShieldCheck,
  Key,
  Eye,
  EyeOff,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { verifyApiKey } from '../data/plantEncyclopedia';

interface SettingsViewProps {
  plants: Plant[];
  logs: CareLog[];
  triggers: NotificationTrigger[];
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onResetData: () => void;
  onClearLogs: () => void;
  onImportData: (plants: Plant[], logs: CareLog[]) => void;
  onDismissTrigger: (triggerId: string) => void;
  onTriggerNow: (trigger: NotificationTrigger) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  plants,
  logs,
  triggers,
  settings,
  onUpdateSettings,
  onResetData,
  onClearLogs,
  onImportData,
  onDismissTrigger,
  onTriggerNow,
}) => {
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showClearLogsConfirm, setShowClearLogsConfirm] = useState(false);

  // Состояния для ключа Gemini AI
  const [tempApiKey, setTempApiKey] = useState(settings.geminiApiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isVerifyingKey, setIsVerifyingKey] = useState(false);
  const [keyVerificationStatus, setKeyVerificationStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Сохранение и проверка ключа Gemini AI
  const handleSaveAndVerifyApiKey = async () => {
    setIsVerifyingKey(true);
    setKeyVerificationStatus(null);
    try {
      const trimmed = tempApiKey.trim();
      onUpdateSettings({ ...settings, geminiApiKey: trimmed });
      if (trimmed) {
        const res = await verifyApiKey(trimmed);
        if (res.valid) {
          setKeyVerificationStatus({
            success: true,
            message: 'Ключ успешно проверен! Модель Gemini 3.8 Flash Vision активна.',
          });
          showToast('API-ключ сохранён и успешно верифицирован');
        } else {
          setKeyVerificationStatus({
            success: false,
            message: res.error || 'Ошибка проверки ключа. Проверьте правильность строки.',
          });
        }
      } else {
        setKeyVerificationStatus({
          success: true,
          message: 'Используется стандартный встроенный ключ сервера.',
        });
        showToast('Настройки Gemini сброшены на системные');
      }
    } catch (e: any) {
      setKeyVerificationStatus({
        success: false,
        message: e.message || 'Ошибка сети при проверке',
      });
    } finally {
      setIsVerifyingKey(false);
    }
  };

  // Экспорт данных в JSON
  const handleExportData = () => {
    const dataToExport = {
      exportDate: new Date().toISOString(),
      app: 'Plant Care Organizer',
      plants,
      logs,
      triggers,
      settings,
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(dataToExport, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute(
      'download',
      `dendrarium_backup_${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast('Коллекция успешно экспортирована в JSON-файл');
  };

  // Импорт данных из JSON
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.plants && Array.isArray(parsed.plants)) {
          onImportData(parsed.plants, parsed.logs || []);
          showToast(`Импортировано растений: ${parsed.plants.length}`);
        } else {
          alert('Некорректный формат файла резервной копии.');
        }
      } catch (err) {
        alert('Ошибка при чтении JSON-файла.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Тост */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center space-x-2.5 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Заголовок */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2.5">
          <Settings className="w-5 h-5 text-emerald-400" />
          <span>Настройки приложения</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Расписание уведомлений, сезонные коэффициенты полива и резервное копирование
        </p>
      </div>

      {/* Блок ИИ: Интеграция с Google Gemini AI */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-emerald-900/50 space-y-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-100 block">Интеграция с Google Gemini AI</span>
              <span className="text-[11px] text-slate-400">Умное описание растений, расчет полива и Vision-мэтчинг по фото</span>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-600/60 text-emerald-300 flex items-center space-x-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Gemini Vision Ready</span>
          </span>
        </div>

        <div className="space-y-4">
          {/* Поле ввода API ключа */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-200 flex items-center space-x-1.5">
                <Key className="w-3.5 h-3.5 text-slate-400" />
                <span>Google Gemini API Key</span>
              </label>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 font-medium transition-colors"
              >
                <span>Получить ключ в Google AI Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  placeholder="Вставьте персональный API-ключ (AIzaSy...)"
                  className="w-full text-xs pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-100 font-mono placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="button"
                onClick={handleSaveAndVerifyApiKey}
                disabled={isVerifyingKey}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
              >
                {isVerifyingKey ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Проверка...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Сохранить и проверить</span>
                  </>
                )}
              </button>
            </div>

            {keyVerificationStatus && (
              <div
                className={`mt-2 p-2.5 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in ${
                  keyVerificationStatus.success
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                    : 'bg-rose-950/60 text-rose-300 border border-rose-800'
                }`}
              >
                {keyVerificationStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                )}
                <span>{keyVerificationStatus.message}</span>
              </div>
            )}
            
            <p className="text-[10px] text-slate-500 mt-1">
              Если персональный ключ не введён, система автоматически использует защищённый встроенный серверный ключ.
            </p>
          </div>

          {/* Выбор активной модели */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Модель для ботанического анализа и Vision
              </label>
              <select
                value={settings.geminiModel || 'gemini-3.8-flash'}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, geminiModel: e.target.value })
                }
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="gemini-3.8-flash">Gemini 3.8 Flash (Рекомендуется для фото и регламентов)</option>
                <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Быстрый текстовый режим)</option>
              </select>
            </div>

            {/* Включение Vision */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
              <div>
                <span className="text-xs font-semibold text-slate-200 block">Распознавание по Google Фото</span>
                <span className="text-[10px] text-slate-400">Мультимодальный анализ листьев и оценка здоровья</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings({ ...settings, enableAiVision: !settings.enableAiVision })
                }
                className={`w-10 h-5 rounded-full transition-all relative cursor-pointer ${
                  settings.enableAiVision !== false ? 'bg-emerald-600' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-all absolute top-0.5 ${
                    settings.enableAiVision !== false ? 'left-5.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Блок 1: Напоминания и уведомления */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
        <div className="flex items-center space-x-2 text-sm font-bold text-slate-200 border-b border-slate-800 pb-3">
          <Bell className="w-4 h-4 text-emerald-400" />
          <span>Система напоминаний</span>
        </div>

        <div className="space-y-4">
          {/* Включение push-уведомлений */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-200">
                Локальные уведомления
              </div>
              <div className="text-[11px] text-slate-400">
                Отправлять напоминания о поливе и подкормке
              </div>
            </div>
            <button
              onClick={() =>
                onUpdateSettings({ ...settings, enablePush: !settings.enablePush })
              }
              className={`w-12 h-6 rounded-full transition-all relative cursor-pointer ${
                settings.enablePush ? 'bg-emerald-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-all absolute top-0.5 ${
                  settings.enablePush ? 'left-6.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* Время утреннего напоминания */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <div>
              <div className="text-xs font-semibold text-slate-200 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Время утреннего напоминания</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Время поступления push-уведомлений в день полива
              </div>
            </div>
            <input
              type="time"
              value={settings.reminderTime}
              onChange={(e) =>
                onUpdateSettings({ ...settings, reminderTime: e.target.value })
              }
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-100 font-mono focus:outline-none focus:border-emerald-500 cursor-pointer"
            />
          </div>

          {/* Звуковой сигнал */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <div>
              <div className="text-xs font-semibold text-slate-200 flex items-center space-x-1.5">
                <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Звуковой сигнал</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Проигрывать мягкий звук при наступлении события ухода
              </div>
            </div>
            <button
              onClick={() =>
                onUpdateSettings({ ...settings, enableSound: !settings.enableSound })
              }
              className={`w-12 h-6 rounded-full transition-all relative cursor-pointer ${
                settings.enableSound ? 'bg-emerald-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-all absolute top-0.5 ${
                  settings.enableSound ? 'left-6.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* Порог предупреждения о засухе */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-200">
                  Повторный сигнал о засухе
                </div>
                <div className="text-[11px] text-slate-400">
                  Через сколько дней просрочки подавать критический сигнал
                </div>
              </div>
              <span className="text-xs font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-800/60">
                +{settings.droughtWarningDays} дн.
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={settings.droughtWarningDays}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  droughtWarningDays: Number(e.target.value),
                })
              }
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Блок 2: Сезонность и единицы измерения */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
        <div className="flex items-center space-x-2 text-sm font-bold text-slate-200 border-b border-slate-800 pb-3">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>Режим полива и климатические единицы</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Сезонный режим полива
            </label>
            <select
              value={settings.seasonalMode}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  seasonalMode: e.target.value as 'summer' | 'winter' | 'auto',
                })
              }
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-100 cursor-pointer focus:outline-none focus:border-emerald-500"
            >
              <option value="auto">Автоматически (по календарю)</option>
              <option value="summer">Летний (активный рост, стандартный интервал)</option>
              <option value="winter">Зимний (покой, интервал увеличен на +30%)</option>
            </select>
            <p className="text-[10px] text-slate-500 mt-1">
              Зимой растения испаряют меньше влаги из-за короткого светового дня.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Единицы измерения температуры
            </label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings({ ...settings, temperatureUnit: 'C' })
                }
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  settings.temperatureUnit === 'C'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Градусы Цельсия (°C)
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings({ ...settings, temperatureUnit: 'F' })
                }
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  settings.temperatureUnit === 'F'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Фаренгейт (°F)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Блок 3: Запланированные триггеры напоминаний */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-200">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Активные системные триггеры ({triggers.length})</span>
          </div>
        </div>

        {triggers.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">
            Нет активных напоминаний в очереди.
          </p>
        ) : (
          <div className="space-y-2">
            {triggers.map((trig) => (
              <div
                key={trig.id}
                className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-bold text-slate-200 truncate">
                    {trig.title}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {trig.body} • Дата: {trig.scheduledDate}
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button
                    onClick={() => onTriggerNow(trig)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 text-[11px] font-medium cursor-pointer"
                  >
                    Тест push
                  </button>
                  <button
                    onClick={() => onDismissTrigger(trig.id)}
                    className="p-1 text-slate-400 hover:text-red-400 cursor-pointer"
                    title="Удалить триггер"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Блок 4: Управление данными и резервное копирование */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
        <div className="flex items-center space-x-2 text-sm font-bold text-slate-200 border-b border-slate-800 pb-3">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Данные и резервное копирование</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Экспорт */}
          <button
            onClick={handleExportData}
            className="p-4 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 flex items-center space-x-3 text-left transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">
                Экспорт коллекции (JSON)
              </div>
              <div className="text-[11px] text-slate-400">
                Скачать резервный файл со всеми растениями и логами
              </div>
            </div>
          </button>

          {/* Импорт */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-full p-4 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 flex items-center space-x-3 text-left transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200">
                  Импорт коллекции (JSON)
                </div>
                <div className="text-[11px] text-slate-400">
                  Загрузить ранее сохраненный бэкап
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Опасные зоны */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {showClearLogsConfirm ? (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-red-400 font-medium">Очистить все логи ухода?</span>
              <button
                onClick={() => {
                  onClearLogs();
                  setShowClearLogsConfirm(false);
                  showToast('Журнал ухода очищен');
                }}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer"
              >
                Да
              </button>
              <button
                onClick={() => setShowClearLogsConfirm(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Отмена
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowClearLogsConfirm(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer transition-all text-left sm:text-center"
            >
              Очистить историю ухода ({logs.length} записей)
            </button>
          )}

          {showResetConfirm ? (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-amber-400 font-medium">Сбросить всё к начальным данным?</span>
              <button
                onClick={() => {
                  onResetData();
                  setShowResetConfirm(false);
                  showToast('Данные сброшены к начальным');
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold cursor-pointer"
              >
                Сбросить
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Отмена
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-amber-400 hover:text-amber-300 hover:bg-amber-950/30 cursor-pointer transition-all flex items-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Сбросить к образцам</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
