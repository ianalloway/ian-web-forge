// A Gaussian mixture fitted by Expectation–Maximisation. Unlike k-means (hard
// assignments, spherical clusters), EM gives each point a *soft* responsibility
// across components and fits a full 2×2 covariance per component — so clusters
// can be stretched and tilted, and overlap is shared rather than cut.
//
// Each EM step runs
//   E: r_{ik} = π_k·N(xᵢ|μ_k,Σ_k) / Σ_j π_j·N(xᵢ|μ_j,Σ_j)
//   M: π_k, μ_k, Σ_k ← responsibility-weighted counts, means, covariances
// and the data log-likelihood never decreases.

export interface Pt {
  x: number;
  y: number;
}

/** Symmetric 2×2 covariance stored as [σxx, σxy, σyy]. */
export type Cov = [number, number, number];

export interface Component {
  mean: Pt;
  cov: Cov;
  weight: number; // mixing coefficient π_k
}

export interface GmmState {
  comps: Component[];
  resp: number[][]; // n × k responsibilities
  logLik: number; // log-likelihood of `comps` under the data
  iteration: number;
}

export const CLUSTER_COLORS = [
  "#00ff41",
  "#00cfff",
  "#ff6b35",
  "#ffe066",
  "#b97eff",
  "#ff4da6",
];

const EPS = 1e-6; // covariance-diagonal floor, keeps components from collapsing

export function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Density of a 2-D Gaussian at p. */
export function gaussian2(p: Pt, mean: Pt, cov: Cov): number {
  const [a, b, c] = cov;
  const det = a * c - b * b;
  if (det <= 1e-12) return 0;
  const dx = p.x - mean.x;
  const dy = p.y - mean.y;
  // quadratic form (x-μ)ᵀ Σ⁻¹ (x-μ) with Σ⁻¹ = [c,-b; -b,a]/det
  const quad = (c * dx * dx - 2 * b * dx * dy + a * dy * dy) / det;
  return Math.exp(-0.5 * quad) / (2 * Math.PI * Math.sqrt(det));
}

function spread(points: Pt[]): { cx: number; cy: number; vx: number; vy: number } {
  const n = points.length || 1;
  let cx = 0;
  let cy = 0;
  for (const p of points) {
    cx += p.x;
    cy += p.y;
  }
  cx /= n;
  cy /= n;
  let vx = 0;
  let vy = 0;
  for (const p of points) {
    vx += (p.x - cx) ** 2;
    vy += (p.y - cy) ** 2;
  }
  return { cx, cy, vx: vx / n, vy: vy / n };
}

/** Seed k components: means at random data points, covariance from data spread. */
export function initGmm(points: Pt[], k: number, rng: () => number = Math.random): GmmState {
  const { vx, vy } = spread(points);
  const comps: Component[] = [];
  const used = new Set<number>();
  for (let j = 0; j < k; j++) {
    let idx = Math.floor(rng() * points.length);
    let guard = 0;
    while (used.has(idx) && guard++ < points.length) idx = (idx + 1) % points.length;
    used.add(idx);
    const p = points[idx] ?? { x: 0, y: 0 };
    comps.push({
      mean: { x: p.x, y: p.y },
      cov: [Math.max(vx, 1) / 4, 0, Math.max(vy, 1) / 4],
      weight: 1 / k,
    });
  }
  const { resp, logLik } = eStep(points, comps);
  return { comps, resp, logLik, iteration: 0 };
}

/** E-step: responsibilities for the given components, plus the log-likelihood. */
export function eStep(points: Pt[], comps: Component[]): { resp: number[][]; logLik: number } {
  const resp: number[][] = [];
  let logLik = 0;
  for (const p of points) {
    const weighted = comps.map((c) => c.weight * gaussian2(p, c.mean, c.cov));
    const total = weighted.reduce((s, w) => s + w, 0);
    logLik += Math.log(total + 1e-300);
    resp.push(total > 0 ? weighted.map((w) => w / total) : comps.map(() => 1 / comps.length));
  }
  return { resp, logLik };
}

