// Опыт 2: магнит. Подкова стоит на странице, поле — светящиеся лаймовые дуги между полюсами.
import * as THREE from 'three';
import { inked, glow } from '../ink.js';
import { mm } from '../book.js';
import { animator, arc, tappable, shake, ease } from './kit.js';

const MAG = [75, 54];
const HOME = { clip: [26, 104], pencil: [58, 106], nail: [92, 105], eraser: [122, 104] };
const STICK = { clip: [-0.1, 0.065], nail: [0.1, 0.065] };

function horseshoe() {
  const g = new THREE.Group();
  const R = 0.07, t = 0.022;
  const bend = inked(new THREE.TorusGeometry(R, t, 14, 40, Math.PI), '#eb514f', { wash: 0.6 });
  bend.position.y = 0.17; g.add(bend);
  for (const s of [-1, 1]) {
    const leg = inked(new THREE.CylinderGeometry(t, t, 0.1, 18), '#eb514f', { wash: 0.6 });
    leg.position.set(s * R, 0.12, 0); g.add(leg);
    const tip = inked(new THREE.CylinderGeometry(t, t, 0.05, 18), '#e1e4ed', { wash: 0.5 });
    tip.position.set(s * R, 0.045, 0); g.add(tip);
  }
  return g;
}
function clip() {
  const pts = [[0, 0], [0.05, 0], [0.05, 0.022], [0.006, 0.022], [0.006, 0.006], [0.042, 0.006], [0.042, 0.016]].map(([x, z]) => new THREE.Vector3(x - 0.025, 0, z - 0.011));
  const path = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.1);
  const g = inked(new THREE.TubeGeometry(path, 64, 0.0028, 6), '#abaeb6', { wash: 0.4, width: 0.6 });
  g.userData.r = 0.004; return g;
}
function pencil() {
  const g = new THREE.Group();
  const body = inked(new THREE.CylinderGeometry(0.008, 0.008, 0.1, 6), '#ffe14d', { outline: 'both', wash: 0.65 });
  body.rotation.z = Math.PI / 2; g.add(body);
  const tip = inked(new THREE.ConeGeometry(0.008, 0.022, 6), '#e8c99a', { wash: 0.6 });
  tip.rotation.z = -Math.PI / 2; tip.position.x = 0.061; g.add(tip);
  const rub = inked(new THREE.CylinderGeometry(0.008, 0.008, 0.014, 12), '#e3a9b8', { wash: 0.7 });
  rub.rotation.z = Math.PI / 2; rub.position.x = -0.057; g.add(rub);
  g.rotation.y = 0.5; g.userData.r = 0.008; return g;
}
function nail() {
  const g = new THREE.Group();
  const shaft = inked(new THREE.CylinderGeometry(0.0035, 0.0035, 0.07, 10), '#8a8d95', { wash: 0.4, width: 0.7 });
  shaft.rotation.z = Math.PI / 2; g.add(shaft);
  const head = inked(new THREE.CylinderGeometry(0.009, 0.009, 0.003, 18), '#8a8d95', { wash: 0.4, width: 0.7 });
  head.rotation.z = Math.PI / 2; head.position.x = -0.036; g.add(head);
  const pt = inked(new THREE.ConeGeometry(0.0035, 0.012, 10), '#8a8d95', { wash: 0.4, width: 0.7 });
  pt.rotation.z = -Math.PI / 2; pt.position.x = 0.041; g.add(pt);
  g.rotation.y = -0.4; g.userData.r = 0.009; return g;
}
function eraser() {
  const g = inked(new THREE.BoxGeometry(0.05, 0.018, 0.03), '#e3a9b8', { outline: 'edges', wash: 0.7 });
  g.rotation.y = 0.3; g.userData.r = 0.009; return g;
}

