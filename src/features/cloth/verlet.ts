// Cloth simulation by Verlet integration. Points store their previous position
// instead of an explicit velocity, so integration is just
// `next = 2·current − previous + accel·dt²`. Structural links between
// neighboring points are enforced by iteratively projecting each pair back to
// its rest length ("relaxation") — many cheap passes converge to a stiff,
// stable cloth without solving a linear system.

export interface Point {
  x: number;
  y: number;
  px: number; // previous position
  py: number;
  pinned: boolean;
}

export interface Link {
  a: number;
  b: number;
  rest: number;
  torn: boolean;
}

export interface ClothOptions {
  cols: number;
  rows: number;
  spacing: number;
  originX: number;
  originY: number;
  /** Pin every Nth point along the top edge (1 = pin all). */
  pinEvery: number;
}

export class Cloth {
  points: Point[] = [];
  links: Link[] = [];
  gravity = 0.32;
  damping = 0.995;
  /** Links stretched beyond rest × tearRatio snap. Infinity disables tearing. */
  tearRatio = 3.2;
  readonly cols: number;
  readonly rows: number;

  constructor(opts: ClothOptions) {
    const { cols, rows, spacing, originX, originY, pinEvery } = opts;
    this.cols = cols;
    this.rows = rows;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const px = originX + x * spacing;
        const py = originY + y * spacing;
        this.points.push({
          x: px,
          y: py,
          px,
          py,
          pinned: y === 0 && x % pinEvery === 0,
        });
      }
    }
    const idx = (x: number, y: number) => y * cols + x;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (x < cols - 1) this.links.push({ a: idx(x, y), b: idx(x + 1, y), rest: spacing, torn: false });
        if (y < rows - 1) this.links.push({ a: idx(x, y), b: idx(x, y + 1), rest: spacing, torn: false });
      }
    }
  }

  /** Verlet integration step for every free point. */
  private integrate(w: number, h: number) {
    for (const p of this.points) {
      if (p.pinned) continue;
      const vx = (p.x - p.px) * this.damping;
      const vy = (p.y - p.py) * this.damping;
      p.px = p.x;
      p.py = p.y;
      p.x += vx;
      p.y += vy + this.gravity;
      // Keep the sheet inside the viewport.
      if (p.x < 0) p.x = 0;
      else if (p.x > w) p.x = w;
      if (p.y > h) p.y = h;
    }
  }

  /** One relaxation pass over the links; tears any that overstretch. */
  private relax() {
    const pts = this.points;
    for (const l of this.links) {
      if (l.torn) continue;
      const a = pts[l.a];
      const b = pts[l.b];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 1e-6;
      if (d > l.rest * this.tearRatio) {
        l.torn = true;
        continue;
      }
      // Split the correction between the two ends (pinned points don't move).
      const diff = (d - l.rest) / d;
      const mA = a.pinned ? 0 : b.pinned ? 1 : 0.5;
      const mB = b.pinned ? 0 : a.pinned ? 1 : 0.5;
      a.x += dx * diff * mA;
      a.y += dy * diff * mA;
      b.x -= dx * diff * mB;
      b.y -= dy * diff * mB;
    }
  }

  /** Advance the simulation: integrate once, then relax `iterations` times. */
  step(w: number, h: number, iterations = 4) {
    this.integrate(w, h);
    for (let i = 0; i < iterations; i++) this.relax();
  }

  /** Index of the nearest point within `maxDist`, or -1. */
  nearest(x: number, y: number, maxDist: number): number {
    let best = -1;
    let bd = maxDist * maxDist;
    for (let i = 0; i < this.points.length; i++) {
      const p = this.points[i];
      const dx = p.x - x;
      const dy = p.y - y;
      const d2 = dx * dx + dy * dy;
      if (d2 < bd) {
        bd = d2;
        best = i;
      }
    }
    return best;
  }

  /** Tear every link with an endpoint inside the given radius. */
  cut(x: number, y: number, radius: number) {
    const r2 = radius * radius;
    for (const l of this.links) {
      if (l.torn) continue;
      const a = this.points[l.a];
      const b = this.points[l.b];
      const mx = (a.x + b.x) / 2 - x;
      const my = (a.y + b.y) / 2 - y;
      if (mx * mx + my * my < r2) l.torn = true;
    }
  }

  get intactLinks(): number {
    let n = 0;
    for (const l of this.links) if (!l.torn) n++;
    return n;
  }
}
