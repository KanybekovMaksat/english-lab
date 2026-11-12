// Голос: готовые mp3 из ElevenLabs (public/voice/, manifest.json: текст → файл). Если фразы нет в манифесте
// или файл не загрузился — читает Web Speech. Короткие звуки синтезируются в WebAudio — без файлов.

let muted = false;
let ctx = null;
let manifest = {};
let voice = null;
const base = new URL('voice/', document.baseURI).href;
const buffers = new Map(); // файл → Promise<AudioBuffer>
let current = null;

export const ready = fetch(base + 'manifest.json').then((r) => (r.ok ? r.json() : {})).then((m) => { manifest = m; }).catch(() => {});

const PREFERRED = ['Samantha', 'Karen', 'Moira', 'Google UK English Female', 'Google US English', 'Microsoft Aria', 'Microsoft Jenny', 'Daniel'];
function pickVoice() {
  const all = (globalThis.speechSynthesis && speechSynthesis.getVoices()) || [];
  const en = all.filter((v) => /^en[-_]/i.test(v.lang));
  voice = PREFERRED.map((n) => en.find((v) => v.name.startsWith(n))).find(Boolean) || en[0] || null;
}
if (globalThis.speechSynthesis) { pickVoice(); speechSynthesis.addEventListener?.('voiceschanged', pickVoice); }

export const setMuted = (m) => { muted = m; if (m) stop(); };
export const isMuted = () => muted;
export const hasVoice = (text) => !!manifest[text];

