// Опыт 7: театр теней. Фонарик у края страницы светит на экран в глубине, между ними — фигурка AiCo.
// Ближе к фонарику — тень больше. Луч светится, тень — тёмный силуэт AiCo на экране.
import * as THREE from 'three';
import { inked, glow } from '../ink.js';
import { mm } from '../book.js';
import { animator, tappable, ease } from './kit.js';

const TORCH = [75, 124], WALL_Y = 30, CX = 75;
const POS = { near: 86, middle: 70, far: 54 };
const ORDER = ['near', 'middle', 'far'];
const TOY_K = 1.8, TOY_H = 0.1 * TOY_K, LIGHT_H = 0.095;

function silhouetteTexture() {
  // силуэт AiCo: скруглённая плитка и пиксель сверху
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(10,16,88,0.82)';
  g.beginPath(); g.roundRect(28, 70, 200, 180, 46); g.fill();
  g.beginPath(); g.roundRect(110, 26, 36, 36, 10); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function toy() {
  const g = new THREE.Group();
  const body = inked(new THREE.BoxGeometry(0.075, TOY_H * 0.8, 0.04).translate(0, TOY_H * 0.4, 0), '#246fff', { outline: 'edges', wash: 0.6 });
  const face = inked(new THREE.SphereGeometry(0.03, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2).scale(1.05, 0.9, 0.35).translate(0, TOY_H * 0.22, 0.021), '#ffffff', { wash: 0, hatch: 0.3, width: 0.6 });
  const pix = inked(new THREE.BoxGeometry(0.016, 0.016, 0.016).translate(0, TOY_H * 0.8 + 0.012, 0), '#c3dc3b', { outline: 'edges', wash: 0.8, hatch: 0 });
  g.add(body, face, pix);
  return g;
}

function torch() {
  const g = new THREE.Group();
  const body = inked(new THREE.CylinderGeometry(0.02, 0.02, 0.1, 20).rotateX(Math.PI / 2), '#246fff', { wash: 0.55 });
  const head = inked(new THREE.CylinderGeometry(0.03, 0.02, 0.03, 20).rotateX(-Math.PI / 2).translate(0, 0, -0.064), '#246fff', { wash: 0.45 });
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.026, 24).rotateY(Math.PI).translate(0, 0, -0.0795), glow('#fff6c8', { gain: 0.4, alpha: 1, rim: 0 }));
  lens.material.side = THREE.DoubleSide;
  g.add(body, head, lens); g.userData.lens = lens;
  return g;
}

export function createShadow(ctx) {
  const L = ctx.lesson;
  const group = new THREE.Group();
  const anim = animator();
  let place = 'middle', lit = false, busy = false;

  const t = torch(); t.scale.setScalar(1.6); t.position.copy(mm(...TORCH, LIGHT_H)); tappable(t, 'light'); group.add(t);
  const wall = inked(new THREE.BoxGeometry(1.1, 0.5, 0.012).translate(0, 0.25, 0), '#ffffff', { outline: 'edges', wash: 0, hatch: 0.2 });
  wall.position.copy(mm(CX, WALL_Y)); group.add(wall);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0), new THREE.MeshBasicMaterial({ map: silhouetteTexture(), transparent: true, depthWrite: false }));
  shadow.position.copy(mm(CX, WALL_Y + 0.8)); shadow.raycast = () => {};
  shadow.renderOrder = 5; // поверх экрана: оба прозрачные, иначе экран перекрывает тень
  group.add(shadow);

  const beamMat = glow('#fff2b0', { gain: 0.9, alpha: 0.16, rim: 0.7, additive: true });
  const dist = (TORCH[1] - WALL_Y) * 0.01;
  const beam = new THREE.Mesh(new THREE.ConeGeometry(0.26, dist, 36, 1, true).rotateX(Math.PI / 2).translate(0, 0, -dist / 2), beamMat);
  beam.position.copy(mm(...TORCH, LIGHT_H)); beam.raycast = () => {};
  group.add(beam);

  const a = toy(); a.scale.setScalar(TOY_K); tappable(a, 'light'); group.add(a);
  const toyAt = (y) => mm(CX, y);
  a.position.copy(toyAt(POS[place]));

  // размер тени из подобия треугольников: от фонарика до фигурки и до экрана
  // луч из фонарика через край фигурки до экрана: всё растёт в s = (до экрана) / (до фигурки) раз
  const setShadow = (y, k = 1) => {
    const s = dist / Math.max(0.05, (TORCH[1] - y) * 0.01);
    const bottom = LIGHT_H * (1 - s), h = (TOY_H + 0.025 * TOY_K) * s, w = 0.075 * TOY_K * 1.25 * s;
    shadow.scale.set(Math.max(0.001, w), Math.max(0.001, h), 1);
    shadow.position.y = mm(0, 0, 0).y + bottom;
    shadow.material.opacity = k;
  };
  const setLight = (k) => {
    beam.visible = k > 0.01; beamMat.uniforms.uAlpha.value = 0.16 * k;
    t.userData.lens.material.uniforms.uGain.value = 0.4 + 2.4 * k;
    shadow.visible = k > 0.01;
  };
  setLight(0); setShadow(POS[place], 0);

  function choose(p) {
    if (busy || p === place) return;
    busy = true; ctx.sfx('tap'); ctx.say(p.charAt(0).toUpperCase() + p.slice(1) + '.');
    const from = a.position.clone(), to = toyAt(POS[p]), y0 = (from.z / 0.01) + 100, y1 = POS[p];
    place = p;
    anim.tween(0.5, (k) => {
      a.position.lerpVectors(from, to, ease.inOut(k));
      if (lit) setShadow(y0 + (y1 - y0) * ease.inOut(k));
    }, () => { busy = false; ctx.repaintRight(); if (lit) ctx.tested(p); });
  }

  function light() {
    if (busy) return;
    if (lit) { ctx.tested(place); return; }
    busy = true; ctx.sfx('zap');
    anim.tween(0.7, (k) => { setLight(ease.out(k)); setShadow(POS[place], ease.out(k)); }, () => { lit = true; busy = false; ctx.tested(place); ctx.repaintRight(); });
  }

  return {
    group,
    buttons() {
      const b = ORDER.map((p, k) => ({ id: p, label: p.charAt(0).toUpperCase() + p.slice(1), x: 12 + k * 31, y: 118, w: 29, h: 10, on: place === p }));
      b.push({ id: 'light', label: lit ? 'Light ✓' : 'Light!', x: 108, y: 118, w: 30, h: 10, on: true, size: 4.2 });
      return b;
    },
    print(P) {
      P.text('screen', CX, WALL_Y - 3, { size: 3, weight: 600, color: '#8a8d95', align: 'center' });
      ORDER.forEach((p) => {
        P.line(CX + 12, POS[p], CX + 18, POS[p], { color: '#abaeb6', lw: 0.3 });
        P.text(p, CX + 20, POS[p] + 1, { size: 2.9, weight: 600, color: ctx.progress.lesson(ctx.i).tested.includes(p) ? '#566200' : '#8a8d95' });
      });
    },
    button(id) { if (id === 'light') light(); else choose(id); },
    tap() { light(); },
    sync() {
      const done = ctx.progress.lesson(ctx.i).tested.length > 0;
      lit = done; setLight(done ? 1 : 0); setShadow(POS[place], done ? 1 : 0);
    },
    update(dt, time) {
      anim.update(dt);
      if (lit) beamMat.uniforms.uGain.value = 0.85 + Math.sin(time * 3) * 0.08;
    },
  };
}
