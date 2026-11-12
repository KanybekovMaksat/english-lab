// Опыт 1: плавает или тонет. Аквариум со светящейся водой, четыре предмета в переднем ряду.
import * as THREE from 'three';
import { inked, glow, INK } from '../ink.js';
import { mm } from '../book.js';
import { animator, arc, sparks, tappable, ease } from './kit.js';

const TANK = { x: 75, y: 56, w: 112, d: 52, h: 0.3, water: 0.2 };
const SLOTS = { apple: 36, coin: 60, ball: 88, stone: 114 };
const HOME = { apple: [26, 106], coin: [58, 108], ball: [92, 106], stone: [124, 107] };

function apple() {
  const g = new THREE.Group();
  const body = inked(new THREE.SphereGeometry(0.06, 28, 20).scale(1, 0.9, 1), '#eb514f', { wash: 0.55 });
  g.add(body);
  const stem = inked(new THREE.CylinderGeometry(0.004, 0.005, 0.03, 6), '#8a6a3a', { outline: 'none', wash: 0.6 });
  stem.position.y = 0.062; stem.rotation.z = 0.2; g.add(stem);
  const leaf = inked(new THREE.SphereGeometry(0.018, 12, 8).scale(1, 0.25, 0.55), '#6ee05a', { wash: 0.6 });
  leaf.position.set(0.016, 0.07, 0); leaf.rotation.z = -0.5; g.add(leaf);
  g.userData.r = 0.054; return g;
}
function coin() {
  const g = inked(new THREE.CylinderGeometry(0.04, 0.04, 0.009, 32), '#f5b800', { outline: 'both', wash: 0.6 });
  g.rotation.x = 0.25; g.userData.r = 0.01; return g;
}
function ball() {
  const g = new THREE.Group();
  g.add(inked(new THREE.SphereGeometry(0.05, 28, 20), '#246fff', { wash: 0.5 }));
  const band = inked(new THREE.TorusGeometry(0.05, 0.006, 8, 40), '#c3dc3b', { outline: 'none', wash: 0.8, hatch: 0 });
  band.rotation.x = Math.PI / 2 - 0.4; g.add(band);
  g.userData.r = 0.05; return g;
}
function stone() {
  const geo = new THREE.DodecahedronGeometry(0.045, 1);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const k = 1 + Math.sin(p.getX(i) * 90 + p.getZ(i) * 50) * 0.08; p.setXYZ(i, p.getX(i) * k * 1.2, p.getY(i) * k * 0.75, p.getZ(i) * k); }
  geo.computeVertexNormals();
  const g = inked(geo, '#8a8d95', { wash: 0.5 }); g.userData.r = 0.034; return g;
}

export function createFloat(ctx) {
  const L = ctx.lesson;
  const group = new THREE.Group();
  const anim = animator();

  // аквариум: стеклянные стенки контуром, вода — светящийся объём
  const tank = new THREE.Group();
  tank.position.copy(mm(TANK.x, TANK.y));
  const tw = TANK.w * 0.01, td = TANK.d * 0.01;
  const glassGeo = new THREE.BoxGeometry(tw, TANK.h, td).translate(0, TANK.h / 2, 0);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(glassGeo), new THREE.LineBasicMaterial({ color: INK, transparent: true }));
  const glass = new THREE.Mesh(glassGeo, new THREE.MeshBasicMaterial({ color: '#e5edff', transparent: true, opacity: 0.18, depthWrite: false }));
  const water = new THREE.Mesh(new THREE.BoxGeometry(tw - 0.006, TANK.water, td - 0.006).translate(0, TANK.water / 2 + 0.002, 0), glow('#00c4fa', { gain: 1.25, alpha: 0.24, rim: 0.9 }));
  const surface = new THREE.Mesh(new THREE.PlaneGeometry(tw - 0.006, td - 0.006).rotateX(-Math.PI / 2).translate(0, TANK.water + 0.002, 0), glow('#00c4fa', { gain: 2.3, alpha: 0.55, rim: 0 }));
  water.renderOrder = 2; surface.renderOrder = 3; glass.renderOrder = 4;
  [water, surface, glass].forEach((m) => { m.raycast = () => {}; });
  tank.add(water, surface, glass, edges);
  group.add(tank);

  const bubbles = sparks(group, '#7fe3ff', 28, 0.005);
  const things = { apple: apple(), coin: coin(), ball: ball(), stone: stone() };
  const state = {};
  for (const it of L.items) {
    const o = things[it.id];
    o.scale.multiplyScalar(1.9); o.userData.r *= 1.9;
    tappable(o, it.id);
    const [x, y] = HOME[it.id];
    o.userData.home = mm(x, y, o.userData.r + 0.002);
    o.position.copy(o.userData.home);
    group.add(o);
    state[it.id] = { inside: false, bob: Math.random() * 6 };
  }

  const target = (id) => {
    const it = L.items.find((x) => x.id === id), o = things[id], r = o.userData.r;
    const base = mm(SLOTS[id], TANK.y + 4);
    base.y += it.yes ? TANK.water - r * 0.35 : r + 0.006;
    return base;
  };

  function drop(id) {
    const o = things[id], it = L.items.find((x) => x.id === id), st = state[id];
    const a = o.position.clone(), top = mm(SLOTS[id], TANK.y + 4, TANK.water + 0.02), end = target(id);
    st.busy = true;
    ctx.sfx('tap');
    anim.tween(0.55, (k) => arc(o, a, top, 0.18, ease.inOut(k)), () => {
      ctx.sfx('plop');
      for (let n = 0; n < 12; n++) bubbles.emit(top.clone(), new THREE.Vector3(0, 0.12, 0), 0.04, 0.6);
      const b = o.position.clone();
      anim.tween(it.yes ? 0.6 : 1.4, (k) => o.position.lerpVectors(b, end, it.yes ? ease.back(k) : ease.out(k)), () => {
        if (!it.yes) ctx.sfx('sink');
        st.inside = true; st.busy = false;
        ctx.tested(id);
      });
    });
  }

  return {
    group,
    tap(id) {
      if (ctx.needPredict()) return;
      const st = state[id];
      if (!st || st.busy) return;
      if (st.inside) { ctx.say(L.sentence(L.items.find((x) => x.id === id))); return; }
      drop(id);
    },
    // вернуться на страницу: то, что уже проверено, лежит в воде
    sync() {
      for (const it of L.items) {
        const done = ctx.progress.lesson(ctx.i).tested.includes(it.id), o = things[it.id];
        state[it.id].inside = done;
        o.position.copy(done ? target(it.id) : o.userData.home);
      }
    },
    update(dt, t) {
      anim.update(dt);
      bubbles.update(dt, { ceil: tank.position.y + TANK.water });
      for (const it of L.items) {
        const st = state[it.id], o = things[it.id];
        if (!st.inside || st.busy) continue;
        if (it.yes) { o.position.y = target(it.id).y + Math.sin(t * 2.2 + st.bob) * 0.004; o.rotation.z = Math.sin(t * 1.7 + st.bob) * 0.08; }
        else if (Math.random() < dt * 1.2) bubbles.emit(o.position.clone(), new THREE.Vector3(0, 0.08, 0), 0.01, 1.4);
      }
    },
  };
}
