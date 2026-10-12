/**
 * A simulated LLM judge, and the audit battery juryrig runs against one.
 *
 * The set-up is the one every model leaderboard has: a candidate model and a
 * baseline answer the same prompts, and a judge model picks a winner for each
 * pair. Here the ground truth is known — every response has a latent quality,
 * and the better response is the one with the higher quality — so we can see
 * exactly how far the judge's verdicts drift from it, and which audit catches
 * which drift.
 *
 * The judge is a probit model of a pairwise comparison. For the response in
 * slot 1 against the one in slot 2 it forms
 *
 *   z = sharpness · (q₁ − q₂) + positionBias + verbosityBias · ln(len₁ / len₂) + noise · ε
 *
 * and prefers slot 1 when z > 0. Everything except the first term is a way of
 * deciding that has nothing to do with which answer is better.
 *
 * The audit definitions and their default pass/fail lines follow juryrig
 * (github.com/ianalloway/juryrig): position flip rate > 0.20, first-slot skew
 * |p − 0.5| > 0.20, verbosity lift > 0.05, and panel Cohen's κ < 0.40.
 */

export type JudgeConfig = {
  /** How strongly true quality drives the verdict, in logit-ish units. */
  sharpness: number;
  /** Constant push toward whichever response is shown first. */
  positionBias: number;
  /** Push per unit of ln(length₁ / length₂). Positive means longer looks better. */
  verbosityBias: number;
  /** Standard deviation of per-call noise. This is what makes re-runs disagree. */
  noise: number;
  /** Multiplier on the judge's stated confidence. 1 is roughly honest. */
  overconfidence: number;
};

export type MatchupConfig = {
  prompts: number;
  /** Candidate's true mean quality advantage, in standard deviations. */
  qualityGap: number;
  /** Candidate responses are this many times longer than the baseline's, on average. */
  lengthRatio: number;
  /** The naive pipeline always shows the candidate first (a common shortcut). */
  candidateFirst: boolean;
  seed: number;
};

export type Item = {
  qCandidate: number;
  qBaseline: number;
  lenCandidate: number;
  lenBaseline: number;
};

export type Verdict = {
  /** The judge preferred the response in slot 1. */
  slot1Wins: boolean;
  /** The judge's stated probability that its verdict is right, in [0.5, 1). */
  confidence: number;
};

export type Status = "pass" | "flag";

export type AuditRow = {
  id: "position" | "slot" | "verbosity" | "consistency" | "panel" | "calibration";
  label: string;
  value: number;
  /** Human-readable form of the value. */
  display: string;
  threshold: string;
  status: Status;
  note: string;
};

export type ReliabilityBin = {
  lo: number;
  hi: number;
  count: number;
  meanConfidence: number;
  accuracy: number;
};

export type Estimate = {
  id: "naive" | "swap" | "lc";
  label: string;
  rate: number;
  /** Half-width of an approximate 95% interval, where one is meaningful. */
  margin: number | null;
  note: string;
};

export type AuditResult = {
  items: number;
  /** Share of prompts on which the candidate's response really is better. */
  truth: number;
  estimates: Estimate[];
  audits: AuditRow[];
  reliability: ReliabilityBin[];
  /** Single-call accuracy against ground truth, order randomised. */
  accuracy: number;
  /** Share of prompts where the longer response really is the better one. */
  longerTrulyBetter: number;
  /** Share of judgments (both orders) won by the longer response. */
  longerJudgedBetter: number;
  /** Fitted coefficients of the length-controlled model. */
  lcModel: { intercept: number; slot: number; length: number };
};

export const THRESHOLDS = {
  flipRate: 0.2,
  slotSkew: 0.2,
  verbosityLift: 0.05,
  rerunDisagreement: 0.2,
  minKappa: 0.4,
  ece: 0.1,
} as const;

export const PANEL_SIZE = 3;
/** Filler padding applied in the verbosity audit: the padded response is this much longer. */
export const PADDING = 1.6;

// ── randomness ───────────────────────────────────────────────────────────────

