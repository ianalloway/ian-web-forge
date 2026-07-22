export interface Ball {
  row: number; // current peg row (0-based); rows = total peg rows
  rights: number; // how many times it bounced right so far
  progress: number; // 0..1 progress toward the next row
  jitter: number; // small horizontal wobble for visual variety
}

export interface GaltonState {
  rows: number;
  p: number; // probability of bouncing right
  balls: Ball[];
  bins: number[]; // rows + 1 buckets
  dropped: number; // balls landed
}

export function newGalton(rows: number, p: number): GaltonState {
  return {
    rows,
    p,
    balls: [],
    bins: new Array<number>(rows + 1).fill(0),
    dropped: 0,
  };
}

export function spawnBall(s: GaltonState): void {
  s.balls.push({
    row: 0,
    rights: 0,
    progress: 0,
    jitter: (Math.random() - 0.5) * 0.3,
  });
}

/**
 * Advance all balls by dt (in row-transits). Balls that clear the last
 * row land in bins. Mutates state.
 */
export function stepBalls(s: GaltonState, dt: number): void {
  const landed: number[] = [];
  for (const b of s.balls) {
    b.progress += dt;
    while (b.progress >= 1) {
      b.progress -= 1;
      // Bounce at the peg: decide direction for the row just passed
      if (Math.random() < s.p) b.rights++;
      b.row++;
      b.jitter = (Math.random() - 0.5) * 0.3;
      if (b.row >= s.rows) {
        landed.push(b.rights);
        b.row = -1; // mark for removal
        break;
      }
    }
  }
  for (const r of landed) {
    s.bins[r]++;
    s.dropped++;
  }
  s.balls = s.balls.filter((b) => b.row >= 0);
}

/** Binomial pmf B(rows, p) at k. */
export function binomialPmf(rows: number, p: number, k: number): number {
  // log-space to stay stable for larger rows
  let logC = 0;
  for (let i = 0; i < k; i++) {
    logC += Math.log(rows - i) - Math.log(i + 1);
  }
  return Math.exp(logC + k * Math.log(p) + (rows - k) * Math.log(1 - p));
}

/**
 * Ball x-position in "bin widths" left of center, for rendering.
 * While descending, position interpolates between current displacement
 * and the pegs it might hit; we simply center on rights - row*p drift.
 */
export function ballX(b: Ball, s: GaltonState): number {
  // displacement from center in half-bin units: rights - row/2
  const cur = b.rights - b.row / 2;
  return cur + b.jitter;
}