export function createMagnet(ctx) {
  const L = ctx.lesson;
  const group = new THREE.Group();
  const anim = animator();
  const magnet = horseshoe();
  magnet.scale.setScalar(1.45);
  magnet.position.copy(mm(MAG[0], MAG[1]));
  group.add(magnet);

  // силовые линии: дуги от полюса к полюсу под магнитом, светятся и пульсируют
  const field = new THREE.Group();
  const fieldMat = glow('#c3dc3b', { gain: 1.8, alpha: 0.75, rim: 0.2, additive: true });
  for (let k = 0; k < 5; k++) {
    const r = 0.03 + k * 0.022;
    const curve = new THREE.EllipseCurve(0, 0, 0.07 + k * 0.012, r, Math.PI, 2 * Math.PI);
    const pts = curve.getPoints(40).map((p) => new THREE.Vector3(p.x, 0.022 + p.y * 0.35 + r * 0.35, -p.y * 0.6));
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.0016, 5), fieldMat);
    tube.raycast = () => {};
    field.add(tube);
  }
  magnet.add(field);

  const things = { clip: clip(), pencil: pencil(), nail: nail(), eraser: eraser() };
  const state = {};
  for (const it of L.items) {
    const o = things[it.id];
    o.scale.multiplyScalar(1.9); o.userData.r *= 1.9;
    tappable(o, it.id);
    o.userData.home = mm(...HOME[it.id], o.userData.r + 0.002);
    o.userData.rot = o.rotation.clone();
    o.position.copy(o.userData.home);
    group.add(o);
    state[it.id] = {};
  }
  let pulse = 0;

  const stuckAt = (id) => {
    const [dx, h] = STICK[id];
    return magnet.position.clone().add(new THREE.Vector3(dx, h, 0.042));
  };

  function test(id) {
    const o = things[id], it = L.items.find((x) => x.id === id), st = state[id];
    st.busy = true; ctx.sfx('tap'); pulse = 1;
    const a = o.position.clone();
    if (it.yes) {
      const b = stuckAt(id);
      anim.tween(0.5, (k) => { arc(o, a, b, 0.05, ease.inOut(k)); o.rotation.y = o.userData.rot.y * (1 - k); o.rotation.z = (Math.PI / 2) * ease.out(k) * (id === 'clip' ? 0 : 1); }, () => {
        ctx.sfx('clink'); st.stuck = true; st.busy = false; ctx.tested(id);
      });
    } else {
      const toward = a.clone().lerp(magnet.position.clone().setY(a.y), 0.2);
      anim.tween(0.35, (k) => o.position.lerpVectors(a, toward, ease.out(k)), () => {
        ctx.sfx('nope');
        anim.tween(0.5, (k) => { o.position.lerpVectors(toward, a, ease.inOut(k)); shake(o, k, o.position.clone()); }, () => { st.busy = false; ctx.tested(id); });
      });
    }
  }

  return {
    group,
    tap(id) {
      if (ctx.needPredict()) return;
      const st = state[id];
      if (!st || st.busy) return;
      if (ctx.progress.lesson(ctx.i).tested.includes(id) && !(L.items.find((x) => x.id === id).yes && !st.stuck)) {
        ctx.say(L.sentence(L.items.find((x) => x.id === id))); return;
      }
      test(id);
    },
    sync() {
      for (const it of L.items) {
        const o = things[it.id], done = ctx.progress.lesson(ctx.i).tested.includes(it.id);
        state[it.id].stuck = done && it.yes;
        o.rotation.copy(o.userData.rot);
        if (state[it.id].stuck) { o.position.copy(stuckAt(it.id)); o.rotation.y = 0; o.rotation.z = it.id === 'clip' ? 0 : Math.PI / 2; }
        else o.position.copy(o.userData.home);
      }
    },
    update(dt, t) {
      anim.update(dt);
      pulse = Math.max(0, pulse - dt * 0.8);
      fieldMat.uniforms.uGain.value = 1.3 + Math.sin(t * 3) * 0.35 + pulse * 2.2;
      field.children.forEach((c, k) => { c.scale.setScalar(1 + Math.sin(t * 2 - k * 0.7) * 0.03); });
    },
  };
}
