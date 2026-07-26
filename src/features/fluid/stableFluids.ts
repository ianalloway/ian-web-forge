// Stable Fluids (Jos Stam, 1999): a semi-Lagrangian Navier-Stokes solver that
// stays stable at any timestep. Each frame runs the same three moves on the
// velocity field — diffuse, advect, project — plus advection of a dye field
// that makes the flow visible.
//
// The grid is (N+2)² with a one-cell border used for boundary conditions.

export type Field = Float32Array;

export const enum Boundary {
  Neither = 0, // scalar (dye, pressure)
  Horizontal = 1, // x-velocity: reflect across vertical walls
  Vertical = 2, // y-velocity: reflect across horizontal walls
}

export class Fluid {
  readonly n: number;
  readonly size: number;
  u: Field; // x velocity
  v: Field; // y velocity
  uPrev: Field;
  vPrev: Field;
  dye: Field;
  dyePrev: Field;
  viscosity = 0;
  diffusion = 0;
  dissipation = 0.996;
  iterations = 12;

  constructor(n: number) {
    this.n = n;
    this.size = (n + 2) * (n + 2);
    this.u = new Float32Array(this.size);
    this.v = new Float32Array(this.size);
    this.uPrev = new Float32Array(this.size);
    this.vPrev = new Float32Array(this.size);
    this.dye = new Float32Array(this.size);
    this.dyePrev = new Float32Array(this.size);
  }

  idx(x: number, y: number): number {
    return x + y * (this.n + 2);
  }

  clear() {
    this.u.fill(0);
    this.v.fill(0);
    this.uPrev.fill(0);
    this.vPrev.fill(0);
    this.dye.fill(0);
    this.dyePrev.fill(0);
  }

  /** Enforce the wall conditions on the border cells. */
  private setBound(b: Boundary, x: Field) {
    const n = this.n;
    const ix = (i: number, j: number) => i + j * (n + 2);
    for (let i = 1; i <= n; i++) {
      x[ix(0, i)] = b === Boundary.Horizontal ? -x[ix(1, i)] : x[ix(1, i)];
      x[ix(n + 1, i)] = b === Boundary.Horizontal ? -x[ix(n, i)] : x[ix(n, i)];
      x[ix(i, 0)] = b === Boundary.Vertical ? -x[ix(i, 1)] : x[ix(i, 1)];
      x[ix(i, n + 1)] = b === Boundary.Vertical ? -x[ix(i, n)] : x[ix(i, n)];
    }
    x[ix(0, 0)] = 0.5 * (x[ix(1, 0)] + x[ix(0, 1)]);
    x[ix(0, n + 1)] = 0.5 * (x[ix(1, n + 1)] + x[ix(0, n)]);
    x[ix(n + 1, 0)] = 0.5 * (x[ix(n, 0)] + x[ix(n + 1, 1)]);
    x[ix(n + 1, n + 1)] = 0.5 * (x[ix(n, n + 1)] + x[ix(n + 1, n)]);
  }

  /** Gauss-Seidel relaxation for the implicit diffusion / pressure solves. */
  private linSolve(b: Boundary, x: Field, x0: Field, a: number, c: number) {
    const n = this.n;
    const ix = (i: number, j: number) => i + j * (n + 2);
    const invC = 1 / c;
    for (let k = 0; k < this.iterations; k++) {
      for (let j = 1; j <= n; j++) {
        for (let i = 1; i <= n; i++) {
          x[ix(i, j)] =
            (x0[ix(i, j)] +
              a * (x[ix(i - 1, j)] + x[ix(i + 1, j)] + x[ix(i, j - 1)] + x[ix(i, j + 1)])) *
            invC;
        }
      }
      this.setBound(b, x);
    }
  }

  private diffuse(b: Boundary, x: Field, x0: Field, rate: number, dt: number) {
    if (rate <= 0) {
      x.set(x0);
      this.setBound(b, x);
      return;
    }
    const a = dt * rate * this.n * this.n;
    this.linSolve(b, x, x0, a, 1 + 4 * a);
  }

