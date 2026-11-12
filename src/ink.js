// «Чернильный» стиль 3D-рисунков: бумажная заливка с лёгкой цветной подкраской,
// штриховка в тени (в экранных координатах, как ручкой) и контур тёмно-синими чернилами.
// Светится только «энергия» опыта (вода, поле магнита, луч) — через glow(), его ловит bloom.
import * as THREE from 'three';

export const INK = new THREE.Color('#15217e');
export const PAPER = new THREE.Color('#fbfcff');
export const LIGHT_DIR = new THREE.Vector3(-0.8, 0.9, 0.45).normalize();

const shared = { uTime: { value: 0 }, uLight: { value: LIGHT_DIR }, uDpr: { value: 1 } };
export const tickInk = (t, dpr) => { shared.uTime.value = t; shared.uDpr.value = dpr; };

const VERT = /* glsl */`
  varying vec3 vN; varying vec3 vW;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;

const FRAG = /* glsl */`
  uniform vec3 uTint; uniform vec3 uInk; uniform vec3 uPaper; uniform vec3 uLight;
  uniform float uWash; uniform float uAlpha; uniform float uDpr; uniform float uHatch;
  varying vec3 vN; varying vec3 vW;
  float lines(float f, float w) {
    float fw = max(fwidth(f), 1e-4);
    float d = abs(fract(f) - 0.5);
    return 1.0 - smoothstep(0.5 - w - fw, 0.5 - w + fw, 0.5 - d);
  }
  void main() {
    vec3 n = normalize(vN);
    if (!gl_FrontFacing) n = -n;
    float ndl = dot(n, normalize(uLight)) * 0.5 + 0.5;
    vec3 v = normalize(cameraPosition - vW);
    float rim = pow(1.0 - abs(dot(n, v)), 2.2);
    vec3 base = mix(uPaper, uTint, uWash) * mix(0.66, 1.0, smoothstep(0.2, 0.9, ndl));
    base *= 1.0 - rim * 0.22;
    vec2 p = gl_FragCoord.xy / (4.5 * uDpr);
    float h1 = lines(p.x + p.y, 0.17) * (1.0 - smoothstep(0.5, 0.72, ndl));
    float h2 = lines(p.x - p.y, 0.15) * (1.0 - smoothstep(0.3, 0.48, ndl));
    float hatch = max(h1, h2) * uHatch;
    vec3 col = mix(base, uInk, hatch * 0.7);
    gl_FragColor = vec4(col * 0.92, uAlpha);
  }`;

export function inkMaterial(tint = '#ffffff', { wash = 0.45, hatch = 1 } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      ...shared,
      uTint: { value: new THREE.Color(tint) }, uInk: { value: INK }, uPaper: { value: PAPER },
      uWash: { value: wash }, uAlpha: { value: 1 }, uHatch: { value: hatch },
    },
    vertexShader: VERT, fragmentShader: FRAG, transparent: true,
  });
}

// Контур «вывернутой оболочкой»: задняя сторона, сдвинутая по нормали, залитая чернилами.
const OUT_VERT = /* glsl */`
  uniform float uWidth;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vec3 n = normalize(mat3(modelMatrix) * normal);
    vec4 v = viewMatrix * w;
    w.xyz += n * uWidth * (-v.z) * 0.0021;
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;
const OUT_FRAG = /* glsl */`uniform vec3 uInk; uniform float uAlpha; void main() { gl_FragColor = vec4(uInk * 0.9, uAlpha); }`;

export function outlineMaterial(width = 1) {
  return new THREE.ShaderMaterial({
    uniforms: { uWidth: { value: width }, uInk: { value: INK }, uAlpha: { value: 1 } },
    vertexShader: OUT_VERT, fragmentShader: OUT_FRAG, side: THREE.BackSide, transparent: true,
  });
}

const edgeMat = () => new THREE.LineBasicMaterial({ color: INK, transparent: true });

// Меш в стиле книги. outline: 'hull' для гладких форм, 'edges' для граней, 'both', 'none'.
export function inked(geometry, tint, { outline = 'hull', width = 1, wash, hatch, shadow = true, edgeAngle = 35 } = {}) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(geometry, inkMaterial(tint, { wash, hatch }));
  body.castShadow = shadow;
  g.add(body);
  if (outline === 'hull' || outline === 'both') {
    const o = new THREE.Mesh(geometry, outlineMaterial(width));
    o.raycast = () => {};
    g.add(o);
  }
  if (outline === 'edges' || outline === 'both') {
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, edgeAngle), edgeMat());
    e.raycast = () => {};
    g.add(e);
  }
  g.userData.body = body;
  return g;
}

// Свечение: цвет умножен выше 1, чтобы его поймал bloom; бумага и чернила остаются ниже порога.
const GLOW_VERT = /* glsl */`
  varying vec3 vN; varying vec3 vV;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }`;
const GLOW_FRAG = /* glsl */`
  uniform vec3 uColor; uniform float uGain; uniform float uAlpha; uniform float uRim;
  varying vec3 vN; varying vec3 vV;
  void main() {
    float f = 1.0 - abs(dot(normalize(vN), normalize(vV)));
    float a = mix(1.0, pow(f, 1.6), uRim);
    gl_FragColor = vec4(uColor * uGain * (0.55 + a), uAlpha * clamp(a + 0.25, 0.0, 1.0));
  }`;

export function glow(color, { gain = 2.2, alpha = 0.85, rim = 0.6, additive = false } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uGain: { value: gain }, uAlpha: { value: alpha }, uRim: { value: rim } },
    vertexShader: GLOW_VERT, fragmentShader: GLOW_FRAG, transparent: true, depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, toneMapped: false,
  });
}

// Плавное появление со страницы: высота растёт от плоского «отпечатка» до объёма, чернила проявляются.
export function setLift(root, k) {
  const e = k <= 0 ? 0 : k >= 1 ? 1 : 1 - Math.pow(1 - k, 3);
  root.scale.set(1, Math.max(0.002, e), 1);
  root.visible = k > 0.001;
  root.traverse((o) => {
    const m = o.material;
    if (!m) return;
    if (m.uniforms?.uAlpha && m.userData.baseAlpha === undefined) m.userData.baseAlpha = m.uniforms.uAlpha.value;
    if (m.uniforms?.uAlpha) m.uniforms.uAlpha.value = m.userData.baseAlpha * Math.min(1, k * 1.6);
    else if ('opacity' in m) { if (m.userData.baseAlpha === undefined) m.userData.baseAlpha = m.opacity; m.opacity = m.userData.baseAlpha * Math.min(1, k * 1.6); }
  });
}
