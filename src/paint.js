// Рисование страниц на 2D-canvas в миллиметрах: страница 150 × 200 мм, всё умножается на px/мм.
// Шрифты — как в айдентике AiCo: Inter для текста, JetBrains Mono для меток и цифр.

export const PAGE_W = 150;
export const PAGE_H = 200;

export const C = {
  paper: '#fbfcff', ink: '#121419', soft: '#585b62', faint: '#abaeb6', line: '#e1e4ed', inset: '#f0f3fc',
  action: '#2e44d1', actionSoft: '#e5edff', blue: '#246fff', cyan: '#00c4fa', navy: '#15217e', deep: '#0a1058',
  lime: '#c3dc3b', limeDark: '#869902', limeInk: '#566200', red: '#eb514f',
};

const SANS = '"Inter Variable", Inter, system-ui, -apple-system, sans-serif';
const MONO = '"JetBrains Mono", ui-monospace, monospace';

export class Painter {
  constructor(canvas, px, w = PAGE_W, h = PAGE_H) {
    this.canvas = canvas; this.px = px; this.g = canvas.getContext('2d');
    canvas.width = Math.round(w * px); canvas.height = Math.round(h * px);
    this.hits = [];
  }
  begin() { this.hits = []; this.g.setTransform(1, 0, 0, 1, 0, 0); this.g.clearRect(0, 0, this.canvas.width, this.canvas.height); }
  font({ size = 5, weight = 500, mono = false, italic = false } = {}) {
    return `${italic ? 'italic ' : ''}${weight} ${(size * this.px).toFixed(2)}px ${mono ? MONO : SANS}`;
  }
  fill(c) { this.g.fillStyle = c; return this; }
  rect(x, y, w, h, fill) { const p = this.px; this.g.fillStyle = fill; this.g.fillRect(x * p, y * p, w * p, h * p); }
  path(fn) { const g = this.g; g.beginPath(); fn(g, this.px); }
  rrect(x, y, w, h, r, { fill, stroke, lw = 0.35, dash } = {}) {
    const p = this.px, g = this.g;
    g.beginPath(); g.roundRect(x * p, y * p, w * p, h * p, r * p);
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw * p; g.setLineDash(dash ? dash.map((d) => d * p) : []); g.stroke(); g.setLineDash([]); }
  }
  circle(x, y, r, { fill, stroke, lw = 0.35, dash } = {}) {
    const p = this.px, g = this.g;
    g.beginPath(); g.arc(x * p, y * p, r * p, 0, Math.PI * 2);
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw * p; g.setLineDash(dash ? dash.map((d) => d * p) : []); g.stroke(); g.setLineDash([]); }
  }
  line(x1, y1, x2, y2, { color = C.line, lw = 0.3, dash } = {}) {
    const p = this.px, g = this.g;
    g.beginPath(); g.moveTo(x1 * p, y1 * p); g.lineTo(x2 * p, y2 * p);
    g.strokeStyle = color; g.lineWidth = lw * p; g.lineCap = 'round'; g.setLineDash(dash ? dash.map((d) => d * p) : []); g.stroke(); g.setLineDash([]);
  }
  text(s, x, y, { size = 5, weight = 500, color = C.ink, mono = false, italic = false, align = 'left', base = 'alphabetic', track = 0 } = {}) {
    const g = this.g;
    g.font = this.font({ size, weight, mono, italic }); g.fillStyle = color; g.textAlign = align; g.textBaseline = base;
    if ('letterSpacing' in g) g.letterSpacing = `${(track * size * this.px).toFixed(2)}px`;
    g.fillText(s, x * this.px, y * this.px);
    if ('letterSpacing' in g) g.letterSpacing = '0px';
  }
  measure(s, o = {}) {
    const g = this.g; g.font = this.font(o);
    if ('letterSpacing' in g) g.letterSpacing = `${((o.track || 0) * (o.size || 5) * this.px).toFixed(2)}px`;
    const w = g.measureText(s).width / this.px;
    if ('letterSpacing' in g) g.letterSpacing = '0px';
    return w;
  }
  // Перенос по словам; возвращает y следующей строки.
  wrap(s, x, y, maxW, lineH, o = {}) {
    let line = '';
    for (const word of s.split(' ')) {
      const t = line ? line + ' ' + word : word;
      if (line && this.measure(t, o) > maxW) { this.text(line, x, y, o); y += lineH; line = word; } else line = t;
    }
    if (line) { this.text(line, x, y, o); y += lineH; }
    return y;
  }
  img(im, x, y, w, h) { if (im) this.g.drawImage(im, x * this.px, y * this.px, w * this.px, h * this.px); }
  hit(id, x, y, w, h, extra = {}) { this.hits.push({ id, x, y, w, h, ...extra }); }
  speaker(x, y, s = 3, color = C.action) {
    // значок «послушать»: динамик и две дуги
    const p = this.px, g = this.g;
    g.save(); g.translate(x * p, y * p); g.scale((s / 10) * p, (s / 10) * p);
    g.fillStyle = color; g.strokeStyle = color; g.lineWidth = 1.4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-5, -2); g.lineTo(-2.5, -2); g.lineTo(1, -5); g.lineTo(1, 5); g.lineTo(-2.5, 2); g.lineTo(-5, 2); g.closePath(); g.fill();
    g.beginPath(); g.arc(1.5, 0, 3.2, -0.9, 0.9); g.stroke();
    g.beginPath(); g.arc(1.5, 0, 5.8, -0.9, 0.9); g.stroke();
    g.restore();
  }
  check(x, y, s = 3, color = C.limeInk) {
    const p = this.px, g = this.g;
    g.beginPath(); g.moveTo((x - s * 0.5) * p, y * p); g.lineTo((x - s * 0.12) * p, (y + s * 0.38) * p); g.lineTo((x + s * 0.55) * p, (y - s * 0.42) * p);
    g.strokeStyle = color; g.lineWidth = s * 0.22 * p; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke();
  }
}

