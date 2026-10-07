import React, { useState } from 'react';
import {
  Smartphone,
  X,
  Copy,
  Check,
  QrCode,
  Share2,
  PlusSquare,
  Sparkles,
  Wifi,
  ExternalLink,
} from 'lucide-react';

interface IPhoneTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IPhoneTestModal: React.FC<IPhoneTestModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const localUrl = 'http://172.20.10.2:3000';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&color=059669&data=${encodeURIComponent(
    localUrl
  )}`;

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(localUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col">
        {/* Шапка */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <span>Тестирование на iPhone</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  iOS Safari / PWA
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Запустите приложение прямо на вашем телефоне в реальном времени
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Тело модалки */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[80vh]">
          {/* QR код по центру */}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="p-2.5 bg-white rounded-2xl shadow-xl shadow-emerald-950/30">
              <img
                src={qrUrl}
                alt="QR-код для iPhone"
                className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                loading="eager"
              />
            </div>
            <p className="text-xs font-medium text-slate-300 text-center flex items-center space-x-1.5">
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span>Наведите стандартную камеру iPhone на этот QR-код</span>
            </p>
          </div>

          {/* Прямая ссылка с кнопкой копирования */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center justify-between">
              <span>Прямой адрес в локальной Wi-Fi сети:</span>
              <span className="text-[11px] text-emerald-400 font-mono flex items-center space-x-1">
                <Wifi className="w-3 h-3" />
                <span>Wi-Fi Online</span>
              </span>
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={localUrl}
                className="flex-1 text-xs sm:text-sm font-mono px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-emerald-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center space-x-1.5 cursor-pointer transition-all active:scale-95 shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Скопировано</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Копировать</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Инструкция по добавлению на домашний экран (PWA) */}
          <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-800/50 space-y-2.5">
            <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Как установить как нативное iOS-приложение:</span>
            </h4>
            <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside pl-1">
              <li>
                Откройте ссылку в <strong>Safari</strong> на вашем iPhone (убедитесь, что iPhone и ПК в одной Wi-Fi сети).
              </li>
              <li className="flex items-start space-x-1.5">
                <span>Нажмите кнопку «Поделиться»</span>
                <Share2 className="w-3.5 h-3.5 inline text-blue-400 shrink-0 mt-0.5" />
                <span>внизу Safari.</span>
              </li>
              <li className="flex items-start space-x-1.5">
                <span>Прокрутите вниз и выберите</span>
                <strong className="text-emerald-300">«На экран «Домой»»</strong>
                <PlusSquare className="w-3.5 h-3.5 inline text-emerald-400 shrink-0 mt-0.5" />.
              </li>
              <li>
                Готово! На экране вашего iPhone появится фирменная иконка приложения без интерфейса браузера с поддержкой камеры и офлайн-кэша.
              </li>
            </ol>
          </div>
        </div>

        {/* Футер */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition-all"
          >
            Понятно, протестировать
          </button>
        </div>
      </div>
    </div>
  );
};