  /** Semi-Lagrangian advection: trace each cell backwards and sample there. */
  private advect(b: Boundary, d: Field, d0: Field, u: Field, v: Field, dt: number) {
    const n = this.n;
    const ix = (i: number, j: number) => i + j * (n + 2);
    const dt0 = dt * n;
    for (let j = 1; j <= n; j++) {
      for (let i = 1; i <= n; i++) {
        let x = i - dt0 * u[ix(i, j)];
        let y = j - dt0 * v[ix(i, j)];
        if (x < 0.5) x = 0.5;
        else if (x > n + 0.5) x = n + 0.5;
        if (y < 0.5) y = 0.5;
        else if (y > n + 0.5) y = n + 0.5;
        const i0 = Math.floor(x);
        const j0 = Math.floor(y);
        const i1 = i0 + 1;
        const j1 = j0 + 1;
        const s1 = x - i0;
        const s0 = 1 - s1;
        const t1 = y - j0;
        const t0 = 1 - t1;
        d[ix(i, j)] =
          s0 * (t0 * d0[ix(i0, j0)] + t1 * d0[ix(i0, j1)]) +
          s1 * (t0 * d0[ix(i1, j0)] + t1 * d0[ix(i1, j1)]);
      }
    }
    this.setBound(b, d);
  }

  /** Hodge projection: subtract the pressure gradient to make the field
   *  divergence-free (mass-conserving), which is what creates vortices. */
  private project(u: Field, v: Field, p: Field, div: Field) {
    const n = this.n;
    const ix = (i: number, j: number) => i + j * (n + 2);
    const h = 1 / n;
    for (let j = 1; j <= n; j++) {
      for (let i = 1; i <= n; i++) {
        div[ix(i, j)] =
          -0.5 * h * (u[ix(i + 1, j)] - u[ix(i - 1, j)] + v[ix(i, j + 1)] - v[ix(i, j - 1)]);
        p[ix(i, j)] = 0;
      }
    }
    this.setBound(Boundary.Neither, div);
    this.setBound(Boundary.Neither, p);
    this.linSolve(Boundary.Neither, p, div, 1, 4);
    for (let j = 1; j <= n; j++) {
      for (let i = 1; i <= n; i++) {
        u[ix(i, j)] -= (0.5 * (p[ix(i + 1, j)] - p[ix(i - 1, j)])) / h;
        v[ix(i, j)] -= (0.5 * (p[ix(i, j + 1)] - p[ix(i, j - 1)])) / h;
      }
    }
    this.setBound(Boundary.Horizontal, u);
    this.setBound(Boundary.Vertical, v);
  }

  addVelocity(x: number, y: number, ax: number, ay: number) {
    const i = this.idx(x, y);
    if (i < 0 || i >= this.size) return;
    this.u[i] += ax;
    this.v[i] += ay;
  }

  addDye(x: number, y: number, amount: number) {
    const i = this.idx(x, y);
    if (i < 0 || i >= this.size) return;
    this.dye[i] = Math.min(1.6, this.dye[i] + amount);
  }

  /** Advance the simulation one timestep. */
  step(dt: number) {
    // Velocity: diffuse, project, advect, project.
    this.uPrev.set(this.u);
    this.vPrev.set(this.v);
    this.diffuse(Boundary.Horizontal, this.u, this.uPrev, this.viscosity, dt);
    this.diffuse(Boundary.Vertical, this.v, this.vPrev, this.viscosity, dt);
    this.project(this.u, this.v, this.uPrev, this.vPrev);
    this.uPrev.set(this.u);
    this.vPrev.set(this.v);
    this.advect(Boundary.Horizontal, this.u, this.uPrev, this.uPrev, this.vPrev, dt);
    this.advect(Boundary.Vertical, this.v, this.vPrev, this.uPrev, this.vPrev, dt);
    this.project(this.u, this.v, this.uPrev, this.vPrev);

    // Dye: diffuse then ride the (now divergence-free) velocity field.
    this.dyePrev.set(this.dye);
    this.diffuse(Boundary.Neither, this.dye, this.dyePrev, this.diffusion, dt);
    this.dyePrev.set(this.dye);
    this.advect(Boundary.Neither, this.dye, this.dyePrev, this.u, this.v, dt);

    if (this.dissipation < 1) {
      for (let i = 0; i < this.size; i++) this.dye[i] *= this.dissipation;
    }
  }

  /** Sum of |divergence| over the interior — near zero after projection. */
  totalDivergence(): number {
    const n = this.n;
    const ix = (i: number, j: number) => i + j * (n + 2);
    let sum = 0;
    for (let j = 1; j <= n; j++) {
      for (let i = 1; i <= n; i++) {
        sum += Math.abs(
          this.u[ix(i + 1, j)] - this.u[ix(i - 1, j)] + this.v[ix(i, j + 1)] - this.v[ix(i, j - 1)]
        );
      }
    }
    return sum;
  }

  totalDye(): number {
    let sum = 0;
    for (let i = 0; i < this.size; i++) sum += this.dye[i];
    return sum;
  }
}
