// Metropolis-Hastings: sampling a distribution you can only score, never solve.
//
// The chain proposes a nearby point, then accepts it with probability
//
//   min(1, p(proposed) / p(current))
//
// Every uphill move is taken; downhill moves are taken in proportion to how much
// worse they are. That one rule is enough to make the chain's visits converge to
// the target distribution itself — no normalising constant, no integral, no
// inverse CDF. It is how Bayesian posteriors get sampled in practice.
//
// The page it drives is really about one tradeoff: the proposal width. Too small
// and almost everything is accepted but the chain crawls; too large and almost
// everything is rejected so the chain stands still. Both look busy and neither
// explores, which is why acceptance rate alone is a liar and effective sample
// size is the number that matters.

export interface Target {
  id: string;
  label: string;
  note: string;
  // Unnormalised log density. Working in logs keeps the tails representable.
  logDensity: (x: number, y: number) => number;
  start: [number, number];
}

const SQ = (v: number) => v * v;

export const TARGETS: Target[] = [
  {
    id: "bimodal",
    label: "two modes",
    note: "two separated peaks — a small proposal gets trapped in whichever it found first",
    logDensity: (x, y) => {
      const a = -(SQ(x + 1.4) + SQ(y + 0.8)) / (2 * 0.16);
      const b = -(SQ(x - 1.5) + SQ(y - 1.0)) / (2 * 0.25);
      return logSumExp(a, b - 0.2);
    },
    start: [-1.4, -0.8],
  },
  {
    id: "banana",
    label: "banana",
    note: "a curved ridge — no single proposal width fits both its length and its width",
    logDensity: (x, y) => -SQ(x) / 2 - SQ(y - 0.6 * (SQ(x) - 2)) / (2 * 0.09),
    start: [0, -1.2],
  },
  {
    id: "ring",
    label: "ring",
    note: "density on a circle — the chain has to travel around, never across",
    logDensity: (x, y) => -SQ(Math.sqrt(SQ(x) + SQ(y)) - 1.7) / (2 * 0.04),
    start: [1.7, 0],
  },
  {
    id: "funnel",
    label: "funnel",
    note: "Neal's funnel: the scale changes with position, so no fixed proposal works anywhere but one height",
    logDensity: (x, y) => {
      const v = Math.max(-9, Math.min(9, y));
      return -SQ(v) / (2 * 1.2) - v / 2 - SQ(x) / (2 * Math.exp(v) + 1e-9);
    },
    start: [0, 0],
  },
];

function logSumExp(a: number, b: number): number {
  const m = Math.max(a, b);
  return m + Math.log(Math.exp(a - m) + Math.exp(b - m));
}

export const DOMAIN = { x0: -3.4, x1: 3.4, y0: -3.4, y1: 3.4 };

export interface Chain {
  x: number;
  y: number;
  logp: number;
  proposals: number; // total proposed moves
  accepts: number;
  trace: number[]; // x coordinate over time, for the trace plot and ESS
  path: [number, number][]; // recent positions, for drawing
  lastRejected: [number, number] | null;
  histogram: Float64Array; // marginal in x, filled after burn-in
  histCount: number;
}

export const HIST_BINS = 64;
export const MAX_TRACE = 4000;
export const MAX_PATH = 600;
export const BURN_IN = 200; // samples dropped before the histogram starts

export function newChain(target: Target): Chain {
  const [x, y] = target.start;
  return {
    x,
    y,
    logp: target.logDensity(x, y),
    proposals: 0,
    accepts: 0,
    trace: [],
    path: [[x, y]],
    lastRejected: null,
    histogram: new Float64Array(HIST_BINS),
    histCount: 0,
  };
}

// Box-Muller: the proposal is an isotropic Gaussian centred on where we stand.
function gauss(): number {
  let u = 0;
  while (u === 0) u = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random());
}

export interface StepResult {
  proposed: [number, number];
  accepted: boolean;
}