/** mulberry32: small, fast, and deterministic, so a seed reproduces a run exactly. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function gaussian(rand: () => number): number {
  // Box-Muller. 1 - u keeps the log away from zero.
  const u = 1 - rand();
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

// ── the world ────────────────────────────────────────────────────────────────

const BASE_LENGTH = 220;
const LENGTH_SPREAD = 0.35;

export function makeItems(m: MatchupConfig): Item[] {
  const rand = rng(m.seed);
  const items: Item[] = [];
  for (let i = 0; i < m.prompts; i++) {
    // Quality and length are drawn independently within each system, so any
    // link the judge finds between length and winning is the judge's own.
    items.push({
      qCandidate: m.qualityGap + gaussian(rand),
      qBaseline: gaussian(rand),
      lenCandidate: BASE_LENGTH * m.lengthRatio * Math.exp(LENGTH_SPREAD * gaussian(rand)),
      lenBaseline: BASE_LENGTH * Math.exp(LENGTH_SPREAD * gaussian(rand)),
    });
  }
  return items;
}

/** The judge's raw preference for slot 1, before noise. */
export function judgeMean(
  j: JudgeConfig,
  q1: number,
  len1: number,
  q2: number,
  len2: number
): number {
  return j.sharpness * (q1 - q2) + j.positionBias + j.verbosityBias * Math.log(len1 / len2);
}

export function verdictFrom(j: JudgeConfig, mean: number, eps: number): Verdict {
  const z = mean + j.noise * eps;
  return { slot1Wins: z > 0, confidence: sigmoid(j.overconfidence * Math.abs(z)) };
}

export function compare(
  j: JudgeConfig,
  q1: number,
  len1: number,
  q2: number,
  len2: number,
  rand: () => number
): Verdict {
  return verdictFrom(j, judgeMean(j, q1, len1, q2, len2), gaussian(rand));
}

// ── statistics ───────────────────────────────────────────────────────────────

/** Cohen's κ for two raters on a binary label. 1 = perfect, 0 = chance. */
export function cohensKappa(a: boolean[], b: boolean[]): number {
  const n = a.length;
  if (n === 0) return 0;
  let agree = 0;
  let aYes = 0;
  let bYes = 0;
  for (let i = 0; i < n; i++) {
    if (a[i] === b[i]) agree++;
    if (a[i]) aYes++;
    if (b[i]) bYes++;
  }
  const po = agree / n;
  const pa = aYes / n;
  const pb = bYes / n;
  const pe = pa * pb + (1 - pa) * (1 - pb);
  // Both raters constant and identical: agreement is total but uninformative.
  if (pe >= 1) return po === 1 ? 1 : 0;
  return (po - pe) / (1 - pe);
}

/** Expected calibration error over equal-width bins on [0.5, 1]. */
export function reliability(
  confidences: number[],
  correct: boolean[],
  bins = 5
): { ece: number; table: ReliabilityBin[] } {
  const table: ReliabilityBin[] = [];
  const width = 0.5 / bins;
  for (let b = 0; b < bins; b++) {
    table.push({ lo: 0.5 + b * width, hi: 0.5 + (b + 1) * width, count: 0, meanConfidence: 0, accuracy: 0 });
  }
  confidences.forEach((c, i) => {
    const b = Math.min(bins - 1, Math.max(0, Math.floor((c - 0.5) / width)));
    const bin = table[b];
    bin.count++;
    bin.meanConfidence += c;
    bin.accuracy += correct[i] ? 1 : 0;
  });
  let ece = 0;
  const n = confidences.length || 1;
  for (const bin of table) {
    if (bin.count === 0) continue;
    bin.meanConfidence /= bin.count;
    bin.accuracy /= bin.count;
    ece += (bin.count / n) * Math.abs(bin.meanConfidence - bin.accuracy);
  }
  return { ece, table };
}

/**
 * Logistic regression by Newton's method (IRLS). Small enough to solve the
 * normal equations directly; a whisper of ridge keeps a separable sample from
 * sending the coefficients to infinity.
 */
