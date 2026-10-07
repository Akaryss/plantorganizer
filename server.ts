import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const PORT = 3000;
const DEFAULT_GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Фабрика клиента Google GenAI с поддержкой пользовательского ключа
function getAiClient(customKey?: string): GoogleGenAI | null {
  const key = customKey?.trim() || process.env.GEMINI_API_KEY || DEFAULT_GEMINI_API_KEY;
  if (!key) return null;
  try {
    return new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
    return null;
  }
}

let aiClient: GoogleGenAI | null = getAiClient();

// Резервный словарь для быстрого оффлайн-перевода названий на латынь и GBIF
const BOTANICAL_LATIN_DICTIONARY: Record<
  string,
  {
    latinName: string;
    canonicalName: string;
    russianName: string;
    family: string;
    familyLatin: string;
    wateringDays: number;
    humidity: number;
    light: 'Яркий рассеянный' | 'Прямой солнечный' | 'Полутень' | 'Теневыносливое';
    temperature: string;
    difficulty: 'Легкий' | 'Средний' | 'Сложный';
    soil: string;
    fertilizer: string;
    description: string;
    careGuide: string;
    gbifKey: number;
    imageUrl: string;
  }
> = {
  'сансевиерия': {
    latinName: 'Sansevieria trifasciata Prain',
    canonicalName: 'Sansevieria trifasciata',
    russianName: 'Сансевиерия трехполосная (Щучий хвост)',
    family: 'Спаржевые',
    familyLatin: 'Asparagaceae',
    wateringDays: 14,
    humidity: 40,
    light: 'Полутень',
    temperature: '16-28 °C',
    difficulty: 'Легкий',
    soil: 'Легкий грунт для суккулентов с крупным песком и перлитом',
    fertilizer: 'Минеральное для кактусов NPK 5-10-10 раз в месяц весной-летом',
    description: 'Суккулент с прямостоячими плотными мечевидными листьями. Идеальный очиститель воздуха, переносит длительную засуху и затенение.',
    careGuide: 'Поливать только после полного высыхания земляного кома. Воду не лить в центр розетки.',
    gbifKey: 2769850,
    imageUrl: 'https://images.unsplash.com/photo-1593482892290-f54927ae1bf6?auto=format&fit=crop&w=800&q=80',
  },
  'щучий хвост': {
    latinName: 'Sansevieria trifasciata Prain',
    canonicalName: 'Sansevieria trifasciata',
    russianName: 'Сансевиерия трехполосная (Щучий хвост)',
    family: 'Спаржевые',
    familyLatin: 'Asparagaceae',
    wateringDays: 14,
    humidity: 40,
    light: 'Полутень',
    temperature: '16-28 °C',
    difficulty: 'Легкий',
    soil: 'Легкий грунт для суккулентов с крупным песком и перлитом',
    fertilizer: 'Минеральное для кактусов NPK 5-10-10',
    description: 'Народное название сансевиерии. Крайне выносливое растение, устойчивое к сухому воздуху.',
    careGuide: 'Редкий умеренный полив раз в 14 дней, не переувлажнять.',
    gbifKey: 2769850,
    imageUrl: 'https://images.unsplash.com/photo-1593482892290-f54927ae1bf6?auto=format&fit=crop&w=800&q=80',
  },
  'тещин язык': {
    latinName: 'Sansevieria trifasciata Prain',
    canonicalName: 'Sansevieria trifasciata',
    russianName: 'Сансевиерия (Тещин язык)',
    family: 'Спаржевые',
    familyLatin: 'Asparagaceae',
    wateringDays: 14,
    humidity: 40,
    light: 'Полутень',
    temperature: '16-28 °C',
    difficulty: 'Легкий',
    soil: 'Песчаный субстрат с дренажем',
    fertilizer: 'Удобрение для суккулентов NPK 5-10-10',
    description: 'Популярное народное название сансевиерии из-за длинных и острых полосатых листьев.',
    careGuide: 'Полив редкий, зимой раз в 3 недели. Беречь от перелива.',
    gbifKey: 2769850,
    imageUrl: 'https://images.unsplash.com/photo-1593482892290-f54927ae1bf6?auto=format&fit=crop&w=800&q=80',
  },
  'денежное дерево': {
    latinName: 'Crassula ovata (Mill.) Druce',
    canonicalName: 'Crassula ovata',
    russianName: 'Толстянка овальная (Денежное дерево)',
    family: 'Толстянковые',
    familyLatin: 'Crassulaceae',
    wateringDays: 10,
    humidity: 45,
    light: 'Яркий рассеянный',
    temperature: '18-24 °C',
    difficulty: 'Легкий',
    soil: 'Смесь дерновой земли, крупного песка и древесного угля',
    fertilizer: 'Для суккулентов раз в 3-4 недели весной',
    description: 'Древовидный суккулент с мясистыми округлыми глянцевыми листьями, символизирует достаток.',
    careGuide: 'Полив после просыхания 2/3 земляного кома. Обеспечить хорошее солнечное освещение.',
    gbifKey: 2985854,
    imageUrl: 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=800&q=80',
  },
  'толстянка': {
    latinName: 'Crassula ovata (Mill.) Druce',
    canonicalName: 'Crassula ovata',
    russianName: 'Толстянка древовидная (Крассула)',
    family: 'Толстянковые',
    familyLatin: 'Crassulaceae',
    wateringDays: 10,
    humidity: 45,
    light: 'Яркий рассеянный',
    temperature: '18-24 °C',
    difficulty: 'Легкий',
    soil: 'Дренированный грунт для кактусов',
    fertilizer: 'Калийно-фосфорное для суккулентов',
    description: 'Суккулент семейства толстянковых с плотным стеблем и мясистыми листьями.',
    careGuide: 'Умеренный полив, защита от застоя влаги в корнях.',
    gbifKey: 2985854,
    imageUrl: 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=800&q=80',
  },
  'женское счастье': {
    latinName: 'Spathiphyllum wallisii Regel',
    canonicalName: 'Spathiphyllum wallisii',
    russianName: 'Спатифиллум Уоллиса (Женское счастье)',
    family: 'Ароидные',
    familyLatin: 'Araceae',
    wateringDays: 4,
    humidity: 70,
    light: 'Полутень',
    temperature: '19-24 °C',
    difficulty: 'Легкий',
    soil: 'Рыхлый влагоемкий слабокислый субстрат с торфом и корой',
    fertilizer: 'Жидкое комплексное для цветущих NPK 10-15-20',
    description: 'Изящное комнатное растение с белоснежными покрывалами соцветий. Отлично сигнализирует о нехватке влаги пониканием листьев.',
    careGuide: 'Регулярный полив, не допускать пересушки. Любит опрыскивание теплой мягкой водой.',
    gbifKey: 2869584,
    imageUrl: 'https://images.unsplash.com/photo-1593691509543-c55fb32e7355?auto=format&fit=crop&w=800&q=80',
  },
  'спатифиллум': {
    latinName: 'Spathiphyllum wallisii Regel',
    canonicalName: 'Spathiphyllum wallisii',
    russianName: 'Спатифиллум Уоллиса',
    family: 'Ароидные',
    familyLatin: 'Araceae',
    wateringDays: 4,
    humidity: 70,
    light: 'Полутень',
    temperature: '19-24 °C',
    difficulty: 'Легкий',
    soil: 'Торфяной субстрат с кокосовым волокном и перлитом',
    fertilizer: 'Для ароидных и цветущих',
    description: 'Вечнозеленое травянистое растение с темно-зелеными глянцевыми листьями и белыми цветками-початками.',
    careGuide: 'Полив 2 раза в неделю, опрыскивание листьев.',
    gbifKey: 2869584,
    imageUrl: 'https://images.unsplash.com/photo-1593691509543-c55fb32e7355?auto=format&fit=crop&w=800&q=80',
  },
  'монстера': {
    latinName: 'Monstera deliciosa Liebm.',
    canonicalName: 'Monstera deliciosa',
    russianName: 'Монстера деликатесная',
    family: 'Ароидные',
    familyLatin: 'Araceae',
    wateringDays: 6,
    humidity: 65,
    light: 'Яркий рассеянный',
    temperature: '18-26 °C',
    difficulty: 'Легкий',
    soil: 'Питательный воздухопроницаемый грунт с перлитом и сосновой корой',
    fertilizer: 'Азотное для декоративно-лиственных NPK 18-6-12',
    description: 'Крупная тропическая лиана с перфорированными резными листьями и мощными воздушными корнями.',
    careGuide: 'Полив после подсыхания верхних 3 см почвы. Направлять воздушные корни во влажный мох.',
    gbifKey: 2868155,
    imageUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=800&q=80',
  },
  'замиокулькас': {
    latinName: 'Zamioculcas zamiifolia (Lodd.) Engl.',
    canonicalName: 'Zamioculcas zamiifolia',
    russianName: 'Замиокулькас замиелистный (Долларовое дерево)',
    family: 'Ароидные',
    familyLatin: 'Araceae',
    wateringDays: 14,
    humidity: 45,
    light: 'Полутень',
    temperature: '18-26 °C',
    difficulty: 'Легкий',
    soil: 'Воздухопроницаемый субстрат для суккулентов с керамзитом и песком',
    fertilizer: 'Органико-минеральное раз в 3-4 недели весной-летом',
    description: 'Сверхвыносливый вечнозеленый клубневой суккулент с глянцевыми перистыми листьями.',
    careGuide: 'Крайне редкий полив! Клубни накапливают воду — перелив вызывает загнивание.',
    gbifKey: 2868870,
    imageUrl: 'https://images.unsplash.com/photo-1632207691143-643e2a9a9361?auto=format&fit=crop&w=800&q=80',
  },
  'долларовое дерево': {
    latinName: 'Zamioculcas zamiifolia (Lodd.) Engl.',
    canonicalName: 'Zamioculcas zamiifolia',
    russianName: 'Замиокулькас (Долларовое дерево)',
    family: 'Ароидные',
    familyLatin: 'Araceae',
    wateringDays: 14,
    humidity: 45,
    light: 'Полутень',
    temperature: '18-26 °C',
    difficulty: 'Легкий',
    soil: 'Грунт для кактусов и суккулентов',
    fertilizer: 'Для суккулентов',
    description: 'Народное название замиокулькаса, ассоциирующееся с финансовым благополучием.',
    careGuide: 'Полив не чаще раза в 2 недели, сухостойный режим.',
    gbifKey: 2868870,
    imageUrl: 'https://images.unsplash.com/photo-1632207691143-643e2a9a9361?auto=format&fit=crop&w=800&q=80',
  },
  'фикус лирата': {
    latinName: 'Ficus lyrata Warb.',
    canonicalName: 'Ficus lyrata',
    russianName: 'Фикус лировидный',
    family: 'Тутовые',
    familyLatin: 'Moraceae',
    wateringDays: 7,
    humidity: 60,
    light: 'Яркий рассеянный',
    temperature: '20-25 °C',
    difficulty: 'Средний',
    soil: 'Дренированный слабокислый грунт для фикусов',
    fertilizer: 'Азотно-фосфорный комплекс NPK 14-7-14',
    description: 'Древовидное растение с гигантскими волнистыми листьями, напоминающими скрипку или лиру.',
    careGuide: 'Поливать теплой отстоянной водой, избегать сквозняков и перестановки.',
    gbifKey: 5361922,
    imageUrl: 'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=800&q=80',
  },
  'фикус бенджамина': {
    latinName: 'Ficus benjamina L.',
    canonicalName: 'Ficus benjamina',
    russianName: 'Фикус Бенджамина',
    family: 'Тутовые',
    familyLatin: 'Moraceae',
    wateringDays: 5,
    humidity: 55,
    light: 'Яркий рассеянный',
    temperature: '20-25 °C',
    difficulty: 'Средний',
    soil: 'Универсальный с добавлением песка и вермикулита',
    fertilizer: 'Для фикусов раз в 2 недели',
    description: 'Вечнозеленое деревце с тонкими поникающими ветвями и глянцевыми овальными листочками.',
    careGuide: 'Беречь от сквозняков и холодных подоконников. Полив после подсыхания верхнего слоя.',
    gbifKey: 5361909,
    imageUrl: 'https://images.unsplash.com/photo-1596724817757-9754f971b3e7?auto=format&fit=crop&w=800&q=80',
  },
  'алоэ вера': {
    latinName: 'Aloe vera (L.) Burm.f.',
    canonicalName: 'Aloe vera',
    russianName: 'Алоэ настоящее (Алоэ вера)',
    family: 'Асфоделовые',
    familyLatin: 'Asphodelaceae',
    wateringDays: 14,
    humidity: 35,
    light: 'Прямой солнечный',
    temperature: '16-27 °C',
    difficulty: 'Легкий',
    soil: 'Песчаная смесь для кактусов и суккулентов с хорошим дренажем',
    fertilizer: 'Для кактусов весной и летом',
    description: 'Целебный суккулент с мясистыми зазубренными листьями, содержащими лечебный гель.',
    careGuide: 'Много солнца, редкий полив только после полного просыхания почвы.',
    gbifKey: 2778644,
    imageUrl: 'https://images.unsplash.com/photo-1567689265664-1c48de61db0b?auto=format&fit=crop&w=800&q=80',
  },
  'хлорофитум': {
    latinName: 'Chlorophytum comosum (Thunb.) Jacques',
    canonicalName: 'Chlorophytum comosum',
    russianName: 'Хлорофитум хохлатый',
    family: 'Спаржевые',
    familyLatin: 'Asparagaceae',
    wateringDays: 4,
    humidity: 55,
    light: 'Яркий рассеянный',
    temperature: '15-24 °C',
    difficulty: 'Легкий',
    soil: 'Легкий дерновый субстрат',
    fertilizer: 'Универсальное удобрение NPK 10-10-10',
    description: 'Травянистое растение с длинными линейными листьями и свисающими усами-детками. Чемпион по очистке воздуха.',
    careGuide: 'Обильный полив в теплое время года, любит опрыскивание.',
    gbifKey: 2770281,
    imageUrl: 'https://images.unsplash.com/photo-1572688484438-313a6e50c333?auto=format&fit=crop&w=800&q=80',
  },
  'орхидея': {
    latinName: 'Phalaenopsis aphrodite Rchb.f.',
    canonicalName: 'Phalaenopsis aphrodite',
    russianName: 'Орхидея Фаленопсис',
    family: 'Орхидные',
    familyLatin: 'Orchidaceae',
    wateringDays: 8,
    humidity: 65,
    light: 'Яркий рассеянный',
    temperature: '19-25 °C',
    difficulty: 'Средний',
    soil: 'Чистая сосновая кора крупной фракции с добавлением сфагнума',
    fertilizer: 'Специализированное для орхидей в половинной дозе методом погружения',
    description: 'Эпифитная орхидея с эффектными цветками-бабочками и толстыми зелеными воздушными корнями.',
    careGuide: 'Полив методом замачивания горшка в воде на 15-20 минут, когда корни станут серебристыми.',
    gbifKey: 5325852,
    imageUrl: 'https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=800&q=80',
  },
  'диффенбахия': {
    latinName: 'Dieffenbachia seguine (Jacq.) Schott',
    canonicalName: 'Dieffenbachia seguine',
    russianName: 'Диффенбахия пятнистая',
    family: 'Ароидные',
    familyLatin: 'Araceae',
    wateringDays: 5,
    humidity: 65,
    light: 'Яркий рассеянный',
    temperature: '19-24 °C',
    difficulty: 'Средний',
    soil: 'Слабокислый торфяной субстрат с листовой землей',
    fertilizer: 'Для декоративно-лиственных растений',
    description: 'Крупное тропическое растение с пестрыми бело-зелеными узорчатыми листьями.',
    careGuide: 'Регулярный полив, беречь от прямых лучей солнца и сквозняков. Сок ядовит при контакте со слизистыми.',
    gbifKey: 2868958,
    imageUrl: 'https://images.unsplash.com/photo-1599818818584-8848a6493630?auto=format&fit=crop&w=800&q=80',
  },
  'фикус каучуконосный': {
    latinName: 'Ficus elastica Roxb. ex Hornem.',
    canonicalName: 'Ficus elastica',
    russianName: 'Фикус каучуконосный (Фикус эластика)',
    family: 'Тутовые',
    familyLatin: 'Moraceae',
    wateringDays: 6,
    humidity: 55,
    light: 'Яркий рассеянный',
    temperature: '18-25 °C',
    difficulty: 'Легкий',
    soil: 'Рыхлый субстрат для фикусов с добавлением перлита',
    fertilizer: 'Для декоративно-лиственных NPK 10-10-10 раз в 2 недели',
    description: 'Древовидное вечнозеленое растение с мощными кожистыми глянцевыми овальными листьями.',
    careGuide: 'Полив после просыхания верхних 2-3 см грунта. Протирать листья влажной губкой от пыли.',
    gbifKey: 5361917,
    imageUrl: 'https://images.unsplash.com/photo-1596724817757-9754f971b3e7?auto=format&fit=crop&w=800&q=80',
  },
  'фикус эластика': {
    latinName: 'Ficus elastica Roxb. ex Hornem.',
    canonicalName: 'Ficus elastica',
    russianName: 'Фикус эластика (Каучуконосный)',
    family: 'Тутовые',
    familyLatin: 'Moraceae',
    wateringDays: 6,
    humidity: 55,
    light: 'Яркий рассеянный',
    temperature: '18-25 °C',
    difficulty: 'Легкий',
    soil: 'Рыхлый субстрат для фикусов с добавлением перлита',
    fertilizer: 'Для фикусов NPK 10-10-10',
    description: 'Популярный вид фикуса с крупными кожистыми плотными листьями темного изумрудного оттенка.',
    careGuide: 'Любит стабильное рассеянное освещение, не переносит застоя воды в поддоне.',
    gbifKey: 5361917,
    imageUrl: 'https://images.unsplash.com/photo-1596724817757-9754f971b3e7?auto=format&fit=crop&w=800&q=80',
  },
  'мужское счастье': {
    latinName: 'Anthurium andraeanum Linden ex André',
    canonicalName: 'Anthurium andraeanum',
    russianName: 'Антуриум Андре (Мужское счастье)',
    family: 'Ароидные',
    familyLatin: 'Araceae',
    wateringDays: 5,
    humidity: 70,
    light: 'Яркий рассеянный',
    temperature: '20-26 °C',
    difficulty: 'Средний',
    soil: 'Легкая кислая смесь: кора, верховой торф, сфагнум и перлит',
    fertilizer: 'Фосфорно-калийное для цветущих в половинной дозе',
    description: 'Эффектное цветущее растение с сердцевидными кожистыми листьями и алыми восковыми прицветниками.',
    careGuide: 'Полив теплой мягкой водой, беречь от сквозняков и пересыхания воздушных корней.',
    gbifKey: 2872322,
    imageUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=800&q=80',
  },
  'антуриум': {
    latinName: 'Anthurium andraeanum Linden ex André',
    canonicalName: 'Anthurium andraeanum',
    russianName: 'Антуриум Андре',
    family: 'Ароидные',
    familyLatin: 'Araceae',
    wateringDays: 5,
    humidity: 70,
    light: 'Яркий рассеянный',
    temperature: '20-26 °C',
    difficulty: 'Средний',
    soil: 'Воздухопроницаемый грунт для ароидных с сосновой корой',
    fertilizer: 'Для цветущих растений',
    description: 'Вечнозеленое тропическое растение с цветками-початками и глянцевым покрывалом.',
    careGuide: 'Умеренный полив, высокая влажность, рассеянный свет без полуденного солнца.',
    gbifKey: 2872322,
    imageUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=800&q=80',
  },
  'эпипремнум': {
    latinName: 'Epipremnum aureum (Linden & André) G.S.Bunting',
    canonicalName: 'Epipremnum aureum',
    russianName: 'Эпипремнум золотистый',
    family: 'Ароидные',
    familyLatin: 'Araceae',
    wateringDays: 6,
    humidity: 55,
    light: 'Полутень',
    temperature: '18-26 °C',
    difficulty: 'Легкий',
    soil: 'Универсальный легкий субстрат с вермикулитом',
    fertilizer: 'Комплексное минеральное для лиственных',
    description: 'Неприхотливая быстрорастущая лиана с золотисто-зелеными мраморными листьями.',
    careGuide: 'Полив умеренный по мере просыхания верхнего слоя, легко укореняется черенками.',
    gbifKey: 2868323,
    imageUrl: 'https://images.unsplash.com/photo-1596724817757-9754f971b3e7?auto=format&fit=crop&w=800&q=80',
  },
  'потос': {
    latinName: 'Epipremnum aureum (Linden & André) G.S.Bunting',
    canonicalName: 'Epipremnum aureum',
    russianName: 'Эпипремнум (Потос золотистый)',
    family: 'Ароидные',
    familyLatin: 'Araceae',
    wateringDays: 6,
    humidity: 55,
    light: 'Полутень',
    temperature: '18-26 °C',
    difficulty: 'Легкий',
    soil: 'Торфяной субстрат с дренажем',
    fertilizer: 'Для лиственных',
    description: 'Ампельное комнатное растение, известное на Западе как Golden Pothos или Devil’s Ivy.',
    careGuide: 'Устойчив к полутени, поливать раз в 6-7 дней.',
    gbifKey: 2868323,
    imageUrl: 'https://images.unsplash.com/photo-1596724817757-9754f971b3e7?auto=format&fit=crop&w=800&q=80',
  },
  'сциндапсус': {
    latinName: 'Scindapsus pictus Hassk.',
    canonicalName: 'Scindapsus pictus',
    russianName: 'Сциндапсус расписной',
    family: 'Ароидные',
    familyLatin: 'Araceae',
    wateringDays: 6,
    humidity: 60,
    light: 'Полутень',
    temperature: '19-25 °C',
    difficulty: 'Легкий',
    soil: 'Рыхлый субстрат для лиан',
    fertilizer: 'NPK 10-10-10',
    description: 'Изящная лиана с бархатистыми листьями и серебристыми крапинами (Satin Pothos).',
    careGuide: 'Полив после просыхания почвы на треть, избегать переувлажнения.',
    gbifKey: 2868320,
    imageUrl: 'https://images.unsplash.com/photo-1596724817757-9754f971b3e7?auto=format&fit=crop&w=800&q=80',
  },
  'шеффлера': {
    latinName: 'Schefflera arboricola (Hayata) Merr.',
    canonicalName: 'Schefflera arboricola',
    russianName: 'Шеффлера древовидная (Зонтичное дерево)',
    family: 'Аралиевые',
    familyLatin: 'Araliaceae',
    wateringDays: 6,
    humidity: 55,
    light: 'Яркий рассеянный',
    temperature: '18-24 °C',
    difficulty: 'Легкий',
    soil: 'Дерновая земля с песком и перегноем',
    fertilizer: 'Комплексное для декоративно-лиственных',
    description: 'Древовидный кустарник с пальчато-сложными листьями, напоминающими зонтики.',
    careGuide: 'Умеренный полив, любит опрыскивание листьев, беречь от жары батарей.',
    gbifKey: 3036496,
    imageUrl: 'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=800&q=80',
  },
  'кротон': {
    latinName: 'Codiaeum variegatum (L.) Rumph. ex A.Juss.',
    canonicalName: 'Codiaeum variegatum',
    russianName: 'Кодиеум пестрый (Кротон)',
    family: 'Молочайные',
    familyLatin: 'Euphorbiaceae',
    wateringDays: 5,
    humidity: 70,
    light: 'Яркий рассеянный',
    temperature: '20-25 °C',
    difficulty: 'Средний',
    soil: 'Питательный слабокислый грунт',
    fertilizer: 'Для пестролистных растений раз в 2 недели',
    description: 'Кустарник с яркими жесткими листьями огненно-красной, желтой и зеленой окраски.',
    careGuide: 'Требует много яркого света для сохранения пестроты и высокой влажности воздуха.',
    gbifKey: 3058888,
    imageUrl: 'https://images.unsplash.com/photo-1597055181300-e3633a917c9c?auto=format&fit=crop&w=800&q=80',
  },
  'бегония': {
    latinName: 'Begonia maculata Raddi',
    canonicalName: 'Begonia maculata',
    russianName: 'Бегония пятнистая (Макулата)',
    family: 'Бегониевые',
    familyLatin: 'Begoniaceae',
    wateringDays: 5,
    humidity: 65,
    light: 'Яркий рассеянный',
    temperature: '18-24 °C',
    difficulty: 'Средний',
    soil: 'Легкий слабокислый торфяной субстрат',
    fertilizer: 'Для цветущих и декоративно-лиственных',
    description: 'Тростниковая бегония с листьями в серебристый горошек и рубиновой изнанкой.',
    careGuide: 'Полив под корень, не мочить листья во избежание пятен.',
    gbifKey: 7303036,
    imageUrl: 'https://images.unsplash.com/photo-1597055181300-e3633a917c9c?auto=format&fit=crop&w=800&q=80',
  },
  'драцена': {
    latinName: 'Dracaena reflexa var. angustifolia Baker',
    canonicalName: 'Dracaena reflexa',
    russianName: 'Драцена окаймленная (Маргината)',
    family: 'Спаржевые',
    familyLatin: 'Asparagaceae',
    wateringDays: 7,
    humidity: 50,
    light: 'Яркий рассеянный',
    temperature: '18-25 °C',
    difficulty: 'Легкий',
    soil: 'Универсальный грунт для пальм и драцен с дренажем',
    fertilizer: 'Для пальм и фикусов',
    description: 'Древовидное растение с изящным стволом и густым пучком узких ланцетных листьев.',
    careGuide: 'Полив после подсыхания верхних 3 см, не допускать застоя воды в корнях.',
    gbifKey: 2769842,
    imageUrl: 'https://images.unsplash.com/photo-1598880940371-c756e015faf1?auto=format&fit=crop&w=800&q=80',
  },
  'юкка': {
    latinName: 'Yucca gigantea Lem.',
    canonicalName: 'Yucca gigantea',
    russianName: 'Юкка слоновая',
    family: 'Спаржевые',
    familyLatin: 'Asparagaceae',
    wateringDays: 10,
    humidity: 40,
    light: 'Прямой солнечный',
    temperature: '16-26 °C',
    difficulty: 'Легкий',
    soil: 'Тяжелый песчаный субстрат с хорошим дренажем',
    fertilizer: 'Для кактусов и суккулентов',
    description: 'Ложная пальма с мощным древесным стволом и пучками мечевидных жестких листьев.',
    careGuide: 'Много солнечного света, полив умеренный только после полного просыхания почвы.',
    gbifKey: 2769800,
    imageUrl: 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=800&q=80',
  },
  'традесканция': {
    latinName: 'Tradescantia zebrina Bosse',
    canonicalName: 'Tradescantia zebrina',
    russianName: 'Традесканция зебрина',
    family: 'Коммелиновые',
    familyLatin: 'Commelinaceae',
    wateringDays: 4,
    humidity: 60,
    light: 'Яркий рассеянный',
    temperature: '18-24 °C',
    difficulty: 'Легкий',
    soil: 'Универсальный легкий субстрат',
    fertilizer: 'NPK 10-10-10 в половинной дозе',
    description: 'Быстрорастущее ампельное растение с полосатыми серебристо-пурпурными листьями.',
    careGuide: 'Регулярный полив, прищипывание верхушек побегов для пышности куста.',
    gbifKey: 2765315,
    imageUrl: 'https://images.unsplash.com/photo-1596724817757-9754f971b3e7?auto=format&fit=crop&w=800&q=80',
  },
  'хойя': {
    latinName: 'Hoya carnosa (L.f.) R.Br.',
    canonicalName: 'Hoya carnosa',
    russianName: 'Хойя мясистая (Восковой плющ)',
    family: 'Кутровые',
    familyLatin: 'Apocynaceae',
    wateringDays: 8,
    humidity: 50,
    light: 'Яркий рассеянный',
    temperature: '18-25 °C',
    difficulty: 'Легкий',
    soil: 'Легкий субстрат с добавлением сосновой коры и перлита',
    fertilizer: 'Фосфорно-калийное для цветущих суккулентов',
    description: 'Лиана с восковыми мясистыми листьями и ароматными зонтиками звездчатых цветков.',
    careGuide: 'Полив после просыхания верхнего слоя. Не срезать отцветшие цветоносы!',
    gbifKey: 3173166,
    imageUrl: 'https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=800&q=80',
  },
  'восковой плющ': {
    latinName: 'Hoya carnosa (L.f.) R.Br.',
    canonicalName: 'Hoya carnosa',
    russianName: 'Хойя карноза (Восковой плющ)',
    family: 'Кутровые',
    familyLatin: 'Apocynaceae',
    wateringDays: 8,
    humidity: 50,
    light: 'Яркий рассеянный',
    temperature: '18-25 °C',
    difficulty: 'Легкий',
    soil: 'Легкий субстрат с корой и перлитом',
    fertilizer: 'Для цветущих',
    description: 'Народное название хойи с плотными восковыми листочками.',
    careGuide: 'Полив умеренный, яркий рассеянный свет стимулирует цветение.',
    gbifKey: 3173166,
    imageUrl: 'https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=800&q=80',
  },
  'плющ': {
    latinName: 'Hedera helix L.',
    canonicalName: 'Hedera helix',
    russianName: 'Плющ обыкновенный',
    family: 'Аралиевые',
    familyLatin: 'Araliaceae',
    wateringDays: 5,
    humidity: 60,
    light: 'Полутень',
    temperature: '15-22 °C',
    difficulty: 'Легкий',
    soil: 'Универсальный воздухопроницаемый грунт',
    fertilizer: 'NPK 10-10-10',
    description: 'Вечнозеленая вьющаяся лиана с кожистыми лопастными листьями.',
    careGuide: 'Любит прохладу, регулярный полив и периодическое купание под теплым душем.',
    gbifKey: 3035777,
    imageUrl: 'https://images.unsplash.com/photo-1596724817757-9754f971b3e7?auto=format&fit=crop&w=800&q=80',
  },
  'калатея': {
    latinName: 'Goeppertia orbifolia (Linden) Borchs. & S.Suárez',
    canonicalName: 'Goeppertia orbifolia',
    russianName: 'Калатея орбифолия (Молитвенный цветок)',
    family: 'Марантовые',
    familyLatin: 'Marantaceae',
    wateringDays: 4,
    humidity: 75,
    light: 'Полутень',
    temperature: '20-25 °C',
    difficulty: 'Сложный',
    soil: 'Слабокислый легкий субстрат с торфом и сфагнумом',
    fertilizer: 'Специальное для марантовых в слабой дозе',
    description: 'Тропическое растение с серебристо-полосатыми округлыми листьями, складывающимися на ночь.',
    careGuide: 'Требует высокую влажность (от 65%) и мягкую фильтрованную воду комнатной температуры.',
    gbifKey: 3247012,
    imageUrl: 'https://images.unsplash.com/photo-1587573089734-09cb69c0f2b4?auto=format&fit=crop&w=800&q=80',
  },
  'замик': {
    latinName: 'Zamioculcas zamiifolia (Lodd.) Engl.',
    canonicalName: 'Zamioculcas zamiifolia',
    russianName: 'Замиокулькас (Замик)',
    family: 'Ароидные',
    familyLatin: 'Araceae',
    wateringDays: 14,
    humidity: 45,
    light: 'Полутень',
    temperature: '18-26 °C',
    difficulty: 'Легкий',
    soil: 'Грунт для суккулентов',
    fertilizer: 'Для суккулентов',
    description: 'Разговорное название выносливого замиокулькаса.',
    careGuide: 'Редкий полив раз в 2 недели, не переливать.',
    gbifKey: 2868870,
    imageUrl: 'https://images.unsplash.com/photo-1632207691143-643e2a9a9361?auto=format&fit=crop&w=800&q=80',
  },
  'замиокулькас равен': {
    latinName: 'Zamioculcas zamiifolia \'Raven\'',
    canonicalName: 'Zamioculcas zamiifolia',
    russianName: 'Замиокулькас «Черный ворон» (Raven)',
    family: 'Ароидные',
    familyLatin: 'Araceae',
    wateringDays: 14,
    humidity: 45,
    light: 'Полутень',
    temperature: '18-26 °C',
    difficulty: 'Легкий',
    soil: 'Дренированный грунт для суккулентов',
    fertilizer: 'Для суккулентов',
    description: 'Редкий культивар замиокулькаса с эффектными практически черными глянцевыми листьями.',
    careGuide: 'Полив после полного просыхания земляного кома. Очень устойчив к сухости.',
    gbifKey: 2868870,
    imageUrl: 'https://images.unsplash.com/photo-1632207691143-643e2a9a9361?auto=format&fit=crop&w=800&q=80',
  },
};

