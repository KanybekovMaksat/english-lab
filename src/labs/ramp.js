// Опыт 5: горка. Три высоты, машинка AiCo-синего цвета, светящийся след скорости, флажки там, где она остановилась.
import * as THREE from 'three';
import { inked, glow } from '../ink.js';
import { mm } from '../book.js';
import { animator, sparks, tappable, ease } from './kit.js';

const BOTTOM = 80, LANE = 78, LEN = 0.66;
const ANGLE = [0.17, 0.34, 0.56];
const STOP = [16, 36, 60]; // мм после низа горки
const LABEL = ['low', 'middle', 'high'];

function car() {
  const g = new THREE.Group();
  const body = inked(new THREE.BoxGeometry(0.044, 0.014, 0.026), '#246fff', { outline: 'edges', wash: 0.6 });
  body.position.y = 0.016; g.add(body);
  const cab = inked(new THREE.BoxGeometry(0.022, 0.012, 0.022), '#c3dc3b', { outline: 'edges', wash: 0.7, hatch: 0.5 });
  cab.position.set(-0.004, 0.029, 0); g.add(cab);
  const wheels = [];
  for (const x of [-0.014, 0.014]) for (const z of [-0.014, 0.014]) {
    const w = inked(new THREE.CylinderGeometry(0.008, 0.008, 0.006, 14), '#33353c', { outline: 'edges', wash: 0.8 });
    w.rotation.x = Math.PI / 2; w.position.set(x, 0.008, z); g.add(w); wheels.push(w);
  }
  g.userData.wheels = wheels;
  return g;
}

function flag() {
  const g = new THREE.Group();
  const pole = inked(new THREE.CylinderGeometry(0.0018, 0.0018, 0.06, 6).translate(0, 0.03, 0), '#585b62', { outline: 'none', wash: 0.6 });
  const clothGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.06, 0), new THREE.Vector3(0, 0.044, 0), new THREE.Vector3(0.024, 0.052, 0)]);
  clothGeo.computeVertexNormals();
  const cloth = new THREE.Mesh(clothGeo, glow('#c3dc3b', { gain: 1.2, alpha: 1, rim: 0 }));
  cloth.material.side = THREE.DoubleSide;
  g.add(pole, cloth); g.traverse((o) => { o.raycast = () => {}; });
  return g;
}

