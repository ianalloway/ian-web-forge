// 2D Ising model on a periodic square lattice, evolved by the Metropolis
// single-spin-flip Monte Carlo algorithm. Below the critical temperature
// (Tc = 2 / ln(1 + √2) ≈ 2.269 for J = 1) the lattice spontaneously
// magnetizes into large domains; above it, thermal noise wins and spins
// stay disordered.

export const TC = 2 / Math.log(1 + Math.SQRT2); // ≈ 2.2692

export class Ising {
  readonly w: number;
  readonly h: number;
  spins: Int8Array; // ±1
  private T = 2.4;
  private exp4 = 0; // Boltzmann factor for ΔE = 4J
  private exp8 = 0; // Boltzmann factor for ΔE = 8J

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.spins = new Int8Array(w * h);
    this.randomize();
    this.setTemp(this.T);
  }

  /** Hot start: every spin independently ±1. */
  randomize() {
    const s = this.spins;
    for (let i = 0; i < s.length; i++) s[i] = Math.random() < 0.5 ? -1 : 1;
  }

  /** Cold start: fully aligned. */
  align(v: 1 | -1 = 1) {
    this.spins.fill(v);
  }

  setTemp(T: number) {
    this.T = Math.max(0.01, T);
    this.exp4 = Math.exp(-4 / this.T);
    this.exp8 = Math.exp(-8 / this.T);
  }

  get temp(): number {
    return this.T;
  }

  /**
   * Attempt `n` single-spin flips. Each attempt picks a random site, computes
   * the energy change ΔE = 2·s·(sum of 4 neighbors), and flips it if ΔE ≤ 0 or
   * with probability exp(−ΔE/T). Only ΔE ∈ {4, 8} need a Boltzmann factor.
   */
  step(n: number) {
    const { w, h, spins } = this;
    const size = w * h;
    for (let k = 0; k < n; k++) {
      const i = (Math.random() * size) | 0;
      const x = i % w;
      const y = (i / w) | 0;
      const left = spins[i - x + ((x + w - 1) % w)];
      const right = spins[i - x + ((x + 1) % w)];
      const up = spins[((y + h - 1) % h) * w + x];
      const down = spins[((y + 1) % h) * w + x];
      const s = spins[i];
      const dE = 2 * s * (left + right + up + down);
      if (dE <= 0 || Math.random() < (dE === 4 ? this.exp4 : this.exp8)) {
        spins[i] = -s as -1 | 1;
      }
    }
  }

  /** Net magnetization per spin, in [-1, 1]. */
  magnetization(): number {
    const s = this.spins;
    let m = 0;
    for (let i = 0; i < s.length; i++) m += s[i];
    return m / s.length;
  }

  /** Energy per spin (J = 1), counting each bond once. Range [-2, 2]. */
  energy(): number {
    const { w, h, spins } = this;
    let e = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const s = spins[y * w + x];
        const right = spins[y * w + ((x + 1) % w)];
        const down = spins[((y + 1) % h) * w + x];
        e -= s * right + s * down;
      }
    }
    return e / (w * h);
  }
}
