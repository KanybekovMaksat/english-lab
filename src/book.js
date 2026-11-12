// 3D-книга: обложка, блоки страниц, две открытые страницы и лист, который переворачивается с изгибом.
// Страницы — текстуры с 2D-canvas (см. pages.js). 1 мм страницы = 0.01 единицы сцены.
import * as THREE from 'three';
import { Painter, PAGE_W, PAGE_H } from './paint.js';

export const S = 0.01;
export const W = PAGE_W * S;
export const H = PAGE_H * S;
export const PAGE_Y = 0.075;

const SEG = 36;

// Мягкий прогиб к корешку, чтобы разворот читался как настоящая книга.
const sag = (x) => -0.022 * Math.exp(-Math.abs(x) / 0.07);

function pageGeometry(side) {
  const g = new THREE.PlaneGeometry(W, H, SEG, 1);
  g.rotateX(-Math.PI / 2);
  g.translate(side === 'left' ? -W / 2 : W / 2, 0, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, PAGE_Y + sag(p.getX(i)));
  g.computeVertexNormals();
  return g;
}

function makeTexture(canvas, renderer) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return t;
}

function coverTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512;
  const g = c.getContext('2d'), gr = g.createLinearGradient(0, 512, 512, 0);
  gr.addColorStop(0, '#00c4fa'); gr.addColorStop(1, '#246fff');
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function edgeTexture() {
  // торец блока: тонкие линии листов
  const c = document.createElement('canvas'); c.width = 64; c.height = 64;
  const g = c.getContext('2d'); g.fillStyle = '#f3f5fb'; g.fillRect(0, 0, 64, 64);
  for (let y = 0; y < 64; y += 3) { g.fillStyle = `rgba(21,33,126,${0.05 + (y % 9 === 0 ? 0.05 : 0)})`; g.fillRect(0, y, 64, 1); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 1); return t;
}

