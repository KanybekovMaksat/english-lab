// Опыт 9: электрическая цепь. Батарейка, провода и лампочка; спереди в цепи разрыв.
// Предмет встаёт в разрыв: металл замыкает цепь — по проводу бегут лаймовые точки тока, лампочка загорается.
import * as THREE from 'three';
import { inked, glow, INK } from '../ink.js';
import { mm } from '../book.js';
import { animator, arc, tappable, ease } from './kit.js';

const BAT = [34, 50], BULB = [116, 46], GAP = [75, 90];
const HOME = { key: [24, 112], string: [58, 114], spoon: [92, 112], straw: [124, 113] };
const WIRE_H = 0.012;

function battery() {
  const g = new THREE.Group();
  const body = inked(new THREE.CylinderGeometry(0.036, 0.036, 0.15, 28).rotateZ(Math.PI / 2), '#246fff', { wash: 0.6 });
  const cap = inked(new THREE.CylinderGeometry(0.037, 0.037, 0.04, 28).rotateZ(Math.PI / 2).translate(0.055, 0, 0), '#c3dc3b', { wash: 0.75, hatch: 0.4 });
  const nub = inked(new THREE.CylinderGeometry(0.012, 0.012, 0.012, 16).rotateZ(Math.PI / 2).translate(0.081, 0, 0), '#abaeb6', { wash: 0.4, width: 0.6 });
  g.add(body, cap, nub); g.position.y = 0.036; return g;
}

function bulb() {
  const g = new THREE.Group();
  const base = inked(new THREE.CylinderGeometry(0.026, 0.03, 0.04, 20).translate(0, 0.02, 0), '#abaeb6', { outline: 'edges', wash: 0.4 });
  const glass = new THREE.Mesh(new THREE.SphereGeometry(0.05, 28, 20).translate(0, 0.085, 0), new THREE.MeshBasicMaterial({ color: '#f4f7ff', transparent: true, opacity: 0.35, depthWrite: false }));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.0018, 6, 48).translate(0, 0.085, 0), new THREE.MeshBasicMaterial({ color: INK }));
  const fil = new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.0018, 6, 20, Math.PI).translate(0, 0.08, 0), glow('#ffd34d', { gain: 0.5, alpha: 1, rim: 0 }));
  const halo = new THREE.Mesh(new THREE.SphereGeometry(0.048, 24, 16).translate(0, 0.085, 0), glow('#ffd34d', { gain: 2.6, alpha: 0, rim: 0.4, additive: true }));
  g.add(base, glass, ring, fil, halo);
  g.userData = { fil, halo };
  return g;
}

// предметы для разрыва
function key() {
  const g = new THREE.Group();
  g.add(inked(new THREE.TorusGeometry(0.018, 0.006, 8, 24).rotateX(Math.PI / 2).translate(-0.03, 0, 0), '#f5b800', { wash: 0.6, width: 0.7 }));
  g.add(inked(new THREE.BoxGeometry(0.06, 0.008, 0.01).translate(0.018, 0, 0), '#f5b800', { outline: 'edges', wash: 0.6 }));
  g.add(inked(new THREE.BoxGeometry(0.008, 0.008, 0.016).translate(0.04, 0, 0.01), '#f5b800', { outline: 'edges', wash: 0.6 }));
  return g;
}
function stringItem() {
  const pts = []; for (let i = 0; i <= 20; i++) pts.push(new THREE.Vector3(-0.045 + i * 0.0045, 0, Math.sin(i * 0.9) * 0.008));
  return inked(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.0028, 6), '#eb514f', { wash: 0.6, width: 0.6 });
}
function spoon() {
  const g = new THREE.Group();
  g.add(inked(new THREE.CylinderGeometry(0.004, 0.005, 0.07, 8).rotateZ(Math.PI / 2).translate(0.02, 0, 0), '#abaeb6', { wash: 0.4, width: 0.6 }));
  g.add(inked(new THREE.SphereGeometry(0.015, 14, 8).scale(1.4, 0.35, 1).translate(-0.03, 0, 0), '#abaeb6', { wash: 0.4, width: 0.6 }));
  return g;
}
function straw() {
  return inked(new THREE.CylinderGeometry(0.006, 0.006, 0.09, 12).rotateZ(Math.PI / 2), '#86a4ff', { outline: 'both', wash: 0.7 });
}

