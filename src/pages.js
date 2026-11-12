// Содержимое разворотов. Каждая функция рисует страницу и регистрирует зоны нажатия (в мм).
import { BOOK, LESSONS, SPREADS, WORD_COUNT, TRIAL } from './content.js';
import { C, PAGE_W, PAGE_H, paper, brandMark, folio, stamp } from './paint.js';
import { aicoImage } from './aico.js';

// Где на правой странице урока лежат клапан WHY? и место для штампа (мм).
export const FLAP = { x: 12, y: 139, w: 90, h: 44 };
export const STAMP = { x: 125, y: 158, r: 16 };
export const LAB = { x: 10, y: 20, w: 130, h: 112 };

const M = 14, CW = PAGE_W - M * 2;

function badge(P, n, label, x, y, on) {
  P.circle(x + 3, y - 1.4, 3, { fill: on ? C.action : C.inset, stroke: on ? null : C.line });
  P.text(String(n), x + 3, y - 1.3, { size: 3.2, weight: 700, mono: true, color: on ? '#fff' : C.soft, align: 'center', base: 'middle' });
  P.text(label, x + 8, y, { size: 3.4, weight: 700, mono: true, color: on ? C.action : C.soft, track: 0.08 });
}

function pill(P, id, label, x, y, w, h, { on = false, dim = false, size = 4.4 } = {}) {
  P.rrect(x, y, w, h, 3, on ? { fill: C.action } : { fill: '#fff', stroke: dim ? C.line : C.action, lw: 0.4 });
  P.text(label, x + w / 2, y + h / 2 + 0.2, { size, weight: 650, color: on ? '#fff' : dim ? C.faint : C.action, align: 'center', base: 'middle' });
  P.hit(id, x, y, w, h);
}

// ——— титул ———

function titleLeft(P) {
  const g = P.g, w = P.canvas.width, h = P.canvas.height;
  const gr = g.createLinearGradient(0, h, w, 0);
  gr.addColorStop(0, C.cyan); gr.addColorStop(1, C.blue);
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,0.12)';
  for (let x = 6; x < PAGE_W; x += 6) for (let y = 6; y < PAGE_H; y += 6) P.circle(x, y, 0.28, { fill: 'rgba(255,255,255,0.16)' });
  P.rrect(M, 15.4, 2.8, 2.8, 0.8, { fill: C.lime });
  P.text('Codify · English', M + 4.4, 18, { size: 3.6, weight: 650, color: '#fff' });
  P.img(aicoImage('happy', 0.6), 40, 36, 70, 70);
  P.text('AiCo', PAGE_W / 2, 128, { size: 15, weight: 850, color: '#fff', align: 'center', track: -0.02 });
  P.text('Word Lab', PAGE_W / 2, 144, { size: 12, weight: 800, color: C.lime, align: 'center', track: -0.02 });
  P.text(BOOK.subtitle, PAGE_W / 2, 156, { size: 5, weight: 500, color: '#fff', align: 'center' });
  const tag = BOOK.ages, tw = P.measure(tag, { size: 3.6, weight: 650, mono: true }) + 8;
  P.rrect(PAGE_W / 2 - tw / 2, 166, tw, 7.5, 3.75, { fill: 'rgba(10,16,88,0.28)' });
  P.text(tag, PAGE_W / 2, 170, { size: 3.6, weight: 650, mono: true, color: '#fff', align: 'center', base: 'middle' });
  P.text(`${LESSONS.length} experiments · ${WORD_COUNT} words`, PAGE_W / 2, 188, { size: 3.4, weight: 500, color: 'rgba(255,255,255,0.8)', align: 'center' });
}

const HOW = [
  ['Listen', 'Tap the words. AiCo reads them.', 'Послушай слова'],
  ['Predict', 'Pick what you think will happen.', 'Угадай, что будет'],
  ['Test', 'Tap the lab. It jumps off the page!', 'Проверь опытом'],
  ['Say it', 'Listen and say it out loud.', 'Повтори вслух'],
  ['Why? + Stamp', 'Lift the flap and get a stamp.', 'Узнай почему'],
];

