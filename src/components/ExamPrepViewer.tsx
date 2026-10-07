import React, { useState } from 'react';
import { BookOpen, CheckCircle, HelpCircle, ChevronDown, ChevronUp, Sparkles, Award } from 'lucide-react';

interface QuestionItem {
  number: number;
  question: string;
  answer: string;
  flutterEquiv: string;
}

interface LabTopic {
  id: string;
  labNumber: number;
  title: string;
  color: string;
  questions: QuestionItem[];
}

const labTopics: LabTopic[] = [
  {
    id: 'lab1',
    labNumber: 1,
    title: 'ЛР №1: Проектирование UI и декларативный подход',
    color: 'emerald',
    questions: [
      {
        number: 1,
        question: 'В чем принципиальная разница между императивным (UIKit) и декларативным подходом (SwiftUI / Flutter)?',
        answer:
          'В императивном подходе разработчик вручную манипулирует деревом view (создает экземпляры, меняет свойства myLabel.text = "...", добавляет анимации по событию). В декларативном подходе (Flutter, SwiftUI) UI является чистой математической функцией от состояния: UI = f(State). При изменении состояния фреймворк вычисляет diff виртуального дерева и точечно перерисовывает только изменившиеся элементы.',
        flutterEquiv: 'Во Flutter: StatelessWidget / StatefulWidget / BlocBuilder перестраивают дерево виджетов декларативно.',
      },
      {
        number: 3,
        question: 'Какова роль контейнеров компоновки VStack, HStack, ZStack?',
        answer:
          'Это базовые стековые контейнеры компоновки. VStack организует дочерние элементы вертикально один под другим. HStack — горизонтально в ряд. ZStack накладывает слои друг на друга по оси глубины Z (подходит для бейджей, карточек поверх фото, фонов).',
        flutterEquiv: 'Во Flutter полные аналоги: Column (VStack), Row (HStack), Stack (ZStack).',
      },
      {
        number: 8,
        question: 'Что такое SafeArea и зачем она необходима?',
        answer:
          'SafeArea — это безопасная зона экрана, которая динамически учитывает аппаратные и системные вырезы (Dynamic Island, датчики Face ID, челка, закругления углов, системную полоску жестов Home Indicator и строку состояния). Обертка в SafeArea гарантирует, что кнопки и текст не будут перекрыты физическими элементами устройства.',
        flutterEquiv: 'Во Flutter: виджет SafeArea(child: ...).',
      },
      {
        number: 9,
        question: 'Как реализовать адаптивный интерфейс (iPhone vs iPad vs Web)?',
        answer:
          'Использование относительных сеток, вычисляемых пропорций, LayoutBuilder / GeometryReader и MediaQueries, а также адаптивных брейкпоинтов (например, 1 колонка на смартфонах, 2-3 колонки на планшетах и десктопе).',
        flutterEquiv: 'Во Flutter: LayoutBuilder, MediaQuery.sizeOf(context), GridView.responsive.',
      },
    ],
  },
  {
    id: 'lab2',
    labNumber: 2,
    title: 'ЛР №2: Архитектурный паттерн MVVM / Cubit',
    color: 'purple',
    questions: [
      {
        number: 1,
        question: 'Почему выбран Cubit вместо стандартного BLoC или Stateful UI?',
        answer:
          'Cubit — это упрощенный подвид BLoC из библиотеки flutter_bloc, идеально соответствующий паттерну MVVM. В BLoC каждое действие требует создания класса события (Event), диспетчеризации через add(Event) и обработки в event handler. В Cubit логика сводится к вызову методов (например, cubit.waterPlant(id)), которые эмитируют новые состояния emit(State). Это устраняет лишний бойлерплейт, сохраняя однонаправленный поток данных (UDF).',
        flutterEquiv: 'Class PlantListCubit extends Cubit<PlantListState> с методами emit().',
      },
      {
        number: 3,
        question: 'В чем преимущества слабой связанности между слоями (Clean Architecture)?',
        answer:
          'Разделение на Data, Domain и Presentation гарантирует, что бизнес-правила (расчет просрочки полива) независимы от конкретной базы данных (Isar) или сетевого протокола (Dio). При необходимости базу данных или API можно заменить без изменения логики экранов.',
        flutterEquiv: 'Интерфейсы Repositories в domain-слое, реализации в data-слое.',
      },
    ],
  },
  {
    id: 'lab3',
    labNumber: 3,
    title: 'ЛР №3: Хранение данных (Isar NoSQL и Realm SDK)',
    color: 'amber',
    questions: [
      {
        number: 1,
        question: 'В чем различия между основной БД (Isar) и вспомогательной (Realm) по нашему ТЗ?',
        answer:
          'Isar — ультрабыстрая реляционная NoSQL база данных, написанная на Rust под Flutter. Она хранит динамические пользовательские данные: сущности растений, журнал ухода, расписание напоминаний, поддерживая реляционные связи 1-ко-многим через IsarLinks. Realm SDK используется как изолированное вспомогательное хранилище для статических, неизменяемых справочников (ботанические семейства, типы удобрений) благодаря мгновенной zero-copy сериализации.',
        flutterEquiv: 'Isar: @collection class PlantEntity; Realm: @RealmModel class _PlantFamilyRealm.',
      },
      {
        number: 5,
        question: 'Как описываются связи один-ко-многим и каскадное удаление?',
        answer:
          'В Isar связь 1-ко-многим описывается через контейнер IsarLinks<CareLogEntity>(). В связанной модели CareLogEntity указывается обратная связь @Backlink(to: "careLogs"). При удалении растения Isar позволяет каскадно очистить связанные логи ухода в одной транзакции isar.writeTxn().',
        flutterEquiv: 'final careLogs = IsarLinks<CareLogEntity>();',
      },
      {
        number: 9,
        question: 'Что такое «ленивая загрузка» (Lazy Loading) объектов из БД?',
        answer:
          'Ленивая загрузка означает, что связанные объекты (например, сотни записей журнала ухода) не извлекаются в оперативную память вместе с карточкой растения сразу. Они подгружаются только при прямом обращении к связи (await plant.careLogs.load()), что предотвращает перерасход RAM.',
        flutterEquiv: 'В Isar вызов await plant.careLogs.load().',
      },
    ],
  },
  {
    id: 'lab4',
    labNumber: 4,
    title: 'ЛР №4: Сетевой слой REST API (Dio) и Реактивность (Streams)',
    color: 'sky',
    questions: [
      {
        number: 1,
        question: 'Последовательность шагов сетевого запроса к Perenual API через Dio:',
        answer:
          '1) Формирование базового URL и query-параметров (?key=...&q=Monstera). 2) Асинхронный GET-запрос через Dio клиент с интерцепторами логирования. 3) Валидация HTTP статус-кода 200. 4) Десериализация JSON-ответа в иммутабельные Freezed DTO. 5) Преобразование DTO в Isar Entity и сохранение в локальную БД.',
        flutterEquiv: 'await dio.get("/species-list", queryParameters: {...}) с Freezed маппингом.',
      },
      {
        number: 2,
        question: 'Что такое реактивный поток данных (Stream во Flutter / Combine в iOS)?',
        answer:
          'Stream (поток) — это конвейер асинхронно поступающих данных во времени. В нашем приложении Isar база данных предоставляет метод watchAllPlants(), возвращающий Stream<List<PlantEntity>>. Как только пользователь поливает цветок или добавляет новый, Isar автоматически пушит свежий список в Stream, и Cubit мгновенно обновляет интерфейс без ручных запросов!',
        flutterEquiv: 'StreamSubscription sub = isar.plants.where().watch().listen(...);',
      },
    ],
  },
];

