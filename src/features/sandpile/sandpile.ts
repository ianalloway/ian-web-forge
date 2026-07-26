// Abelian sandpile model. Each cell holds a pile of grains; a cell with 4 or
// more grains topples, sending one grain to each of its four neighbors (grains
// that fall off the grid edge are lost). Toppling is animated by processing a
// bounded number of topple operations per frame; the final configuration is
// independent of the order thanks to the abelian property.

export class Sandpile {
  readonly w: number;
  readonly h: number;
  grid: Int32Array;
  private queue: number[] = [];
  private inQ: Uint8Array;
  topples = 0; // cumulative topple count

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.grid = new Int32Array(w * h);
    this.inQ = new Uint8Array(w * h);
  }

  reset() {
    this.grid.fill(0);
    this.queue.length = 0;
    this.inQ.fill(0);
    this.topples = 0;
  }

  private enqueue(i: number) {
    if (!this.inQ[i]) {
      this.inQ[i] = 1;
      this.queue.push(i);
    }
  }

  /** Add `n` grains at cell index `i`, queueing it if it becomes unstable. */
  drop(i: number, n: number) {
    this.grid[i] += n;
    if (this.grid[i] >= 4) this.enqueue(i);
  }

  /** Number of cells currently waiting to topple. */
  get unstable(): number {
    return this.queue.length;
  }

  /**
   * Perform up to `budget` topple operations (a topple = 4 grains leaving one
   * cell). Returns how many were performed. A cell holding 4k..4k+3 grains is
   * toppled k times at once, which is valid under the abelian property and
   * keeps large avalanches fast.
   */
  step(budget: number): number {
    let done = 0;
    const { w, h, grid } = this;
    while (done < budget && this.queue.length) {
      const i = this.queue.pop()!;
      this.inQ[i] = 0;
      const g = grid[i];
      if (g < 4) continue;
      const t = (g / 4) | 0;
      grid[i] = g - 4 * t;
      const x = i % w;
      const y = (i / w) | 0;
      if (x > 0) {
        const j = i - 1;
        grid[j] += t;
        if (grid[j] >= 4) this.enqueue(j);
      }
      if (x < w - 1) {
        const j = i + 1;
        grid[j] += t;
        if (grid[j] >= 4) this.enqueue(j);
      }
      if (y > 0) {
        const j = i - w;
        grid[j] += t;
        if (grid[j] >= 4) this.enqueue(j);
      }
      if (y < h - 1) {
        const j = i + w;
        grid[j] += t;
        if (grid[j] >= 4) this.enqueue(j);
      }
      // Off-grid neighbors simply drop their grains (open boundary).
      if (grid[i] >= 4) this.enqueue(i);
      this.topples += t;
      done += t;
    }
    return done;
  }
}
