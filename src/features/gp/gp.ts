// Gaussian process regression: fitting a distribution over functions.
//
// A polynomial fit picks one curve and reports it as the answer. A GP starts
// from every function the kernel considers plausible and conditions that whole
// collection on the data, which leaves a mean curve and — the point of the
// exercise — an honest error bar that pinches shut at the observations and
// flares out wherever nothing has been measured.
//
// All of it is one identity. Writing A = K(X,X) + σₙ²I for the observed
// covariance and K* = K(X, x*) for the covariance between the data and a test
// point,
//
//   mean(x*) = K*ᵀ A⁻¹ y
//   var(x*)  = k(x*,x*) − K*ᵀ A⁻¹ K*
//
// The variance never looks at y: where the model is uncertain depends on where
// you sampled, not on what you found there.
//
// The kernel is the modelling choice. It says what "nearby" means, and every
// curve on screen is a consequence of it.

export interface KernelParams {
  lengthscale: number; // how far a wiggle reaches
  amplitude: number; // prior standard deviation of the function
  noise: number; // observation noise, σₙ
  period: number; // only used by the periodic kernel
}

export const DEFAULT_PARAMS: KernelParams = {
  lengthscale: 1,
  amplitude: 1.2,
  noise: 0.15,
  period: 3,
};

export interface Kernel {
  id: string;
  label: string;
  note: string;
  // Covariance between two inputs, given the hyper-parameters.
  k: (a: number, b: number, p: KernelParams) => number;
}

const SQ = (v: number) => v * v;

export const KERNELS: Kernel[] = [
  {
    id: "rbf",
    label: "RBF",
    note: "infinitely smooth — the default, and it assumes more smoothness than most real data has",
    k: (a, b, p) => SQ(p.amplitude) * Math.exp(-SQ(a - b) / (2 * SQ(p.lengthscale))),
  },
  {
    id: "matern32",
    label: "Matérn 3/2",
    note: "rougher and more realistic: the same reach, but the samples are not analytic",
    k: (a, b, p) => {
      const d = (Math.sqrt(3) * Math.abs(a - b)) / p.lengthscale;
      return SQ(p.amplitude) * (1 + d) * Math.exp(-d);
    },
  },
  {
    id: "periodic",
    label: "periodic",
    note: "assumes the pattern repeats, so one observation constrains every period away",
    k: (a, b, p) => {
      const s = Math.sin((Math.PI * Math.abs(a - b)) / p.period);
      return SQ(p.amplitude) * Math.exp((-2 * SQ(s)) / SQ(p.lengthscale));
    },
  },
  {
    id: "linear",
    label: "linear",
    note: "a GP with a linear kernel is just Bayesian linear regression — straight lines, fanning out",
    k: (a, b, p) => SQ(p.amplitude) * (0.35 + (a * b) / SQ(p.lengthscale)),
  },
];

export interface Observation {
  x: number;
  y: number;
}

export const DOMAIN = { x0: -5, x1: 5, y0: -3.2, y1: 3.2 };

// ── Linear algebra ──────────────────────────────────────────────────────────

// Cholesky factorisation, returning lower-triangular L with A = L·Lᵀ, or null
// if the matrix is not positive definite at this jitter level.
export function cholesky(A: number[][], jitter: number): number[][] | null {
  const n = A.length;
  const L: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = A[i][j] + (i === j ? jitter : 0);
      for (let k = 0; k < j; k++) sum -= L[i][k] * L[j][k];
      if (i === j) {
        if (sum <= 0) return null;
        L[i][i] = Math.sqrt(sum);
      } else {
        L[i][j] = sum / L[j][j];
      }
    }
  }
  return L;
}

// Kernel matrices are only barely positive definite once points crowd together,
// so the jitter is raised until the factorisation succeeds rather than letting
// it fail.
export function robustCholesky(A: number[][]): { L: number[][]; jitter: number } | null {
  for (const jitter of [1e-10, 1e-8, 1e-6, 1e-4, 1e-2]) {
    const L = cholesky(A, jitter);
    if (L) return { L, jitter };
  }
  return null;
}

// Solve L·z = b by forward substitution.
export function forwardSolve(L: number[][], b: number[]): number[] {
  const n = L.length;
  const z = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let sum = b[i];
    for (let k = 0; k < i; k++) sum -= L[i][k] * z[k];
    z[i] = sum / L[i][i];
  }
  return z;
}

// Solve Lᵀ·x = z by back substitution.
export function backSolve(L: number[][], z: number[]): number[] {
  const n = L.length;
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = z[i];
    for (let k = i + 1; k < n; k++) sum -= L[k][i] * x[k];
    x[i] = sum / L[i][i];
  }
  return x;
}

// ── Posterior ───────────────────────────────────────────────────────────────

export interface Posterior {
  mean: Float64Array;
  sd: Float64Array;
  logMarginalLikelihood: number; // how well these hyper-parameters explain the data
  samples: number[][]; // functions drawn from the posterior
}

function covariance(xs: number[], ys: number[], kernel: Kernel, p: KernelParams): number[][] {
  return xs.map((a) => ys.map((b) => kernel.k(a, b, p)));
}

