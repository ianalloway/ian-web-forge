// Principal component analysis in 2-D. PCA finds the orthogonal directions along
// which a cloud of points varies most: the first principal component is the axis
// of greatest variance, the second is perpendicular to it. They are the
// eigenvectors of the covariance matrix, and each eigenvalue is exactly the
// variance of the data projected onto its eigenvector — so the share of total
// variance λ₁/(λ₁+λ₂) says how much a 1-D projection onto PC1 keeps.

export interface Pt {
  x: number;
  y: number;
}

export function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(rng: () => number): number {
  const u = rng() || 1e-9;
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function mean(points: Pt[]): Pt {
  if (!points.length) return { x: 0, y: 0 };
  let x = 0;
  let y = 0;
  for (const p of points) {
    x += p.x;
    y += p.y;
  }
  return { x: x / points.length, y: y / points.length };
}

/** Population covariance [σxx, σxy, σyy] about the data mean. */
export function covariance(points: Pt[]): [number, number, number] {
  const m = mean(points);
  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (const p of points) {
    const dx = p.x - m.x;
    const dy = p.y - m.y;
    sxx += dx * dx;
    sxy += dx * dy;
    syy += dy * dy;
  }
  const n = points.length || 1;
  return [sxx / n, sxy / n, syy / n];
}

export interface Axes {
  l1: number; // variance along PC1 (≥ l2 ≥ 0 for a covariance)
  l2: number;
  v1: [number, number]; // unit eigenvector of PC1
  v2: [number, number];
  angle: number; // orientation of PC1
}

/** Eigen-decomposition of a symmetric 2×2 [a b; b c] with unit eigenvectors. */
export function eigenAxes(a: number, b: number, c: number): Axes {
  const tr = a + c;
  const disc = Math.sqrt(Math.max(0, (tr * tr) / 4 - (a * c - b * b)));
  const l1 = tr / 2 + disc;
  const l2 = tr / 2 - disc;
  // eigenvector for l1: solves (a-l1)x + b y = 0  → direction (b, l1-a)
  let vx: number;
  let vy: number;
  if (Math.abs(b) > 1e-12) {
    vx = b;
    vy = l1 - a;
  } else {
    // already diagonal: pick the dominant axis
    vx = a >= c ? 1 : 0;
    vy = a >= c ? 0 : 1;
  }
  const n = Math.hypot(vx, vy) || 1;
  const v1: [number, number] = [vx / n, vy / n];
  const v2: [number, number] = [-v1[1], v1[0]];
  return { l1, l2, v1, v2, angle: Math.atan2(v1[1], v1[0]) };
}

export interface PcaResult extends Axes {
  mean: Pt;
  varExplained: number; // share of total variance kept by PC1
}

export function pca(points: Pt[]): PcaResult {
  const [a, b, c] = covariance(points);
  const axes = eigenAxes(a, b, c);
  const total = axes.l1 + axes.l2;
  return { ...axes, mean: mean(points), varExplained: total > 0 ? axes.l1 / total : 0 };
}

/** Signed coordinate of each point along a unit axis through the mean. */
export function project(points: Pt[], m: Pt, axis: [number, number]): number[] {
  return points.map((p) => (p.x - m.x) * axis[0] + (p.y - m.y) * axis[1]);
}

/** Variance of a list of scalars. */
export function variance(xs: number[]): number {
  if (!xs.length) return 0;
  const mu = xs.reduce((s, v) => s + v, 0) / xs.length;
  return xs.reduce((s, v) => s + (v - mu) ** 2, 0) / xs.length;
}

export type DatasetId = "tilted" | "round" | "wide" | "two";

export const DATASETS: Record<DatasetId, string> = {
  tilted: "Correlated",
  round: "Isotropic",
  wide: "Stretched",
  two: "Two blobs",
};

export function makeDataset(id: DatasetId, w: number, h: number, rng: () => number = Math.random): Pt[] {
  const pts: Pt[] = [];
  const cx = w / 2;
  const cy = h / 2;
  const s = Math.min(w, h);
  const clamp = (p: Pt): Pt => ({ x: Math.max(14, Math.min(w - 14, p.x)), y: Math.max(14, Math.min(h - 14, p.y)) });
  if (id === "tilted") {
    for (let i = 0; i < 200; i++) {
      const t = gauss(rng) * s * 0.22;
      const u = gauss(rng) * s * 0.05;
      pts.push(clamp({ x: cx + t - u, y: cy + t * 0.6 + u }));
    }
  } else if (id === "round") {
    for (let i = 0; i < 200; i++) pts.push(clamp({ x: cx + gauss(rng) * s * 0.16, y: cy + gauss(rng) * s * 0.16 }));
  } else if (id === "wide") {
    for (let i = 0; i < 200; i++) pts.push(clamp({ x: cx + gauss(rng) * s * 0.3, y: cy + gauss(rng) * s * 0.07 }));
  } else {
    for (let i = 0; i < 110; i++) pts.push(clamp({ x: cx - s * 0.16 + gauss(rng) * s * 0.06, y: cy - s * 0.1 + gauss(rng) * s * 0.06 }));
    for (let i = 0; i < 110; i++) pts.push(clamp({ x: cx + s * 0.16 + gauss(rng) * s * 0.06, y: cy + s * 0.1 + gauss(rng) * s * 0.06 }));
  }
  return pts;
}
