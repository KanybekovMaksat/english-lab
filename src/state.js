// Прогресс ребёнка и шаг урока. Хранится в localStorage; без хранилища книга работает без сохранения.
// Шаги урока строго по порядку: words → predict → test → say → why → done (штамп падает при открытии клапана).
import { LESSONS, SPREADS, BOOK } from './content.js';

export const KEY = 'aico-word-lab:v2';
export const STEPS = ['words', 'predict', 'test', 'say', 'why', 'done'];
export const WORDS_NEEDED = 3;

const lessonBlank = () => ({ heard: [], pick: null, tested: [], said: false, flap: false, stamp: 0 });
const blank = () => ({ lessons: LESSONS.map(lessonBlank), spread: 0, lead: null, parentCards: [], coachHeard: {}, hello: false });

export function createProgress(storage = globalThis.localStorage) {
  let data = blank();
  try {
    const raw = storage && storage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      data = { ...blank(), ...saved, lessons: LESSONS.map((_, i) => ({ ...lessonBlank(), ...(saved.lessons || [])[i] })) };
    }
  } catch { /* битые данные — начинаем заново */ }
  const save = () => { try { storage && storage.setItem(KEY, JSON.stringify(data)); } catch { /* приватный режим */ } };

  const L = (i) => data.lessons[i];
  const api = {
    get data() { return data; },
    lesson: L,
    hear(i, word) {
      if (L(i).heard.includes(word)) return false;
      L(i).heard.push(word); save(); return true;
    },
    predict(i, option) {
      if (L(i).pick !== null) return false; // прогноз делают один раз, до опыта
      L(i).pick = option; save(); return true;
    },
    test(i, itemId) {
      const s = L(i);
      if (s.tested.includes(itemId)) return false;
      s.tested.push(itemId); save(); return true;
    },
    challengeDone(i) {
      const l = LESSONS[i], s = L(i);
      if (l.kind === 'steps') return s.tested.includes('step' + l.steps);
      return l.items.every((it) => s.tested.includes(it.id));
    },
    stepsDone(i) { return L(i).tested.filter((t) => /^step\d+$/.test(t)).length; },
    sayIt(i) {
      if (!api.challengeDone(i) || L(i).said) return false;
      L(i).said = true; save(); return true;
    },
    openFlap(i) {
      if (api.step(i) !== 'why' && !L(i).flap) return false; // ответ — в свой шаг
      if (!L(i).flap) { L(i).flap = true; save(); }
      return true;
    },
    // Штамп — финал урока: всё пройдено и клапан открыт. true только в момент получения.
    tryStamp(i) {
      const s = L(i);
      if (s.stamp || s.pick === null || !api.challengeDone(i) || !s.said || !s.flap) return false;
      s.stamp = Date.now(); save(); return true;
    },
    step(i) {
      const s = L(i);
      if (s.heard.length < WORDS_NEEDED) return 'words';
      if (s.pick === null) return 'predict';
      if (!api.challengeDone(i)) return 'test';
      if (!s.said) return 'say';
      if (!s.flap) return 'why';
      return 'done';
    },
    stamps() { return data.lessons.filter((s) => s.stamp).length; },
    right(i) { return L(i).pick === LESSONS[i].predict.answer; },
    rightCount() { return data.lessons.filter((s, i) => s.stamp && s.pick === LESSONS[i].predict.answer).length; },
    wordsLearned() { return data.lessons.reduce((n, s, i) => n + (s.stamp ? LESSONS[i].words.length : 0), 0); },
    get unlocked() { return !!data.lead; },
    locked(i) { return i >= BOOK.freeLessons && !data.lead; },
    setLead(lead) { data.lead = { ...lead, at: Date.now() }; save(); },
    // карточку «Покажи родителям» показываем после 2-го и 4-го штампа, каждую — один раз
    parentCardDue(n) { return (n === 2 || n === 4) && !data.lead && !(data.parentCards || []).includes(n); },
    markParentCard(n) { data.parentCards = [...(data.parentCards || []), n]; save(); },
    // Русская подсказка голосом звучит один раз на каждый тип шага.
    firstCoach(step) { if (data.coachHeard[step]) return false; data.coachHeard[step] = true; save(); return true; },
    sayHello() { if (data.hello) return false; data.hello = true; save(); return true; },
    bookmark(n) { data.spread = Math.max(0, Math.min(SPREADS.length - 1, n)); save(); },
    reset() { const lead = data.lead; data = blank(); data.lead = lead; save(); },
  };
  return api;
}