function titleRight(P, ctx) {
  paper(P, 'right');
  P.text('HOW TO USE THIS BOOK', M, 22, { size: 3.4, weight: 700, mono: true, color: C.action, track: 0.08 });
  P.text('Science in English', M, 34, { size: 9, weight: 800, track: -0.02 });
  P.text('Наука на английском', M, 41, { size: 4.2, color: C.soft });
  let y = 56;
  HOW.forEach(([t, d, ru], i) => {
    P.circle(M + 4.5, y - 1.5, 4.5, { fill: i === 4 ? C.lime : C.actionSoft });
    P.text(String(i + 1), M + 4.5, y - 1.3, { size: 4, weight: 700, mono: true, color: i === 4 ? C.limeInk : C.action, align: 'center', base: 'middle' });
    P.text(t, M + 13, y - 1.5, { size: 5, weight: 750 });
    P.text(ru, M + 13 + P.measure(t, { size: 5, weight: 750 }) + 2.5, y - 1.5, { size: 3.4, color: C.faint });
    P.text(d, M + 13, y + 4, { size: 3.9, color: C.soft });
    y += 15.5;
  });
  P.rrect(M, 136, CW, 16, 4, { fill: C.inset });
  P.speaker(M + 7, 144, 4.2);
  P.text('Turn the sound on.', M + 14, 143, { size: 4, weight: 650 });
  P.text('Включите звук — AiCo читает слова вслух.', M + 14, 148.4, { size: 3.4, color: C.soft });
  const s = ctx.progress.stamps();
  pill(P, 'next', s ? 'Continue  →' : 'Start the lab  →', M, 160, CW, 13, { on: true, size: 5 });
  P.text(`${s} of ${LESSONS.length} stamps`, PAGE_W / 2, 182, { size: 3.4, weight: 600, mono: true, color: C.soft, align: 'center' });
  folio(P, 1, 'right');
}

// ——— урок ———

function lessonLeft(P, ctx, i) {
  const L = LESSONS[i], s = ctx.progress.lesson(i), done = ctx.progress.challengeDone(i), step = ctx.progress.step(i);
  const order = ['words', 'predict', 'test', 'say', 'why', 'done'], at = order.indexOf(step);
  // текущий шаг — ярко, пройденные — чуть приглушены, будущие — бледные: видно, что делать сейчас
  const fade = (k) => { P.g.globalAlpha = k === at ? 1 : k < at ? 0.82 : 0.32; };
  paper(P, 'left');
  P.rrect(M, 15.2, 2.6, 2.6, 0.7, { fill: C.lime });
  P.text(`LESSON ${i + 1} OF ${LESSONS.length} · SCIENCE + ENGLISH`, M + 4.2, 17.8, { size: 3.1, weight: 700, mono: true, color: C.action, track: 0.06 });
  P.text(L.title, M, 31, { size: 10.5, weight: 800, track: -0.02 });
  P.text(L.ru, M, 38, { size: 4.2, color: C.soft });
  const mood = s.stamp ? 'happy' : s.pick === null ? 'think' : done ? (ctx.progress.right(i) ? 'wow' : 'love') : 'calm';
  P.img(aicoImage(mood, s.stamp ? 1 : s.pick === null ? 0 : 0.5), PAGE_W - M - 19, 12, 19, 19);

  // слова: нажми — услышишь
  fade(0);
  P.text('WORDS', M, 49, { size: 3.1, weight: 700, mono: true, color: at === 0 ? C.action : C.soft, track: 0.1 });
  const heard = Math.min(s.heard.length, 3);
  P.text(at === 0 ? `Tap 3 words · ${heard}/3` : 'Tap a word to hear it', PAGE_W - M, 49, { size: 3.2, weight: 650, color: at === 0 ? C.action : C.faint, align: 'right' });
  const cw = (CW - 6) / 3;
  L.words.forEach(([en, ru], k) => {
    const x = M + (k % 3) * (cw + 3), y = 52 + Math.floor(k / 3) * 15, got = s.heard.includes(en);
    P.rrect(x, y, cw, 12.5, 3, got ? { fill: C.actionSoft, stroke: C.action, lw: 0.35 } : { fill: '#fff', stroke: C.line, lw: 0.35 });
    P.text(en, x + 3, y + 5.6, { size: 4.6, weight: 750 });
    P.text(ru, x + 3, y + 10, { size: 3, color: C.soft });
    if (got) P.check(x + cw - 4, y + 4.4, 2.6, C.action); else P.speaker(x + cw - 4, y + 4.4, 2.6);
    P.hit('word:' + en, x, y, cw, 12.5);
  });

  // 1 прогноз
  fade(1);
  let y = 92;
  badge(P, 1, 'PREDICT', M, y, at === 1);
  y = P.wrap(L.predict.q, M, y + 7.5, CW, 6, { size: 5, weight: 750 });
  const n = L.predict.options.length, ow = (CW - (n - 1) * 3) / n;
  L.predict.options.forEach((o, k) => {
    pill(P, 'pick:' + k, o, M + k * (ow + 3), y - 2.5, ow, 10, { on: s.pick === k, dim: s.pick !== null && s.pick !== k, size: n > 2 ? 3.6 : 4.4 });
  });
  y += 12;
  if (s.pick !== null && done) {
    const right = ctx.progress.right(i);
    if (right) P.check(M + 2, y, 3.4);
    P.text(right ? 'You were right!' : `Good try! The answer: ${L.predict.options[L.predict.answer]}.`, M + (right ? 6 : 0), y + 1.2, { size: 4, weight: 700, color: right ? C.limeInk : C.action });
  } else if (s.pick !== null) {
    P.text('Now test it in the lab →', M, y + 1.2, { size: 4, weight: 600, color: C.action });
  } else {
    P.text(L.predict.ru, M, y + 1.2, { size: 3.6, color: C.soft });
  }

  // 2 опыт
  fade(2);
  y += 11;
  badge(P, 2, 'TEST', M, y, at === 2);
  y = P.wrap(L.task, M, y + 6.5, CW, 5.2, { size: 4.1, color: C.ink });

  // 3 скажи
  fade(3);
  y += 4;
  badge(P, 3, 'SAY IT', M, y, at === 3);
  if (at === 3) P.text('Listen, then say it out loud', PAGE_W - M, y, { size: 3.2, weight: 650, color: C.action, align: 'right' });
  y += 7;
  sayIt(P, ctx, i, y);
  P.g.globalAlpha = 1;
  brandMark(P, M + 9, 192);
  folio(P, i * 2 + 2, 'left');
}