export function createBook(renderer, { px = 7 } = {}) {
  const group = new THREE.Group();
  const paperMat = (map) => new THREE.MeshStandardMaterial({ map, roughness: 0.92, metalness: 0 });

  // обложка-«доска» под блоками
  const coverMat = new THREE.MeshStandardMaterial({ map: coverTexture(), roughness: 0.55 });
  for (const side of [-1, 1]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(W + 0.06, 0.022, H + 0.08), coverMat);
    b.position.set(side * (W / 2 + 0.03), 0.011, 0);
    b.castShadow = b.receiveShadow = true;
    group.add(b);
    const blockMat = [paperMat(edgeTexture()), paperMat(edgeTexture()), paperMat(null), paperMat(null), paperMat(edgeTexture()), paperMat(edgeTexture())];
    const block = new THREE.Mesh(new THREE.BoxGeometry(W - 0.008, PAGE_Y - 0.03, H - 0.01), blockMat);
    block.position.set(side * (W / 2 + 0.004), 0.022 + (PAGE_Y - 0.03) / 2, 0);
    block.castShadow = block.receiveShadow = true;
    group.add(block);
  }
  // корешок
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, H + 0.08, 16, 1, false, Math.PI, Math.PI), coverMat);
  spine.rotation.x = Math.PI / 2; spine.position.set(0, 0.03, 0);
  group.add(spine);
  // поверхности страниц: левая, правая и две стороны переворачиваемого листа
  const surf = {};
  for (const k of ['left', 'right', 'front', 'back']) {
    const canvas = document.createElement('canvas');
    const P = new Painter(canvas, px);
    surf[k] = { P, tex: makeTexture(canvas, renderer), spread: -1, side: null };
  }
  const left = new THREE.Mesh(pageGeometry('left'), paperMat(surf.left.tex));
  const right = new THREE.Mesh(pageGeometry('right'), paperMat(surf.right.tex));
  left.receiveShadow = right.receiveShadow = true;
  left.userData.side = 'left'; right.userData.side = 'right';
  group.add(left, right);

  // лист: общая геометрия позиций, разная развёртка UV для лицевой и оборотной стороны
  const leafPos = new THREE.BufferAttribute(new Float32Array((SEG + 1) * 2 * 3), 3);
  const idx = [];
  for (let k = 0; k < SEG; k++) {
    const a = k * 2, b = a + 1, c = a + 2, d = a + 3;
    idx.push(a, b, c, b, d, c);
  }
  const mkLeafGeo = (flip) => {
    const g = new THREE.BufferGeometry();
    const uv = new Float32Array((SEG + 1) * 2 * 2);
    for (let k = 0; k <= SEG; k++) {
      const u = flip ? 1 - k / SEG : k / SEG;
      uv.set([u, 1, u, 0], k * 4);
    }
    g.setAttribute('position', leafPos);
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setIndex(idx);
    return g;
  };
  const leafFront = new THREE.Mesh(mkLeafGeo(false), new THREE.MeshStandardMaterial({ map: surf.front.tex, roughness: 0.92, side: THREE.FrontSide }));
  const leafBack = new THREE.Mesh(mkLeafGeo(true), new THREE.MeshStandardMaterial({ map: surf.back.tex, roughness: 0.92, side: THREE.BackSide }));
  leafFront.castShadow = leafBack.castShadow = true;
  const leaf = new THREE.Group(); leaf.add(leafFront, leafBack); leaf.visible = false;
  group.add(leaf);

  function shapeLeaf(theta, dir) {
    // тело листа отстаёт от корешка: каждый сегмент повёрнут чуть меньше предыдущего
    const ds = W / SEG, lag = 0.95 * Math.sin(theta);
    let x = 0, y = PAGE_Y + 0.002, a;
    for (let k = 0; k <= SEG; k++) {
      leafPos.setXYZ(k * 2, x, y, -H / 2);
      leafPos.setXYZ(k * 2 + 1, x, y, H / 2);
      const t = (k + 0.5) / SEG;
      a = theta - dir * lag * Math.pow(t, 1.4);
      x += Math.cos(a) * ds; y += Math.sin(a) * ds;
    }
    leafPos.needsUpdate = true;
    leafFront.geometry.computeVertexNormals();
    if (leafBack.geometry.attributes.normal !== leafFront.geometry.attributes.normal) leafBack.geometry.setAttribute('normal', leafFront.geometry.attributes.normal);
    leafFront.geometry.computeBoundingSphere(); leafBack.geometry.boundingSphere = leafFront.geometry.boundingSphere;
  }

  let paintFn = null, turning = null;
  const paint = (key, spread, side) => {
    const s = surf[key];
    paintFn(s.P, spread, side);
    s.spread = spread; s.side = side; s.tex.needsUpdate = true;
  };

  const api = {
    group, left, right, leaf, surf,
    get turning() { return !!turning; },
    setPainter(fn) { paintFn = fn; },
    show(spread) { paint('left', spread, 'left'); paint('right', spread, 'right'); },
    repaint(side) { const s = surf[side]; if (s.spread >= 0) paint(side, s.spread, s.side); },
    hits(side) { return surf[side].P.hits; },
    // dir = +1 вперёд (лист справа налево), −1 назад
    turn(from, to, done) {
      const dir = to > from ? 1 : -1;
      if (dir > 0) {
        paint('front', from, 'right'); paint('back', to, 'left'); paint('right', to, 'right');
      } else {
        paint('front', to, 'right'); paint('back', from, 'left'); paint('left', to, 'left');
      }
      turning = { t: 0, dir, to, done, dur: 0.95 };
      shapeLeaf(dir > 0 ? 0 : Math.PI, dir);
      leaf.visible = true;
    },
    update(dt) {
      if (!turning) return;
      turning.t = Math.min(1, turning.t + dt / turning.dur);
      const k = turning.t, e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      const theta = turning.dir > 0 ? e * Math.PI : (1 - e) * Math.PI;
      shapeLeaf(Math.max(0.0001, Math.min(Math.PI - 0.0001, theta)), turning.dir);
      if (k >= 1) {
        const { dir, to, done } = turning;
        if (dir > 0) paint('left', to, 'left'); else paint('right', to, 'right');
        leaf.visible = false; turning = null;
        done && done();
      }
    },
  };
  return api;
}

// Миллиметры правой страницы → локальные координаты книги.
export const mm = (x, y, h = 0) => new THREE.Vector3(x * S, PAGE_Y + h, -H / 2 + y * S);
