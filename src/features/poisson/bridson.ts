// Poisson-disk sampling via Bridson's algorithm. Produces "blue noise": points
// filling a region so that no two are closer than `radius`, yet with no large
// gaps — evenly spaced without the clumping of uniform random points. A
// background grid (cell = radius/√2, so each cell holds at most one point)
// makes the neighbor test O(1).

export interface Poisson {
  points: number[]; // flat [x0,y0,x1,y1,...]
  active: number; // remaining active samples
  done: boolean;
}

export class PoissonDisk {
  readonly width: number;
  readonly height: number;
  readonly radius: number;
  private cell: number;
  private gw: number;
  private gh: number;
  private grid: Int32Array; // point index per cell, or -1
  private pts: number[] = [];
  private activeList: number[] = [];
  private k: number;
  done = false;

  constructor(width: number, height: number, radius: number, k = 30) {
    this.width = width;
    this.height = height;
    this.radius = radius;
    this.k = k;
    this.cell = radius / Math.SQRT2;
    this.gw = Math.ceil(width / this.cell);
    this.gh = Math.ceil(height / this.cell);
    this.grid = new Int32Array(this.gw * this.gh).fill(-1);
    // Seed with one random point.
    this.emit(Math.random() * width, Math.random() * height);
  }

  private emit(x: number, y: number): number {
    const idx = this.pts.length / 2;
    this.pts.push(x, y);
    const gx = (x / this.cell) | 0;
    const gy = (y / this.cell) | 0;
    this.grid[gy * this.gw + gx] = idx;
    this.activeList.push(idx);
    return idx;
  }

  /** Is (x,y) in bounds and at least `radius` from every existing point? */
  private fits(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return false;
    const gx = (x / this.cell) | 0;
    const gy = (y / this.cell) | 0;
    const r2 = this.radius * this.radius;
    for (let iy = Math.max(0, gy - 2); iy <= Math.min(this.gh - 1, gy + 2); iy++) {
      for (let ix = Math.max(0, gx - 2); ix <= Math.min(this.gw - 1, gx + 2); ix++) {
        const p = this.grid[iy * this.gw + ix];
        if (p < 0) continue;
        const dx = x - this.pts[p * 2];
        const dy = y - this.pts[p * 2 + 1];
        if (dx * dx + dy * dy < r2) return false;
      }
    }
    return true;
  }

  /**
   * One iteration: pick a random active sample and try up to `k` candidate
   * points in the annulus [r, 2r] around it. Accept the first that fits; if
   * none fit, retire the sample. Returns the newly added point, or null.
   */
  step(): [number, number] | null {
    if (this.done || this.activeList.length === 0) {
      this.done = true;
      return null;
    }
    const ai = (Math.random() * this.activeList.length) | 0;
    const pi = this.activeList[ai];
    const px = this.pts[pi * 2];
    const py = this.pts[pi * 2 + 1];
    for (let t = 0; t < this.k; t++) {
      const ang = Math.random() * Math.PI * 2;
      const rad = this.radius * (1 + Math.random());
      const nx = px + Math.cos(ang) * rad;
      const ny = py + Math.sin(ang) * rad;
      if (this.fits(nx, ny)) {
        this.emit(nx, ny);
        return [nx, ny];
      }
    }
    // No candidate worked: remove this sample from the active list.
    this.activeList[ai] = this.activeList[this.activeList.length - 1];
    this.activeList.pop();
    if (this.activeList.length === 0) this.done = true;
    return null;
  }

  snapshot(): Poisson {
    return { points: this.pts, active: this.activeList.length, done: this.done };
  }

  get count(): number {
    return this.pts.length / 2;
  }
}
