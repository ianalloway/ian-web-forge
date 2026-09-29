// No-vig / fair-odds helpers.
//
// Bookmakers pad every price so the sum of implied probabilities exceeds 1.
// That padding is the overround (Σπ − 1) / hold (1 − 1/Σπ). De-vigging
// redistributes the overround back into a coherent probability vector so you
// can read a "fair" price and size an edge against your own forecast.
//
// Methods:
//   multiplicative (proportional) — π_i / Σπ
//   additive                      — π_i − (Σπ − 1)/n, renormalized if clipped
//   power                         — π_i^k with k solving Σ π_i^k = 1
//   shin                          — Shin (1993) insider-trading model
//
// Dependency-free so the playground can stay a pure client module.

export type OddsFormat = "american" | "decimal" | "probability";
export type DevigMethod = "multiplicative" | "additive" | "power" | "shin";

export interface MarketOutcome {
  /** Optional short label (e.g. "home", "away", "draw"). */
  label?: string;
  /** Bookmaker price in the active format. */
  odds: number;
}

export interface FairOutcome {
  label: string;
  /** Raw bookmaker implied probability (may sum > 1). */
  implied: number;
  /** De-vigged fair probability. */
  fair: number;
  fairAmerican: number;
  fairDecimal: number;
}

export interface DevigResult {
  method: DevigMethod;
  outcomes: FairOutcome[];
  /** Sum of raw implied probabilities. */
  overround: number;
  /** Bookmaker hold = 1 − 1/Σπ (fraction of stake retained in fair market). */
  hold: number;
  /** Overround as a percentage (e.g. 4.76 for −110/−110). */
  overroundPct: number;
  /** Hold as a percentage (e.g. 4.55 for −110/−110). */
  holdPct: number;
}

export interface EdgeResult {
  /** myProb − fairProb for the selected outcome. */
  edge: number;
  /** Full Kelly fraction of bankroll (0 when no edge). */
  kellyFraction: number;
  /** Quarter-Kelly fraction. */
  quarterKelly: number;
  /** Suggested stake in dollars when bankroll is provided. */
  quarterKellyDollars: number | null;
  hasEdge: boolean;
}

/** American odds → implied win probability in (0, 1). Zero is invalid. */
export function americanToImplied(american: number): number {
  if (!Number.isFinite(american) || american === 0) {
    throw new RangeError("american odds must be a finite non-zero number");
  }
  if (american > 0) return 100 / (american + 100);
  return Math.abs(american) / (Math.abs(american) + 100);
}

/** Decimal odds (> 1) → implied win probability. */
export function decimalToImplied(decimal: number): number {
  if (!Number.isFinite(decimal) || decimal <= 1) {
    throw new RangeError("decimal odds must be a finite number greater than 1");
  }
  return 1 / decimal;
}

/** Implied probability in (0, 1) → American odds. */
export function impliedToAmerican(p: number): number {
  if (!Number.isFinite(p) || p <= 0 || p >= 1) {
    throw new RangeError("probability must be in (0, 1)");
  }
  if (p === 0.5) return 100;
  if (p < 0.5) return Math.round((100 * (1 - p)) / p);
  return -Math.round((100 * p) / (1 - p));
}

/** Implied probability in (0, 1) → decimal odds. */
export function impliedToDecimal(p: number): number {
  if (!Number.isFinite(p) || p <= 0 || p >= 1) {
    throw new RangeError("probability must be in (0, 1)");
  }
  return 1 / p;
}

/** Convert a price in any supported format to an implied probability. */
export function toImplied(value: number, format: OddsFormat): number {
  switch (format) {
    case "american":
      return americanToImplied(value);
    case "decimal":
      return decimalToImplied(value);
    case "probability": {
      // Accept either a fraction (0–1) or a percentage (1–99… / 100).
      let p = value;
      if (p > 1 && p <= 100) p = p / 100;
      if (!Number.isFinite(p) || p <= 0 || p >= 1) {
        throw new RangeError("probability must be in (0, 1) or (0, 100)%");
      }
      return p;
    }
    default: {
      const _exhaustive: never = format;
      return _exhaustive;
    }
  }
}

/** Convert an implied probability into the requested display format. */
export function fromImplied(p: number, format: OddsFormat): number {
  switch (format) {
    case "american":
      return impliedToAmerican(p);
    case "decimal":
      return impliedToDecimal(p);
    case "probability":
      if (!Number.isFinite(p) || p <= 0 || p >= 1) {
        throw new RangeError("probability must be in (0, 1)");
      }
      return p;
    default: {
      const _exhaustive: never = format;
      return _exhaustive;
    }
  }
}

/** Format American odds for display (+150 / −110). */
export function formatAmerican(american: number): string {
  if (!Number.isFinite(american) || american === 0) return "—";
  return american > 0 ? `+${Math.round(american)}` : `${Math.round(american)}`;
}

function sum(xs: number[]): number {
  let s = 0;
  for (const x of xs) s += x;
  return s;
}

function normalize(xs: number[]): number[] {
  const s = sum(xs);
  if (!(s > 0)) throw new RangeError("probabilities must sum to a positive value");
  return xs.map((x) => x / s);
}

/** Multiplicative / proportional: divide each implied by the overround total. */
export function multiplicative(implied: number[]): number[] {
  return normalize(implied);
}

/**
 * Additive: peel the same absolute margin off every outcome, then clip
 * negatives to zero and renormalize so the vector still sums to 1.
 */
export function additive(implied: number[]): number[] {
  const n = implied.length;
  if (n === 0) throw new RangeError("need at least one outcome");
  const margin = sum(implied) - 1;
  const raw = implied.map((p) => p - margin / n);
  const clipped = raw.map((p) => Math.max(0, p));
  return normalize(clipped);
}

