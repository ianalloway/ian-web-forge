// Six small text-mode sketches. Each draws into a <pre> and only runs while on screen.

const COLS = 36;
const ROWS = 15;

type Grid = string[][];
type Sketch = (t: number, state: Record<string, any>) => Grid;

const blank = (): Grid => Array.from({ length: ROWS }, () => Array(COLS).fill(' '));
const put = (g: Grid, x: number, y: number, ch: string) => {
  x = Math.round(x);
  y = Math.round(y);
  if (x >= 0 && x < COLS && y >= 0 && y < ROWS) g[y][x] = ch;
};
const write = (g: Grid, x: number, y: number, text: string) => [...text].forEach((ch, i) => put(g, x + i, y, ch));
const axes = (g: Grid) => {
  for (let y = 0; y < ROWS - 1; y++) put(g, 0, y, '│');
  for (let x = 1; x < COLS; x++) put(g, x, ROWS - 1, '─');
  put(g, 0, ROWS - 1, '└');
};

// Seeded so every visit draws the same run.
const rng = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};

const torus: Sketch = (t) => {
  const g = blank();
  const z: number[] = new Array(COLS * ROWS).fill(0);
  const ramp = '.,-~:;=!*#$@';
  const A = t * 0.9;
  const B = t * 0.5;
  for (let j = 0; j < 6.28; j += 0.12) {
    for (let i = 0; i < 6.28; i += 0.04) {
      const c = Math.sin(i), d = Math.cos(j), e = Math.sin(A), f = Math.sin(j), a = Math.cos(A);
      const h = d + 2, D = 1 / (c * h * e + f * a + 5), l = Math.cos(i), m = Math.cos(B), n = Math.sin(B);
      const s = c * h * a - f * e;
      const x = Math.floor(COLS / 2 + COLS * 0.75 * D * (l * h * m - s * n));
      const y = Math.floor(ROWS / 2 + ROWS * 0.9 * D * (l * h * n + s * m));
      const N = Math.floor(8 * ((f * e - c * d * a) * m - c * d * e - f * a - l * d * n));
      const o = x + COLS * y;
      if (y >= 0 && y < ROWS && x >= 0 && x < COLS && D > z[o]) {
        z[o] = D;
        g[y][x] = ramp[Math.max(0, N)];
      }
    }
  }
  return g;
};

const calibration: Sketch = (t) => {
  const g = blank();
  axes(g);
  for (let x = 1; x < COLS; x++) {
    const p = x / (COLS - 1);
    put(g, x, (ROWS - 2) * (1 - p), '·');
  }
  for (let i = 1; i <= 9; i++) {
    const p = i / 10;
    const observed = p + 0.09 * Math.sin(p * 6.28 + t * 0.8) * Math.sin(t * 0.3 + i);
    put(g, p * (COLS - 1), (ROWS - 2) * (1 - observed), 'o');
  }
  write(g, 2, 0, 'observed');
  write(g, COLS - 10, ROWS - 2, 'predicted');
  return g;
};

const kelly: Sketch = (t) => {
  const g = blank();
  axes(g);
  const p = 0.55, b = 1;
  const growth = (f: number) => p * Math.log(1 + b * f) + (1 - p) * Math.log(1 - f);
  const best = p - (1 - p) / b;
  const top = growth(best);
  const toY = (v: number) => (ROWS - 2) * (1 - (v + top) / (2 * top));
  for (let x = 1; x < COLS; x++) {
    const f = (x / COLS) * 0.32;
    put(g, x, toY(growth(f)), '-');
  }
  const f = (0.5 + 0.5 * Math.sin(t * 0.7)) * 0.3;
  put(g, (f / 0.32) * COLS, toY(growth(f)), '@');
  put(g, (best / 0.32) * COLS, toY(top) - 1, 'v');
  write(g, COLS - 14, 0, `f=${f.toFixed(3)}`);
  write(g, COLS - 14, 1, `f*=${best.toFixed(3)}`);
  return g;
};