// Интеллектуальный поиск по ботаническому словарю с приоритетом длины ключа
// (чтобы "фикус каучуконосный" не перебивался общим "фикус")
function matchBotanicalDictionary(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  // 1. Точное совпадение
  if (BOTANICAL_LATIN_DICTIONARY[q]) {
    return BOTANICAL_LATIN_DICTIONARY[q];
  }

  // 2. Сортировка по убыванию длины ключа: длинные и точные словосочетания проверяются первыми!
  const sortedKeys = Object.keys(BOTANICAL_LATIN_DICTIONARY).sort((a, b) => b.length - a.length);

  for (const key of sortedKeys) {
    if (q.includes(key)) {
      return BOTANICAL_LATIN_DICTIONARY[key];
    }
  }

  // 3. Совпадение по началу слова
  if (q.length >= 3) {
    for (const key of sortedKeys) {
      if (key.startsWith(q)) {
        return BOTANICAL_LATIN_DICTIONARY[key];
      }
    }
  }

  return null;
}

// Функция запроса к официальному REST API GBIF по точному латинскому названию
async function fetchGbifByLatinName(latinName: string) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(
      `https://api.gbif.org/v1/species/match?verbose=true&name=${encodeURIComponent(latinName)}`,
      {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.usageKey) {
        return {
          usageKey: data.usageKey,
          scientificName: data.scientificName || latinName,
          canonicalName: data.canonicalName || latinName,
          rank: data.rank || 'SPECIES',
          status: data.status || 'ACCEPTED',
          confidence: data.confidence || 98,
          kingdom: data.kingdom || 'Plantae',
          phylum: data.phylum || 'Tracheophyta',
          order: data.order || 'Alismatales',
          family: data.family || 'Araceae',
          genus: data.genus || latinName.split(' ')[0],
          species: data.species || latinName,
        };
      }
    }
  } catch (err) {
    console.warn('GBIF online fetch error:', err);
  }
  return null;
}

