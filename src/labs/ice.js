// Опыт 8: гонка льда. Кубик на металлической и на деревянной тарелке. Нажали — пошло «ускоренное время»:
// по металлу тепло бежит светящимися оранжевыми кольцами, кубик тает быстро; на дереве — медленно.
import * as THREE from 'three';
import { inked, glow } from '../ink.js';
import { mm } from '../book.js';
import { animator, sparks, tappable } from './kit.js';

const PLATE = { metal: [44, 66], wood: [106, 66] };
const MELT = { metal: { dur: 2.6, to: 0.12 }, wood: { dur: 3.4, to: 0.72 } };
const R = 0.17;

function woodTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'); g.fillStyle = '#d9a86c'; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = 'rgba(110,64,20,0.35)'; g.lineWidth = 3;
  for (let r = 10; r < 190; r += 14) { g.beginPath(); g.ellipse(128 + Math.sin(r) * 6, 128, r, r * 0.92, 0, 0, Math.PI * 2); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function createIce(ctx) {
  const L = ctx.lesson;
  const group = new THREE.Group();
  const anim = animator();
  const st = {};

  for (const it of L.items) {
    const p = new THREE.Group(); p.position.copy(mm(...PLATE[it.id]));
    let plate;
    if (it.id === 'metal') plate = inked(new THREE.CylinderGeometry(R, R * 0.92, 0.016, 48).translate(0, 0.008, 0), '#c9ced8', { wash: 0.5 });
    else {
      plate = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 0.92, 0.022, 48).translate(0, 0.011, 0), new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.9 }));
      plate.castShadow = true;
    }
    p.add(plate);
    const cube = inked(new THREE.BoxGeometry(0.1, 0.1, 0.1).translate(0, 0.05, 0), '#d6f3ff', { outline: 'edges', wash: 0.55, hatch: 0.4 });
    cube.position.y = it.id === 'metal' ? 0.016 : 0.022; cube.rotation.y = 0.4;
    const shine = new THREE.Mesh(new THREE.BoxGeometry(0.104, 0.104, 0.104).translate(0, 0.05, 0), glow('#bfefff', { gain: 1.1, alpha: 0.25, rim: 0.9 }));
    shine.raycast = () => {}; cube.add(shine);
    p.add(cube);
    const puddle = new THREE.Mesh(new THREE.CircleGeometry(0.1, 40).rotateX(-Math.PI / 2), glow('#00c4fa', { gain: 1.3, alpha: 0.55, rim: 0 }));
    puddle.position.y = cube.position.y + 0.002; puddle.scale.setScalar(0.001); puddle.raycast = () => {};
    p.add(puddle);
    // тепловые кольца: по металлу бегут к кубику
    const heat = [];
    for (let k = 0; k < 3; k++) {
      const h = new THREE.Mesh(new THREE.TorusGeometry(R * 0.9, 0.004, 6, 60).rotateX(Math.PI / 2), glow('#ff8a3d', { gain: 2.2, alpha: 0, rim: 0.2, additive: true }));
      h.position.y = cube.position.y + 0.003; h.raycast = () => {}; p.add(h); heat.push(h);
    }
    tappable(p, it.id);
    group.add(p);
    st[it.id] = { p, cube, puddle, heat, k: 0, running: false };
  }
  const drops = sparks(group, '#7fe3ff', 16, 0.004);

  function setMelt(id, k) {
    const s = st[id], m = MELT[id], v = 1 - (1 - m.to) * k;
    s.cube.scale.set(v, v * (0.9 + 0.1 * v), v);
    s.puddle.scale.setScalar(Math.max(0.001, 0.25 + k * (id === 'metal' ? 1.15 : 0.55)));
    s.k = k;
  }

  return {
    group,
    tap(id) {
      const s = st[id]; if (!s || s.running) return;
      if (s.k >= 1) { ctx.say(L.sentence(L.items.find((x) => x.id === id))); return; }
      s.running = true; ctx.sfx('tap');
      anim.tween(MELT[id].dur, (k) => {
        setMelt(id, k);
        if (Math.random() < 0.25) drops.emit(s.p.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.06, 0.05, (Math.random() - 0.5) * 0.06)), new THREE.Vector3(0, -0.05, 0), 0.02, 0.6);
      }, () => { s.running = false; ctx.sfx('melt'); ctx.tested(id); });
    },
    sync() { for (const it of L.items) setMelt(it.id, ctx.progress.lesson(ctx.i).tested.includes(it.id) ? 1 : 0); },
    print(P) {
      for (const it of L.items) P.text(it.id === 'metal' ? 'metal' : 'wood', PLATE[it.id][0], PLATE[it.id][1] + 23, { size: 3.6, weight: 700, color: '#2e44d1', align: 'center' });
    },
    update(dt, t) {
      anim.update(dt); drops.update(dt, { gravity: -0.2 });
      for (const it of L.items) {
        const s = st[it.id], speed = it.id === 'metal' ? 1.6 : 0.5;
        s.heat.forEach((h, k) => {
          const ph = ((t * speed + k / 3) % 1);
          h.scale.setScalar(1 - ph * 0.6);
          h.material.uniforms.uAlpha.value = s.running ? Math.sin(ph * Math.PI) * (it.id === 'metal' ? 0.9 : 0.3) : 0;
        });
      }
    },
  };
}
