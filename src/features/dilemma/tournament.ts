// Axelrod's iterated prisoner's dilemma: a round-robin tournament between
// strategies, followed by evolution of the population that plays them.
//
// Each round both players choose cooperate (C) or defect (D) and are paid:
//
//              opponent C   opponent D
//   you C        R = 3        S = 0
//   you D        T = 5        P = 1
//
// Defecting is better whatever the opponent does, so one round has exactly one
// rational play — betray. Repeat the game and that logic breaks: a strategy that
// punishes betrayal makes betraying you expensive. Axelrod's finding was that
// the winners are nice (never defect first), retaliatory, forgiving, and simple.
//
// Strategies here are pure functions of the visible history, so a match is
// reproducible from its seed alone.

export const C = 0;
export const D = 1;
export type Move = typeof C | typeof D;

export const T = 5; // temptation — defect against a cooperator
export const R = 3; // reward — mutual cooperation
export const P = 1; // punishment — mutual defection
export const S = 0; // sucker — cooperate into a defection

export function payoff(mine: Move, theirs: Move): number {
  if (mine === C) return theirs === C ? R : S;
  return theirs === C ? T : P;
}

export type Rng = () => number;

// mulberry32 — a small deterministic generator so every tournament replays
// exactly from its seed.
export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Strategy {
  id: string;
  label: string;
  note: string;
  nice: boolean; // never the first to defect
  // `mine` and `theirs` are the moves played so far, oldest first.
  move: (mine: Move[], theirs: Move[], rng: Rng) => Move;
}

const last = (h: Move[]): Move => h[h.length - 1];

export const STRATEGIES: Strategy[] = [
  {
    id: "tft",
    label: "tit for tat",
    note: "cooperate first, then echo whatever they just did",
    nice: true,
    move: (_m, theirs) => (theirs.length === 0 ? C : last(theirs)),
  },
  {
    id: "tf2t",
    label: "tit for two tats",
    note: "only retaliates after being crossed twice in a row — very forgiving",
    nice: true,
    move: (_m, theirs) =>
      theirs.length >= 2 && last(theirs) === D && theirs[theirs.length - 2] === D ? D : C,
  },
  {
    id: "gtft",
    label: "generous tft",
    note: "tit for tat that forgives one defection in ten — survives noise",
    nice: true,
    move: (_m, theirs, rng) => {
      if (theirs.length === 0) return C;
      if (last(theirs) === C) return C;
      return rng() < 0.1 ? C : D;
    },
  },
  {
    id: "grudger",
    label: "grudger",
    note: "cooperates until crossed once, then defects forever",
    nice: true,
    move: (_m, theirs) => (theirs.includes(D) ? D : C),
  },
  {
    id: "pavlov",
    label: "pavlov",
    note: "win-stay, lose-shift: repeat the last move if it paid well",
    nice: true,
    move: (mine, theirs) => {
      if (mine.length === 0) return C;
      const got = payoff(last(mine), last(theirs));
      return got >= R ? last(mine) : (((last(mine) + 1) % 2) as Move);
    },
  },
  {
    id: "coop",
    label: "always cooperate",
    note: "never defects — free money for anyone who exploits it",
    nice: true,
    move: () => C,
  },
  {
    id: "prober",
    label: "prober",
    note: "opens D,C,C to test you; exploits if you never punished it",
    nice: false,
    move: (mine, theirs) => {
      const n = mine.length;
      if (n === 0) return D;
      if (n === 1 || n === 2) return C;
      // Did they punish the opening defection during the two probe rounds?
      const punished = theirs[1] === D || theirs[2] === D;
      return punished ? last(theirs) : D;
    },
  },
  {
    id: "stft",
    label: "suspicious tft",
    note: "tit for tat, but opens with a defection — and pays for it",
    nice: false,
    move: (_m, theirs) => (theirs.length === 0 ? D : last(theirs)),
  },
  {
    id: "random",
    label: "random",
    note: "coin flip every round, no memory at all",
    nice: false,
    move: (_m, _t, rng) => (rng() < 0.5 ? C : D),
  },
  {
    id: "defect",
    label: "always defect",
    note: "never cooperates — unbeatable in one round, poor over many",
    nice: false,
    move: () => D,
  },
];