export const ExamPrepViewer: React.FC = () => {
  const [openQuestion, setOpenQuestion] = useState<string | null>('lab1-1');

  const toggleQuestion = (id: string) => {
    setOpenQuestion(openQuestion === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Заголовочный баннер */}
      <div className="bg-gradient-to-r from-emerald-900 to-slate-900 rounded-3xl p-6 text-white border border-emerald-800/60 shadow-lg">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              Готовые ответы на контрольные вопросы (ЛР №1 – №4)
            </h2>
            <p className="text-xs text-emerald-200/80">
              Сравнение требований методички (SwiftUI/Combine/SwiftData) с разрешенным стеком Flutter (Cubit/Streams/Isar/Realm/Dio)
            </p>
          </div>
        </div>
      </div>

      {/* Список тем по лабораторным работам */}
      <div className="space-y-6">
        {labTopics.map((topic) => (
          <div
            key={topic.id}
            className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">
                  {topic.labNumber}
                </span>
                <span>{topic.title}</span>
              </h3>
              <span className="text-xs text-slate-400">
                Вопросов: {topic.questions.length}
              </span>
            </div>

            <div className="space-y-2.5">
              {topic.questions.map((q) => {
                const qId = `${topic.id}-${q.number}`;
                const isOpen = openQuestion === qId;
                return (
                  <div
                    key={qId}
                    className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => toggleQuestion(qId)}
                      className="w-full text-left p-4 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center space-x-3 pr-4">
                        <HelpCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {q.number}. {q.question}
                        </span>
                      </div>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="p-4 bg-white dark:bg-slate-900 text-xs space-y-3 border-t border-slate-100 dark:border-slate-800">
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                            Ответ для преподавателя:
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            {q.answer}
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200">
                          <span className="font-bold">Аналог во Flutter / Dart: </span>
                          <span>{q.flutterEquiv}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