export function createRamp(ctx) {
  const L = ctx.lesson;
  const group = new THREE.Group();
  const anim = animator();
  let level = 2, angle = ANGLE[level], running = false;

  const bottom = mm(BOTTOM, LANE);
  const ramp = new THREE.Group(); ramp.position.copy(bottom); group.add(ramp);
  const board = inked(new THREE.BoxGeometry(LEN, 0.008, 0.07).translate(-LEN / 2, 0.004, 0), '#f5d9a8', { outline: 'edges', wash: 0.55 });
  ramp.add(board);
  const support = inked(new THREE.BoxGeometry(0.05, 1, 0.07).translate(0, 0.5, 0), '#e5edff', { outline: 'edges', wash: 0.6 });
  group.add(support);
  const track = inked(new THREE.BoxGeometry((140 - BOTTOM) * 0.01, 0.004, 0.07).translate((140 - BOTTOM) * 0.005, 0.002, 0), '#e5edff', { outline: 'edges', wash: 0.4, hatch: 0 });
  track.position.copy(bottom); group.add(track);

  const c = tappable(car(), 'car'); c.scale.setScalar(1.7); group.add(c);
  const trail = sparks(group, '#c3dc3b', 40, 0.004);
  const flags = ANGLE.map(() => { const f = flag(); f.visible = false; group.add(f); return f; });

  const setAngle = (a) => {
    angle = a;
    ramp.rotation.z = -a;
    const top = Math.sin(a) * LEN;
    support.scale.y = Math.max(0.001, top - 0.004);
    support.position.copy(bottom).add(new THREE.Vector3(-Math.cos(a) * LEN + 0.03, 0, 0));
  };
  // s — путь от верха горки (0…LEN), дальше — по столу
  const place = (s) => {
    if (s <= LEN) {
      const back = LEN - s;
      c.position.copy(bottom).add(new THREE.Vector3(-Math.cos(angle) * back, Math.sin(angle) * back + 0.008, 0));
      c.rotation.z = -angle;
    } else { c.position.copy(bottom).add(new THREE.Vector3(s - LEN, 0.004, 0)); c.rotation.z = 0; }
  };
  setAngle(angle); place(0);

  function go() {
    if (running) return;
    running = true; ctx.sfx('roll');
    const a = 1.6 * Math.sin(angle), tRamp = Math.sqrt((2 * LEN) / a), v0 = a * tRamp;
    const d = STOP[level] * 0.01, dec = (v0 * v0) / (2 * d), tFloor = v0 / dec;
    const total = tRamp + tFloor, lv = level;
    let speed = 0;
    anim.tween(total, (k) => {
      const t = k * total;
      let s;
      if (t <= tRamp) { s = 0.5 * a * t * t; speed = a * t; } else { const u = t - tRamp; s = LEN + v0 * u - 0.5 * dec * u * u; speed = v0 - dec * u; }
      place(Math.min(s, LEN + d));
      c.userData.wheels.forEach((w) => { w.rotation.y += speed * 0.5; });
      if (speed > 0.15 && Math.random() < speed * 0.9) trail.emit(c.position.clone().add(new THREE.Vector3(-0.024, 0.012, 0)), new THREE.Vector3(-0.02, 0.01, 0), 0.02, 0.5 + speed * 0.4);
    }, () => {
      const f = flags[lv]; f.position.copy(c.position).add(new THREE.Vector3(0, 0, -0.045)); f.visible = true;
      anim.tween(0.4, (k) => f.scale.set(1, Math.max(0.01, ease.back(k)), 1));
      running = false;
      ctx.tested(L.items[lv].id);
      ctx.repaintRight();
      anim.tween(0.9, () => {}, () => place(0));
    });
  }

  function pick(lv) {
    if (running || lv === level) return;
    level = lv; ctx.sfx('tap'); ctx.say(LABEL[lv][0].toUpperCase() + LABEL[lv].slice(1) + '.');
    const from = angle, to = ANGLE[lv];
    anim.tween(0.45, (k) => { setAngle(from + (to - from) * ease.out(k)); place(0); });
    ctx.repaintRight();
  }

  return {
    group,
    buttons() {
      const b = LABEL.map((t, k) => ({ id: L.items[k].id, label: t[0].toUpperCase() + t.slice(1), x: 12 + k * 31, y: 118, w: 29, h: 10, on: level === k }));
      b.push({ id: 'go', label: 'Go!', x: 108, y: 118, w: 30, h: 10, on: true, size: 4.4 });
      return b;
    },
    print(P) {
      for (let x = BOTTOM; x <= 140; x += 10) {
        P.line(x, LANE + 6, x, LANE + 8, { color: '#70737a', lw: 0.3 });
        P.text(String((x - BOTTOM) / 10), x, LANE + 11.5, { size: 2.8, weight: 600, mono: true, color: '#8a8d95', align: 'center' });
      }
      P.text('cm', 140, LANE + 15.5, { size: 2.6, mono: true, color: '#8a8d95', align: 'right' });
      ANGLE.forEach((_, k) => {
        if (ctx.progress.lesson(ctx.i).tested.includes(L.items[k].id)) P.text(LABEL[k], BOTTOM + STOP[k], LANE - 8, { size: 3, weight: 700, color: '#566200', align: 'center' });
      });
    },
    button(id) {
      if (ctx.needPredict()) return;
      if (id === 'go') go(); else pick(L.items.findIndex((it) => it.id === id));
    },
    tap() { if (ctx.needPredict()) return; go(); },
    sync() {
      ANGLE.forEach((_, k) => {
        const done = ctx.progress.lesson(ctx.i).tested.includes(L.items[k].id);
        flags[k].visible = done;
        if (done) flags[k].position.copy(bottom).add(new THREE.Vector3(STOP[k] * 0.01 + 0.004, 0.004, -0.045));
      });
    },
    update(dt) { anim.update(dt); trail.update(dt, { gravity: 0.05 }); },
  };
}
