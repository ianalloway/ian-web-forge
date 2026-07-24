// Griffeath cyclic cellular automaton ("rock-paper-scissors"). Each cell holds
// a state in 0..states-1 arranged in a cycle: state s is "eaten" by state
// (s+1) mod states. A cell advances to its successor state when at least
// `threshold` of its neighbors already hold that successor state. From random
// noise this self-organizes into rotating spiral waves.

export class Cyclic {
  readonly w: number;
  readonly h: number;
  states: number;
  threshold: number;
  grid: Uint8Array;
  private next: Uint8Array;
  generation = 0;

  constructor(w: number, h: number, states = 6, threshold = 3) {
    this.w = w;
    this.h = h;
    this.states = states;
    this.threshold = threshold;
    this.grid = new Uint8Array(w * h);
    this.next = new Uint8Array(w * h);
    this.randomize();
  }

  randomize() {
    const g = this.grid;
    const n = this.states;
    for (let i = 0; i < g.length; i++) g[i] = (Math.random() * n) | 0;
    this.generation = 0;
  }

  /** Advance one generation (toroidal Moore neighborhood). */
  step() {
    const { w, h, grid, next, states, threshold } = this;
    for (let y = 0; y < h; y++) {
      const yUp = ((y + h - 1) % h) * w;
      const yDn = ((y + 1) % h) * w;
      const yMid = y * w;
      for (let x = 0; x < w; x++) {
        const i = yMid + x;
        const s = grid[i];
        const succ = s + 1 === states ? 0 : s + 1;
        const xL = (x + w - 1) % w;
        const xR = (x + 1) % w;
        let count = 0;
        if (grid[yUp + xL] === succ) count++;
        if (grid[yUp + x] === succ) count++;
        if (grid[yUp + xR] === succ) count++;
        if (grid[yMid + xL] === succ) count++;
        if (grid[yMid + xR] === succ) count++;
        if (grid[yDn + xL] === succ) count++;
        if (grid[yDn + x] === succ) count++;
        if (grid[yDn + xR] === succ) count++;
        next[i] = count >= threshold ? succ : s;
      }
    }
    this.grid.set(next);
    this.generation++;
  }
}
