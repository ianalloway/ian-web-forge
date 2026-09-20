/**
 * Independent Poisson scoreline model — the classic Dixon–Coles building block.
 *
 * Home goals ~ Poisson(λ_home), away goals ~ Poisson(λ_away), independent.
 * The joint P(i, j) = P_home(i) · P_away(j) is the familiar football scoreline
 * grid used for 1X2 and totals markets. This module is pure math: no DOM, no
 * RNG, no framework.
 */

export interface ScorelineParams {
  /** Expected home goals (λ_home > 0). */
  lambdaHome: number;
  /** Expected away goals (λ_away > 0). */
  lambdaAway: number;
  /** Inclusive max goals per side; grid is (maxGoals+1)². */
  maxGoals: number;
}

export interface ScorelineCell {
  home: number;
  away: number;
  probability: number;
}

export interface ScorelineResult {
  /** Row-major: probs[home * (maxGoals+1) + away]. */
  probs: Float64Array;
  maxGoals: number;
  lambdaHome: number;
  lambdaAway: number;
  /** Mass captured inside the truncated grid (should be ≈ 1 for sane λ). */
  covered: number;
  mostLikely: ScorelineCell;
  homeWin: number;
  draw: number;
  awayWin: number;
  /** P(home + away > 2.5) within the truncated grid, renormalized by covered. */
  over25: number;
  under25: number;
  expectedTotal: number;
}

/** Poisson pmf P(K = k) for k = 0..maxK, via the stable recurrence P(k)=P(k-1)·λ/k. */
export function poissonPmfs(lambda: number, maxK: number): Float64Array {
  const out = new Float64Array(maxK + 1);
  if (!(lambda > 0) || !Number.isFinite(lambda) || maxK < 0) return out;
  out[0] = Math.exp(-lambda);
  for (let k = 1; k <= maxK; k++) {
    out[k] = (out[k - 1] * lambda) / k;
  }
  return out;
}

/**
 * Build the full scoreline probability grid and aggregate 1X2 / totals.
 * Probabilities on the truncated grid are left as raw joint mass (they sum to
 * `covered`, not necessarily 1). Market aggregates are renormalized by
 * `covered` so they always sum to 1 when covered > 0.
 */
export function computeScoreline(params: ScorelineParams): ScorelineResult {
  const maxGoals = Math.max(0, Math.floor(params.maxGoals));
  const lambdaHome = Math.max(0, params.lambdaHome);
  const lambdaAway = Math.max(0, params.lambdaAway);
  const n = maxGoals + 1;

  const pH = poissonPmfs(lambdaHome, maxGoals);
  const pA = poissonPmfs(lambdaAway, maxGoals);
  const probs = new Float64Array(n * n);

  let covered = 0;
  let homeWin = 0;
  let draw = 0;
  let awayWin = 0;
  let over25 = 0;
  let bestP = -1;
  let bestH = 0;
  let bestA = 0;

  for (let h = 0; h <= maxGoals; h++) {
    for (let a = 0; a <= maxGoals; a++) {
      const p = pH[h] * pA[a];
      probs[h * n + a] = p;
      covered += p;
      if (h > a) homeWin += p;
      else if (h === a) draw += p;
      else awayWin += p;
      if (h + a > 2) over25 += p;
      if (p > bestP) {
        bestP = p;
        bestH = h;
        bestA = a;
      }
    }
  }

  const scale = covered > 0 ? 1 / covered : 0;

  return {
    probs,
    maxGoals,
    lambdaHome,
    lambdaAway,
    covered,
    mostLikely: { home: bestH, away: bestA, probability: bestP },
    homeWin: homeWin * scale,
    draw: draw * scale,
    awayWin: awayWin * scale,
    over25: over25 * scale,
    under25: (covered - over25) * scale,
    expectedTotal: lambdaHome + lambdaAway,
  };
}

/** Index into the row-major probability grid. */
export function cellIndex(home: number, away: number, maxGoals: number): number {
  return home * (maxGoals + 1) + away;
}
