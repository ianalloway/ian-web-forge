// Calibration: does a classifier's confidence mean what it says? A model is
// calibrated when, among the cases it calls 70% likely, about 70% really happen.
// The reliability diagram plots predicted probability against observed frequency;
// perfect calibration sits on the diagonal, and the gap to it is the error that
// Brier score, ECE and log loss each summarise differently.
//
// Each sample carries a latent true log-odds z (outcome y ~ Bernoulli(σ(z))).
// The model's reported probability is σ(confidence·z + bias): confidence > 1 is
// overconfident (probabilities pushed toward 0/1), < 1 underconfident. Temperature
// scaling divides the logits by a single fitted T to pull the curve back.

export interface Sample {
  z: number; // true log-odds; true probability is σ(z)
  y: 0 | 1; // realised outcome
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

export const sigmoid = (x: number): number => 1 / (1 + Math.exp(-x));
export const logit = (p: number): number => {
  const q = Math.min(1 - 1e-7, Math.max(1e-7, p));
  return Math.log(q / (1 - q));
};

/** Draw n samples whose true log-odds spread by `spread` (bigger = easier). */
export function makeDataset(n: number, spread: number, rng: () => number = Math.random): Sample[] {
  const out: Sample[] = [];
  for (let i = 0; i < n; i++) {
    const z = gauss(rng) * spread;
    out.push({ z, y: rng() < sigmoid(z) ? 1 : 0 });
  }
  return out;
}

/** The model's reported probability for a sample under a confidence/bias distortion. */
export const predict = (s: Sample, confidence: number, bias: number): number =>
  sigmoid(confidence * s.z + bias);

export interface Bin {
  lo: number;
  hi: number;
  count: number;
  meanPred: number; // average predicted probability in the bin
  obsFreq: number; // fraction of positives in the bin
  pos: number;
}

/** Group predictions into `bins` equal-width probability bins for the diagram. */
export function reliability(preds: number[], ys: number[], bins = 12): Bin[] {
  const out: Bin[] = [];
  for (let b = 0; b < bins; b++) {
    const lo = b / bins;
    const hi = (b + 1) / bins;
    let count = 0;
    let sumP = 0;
    let pos = 0;
    for (let i = 0; i < preds.length; i++) {
      const p = preds[i];
      // last bin is closed on the right so p === 1 lands somewhere
      if (p >= lo && (p < hi || (b === bins - 1 && p <= hi))) {
        count++;
        sumP += p;
        pos += ys[i];
      }
    }
    out.push({ lo, hi, count, meanPred: count ? sumP / count : 0, obsFreq: count ? pos / count : 0, pos });
  }
  return out;
}

export const brier = (preds: number[], ys: number[]): number =>
  preds.length ? preds.reduce((s, p, i) => s + (p - ys[i]) ** 2, 0) / preds.length : 0;

export function logLoss(preds: number[], ys: number[]): number {
  if (!preds.length) return 0;
  let s = 0;
  for (let i = 0; i < preds.length; i++) {
    const p = Math.min(1 - 1e-12, Math.max(1e-12, preds[i]));
    s += ys[i] ? -Math.log(p) : -Math.log(1 - p);
  }
  return s / preds.length;
}

export const accuracy = (preds: number[], ys: number[]): number =>
  preds.length ? preds.reduce((s, p, i) => s + ((p >= 0.5 ? 1 : 0) === ys[i] ? 1 : 0), 0) / preds.length : 0;

/** Expected calibration error: count-weighted mean gap between the diagram's points and the diagonal. */
export function ece(bins: Bin[], total: number): number {
  if (!total) return 0;
  let e = 0;
  for (const b of bins) e += (b.count / total) * Math.abs(b.meanPred - b.obsFreq);
  return e;
}

/** Maximum calibration error: the worst single-bin gap. */
export function mce(bins: Bin[]): number {
  let m = 0;
  for (const b of bins) if (b.count > 0) m = Math.max(m, Math.abs(b.meanPred - b.obsFreq));
  return m;
}

/**
 * Fit a single temperature T>0 that minimises log loss of σ(logit/T). The
 * objective is convex in T, so a golden-section search over log-T finds it.
 */
export function fitTemperature(logits: number[], ys: number[]): number {
  const loss = (T: number): number => {
    let s = 0;
    for (let i = 0; i < logits.length; i++) {
      const p = Math.min(1 - 1e-12, Math.max(1e-12, sigmoid(logits[i] / T)));
      s += ys[i] ? -Math.log(p) : -Math.log(1 - p);
    }
    return s;
  };
  const phi = (Math.sqrt(5) - 1) / 2;
  let a = Math.log(0.05);
  let b = Math.log(20);
  let c = b - phi * (b - a);
  let d = a + phi * (b - a);
  let fc = loss(Math.exp(c));
  let fd = loss(Math.exp(d));
  for (let i = 0; i < 80; i++) {
    if (fc < fd) {
      b = d;
      d = c;
      fd = fc;
      c = b - phi * (b - a);
      fc = loss(Math.exp(c));
    } else {
      a = c;
      c = d;
      fc = fd;
      d = a + phi * (b - a);
      fd = loss(Math.exp(d));
    }
  }
  return Math.exp((a + b) / 2);
}
