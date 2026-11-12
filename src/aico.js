// AiCo — маскот Codify. Геометрия и цвета взяты из robobaza/src/art.js (AiCo 2.0, maskot-zeta.vercel.app):
// белый купол на сине-голубой плитке, эмоции — только форма глаз, лаймовая энергия, пиксель Ai над головой.

const EYES = {
  calm: { c: '#246fff', sw: 14, shine: 1, d: (x) => [`M${x} 108V124`] },
  happy: { c: '#6d7c00', sw: 7, d: (x) => [`M${x - 8} 120L${x} 111L${x + 8} 120`] },
  wow: { c: '#6d7c00', sw: 6.9, d: (x) => [`M${x} 101.5V122.2`, `M${x - 10.4} 111.8H${x + 10.4}`] },
  love: { c: '#eb514f', sw: 9, d: (x) => [`M${x - 4.5} 113L${x - 6.5} 117.5L${x} 124.5`, `M${x + 4.5} 113L${x + 6.5} 117.5L${x} 124.5`] },
  think: { c: '#246fff', sw: 13, d: (x) => [`M${x + 6} 109h.01`] },
};
export const MOODS = Object.keys(EYES);

export function aicoSVG(mood = 'calm', energy = 0) {
  const m = EYES[mood] || EYES.calm, e = Math.max(0, Math.min(1, energy)), ly = (196 - e * 62).toFixed(1);
  const eyes = [78, 122].map((x) => m.d(x).map((d) => `<path d="${d}"/>`).join('') +
    (m.shine ? `<circle cx="${x - 2.5}" cy="108.3" r="2.6" fill="#fff" stroke="none" opacity=".85"/>` : '')).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="400" height="400"><defs>` +
    `<linearGradient id="t" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#00c4fa"/><stop offset="1" stop-color="#246fff"/></linearGradient>` +
    `<linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset=".4" stop-color="#fff"/><stop offset="1" stop-color="#f3f7ff"/></linearGradient>` +
    `<linearGradient id="l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c3dc3b"/><stop offset="1" stop-color="#869902"/></linearGradient>` +
    `<radialGradient id="g" cx=".25" cy=".1" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>` +
    `<clipPath id="ct"><rect width="200" height="200" rx="44"/></clipPath><clipPath id="cb"><circle cx="100" cy="152" r="84"/></clipPath></defs>` +
    `<g clip-path="url(#ct)"><rect width="200" height="200" fill="url(#t)"/><rect width="200" height="200" fill="url(#g)"/>` +
    `<circle cx="100" cy="152" r="84" fill="url(#b)"/>` +
    (e > 0 ? `<g clip-path="url(#cb)"><rect x="0" y="${ly}" width="200" height="200" fill="url(#l)"/><path d="M0 ${ly}H200" stroke="#eaf1d6" stroke-width="2.5" opacity=".9"/></g>` : '') +
    `<g fill="none" stroke="${m.c}" stroke-width="${m.sw}" stroke-linecap="round" stroke-linejoin="round">${eyes}</g></g>` +
    '<rect x="91" y="47.5" width="18" height="18" rx="5" fill="#c3dc3b" stroke="#869902" stroke-width="1.5"/></svg>';
}

const cache = new Map();
const load = (svg) => new Promise((res, rej) => {
  const img = new Image();
  img.onload = () => res(img); img.onerror = rej;
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
});

// Все картинки AiCo грузим заранее: страницы рисуются синхронно.
export async function preloadAico() {
  const jobs = [];
  for (const mood of MOODS) for (const e of [0, 0.5, 1]) {
    const k = mood + e;
    jobs.push(load(aicoSVG(mood, e)).then((img) => cache.set(k, img)));
  }
  await Promise.all(jobs);
}

export function aicoImage(mood = 'calm', energy = 0) {
  const e = energy >= 0.75 ? 1 : energy >= 0.25 ? 0.5 : 0;
  return cache.get(mood + e) || cache.get('calm0');
}
