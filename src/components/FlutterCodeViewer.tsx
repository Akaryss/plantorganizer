import React, { useState } from 'react';
import { flutterCodeSnippets, CodeSnippet } from '../data/flutterCodeSnippets';
import {
  Code2,
  Copy,
  Check,
  FolderTree,
  Terminal,
  FileCode,
  Layers,
  BookOpen,
  Sparkles,
} from 'lucide-react';

export const FlutterCodeViewer: React.FC = () => {
  const [selectedSnippetId, setSelectedSnippetId] = useState<string>(
    flutterCodeSnippets[0].id
  );
  const [copied, setCopied] = useState(false);

  const selectedSnippet =
    flutterCodeSnippets.find((s) => s.id === selectedSnippetId) ||
    flutterCodeSnippets[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedSnippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Терминальная карточка быстрого старта на Windows */}
      <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-800 text-white shadow-xl">
        <div className="flex items-center space-x-2.5 mb-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight">
              Инструкция запуска в VS Code на Windows (Flutter Web & build_runner)
            </h3>
            <p className="text-xs text-slate-400">
              Пошаговые консольные команды для создания проекта и кодогенерации
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 font-mono text-xs mt-4">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-sans">
              1. Создание проекта
            </div>
            <div className="text-emerald-400 font-bold">flutter create . --org com.variant7</div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-sans">
              2. Загрузка пакетов
            </div>
            <div className="text-emerald-400 font-bold">flutter pub get</div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-sans">
              3. Кодогенерация (Freezed & Isar)
            </div>
            <div className="text-amber-400 font-bold">dart run build_runner build -d</div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-sans">
              4. Запуск в Chrome
            </div>
            <div className="text-blue-400 font-bold">flutter run -d chrome</div>
          </div>
        </div>
      </div>

      {/* Основная рабочая область: Дерево файлов + Код */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Список файлов (Clean Architecture дерево) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
          <div className="flex items-center space-x-2 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <FolderTree className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Архитектурные файлы (Clean Arch)
            </h4>
          </div>

          <div className="space-y-1.5 overflow-y-auto flex-1 max-h-[600px]">
            {flutterCodeSnippets.map((snippet) => (
              <button
                key={snippet.id}
                onClick={() => setSelectedSnippetId(snippet.id)}
                className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex flex-col ${
                  selectedSnippetId === snippet.id
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500 text-emerald-900 dark:text-emerald-100 font-medium shadow-xs'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold truncate">{snippet.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                    {snippet.layer}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-1 truncate">
                  {snippet.filePath}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Просмотр кода выбранного файла */}
        <div className="lg:col-span-8 bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden shadow-xl flex flex-col">
          {/* Панель заголовка файла */}
          <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <FileCode className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div className="truncate">
                <span className="text-xs font-bold text-slate-200 block truncate">
                  {selectedSnippet.title}
                </span>
                <span className="text-[11px] font-mono text-emerald-400">
                  {selectedSnippet.filePath}
                </span>
              </div>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm flex-shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Скопировано!' : 'Скопировать'}</span>
            </button>
          </div>

          {/* Описание файла */}
          <div className="px-5 py-2.5 bg-slate-900/40 border-b border-slate-800/80 text-xs text-slate-400 italic">
            💡 {selectedSnippet.description}
          </div>

          {/* Сам код */}
          <div className="p-5 overflow-x-auto flex-1 font-mono text-xs leading-relaxed text-slate-200 max-h-[580px] overflow-y-auto">
            <pre>
              <code>{selectedSnippet.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