// Бумага: тёплый белый, редкое зерно и тень у корешка.
export function paper(P, side) {
  const g = P.g, w = P.canvas.width, h = P.canvas.height;
  g.fillStyle = C.paper; g.fillRect(0, 0, w, h);
  let seed = side === 'left' ? 7 : 13;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  g.fillStyle = 'rgba(21,33,126,0.025)';
  for (let i = 0; i < 2600; i++) g.fillRect(rnd() * w, rnd() * h, 1.2, 1.2);
  const gx = side === 'left' ? w : 0, gr = g.createLinearGradient(gx, 0, side === 'left' ? w - w * 0.12 : w * 0.12, 0);
  gr.addColorStop(0, 'rgba(10,16,88,0.16)'); gr.addColorStop(0.35, 'rgba(10,16,88,0.05)'); gr.addColorStop(1, 'rgba(10,16,88,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
}

export function brandMark(P, x, y, color = C.soft) {
  P.rrect(x, y - 2.6, 2.6, 2.6, 0.7, { fill: C.lime });
  P.text('Codify · English', x + 4, y, { size: 3.1, weight: 600, color });
}

export function folio(P, n, side) {
  P.text(String(n), side === 'left' ? 14 : PAGE_W - 14, 192, { size: 3.2, weight: 500, mono: true, color: C.faint, align: side === 'left' ? 'left' : 'right' });
}

// Штамп урока: лаймовый круг, AiCo в центре, надпись по кругу.
export function stamp(P, x, y, r, n, aico, { rot = -0.18, alpha = 1 } = {}) {
  const g = P.g, p = P.px;
  g.save(); g.globalAlpha = alpha; g.translate(x * p, y * p); g.rotate(rot);
  g.beginPath(); g.arc(0, 0, r * p, 0, Math.PI * 2); g.fillStyle = C.lime; g.fill();
  g.lineWidth = 0.7 * p; g.strokeStyle = C.limeDark; g.stroke();
  g.beginPath(); g.arc(0, 0, r * 0.8 * p, 0, Math.PI * 2); g.setLineDash([0.8 * p, 0.8 * p]); g.lineWidth = 0.35 * p; g.stroke(); g.setLineDash([]);
  if (aico) g.drawImage(aico, -r * 0.46 * p, -r * 0.5 * p, r * 0.92 * p, r * 0.92 * p);
  const label = `WORD LAB · LESSON ${n} · `;
  g.font = P.font({ size: r * 0.17, weight: 700, mono: true }); g.fillStyle = C.limeInk; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let i = 0; i < label.length; i++) {
    const a = (i / label.length) * Math.PI * 2 - Math.PI / 2;
    g.save(); g.rotate(a + Math.PI / 2); g.translate(0, -r * 0.9 * p); g.fillText(label[i], 0, 0); g.restore();
  }
  g.restore();
}
