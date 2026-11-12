import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createProgress, KEY } from '../src/state.js';
import { LESSONS, SPREADS, WORD_COUNT, TRIAL, COACH, COACH_RU, BOOK } from '../src/content.js';
import { allLines, wordLine } from '../src/voicelines.js';

const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), m }; };

// проходит урок до штампа так, как это делает ребёнок
function finish(p, i, pick = LESSONS[i].predict.answer) {
  const L = LESSONS[i];
  L.words.slice(0, 3).forEach(([w]) => p.hear(i, w));
  p.predict(i, pick);
  if (L.kind === 'steps') for (let n = 1; n <= L.steps; n++) p.test(i, 'step' + n);
  else L.items.forEach((it) => p.test(i, it.id));
  p.sayIt(i);
  p.openFlap(i);
  return p.tryStamp(i);
}

test('content: 10 complete lessons, 60 different words, answer is one of the options', () => {
  assert.equal(LESSONS.length, 10);
  const words = new Set();
  for (const L of LESSONS) {
    assert.ok(L.title && L.ru && L.task && L.taskRu && L.challenge && L.whyRu, L.id);
    assert.ok(['items', 'levels', 'steps'].includes(L.kind), L.id);
    assert.equal(L.words.length, 6, `${L.id}: 6 words`);
    L.words.forEach(([w]) => { assert.ok(!words.has(w), `word «${w}» repeats`); words.add(w); });
    assert.ok(L.predict.answer >= 0 && L.predict.answer < L.predict.options.length, L.id);
    assert.ok(L.predict.ru, `${L.id}: predict.ru`);
    assert.equal(L.why.length, 3, `${L.id}: 3 why lines`);
    if (L.kind === 'steps') assert.ok(L.steps > 0 && L.stepLabel, L.id);
    for (const it of L.items) assert.match(L.sentence(it), /[.!]$/, `${L.id}/${it.id}`);
  }
  assert.equal(WORD_COUNT, 60);
  assert.equal(SPREADS.length, LESSONS.length + 2);
  assert.equal(TRIAL.tasks.length, 5);
});

test('steps go strictly in order: words → predict → test → say → why → done', () => {
  const p = createProgress(memory());
  assert.equal(p.step(0), 'words');
  assert.equal(p.openFlap(0), false, 'flap stays shut before its step');
  p.hear(0, 'float'); p.hear(0, 'sink'); p.hear(0, 'float');
  assert.equal(p.step(0), 'words', 'the same word twice does not count');
  p.hear(0, 'heavy');
  assert.equal(p.step(0), 'predict');
  assert.equal(p.predict(0, 1), true);
  assert.equal(p.predict(0, 0), false, 'cannot change the prediction');
  assert.equal(p.step(0), 'test');
  assert.equal(p.sayIt(0), false, 'cannot «say it» before the test');
  LESSONS[0].items.forEach((it) => p.test(0, it.id));
  assert.equal(p.step(0), 'say');
  assert.equal(p.tryStamp(0), false, 'no stamp before say + why');
  p.sayIt(0);
  assert.equal(p.step(0), 'why');
  assert.equal(p.openFlap(0), true);
  assert.equal(p.tryStamp(0), true);
  assert.equal(p.tryStamp(0), false, 'only once');
  assert.equal(p.step(0), 'done');
  assert.equal(p.right(0), false);
});

test('step lessons count their button presses', () => {
  const i = LESSONS.findIndex((l) => l.id === 'plant');
  const p = createProgress(memory());
  p.predict(i, 1);
  for (let d = 1; d < LESSONS[i].steps; d++) p.test(i, 'step' + d);
  assert.equal(p.challengeDone(i), false);
  assert.equal(p.stepsDone(i), LESSONS[i].steps - 1);
  p.test(i, 'step' + LESSONS[i].steps);
  assert.equal(p.challengeDone(i), true);
});

test('every lesson can be finished to a stamp', () => {
  const p = createProgress(memory());
  p.setLead({ age: '7–9', slot: 'x', via: 'crm' });
  LESSONS.forEach((_, i) => assert.equal(finish(p, i), true, LESSONS[i].id));
  assert.equal(p.stamps(), 10);
  assert.equal(p.wordsLearned(), 60);
  assert.equal(p.rightCount(), 10);
});