/**
 * Power method: find k such that Σ π_i^k = 1, then return π_i^k.
 * Overround (Σπ > 1) needs k > 1; underround needs 0 < k < 1.
 */
export function power(implied: number[]): number[] {
  const total = sum(implied);
  if (Math.abs(total - 1) < 1e-12) return implied.slice();

  // f(k) = Σ π_i^k − 1. As k→0, π^k→1 so f→n−1; as k→∞ (π<1), f→−1.
  // Overround: f(1) > 0, root in (1, ∞). Underround: f(1) < 0, root in (0, 1).
  let lo: number;
  let hi: number;
  if (total > 1) {
    lo = 1;
    hi = 2;
    while (sum(implied.map((p) => p ** hi)) > 1 && hi < 1e6) hi *= 2;
  } else {
    lo = 1e-6;
    hi = 1;
  }

  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const s = sum(implied.map((p) => p ** mid));
    if (s > 1) lo = mid;
    else hi = mid;
  }
  const k = (lo + hi) / 2;
  return implied.map((p) => p ** k);
}

/**
 * Shin (1993): solve for the insider-trading fraction z, then map each
 * implied to a fair probability. When z = 0 this collapses to multiplicative.
 */
export function shin(implied: number[]): number[] {
  const total = sum(implied);
  if (Math.abs(total - 1) < 1e-12) return implied.slice();
  if (!(total > 0)) throw new RangeError("implied probabilities must be positive");

  // Shin (1993): p_i(z) = (√(z² + 4(1−z) π_i²/Σπ) − z) / (2(1−z)).
  // At z→0, Σp = √(Σπ) (> 1 under overround). Raise z until Σp = 1.
  const fairAt = (z: number): number[] => {
    if (z <= 0) return implied.map((pi) => pi / Math.sqrt(total));
    return implied.map((pi) => {
      const disc = z * z + 4 * (1 - z) * ((pi * pi) / total);
      return (Math.sqrt(Math.max(0, disc)) - z) / (2 * (1 - z));
    });
  };

  let lo = 0;
  let hi = 0.9999;
  // If even a near-1 z still overshoots, fall back to multiplicative.
  if (sum(fairAt(hi)) > 1) return normalize(implied);

  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const s = sum(fairAt(mid));
    if (s > 1) lo = mid;
    else hi = mid;
  }
  const fair = fairAt((lo + hi) / 2);
  // Tiny numeric drift — renormalize so callers can trust Σ = 1.
  return normalize(fair.map((p) => Math.max(0, p)));
}

function applyMethod(implied: number[], method: DevigMethod): number[] {
  switch (method) {
    case "multiplicative":
      return multiplicative(implied);
    case "additive":
      return additive(implied);
    case "power":
      return power(implied);
    case "shin":
      return shin(implied);
    default: {
      const _exhaustive: never = method;
      return _exhaustive;
    }
  }
}

/**
 * De-vig a market. Outcomes must be in the given odds format; returns fair
 * probabilities plus overround / hold diagnostics.
 */
export function devig(
  outcomes: MarketOutcome[],
  format: OddsFormat,
  method: DevigMethod = "multiplicative"
): DevigResult {
  if (outcomes.length < 2) {
    throw new RangeError("a market needs at least two outcomes");
  }

  const implied = outcomes.map((o) => toImplied(o.odds, format));
  for (const p of implied) {
    if (!(p > 0 && p < 1)) {
      throw new RangeError("each outcome must imply a probability in (0, 1)");
    }
  }

  const total = sum(implied);
  const fair = applyMethod(implied, method);
  const overround = total - 1;
  const hold = total > 0 ? 1 - 1 / total : 0;

  return {
    method,
    outcomes: outcomes.map((o, i) => ({
      label: o.label?.trim() || `outcome ${i + 1}`,
      implied: implied[i],
      fair: fair[i],
      fairAmerican: impliedToAmerican(fair[i]),
      fairDecimal: impliedToDecimal(fair[i]),
    })),
    overround,
    hold,
    overroundPct: overround * 100,
    holdPct: hold * 100,
  };
}

/**
 * Edge of a personal probability vs a fair probability at offered decimal
 * odds, plus full / quarter Kelly fractions (and optional dollar stake).
 */
export function edgeVersusFair(
  myProb: number,
  fairProb: number,
  decimalOdds: number,
  bankroll?: number
): EdgeResult {
  if (!Number.isFinite(myProb) || myProb <= 0 || myProb >= 1) {
    throw new RangeError("myProb must be in (0, 1)");
  }
  if (!Number.isFinite(fairProb) || fairProb <= 0 || fairProb >= 1) {
    throw new RangeError("fairProb must be in (0, 1)");
  }
  if (!Number.isFinite(decimalOdds) || decimalOdds <= 1) {
    throw new RangeError("decimalOdds must be greater than 1");
  }

  const edge = myProb - fairProb;
  const b = decimalOdds - 1;
  const q = 1 - myProb;
  const rawKelly = (b * myProb - q) / b;
  const kellyFraction = Math.max(0, rawKelly);
  const quarterKelly = kellyFraction / 4;
  const hasEdge = kellyFraction > 0;

  let quarterKellyDollars: number | null = null;
  if (bankroll !== undefined) {
    if (!Number.isFinite(bankroll) || bankroll < 0) {
      throw new RangeError("bankroll must be a finite non-negative number");
    }
    quarterKellyDollars = Math.round(bankroll * quarterKelly * 100) / 100;
  }

  return { edge, kellyFraction, quarterKelly, quarterKellyDollars, hasEdge };
}
