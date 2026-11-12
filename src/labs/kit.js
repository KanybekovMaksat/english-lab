// Общие детали опытов: анимации по времени, прыжок по дуге, пузырьки-искры, подпись «нельзя».
import * as THREE from 'three';
import { glow } from '../ink.js';

export const ease = {
  out: (k) => 1 - Math.pow(1 - k, 3),
  inOut: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
  back: (k) => { const c = 1.7; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); },
};

// Простой планировщик: tween(dur, fn(k), done). update(dt) двигает все активные.
export function animator() {
  let list = [];
  return {
    tween(dur, fn, done) { const t = { t: 0, dur, fn, done }; list.push(t); fn(0); return t; },
    update(dt) {
      const cur = list; list = [];
      for (const a of cur) {
        a.t = Math.min(1, a.t + dt / a.dur); a.fn(a.t);
        if (a.t >= 1) a.done && a.done(); else list.push(a);
      }
    },
    get busy() { return list.length > 0; },
    clear() { list = []; },
  };
}

// Прыжок предмета по параболе из точки a в точку b.
export function arc(obj, a, b, height, k) {
  obj.position.lerpVectors(a, b, k);
  obj.position.y += Math.sin(Math.PI * k) * height;
}

// Светящиеся частицы (пузырьки, капли, искры): маленькие сферы с glow-материалом.
export function sparks(parent, color, n = 10, r = 0.006) {
  const mat = glow(color, { gain: 2.6, alpha: 0.9, rim: 0.3 });
  const geo = new THREE.SphereGeometry(r, 8, 6);
  const items = [];
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(geo, mat); m.visible = false; m.raycast = () => {};
    parent.add(m); items.push({ m, life: 0, v: new THREE.Vector3() });
  }
  let next = 0;
  return {
    mat,
    emit(at, vel, spread = 0.02, life = 1) {
      const p = items[next++ % n];
      p.m.position.copy(at).add(new THREE.Vector3((Math.random() - 0.5) * spread, 0, (Math.random() - 0.5) * spread));
      p.v.copy(vel).add(new THREE.Vector3((Math.random() - 0.5) * 0.03, Math.random() * 0.02, (Math.random() - 0.5) * 0.03));
      p.life = life; p.max = life; p.m.visible = true;
    },
    update(dt, { gravity = 0, ceil = Infinity } = {}) {
      for (const p of items) {
        if (p.life <= 0) continue;
        p.life -= dt; p.v.y += gravity * dt;
        p.m.position.addScaledVector(p.v, dt);
        if (p.m.position.y > ceil) p.life = 0;
        const s = Math.max(0.01, p.life / p.max);
        p.m.scale.setScalar(0.5 + s * 0.7);
        if (p.life <= 0) p.m.visible = false;
      }
    },
  };
}

// Встряхнуть предмет «нет» — в стороны с затуханием.
export function shake(obj, k, base) {
  obj.position.x = base.x + Math.sin(k * Math.PI * 6) * 0.012 * (1 - k);
}

// Помечаем меш как нажимаемый: id предмета уходит в lab.tap(id).
export function tappable(group, id) {
  group.traverse((o) => { if (o.isMesh) o.userData.tap = id; });
  return group;
}
