// AiCo Word Lab: открытая 3D-книга на столе. Страницы — canvas-текстуры, опыты поднимаются со страницы
// чернильным 3D-рисунком, «энергия» опыта светится (bloom). Урок идёт по шагам, и на каждом шаге AiCo
// показывает одну цель: кольцо, рука и подсказка (английский голос + русский перевод).
// На телефоне сверху — опыт в 3D, снизу — панель с текущим шагом. Уроки 6–10 открываются после заявки родителя.
import '@fontsource-variable/inter';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';
import './ui.css';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

import { BOOK, LESSONS, SPREADS, COACH, COACH_RU } from './content.js';
import { createProgress } from './state.js';
import { preloadAico, aicoImage } from './aico.js';
import { speak, speakAfter, sfx, setMuted, isMuted, ready as voiceReady, preload, unlockAudio } from './audio.js';
import { wordLine } from './voicelines.js';
import { createBook, mm, W, H, PAGE_Y, S } from './book.js';
import { drawPage, textVersion, FLAP, STAMP } from './pages.js';
import { Painter, C, PAGE_W, PAGE_H, stamp as drawStamp } from './paint.js';
import { tickInk, setLift, LIGHT_DIR } from './ink.js';
import { createUI } from './ui.js';
import { createFunnel } from './funnel.js';
import { track } from './track.js';
import { createFloat } from './labs/float.js';
import { createMagnet } from './labs/magnet.js';
import { createRainbow } from './labs/rainbow.js';
import { createPlant } from './labs/plant.js';
import { createRamp } from './labs/ramp.js';
import { createSing } from './labs/sing.js';
import { createShadow } from './labs/shadow.js';
import { createIce } from './labs/ice.js';
import { createCircuit } from './labs/circuit.js';
import { createFizz } from './labs/fizz.js';

const FACTORY = { float: createFloat, magnet: createMagnet, rainbow: createRainbow, plant: createPlant, ramp: createRamp, sing: createSing, shadow: createShadow, ice: createIce, circuit: createCircuit, fizz: createFizz };
const RAINBOW_EMOJI = { red: '🔴', orange: '🟠', yellow: '🟡', green: '🟢', blue: '🔵', indigo: '🟦', violet: '🟣' };
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const touch = matchMedia('(pointer: coarse)').matches;
const lowEnd = touch || Math.min(innerWidth, innerHeight) < 600;
const $ = (s) => document.querySelector(s);

function hasWebGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

