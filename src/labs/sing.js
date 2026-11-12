// Опыт 6: поющие стаканы. Три стакана с разным уровнем воды, ложка стучит — звучит настоящая нота,
// от стакана расходятся светящиеся лаймовые кольца звука. Чем больше воды, тем ниже звук.
import * as THREE from 'three';
import { inked, glow, INK } from '../ink.js';
import { mm } from '../book.js';
import { animator, sparks, tappable, ease } from './kit.js';

const X = { empty: 38, half: 75, full: 112 };
const Y = 66;
const FREQ = { empty: 1046, half: 784, full: 523 };
const H = 0.2, R = 0.07;

function glass(level) {
  const g = new THREE.Group();
  const pts = [new THREE.Vector2(R * 0.82, 0), new THREE.Vector2(R * 0.86, 0.004), new THREE.Vector2(R, H)];
  const wall = new THREE.Mesh(new THREE.LatheGeometry(pts, 40), new THREE.MeshBasicMaterial({ color: '#e5edff', transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }));
  wall.renderOrder = 4;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.0022, 6, 48).rotateX(Math.PI / 2).translate(0, H, 0), new THREE.MeshBasicMaterial({ color: INK }));
  const foot = new THREE.Mesh(new THREE.TorusGeometry(R * 0.84, 0.0022, 6, 48).rotateX(Math.PI / 2).translate(0, 0.002, 0), new THREE.MeshBasicMaterial({ color: INK }));
  const edgeL = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-R * 0.84, 0, 0), new THREE.Vector3(-R, H, 0), new THREE.Vector3(R * 0.84, 0, 0), new THREE.Vector3(R, H, 0)]), new THREE.LineBasicMaterial({ color: INK }));
  edgeL.userData.billboard = true;
  g.add(wall, rim, foot, edgeL);
  if (level > 0) {
    const wh = H * level;
    const water = new THREE.Mesh(new THREE.CylinderGeometry(R * (0.84 + 0.15 * level) - 0.003, R * 0.82 - 0.003, wh, 32).translate(0, wh / 2 + 0.003, 0), glow('#00c4fa', { gain: 1.2, alpha: 0.4, rim: 0.85 }));
    water.renderOrder = 3; g.add(water);
    const top = new THREE.Mesh(new THREE.CircleGeometry(R * (0.84 + 0.15 * level) - 0.004, 32).rotateX(-Math.PI / 2).translate(0, wh + 0.004, 0), glow('#00c4fa', { gain: 2, alpha: 0.55, rim: 0 }));
    top.renderOrder = 3; g.add(top); g.userData.top = top;
  }
  // невидимый «щуп» для нажатия по всему стакану
  const hit = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.2, R * 1.2, H * 1.2, 12).translate(0, H * 0.6, 0), new THREE.MeshBasicMaterial({ visible: false }));
  g.add(hit);
  [wall, rim, foot, edgeL].forEach((m) => { m.raycast = () => {}; });
  return g;
}

function spoon() {
  const g = new THREE.Group();
  const handle = inked(new THREE.CylinderGeometry(0.0035, 0.0045, 0.13, 8).rotateZ(Math.PI / 2).translate(0.065, 0, 0), '#abaeb6', { wash: 0.4, width: 0.6 });
  const bowl = inked(new THREE.SphereGeometry(0.016, 14, 8).scale(1.4, 0.35, 1), '#abaeb6', { wash: 0.4, width: 0.6 });
  g.add(handle, bowl);
  g.traverse((o) => { o.raycast = () => {}; });
  return g;
}

export function createSing(ctx) {
  const L = ctx.lesson;
  const group = new THREE.Group();
  const anim = animator();
  const glasses = {}, rings = [];
  for (const it of L.items) {
    const g = tappable(glass(it.level), it.id);
    g.scale.setScalar(1.3);
    g.position.copy(mm(X[it.id], Y));
    group.add(g); glasses[it.id] = g;
  }
  const sp = spoon(); sp.scale.setScalar(1.6); group.add(sp);
  const rest = mm(75, 104, 0.01);
  sp.position.copy(rest); sp.rotation.y = -0.4;
  const ringMat = () => glow('#c3dc3b', { gain: 2.4, alpha: 0.9, rim: 0.2, additive: true });
  const notes = sparks(group, '#c3dc3b', 18, 0.006);

  function ring(at) {
    const m = new THREE.Mesh(new THREE.TorusGeometry(R, 0.003, 6, 48).rotateX(Math.PI / 2), ringMat());
    m.position.copy(at); m.scale.setScalar(1.3); m.raycast = () => {};
    group.add(m); rings.push({ m, t: 0 });
  }

  function strike(id) {
    const g = glasses[id], it = L.items.find((x) => x.id === id);
    const from = sp.position.clone(), to = g.position.clone().add(new THREE.Vector3(-R * 1.3 - 0.1, H * 0.9, 0.03));
    anim.tween(0.28, (k) => { sp.position.lerpVectors(from, to, ease.out(k)); sp.rotation.z = -0.5 * k; }, () => {
      ctx.sfx('glass', FREQ[id]);
      for (let n = 0; n < 3; n++) setTimeout(() => ring(g.position.clone().add(new THREE.Vector3(0, 1.3 * H * (0.4 + n * 0.25), 0))), n * 120);
      for (let n = 0; n < 5; n++) notes.emit(g.position.clone().add(new THREE.Vector3(0, H + 0.02, 0)), new THREE.Vector3(0, 0.18, 0), 0.06, 1);
      g.userData.shake = 1;
      anim.tween(0.25, (k) => { sp.rotation.z = -0.5 * (1 - k); }, () => {
        ctx.tested(id);
        anim.tween(0.4, (k) => sp.position.lerpVectors(to, rest, ease.inOut(k)));
      });
    });
    void it;
  }

  return {
    group,
    tap(id) { if (!glasses[id] || anim.busy) return; strike(id); },
    sync() {},
    update(dt, t) {
      anim.update(dt);
      notes.update(dt, { gravity: -0.05 });
      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i]; r.t += dt;
        const k = r.t / 1.1;
        r.m.scale.setScalar(1.3 * (1 + k * 1.6));
        r.m.material.uniforms.uAlpha.value = Math.max(0, 0.9 * (1 - k));
        if (k >= 1) { group.remove(r.m); r.m.geometry.dispose(); rings.splice(i, 1); }
      }
      for (const g of Object.values(glasses)) {
        const s = g.userData.shake || 0;
        if (s > 0) { g.userData.shake = Math.max(0, s - dt * 1.4); g.rotation.z = Math.sin(t * 60) * 0.02 * s; }
        if (g.userData.top) g.userData.top.position.y = Math.sin(t * 40) * 0.002 * s;
      }
    },
  };
}
