// Все фразы, которые книга произносит голосом. Общий список для tools/voice.mjs (генерация mp3)
// и для рантайма (тот же текст → тот же файл). Английский — британский женский голос, русский — голос AiCo из рилсов.
import { LESSONS, COACH, COACH_RU } from './content.js';

export const VOICE = {
  model: 'eleven_multilingual_v2',
  en: 'Xb7hH8MSUJpSbSDYk0k2', // Alice — Clear, Engaging Educator (British)
  ru: 'm0OQuJtWCw1V23P0pQmG', // Eugene — утверждённый голос AiCo для @aico.codify
  settings: {
    word: { stability: 0.6, similarity_boost: 0.8, style: 0, speed: 0.85 },
    line: { stability: 0.6, similarity_boost: 0.8, style: 0, speed: 0.9 },
    praise: { stability: 0.6, similarity_boost: 0.8, style: 0.2, speed: 0.9 },
    ru: { stability: 0.35, similarity_boost: 0.75, style: 0.45, speed: 1.1 },
  },
};

// Отдельное слово читаем как короткое предложение — так голос не обрезает его.
export const wordLine = (w) => w.charAt(0).toUpperCase() + w.slice(1) + '.';
export const DAYS = ['Day one.', 'Day two.', 'Day three.', 'Day four.', 'Day five.'];
export const EXTRA = ['Light!', 'White light goes into the prism.', 'Near.', 'Middle.', 'Far.', 'Low.', 'High.', 'Ding!'];

export function allLines() {
  const out = new Map();
  const add = (text, kind = 'line', lang = 'en') => {
    if (!text || out.has(text)) return;
    out.set(text, { text, lang, voice: lang === 'ru' ? VOICE.ru : VOICE.en, settings: VOICE.settings[lang === 'ru' ? 'ru' : kind] });
  };
  for (const L of LESSONS) {
    L.words.forEach(([w]) => add(wordLine(w), 'word'));
    L.items.forEach((it) => add(L.sentence(it)));
    add(L.predict.q);
    L.predict.options.forEach((o) => add(o + '.', 'word'));
    add(L.why.join(' '));
    if (L.id === 'rainbow') L.items.forEach((it) => add(wordLine(it.name), 'word'));
  }
  for (const k of Object.keys(COACH)) add(COACH[k].en, ['right', 'wrong', 'stamp', 'saidIt', 'hello'].includes(k) ? 'praise' : 'line');
  DAYS.forEach((d) => add(d));
  EXTRA.forEach((d) => add(d, 'word'));
  for (const k of Object.keys(COACH_RU)) add(COACH_RU[k], 'line', 'ru');
  return [...out.values()];
}
