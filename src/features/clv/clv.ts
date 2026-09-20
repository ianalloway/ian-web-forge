// Closing Line Value (CLV) helpers.
//
// CLV asks whether you got a better price than the market's last number before
// the event. For a bet on a side, we compare the *implied probability* of the
// closing price to the implied probability of the entry price:
//
//   clvPts = (implied(close) − implied(entry)) × 100
//
// Positive CLV means the close was harder (shorter) than your entry — you beat
// the close. Negative means the market moved against your price. Units are
// probability points (e.g. +1.5 ≈ one and a half percentage points of edge
// relative to the close). This is the same "beat the close" convention used
// across sports betting eval tooling (kelly-js, nba-clv-dashboard, etc.).
//
// Dependency-free so the playground can stay a pure client module.

/** American odds → fair implied win probability in (0, 1). Zero is invalid. */
export function impliedProb(american: number): number {
  if (!Number.isFinite(american) || american === 0) {
    throw new RangeError("american odds must be a finite non-zero number");
  }
  if (american > 0) return 100 / (american + 100);
  return Math.abs(american) / (Math.abs(american) + 100);
}

/**
 * CLV in probability points. Same sign convention as beating the close:
 * positive when the close implies a higher win probability than the entry.
 */
export function clvPts(entryAmerican: number, closeAmerican: number): number {
  return (impliedProb(closeAmerican) - impliedProb(entryAmerican)) * 100;
}

export type ClvVerdict = "beat" | "lost" | "push";

/** Classify a CLV reading. `eps` is in probability points (default 0.05). */
export function clvVerdict(pts: number, eps = 0.05): ClvVerdict {
  if (pts > eps) return "beat";
  if (pts < -eps) return "lost";
  return "push";
}

export interface ClvBet {
  /** Optional label (e.g. "LAL ML"). */
  label?: string;
  entryAmerican: number;
  closeAmerican: number;
}

export interface ClvSummary {
  n: number;
  /** Arithmetic mean of per-bet CLV points. */
  meanClv: number;
  /** Share of bets with positive CLV (strictly > eps). */
  beatRate: number;
  /** Per-bet CLV points, same order as input. */
  points: number[];
}

/**
 * Rolling summary over a bet log. Bets with invalid odds are skipped rather
 * than throwing, so a half-edited row does not blank the whole panel.
 */
export function summarizeClv(bets: ClvBet[], eps = 0.05): ClvSummary {
  const points: number[] = [];
  let beats = 0;
  for (const bet of bets) {
    try {
      const pts = clvPts(bet.entryAmerican, bet.closeAmerican);
      points.push(pts);
      if (pts > eps) beats++;
    } catch {
      // skip incomplete / invalid rows
    }
  }
  const n = points.length;
  let sum = 0;
  for (const p of points) sum += p;
  return {
    n,
    meanClv: n > 0 ? sum / n : 0,
    beatRate: n > 0 ? beats / n : 0,
    points,
  };
}

/** Format American odds for display (+150 / −110). */
export function formatAmerican(american: number): string {
  if (!Number.isFinite(american) || american === 0) return "—";
  return american > 0 ? `+${Math.round(american)}` : `${Math.round(american)}`;
}
