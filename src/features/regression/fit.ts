export interface Point {
  x: number; // canvas coords
  y: number;
}

/**
 * Least-squares polynomial fit of the given degree.
 * x values are normalized to [-1, 1] before building the normal equations
 * so high degrees stay numerically stable. Returns a predict function in
 * the original coordinate space, or null when underdetermined.
 */
export function polyFit(
  points: Point[],
  degree: number
): ((x: number) => number) | null {
  const n = points.length;
  if (n === 0 || n < degree + 1) return null;

  const xs = points.map((p) => p.x);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const span = maxX - minX || 1;
  const norm = (x: number) => (2 * (x - minX)) / span - 1;

  const m = degree + 1;

  // Normal equations: (VᵀV) c = Vᵀy with V the Vandermonde matrix
  const ata: number[][] = Array.from({ length: m }, () => new Array<number>(m).fill(0));
  const aty = new Array<number>(m).fill(0);

  for (const p of points) {
    const t = norm(p.x);
    const powers = new Array<number>(m);
    powers[0] = 1;
    for (let j = 1; j < m; j++) powers[j] = powers[j - 1] * t;
    for (let r = 0; r < m; r++) {
      aty[r] += powers[r] * p.y;
      for (let c = r; c < m; c++) ata[r][c] += powers[r] * powers[c];
    }
  }
  // Mirror the symmetric lower triangle
  for (let r = 1; r < m; r++) {
    for (let c = 0; c < r; c++) ata[r][c] = ata[c][r];
  }

  const coeffs = solve(ata, aty);
  if (!coeffs) return null;

  return (x: number) => {
    const t = norm(x);
    let acc = 0;
    let pow = 1;
    for (let j = 0; j < m; j++) {
      acc += coeffs[j] * pow;
      pow *= t;
    }
    return acc;
  };
}

/** Gaussian elimination with partial pivoting; null if singular. */
function solve(a: number[][], b: number[]): number[] | null {
  const n = b.length;
  const A = a.map((row) => [...row]);
  const B = [...b];

  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(A[r][col]) > Math.abs(A[pivot][col])) pivot = r;
    }
    if (Math.abs(A[pivot][col]) < 1e-12) return null;
    [A[col], A[pivot]] = [A[pivot], A[col]];
    [B[col], B[pivot]] = [B[pivot], B[col]];

    for (let r = col + 1; r < n; r++) {
      const f = A[r][col] / A[col][col];
      for (let c = col; c < n; c++) A[r][c] -= f * A[col][c];
      B[r] -= f * B[col];
    }
  }

  const x = new Array<number>(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let sum = B[r];
    for (let c = r + 1; c < n; c++) sum -= A[r][c] * x[c];
    x[r] = sum / A[r][r];
  }
  return x;
}

export interface FitStats {
  r2: number;
  rmse: number;
}

export function fitStats(points: Point[], predict: (x: number) => number): FitStats {
  const n = points.length;
  if (n === 0) return { r2: 0, rmse: 0 };
  const meanY = points.reduce((s, p) => s + p.y, 0) / n;
  let ssRes = 0;
  let ssTot = 0;
  for (const p of points) {
    const e = p.y - predict(p.x);
    ssRes += e * e;
    const d = p.y - meanY;
    ssTot += d * d;
  }
  const r2 = ssTot < 1e-12 ? 1 : 1 - ssRes / ssTot;
  return { r2, rmse: Math.sqrt(ssRes / n) };
}

export type PresetId = "linear" | "curve" | "wave" | "outliers";

export const PRESETS: Record<PresetId, string> = {
  linear: "Linear + noise",
  curve: "Quadratic",
  wave: "Sine wave",
  outliers: "With outliers",
};

export function makePreset(id: PresetId, w: number, h: number): Point[] {
  const points: Point[] = [];
  const n = 24;
  const margin = 60;
  const usableW = w - margin * 2;
  const midY = h / 2;
  const rnd = (amp: number) => (Math.random() - 0.5) * amp;

  for (let i = 0; i < n; i++) {
    const fx = i / (n - 1);
    const x = margin + fx * usableW;
    let y: number;
    switch (id) {
      case "linear":
        y = h * 0.75 - fx * h * 0.5 + rnd(h * 0.12);
        break;
      case "curve":
        y = h * 0.25 + Math.pow(fx - 0.5, 2) * h * 1.8 + rnd(h * 0.08);
        break;
      case "wave":
        y = midY + Math.sin(fx * Math.PI * 2.5) * h * 0.25 + rnd(h * 0.07);
        break;
      case "outliers":
        y = h * 0.7 - fx * h * 0.4 + rnd(h * 0.06);
        if (i % 7 === 3) y -= h * 0.35; // plant outliers
        break;
    }
    points.push({ x, y: Math.max(20, Math.min(h - 20, y)) });
  }
  return points;
}
