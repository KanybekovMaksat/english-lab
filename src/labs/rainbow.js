// Опыт 3: призма. Фонарик светит белым лучом в призму, на карточке впереди раскрывается радуга.
import * as THREE from 'three';
import { inked, glow } from '../ink.js';
import { mm, PAGE_Y as PAGE_Y_ } from '../book.js';
import { animator, tappable, ease } from './kit.js';

const TORCH = [22, 46], PRISM = [60, 56];
const CARD = { x: 84, y: 104, w: 110, d: 20 };
const BEAM_H = 0.05;

function torch() {
  const g = new THREE.Group();
  const body = inked(new THREE.CylinderGeometry(0.018, 0.018, 0.09, 20), '#246fff', { wash: 0.55 });
  body.rotation.z = Math.PI / 2; g.add(body);
  const head = inked(new THREE.CylinderGeometry(0.027, 0.018, 0.03, 20), '#246fff', { wash: 0.45 });
  head.rotation.z = -Math.PI / 2; head.position.x = 0.06; g.add(head);
  const btn = inked(new THREE.BoxGeometry(0.016, 0.008, 0.012), '#c3dc3b', { outline: 'edges', wash: 0.8, hatch: 0 });
  btn.position.set(-0.005, 0.02, 0); g.add(btn);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.022, 24), glow('#ffffff', { gain: 0.4, alpha: 0.9, rim: 0 }));
  lens.rotation.y = Math.PI / 2; lens.position.x = 0.0755; g.add(lens);
  g.userData.lens = lens;
  return g;
}

function beam(a, b, color, w = 0.004) {
  const dir = b.clone().sub(a), len = dir.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(w, w, len, 8, 1, true), glow(color, { gain: 2.4, alpha: 0.85, rim: 0.4, additive: true }));
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  m.raycast = () => {};
  m.userData.len = len; m.userData.a = a.clone(); m.userData.b = b.clone();
  return m;
}

export function createRainbow(ctx) {
  const L = ctx.lesson;
  const group = new THREE.Group();
  const anim = animator();

  const t = torch();
  t.scale.setScalar(1.6);
  t.position.copy(mm(...TORCH, 0.036));
  const aim = mm(...PRISM, BEAM_H).sub(t.position);
  t.rotation.y = -Math.atan2(aim.z, aim.x);
  tappable(t, 'torch');
  group.add(t);

  const prism = inked(new THREE.CylinderGeometry(0.04, 0.04, 0.085, 3), '#e5edff', { outline: 'edges', wash: 0.5, edgeAngle: 20 });
  prism.userData.body.material.uniforms.uAlpha.value = 0.75;
  prism.scale.setScalar(1.5);
  prism.position.copy(mm(...PRISM, 0.064));
  prism.rotation.y = 0.35;
  tappable(prism, 'torch');
  group.add(prism);

  const card = inked(new THREE.BoxGeometry(CARD.w * 0.01, 0.006, CARD.d * 0.01), '#ffffff', { outline: 'edges', wash: 0, hatch: 0.4 });
  card.position.copy(mm(CARD.x, CARD.y, 0.003));
  group.add(card);

  const from = mm(...TORCH, 0.022).add(new THREE.Vector3(Math.cos(-t.rotation.y) * 0.122, 0, Math.sin(-t.rotation.y) * 0.122));
  from.y = PAGE_Y_ + 0.036;
  const into = mm(...PRISM, BEAM_H);
  const white = beam(from, into, '#ffffff', 0.006);
  group.add(white);

  const n = L.items.length, sw = (CARD.w - 10) / n;
  const stripes = [], rays = [];
  const out = into.clone().add(new THREE.Vector3(0.008, -0.004, 0.025));
  L.items.forEach((it, k) => {
    const x = CARD.x - CARD.w / 2 + 5 + sw * (k + 0.5);
    const s = new THREE.Mesh(new THREE.BoxGeometry(sw * 0.01 * 0.86, 0.004, CARD.d * 0.01 * 0.7), glow(it.hex, { gain: 1.6, alpha: 0.95, rim: 0 }));
    s.position.copy(mm(x, CARD.y, 0.0075));
    s.userData.tap = it.id;
    group.add(s); stripes.push(s);
    const r = beam(out, mm(x, CARD.y - 4, 0.008), it.hex, 0.0032);
    group.add(r); rays.push(r);
  });

  let on = false, power = 0;
  const setPower = (k) => {
    power = k;
    white.visible = k > 0.01;
    white.scale.y = Math.min(1, k * 2);
    white.position.lerpVectors(from, into, Math.min(1, k * 2) * 0.5);
    t.userData.lens.material.uniforms.uGain.value = 0.4 + k * 2.4;
    rays.forEach((r, i) => {
      const kk = Math.max(0, Math.min(1, (k - 0.5) * 2.6 - i * 0.04));
      r.visible = kk > 0.01;
      r.scale.y = Math.max(0.001, kk);
      r.position.lerpVectors(r.userData.a, r.userData.b, kk * 0.5);
    });
    stripes.forEach((s, i) => { s.visible = k > 0.7; s.material.uniforms.uGain.value = 0.6 + Math.max(0, (k - 0.7) / 0.3) * 1.2; });
  };
  setPower(0);

  const switchOn = () => {
    on = true; ctx.sfx('zap'); ctx.say('Light!');
    anim.tween(1.3, (k) => setPower(ease.inOut(k)), () => { ctx.labState.torch = true; });
  };

  return {
    group,
    isOn: () => on && power > 0.9,
    tap(id) {
      if (ctx.needPredict()) return;
      if (id === 'torch') { if (!on) switchOn(); else ctx.say('White light goes into the prism.'); return; }
      if (!on || power < 0.9) { ctx.say('Tap the torch first!'); ctx.sfx('nope'); return; }
      const it = L.items.find((x) => x.id === id);
      const s = stripes[L.items.indexOf(it)];
      anim.tween(0.4, (k) => { s.scale.y = 1 + Math.sin(k * Math.PI) * 3; });
      ctx.sfx('tap');
      ctx.tested(id, true);
    },
    sync() {
      const any = ctx.progress.lesson(ctx.i).tested.length > 0;
      on = any; setPower(any ? 1 : 0);
    },
    update(dt, time) {
      anim.update(dt);
      if (on && power >= 1) rays.forEach((r, i) => { r.material.uniforms.uGain.value = 2.1 + Math.sin(time * 3 + i) * 0.3; });
    },
  };
}
