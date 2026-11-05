// The arithmetic behind a binary classifier's threshold: two overlapping score
// distributions (one per class), a line you slide through them, and the ROC and
// precision–recall curves that line traces out.
//
// Everything is computed from a sampled validation set so the curves are the
// real step functions a finite sample gives you, not idealised smooth ones.

export interface Sample {
  score: number;
  label: 0 | 1;
}

/** Deterministic PRNG (mulberry32) so a seed reproduces a dataset exactly. */
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

export interface SampleParams {
  n: number; // total samples drawn
  prior: number; // P(label = 1), the class balance
  separation: number; // gap between the two class means, in σ
  sigma: number; // shared standard deviation of each class
}

/** Draw a labelled validation set: negatives ~ N(0,σ²), positives ~ N(sep,σ²). */
export function sampleScores(p: SampleParams, rng: () => number = Math.random): Sample[] {
  const out: Sample[] = [];
  for (let i = 0; i < p.n; i++) {
    const label: 0 | 1 = rng() < p.prior ? 1 : 0;
    const mu = label === 1 ? p.separation : 0;
    out.push({ score: mu + gauss(rng) * p.sigma, label });
  }
  return out;
}

export interface Confusion {
  tp: number;
  fp: number;
  fn: number;
  tn: number;
}

/** Predict positive when score ≥ threshold, and tally against the truth. */
export function confusionAt(samples: Sample[], threshold: number): Confusion {
  let tp = 0;
  let fp = 0;
  let fn = 0;
  let tn = 0;
  for (const s of samples) {
    const pred = s.score >= threshold;
    if (s.label === 1) pred ? tp++ : fn++;
    else pred ? fp++ : tn++;
  }
  return { tp, fp, fn, tn };
}

export const recall = (c: Confusion): number => (c.tp + c.fn ? c.tp / (c.tp + c.fn) : 0);
export const fallout = (c: Confusion): number => (c.fp + c.tn ? c.fp / (c.fp + c.tn) : 0);
// With nothing predicted positive, precision is conventionally 1 (no false alarms yet).
export const precision = (c: Confusion): number => (c.tp + c.fp ? c.tp / (c.tp + c.fp) : 1);
export const f1 = (c: Confusion): number => {
  const p = precision(c);
  const r = recall(c);
  return p + r ? (2 * p * r) / (p + r) : 0;
};
export const accuracy = (c: Confusion): number => {
  const n = c.tp + c.fp + c.fn + c.tn;
  return n ? (c.tp + c.tn) / n : 0;
};

export interface RocPoint {
  fpr: number;
  tpr: number;
  threshold: number;
}

/** The ROC curve, swept from classify-nothing-positive to classify-everything. */
export function rocCurve(samples: Sample[]): RocPoint[] {
  const sorted = [...samples].sort((a, b) => b.score - a.score);
  const P = samples.reduce((n, s) => n + s.label, 0);
  const N = samples.length - P;
  const pts: RocPoint[] = [{ fpr: 0, tpr: 0, threshold: Infinity }];
  let tp = 0;
  let fp = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].label === 1) tp++;
    else fp++;
    // Only emit a point once every sample at this score has been consumed,
    // so tied scores collapse to a single operating point.
    if (i === sorted.length - 1 || sorted[i + 1].score !== sorted[i].score) {
      pts.push({ fpr: N ? fp / N : 0, tpr: P ? tp / P : 0, threshold: sorted[i].score });
    }
  }
  return pts;
}

/** Area under a curve given as points, by the trapezoid rule over ascending x. */
export function auc(points: RocPoint[]): number {
  const pts = [...points].sort((a, b) => a.fpr - b.fpr || a.tpr - b.tpr);
  let area = 0;
  for (let i = 1; i < pts.length; i++) {
    area += (pts[i].fpr - pts[i - 1].fpr) * ((pts[i].tpr + pts[i - 1].tpr) / 2);
  }
  return area;
}

export interface PrPoint {
  recall: number;
  precision: number;
  threshold: number;
}

export function prCurve(samples: Sample[]): PrPoint[] {
  const sorted = [...samples].sort((a, b) => b.score - a.score);
  const P = samples.reduce((n, s) => n + s.label, 0);
  const pts: PrPoint[] = [];
  let tp = 0;
  let fp = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].label === 1) tp++;
    else fp++;
    if (i === sorted.length - 1 || sorted[i + 1].score !== sorted[i].score) {
      pts.push({
        recall: P ? tp / P : 0,
        precision: tp + fp ? tp / (tp + fp) : 1,
        threshold: sorted[i].score,
      });
    }
  }
  return pts;
}

/** Average precision: the PR curve's area, summed as rectangles over recall gains. */
export function averagePrecision(samples: Sample[]): number {
  const pts = prCurve(samples);
  let ap = 0;
  let prev = 0;
  for (const p of pts) {
    ap += (p.recall - prev) * p.precision;
    prev = p.recall;
  }
  return ap;
}

/** The threshold maximising F1 over the sampled operating points. */
export function bestF1Threshold(samples: Sample[]): number {
  let best = Infinity;
  let bestF1 = -1;
  for (const s of samples) {
    const score = f1(confusionAt(samples, s.score));
    if (score > bestF1) {
      bestF1 = score;
      best = s.score;
    }
  }
  return best;
}