// With no data this returns the prior: a flat zero mean and a constant band of
// width `amplitude`, which is worth seeing before any point is placed.
export function posterior(
  obs: Observation[],
  grid: Float64Array,
  kernel: Kernel,
  params: KernelParams,
  sampleCount: number,
  rng: () => number
): Posterior {
  const xs = Array.from(grid);
  const n = obs.length;

  if (n === 0) {
    const mean = new Float64Array(grid.length);
    const sd = new Float64Array(grid.length);
    for (let i = 0; i < grid.length; i++) sd[i] = Math.sqrt(kernel.k(xs[i], xs[i], params));
    const prior = covariance(xs, xs, kernel, params);
    return {
      mean,
      sd,
      logMarginalLikelihood: 0,
      samples: drawSamples(mean, prior, sampleCount, rng),
    };
  }

  const X = obs.map((o) => o.x);
  const y = obs.map((o) => o.y);
  const A = covariance(X, X, kernel, params);
  for (let i = 0; i < n; i++) A[i][i] += SQ(params.noise);

  const chol = robustCholesky(A);
  if (!chol) {
    const mean = new Float64Array(grid.length);
    const sd = new Float64Array(grid.length).fill(params.amplitude);
    return { mean, sd, logMarginalLikelihood: NaN, samples: [] };
  }
  const { L } = chol;

  // alpha = A⁻¹y, computed through the factorisation rather than an inverse.
  const alpha = backSolve(L, forwardSolve(L, y));

  const mean = new Float64Array(grid.length);
  const sd = new Float64Array(grid.length);
  const Kstar: number[][] = []; // one column per test point
  for (let i = 0; i < grid.length; i++) {
    const kstar = X.map((xj) => kernel.k(xs[i], xj, params));
    Kstar.push(kstar);
    let m = 0;
    for (let j = 0; j < n; j++) m += kstar[j] * alpha[j];
    mean[i] = m;

    // var = k** − vᵀv where v = L⁻¹K*, which is what keeps it non-negative.
    const v = forwardSolve(L, kstar);
    let reduction = 0;
    for (let j = 0; j < n; j++) reduction += SQ(v[j]);
    sd[i] = Math.sqrt(Math.max(1e-12, kernel.k(xs[i], xs[i], params) - reduction));
  }

  // log p(y|X) = −½yᵀA⁻¹y − Σlog Lᵢᵢ − n/2·log2π. Maximising it over the
  // hyper-parameters is how a lengthscale gets chosen in practice.
  let quad = 0;
  for (let i = 0; i < n; i++) quad += y[i] * alpha[i];
  let logDet = 0;
  for (let i = 0; i < n; i++) logDet += Math.log(L[i][i]);
  const logML = -0.5 * quad - logDet - (n / 2) * Math.log(2 * Math.PI);

  let samples: number[][] = [];
  if (sampleCount > 0) {
    // Posterior covariance across the grid: K** − K*ᵀA⁻¹K*.
    const Kss = covariance(xs, xs, kernel, params);
    const V = Kstar.map((kstar) => forwardSolve(L, kstar));
    for (let i = 0; i < xs.length; i++) {
      for (let j = 0; j < xs.length; j++) {
        let dot = 0;
        for (let k = 0; k < n; k++) dot += V[i][k] * V[j][k];
        Kss[i][j] -= dot;
      }
    }
    samples = drawSamples(mean, Kss, sampleCount, rng);
  }

  return { mean, sd, logMarginalLikelihood: logML, samples };
}

// Draw functions as mean + L·z with z standard normal: correlated noise shaped
// by the covariance, which is what makes a sample look like a function rather
// than a scribble.
function drawSamples(
  mean: Float64Array,
  cov: number[][],
  count: number,
  rng: () => number
): number[][] {
  if (count <= 0) return [];
  const chol = robustCholesky(cov);
  if (!chol) return [];
  const { L } = chol;
  const n = mean.length;
  const out: number[][] = [];
  for (let s = 0; s < count; s++) {
    const z = new Array(n);
    for (let i = 0; i < n; i++) z[i] = gauss(rng);
    const f = new Array(n);
    for (let i = 0; i < n; i++) {
      let acc = mean[i];
      for (let k = 0; k <= i; k++) acc += L[i][k] * z[k];
      f[i] = acc;
    }
    out.push(f);
  }
  return out;
}

export function gauss(rng: () => number): number {
  let u = 0;
  while (u === 0) u = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Demo data ───────────────────────────────────────────────────────────────

export interface Dataset {
  id: string;
  label: string;
  note: string;
  points: (rng: () => number) => Observation[];
}

export const DATASETS: Dataset[] = [
  {
    id: "wave",
    label: "wave",
    note: "a smooth signal, sampled unevenly — watch the band swell in the gap",
    points: (rng) => {
      const out: Observation[] = [];
      for (const x of [-4.4, -3.8, -3.1, -2.6, -2.2, 1.4, 2.0, 2.7, 3.3, 4.1]) {
        out.push({ x, y: Math.sin(x * 1.1) * 1.4 + gauss(rng) * 0.12 });
      }
      return out;
    },
  },
  {
    id: "step",
    label: "step",
    note: "a discontinuity — no stationary kernel can do this well, and the fit shows it",
    points: (rng) => {
      const out: Observation[] = [];
      for (let x = -4.5; x <= 4.5; x += 0.75) {
        out.push({ x, y: (x < 0 ? -1.2 : 1.2) + gauss(rng) * 0.1 });
      }
      return out;
    },
  },
  {
    id: "seasonal",
    label: "seasonal",
    note: "a repeating pattern — the case the periodic kernel was built for",
    points: (rng) => {
      const out: Observation[] = [];
      for (let x = -4.6; x <= 1.5; x += 0.42) {
        out.push({ x, y: Math.sin((2 * Math.PI * x) / 3) * 1.5 + gauss(rng) * 0.15 });
      }
      return out;
    },
  },
  {
    id: "noisy",
    label: "noisy",
    note: "a straight trend buried in noise — turn σₙ down and watch the mean chase it",
    points: (rng) => {
      const out: Observation[] = [];
      for (let x = -4.6; x <= 4.6; x += 0.5) {
        out.push({ x, y: x * 0.35 + gauss(rng) * 0.75 });
      }
      return out;
    },
  },
];
