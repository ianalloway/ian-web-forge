export interface KellyResult {
  fraction: number;
  halfKelly: number;
  quarterKelly: number;
  dollars: (bankroll: number) => number;
  halfDollars: (bankroll: number) => number;
  ev: number;
  edge: number;
  hasEdge: boolean;
}

export interface OddsConversion {
  american: number;
  decimal: number;
  fractional: string;
  impliedProbability: number;
  noVigProbability?: number;
}

export interface ArbitrageResult {
  hasArb: boolean;
  profitPct: number;
  stakeA: number;
  stakeB: number;
  overround: number;
}

export function impliedProb(american: number): number {
  if (american > 0) return 100 / (american + 100);
  return Math.abs(american) / (Math.abs(american) + 100);
}

export function toDecimal(american: number): number {
  if (american === 0) throw new RangeError('American odds cannot be zero');
  if (american > 0) return american / 100 + 1;
  return 100 / Math.abs(american) + 1;
}

export function convertOdds(american: number, vigRemoval = false): OddsConversion {
  const implied = impliedProb(american);
  const decimal = toDecimal(american);
  const absAmerican = Math.abs(american);
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const num = american > 0 ? american : 100;
  const den = american > 0 ? 100 : absAmerican;
  const divisor = gcd(num, den);

  return {
    american,
    decimal: Math.round(decimal * 1000) / 1000,
    fractional: `${num / divisor}/${den / divisor}`,
    impliedProbability: Math.round(implied * 10000) / 10000,
    ...(vigRemoval ? { noVigProbability: implied } : {}),
  };
}

export function kelly(winProbability: number, americanOdds: number): KellyResult {
  if (winProbability <= 0 || winProbability >= 1) {
    throw new RangeError('winProbability must be between 0 and 1 exclusive');
  }
  if (!Number.isFinite(americanOdds) || americanOdds === 0) {
    throw new RangeError('americanOdds must be a finite non-zero number');
  }

  const netOdds = toDecimal(americanOdds) - 1;
  const lossProbability = 1 - winProbability;
  const fraction = Math.max(0, (netOdds * winProbability - lossProbability) / netOdds);
  const ev = netOdds * winProbability - lossProbability;
  const edge = winProbability - impliedProb(americanOdds);

  return {
    fraction: Math.round(fraction * 10000) / 10000,
    halfKelly: Math.round((fraction / 2) * 10000) / 10000,
    quarterKelly: Math.round((fraction / 4) * 10000) / 10000,
    dollars: (bankroll: number) => {
      if (!Number.isFinite(bankroll) || bankroll < 0) {
        throw new RangeError('bankroll must be a finite non-negative number');
      }
      return Math.round(bankroll * fraction * 100) / 100;
    },
    halfDollars: (bankroll: number) => {
      if (!Number.isFinite(bankroll) || bankroll < 0) {
        throw new RangeError('bankroll must be a finite non-negative number');
      }
      return Math.round(bankroll * fraction * 50) / 100;
    },
    ev: Math.round(ev * 10000) / 10000,
    edge: Math.round(edge * 10000) / 10000,
    hasEdge: ev > 0,
  };
}

export function arbitrage(oddsA: number, oddsB: number, totalStake = 1000): ArbitrageResult {
  const pA = impliedProb(oddsA);
  const pB = impliedProb(oddsB);
  const overround = pA + pB;
  const hasArb = overround < 1.0;
  const dA = toDecimal(oddsA);
  const dB = toDecimal(oddsB);
  const stakeA = Math.round(((totalStake * dB) / (dA + dB)) * 100) / 100;
  const stakeB = Math.round((totalStake - stakeA) * 100) / 100;

  return {
    hasArb,
    profitPct: hasArb ? Math.round((1 / overround - 1) * 10000) / 100 : 0,
    stakeA,
    stakeB,
    overround: Math.round(overround * 10000) / 10000,
  };
}