export function step(chain: Chain, target: Target, sigma: number): StepResult {
  const px = chain.x + gauss() * sigma;
  const py = chain.y + gauss() * sigma;
  const plogp = target.logDensity(px, py);

  // A symmetric proposal cancels out of the ratio, leaving the density alone to
  // decide. Comparing in logs, log(u) < logp' - logp.
  const accepted = plogp >= chain.logp || Math.log(Math.random()) < plogp - chain.logp;

  chain.proposals++;
  if (accepted) {
    chain.accepts++;
    chain.x = px;
    chain.y = py;
    chain.logp = plogp;
    chain.lastRejected = null;
  } else {
    chain.lastRejected = [px, py];
  }

  // A rejection still produces a sample: the chain stays where it is and that
  // position counts again. Dropping repeats would bias the answer.
  chain.trace.push(chain.x);
  if (chain.trace.length > MAX_TRACE) chain.trace.shift();
  chain.path.push([chain.x, chain.y]);
  if (chain.path.length > MAX_PATH) chain.path.shift();

  if (chain.proposals > BURN_IN) {
    const bin = Math.floor(((chain.x - DOMAIN.x0) / (DOMAIN.x1 - DOMAIN.x0)) * HIST_BINS);
    if (bin >= 0 && bin < HIST_BINS) {
      chain.histogram[bin]++;
      chain.histCount++;
    }
  }

  return { proposed: [px, py], accepted };
}

export function acceptRate(chain: Chain): number {
  return chain.proposals === 0 ? 0 : chain.accepts / chain.proposals;
}

// Effective sample size from the trace's autocorrelation, summed by Geyer's
// initial positive sequence rule. Correlated draws carry less information than
// independent ones: 10,000 samples at ESS 40 is 40 samples' worth of answer.
export function effectiveSampleSize(trace: number[]): number {
  const n = trace.length;
  if (n < 30) return 0;
  let mean = 0;
  for (const v of trace) mean += v;
  mean /= n;
  let var0 = 0;
  for (const v of trace) var0 += SQ(v - mean);
  var0 /= n;
  if (var0 <= 1e-12) return 1;

  const maxLag = Math.min(400, Math.floor(n / 4));
  let sum = 0;
  let prev = 1;
  for (let lag = 1; lag < maxLag; lag++) {
    let c = 0;
    for (let i = lag; i < n; i++) c += (trace[i] - mean) * (trace[i - lag] - mean);
    const rho = c / (n - lag) / var0;
    // Stop once consecutive lags stop contributing — beyond that it is noise.
    if (rho + prev <= 0) break;
    sum += rho;
    prev = rho;
  }
  return Math.max(1, n / (1 + 2 * sum));
}

// ── Reference surfaces ──────────────────────────────────────────────────────

// The true density on a grid, normalised to its peak, for the background
// heatmap. This is what the chain is trying to reproduce by wandering.
export function densityGrid(target: Target, nx: number, ny: number): Float32Array {
  const grid = new Float32Array(nx * ny);
  let max = -Infinity;
  for (let j = 0; j < ny; j++) {
    const y = DOMAIN.y0 + ((j + 0.5) / ny) * (DOMAIN.y1 - DOMAIN.y0);
    for (let i = 0; i < nx; i++) {
      const x = DOMAIN.x0 + ((i + 0.5) / nx) * (DOMAIN.x1 - DOMAIN.x0);
      const v = target.logDensity(x, y);
      grid[j * nx + i] = v;
      if (v > max) max = v;
    }
  }
  for (let k = 0; k < grid.length; k++) grid[k] = Math.exp(grid[k] - max);
  return grid;
}

// The true marginal in x, by numerically integrating out y — the curve the
// sample histogram should converge to.
export function trueMarginal(target: Target, bins: number): Float64Array {
  const out = new Float64Array(bins);
  const steps = 400;
  let max = 0;
  for (let b = 0; b < bins; b++) {
    const x = DOMAIN.x0 + ((b + 0.5) / bins) * (DOMAIN.x1 - DOMAIN.x0);
    let acc = 0;
    for (let s = 0; s < steps; s++) {
      const y = DOMAIN.y0 + ((s + 0.5) / steps) * (DOMAIN.y1 - DOMAIN.y0);
      acc += Math.exp(target.logDensity(x, y));
    }
    out[b] = acc;
    if (acc > max) max = acc;
  }
  if (max > 0) for (let b = 0; b < bins; b++) out[b] /= max;
  return out;
}