function sayIt(P, ctx, i, y) {
  const L = LESSONS[i], s = ctx.progress.lesson(i);
  const line = (txt, id, yy) => {
    P.rrect(M, yy - 4.4, CW, 7.6, 2.4, { fill: C.inset });
    P.speaker(M + 4, yy - 0.6, 2.6);
    P.text(txt, M + 8.5, yy + 0.6, { size: 4.1, weight: 600 });
    P.hit('say:' + txt, M, yy - 4.4, CW, 7.6);
  };
  if (L.id === 'rainbow') {
    const cw = (CW - 6 * 1.6) / 7;
    L.items.forEach((it, k) => {
      const on = s.tested.includes(it.id), x = M + k * (cw + 1.6);
      P.rrect(x, y - 4, cw, 7, 2.2, on ? { fill: it.hex } : { fill: '#fff', stroke: C.line, dash: [0.8, 0.8] });
      if (on) P.hit('word:' + it.name, x, y - 4, cw, 7);
    });
    const last = s.tested.length ? L.items.find((it) => it.id === s.tested[s.tested.length - 1]) : null;
    if (last) line(L.sentence(last), last.id, y + 10);
    else P.text(L.blank, M, y + 10, { size: 4.1, color: C.faint });
    return;
  }
  const ready = L.kind === 'steps' ? (ctx.progress.challengeDone(i) ? L.items : []) : L.items.filter((it) => s.tested.includes(it.id));
  if (!ready.length) { P.text(L.blank, M, y + 1, { size: 4.1, color: C.faint }); return; }
  ready.slice(0, 4).forEach((it, k) => line(L.sentence(it), it.id, y + k * 8.6));
}