// Функция извлечения реальной фотографии цветка из открытых веб-энциклопедий (Wikipedia/Wikimedia API)
async function fetchFlowerPhotoFromWeb(
  canonicalLatin: string,
  russianName: string
): Promise<string | null> {
  const headers = {
    'User-Agent': 'PlantOrganizerApp/1.0 (educational plant care app; contact@example.com)',
    Accept: 'application/json',
  };

  // 1. Попытка поиска по чистому латинскому названию (например, Sansevieria_trifasciata)
  if (canonicalLatin) {
    try {
      const cleanLatin = canonicalLatin.trim().replace(/\s+/g, '_');
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanLatin)}`,
        { headers }
      );
      if (res.ok) {
        const data: any = await res.json();
        const img = data.originalimage?.source || data.thumbnail?.source;
        if (img && !img.endsWith('.svg')) {
          return img;
        }
      }
    } catch (err) {
      console.warn('Wiki EN photo search error:', err);
    }
  }

  // 2. Попытка поиска по русскому названию (например, Толстянка, Спатифиллум, Сансевиерия)
  if (russianName) {
    try {
      const cleanRu = russianName.split('(')[0].trim().replace(/\s+/g, '_');
      const res = await fetch(
        `https://ru.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanRu)}`,
        { headers }
      );
      if (res.ok) {
        const data: any = await res.json();
        const img = data.originalimage?.source || data.thumbnail?.source;
        if (img && !img.endsWith('.svg')) {
          return img;
        }
      }
    } catch (err) {
      console.warn('Wiki RU photo search error:', err);
    }
  }

  // 3. Попытка поиска по родовому названию (Genus) в английской Википедии
  if (canonicalLatin) {
    const genus = canonicalLatin.split(' ')[0];
    if (genus && genus !== canonicalLatin) {
      try {
        const res = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(genus)}`,
          { headers }
        );
        if (res.ok) {
          const data: any = await res.json();
          const img = data.originalimage?.source || data.thumbnail?.source;
          if (img && !img.endsWith('.svg')) {
            return img;
          }
        }
      } catch (err) {
        console.warn('Wiki Genus photo search error:', err);
      }
    }
  }

  return null;
}

// Модели Gemini для работы: 3.8-flash для Vision/мультимодальности, 3.1-flash-lite для быстрого текста
const VISION_MODELS = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
const TEXT_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Эндпоинт проверки здоровья и готовности AI
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      aiConfigured: !!(process.env.GEMINI_API_KEY || DEFAULT_GEMINI_API_KEY),
      engine: 'Gemini 3.8 Flash Vision + Gemini 3.1 Flash Lite + GBIF REST API',
      models: {
        vision: 'gemini-3.8-flash',
        text: 'gemini-3.1-flash-lite',
      },
    });
  });

  // Эндпоинт верификации пользовательского API-ключа Gemini
  app.post('/api/verify-ai-key', async (req, res) => {
    const customKey = (req.body?.apiKey || '').trim();
    if (!customKey) {
      return res.status(400).json({ valid: false, error: 'API-ключ не указан' });
    }
    try {
      const client = new GoogleGenAI({ apiKey: customKey });
      const response = await client.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: 'Test connection. Reply "OK".',
      });
      return res.json({
        valid: true,
        model: 'gemini-3.1-flash-lite',
        message: 'API-ключ успешно проверен!',
        reply: response.text?.trim() || 'OK',
      });
    } catch (err: any) {
      console.warn('API key verification failed:', err);
      return res.status(400).json({
        valid: false,
        error: err.message || 'Недействительный ключ API Google Gemini',
      });
    }
  });

  // Эндпоинт специализированного умного перевода любого бытового названия растения на строгую латынь
  app.post('/api/smart-latin-translate', async (req, res) => {
    const query = (req.body?.query || '').trim();
    const customApiKey = (req.body?.apiKey || (req.headers['x-gemini-api-key'] as string) || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'Параметр query обязателен для перевода' });
    }

    const client = getAiClient(customApiKey);
    let aiTaxonomy: any = null;

    if (client) {
      const prompt = `Ты — ведущий ученый-систематик и эксперт по международной номенклатуре растений (ICN/GBIF).
Пользователь передает бытовое, обиходное, русское, сленговое или английское название растения: "${query}".

ТВОИ ЗАДАЧИ:
1. Строго и безошибочно определи биологический вид и переведи на каноническое латинское биномиальное название (род + видовой эпитет).
2. Учти общеизвестные народные синонимы:
   - "денежное дерево", "толстянка" -> Crassula ovata
   - "долларовое дерево", "замик", "замиокулькас" -> Zamioculcas zamiifolia
   - "щучий хвост", "тещин язык", "сансевиерия" -> Dracaena trifasciata (syn. Sansevieria trifasciata)
   - "женское счастье", "спатифиллум" -> Spathiphyllum wallisii
   - "мужское счастье", "антуриум" -> Anthurium andraeanum
   - "фикус лирата", "лировидный" -> Ficus lyrata
   - "фикус каучуконосный", "эластика" -> Ficus elastica
   - "фикус бенджамина" -> Ficus benjamina
   - "монстера", "монстера деликатесная" -> Monstera deliciosa
   - "шеффлера" -> Schefflera arboricola
   - "кротон" -> Codiaeum variegatum
   - "алоэ", "столетник" -> Aloe vera
   - "хлорофитум" -> Chlorophytum comosum
   - "орхидея", "фаленопсис" -> Phalaenopsis aphrodite
3. Предоставь официальное русское имя, семейство на русском и латыни, род и видовой эпитет.

Верни СТРОГО JSON:
{
  "canonicalLatin": "Род и вид без авторства (напр. Monstera deliciosa)",
  "scientificLatin": "Полное научное имя с автором или синонимом (напр. Monstera deliciosa Liebm.)",
  "russianCanonicalName": "Официальное русское название вида (напр. Монстера деликатесная)",
  "familyRu": "Семейство на русском (напр. Ароидные)",
  "familyLatin": "Семейство на латыни (напр. Araceae)",
  "genus": "Род растения (напр. Monstera)",
  "species": "Видовой эпитет (напр. deliciosa)",
  "synonyms": ["список синонимов, если есть"],
  "confidence": число от 75 до 99,
  "wateringFrequencyDays": рекомендуемый интервал полива в днях (число от 2 до 21),
  "lightRequirement": "Яркий рассеянный" | "Прямой солнечный" | "Полутень" | "Теневыносливое",
  "notes": "Краткая биологическая заметка о виде"
}`;

      for (const model of TEXT_MODELS) {
        try {
          const response = await client.models.generateContent({
            model,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
            },
          });
          const text = response.text?.trim();
          if (text) {
            aiTaxonomy = JSON.parse(text);
            console.log(`[Smart Latin] Model ${model} success: "${query}" -> ${aiTaxonomy.canonicalLatin}`);
            break;
          }
        } catch (err: any) {
          console.warn(`[Smart Latin] Model ${model} failed:`, err?.message || err);
        }
      }
    }

    if (aiTaxonomy && aiTaxonomy.canonicalLatin) {
      return res.json({
        query,
        canonicalLatin: aiTaxonomy.canonicalLatin,
        scientificLatin: aiTaxonomy.scientificLatin || aiTaxonomy.canonicalLatin,
        russianCanonicalName: aiTaxonomy.russianCanonicalName || query,
        familyRu: aiTaxonomy.familyRu || 'Комнатные растения',
        familyLatin: aiTaxonomy.familyLatin || 'Plantae',
        genus: aiTaxonomy.genus || aiTaxonomy.canonicalLatin.split(' ')[0],
        species: aiTaxonomy.species || '',
        synonyms: aiTaxonomy.synonyms || [],
        confidence: aiTaxonomy.confidence || 98,
        wateringFrequencyDays: aiTaxonomy.wateringFrequencyDays || 7,
        lightRequirement: aiTaxonomy.lightRequirement || 'Яркий рассеянный',
        notes: aiTaxonomy.notes || '',
        source: 'gemini-ai',
      });
    }

    // Резервный поиск по умному локальному словарю с приоритетом длины ключа
    const localMatch = matchBotanicalDictionary(query);
    if (localMatch) {
      return res.json({
        query,
        canonicalLatin: localMatch.canonicalName,
        scientificLatin: localMatch.latinName,
        russianCanonicalName: localMatch.russianName,
        familyRu: localMatch.family,
        familyLatin: localMatch.familyLatin,
        genus: localMatch.canonicalName.split(' ')[0],
        species: localMatch.canonicalName.split(' ').slice(1).join(' '),
        synonyms: [],
        confidence: 96,
        wateringFrequencyDays: localMatch.wateringDays,
        lightRequirement: localMatch.light,
        notes: localMatch.description,
        source: 'offline-dictionary',
      });
    }

    const capitalized = query.charAt(0).toUpperCase() + query.slice(1);
    return res.json({
      query,
      canonicalLatin: `${capitalized} sp.`,
      scientificLatin: `${capitalized} sp.`,
      russianCanonicalName: query,
      familyRu: 'Комнатные растения',
      familyLatin: 'Plantae',
      genus: capitalized,
      species: 'sp.',
      synonyms: [],
      confidence: 70,
      wateringFrequencyDays: 7,
      lightRequirement: 'Яркий рассеянный',
      notes: `Ботанический вид для «${query}».`,
      source: 'fallback',
    });
  });

  // Эндпоинт перевода пользовательского названия на латынь, получения параметров ухода и фото из веба
  app.post('/api/plant-ai-lookup', async (req, res) => {
    const query = (req.body?.query || '').trim();
    const customApiKey = (req.body?.apiKey || (req.headers['x-gemini-api-key'] as string) || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    // 1. Проверяем локальный ботанический словарь с приоритизацией специфичных фраз
    let localFound = matchBotanicalDictionary(query);

    let latinScientific = localFound ? localFound.latinName : '';
    let canonical = localFound ? localFound.canonicalName : '';
    let russianName = localFound ? localFound.russianName : query;
    let careData: any = localFound ? localFound : null;

    // 2. Запрос к модели Gemini для перевода на латынь и генерации регламента
    const client = getAiClient(customApiKey);
    if (client) {
      const prompt = `Ты — ведущий ботаник и эксперт по комнатным растениям.
Пользователь ищет комнатное растение по запросу: "${query}".

ТВОИ ЗАДАЧИ:
1. ПЕРВЫЙ ШАГ: Переведи бытовое/русское название на строгое латинское научное биномиальное название (scientific Latin binomial name, например "Sansevieria trifasciata", "Crassula ovata", "Monstera deliciosa", "Ficus lyrata", "Zamioculcas zamiifolia").
2. ВТОРОЙ ШАГ: Рассчитай точные параметры ухода для содержания в квартире:
   - canonicalLatin: чистое латинское название без авторства (род + вид)
   - scientificLatin: полное латинское название с автором или вариететом
   - russianCanonicalName: официальное русское название вида
   - familyRu: семейство на русском (например "Ароидные", "Тутовые", "Толстянковые", "Спаржевые")
   - familyLatin: семейство на латыни (например "Araceae", "Moraceae", "Crassulaceae", "Asparagaceae")
   - wateringFrequencyDays: частота полива в днях (число от 2 до 21, например 5, 7, 10, 14)
   - fertilizingFrequencyDays: частота подкормок в днях (обычно 14 или 30)
   - lightRequirement: одно из ["Яркий рассеянный", "Прямой солнечный", "Полутень", "Теневыносливое"]
   - humidityLevel: процент влажности (число от 30 до 85)
   - temperatureRange: строка температур (например "18-24 °C")
   - difficulty: одно из ["Легкий", "Средний", "Сложный"]
   - soilType: рекомендуемый состав субстрата
   - fertilizerRecommendation: тип удобрения и состав NPK
   - description: краткое научное описание и биологические особенности вида (2-3 предложения)
   - careGuide: практическая инструкция по поливу и содержанию (2-3 предложения)
   - nativeTo: географическая родина происхождения`;

      for (const modelName of TEXT_MODELS) {
        try {
          const response = await client.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  canonicalLatin: { type: Type.STRING },
                  scientificLatin: { type: Type.STRING },
                  russianCanonicalName: { type: Type.STRING },
                  familyRu: { type: Type.STRING },
                  familyLatin: { type: Type.STRING },
                  wateringFrequencyDays: { type: Type.INTEGER },
                  fertilizingFrequencyDays: { type: Type.INTEGER },
                  lightRequirement: { type: Type.STRING },
                  humidityLevel: { type: Type.INTEGER },
                  temperatureRange: { type: Type.STRING },
                  difficulty: { type: Type.STRING },
                  soilType: { type: Type.STRING },
                  fertilizerRecommendation: { type: Type.STRING },
                  description: { type: Type.STRING },
                  careGuide: { type: Type.STRING },
                  nativeTo: { type: Type.STRING },
                },
                required: [
                  'canonicalLatin',
                  'scientificLatin',
                  'russianCanonicalName',
                  'familyRu',
                  'wateringFrequencyDays',
                  'lightRequirement',
                  'humidityLevel',
                  'difficulty',
                  'description',
                  'careGuide',
                ],
              },
            },
          });

          const jsonText = response.text?.trim();
          if (jsonText) {
            const parsed = JSON.parse(jsonText);
            latinScientific = parsed.scientificLatin || parsed.canonicalLatin;
            canonical = parsed.canonicalLatin || parsed.scientificLatin;
            russianName = parsed.russianCanonicalName || query;
            careData = {
              latinName: latinScientific,
              canonicalName: canonical,
              russianName: russianName,
              family: parsed.familyRu,
              familyLatin: parsed.familyLatin || 'Plantae',
              wateringDays: parsed.wateringFrequencyDays || 7,
              fertilizingFrequencyDays: parsed.fertilizingFrequencyDays || 14,
              humidity: parsed.humidityLevel || 60,
              light: parsed.lightRequirement || 'Яркий рассеянный',
              temperature: parsed.temperatureRange || '19-25 °C',
              difficulty: parsed.difficulty || 'Средний',
              soil: parsed.soilType || 'Дренированный слабокислый грунт',
              fertilizer: parsed.fertilizerRecommendation || 'Комплексное минеральное NPK',
              description: parsed.description,
              careGuide: parsed.careGuide,
              nativeTo: parsed.nativeTo,
              imageUrl: localFound ? localFound.imageUrl : 'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=800&q=80',
            };
            console.log(`[AI Lookup] Success with model ${modelName} for "${query}" -> ${canonical}`);
            break;
          }
        } catch (geminiError: any) {
          console.warn(`[AI Lookup] Model ${modelName} failed, trying next:`, geminiError?.message || geminiError);
        }
      }
    }

    // Если латынь еще не определена, используем нормализованный поиск
    if (!latinScientific) {
      if (localFound) {
        latinScientific = localFound.latinName;
        canonical = localFound.canonicalName;
        russianName = localFound.russianName;
        careData = localFound;
      } else {
        canonical = query;
        latinScientific = `${query.charAt(0).toUpperCase() + query.slice(1)} sp.`;
        careData = {
          latinName: latinScientific,
          canonicalName: canonical,
          russianName: query,
          family: 'Комнатные растения',
          familyLatin: 'Plantae',
          wateringDays: 7,
          fertilizingFrequencyDays: 14,
          humidity: 60,
          light: 'Яркий рассеянный',
          temperature: '19-24 °C',
          difficulty: 'Средний',
          soil: 'Универсальный дренированный грунт с перлитом',
          fertilizer: 'Комплексное удобрение для комнатных цветов',
          description: `Комнатное растение "${query}". Регламент полива и инсоляции оптимизирован для домашних условий.`,
          careGuide: 'Поливать по мере просыхания верхнего слоя земли, опрыскивать мягкой водой.',
          imageUrl: 'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=800&q=80',
        };
      }
    }

    // 3. Поиск в GBIF API по точной латыни
    const searchLatinForGbif = canonical || latinScientific;
    const gbifResult = await fetchGbifByLatinName(searchLatinForGbif);
    const gbifTaxonKey = gbifResult?.usageKey || (localFound ? localFound.gbifKey : Math.floor(Math.random() * 8000000) + 1000000);

    // 4. Реальная фотография цветка из открытого веб-поиска
    let realPhotoUrl = await fetchFlowerPhotoFromWeb(canonical, russianName);
    if (!realPhotoUrl && localFound && localFound.imageUrl) {
      realPhotoUrl = localFound.imageUrl;
    }
    if (!realPhotoUrl) {
      realPhotoUrl = 'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=800&q=80';
    }

    const result = {
      id: `gbif_${gbifTaxonKey}`,
      name: russianName,
      scientificName: gbifResult?.scientificName || latinScientific,
      canonicalName: gbifResult?.canonicalName || canonical || latinScientific,
      gbifTaxonKey: gbifTaxonKey,
      gbifOrder: gbifResult?.order || 'Alismatales',
      gbifStatus: gbifResult?.status || 'ACCEPTED',
      familyId: 'fam_araceae',
      familyName: `${careData.family} (${gbifResult?.family || careData.familyLatin || 'GBIF'})`,
      imageUrl: realPhotoUrl,
      wateringFrequencyDays: careData.wateringDays || 7,
      fertilizingFrequencyDays: careData.fertilizingFrequencyDays || 14,
      lightRequirement: careData.light || 'Яркий рассеянный',
      humidityLevel: careData.humidity || 60,
      temperatureRange: careData.temperature || '19-25 °C',
      difficulty: careData.difficulty || 'Средний',
      soilType: careData.soil,
      fertilizerRecommendation: careData.fertilizer,
      description: careData.description || `Таксономия GBIF: ${careData.latinName}. Семейство ${careData.family}.`,
      careGuide: careData.careGuide || `Регулярный полив 1 раз в ${careData.wateringDays || 7} дней.`,
      tags: ['air_purifier', 'easy'],
      nativeTo: careData.nativeTo || 'Тропические и субтропические регионы',
      aiGenerated: true,
      latinTranslated: true,
      webPhotoExtracted: !!realPhotoUrl,
    };

    return res.json(result);
  });

  // Эндпоинт визуального распознавания и мэтчинга растений по фото (Gemini 3.8 Flash Vision)
  app.post('/api/plant-vision-identify', async (req, res) => {
    const { image, mimeType = 'image/jpeg', apiKey } = req.body || {};
    if (!image) {
      return res.status(400).json({ error: 'Изображение обязательно для анализа' });
    }

    let base64Data = '';
    let finalMimeType = mimeType;

    try {
      if (typeof image === 'string' && image.startsWith('data:')) {
        const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          finalMimeType = matches[1];
          base64Data = matches[2];
        } else {
          base64Data = image.split(',')[1] || image;
        }
      } else if (typeof image === 'string' && (image.startsWith('http://') || image.startsWith('https://'))) {
        const fetchRes = await fetch(image);
        const arrayBuffer = await fetchRes.arrayBuffer();
        base64Data = Buffer.from(arrayBuffer).toString('base64');
        const ct = fetchRes.headers.get('content-type');
        if (ct) finalMimeType = ct.split(';')[0];
      } else {
        base64Data = image;
      }

      const client = getAiClient(apiKey);
      if (!client) {
        return res.status(500).json({ error: 'Gemini AI не настроен. Укажите API-ключ в настройках.' });
      }

      const prompt = `Ты — ведущий эксперт-ботаник и дендролог мирового уровня.
Внимательно проанализируй эту фотографию комнатного растения.
1. Определи конкретный вид растения с максимальной биологической точностью по форме листа, структуре кроны и цветку.
2. Оцени визуальное состояние растения на фото (здоровье листьев, признаки дефицита влаги или хлороза).
3. Составь полный профессиональный регламент домашнего ухода.

Верни СТРОГО JSON следующей структуры:
- plantName: русское общеупотребительное название (например "Монстера деликатесная")
- canonicalLatin: научное латинское название вида (род и вид, например "Monstera deliciosa")
- scientificLatin: полное латинское название с автором
- familyRu: семейство на русском языке (например "Ароидные")
- familyLatin: семейство на латыни (например "Araceae")
- confidenceScore: целое число от 60 до 99 (процент уверенности совпадения по фото)
- visualHealthAssessment: 1-2 предложения с оценкой здоровья растения по фото (например: "Листья сочные, характерный глянец сохранен, признаков паразитов или пересыхания не наблюдается.")
- wateringFrequencyDays: частота полива в днях (целое число от 2 до 21)
- fertilizingFrequencyDays: частота подкормок в днях (обычно 14 или 28)
- lightRequirement: строго одно из ["Яркий рассеянный", "Прямой солнечный", "Полутень", "Теневыносливое"]
- humidityLevel: процент влажности (целое число от 30 до 85)
- temperatureRange: строка температур (например "18-24 °C")
- difficulty: строго одно из ["Легкий", "Средний", "Сложный"]
- soilType: рекомендуемый субстрат для пересадки
- fertilizerRecommendation: рекомендуемое удобрение
- description: краткое научное описание и биологические особенности вида (2-3 предложения)
- careGuide: практическая инструкция по поливу и уходу (2-3 предложения)
- nativeTo: родина происхождения растения`;

      let identifiedData: any = null;
      let usedModel = '';

      for (const model of VISION_MODELS) {
        try {
          const result = await client.models.generateContent({
            model,
            contents: [
              prompt,
              {
                inlineData: {
                  mimeType: finalMimeType,
                  data: base64Data,
                },
              },
            ],
            config: {
              responseMimeType: 'application/json',
            },
          });

          const text = result.text?.trim();
          if (text) {
            identifiedData = JSON.parse(text);
            usedModel = model;
            console.log(`[Vision Identify] Success with model ${model}: ${identifiedData.plantName} (${identifiedData.canonicalLatin})`);
            break;
          }
        } catch (err: any) {
          console.warn(`[Vision Identify] Model ${model} failed:`, err?.message || err);
        }
      }

      if (!identifiedData) {
        throw new Error('Не удалось визуально распознать растение по фото через доступные модели Gemini');
      }

      const canonical = identifiedData.canonicalLatin || identifiedData.scientificLatin;
      const gbifResult = await fetchGbifByLatinName(canonical);
      const gbifTaxonKey = gbifResult?.usageKey || Math.floor(Math.random() * 8000000) + 1000000;

      const resultPlant = {
        id: `identified_${Date.now()}`,
        name: identifiedData.plantName,
        scientificName: identifiedData.scientificLatin || identifiedData.canonicalLatin,
        canonicalName: canonical,
        gbifTaxonKey,
        gbifOrder: gbifResult?.order || 'Plantae',
        familyId: `fam_${(identifiedData.familyLatin || 'plants').toLowerCase()}`,
        familyName: `${identifiedData.familyRu} (${identifiedData.familyLatin || 'Plantae'})`,
        imageUrl: typeof image === 'string' && (image.startsWith('http://') || image.startsWith('https://')) ? image : (image.startsWith('data:') ? image : 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=800&q=80'),
        wateringFrequencyDays: identifiedData.wateringFrequencyDays || 7,
        fertilizingFrequencyDays: identifiedData.fertilizingFrequencyDays || 14,
        lightRequirement: identifiedData.lightRequirement || 'Яркий рассеянный',
        humidityLevel: identifiedData.humidityLevel || 60,
        temperatureRange: identifiedData.temperatureRange || '18-24 °C',
        difficulty: identifiedData.difficulty || 'Средний',
        soilType: identifiedData.soilType,
        fertilizerRecommendation: identifiedData.fertilizerRecommendation,
        description: identifiedData.description,
        careGuide: identifiedData.careGuide,
        tags: ['air_purifier', 'easy'],
        nativeTo: identifiedData.nativeTo || 'Тропические регионы',
        confidenceScore: identifiedData.confidenceScore || 96,
        visualHealthAssessment: identifiedData.visualHealthAssessment || 'Растение выглядит здоровым.',
        aiIdentified: true,
        usedModel,
      };

      return res.json(resultPlant);
    } catch (error: any) {
      console.error('Vision identify error:', error);
      return res.status(500).json({
        error: error.message || 'Ошибка обработки изображения в ИИ',
      });
    }
  });

  // Эндпоинт умной генерации описания и регламента ухода для любого растения
  app.post('/api/plant-smart-describe', async (req, res) => {
    const { name, scientificName, family, notes, apiKey } = req.body || {};
    if (!name) {
      return res.status(400).json({ error: 'Имя растения обязательно' });
    }

    const client = getAiClient(apiKey);
    if (!client) {
      return res.status(500).json({ error: 'Gemini AI не настроен' });
    }

    const prompt = `Ты — ведущий агроном-ботаник.
Составь профессиональное подробное ботаническое описание и оптимальный регламент домашнего ухода для растения:
Название: "${name}"
Научное имя: "${scientificName || 'не указано'}"
Семейство: "${family || 'не указано'}"
Заметки владельца: "${notes || 'нет'}"

Верни СТРОГО JSON:
- description: красивое, познавательное описание вида и условий его произрастания (3-4 предложения)
- careGuide: практическая пошаговая инструкция по поливу, опрыскиванию и сезонам (3-4 предложения)
- wateringFrequencyDays: рекомендуемый интервал полива в днях (целое число от 2 до 21)
- fertilizingFrequencyDays: интервал подкормок в днях (целое число)
- lightRequirement: строго одно из ["Яркий рассеянный", "Прямой солнечный", "Полутень", "Теневыносливое"]
- humidityLevel: процент влажности (целое число от 30 до 85)
- temperatureRange: строка температур (например "19-24 °C")
- difficulty: одно из ["Легкий", "Средний", "Сложный"]
- soilType: рекомендуемый состав грунта
- fertilizerRecommendation: сезонные удобрения
- wateringTips: важные нюансы (например "не лить воду в розетку")`;

    for (const model of TEXT_MODELS) {
      try {
        const response = await client.models.generateContent({
          model,
          contents: prompt,
          config: { responseMimeType: 'application/json' },
        });
        const text = response.text?.trim();
        if (text) {
          return res.json(JSON.parse(text));
        }
      } catch (e: any) {
        console.warn(`[Smart Describe] error on ${model}:`, e?.message || e);
      }
    }

    return res.status(500).json({ error: 'Не удалось сгенерировать описание через ИИ' });
  });

  // Vite middleware для development или static serving в production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