export function logisticFit(x: number[][], y: number[], iterations = 30): number[] {
  const k = x[0]?.length ?? 0;
  let beta = new Array(k).fill(0);
  for (let it = 0; it < iterations; it++) {
    const grad = new Array(k).fill(0);
    const hess = Array.from({ length: k }, () => new Array(k).fill(0));
    for (let i = 0; i < x.length; i++) {
      let eta = 0;
      for (let a = 0; a < k; a++) eta += beta[a] * x[i][a];
      const p = sigmoid(eta);
      const w = p * (1 - p);
      for (let a = 0; a < k; a++) {
        grad[a] += (y[i] - p) * x[i][a];
        for (let b = 0; b < k; b++) hess[a][b] += w * x[i][a] * x[i][b];
      }
    }
    for (let a = 0; a < k; a++) {
      grad[a] -= 1e-4 * beta[a];
      hess[a][a] += 1e-4;
    }
    const step = solve(hess, grad);
    beta = beta.map((v, a) => v + step[a]);
    if (Math.max(...step.map(Math.abs)) < 1e-9) break;
  }
  return beta;
}

/** Gaussian elimination with partial pivoting. */
export function solve(a: number[][], b: number[]): number[] {
  const n = b.length;
  const m = a.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let pivot = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(m[r][c]) > Math.abs(m[pivot][c])) pivot = r;
    [m[c], m[pivot]] = [m[pivot], m[c]];
    const d = m[c][c] || 1e-12;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = m[r][c] / d;
      for (let k = c; k <= n; k++) m[r][k] -= f * m[c][k];
    }
  }
  return m.map((row, i) => row[n] / (row[i] || 1e-12));
}

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
const signedPts = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(v * 100).toFixed(1)} pts`;

// ── the audit ────────────────────────────────────────────────────────────────

export function runAudit(j: JudgeConfig, m: MatchupConfig): AuditResult {
  const items = makeItems(m);
  const n = items.length;
  // A separate stream for the judge, so changing the judge never reshuffles the world.
  const rand = rng((m.seed ^ 0x9e3779b9) >>> 0);

  let trulyBetter = 0;
  let naiveWins = 0;
  let swapScore = 0;
  let flips = 0;
  let slot1Wins = 0;
  let longerTrulyBetter = 0;
  let longerJudged = 0;
  let paddedBase = 0;
  let paddedLift = 0;
  let rerunDisagree = 0;
  let correctSingle = 0;
  const confidences: number[] = [];
  const correctness: boolean[] = [];
  const panel: boolean[][] = Array.from({ length: PANEL_SIZE }, () => []);
  const lcX: number[][] = [];
  const lcY: number[] = [];

  for (const it of items) {
    const candidateBetter = it.qCandidate > it.qBaseline;
    if (candidateBetter) trulyBetter++;
    const candidateLonger = it.lenCandidate > it.lenBaseline;
    if (candidateLonger === candidateBetter) longerTrulyBetter++;

    // Both orders. fwd: candidate in slot 1. bwd: baseline in slot 1.
    const fwd = compare(j, it.qCandidate, it.lenCandidate, it.qBaseline, it.lenBaseline, rand);
    const bwd = compare(j, it.qBaseline, it.lenBaseline, it.qCandidate, it.lenCandidate, rand);
    const candFwd = fwd.slot1Wins;
    const candBwd = !bwd.slot1Wins;
    if (candFwd !== candBwd) flips++;
    slot1Wins += (fwd.slot1Wins ? 1 : 0) + (bwd.slot1Wins ? 1 : 0);
    swapScore += candFwd && candBwd ? 1 : !candFwd && !candBwd ? 0 : 0.5;
    longerJudged += (candFwd === candidateLonger ? 1 : 0) + (candBwd === candidateLonger ? 1 : 0);

    const lx = Math.log(it.lenCandidate / it.lenBaseline);
    lcX.push([1, 1, lx]);
    lcY.push(candFwd ? 1 : 0);
    lcX.push([1, -1, lx]);
    lcY.push(candBwd ? 1 : 0);

    // The naive pipeline: one call per prompt.
    const candidateSlot1 = m.candidateFirst || rand() < 0.5;
    const naive = candidateSlot1 ? fwd : bwd;
    const naiveCand = candidateSlot1 ? candFwd : candBwd;
    if (naiveCand) naiveWins++;
    const right = naiveCand === candidateBetter;
    if (right) correctSingle++;
    confidences.push(naive.confidence);
    correctness.push(right);

    // Self-consistency: the identical call again, fresh noise.
    const again = candidateSlot1
      ? compare(j, it.qCandidate, it.lenCandidate, it.qBaseline, it.lenBaseline, rand)
      : compare(j, it.qBaseline, it.lenBaseline, it.qCandidate, it.lenCandidate, rand);
    if (again.slot1Wins !== naive.slot1Wins) rerunDisagree++;

    // Panel: same order, independent noise per panelist.
    for (let p = 0; p < PANEL_SIZE; p++) {
      const v = candidateSlot1
        ? compare(j, it.qCandidate, it.lenCandidate, it.qBaseline, it.lenBaseline, rand)
        : compare(j, it.qBaseline, it.lenBaseline, it.qCandidate, it.lenCandidate, rand);
      panel[p].push(candidateSlot1 ? v.slot1Wins : !v.slot1Wins);
    }

    // Verbosity: pad the weaker response with content-free filler and re-ask,
    // holding the noise draw fixed so the only thing that changed is length.
    // A fair judge's verdict cannot move.
    const weakIsCand = !candidateBetter;
    const qW = weakIsCand ? it.qCandidate : it.qBaseline;
    const lW = weakIsCand ? it.lenCandidate : it.lenBaseline;
    const qS = weakIsCand ? it.qBaseline : it.qCandidate;
    const lS = weakIsCand ? it.lenBaseline : it.lenCandidate;
    for (const weakFirst of [true, false]) {
      const eps = gaussian(rand);
      const plain = weakFirst
        ? verdictFrom(j, judgeMean(j, qW, lW, qS, lS), eps)
        : verdictFrom(j, judgeMean(j, qS, lS, qW, lW), eps);
      const padded = weakFirst
        ? verdictFrom(j, judgeMean(j, qW, lW * PADDING, qS, lS), eps)
        : verdictFrom(j, judgeMean(j, qS, lS, qW, lW * PADDING), eps);
      const plainWin = weakFirst ? plain.slot1Wins : !plain.slot1Wins;
      const paddedWin = weakFirst ? padded.slot1Wins : !padded.slot1Wins;
      paddedBase += plainWin ? 1 : 0;
      paddedLift += (paddedWin ? 1 : 0) - (plainWin ? 1 : 0);
    }
  }

  const truth = trulyBetter / n;
  const naive = naiveWins / n;
  const swap = swapScore / n;
  const beta = logisticFit(lcX, lcY);
  const lc = sigmoid(beta[0]);

  const flipRate = flips / n;
  const firstSlot = slot1Wins / (2 * n);
  const lift = paddedLift / (2 * n);
  const rerun = rerunDisagree / n;
  let kappaSum = 0;
  let pairs = 0;
  for (let a = 0; a < PANEL_SIZE; a++) {
    for (let b = a + 1; b < PANEL_SIZE; b++) {
      kappaSum += cohensKappa(panel[a], panel[b]);
      pairs++;
    }
  }
  const kappa = kappaSum / pairs;
  const { ece, table } = reliability(confidences, correctness);

  const audits: AuditRow[] = [
    {
      id: "position",
      label: "Order flip rate",
      value: flipRate,
      display: pct(flipRate),
      threshold: `≤ ${pct(THRESHOLDS.flipRate)}`,
      status: flipRate > THRESHOLDS.flipRate ? "flag" : "pass",
      note: "Each pair judged in both orders. A flip means the slot, not the content, picked the winner.",
    },
    {
      id: "slot",
      label: "First-slot win rate",
      value: firstSlot,
      display: pct(firstSlot),
      threshold: `50% ± ${(THRESHOLDS.slotSkew * 100).toFixed(0)}`,
      status: Math.abs(firstSlot - 0.5) > THRESHOLDS.slotSkew ? "flag" : "pass",
      note: "Across every judgment in both orders. A fair judge sits at 50%.",
    },
    {
      id: "verbosity",
      label: "Padding lift",
      value: lift,
      display: signedPts(lift),
      threshold: `≤ +${(THRESHOLDS.verbosityLift * 100).toFixed(0)} pts`,
      status: lift > THRESHOLDS.verbosityLift ? "flag" : "pass",
      note: `Weaker answer padded ${PADDING}× with filler, same noise draw. Any change in its win rate is pure length.`,
    },
    {
      id: "consistency",
      label: "Re-run disagreement",
      value: rerun,
      display: pct(rerun),
      threshold: `≤ ${pct(THRESHOLDS.rerunDisagreement)}`,
      status: rerun > THRESHOLDS.rerunDisagreement ? "flag" : "pass",
      note: "The identical call made twice. This is the floor on how reproducible any score built on this judge can be.",
    },
    {
      id: "panel",
      label: `Panel κ (${PANEL_SIZE} judges)`,
      value: kappa,
      display: kappa.toFixed(2),
      threshold: `≥ ${THRESHOLDS.minKappa.toFixed(2)}`,
      status: kappa < THRESHOLDS.minKappa ? "flag" : "pass",
      note: "Mean pairwise Cohen's κ. Shared biases inflate it: judges can agree with each other and all be wrong.",
    },
    {
      id: "calibration",
      label: "Calibration error (ECE)",
      value: ece,
      display: ece.toFixed(3),
      threshold: `≤ ${THRESHOLDS.ece.toFixed(2)}`,
      status: ece > THRESHOLDS.ece ? "flag" : "pass",
      note: "Stated confidence against how often the verdict was actually right.",
    },
  ];

  const se = (p: number) => 1.96 * Math.sqrt((p * (1 - p)) / n);
  const estimates: Estimate[] = [
    {
      id: "naive",
      label: "Naive win rate",
      rate: naive,
      margin: se(naive),
      note: m.candidateFirst ? "One call per prompt, candidate always shown first." : "One call per prompt, order randomised.",
    },
    {
      id: "swap",
      label: "Swap-averaged",
      rate: swap,
      margin: se(swap),
      note: "Both orders; a split verdict counts as a tie. Cancels position bias.",
    },
    {
      id: "lc",
      label: "Length-controlled",
      rate: lc,
      margin: null,
      note: "Logistic fit on slot and log length ratio, read off at equal length and no slot.",
    },
  ];

  return {
    items: n,
    truth,
    estimates,
    audits,
    reliability: table,
    accuracy: correctSingle / n,
    longerTrulyBetter: longerTrulyBetter / n,
    longerJudgedBetter: longerJudged / (2 * n),
    lcModel: { intercept: beta[0], slot: beta[1], length: beta[2] },
  };
}

// ── presets ──────────────────────────────────────────────────────────────────

export type Preset = { id: string; label: string; note: string; judge: JudgeConfig };

export const PRESETS: Preset[] = [
  {
    id: "typical",
    label: "Typical judge",
    note: "Mild slot-1 lean, likes longer answers, a little noisy, sure of itself.",
    judge: { sharpness: 1.4, positionBias: 0.55, verbosityBias: 1.1, noise: 0.9, overconfidence: 2.2 },
  },
  {
    id: "fair",
    label: "Fair judge",
    note: "No position or length preference. Still noisy, because real judges are.",
    judge: { sharpness: 1.6, positionBias: 0, verbosityBias: 0, noise: 0.7, overconfidence: 1.3 },
  },
  {
    id: "slot",
    label: "Slot-1 lover",
    note: "Strong preference for whatever it reads first.",
    judge: { sharpness: 1.2, positionBias: 1.6, verbosityBias: 0.2, noise: 0.8, overconfidence: 1.6 },
  },
  {
    id: "verbose",
    label: "Length-impressed",
    note: "Treats more words as more effort, and more effort as better.",
    judge: { sharpness: 1.2, positionBias: 0.1, verbosityBias: 2.6, noise: 0.8, overconfidence: 1.8 },
  },
  {
    id: "coin",
    label: "Coin flipper",
    note: "Barely reads the answers. Re-runs and panelists disagree constantly.",
    judge: { sharpness: 0.25, positionBias: 0.15, verbosityBias: 0.2, noise: 1.6, overconfidence: 2.5 },
  },
];

export const DEFAULT_MATCHUP: MatchupConfig = {
  prompts: 400,
  qualityGap: 0.15,
  lengthRatio: 1.7,
  candidateFirst: false,
  seed: 724,
};