export function createCircuit(ctx) {
  const L = ctx.lesson;
  const group = new THREE.Group();
  const anim = animator();

  const bat = battery(); bat.scale.setScalar(1.6); bat.position.y *= 1.6; bat.position.add(mm(...BAT)); group.add(bat);
  const b = bulb(); b.scale.setScalar(2); b.position.copy(mm(...BULB)); group.add(b);

  // провод: плюс батарейки → лампочка → разрыв (правая клемма) … (левая клемма) → минус батарейки
  const P = (x, y, h = WIRE_H) => mm(x, y, h);
  const path = new THREE.CatmullRomCurve3([
    P(BAT[0] + 14, BAT[1], 0.058), P(BAT[0] + 24, BAT[1] - 14), P(BULB[0] - 18, BULB[1] - 14), P(BULB[0], BULB[1] + 2, 0.02),
    P(BULB[0] + 6, BULB[1] + 18), P(GAP[0] + 26, GAP[1] + 2), P(GAP[0] + 7, GAP[1]),
  ], false, 'catmullrom', 0.3);
  const back = new THREE.CatmullRomCurve3([
    P(GAP[0] - 7, GAP[1]), P(GAP[0] - 28, GAP[1] + 2), P(BAT[0] - 18, BAT[1] + 18), P(BAT[0] - 13, BAT[1], 0.058),
  ], false, 'catmullrom', 0.3);
  const wireMat = () => inked(new THREE.TubeGeometry(path, 120, 0.004, 6), '#eb514f', { wash: 0.6, width: 0.6, shadow: false });
  group.add(wireMat());
  group.add(inked(new THREE.TubeGeometry(back, 80, 0.004, 6), '#15217e', { wash: 0.6, width: 0.6, shadow: false }));
  for (const x of [GAP[0] - 7, GAP[0] + 7]) {
    const clip = inked(new THREE.BoxGeometry(0.014, 0.012, 0.02).translate(0, 0.006, 0), '#abaeb6', { outline: 'edges', wash: 0.4 });
    clip.position.copy(P(x, GAP[1], 0)); group.add(clip);
  }

  // ток: лаймовые точки бегут по всей петле
  const loop = [...path.getSpacedPoints(80), ...back.getSpacedPoints(50)];
  const dots = [];
  const dotMat = glow('#c3dc3b', { gain: 2.6, alpha: 0, rim: 0.2 });
  for (let i = 0; i < 26; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.0055, 8, 6), dotMat); d.raycast = () => {}; group.add(d); dots.push(d); }

  const make = { key, string: stringItem, spoon, straw };
  const things = {};
  for (const it of L.items) {
    const o = tappable(make[it.id](), it.id);
    o.scale.setScalar(1.8);
    o.userData.home = P(...HOME[it.id], 0.01);
    o.position.copy(o.userData.home);
    group.add(o); things[it.id] = o;
  }
  let inGap = null, power = 0, powerTo = 0, busy = false;
  const gapAt = P(GAP[0], GAP[1], 0.016);

  function place(id) {
    if (busy) return;
    busy = true; ctx.sfx('tap');
    const it = L.items.find((x) => x.id === id), o = things[id];
    const out = inGap && inGap !== id ? things[inGap] : null;
    if (out) { const a = out.position.clone(); anim.tween(0.4, (k) => { out.position.lerpVectors(a, out.userData.home, ease.inOut(k)); }); }
    powerTo = 0;
    const a = o.position.clone();
    anim.tween(0.55, (k) => arc(o, a, gapAt, 0.08, ease.inOut(k)), () => {
      inGap = id;
      if (it.yes) { powerTo = 1; ctx.sfx('hum'); } else ctx.sfx('nope');
      anim.tween(0.7, () => {}, () => { busy = false; ctx.tested(id); });
    });
  }

  return {
    group,
    tap(id) {
      if (!things[id]) return;
      if (inGap === id) { ctx.say(L.sentence(L.items.find((x) => x.id === id))); return; }
      place(id);
    },
    sync() {
      for (const it of L.items) things[it.id].position.copy(things[it.id].userData.home);
      inGap = null; power = powerTo = 0;
    },
    print(Pn) { Pn.text('gap', GAP[0], GAP[1] + 9, { size: 3.2, weight: 700, color: '#2e44d1', align: 'center' }); },
    update(dt, t) {
      anim.update(dt);
      power += (powerTo - power) * (1 - Math.exp(-dt * 6));
      dotMat.uniforms.uAlpha.value = power;
      dots.forEach((d, i) => {
        const u = ((t * 0.18 + i / dots.length) % 1) * (loop.length - 1);
        const k = Math.floor(u), f = u - k;
        d.position.lerpVectors(loop[k], loop[Math.min(loop.length - 1, k + 1)], f);
        d.visible = power > 0.02;
      });
      b.userData.fil.material.uniforms.uGain.value = 0.5 + power * 3.2;
      b.userData.halo.material.uniforms.uAlpha.value = power * 0.55 * (0.92 + Math.sin(t * 20) * 0.04);
    },
  };
}