/** M-step: re-fit each component from responsibility-weighted data. */
export function mStep(points: Pt[], resp: number[][], k: number): Component[] {
  const n = points.length;
  const comps: Component[] = [];
  for (let j = 0; j < k; j++) {
    let nk = 0;
    for (let i = 0; i < n; i++) nk += resp[i][j];
    const safe = nk || 1e-12;
    let mx = 0;
    let my = 0;
    for (let i = 0; i < n; i++) {
      mx += resp[i][j] * points[i].x;
      my += resp[i][j] * points[i].y;
    }
    mx /= safe;
    my /= safe;
    let sxx = 0;
    let sxy = 0;
    let syy = 0;
    for (let i = 0; i < n; i++) {
      const dx = points[i].x - mx;
      const dy = points[i].y - my;
      sxx += resp[i][j] * dx * dx;
      sxy += resp[i][j] * dx * dy;
      syy += resp[i][j] * dy * dy;
    }
    comps.push({
      mean: { x: mx, y: my },
      cov: [sxx / safe + EPS, sxy / safe, syy / safe + EPS],
      weight: nk / n,
    });
  }
  return comps;
}

/**
 * One EM iteration: E-step on the current components, M-step to refit them,
 * then an E-step on the *new* components so `resp` and `logLik` both describe
 * the state we return. EM guarantees this log-likelihood never decreases.
 */
export function step(points: Pt[], state: GmmState): GmmState {
  const { resp } = eStep(points, state.comps);
  const comps = mStep(points, resp, state.comps.length);
  const after = eStep(points, comps);
  return { comps, resp: after.resp, logLik: after.logLik, iteration: state.iteration + 1 };
}

/** Eigen-decomposition of a symmetric 2×2 [a b; b c]: axis lengths² and tilt. */
export function eigen2x2(a: number, b: number, c: number): { l1: number; l2: number; angle: number } {
  const tr = a + c;
  const disc = Math.sqrt(Math.max(0, (tr * tr) / 4 - (a * c - b * b)));
  const l1 = tr / 2 + disc;
  const l2 = tr / 2 - disc;
  let angle: number;
  if (Math.abs(b) > 1e-12) angle = Math.atan2(l1 - a, b);
  else angle = a >= c ? 0 : Math.PI / 2;
  return { l1, l2, angle };
}

export type DatasetId = "blobs" | "overlap" | "aniso" | "moons";

export const DATASETS: Record<DatasetId, string> = {
  blobs: "3 blobs",
  overlap: "Overlapping",
  aniso: "Stretched",
  moons: "Two moons",
};

export function makeDataset(id: DatasetId, w: number, h: number, rng: () => number = Math.random): Pt[] {
  const pts: Pt[] = [];
  const g = () => {
    const u = rng() || 1e-9;
    const v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const clamp = (p: Pt): Pt => ({
    x: Math.max(15, Math.min(w - 15, p.x)),
    y: Math.max(15, Math.min(h - 15, p.y)),
  });
  if (id === "blobs") {
    const centers = [
      { x: w * 0.27, y: h * 0.32 },
      { x: w * 0.72, y: h * 0.28 },
      { x: w * 0.5, y: h * 0.72 },
    ];
    for (const c of centers)
      for (let i = 0; i < 70; i++) pts.push(clamp({ x: c.x + g() * w * 0.05, y: c.y + g() * h * 0.06 }));
  } else if (id === "overlap") {
    const centers = [
      { x: w * 0.42, y: h * 0.45 },
      { x: w * 0.58, y: h * 0.55 },
    ];
    for (const c of centers)
      for (let i = 0; i < 100; i++) pts.push(clamp({ x: c.x + g() * w * 0.1, y: c.y + g() * h * 0.11 }));
  } else if (id === "aniso") {
    // two tilted, stretched clouds
    for (let i = 0; i < 110; i++) {
      const t = g() * w * 0.16;
      const s = g() * h * 0.03;
      pts.push(clamp({ x: w * 0.4 + t, y: h * 0.35 + t * 0.5 + s }));
    }
    for (let i = 0; i < 110; i++) {
      const t = g() * w * 0.14;
      const s = g() * h * 0.03;
      pts.push(clamp({ x: w * 0.55 + t, y: h * 0.72 - t * 0.6 + s }));
    }
  } else {
    const cx = w * 0.5;
    const cy = h * 0.5;
    const R = Math.min(w, h) * 0.28;
    for (let i = 0; i < 120; i++) {
      const a = rng() * Math.PI;
      pts.push(clamp({ x: cx - R * 0.5 + Math.cos(a) * R + g() * 10, y: cy - R * 0.25 + Math.sin(a) * R + g() * 10 }));
    }
    for (let i = 0; i < 120; i++) {
      const a = rng() * Math.PI;
      pts.push(clamp({ x: cx + R * 0.5 + Math.cos(a) * R + g() * 10, y: cy + R * 0.25 - Math.sin(a) * R + g() * 10 }));
    }
  }
  return pts;
}