export interface MatchResult {
  scoreA: number; // total points
  scoreB: number;
  coopA: number; // fraction of rounds spent cooperating
  coopB: number;
}

// `noise` is the chance a chosen move comes out as its opposite — a trembling
// hand. It is what separates strategies that recover from a misunderstanding
// from those that spiral into mutual punishment.
export function playMatch(
  a: Strategy,
  b: Strategy,
  rounds: number,
  noise: number,
  rng: Rng
): MatchResult {
  const histA: Move[] = [];
  const histB: Move[] = [];
  let scoreA = 0;
  let scoreB = 0;
  let coopA = 0;
  let coopB = 0;

  for (let i = 0; i < rounds; i++) {
    let ma = a.move(histA, histB, rng);
    let mb = b.move(histB, histA, rng);
    if (noise > 0 && rng() < noise) ma = ((ma + 1) % 2) as Move;
    if (noise > 0 && rng() < noise) mb = ((mb + 1) % 2) as Move;

    scoreA += payoff(ma, mb);
    scoreB += payoff(mb, ma);
    if (ma === C) coopA++;
    if (mb === C) coopB++;
    // Players see what was actually played, never what was intended.
    histA.push(ma);
    histB.push(mb);
  }

  return { scoreA, scoreB, coopA: coopA / rounds, coopB: coopB / rounds };
}

export interface Tournament {
  strategies: Strategy[];
  // matrix[i][j] = average points per round for i playing against j.
  matrix: number[][];
  coop: number[][]; // matrix[i][j] = i's cooperation rate against j
  totals: number[]; // mean points per round across all opponents
  order: number[]; // strategy indices, best first
}

// Every strategy meets every other and itself, exactly as Axelrod ran it.
export function runTournament(
  strategies: Strategy[],
  rounds: number,
  noise: number,
  seed: number
): Tournament {
  const n = strategies.length;
  const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  const coop: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      // The seed depends on the pairing, so one match never shifts another.
      const rng = makeRng(seed + i * 8191 + j * 131);
      const res = playMatch(strategies[i], strategies[j], rounds, noise, rng);
      matrix[i][j] = res.scoreA / rounds;
      matrix[j][i] = res.scoreB / rounds;
      coop[i][j] = res.coopA;
      coop[j][i] = res.coopB;
    }
  }

  const totals = matrix.map((row) => row.reduce((s, x) => s + x, 0) / n);
  const order = totals.map((_, i) => i).sort((x, y) => totals[y] - totals[x]);
  return { strategies, matrix, coop, totals, order };
}

// ── Evolution ───────────────────────────────────────────────────────────────
//
// Replicator dynamics: a strategy's share of the next generation is its share
// now, weighted by how it scores against the population as it currently stands.
// Nothing is designed — exploiters boom while there are suckers to exploit, and
// then starve once there are none left.

export const EXTINCTION = 0.002;

export function fitness(shares: number[], matrix: number[][]): number[] {
  return matrix.map((row) => row.reduce((s, v, j) => s + v * shares[j], 0));
}

export function evolve(shares: number[], matrix: number[][]): number[] {
  const fit = fitness(shares, matrix);
  const weighted = shares.map((s, i) => s * Math.max(fit[i], 1e-9));
  let total = weighted.reduce((s, x) => s + x, 0);
  if (total <= 0) return shares.slice();

  let next = weighted.map((w) => w / total);
  // Strategies below the threshold are gone for good — no spontaneous revival.
  next = next.map((s) => (s < EXTINCTION ? 0 : s));
  total = next.reduce((s, x) => s + x, 0);
  return total <= 0 ? shares.slice() : next.map((s) => s / total);
}

export function uniformShares(n: number): number[] {
  return new Array(n).fill(1 / n);
}

// Mean payoff per round across the whole population — the collective welfare
// that individually rational defection destroys.
export function populationPayoff(shares: number[], matrix: number[][]): number {
  const fit = fitness(shares, matrix);
  return shares.reduce((s, share, i) => s + share * fit[i], 0);
}