function ac() {
  if (!ctx) {
    const A = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!A) return null;
    ctx = new A();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
// iOS и встроенные браузеры: звук разрешается только из первого нажатия.
export function unlockAudio() {
  const c = ac(); if (!c) return;
  const b = c.createBuffer(1, 1, 22050), s = c.createBufferSource();
  s.buffer = b; s.connect(c.destination); s.start(0);
}

function load(file) {
  if (!buffers.has(file)) {
    const c = ac();
    buffers.set(file, fetch(base + file).then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then((a) => new Promise((res, rej) => c.decodeAudioData(a, res, rej))).catch((e) => { buffers.delete(file); throw e; }));
  }
  return buffers.get(file);
}
// Заранее подгружаем фразы урока, чтобы голос звучал сразу по нажатию.
export function preload(texts) { if (!ac()) return; for (const t of texts) if (manifest[t]) load(manifest[t]).catch(() => {}); }

function stop() {
  if (current) { const c = current; current = null; try { c.stop(); } catch { /* уже остановлен */ } c.__cut?.(); }
  globalThis.speechSynthesis?.cancel();
}

function webSpeech(text, lang) {
  if (!globalThis.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === 'ru' ? 'ru-RU' : voice?.lang || 'en-GB';
  if (lang !== 'ru' && voice) u.voice = voice;
  u.rate = 0.9; speechSynthesis.speak(u);
}

// Promise<boolean>: true — фраза договорена до конца, false — её перебили (или звука нет).
// Продолжения вроде «сказать подсказку после слова» запускаем только на true.
let epoch = 0;
export function speak(text, { lang = 'en' } = {}) {
  epoch++;
  if (muted || !text) { stop(); return Promise.resolve(!muted && !!text); }
  stop();
  const file = manifest[text];
  const c = ac();
  if (!file || !c) { webSpeech(text, lang); return Promise.resolve(true); }
  const token = {};
  current = token;
  return load(file).then((buf) => new Promise((res) => {
    if (current !== token || muted) return res(false);
    const s = c.createBufferSource(), g = c.createGain();
    g.gain.value = 1; s.buffer = buf; s.connect(g).connect(c.destination);
    let finished = false;
    // onended может не прийти, если звук заблокирован браузером, — страхуемся таймером по длине фразы
    const done = (complete) => { if (finished) return; finished = true; clearTimeout(guard); if (current === s) current = null; res(complete); };
    const guard = setTimeout(() => done(current === s), buf.duration * 1000 + 400);
    s.onended = () => done(current === s);
    s.__cut = () => done(false);
    current = s; s.start();
  })).catch(() => { if (current === token) { current = null; webSpeech(text, lang); return true; } return false; });
}

// Подсказка AiCo ждёт, пока договорит текущая фраза (слово, предложение ребёнка), и не перебивает её.
// Если за это время ребёнок нажал что-то новое — подсказка отменяется.
export function speakAfter(text, opts) {
  const mine = epoch;
  const wait = () => new Promise((r) => {
    const tick = () => { if (epoch !== mine) return r(false); if (!current && !globalThis.speechSynthesis?.speaking) return r(true); setTimeout(tick, 120); };
    tick();
  });
  return wait().then((ok) => (ok ? speak(text, opts) : false));
}

function tone(c, { f = 440, f2 = f, t = 0, d = 0.15, type = 'sine', g = 0.2 }) {
  const o = c.createOscillator(), v = c.createGain(), at = c.currentTime + t;
  o.type = type; o.frequency.setValueAtTime(f, at); o.frequency.exponentialRampToValueAtTime(f2, at + d);
  v.gain.setValueAtTime(0.0001, at); v.gain.exponentialRampToValueAtTime(g, at + 0.012); v.gain.exponentialRampToValueAtTime(0.0001, at + d);
  o.connect(v).connect(c.destination); o.start(at); o.stop(at + d + 0.02);
}

function noise(c, { t = 0, d = 0.3, g = 0.12, from = 2500, to = 600 }) {
  const n = Math.floor(c.sampleRate * d), buf = c.createBuffer(1, n, c.sampleRate), ch = buf.getChannelData(0);
  for (let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * Math.sin((i / n) * Math.PI);
  const s = c.createBufferSource(), fl = c.createBiquadFilter(), v = c.createGain(), at = c.currentTime + t;
  s.buffer = buf; fl.type = 'bandpass'; fl.frequency.setValueAtTime(from, at); fl.frequency.exponentialRampToValueAtTime(to, at + d);
  v.gain.value = g; s.connect(fl).connect(v).connect(c.destination); s.start(at);
}

// Стакан с водой: чистый тон с обертоном и долгим затуханием.
function glassTone(c, f) {
  [[1, 0.22, 1.6], [2.76, 0.06, 0.8], [5.4, 0.025, 0.4]].forEach(([k, g, d]) => tone(c, { f: f * k, d, g }));
}

const SFX = {
  page: (c) => noise(c, { d: 0.35, g: 0.09, from: 3200, to: 900 }),
  tap: (c) => tone(c, { f: 660, f2: 880, d: 0.07, g: 0.08, type: 'triangle' }),
  plop: (c) => { tone(c, { f: 380, f2: 900, d: 0.12, g: 0.18 }); noise(c, { t: 0.02, d: 0.18, g: 0.05, from: 1800, to: 500 }); },
  sink: (c) => tone(c, { f: 520, f2: 140, d: 0.45, g: 0.14 }),
  clink: (c) => { tone(c, { f: 1800, f2: 1700, d: 0.18, g: 0.08, type: 'triangle' }); tone(c, { f: 2600, t: 0.03, d: 0.14, g: 0.05 }); },
  nope: (c) => { tone(c, { f: 300, f2: 260, d: 0.12, g: 0.1, type: 'square' }); tone(c, { f: 240, f2: 200, t: 0.13, d: 0.14, g: 0.1, type: 'square' }); },
  zap: (c) => tone(c, { f: 200, f2: 1200, d: 0.3, g: 0.08, type: 'sawtooth' }),
  grow: (c) => [523, 659, 784].forEach((f, i) => tone(c, { f, t: i * 0.06, d: 0.2, g: 0.08, type: 'triangle' })),
  roll: (c) => noise(c, { d: 0.9, g: 0.06, from: 300, to: 900 }),
  flap: (c) => noise(c, { d: 0.22, g: 0.07, from: 1500, to: 3500 }),
  hum: (c) => tone(c, { f: 110, f2: 120, d: 0.6, g: 0.06, type: 'sawtooth' }),
  fizz: (c) => noise(c, { d: 0.9, g: 0.08, from: 6000, to: 3000 }),
  melt: (c) => [880, 660, 520].forEach((f, i) => tone(c, { f, t: i * 0.12, d: 0.2, g: 0.05 })),
  win: (c) => [523, 659, 784, 1046].forEach((f, i) => tone(c, { f, t: i * 0.08, d: 0.3, g: 0.08, type: 'triangle' })),
  stamp: (c) => { tone(c, { f: 90, f2: 50, d: 0.18, g: 0.35 }); [784, 988, 1319].forEach((f, i) => tone(c, { f, t: 0.18 + i * 0.09, d: 0.35, g: 0.09, type: 'triangle' })); },
};

export function sfx(name, arg) {
  if (muted) return;
  const c = ac(); if (!c) return;
  if (name === 'glass') return glassTone(c, arg || 600);
  SFX[name]?.(c);
}
