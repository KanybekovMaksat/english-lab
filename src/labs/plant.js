// Опыт 4: три горшка. A — только вода, B — вода и солнце, C — ничего. Кнопка «Next day» двигает дни.
import * as THREE from 'three';
import { inked, glow } from '../ink.js';
import { mm } from '../book.js';
import { animator, sparks, ease, tappable } from './kit.js';

const POTS = { water: 34, both: 75, none: 116 };
const POT_Y = 76;
// высота стебля по дням для каждого горшка (0…1)
const GROW = { water: [0, 0.12, 0.2, 0.26, 0.3, 0.32], both: [0, 0.16, 0.36, 0.58, 0.8, 1], none: [0, 0, 0, 0, 0, 0] };

function pot() {
  const g = new THREE.Group();
  g.add(inked(new THREE.CylinderGeometry(0.042, 0.03, 0.06, 28, 1).translate(0, 0.03, 0), '#e08a5a', { wash: 0.5 }));
  const rim = inked(new THREE.CylinderGeometry(0.047, 0.047, 0.014, 28).translate(0, 0.064, 0), '#e08a5a', { wash: 0.5 });
  g.add(rim);
  const soil = inked(new THREE.CylinderGeometry(0.04, 0.04, 0.004, 24).translate(0, 0.066, 0), '#6b4a2b', { outline: 'none', wash: 0.75 });
  g.add(soil);
  return g;
}

function sprout(tint) {
  const g = new THREE.Group();
  const stem = inked(new THREE.CylinderGeometry(0.004, 0.005, 1, 8).translate(0, 0.5, 0), tint, { wash: 0.7, width: 0.7 });
  stem.scale.y = 0.001; g.add(stem);
  const leaves = [];
  for (let k = 0; k < 4; k++) {
    const l = inked(new THREE.SphereGeometry(0.022, 14, 8).scale(1, 0.18, 0.5).translate(0.022, 0, 0), tint, { wash: 0.7, width: 0.7 });
    l.rotation.y = k * Math.PI * 0.9; l.rotation.z = 0.35; l.scale.setScalar(0.001);
    g.add(l); leaves.push(l);
  }
  const flower = new THREE.Group();
  for (let k = 0; k < 6; k++) {
    const p = inked(new THREE.SphereGeometry(0.012, 10, 6).scale(1, 0.3, 0.6).translate(0.014, 0, 0), '#86a4ff', { wash: 0.7, width: 0.6, hatch: 0.5 });
    p.rotation.y = (k / 6) * Math.PI * 2; flower.add(p);
  }
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.009, 12, 8), glow('#c3dc3b', { gain: 1.5, alpha: 1, rim: 0.3 }));
  flower.add(core); flower.scale.setScalar(0.001); g.add(flower);
  const seed = inked(new THREE.SphereGeometry(0.008, 10, 8).scale(1.3, 0.8, 1), '#c9a36b', { wash: 0.7, width: 0.6 });
  seed.position.y = 0.004; g.add(seed);
  return { g, stem, leaves, flower, seed };
}

export function createPlant(ctx) {
  const L = ctx.lesson;
  const group = new THREE.Group();
  const anim = animator();
  const plants = {};
  for (const it of L.items) {
    const p = tappable(pot(), 'pot'); p.scale.setScalar(1.55); p.position.copy(mm(POTS[it.id], POT_Y)); group.add(p);
    const s = sprout(it.id === 'water' ? '#d6e59a' : '#6ee05a');
    s.g.position.y = 0.068; p.add(s.g);
    plants[it.id] = { pot: p, ...s, h: 0 };
  }
  // солнце над горшком B
  const sun = new THREE.Group();
  sun.add(new THREE.Mesh(new THREE.SphereGeometry(0.028, 24, 16), glow('#ffe14d', { gain: 2.4, alpha: 1, rim: 0.35 })));
  const rayMat = glow('#ffe14d', { gain: 2, alpha: 0.7, rim: 0, additive: true });
  for (let k = 0; k < 10; k++) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.0035, 0.0035).translate(0.046, 0, 0), rayMat);
    r.rotation.z = (k / 10) * Math.PI * 2; sun.add(r);
  }
  sun.position.copy(mm(POTS.both, POT_Y - 4, 0.42));
  sun.traverse((o) => { o.raycast = () => {}; });
  group.add(sun);

  const drops = sparks(group, '#00c4fa', 24, 0.005);
  let day = 0;

  const dayOf = () => ctx.progress.stepsDone(ctx.i);

  function setHeights(d, k = 1) {
    for (const it of L.items) {
      const p = plants[it.id], to = GROW[it.id][d], from = p.h;
      const h = from + (to - from) * k;
      p.stem.scale.y = Math.max(0.001, h * 0.17);
      p.seed.visible = h < 0.12;
      p.leaves.forEach((l, i) => {
        const at = (i + 1) * 0.2, grown = Math.max(0, Math.min(1, (h - at + 0.12) / 0.2));
        l.scale.setScalar(Math.max(0.001, grown * (it.id === 'water' ? 0.6 : 1)));
        l.position.y = Math.min(h, at) * 0.17;
      });
      const f = it.id === 'both' ? Math.max(0, (h - 0.82) / 0.18) : 0;
      p.flower.scale.setScalar(Math.max(0.001, f));
      p.flower.position.y = h * 0.17 + 0.004;
      if (k >= 1) p.h = to;
    }
  }

  function nextDay() {
    if (anim.busy) return;
    if (day >= L.steps) { // посмотреть ещё раз
      for (const p of Object.values(plants)) p.h = 0;
      day = 0; setHeights(0); ctx.repaintRight(); return;
    }
    day++;
    ctx.sfx('grow');
    for (const id of ['water', 'both']) for (let n = 0; n < 6; n++) {
      drops.emit(plants[id].pot.position.clone().add(new THREE.Vector3(0, 0.22 + Math.random() * 0.06, 0)), new THREE.Vector3(0, -0.25, 0), 0.05, 0.75);
    }
    anim.tween(0.9, (k) => setHeights(day, ease.out(k)));
    ctx.tested('step' + day, false);
    if (day === L.steps) ctx.say(L.sentence(L.items[1]));
    else ctx.say(`Day ${['one', 'two', 'three', 'four', 'five'][day - 1]}.`);
    ctx.repaintRight();
  }

  return {
    group,
    buttons() {
      return [{ id: 'next', label: day >= L.steps ? 'Watch again ↺' : `Next day →   ${day} / ${L.steps}`, x: 45, y: 118, w: 60, h: 10, on: day < L.steps }];
    },
    print(P) {
      const labels = { water: ['A', 'water'], both: ['B', 'water + sun'], none: ['C', 'nothing'] };
      for (const it of L.items) {
        const [a, t] = labels[it.id];
        P.text(a, POTS[it.id], POT_Y + 15, { size: 5, weight: 800, color: '#2e44d1', align: 'center' });
        P.text(t, POTS[it.id], POT_Y + 20, { size: 3.2, weight: 600, color: '#585b62', align: 'center' });
      }
    },
    button(id) { if (id === 'next') { if (ctx.needPredict()) return; nextDay(); } },
    tap() { if (ctx.needPredict()) return; nextDay(); },
    sync() {
      day = dayOf();
      for (const p of Object.values(plants)) p.h = 0;
      setHeights(day);
    },
    update(dt, t) {
      anim.update(dt);
      drops.update(dt, { gravity: -0.4 });
      sun.rotation.z = t * 0.3;
      sun.children[0].material.uniforms.uGain.value = 2.2 + Math.sin(t * 2) * 0.3;
    },
  };
}
