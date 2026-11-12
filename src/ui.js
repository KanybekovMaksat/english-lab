// HTML-слой урока. На телефоне — нижняя панель (sheet) с текущим шагом крупно; на компьютере — полоска AiCo
// с подсказкой и главной кнопкой шага, а сам урок — на страницах книги. Плюс кольцо и рука-указатель на то,
// что нажать сейчас, и верхняя полоса со штампами на телефоне.
import { LESSONS, SPREADS, COACH, BOOK, TRIAL } from './content.js';
import { aicoSVG } from './aico.js';
import { STEPS } from './state.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const face = (mood, e = 0.5) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(aicoSVG(mood, e))}`;
const RAIL = [['words', 'Words'], ['predict', 'Predict'], ['test', 'Test'], ['say', 'Say'], ['why', 'Why?']];
const ICO = {
  speaker: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  hand: '<svg viewBox="0 0 64 64"><path d="M26 8c3 0 5 2 5 5v17l2-1c3-1 6 0 7 2l1 1c3-1 6 0 7 3 3-1 6 1 6 4v9c0 9-7 16-16 16h-4c-6 0-11-3-14-8l-8-13c-2-3-1-6 2-7 2-1 5 0 6 2l3 4V13c0-3 2-5 5-5z" fill="#fff" stroke="#0a1058" stroke-width="3" stroke-linejoin="round"/></svg>',
};