test('lessons 6–10 are locked until the parent leaves a contact', () => {
  const p = createProgress(memory());
  for (let i = 0; i < BOOK.freeLessons; i++) assert.equal(p.locked(i), false);
  for (let i = BOOK.freeLessons; i < LESSONS.length; i++) assert.equal(p.locked(i), true);
  p.setLead({ age: '10–12', slot: 'Сб, 21 ноября', via: 'whatsapp' });
  assert.equal(p.unlocked, true);
  assert.equal(p.locked(9), false);
  p.reset();
  assert.equal(p.unlocked, true, 'restarting the book keeps the unlock');
  assert.equal(p.stamps(), 0);
});

test('Russian coach line plays once per step type', () => {
  const p = createProgress(memory());
  assert.equal(p.firstCoach('words'), true);
  assert.equal(p.firstCoach('words'), false);
  assert.equal(p.firstCoach('predict'), true);
});

test('progress survives a reload, broken storage does not crash', () => {
  const s = memory();
  const a = createProgress(s);
  a.hear(2, 'torch'); a.predict(2, 1); a.test(2, 'red'); a.bookmark(3);
  const b = createProgress(s);
  assert.deepEqual(b.lesson(2).heard, ['torch']);
  assert.equal(b.lesson(2).pick, 1);
  assert.deepEqual(b.lesson(2).tested, ['red']);
  assert.equal(b.data.spread, 3);
  s.m.set(KEY, '{not json');
  assert.equal(createProgress(s).stamps(), 0);
  const throwing = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
  assert.equal(createProgress(throwing).predict(0, 0), true);
  const p = createProgress(memory());
  p.bookmark(99); assert.equal(p.data.spread, SPREADS.length - 1);
  p.bookmark(-3); assert.equal(p.data.spread, 0);
});

test('voice: every line the book speaks has an ElevenLabs mp3', () => {
  const manifestPath = new URL('../public/voice/manifest.json', import.meta.url);
  assert.ok(existsSync(manifestPath), 'run: node tools/voice.mjs');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const missing = allLines().filter((l) => !manifest[l.text]).map((l) => l.text);
  assert.deepEqual(missing, []);
  for (const f of Object.values(manifest)) assert.ok(existsSync(new URL('../public/voice/' + f, import.meta.url)), f);
  // то, что произносит рантайм, — в манифесте
  for (const L of LESSONS) {
    L.words.forEach(([w]) => assert.ok(manifest[wordLine(w)], w));
    L.predict.options.forEach((o) => assert.ok(manifest[o + '.'], o));
    assert.ok(manifest[L.why.join(' ')], L.id + ' why');
  }
  Object.values(COACH).forEach((c) => assert.ok(manifest[c.en], c.en));
  Object.values(COACH_RU).forEach((t) => assert.ok(manifest[t], t));
});

test('funnel: past open-lesson dates disappear, «Другой день» always stays', async () => {
  const { openSlots, validPhone, FUNNEL } = await import('../src/funnel.js');
  assert.deepEqual(openSlots(new Date('2026-11-12T10:00:00Z')), ['Сб, 21 ноября', 'Вс, 22 ноября', FUNNEL.other]);
  assert.deepEqual(openSlots(new Date('2026-11-22T10:00:00Z')), ['Вс, 22 ноября', FUNNEL.other]);
  assert.deepEqual(openSlots(new Date('2026-11-23T10:00:00Z')), [FUNNEL.other]);
  assert.ok(FUNNEL.ages.includes('13–17'));
  for (const ok of ['700123456', '555123456', '995123456', '312123456', '220123456']) assert.equal(validPhone(ok), true, ok);
  for (const no of ['000000000', '123456789', '70012345', '7001234567', '812345678']) assert.equal(validPhone(no), false, no);
});

test('parent card shows after stamps 2 and 4, once each, never after a lead', () => {
  const p = createProgress(memory());
  assert.equal(p.parentCardDue(1), false);
  assert.equal(p.parentCardDue(2), true);
  p.markParentCard(2);
  assert.equal(p.parentCardDue(2), false);
  assert.equal(p.parentCardDue(4), true);
  p.setLead({ via: 'crm' });
  assert.equal(p.parentCardDue(4), false);
});
