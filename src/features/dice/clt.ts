export interface DiceState {
  diceCount: number; // dice per roll
  sides: number;
  counts: number[]; // histogram of sums; index 0 = minimum sum
  totalRolls: number;
  lastRoll: number[]; // faces of the most recent roll
}

export function minSum(s: DiceState): number {
  return s.diceCount;
}

export function maxSum(s: DiceState): number {
  return s.diceCount * s.sides;
}

export function newDiceState(diceCount: number, sides: number): DiceState {
  const buckets = diceCount * sides - diceCount + 1;
  return {
    diceCount,
    sides,
    counts: new Array<number>(buckets).fill(0),
    totalRolls: 0,
    lastRoll: [],
  };
}

/** Roll `n` handfuls; mutates and returns the state. */
export function rollMany(s: DiceState, n: number): DiceState {
  let last: number[] = s.lastRoll;
  for (let r = 0; r < n; r++) {
    let sum = 0;
    last = new Array<number>(s.diceCount);
    for (let d = 0; d < s.diceCount; d++) {
      const face = 1 + Math.floor(Math.random() * s.sides);
      last[d] = face;
      sum += face;
    }
    s.counts[sum - s.diceCount]++;
  }
  s.totalRolls += n;
  s.lastRoll = last;
  return s;
}

/** Theoretical mean and standard deviation of the sum. */
export function theoreticalStats(s: DiceState): { mean: number; sd: number } {
  const faceMean = (s.sides + 1) / 2;
  const faceVar = (s.sides * s.sides - 1) / 12;
  return {
    mean: s.diceCount * faceMean,
    sd: Math.sqrt(s.diceCount * faceVar),
  };
}

/** Normal pdf scaled to expected counts for overlay on the histogram. */
export function normalOverlay(s: DiceState, sum: number): number {
  const { mean, sd } = theoreticalStats(s);
  if (sd === 0 || s.totalRolls === 0) return 0;
  const z = (sum - mean) / sd;
  const density = Math.exp(-0.5 * z * z) / (sd * Math.sqrt(2 * Math.PI));
  return density * s.totalRolls;
}

/** Empirical mean of the observed sums. */
export function empiricalMean(s: DiceState): number {
  if (s.totalRolls === 0) return 0;
  let acc = 0;
  s.counts.forEach((c, i) => { acc += c * (i + s.diceCount); });
  return acc / s.totalRolls;
}