export function createUI({ progress, act, lessonOf, controlsOf, labState }) {
  // ——— кольцо и рука ———
  const ring = document.createElement('div'); ring.className = 'ring';
  const hand = document.createElement('div'); hand.className = 'hand'; hand.innerHTML = ICO.hand;
  document.body.append(ring, hand);

  // ——— телефон: верх и нижняя панель ———
  const top = document.createElement('div'); top.className = 'topbar';
  const sheet = document.createElement('section'); sheet.className = 'sheet'; sheet.setAttribute('aria-label', 'Lesson');
  // ——— компьютер: полоска AiCo над панелью ———
  const bar = document.createElement('div'); bar.className = 'coachbar'; bar.setAttribute('aria-live', 'polite');
  // карточка для ребёнка после 2-го и 4-го штампа: не модальная, крупная кнопка «Потом»
  const card = document.createElement('div'); card.className = 'pcard'; card.setAttribute('role', 'status');
  card.innerHTML = `<img alt="" src="${face('love', 1)}"><div><b>Show this to mum or dad!</b><span>Покажи маме или папе — им тоже интересно</span></div><div class="pc-btns"><button class="big primary" data-pc="show">Показать</button><button class="big" data-pc="later">Потом</button></div>`;
  document.body.append(top, sheet, bar, card);
  card.addEventListener('click', (e) => { const b = e.target.closest('[data-pc]'); if (b) api.onParentCard?.(b.dataset.pc === 'show'); });

  const click = (e) => {
    const b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    e.preventDefault();
    act({ kind: 'page', id: b.dataset.act, from: 'ui' });
  };
  sheet.addEventListener('click', click); bar.addEventListener('click', click); top.addEventListener('click', click);

  function coachFor(spread) {
    const sp = SPREADS[spread];
    if (sp.kind === 'title') return { ...COACH.hello, mood: 'happy' };
    if (sp.kind === 'final') return { en: 'Look at your stamps!', ru: progress.stamps() ? 'Покажи штампы родителям' : 'Начни с первого опыта', mood: 'love' };
    const i = sp.lesson, step = progress.step(i), L = LESSONS[i];
    if (step === 'test') {
      if (L.id === 'rainbow' && !labState(i)?.torchOn) return { ...COACH.torch, mood: 'calm' };
      return { en: COACH.test.en, ru: L.taskRu, mood: 'wow' };
    }
    if (step === 'done') return { ...(progress.right(i) ? COACH.right : COACH.wrong), mood: 'happy' };
    return { ...COACH[step], mood: step === 'predict' ? 'think' : 'calm' };
  }

  function rail(i) {
    const at = STEPS.indexOf(progress.step(i));
    return `<ol class="rail">${RAIL.map(([k, t], n) => `<li class="${n < at ? 'ok' : n === at ? 'now' : ''}"><i>${n < at ? ICO.check : n + 1}</i><span>${t}</span></li>`).join('')}<li class="${progress.lesson(i).stamp ? 'ok' : ''} st"><i>★</i><span>Stamp</span></li></ol>`;
  }

  function controlsHTML(i) {
    return controlsOf(i).map((c) => `<button class="chip${c.done ? ' done' : ''}${c.on ? ' on' : ''}${c.primary ? ' primary' : ''}" data-act="ctl:${c.id}" data-target="ctl:${c.id}">${c.emoji ? `<i>${c.emoji}</i>` : ''}<span>${esc(c.label)}</span>${c.done ? `<b>${ICO.check}</b>` : ''}</button>`).join('');
  }

  function sayList(i) {
    const L = LESSONS[i], s = progress.lesson(i);
    const items = L.kind === 'steps' ? L.items : L.items.filter((it) => s.tested.includes(it.id));
    const list = items.slice(-2); // на телефоне — две последние фразы, все остальные есть на странице
    return list.map((it) => `<button class="say" data-act="say:${esc(L.sentence(it))}" data-target="say:${esc(L.sentence(it))}"><i>${ICO.speaker}</i>${esc(L.sentence(it))}</button>`).join('');
  }

  function body(spread) {
    const sp = SPREADS[spread];
    if (sp.kind === 'title') {
      const n = progress.stamps();
      return `<div class="s-title"><button class="s-aico" data-act="hello" aria-label="AiCo says hello"><img alt="" src="${face('happy', 0.6)}"></button>
        <h1>AiCo <em>Word Lab</em></h1><p>${LESSONS.length} опытов · ${LESSONS.reduce((a, l) => a + l.words.length, 0)} английских слов · ${BOOK.ages}</p>
        <button class="big primary" data-act="next" data-target="next">${n ? 'Continue →' : 'Start →'}</button>
        <button class="link" data-act="funnel">Для родителей: бесплатный урок</button></div>`;
    }
    if (sp.kind === 'final') {
      const n = progress.stamps();
      return `<div class="s-final"><div class="s-stamps">${LESSONS.map((l, k) => `<button data-act="goto:${k + 1}" class="${progress.lesson(k).stamp ? 'got' : ''}" aria-label="${esc(l.title)}">${progress.lesson(k).stamp ? '★' : progress.locked(k) ? '🔒' : k + 1}</button>`).join('')}</div>
        <p><b>${n} из ${LESSONS.length}</b> штампов · <b>${progress.wordsLearned()}</b> слов</p>
        <button class="big primary" data-act="funnel" data-target="funnel">Для родителей: записаться на бесплатный урок</button>
        <button class="link" data-act="reset">Начать книгу заново</button></div>`;
    }
    const i = sp.lesson, L = LESSONS[i], s = progress.lesson(i), step = progress.step(i);
    if (step === 'words') {
      return `<p class="s-hint">Tap 3 words · <b>${Math.min(3, s.heard.length)}/3</b></p><div class="words">${L.words.map(([en, ru]) => `<button class="word${s.heard.includes(en) ? ' got' : ''}" data-act="word:${en}" data-target="word:${en}"><b>${en}</b><span>${ru}</span><i>${s.heard.includes(en) ? ICO.check : ICO.speaker}</i></button>`).join('')}</div>`;
    }
    if (step === 'predict') {
      return `<p class="q">${esc(L.predict.q)}</p><p class="q-ru">${esc(L.predict.ru)}</p><div class="opts">${L.predict.options.map((o, k) => `<button class="big" data-act="pick:${k}" data-target="pick:${k}">${esc(o)}</button>`).join('')}</div>`;
    }
    if (step === 'test') {
      const total = L.kind === 'steps' ? L.steps : L.items.length;
      const got = L.kind === 'steps' ? progress.stepsDone(i) : s.tested.filter((t) => L.items.some((it) => it.id === t)).length;
      return `<p class="s-hint">${esc(L.task)} · <b>${Math.min(got, total)}/${total}</b></p><div class="tray">${controlsHTML(i)}</div>`;
    }
    if (step === 'say') {
      return `<div class="says">${sayList(i)}</div><button class="big lime" data-act="saidit" data-target="saidit">${ICO.check} I said it!</button><p class="s-hint small">Нажми, когда повторишь фразу вслух</p>`;
    }
    if (step === 'why') {
      return `<p class="q">Why? Lift the flap on the page.</p><p class="q-ru">Подними клапан — там ответ</p><button class="big primary" data-act="flap" data-target="flap">Lift the flap ↑</button>`;
    }
    const next = SPREADS[spread + 1], nextLocked = next?.kind === 'lesson' && progress.locked(next.lesson);
    return `<button class="big primary" data-act="next" data-target="next">${next?.kind === 'lesson' ? (nextLocked ? '🔒 Next lab — для родителей' : 'Next lab →') : 'My stamps →'}</button>
      <div class="why"><b>WHY?</b><p>${esc(L.why.join(' '))}</p><span>${esc(L.whyRu)}</span></div>`;
  }

  // главная кнопка шага на компьютере (то, чего нет на странице)
  function barAction(spread) {
    const sp = SPREADS[spread];
    if (sp.kind !== 'lesson') return '';
    const i = sp.lesson, step = progress.step(i), next = SPREADS[spread + 1];
    if (step === 'say') return `<button class="big lime" data-act="saidit" data-target="saidit">${ICO.check} I said it!</button>`;
    if (step === 'done') {
      const locked = next?.kind === 'lesson' && progress.locked(next.lesson);
      return `<button class="big primary" data-act="next" data-target="next">${next?.kind === 'lesson' ? (locked ? '🔒 Next lab' : 'Next lab →') : 'My stamps →'}</button>`;
    }
    return '';
  }

  function render(spread, phone) {
    document.body.classList.toggle('phone', phone);
    const c = coachFor(spread);
    const coach = `<button class="c-face" data-act="replay" aria-label="Повторить подсказку"><img alt="" src="${face(c.mood, 0.5)}"></button><div class="c-text"><b>${esc(c.en)}</b><span>${esc(c.ru)}</span></div>`;
    const sp = SPREADS[spread];
    if (phone) {
      const head = sp.kind === 'lesson'
        ? `<div class="s-head"><div><small>LESSON ${sp.lesson + 1}/${LESSONS.length}</small><b>${esc(LESSONS[sp.lesson].title)}</b></div>${rail(sp.lesson)}</div>` : '';
      sheet.innerHTML = `${head}${sp.kind === 'title' ? '' : `<div class="s-coach">${coach}</div>`}<div class="s-body">${body(spread)}</div>`;
      top.innerHTML = `<button class="t-dots" data-act="menu" aria-label="Contents">${LESSONS.map((l, k) => `<i class="${progress.lesson(k).stamp ? 'got' : ''}${sp.kind === 'lesson' && sp.lesson === k ? ' now' : ''}${progress.locked(k) ? ' lock' : ''}"></i>`).join('')}</button>
        <button class="t-btn" data-act="sound" aria-label="Sound">${ICO.speaker}</button><button class="t-btn t-par" data-act="parents" aria-label="Для родителей">Родителям</button>`;
      bar.innerHTML = '';
    } else {
      bar.innerHTML = `${coach}${barAction(spread)}`;
      sheet.innerHTML = ''; top.innerHTML = '';
    }
  }

  // Кольцо и рука над целью {x, y, r} в пикселях экрана (или null).
  let pulseStart = performance.now(), lastKey = '';
  function point(t, { handOn = true } = {}) {
    if (!t) { ring.classList.remove('on'); hand.classList.remove('on'); lastKey = ''; return; }
    if (t.key !== lastKey) { lastKey = t.key; pulseStart = performance.now(); }
    const w = Math.max(48, t.w + 14), h = Math.max(48, t.h + 14);
    ring.style.transform = `translate(${t.x - w / 2}px, ${t.y - h / 2}px)`;
    ring.style.width = w + 'px'; ring.style.height = h + 'px';
    ring.style.borderRadius = Math.min(w, h) / 2 > 40 && Math.abs(w - h) < 8 ? '50%' : '18px';
    ring.classList.add('on');
    hand.style.transform = `translate(${t.x + Math.min(w / 2, 60) * 0.35}px, ${t.y + Math.min(h / 2, 60) * 0.35}px)`;
    hand.classList.toggle('on', handOn);
  }
  const findDom = (key) => [...document.querySelectorAll('[data-target]')].find((el) => el.dataset.target === key && el.offsetParent !== null);

  const api = { render, point, findDom, sheet, bar, top, get sinceTarget() { return performance.now() - pulseStart; }, face, TRIAL, onParentCard: null,
    parentCard(on) { card.classList.toggle('on', on); } };
  return api;
}