function lessonRight(P, ctx, i) {
  const L = LESSONS[i], s = ctx.progress.lesson(i), lab = ctx.labs?.[i];
  paper(P, 'right');
  // «лабораторный коврик» под 3D-опытом — миллиметровка
  P.rrect(LAB.x, LAB.y, LAB.w, LAB.h, 5, { fill: '#f4f7ff' });
  for (let x = LAB.x + 5; x < LAB.x + LAB.w; x += 5) P.line(x, LAB.y + 1, x, LAB.y + LAB.h - 1, { color: 'rgba(46,68,209,0.07)', lw: 0.2 });
  for (let y = LAB.y + 5; y < LAB.y + LAB.h; y += 5) P.line(LAB.x + 1, y, LAB.x + LAB.w - 1, y, { color: 'rgba(46,68,209,0.07)', lw: 0.2 });
  P.rrect(LAB.x, LAB.y, LAB.w, LAB.h, 5, { stroke: 'rgba(46,68,209,0.25)', lw: 0.35, dash: [1.4, 1.2] });
  lab?.print?.(P);
  for (const b of lab?.buttons?.() || []) pill(P, 'lab:' + b.id, b.label, b.x, b.y, b.w, b.h, { on: b.on, dim: b.dim, size: b.size || 3.8 });

  // под клапаном — ответ
  P.rrect(FLAP.x, FLAP.y, FLAP.w, FLAP.h, 4, { fill: C.actionSoft });
  P.text('WHY?', FLAP.x + 5, FLAP.y + 8, { size: 3.6, weight: 800, mono: true, color: C.action, track: 0.1 });
  L.why.forEach((t, k) => P.text(t, FLAP.x + 5, FLAP.y + 15 + k * 5.6, { size: 3.9, weight: 550 }));
  P.wrap(L.whyRu, FLAP.x + 5, FLAP.y + 35, FLAP.w - 10, 3.6, { size: 2.8, color: C.soft });
  P.hit('why', FLAP.x, FLAP.y, FLAP.w, FLAP.h);

  // место для штампа
  if (s.stamp && !ctx.hideStamp) stamp(P, STAMP.x, STAMP.y, STAMP.r, i + 1, aicoImage('happy', 1), { rot: -0.2 + i * 0.09 });
  else {
    P.circle(STAMP.x, STAMP.y, STAMP.r, { stroke: C.faint, lw: 0.4, dash: [1.2, 1] });
    P.text('STAMP', STAMP.x, STAMP.y + 1, { size: 3.2, weight: 700, mono: true, color: C.faint, align: 'center', base: 'middle', track: 0.1 });
  }
  const total = L.kind === 'steps' ? L.steps : L.items.length;
  const got = L.kind === 'steps' ? ctx.progress.stepsDone(i) : s.tested.filter((t) => L.items.some((it) => it.id === t)).length;
  P.text(L.challenge, STAMP.x, 181, { size: 3.1, weight: 600, color: C.soft, align: 'center' });
  P.text(`${Math.min(got, total)} / ${total}`, STAMP.x, 186, { size: 3.1, weight: 700, mono: true, color: got >= total ? C.limeInk : C.action, align: 'center' });
  folio(P, i * 2 + 3, 'right');
}

// ——— финал ———

function finalLeft(P, ctx) {
  paper(P, 'left');
  const n = ctx.progress.stamps();
  P.text('MY STAMPS', M, 22, { size: 3.4, weight: 700, mono: true, color: C.action, track: 0.08 });
  P.text(n === LESSONS.length ? 'You did it!' : 'Collect them all', M, 34, { size: 9, weight: 800, track: -0.02 });
  P.text(`${n} of ${LESSONS.length} stamps · ${n} из ${LESSONS.length}`, M, 41, { size: 4.2, color: C.soft });
  LESSONS.forEach((l, k) => {
    const x = 26 + (k % 5) * 24.5, y = 62 + Math.floor(k / 5) * 38, st = ctx.progress.lesson(k), locked = ctx.progress.locked(k);
    if (st.stamp) stamp(P, x, y, 10.5, k + 1, aicoImage('happy', 1), { rot: -0.25 + k * 0.07 });
    else {
      P.circle(x, y, 10.5, { stroke: C.faint, lw: 0.4, dash: [1.2, 1] });
      P.text(locked ? '🔒' : String(k + 1), x, y + 0.5, { size: locked ? 5 : 5.5, weight: 700, mono: !locked, color: C.line, align: 'center', base: 'middle' });
    }
    const words = l.title.split(' ');
    const half = Math.ceil(words.length / 2);
    P.text(words.slice(0, half).join(' '), x, y + 15.5, { size: 2.7, weight: 650, color: st.stamp ? C.ink : C.faint, align: 'center' });
    P.text(words.slice(half).join(' '), x, y + 19, { size: 2.7, weight: 650, color: st.stamp ? C.ink : C.faint, align: 'center' });
    P.hit('goto:' + (k + 1), x - 12, y - 12, 24, 34);
  });
  const words = ctx.progress.wordsLearned();
  P.rrect(M, 140, CW, 40, 5, { fill: n === LESSONS.length ? C.lime : C.inset });
  P.img(aicoImage(n === LESSONS.length ? 'love' : 'calm', n / LESSONS.length), M + 5, 145, 30, 30);
  P.text(n === LESSONS.length ? 'I am a Word Lab scientist!' : 'Words I know', M + 40, 155, { size: 5, weight: 800, color: n === LESSONS.length ? C.deep : C.ink });
  P.text(`${words}`, M + 40, 171, { size: 13, weight: 850, mono: true, color: n === LESSONS.length ? C.deep : C.action });
  P.text(`of ${WORD_COUNT} words`, M + 40 + P.measure(`${words}`, { size: 13, weight: 850, mono: true }) + 3, 171, { size: 4, weight: 600, color: C.soft });
  brandMark(P, M + 9, 192);
  folio(P, LESSONS.length * 2 + 2, 'left');
}