const descent: Sketch = (_t, s) => {
  const g = blank();
  const ramp = ' .:-=+*#';
  const world = (x: number, y: number) => [(x / (COLS - 1) - 0.5) * 4, (y / (ROWS - 1) - 0.5) * 3];
  const f = (x: number, y: number) => 0.6 * x * x + 2 * y * y + 0.5 * x * y;
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const [wx, wy] = world(x, y);
      g[y][x] = ramp[Math.min(ramp.length - 1, Math.floor(f(wx, wy) * 1.6)) % ramp.length];
    }
  }
  if (!s.path || s.path.length > 70) {
    s.random ??= rng(7);
    s.point = [(s.random() - 0.5) * 3.6, (s.random() < 0.5 ? -1 : 1) * 1.3];
    s.path = [];
  }
  const [x, y] = s.point;
  s.point = [x - 0.09 * (1.2 * x + 0.5 * y), y - 0.09 * (4 * y + 0.5 * x)];
  s.path.push([x, y]);
  for (const [px, py] of s.path) put(g, (px / 4 + 0.5) * (COLS - 1), (py / 3 + 0.5) * (ROWS - 1), 'o');
  put(g, (x / 4 + 0.5) * (COLS - 1), (y / 3 + 0.5) * (ROWS - 1), '@');
  return g;
};

const rain: Sketch = (t, s) => {
  const g = blank();
  s.random ??= rng(42);
  s.drops ??= Array.from({ length: COLS }, () => ({ y: s.random() * -ROWS, v: 0.25 + s.random() * 0.6 }));
  const chars = '01<>/=+*#%';
  s.drops.forEach((drop: { y: number; v: number }, x: number) => {
    drop.y += drop.v;
    if (drop.y - 7 > ROWS) drop.y = s.random() * -6;
    for (let k = 0; k < 7; k++) {
      const ch = k === 0 ? '@' : chars[Math.floor(Math.abs(Math.sin(x * 12.9 + (drop.y - k) * 7.3 + Math.floor(t * 4))) * chars.length)];
      put(g, x, drop.y - k, k > 4 ? '.' : ch);
    }
  });
  return g;
};

const sampler: Sketch = (_t, s) => {
  const g = blank();
  axes(g);
  const density = (x: number) => Math.exp(-((x - 0.28) ** 2) / 0.012) + 0.7 * Math.exp(-((x - 0.72) ** 2) / 0.02);
  if (!s.bins || s.n > 2600) {
    s.random ??= rng(11);
    s.bins = new Array(COLS - 1).fill(0);
    s.x = 0.5;
    s.n = 0;
  }
  for (let i = 0; i < 12; i++) {
    const next = s.x + (s.random() - 0.5) * 0.3;
    if (next > 0 && next < 1 && s.random() < density(next) / density(s.x)) s.x = next;
    s.bins[Math.floor(s.x * (COLS - 1))]++;
    s.n++;
  }
  const peak = Math.max(...s.bins, 1);
  s.bins.forEach((count: number, i: number) => {
    const h = Math.round((count / peak) * (ROWS - 3));
    for (let k = 0; k < h; k++) put(g, i + 1, ROWS - 2 - k, k === h - 1 ? '#' : '|');
  });
  put(g, s.x * (COLS - 1) + 1, 1, 'v');
  write(g, COLS - 9, 0, `n=${s.n}`);
  return g;
};

const SKETCHES: Record<string, Sketch> = { torus, calibration, kelly, descent, rain, sampler };

export function initLab(root: HTMLElement): () => void {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const panels = [...root.querySelectorAll<HTMLElement>('[data-sketch]')].map((el) => ({
    el,
    sketch: SKETCHES[el.dataset.sketch!],
    state: {} as Record<string, any>,
    visible: false,
  }));
  const paint = (panel: (typeof panels)[number], t: number) => {
    panel.el.textContent = panel.sketch(t, panel.state)
      .map((row) => row.join(''))
      .join('\n');
  };

  if (reduced) {
    // Final states: advance each sketch a little so the still frame has something in it.
    for (const panel of panels) for (let i = 0; i < 60; i++) paint(panel, 2 + i / 12);
    return () => {};
  }

  panels.forEach((panel) => paint(panel, 0));
  let raf = 0;
  let last = 0;
  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    if (now - last < 80) return;
    last = now;
    for (const panel of panels) if (panel.visible) paint(panel, now / 1000);
  };
  const sync = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    if (!document.hidden && panels.some((p) => p.visible)) raf = requestAnimationFrame(tick);
  };
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const panel = panels.find((p) => p.el === entry.target);
      if (panel) panel.visible = entry.isIntersecting;
    }
    sync();
  });
  panels.forEach((panel) => observer.observe(panel.el));
  document.addEventListener('visibilitychange', sync);
  return () => {
    cancelAnimationFrame(raf);
    observer.disconnect();
    document.removeEventListener('visibilitychange', sync);
  };
}
