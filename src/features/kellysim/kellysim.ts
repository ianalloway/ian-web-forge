// Monte Carlo bankroll simulation for fractional Kelly staking.
//
// With win probability p and decimal odds d (net payoff b = d - 1), the Kelly
// fraction f* = (p·b - q) / b maximizes the expected log growth rate. Betting
// full Kelly is growth-optimal but brutally volatile; betting a fraction of it
// gives up a little growth for a lot less drawdown. This simulates many
// independent bankroll paths so you can see the whole distribution, not just
// the expectation.

export interface SimParams {
  winProb: number; // p in (0,1)
  decimalOdds: number; // d > 1
  fraction: number; // multiple of full Kelly (1 = full, 0.5 = half)
  bets: number;
  paths: number;
  ruinThreshold: number; // fraction of the starting bankroll counted as ruin
}

export interface SimResult {
  /** paths × (bets+1) bankroll multiples, path-major. */
  curves: Float64Array;
  bets: number;
  paths: number;
  median: number;
  mean: number;
  p5: number;
  p95: number;
  ruinRate: number; // share of paths that ever fell below the ruin threshold
  maxDrawdown: number; // worst peak-to-trough drop over all paths, in [0,1]
  kellyFraction: number; // f* for these odds
  stake: number; // fraction of bankroll actually staked per bet
}

/**
 * Deterministic LCG factory. Keeping the mutable cursor inside this module
 * (rather than a closure created during render) keeps callers pure.
 */
export function makeRng(seed: number): () => number {
  let s = (seed * 2654435761 + 12345) & 0x7fffffff;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/** Full-Kelly fraction f* = (p·b − q)/b, clamped to [0, 1]. */
export function kellyFraction(winProb: number, decimalOdds: number): number {
  const b = decimalOdds - 1;
  if (b <= 0) return 0;
  const f = (winProb * b - (1 - winProb)) / b;
  return Math.max(0, Math.min(1, f));
}

function quantile(sorted: Float64Array, q: number): number {
  if (sorted.length === 0) return 0;
  const i = (sorted.length - 1) * q;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

/**
 * Simulate `paths` independent bankroll trajectories. Bankrolls are tracked as
 * multiples of the starting bankroll (so they start at 1) and bets are fully
 * divisible, meaning a path can shrink toward zero but never go negative.
 */
export function simulate(params: SimParams, rng: () => number = Math.random): SimResult {
  const { winProb, decimalOdds, fraction, bets, paths, ruinThreshold } = params;
  const b = decimalOdds - 1;
  const kf = kellyFraction(winProb, decimalOdds);
  const stake = Math.max(0, Math.min(1, kf * fraction));

  const curves = new Float64Array(paths * (bets + 1));
  const finals = new Float64Array(paths);
  let ruined = 0;
  let worstDrawdown = 0;

  for (let p = 0; p < paths; p++) {
    const base = p * (bets + 1);
    let bank = 1;
    let peak = 1;
    let hitRuin = false;
    curves[base] = 1;
    for (let i = 1; i <= bets; i++) {
      const wager = bank * stake;
      bank = rng() < winProb ? bank + wager * b : bank - wager;
      if (bank < 0) bank = 0;
      if (bank > peak) peak = bank;
      const dd = peak > 0 ? 1 - bank / peak : 0;
      if (dd > worstDrawdown) worstDrawdown = dd;
      if (!hitRuin && bank <= ruinThreshold) {
        hitRuin = true;
        ruined++;
      }
      curves[base + i] = bank;
    }
    finals[p] = bank;
  }

  const sorted = finals.slice().sort();
  let sum = 0;
  for (let i = 0; i < finals.length; i++) sum += finals[i];

  return {
    curves,
    bets,
    paths,
    median: quantile(sorted, 0.5),
    mean: paths > 0 ? sum / paths : 0,
    p5: quantile(sorted, 0.05),
    p95: quantile(sorted, 0.95),
    ruinRate: paths > 0 ? ruined / paths : 0,
    maxDrawdown: worstDrawdown,
    kellyFraction: kf,
    stake,
  };
}
