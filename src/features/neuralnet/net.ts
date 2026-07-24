// A tiny multilayer perceptron trained with backpropagation, plus 2D toy
// datasets — enough to watch a decision boundary form as the net learns.

export interface Sample {
  x: number; // in [-1, 1]
  y: number;
  label: number; // 0 or 1
}

export type DatasetKind = "circles" | "xor" | "spiral" | "blobs";

const tanh = Math.tanh;

/** Generate one of the toy 2D datasets, roughly balanced between classes. */
export function makeDataset(kind: DatasetKind, n: number, rng: () => number = Math.random): Sample[] {
  const out: Sample[] = [];
  const gauss = () => {
    // Box-Muller
    let u = 0;
    let v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  for (let i = 0; i < n; i++) {
    if (kind === "circles") {
      const label = i % 2;
      const r = label === 0 ? 0.15 + rng() * 0.2 : 0.6 + rng() * 0.25;
      const a = rng() * Math.PI * 2;
      out.push({ x: r * Math.cos(a), y: r * Math.sin(a), label });
    } else if (kind === "xor") {
      const x = rng() * 1.8 - 0.9;
      const y = rng() * 1.8 - 0.9;
      out.push({ x, y, label: x * y > 0 ? 1 : 0 });
    } else if (kind === "spiral") {
      const label = i % 2;
      const t = (i / n) * 3.2 + rng() * 0.1;
      const r = t * 0.28;
      const a = t * 2.2 + label * Math.PI;
      out.push({ x: r * Math.cos(a), y: r * Math.sin(a), label });
    } else {
      // blobs: two gaussian clusters
      const label = i % 2;
      const cx = label === 0 ? -0.45 : 0.45;
      const cy = label === 0 ? -0.35 : 0.4;
      out.push({ x: cx + gauss() * 0.18, y: cy + gauss() * 0.18, label });
    }
  }
  return out;
}

/** Dense feed-forward net: tanh hidden layers, sigmoid output, BCE loss. */
export class MLP {
  readonly sizes: number[];
  private W: Float64Array[] = [];
  private b: Float64Array[] = [];

  constructor(sizes: number[], rng: () => number = Math.random) {
    this.sizes = sizes;
    for (let l = 1; l < sizes.length; l++) {
      const fanIn = sizes[l - 1];
      const fanOut = sizes[l];
      const w = new Float64Array(fanOut * fanIn);
      const scale = Math.sqrt(2 / (fanIn + fanOut));
      for (let i = 0; i < w.length; i++) w[i] = (rng() * 2 - 1) * scale;
      this.W.push(w);
      this.b.push(new Float64Array(fanOut));
    }
  }

  /** Forward pass; returns the output probability and every layer's activations. */
  forward(input: number[]): { out: number; acts: Float64Array[] } {
    const acts: Float64Array[] = [Float64Array.from(input)];
    let a = acts[0];
    for (let l = 0; l < this.W.length; l++) {
      const inN = this.sizes[l];
      const outN = this.sizes[l + 1];
      const w = this.W[l];
      const bl = this.b[l];
      const z = new Float64Array(outN);
      const last = l === this.W.length - 1;
      for (let o = 0; o < outN; o++) {
        let s = bl[o];
        const base = o * inN;
        for (let i = 0; i < inN; i++) s += w[base + i] * a[i];
        z[o] = last ? 1 / (1 + Math.exp(-s)) : tanh(s);
      }
      acts.push(z);
      a = z;
    }
    return { out: a[0], acts };
  }

  predict(x: number, y: number): number {
    return this.forward([x, y]).out;
  }

  /**
   * One mini-batch of gradient descent (BCE loss). Returns the average loss
   * over the batch before the update.
   */
  trainBatch(batch: Sample[], lr: number): number {
    const L = this.W.length;
    const gW = this.W.map((w) => new Float64Array(w.length));
    const gb = this.b.map((b) => new Float64Array(b.length));
    let loss = 0;

    for (const s of batch) {
      const { out, acts } = this.forward([s.x, s.y]);
      const p = Math.min(1 - 1e-7, Math.max(1e-7, out));
      loss += -(s.label * Math.log(p) + (1 - s.label) * Math.log(1 - p));

      // Output-layer delta for sigmoid + BCE is simply (p - y).
      let delta = new Float64Array([out - s.label]);
      for (let l = L - 1; l >= 0; l--) {
        const inN = this.sizes[l];
        const outN = this.sizes[l + 1];
        const aIn = acts[l];
        const w = this.W[l];
        const gw = gW[l];
        const gbl = gb[l];
        for (let o = 0; o < outN; o++) {
          const d = delta[o];
          gbl[o] += d;
          const base = o * inN;
          for (let i = 0; i < inN; i++) gw[base + i] += d * aIn[i];
        }
        if (l > 0) {
          // Propagate to previous (tanh) layer: dPrev_i = (Σ_o W[o,i]·delta_o)·(1 - a_i²)
          const prev = new Float64Array(inN);
          for (let i = 0; i < inN; i++) {
            let s2 = 0;
            for (let o = 0; o < outN; o++) s2 += w[o * inN + i] * delta[o];
            prev[i] = s2 * (1 - aIn[i] * aIn[i]);
          }
          delta = prev;
        }
      }
    }

    const scale = lr / batch.length;
    for (let l = 0; l < L; l++) {
      const w = this.W[l];
      const gw = gW[l];
      for (let i = 0; i < w.length; i++) w[i] -= scale * gw[i];
      const b = this.b[l];
      const gbl = gb[l];
      for (let o = 0; o < b.length; o++) b[o] -= scale * gbl[o];
    }
    return loss / batch.length;
  }

  /** Classification accuracy over a sample set at threshold 0.5. */
  accuracy(samples: Sample[]): number {
    let correct = 0;
    for (const s of samples) if ((this.predict(s.x, s.y) >= 0.5 ? 1 : 0) === s.label) correct++;
    return correct / samples.length;
  }
}