async function start() {
  if (!hasWebGL()) { document.body.classList.add('nogl'); $('#loader').classList.add('done'); return; }
  await Promise.all([
    document.fonts.load('600 20px "Inter Variable"', 'Aa Яя'),
    document.fonts.load('800 20px "Inter Variable"', 'Aa'),
    document.fonts.load('700 20px "JetBrains Mono"', '0'),
    preloadAico(), voiceReady,
  ]).catch(() => {});

  // ——— рендер ———
  const canvas = $('#c');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !lowEnd, powerPreference: 'high-performance' });
  const dpr = Math.min(devicePixelRatio || 1, lowEnd ? 1.5 : 2);
  renderer.setPixelRatio(dpr);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.NeutralToneMapping;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#dfe6f3');
  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 40);

  const deskTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const g = c.getContext('2d'), gr = g.createRadialGradient(256, 256, 30, 256, 256, 256);
    gr.addColorStop(0, '#eef2fa'); gr.addColorStop(0.6, '#e2e8f4'); gr.addColorStop(1, '#d5ddec');
    g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const desk = new THREE.Mesh(new THREE.PlaneGeometry(14, 14).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: deskTex, roughness: 1 }));
  desk.receiveShadow = true;
  scene.add(desk);
  scene.add(new THREE.HemisphereLight('#ffffff', '#c6d0e6', 1.9));
  const sun = new THREE.DirectionalLight('#ffffff', 1.25);
  sun.position.copy(LIGHT_DIR).multiplyScalar(6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(lowEnd ? 1024 : 2048, lowEnd ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -2.2, right: 2.2, top: 2.2, bottom: -2.2, near: 1, far: 14 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.01; sun.shadow.radius = 4;
  scene.add(sun);

  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: lowEnd ? 0 : 4 }));
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.62, 0.45, 1.0);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // ——— книга и прогресс ———
  const progress = createProgress();
  if (new URLSearchParams(location.search).get('unlock') === 'lab' && !progress.unlocked) progress.setLead({ via: 'link' });
  const book = createBook(renderer, { px: lowEnd ? 6 : 7.5 });
  scene.add(book.group);
  const pageCtx = { progress, labs: [], hideStamp: false };
  book.setPainter((P, spread, side) => drawPage(P, spread, side, pageCtx));

  let cur = progress.data.spread || 0;
  if (SPREADS[cur].kind === 'lesson' && progress.locked(SPREADS[cur].lesson)) cur = BOOK.freeLessons;
  const spreadLesson = () => (SPREADS[cur].kind === 'lesson' ? SPREADS[cur].lesson : -1);
  const phone = () => innerWidth / innerHeight < 0.95;

  // ——— голос AiCo: английская фраза + русская подсказка в первый раз ———
  // say — то, что вызвал ребёнок: звучит сразу. Подсказки AiCo встают в очередь и не перебивают ребёнка.
  function say(text, opts) { return speak(text, opts); }
  function coachSpeak(step, { force = false } = {}) {
    const c = COACH[step]; if (!c) return Promise.resolve(false);
    const ru = COACH_RU[step];
    if (ru && (force || progress.firstCoach(step))) return speakAfter(ru, { lang: 'ru' }).then((ok) => ok && speakAfter(c.en));
    return speakAfter(c.en);
  }

  // ——— опыты: создаются при первом открытии разворота ———
  const labs = [];
  function lab(i) {
    if (labs[i]) return labs[i];
    const lesson = LESSONS[i];
    const ctx = {
      i, lesson, progress, labState: {}, sfx,
      say: (t) => say(t),
      needPredict: () => false,
      tested(id, voice = true) {
        progress.test(i, id);
        const it = lesson.items.find((x) => x.id === id);
        if (voice && it) say(lesson.sentence(it));
        book.repaint('left'); book.repaint('right');
        afterAction();
      },
      repaintRight() { book.repaint('right'); },
    };
    const l = FACTORY[lesson.id](ctx);
    const root = new THREE.Group();
    root.position.y = PAGE_Y;
    l.group.position.y = -PAGE_Y;
    root.add(l.group);
    book.group.add(root);
    setLift(root, 0);
    Object.assign(l, { root, lift: 0, liftTo: 0 });
    l.sync?.();
    labs[i] = l; pageCtx.labs = labs;
    return l;
  }

  // кнопки опыта для панели на телефоне (и для указателя)
  function controlsOf(i) {
    const L = LESSONS[i], s = progress.lesson(i), l = lab(i);
    if (l.buttons) {
      return l.buttons().map((b) => ({ id: b.id, label: b.label, on: b.on, primary: ['go', 'light', 'next', 'add'].includes(b.id), done: s.tested.includes(b.id) }));
    }
    const list = L.items.map((it) => ({ id: it.id, label: it.name, emoji: it.emoji || RAINBOW_EMOJI[it.id], done: s.tested.includes(it.id) }));
    if (L.id === 'rainbow') list.unshift({ id: 'torch', label: 'torch', emoji: '🔦', done: !!l.isOn?.(), primary: !l.isOn?.() });
    return list;
  }

  // ——— клапан WHY? ———
  const flapCanvas = document.createElement('canvas');
  const FP = new Painter(flapCanvas, 8, FLAP.w, FLAP.h);
  (function drawFlap() {
    const g = FP.g; FP.begin();
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, flapCanvas.width, flapCanvas.height);
    FP.rrect(1.2, 1.2, FLAP.w - 2.4, FLAP.h - 2.4, 3.2, { stroke: '#2e44d1', lw: 0.4, dash: [1.4, 1] });
    FP.text('WHY?', 6, 11, { size: 3.6, weight: 800, mono: true, color: C.action, track: 0.1 });
    FP.text('Lift the flap to see the answer', 6, 21, { size: 4.6, weight: 700 });
    FP.text('…after your test and Say it.', 6, 27.5, { size: 3.5, italic: true, color: C.soft });
    FP.text('Подними клапан — узнай почему', 6, 35, { size: 3, color: C.soft });
    FP.text('lift here', FLAP.w - 22, FLAP.h - 10, { size: 3.4, weight: 700, mono: true, color: C.action });
    FP.path((g2, p) => { g2.moveTo((FLAP.w - 12) * p, (FLAP.h - 7) * p); g2.lineTo((FLAP.w - 7) * p, (FLAP.h - 4) * p); g2.lineTo((FLAP.w - 6) * p, (FLAP.h - 9) * p); g2.strokeStyle = C.action; g2.lineWidth = 0.5 * p; g2.lineCap = 'round'; g2.stroke(); });
    FP.rrect(0, FLAP.h - 3, FLAP.w, 3, 0, { fill: C.lime });
  })();
  const flapTex = new THREE.CanvasTexture(flapCanvas); flapTex.colorSpace = THREE.SRGBColorSpace; flapTex.anisotropy = 8;
  const backCanvas = document.createElement('canvas');
  const BP = new Painter(backCanvas, 8, FLAP.w, FLAP.h);
  (function drawBack() {
    const g = BP.g; BP.begin();
    g.save(); g.translate(0, backCanvas.height); g.scale(1, -1);
    g.fillStyle = C.lime; g.fillRect(0, 0, backCanvas.width, backCanvas.height);
    BP.img(aicoImage('love', 1), 6, 9, 26, 26);
    BP.text('Now you know!', 38, 21, { size: 6, weight: 800, color: C.deep });
    BP.text('Теперь ты знаешь!', 38, 28, { size: 3.6, weight: 600, color: C.limeInk });
    g.restore();
  })();
  const backTex = new THREE.CanvasTexture(backCanvas); backTex.colorSpace = THREE.SRGBColorSpace; backTex.anisotropy = 8;
  // петля — у нижнего края: клапан откидывается к ребёнку и не закрывает опыт
  const flapGeo = new THREE.PlaneGeometry(FLAP.w * S, FLAP.h * S).rotateX(-Math.PI / 2).translate(0, 0, -(FLAP.h * S) / 2);
  const flapFront = new THREE.Mesh(flapGeo, new THREE.MeshStandardMaterial({ map: flapTex, roughness: 0.9, side: THREE.FrontSide }));
  const flapBack = new THREE.Mesh(flapGeo, new THREE.MeshStandardMaterial({ map: backTex, roughness: 0.9, side: THREE.BackSide }));
  flapFront.castShadow = true; flapFront.userData.flap = true; flapBack.userData.flap = true;
  const flap = new THREE.Group(); flap.add(flapFront, flapBack);
  flap.position.copy(mm(FLAP.x + FLAP.w / 2, FLAP.y + FLAP.h, 0.0016));
  book.group.add(flap);
  let flapAngle = 0, flapTo = 0, flapWiggle = 0;

  function tapFlap() {
    const i = spreadLesson(); if (i < 0) return;
    const step = progress.step(i);
    if (step === 'done') { flapTo = flapTo > 0 ? 0 : 2.75; sfx('flap'); return; }
    if (step !== 'why') { flapWiggle = 1; nudge(); return; }
    progress.openFlap(i);
    flapTo = 2.75; sfx('flap');
    track('flap', { lesson: i + 1 });
    const gotStamp = progress.tryStamp(i);
    if (gotStamp) pageCtx.hideStamp = true;
    // штамп падает, когда AiCo дочитает ответ (или ребёнок перебьёт его) — объяснение слышно целиком
    let dropped = false;
    const drop = () => { if (dropped || !gotStamp) return; dropped = true; stampIt(i); };
    setTimeout(() => say(LESSONS[i].why.join(' ')).then(() => setTimeout(drop, 300)), 450);
    setTimeout(drop, 15000);
    afterAction();
  }

  // ——— штамп: падает на страницу и «впечатывается» ———
  const stampCanvas = document.createElement('canvas');
  const SP = new Painter(stampCanvas, 10, STAMP.r * 2 + 2, STAMP.r * 2 + 2);
  const stampTex = new THREE.CanvasTexture(stampCanvas); stampTex.colorSpace = THREE.SRGBColorSpace;
  const stampMesh = new THREE.Mesh(new THREE.PlaneGeometry((STAMP.r * 2 + 2) * S, (STAMP.r * 2 + 2) * S).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: stampTex, transparent: true, toneMapped: false }));
  stampMesh.visible = false; book.group.add(stampMesh);
  let stampAnim = null;
  function stampIt(i) {
    if (spreadLesson() !== i) { pageCtx.hideStamp = false; book.repaint('right'); return; }
    SP.begin(); drawStamp(SP, STAMP.r + 1, STAMP.r + 1, STAMP.r, i + 1, aicoImage('happy', 1), { rot: -0.2 + i * 0.09 });
    stampTex.needsUpdate = true;
    stampMesh.position.copy(mm(STAMP.x, STAMP.y, 0.3));
    stampMesh.visible = true; stampAnim = { t: 0, i };
  }
  function updateStamp(dt) {
    if (!stampAnim) return;
    stampAnim.t += dt;
    const k = Math.min(1, stampAnim.t / 0.45), e = k * k;
    stampMesh.position.y = PAGE_Y + 0.004 + (1 - e) * 0.32;
    stampMesh.scale.setScalar(1 + (1 - e) * 0.5);
    stampMesh.rotation.y = (1 - e) * 0.6;
    if (k >= 1 && !stampAnim.hit) {
      stampAnim.hit = true; sfx('stamp');
      pageCtx.hideStamp = false; book.repaint('right'); book.repaint('left');
      const n = progress.stamps();
      track('stamp', { n, lesson: stampAnim.i + 1 });
      speakAfter(COACH.stamp.en).then(() => {
        // после 2-го и 4-го штампа — небольшая карточка «Покажи маме или папе» (не модальное окно)
        if (progress.parentCardDue(n)) { progress.markParentCard(n); setTimeout(() => { ui.parentCard(true); speakAfter(COACH_RU.parent, { lang: 'ru' }); track('parent_card', { n }); }, 400); }
      });
      renderUI(true);
    }
    if (stampAnim.t > 0.8) { stampMesh.visible = false; stampAnim = null; }
  }

  // ——— навигация ———
  function showSpread() {
    const li = spreadLesson();
    if (li >= 0) lab(li);
    book.show(cur);
    labs.forEach((l, k) => { if (!l) return; l.liftTo = k === li ? 1 : 0; if (k === li) l.sync?.(); });
    flapAngle = flapTo = li >= 0 && progress.lesson(li).flap ? 2.75 : 0;
    flap.visible = li >= 0;
    if (li >= 0) {
      const L = LESSONS[li];
      preload([...L.words.map(([w]) => wordLine(w)), ...L.items.map((it) => L.sentence(it)), L.predict.q, L.why.join(' '), ...Object.values(COACH).map((c) => c.en)]);
      track('lesson_start', { lesson: li + 1 });
    }
    $('#a11y').innerHTML = textVersion(pageCtx);
    lastStepKey = '';
    listened = new Set();
    afterAction();
  }

  let pendingTurn = null;
  function goTo(n) {
    n = Math.max(0, Math.min(SPREADS.length - 1, n));
    if (n === cur || book.turning || pendingTurn) return;
    if (SPREADS[n].kind === 'lesson' && progress.locked(SPREADS[n].lesson)) { funnel.open('lock'); return; }
    menu.classList.remove('open');
    const from = cur;
    labs.forEach((l) => { if (l) l.liftTo = 0; });
    flapTo = 0;
    pendingTurn = setTimeout(() => {
      pendingTurn = null;
      flap.visible = false;
      sfx('page');
      cur = n; progress.bookmark(n);
      book.turn(from, n, showSpread);
      renderUI();
    }, spreadLesson() >= 0 && !reduced ? 320 : 0);
  }
  const step = (dir) => goTo(cur + dir);

  // ——— шаги урока: подсказка AiCo, перерисовка, указатель ———
  let lastStepKey = '';
  function afterAction() {
    const li = spreadLesson();
    const st = li >= 0 ? progress.step(li) : SPREADS[cur].kind;
    const key = cur + ':' + st;
    if (key !== lastStepKey) {
      const first = lastStepKey === '';
      lastStepKey = key;
      book.repaint('left'); book.repaint('right');
      if (li >= 0 && st !== 'done') setTimeout(() => coachSpeak(st), first ? 900 : 500);
    }
    renderUI();
  }
  function nudge() {
    pointer.handUntil = performance.now() + 2500;
    const li = spreadLesson();
    if (li >= 0) coachSpeak(progress.step(li));
  }

  // ——— нажатия: опыт → клапан → зоны на страницах ———
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function pick(ev) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (book.turning) return null;
    const li = spreadLesson();
    const targets = [];
    if (li >= 0 && labs[li]?.lift > 0.9) targets.push(labs[li].group);
    if (flap.visible) targets.push(flap);
    targets.push(book.left, book.right);
    for (const h of ray.intersectObjects(targets, true)) {
      let o = h.object;
      while (o && !o.userData.tap && !o.userData.flap && !o.userData.side) o = o.parent;
      if (!o) continue;
      if (o.userData.tap) return { kind: 'lab', id: o.userData.tap };
      if (o.userData.flap) return { kind: 'flap' };
      if (o.userData.side && h.uv) {
        const x = h.uv.x * PAGE_W, y = (1 - h.uv.y) * PAGE_H;
        const z = book.hits(o.userData.side).find((b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
        return z ? { kind: 'page', id: z.id, side: o.userData.side } : { kind: 'paper', side: o.userData.side };
      }
    }
    return null;
  }

  // опыт доступен с шага «test» (и после — чтобы поиграть ещё)
  const labOpen = (i) => !['words', 'predict'].includes(progress.step(i));
  let listened = new Set();

  function act(hit) {
    if (!hit) return;
    unlockAudio();
    const li = spreadLesson();
    if (hit.kind === 'lab') {
      if (!labOpen(li)) return nudge();
      return labs[li].tap(hit.id);
    }
    if (hit.kind === 'flap') return tapFlap();
    if (hit.kind === 'paper') return;
    const [k, v] = hit.id.split(/:(.*)/s);
    switch (k) {
      case 'next': {
        if (SPREADS[cur].kind === 'title') { if (progress.sayHello()) say(COACH.hello.en); return goTo(cur + 1); }
        const nx = SPREADS[cur + 1];
        if (nx?.kind === 'lesson' && progress.locked(nx.lesson)) return funnel.open('lock');
        return goTo(cur + 1);
      }
      case 'hello': return say(COACH.hello.en);
      case 'replay': { if (li >= 0) { const st = progress.step(li); return COACH_RU[st] ? say(COACH_RU[st], { lang: 'ru' }).then((ok) => ok && say(COACH[st].en)) : say((COACH[st] || COACH.right).en); } return say(COACH.hello.en); }
      case 'word': {
        sfx('tap');
        say(wordLine(v));
        if (li >= 0 && progress.hear(li, v)) afterAction();
        return;
      }
      case 'say': { listened.add(v); say(v); renderUI(); return; }
      case 'saidit': {
        if (li < 0 || progress.step(li) !== 'say') return;
        progress.sayIt(li); sfx('win'); say(COACH.saidIt.en);
        track('said_it', { lesson: li + 1 });
        return afterAction();
      }
      case 'flap': return tapFlap();
      case 'pick': {
        if (progress.step(li) !== 'predict') return progress.lesson(li).pick === null ? nudge() : undefined;
        progress.predict(li, Number(v)); sfx('tap');
        say(LESSONS[li].predict.options[Number(v)] + '.').then((ok) => ok && coachSpeak('test'));
        lastStepKey = cur + ':test'; // подсказку шага «test» запустили выше, после ответа
        book.repaint('left'); book.repaint('right');
        $('#a11y').innerHTML = textVersion(pageCtx);
        return afterAction();
      }
      case 'ctl': case 'lab': {
        if (!labOpen(li)) return nudge();
        const l = labs[li];
        if (l.buttons?.().some((b) => b.id === v)) return l.button(v);
        return l.tap(v);
      }
      case 'goto': return goTo(Number(v));
      case 'cta': case 'funnel': case 'parents': return funnel.open('menu');
      case 'menu': return menu.classList.toggle('open');
      case 'sound': return toggleSound();
      case 'reset': {
        if (!confirm('Начать книгу заново? Штампы и прогнозы сотрутся.')) return;
        progress.reset(); labs.forEach((l) => l?.sync?.()); listened = new Set();
        book.show(cur); lastStepKey = ''; afterAction();
        return goTo(0);
      }
    }
  }

  let down = null;
  canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  canvas.addEventListener('pointerup', (e) => {
    if (!down) return;
    const dx = e.clientX - down.x, dy = e.clientY - down.y, dt = performance.now() - down.t;
    down = null;
    const swipeOk = spreadLesson() < 0 || progress.step(spreadLesson()) === 'done';
    if (swipeOk && Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 700) return step(dx < 0 ? 1 : -1);
    if (Math.hypot(dx, dy) < 12) act(pick(e));
  });
  let hoverEv = null;
  const pointer = { x: 0, y: 0, handUntil: 0 };
  canvas.addEventListener('pointermove', (e) => { hoverEv = e; pointer.x = (e.clientX / innerWidth) * 2 - 1; pointer.y = (e.clientY / innerHeight) * 2 - 1; });

  addEventListener('keydown', (e) => {
    if (e.target.closest?.('#a11y, .funnel')) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); step(-1); }
    if (e.key === 'm') toggleSound();
    if (e.key === 'Escape') menu.classList.remove('open');
  });
  $('#a11y').addEventListener('click', (e) => {
    const b = e.target.closest('[data-a11y]'); if (!b) return;
    if (b.dataset.a11y === 'funnel') return funnel.open('menu');
    const [, i, k] = b.dataset.a11y.split(':');
    progress.predict(Number(i), Number(k)); book.repaint('left'); $('#a11y').innerHTML = textVersion(pageCtx);
  });

  // ——— воронка для родителей ———
  const funnel = createFunnel({
    progress,
    say: (k) => { if (k === 'parent') say(COACH_RU.parent, { lang: 'ru' }); },
    onUnlock: () => { book.repaint('left'); book.repaint('right'); renderUI(true); track('unlock'); },
  });
  funnel.onContinue = () => { const nx = SPREADS[cur + 1]; if (nx?.kind === 'lesson') goTo(cur + 1); else goTo(BOOK.freeLessons + 1); };

  // ——— HTML-слой: панель урока, подсказка, указатель ———
  const ui = createUI({ progress, act, controlsOf, labState: (i) => ({ torchOn: !!labs[i]?.isOn?.() }) });
  ui.onParentCard = (show) => { ui.parentCard(false); if (show) funnel.open('stamp'); else track('parent_card_later'); };
  let uiKey = '';
  function renderUI(force) {
    const li = spreadLesson();
    const s = li >= 0 ? progress.lesson(li) : null;
    const key = [cur, phone(), li >= 0 ? progress.step(li) : '', s ? s.heard.length + '/' + s.tested.join(',') + '/' + (labs[li]?.isOn?.() ? 1 : 0) + JSON.stringify(labs[li]?.buttons?.() || '') : '', progress.stamps(), progress.unlocked, isMuted(), listened.size].join('|');
    if (!force && key === uiKey) return;
    uiKey = key;
    ui.render(cur, phone());
    refreshCapsule();
  }

  // ——— панель (компьютер) ———
  const ico = {
    prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 7h14M5 12h14M5 17h9"/></svg>',
    on: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11"/></svg>',
    off: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 10l4 4M20 10l-4 4"/></svg>',
  };
  $('#ui').innerHTML = `<nav class="capsule" aria-label="Book controls">
    <button id="bPrev" aria-label="Previous page">${ico.prev}</button>
    <div class="label"><b id="lTitle"></b><small id="lSub"></small></div>
    <button id="bNext" aria-label="Next page">${ico.next}</button>
    <span class="sep"></span>
    <button id="bMenu" aria-label="Contents" aria-expanded="false">${ico.menu}</button>
    <button id="bSound" aria-label="Sound" aria-pressed="true">${ico.on}</button>
    <button id="bParents" class="parents">Для родителей</button>
    <div class="stamps" id="stamps" title="Stamps"><i></i><span id="nStamps">0</span></div>
  </nav><div class="menu" id="menu" role="menu"></div>`;
  const menu = $('#menu');
  $('#bPrev').onclick = () => step(-1);
  $('#bNext').onclick = () => act({ kind: 'page', id: 'next' });
  $('#bMenu').onclick = () => { const o = menu.classList.toggle('open'); $('#bMenu').setAttribute('aria-expanded', o); };
  $('#bParents').onclick = () => funnel.open('menu');
  function toggleSound() { setMuted(!isMuted()); $('#bSound').innerHTML = isMuted() ? ico.off : ico.on; $('#bSound').setAttribute('aria-pressed', !isMuted()); renderUI(); }
  $('#bSound').onclick = toggleSound;
  menu.addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (b) { menu.classList.remove('open'); goTo(Number(b.dataset.go)); } });

  function refreshCapsule() {
    const sp = SPREADS[cur], li = spreadLesson();
    $('#lTitle').textContent = sp.kind === 'lesson' ? LESSONS[sp.lesson].title : sp.kind === 'title' ? BOOK.title : 'My stamps';
    $('#lSub').textContent = sp.kind === 'lesson' ? `LESSON ${sp.lesson + 1}/${LESSONS.length}` : sp.kind === 'title' ? 'START' : 'FINISH';
    $('#nStamps').textContent = `${progress.stamps()}/${LESSONS.length}`;
    $('#bPrev').disabled = cur === 0; $('#bNext').disabled = cur === SPREADS.length - 1;
    // «дальше» становится главной кнопкой, только когда урок пройден
    $('#bNext').classList.toggle('primary', li < 0 || progress.step(li) === 'done');
    menu.innerHTML = SPREADS.map((s, k) => {
      const got = s.kind === 'lesson' && progress.lesson(s.lesson).stamp, lock = s.kind === 'lesson' && progress.locked(s.lesson);
      const n = s.kind === 'lesson' ? s.lesson + 1 : s.kind === 'title' ? '▸' : '★';
      return `<button role="menuitem" data-go="${k}" class="${k === cur ? 'on' : ''}${lock ? ' lock' : ''}"><em class="${got ? 'got' : ''}">${got ? '✓' : lock ? '🔒' : n}</em>${s.label}</button>`;
    }).join('') + `<button role="menuitem" class="parents" onclick="">👪 Для родителей: бесплатный урок</button>`;
    menu.querySelector('.parents').onclick = () => { menu.classList.remove('open'); funnel.open('menu'); };
  }

  // ——— указатель: что нажать сейчас ———
  const tmp = new THREE.Vector3();
  function screenOf(v) { tmp.copy(v).applyMatrix4(book.group.matrixWorld).project(camera); return { x: (tmp.x + 1) / 2 * innerWidth, y: (1 - tmp.y) / 2 * innerHeight }; }
  function pageRect(side, r) {
    const x0 = side === 'left' ? -W : 0;
    const a = screenOf(new THREE.Vector3(x0 + r.x * S, PAGE_Y, -H / 2 + r.y * S));
    const b = screenOf(new THREE.Vector3(x0 + (r.x + r.w) * S, PAGE_Y, -H / 2 + (r.y + r.h) * S));
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y) };
  }
  function pageTarget(side, pred) {
    const hits = book.hits(side).filter(pred);
    if (!hits.length) return null;
    const x = Math.min(...hits.map((h) => h.x)), y = Math.min(...hits.map((h) => h.y));
    const x2 = Math.max(...hits.map((h) => h.x + h.w)), y2 = Math.max(...hits.map((h) => h.y + h.h));
    return pageRect(side, { x, y, w: x2 - x, h: y2 - y });
  }
  const box = new THREE.Box3(), c3 = new THREE.Vector3(), s3 = new THREE.Vector3();
  function objTarget(group, id) {
    let found = null;
    group.traverse((o) => { if (!found && o.isMesh && o.userData.tap === id) found = o; });
    if (!found) return null;
    let root = found; while (root.parent && root.parent !== group && root.parent.userData.tap !== undefined) root = root.parent;
    box.setFromObject(root.parent && root.parent !== group ? root.parent : root);
    box.getCenter(c3); box.getSize(s3);
    tmp.copy(c3).project(camera);
    const p = { x: (tmp.x + 1) / 2 * innerWidth, y: (1 - tmp.y) / 2 * innerHeight };
    const edge = c3.clone().add(new THREE.Vector3(Math.max(s3.x, s3.z) / 2, 0, 0)).project(camera);
    const r = Math.abs((edge.x + 1) / 2 * innerWidth - p.x) * 1.3;
    return { ...p, w: r * 2, h: r * 2 };
  }
  let scrolledFor = '';
  const domTarget = (key) => {
    const el = ui.findDom(key); if (!el) return null;
    let r = el.getBoundingClientRect();
    // цель ниже края экрана (короткий телефон) — прокручиваем панель к ней один раз
    if ((r.bottom > innerHeight - 4 || r.top < 0) && scrolledFor !== key + cur) { scrolledFor = key + cur; el.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' }); r = el.getBoundingClientRect(); }
    if (r.bottom > innerHeight + 20) return null;
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
  };

  function target() {
    if (book.turning || pendingTurn || funnel.isOpen || stampAnim) return null;
    const sp = SPREADS[cur], ph = phone();
    if (sp.kind === 'title') return ph ? domTarget('next') : pageTarget('right', (h) => h.id === 'next');
    if (sp.kind === 'final') return ph ? domTarget('funnel') : pageTarget('right', (h) => h.id === 'cta');
    const i = sp.lesson, L = LESSONS[i], s = progress.lesson(i), st = progress.step(i), l = labs[i];
    if (!l || l.lift < 0.95) return null;
    if (st === 'words') { const w = L.words.find(([en]) => !s.heard.includes(en))[0]; return ph ? domTarget('word:' + w) : pageTarget('left', (h) => h.id === 'word:' + w); }
    if (st === 'predict') return ph ? unionDom('pick:') : pageTarget('left', (h) => h.id.startsWith('pick:'));
    if (st === 'test') {
      if (L.id === 'rainbow' && !l.isOn?.()) return objTarget(l.group, 'torch');
      if (L.kind === 'items') { const it = L.items.find((x) => !s.tested.includes(x.id)); return it ? objTarget(l.group, it.id) : null; }
      const b = l.buttons(); const next = L.kind === 'levels' ? (b.find((x) => x.on && !['go', 'light'].includes(x.id) && !s.tested.includes(x.id)) ? b.find((x) => ['go', 'light'].includes(x.id)) : b.find((x) => !['go', 'light'].includes(x.id) && !s.tested.includes(x.id))) : b[0];
      if (!next) return null;
      return ph ? domTarget('ctl:' + next.id) : pageTarget('right', (h) => h.id === 'lab:' + next.id);
    }
    if (st === 'say') {
      if (!listened.size) { const it = (L.kind === 'steps' ? L.items : L.items.filter((x) => s.tested.includes(x.id))).slice(-1)[0]; const t = it && L.sentence(it); return t ? (ph ? domTarget('say:' + t) : pageTarget('left', (h) => h.id === 'say:' + t)) : null; }
      return domTarget('saidit');
    }
    if (st === 'why') { if (ph) return domTarget('flap'); const r = pageRect('right', FLAP); return { ...r, h: r.h * 0.9 }; }
    if (st === 'done') return domTarget('next');
    return null;
  }
  function unionDom(prefix) {
    const els = [...document.querySelectorAll('[data-target]')].filter((e) => e.dataset.target.startsWith(prefix) && e.offsetParent !== null);
    if (!els.length) return null;
    const rs = els.map((e) => e.getBoundingClientRect());
    const x = Math.min(...rs.map((r) => r.left)), y = Math.min(...rs.map((r) => r.top)), x2 = Math.max(...rs.map((r) => r.right)), y2 = Math.max(...rs.map((r) => r.bottom));
    return { x: (x + x2) / 2, y: (y + y2) / 2, w: x2 - x, h: y2 - y };
  }

  // ——— камера: разворот на компьютере, одна страница с опытом над панелью на телефоне ———
  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
  const wantPos = new THREE.Vector3(), wantLook = new THREE.Vector3();
  const v3 = new THREE.Vector3();
  function frame() {
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    const ph = phone(), sp = SPREADS[cur];
    const pts = [];
    let pitch, topLimit, bottomLimit, look;
    if (ph) {
      const side = sp.kind === 'lesson' ? 'right' : 'left';
      const x0 = side === 'left' ? -W : 0;
      for (const x of [x0 + 0.06, x0 + W - 0.06]) for (const z of [-H / 2 + 0.14, H / 2 - 0.12]) pts.push(new THREE.Vector3(x, PAGE_Y, z));
      if (sp.kind === 'lesson') for (const x of [x0 + 0.25, x0 + W - 0.25]) pts.push(new THREE.Vector3(x, 0.3, -H / 2 + 0.4));
      pitch = 1.02;
      const sheetH = ui.sheet.getBoundingClientRect().height || innerHeight * 0.45;
      topLimit = 1 - (56 / innerHeight) * 2;
      bottomLimit = -1 + ((sheetH + 8) / innerHeight) * 2;
      look = new THREE.Vector3(x0 + W / 2, 0, 0.05);
    } else {
      const halfW = W + 0.08;
      for (const x of [-halfW, halfW]) for (const z of [-H / 2 - 0.04, H / 2 + 0.04]) pts.push(new THREE.Vector3(x, PAGE_Y, z));
      for (const x of [-halfW * 0.8, halfW * 0.8]) pts.push(new THREE.Vector3(x, 0.36, -H / 2 + 0.25));
      pitch = 0.76; topLimit = 0.95;
      bottomLimit = -1 + (150 / innerHeight) * 2;
      look = new THREE.Vector3(0, 0, 0.06);
    }
    const dir = new THREE.Vector3(0, Math.sin(pitch), Math.cos(pitch));
    // подбираем расстояние так, чтобы кадр влез между панелями, а потом сдвигаем картинку окном проекции
    camera.clearViewOffset();
    let lo = 0.5, hi = 20, best = 20;
    const fits = (d) => {
      camera.position.copy(look).addScaledVector(dir, d); camera.lookAt(look); camera.updateMatrixWorld();
      let minY = 9, maxY = -9, maxX = 0;
      for (const p of pts) { v3.copy(p).project(camera); minY = Math.min(minY, v3.y); maxY = Math.max(maxY, v3.y); maxX = Math.max(maxX, Math.abs(v3.x)); }
      return { ok: maxX <= (ph ? 1.0 : 0.96) && maxY - minY <= topLimit - bottomLimit, minY, maxY };
    };
    for (let it = 0; it < 24; it++) { const d = (lo + hi) / 2; if (fits(d).ok) { hi = d; best = d; } else lo = d; }
    const r0 = fits(best), want = (topLimit + bottomLimit) / 2, have = (r0.maxY + r0.minY) / 2;
    wantShift = (want - have) * innerHeight / 2;
    wantLook.copy(look);
    wantPos.copy(look).addScaledVector(dir, best);
  }
  let wantShift = 0, shiftNow = 0;

  addEventListener('resize', () => {
    renderer.setSize(innerWidth, innerHeight, false);
    composer.setSize(innerWidth, innerHeight);
    bloom.resolution.set(innerWidth * dpr * 0.5, innerHeight * dpr * 0.5);
    renderUI(true);
  });
  dispatchEvent(new Event('resize'));

  // ——— старт ———
  showSpread();
  frame(); camPos.copy(wantPos).add(new THREE.Vector3(0, 1.2, 1.4)); camLook.copy(wantLook); shiftNow = wantShift;
  setTimeout(() => $('#loader').classList.add('done'), 150);
  track('open', { spread: cur });

  const clock = new THREE.Clock();
  let hoverTimer = 0, hidden = false;
  document.addEventListener('visibilitychange', () => { hidden = document.hidden; });
  renderer.setAnimationLoop(() => {
    if (hidden) return;
    const dt = Math.min(0.05, clock.getDelta()), t = clock.elapsedTime;
    tickInk(t, dpr);
    frame();
    const k = 1 - Math.exp(-dt * (reduced ? 30 : 4.5));
    const par = touch || reduced ? 0 : 1;
    v3.copy(wantPos).add(new THREE.Vector3(pointer.x * 0.05 * par, -pointer.y * 0.03 * par, 0));
    camPos.lerp(v3, k); camLook.lerp(wantLook, k);
    camera.position.copy(camPos); camera.lookAt(camLook);
    shiftNow += (wantShift - shiftNow) * k;
    camera.setViewOffset(innerWidth, innerHeight, 0, shiftNow, innerWidth, innerHeight);
    camera.updateMatrixWorld();

    book.update(dt);
    const li = spreadLesson();
    labs.forEach((l, i) => {
      if (!l) return;
      const goal = book.turning ? 0 : l.liftTo;
      if (l.lift !== goal) {
        const was = l.lift;
        l.lift = reduced ? goal : goal > l.lift ? Math.min(goal, l.lift + dt / 1.1) : Math.max(goal, l.lift - dt / 0.3);
        setLift(l.root, l.lift);
        if (was < 0.95 && l.lift >= 0.95) renderUI(true);
      }
      if (i === li || l.lift > 0) l.update(dt, t);
    });
    flapAngle += (flapTo - flapAngle) * (1 - Math.exp(-dt * 9));
    flapWiggle = Math.max(0, flapWiggle - dt * 2.2);
    const whyNow = li >= 0 && progress.step(li) === 'why' && flapTo === 0;
    flap.rotation.x = flapAngle + Math.sin(flapWiggle * 18) * 0.18 * flapWiggle + (whyNow && !reduced ? Math.max(0, Math.sin(t * 5)) * 0.12 : 0);
    updateStamp(dt);
    renderUI();

    // указатель: кольцо всегда, рука — в первых двух уроках, после простоя 5 с и после неверного нажатия
    const tg = target();
    const handOn = !!tg && (li < 2 || ui.sinceTarget > 5000 || performance.now() < pointer.handUntil);
    ui.point(tg && { ...tg, key: cur + ':' + (li >= 0 ? progress.step(li) : '') + ':' + Math.round(tg.x / 40) + ':' + Math.round(tg.y / 40) }, { handOn });

    hoverTimer -= dt;
    if (hoverEv && hoverTimer <= 0 && !touch) {
      hoverTimer = 0.08;
      const h = pick(hoverEv);
      canvas.style.cursor = h && h.kind !== 'paper' ? 'pointer' : 'default';
    }
    composer.render(dt);
  });
  window.__wordlab = { goTo, progress, act, pick, labs, funnel, get cur() { return cur; }, renderer, target };
}

start();