function finalRight(P, ctx) {
  paper(P, 'right');
  const n = ctx.progress.stamps();
  P.text('ДЛЯ РОДИТЕЛЕЙ', M, 22, { size: 3.4, weight: 700, mono: true, color: C.action, track: 0.08 });
  P.text('Продолжение — вживую', M, 33, { size: 7.4, weight: 800, track: -0.02 });
  let y = P.wrap(`Пройдено опытов: ${n} из ${LESSONS.length}, слов: ${ctx.progress.wordsLearned()}. На бесплатном открытом уроке ребёнок сделает 5 опытов руками и расскажет о них по-английски:`, M, 43, CW, 5.2, { size: 3.8, color: C.ink });
  y += 2;
  TRIAL.tasks.forEach((t, k) => {
    P.rrect(M, y - 4.6, CW, 8.4, 2.6, { fill: k % 2 ? '#fff' : C.inset });
    P.text(`${k + 1}`, M + 4, y + 0.6, { size: 3.6, weight: 800, mono: true, color: C.action, align: 'center' });
    P.text(t.title, M + 9, y + 0.8, { size: 3.9, weight: 700 });
    y += 9.6;
  });
  y += 2;
  P.text(TRIAL.dates, M, y, { size: 3.6, weight: 700, color: C.action });
  P.text(TRIAL.where, M, y + 5.2, { size: 3.3, color: C.soft });
  pill(P, 'cta', 'Записаться на бесплатный урок  →', M, y + 10, CW, 13, { on: true, size: 4.6 });
  P.text(TRIAL.teacher, PAGE_W / 2, y + 29, { size: 3, weight: 600, color: C.soft, align: 'center' });
  pill(P, 'reset', 'Начать книгу заново', M + CW / 2 - 25, 178, 50, 8, { size: 3.2 });
  folio(P, LESSONS.length * 2 + 3, 'right');
}

export function drawPage(P, spread, side, ctx) {
  P.begin();
  const sp = SPREADS[spread];
  if (!sp) { paper(P, side); return; }
  if (sp.kind === 'title') side === 'left' ? titleLeft(P, ctx) : titleRight(P, ctx);
  else if (sp.kind === 'lesson') side === 'left' ? lessonLeft(P, ctx, sp.lesson) : lessonRight(P, ctx, sp.lesson);
  else side === 'left' ? finalLeft(P, ctx) : finalRight(P, ctx);
}

// Текстовая версия для скринридеров — то же, что на страницах.
export function textVersion(ctx) {
  const out = [`<h1>${BOOK.title}: ${BOOK.subtitle}</h1>`];
  LESSONS.forEach((L, i) => {
    const s = ctx.progress.lesson(i);
    out.push(`<section><h2>Lesson ${i + 1}: ${L.title}</h2><p>Words: ${L.words.map(([e, r]) => `${e} (${r})`).join(', ')}.</p>` +
      `<p>Predict: ${L.predict.q} ${L.predict.options.map((o, k) => `<button data-a11y="pick:${i}:${k}" aria-pressed="${s.pick === k}">${o}</button>`).join(' ')}</p>` +
      `<p>Test: ${L.task}</p><p>Why: ${L.why.join(' ')}</p></section>`);
  });
  out.push(`<p><button data-a11y="funnel">Записаться на бесплатный урок</button></p>`);
  return out.join('');
}

export { PAGE_W, PAGE_H };
