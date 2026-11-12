// Опыт 10: шипучий шарик. Бутылка с уксусом, на горлышке — шарик с содой. «Add soda» — сода сыплется вниз,
// поднимается светящаяся пена, газ надувает шарик. Три порции — шарик большой.
import * as THREE from 'three';
import { inked, glow } from '../ink.js';
import { mm } from '../book.js';
import { animator, sparks, tappable, ease } from './kit.js';

const AT = [75, 66];
const NECK = 0.24;

function bottle() {
  const pts = [[0.0, 0], [0.06, 0], [0.066, 0.01], [0.066, 0.14], [0.05, 0.18], [0.022, 0.205], [0.02, NECK]].map(([x, y]) => new THREE.Vector2(x, y));
  const g = new THREE.Group();
  const glass = new THREE.Mesh(new THREE.LatheGeometry(pts, 40), new THREE.MeshBasicMaterial({ color: '#e5edff', transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false }));
  glass.renderOrder = 4;
  const outline = inked(new THREE.LatheGeometry(pts, 40), '#ffffff', { outline: 'hull', wash: 0, hatch: 0 });
  outline.userData.body.visible = false;
  const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.058, 0.08, 32).translate(0, 0.045, 0), glow('#e8f5c8', { gain: 0.95, alpha: 0.5, rim: 0.8 }));
  liquid.renderOrder = 3;
  g.add(glass, outline, liquid);
  g.userData.liquid = liquid;
  return g;
}

function balloon() {
  const g = new THREE.Group();
  const skin = inked(new THREE.SphereGeometry(0.06, 32, 24).scale(1, 1.15, 1).translate(0, 0.069, 0), '#246fff', { wash: 0.55 });
  const lip = inked(new THREE.CylinderGeometry(0.022, 0.024, 0.02, 20).translate(0, 0.005, 0), '#246fff', { wash: 0.7 });
  const shine = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 8).translate(-0.022, 0.1, 0.045), glow('#ffffff', { gain: 1.4, alpha: 0.9, rim: 0 }));
  shine.raycast = () => {};
  g.add(skin, lip, shine);
  g.userData.skin = skin;
  return g;
}

export function createFizz(ctx) {
  const L = ctx.lesson;
  const group = new THREE.Group();
  const anim = animator();
  const K = 1.7;
  const b = tappable(bottle(), 'soda'); b.scale.setScalar(K); b.position.copy(mm(...AT)); group.add(b);
  const bl = tappable(balloon(), 'soda'); bl.scale.setScalar(K); bl.position.copy(mm(...AT, NECK * K)); group.add(bl);
  const foam = sparks(group, '#e9ffd0', 60, 0.008);
  const soda = sparks(group, '#ffffff', 20, 0.004);
  let done = 0, size = 0;

  const setSize = (s) => {
    size = s;
    const k = 0.32 + s * 0.85;
    bl.userData.skin.scale.set(k, 0.42 + s * 0.95, k);
    bl.rotation.z = (1 - s) * 0.9;
  };
  setSize(0);

  function add() {
    if (anim.busy) return;
    if (done >= L.steps) { ctx.say(L.sentence(L.items[2])); return; }
    done++;
    ctx.sfx('fizz');
    const top = bl.position.clone().add(new THREE.Vector3(0, 0.02, 0));
    for (let n = 0; n < 14; n++) setTimeout(() => soda.emit(top.clone(), new THREE.Vector3(0, -0.6, 0), 0.02, 0.35), n * 25);
    const from = size, to = done / L.steps;
    anim.tween(1.6, (k) => {
      setSize(from + (to - from) * ease.out(k));
      if (Math.random() < 0.8) foam.emit(b.position.clone().add(new THREE.Vector3(0, 0.14, 0)), new THREE.Vector3(0, 0.3, 0), 0.14, 0.9);
    }, () => {
      ctx.tested('step' + done, false);
      const line = L.sentence(L.items[done - 1]);
      ctx.tested(L.items[done - 1].id, false);
      ctx.say(line);
      ctx.repaintRight();
    });
  }

  return {
    group,
    buttons() {
      return [{ id: 'add', label: done >= L.steps ? 'Balloon is big! ✓' : `Add soda  ${done} / ${L.steps}`, x: 45, y: 118, w: 60, h: 10, on: done < L.steps }];
    },
    button() { add(); },
    tap() { add(); },
    sync() { done = ctx.progress.stepsDone(ctx.i); setSize(done / L.steps); },
    print(P) {
      P.text('vinegar', AT[0] + 18, AT[1] + 4, { size: 3, weight: 600, color: '#8a8d95' });
      P.text('soda in the balloon', AT[0] + 18, AT[1] - 26, { size: 3, weight: 600, color: '#8a8d95' });
    },
    update(dt, t) {
      anim.update(dt);
      foam.update(dt, { ceil: b.position.y + NECK * K - 0.01 });
      soda.update(dt);
      b.userData.liquid.material.uniforms.uGain.value = 0.95 + (anim.busy ? 0.6 + Math.sin(t * 30) * 0.15 : 0);
    },
  };
}
