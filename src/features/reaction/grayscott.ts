export interface GrayScott {
  w: number;
  h: number;
  a: Float32Array; // chemical A concentration
  b: Float32Array; // chemical B concentration
  a2: Float32Array; // scratch buffers
  b2: Float32Array;
}

export interface RdParams {
  feed: number;
  kill: number;
  dA: number;
  dB: number;
}

export type PresetId = "coral" | "mitosis" | "spots" | "maze" | "waves";

export const PRESETS: Record<PresetId, { label: string; params: RdParams }> = {
  coral:   { label: "Coral",   params: { feed: 0.0545, kill: 0.062, dA: 1, dB: 0.5 } },
  mitosis: { label: "Mitosis", params: { feed: 0.0367, kill: 0.0649, dA: 1, dB: 0.5 } },
  spots:   { label: "Spots",   params: { feed: 0.03, kill: 0.062, dA: 1, dB: 0.5 } },
  maze:    { label: "Maze",    params: { feed: 0.029, kill: 0.057, dA: 1, dB: 0.5 } },
  waves:   { label: "Waves",   params: { feed: 0.014, kill: 0.054, dA: 1, dB: 0.5 } },
};

export function makeGrayScott(w: number, h: number): GrayScott {
  const n = w * h;
  const a = new Float32Array(n).fill(1);
  const b = new Float32Array(n).fill(0);
  // Seed a few random blobs of B to break symmetry
  const blobs = 8;
  for (let k = 0; k < blobs; k++) {
    const cx = Math.floor(Math.random() * w);
    const cy = Math.floor(Math.random() * h);
    const r = 4 + Math.floor(Math.random() * 5);
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const x = cx + dx, y = cy + dy;
        if (x < 0 || y < 0 || x >= w || y >= h) continue;
        if (dx * dx + dy * dy <= r * r) b[y * w + x] = 1;
      }
    }
  }
  return { w, h, a, b, a2: new Float32Array(n), b2: new Float32Array(n) };
}

/** Seed a circular patch of B at grid coords (used for painting). */
export function seed(gs: GrayScott, x: number, y: number, r: number): void {
  const { w, h, b } = gs;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const px = x + dx, py = y + dy;
      if (px < 0 || py < 0 || px >= w || py >= h) continue;
      if (dx * dx + dy * dy <= r * r) b[py * w + px] = 1;
    }
  }
}

/**
 * One Gray-Scott step with a 3x3 Laplacian kernel and toroidal wrap.
 * Runs `iterations` sub-steps for speed; ping-pongs the scratch buffers.
 */
export function stepGrayScott(gs: GrayScott, p: RdParams, iterations: number): void {
  const { w, h } = gs;
  let { a, b, a2, b2 } = gs;
  const { feed, kill, dA, dB } = p;

  for (let iter = 0; iter < iterations; iter++) {
    for (let y = 0; y < h; y++) {
      const yUp = ((y - 1 + h) % h) * w;
      const yMid = y * w;
      const yDn = ((y + 1) % h) * w;
      for (let x = 0; x < w; x++) {
        const xL = (x - 1 + w) % w;
        const xR = (x + 1) % w;
        const i = yMid + x;
        const av = a[i];
        const bv = b[i];

        // Laplacian: center -1, orthogonal 0.2, diagonal 0.05
        const lapA =
          a[yUp + xL] * 0.05 + a[yUp + x] * 0.2 + a[yUp + xR] * 0.05 +
          a[yMid + xL] * 0.2 + av * -1 + a[yMid + xR] * 0.2 +
          a[yDn + xL] * 0.05 + a[yDn + x] * 0.2 + a[yDn + xR] * 0.05;
        const lapB =
          b[yUp + xL] * 0.05 + b[yUp + x] * 0.2 + b[yUp + xR] * 0.05 +
          b[yMid + xL] * 0.2 + bv * -1 + b[yMid + xR] * 0.2 +
          b[yDn + xL] * 0.05 + b[yDn + x] * 0.2 + b[yDn + xR] * 0.05;

        const abb = av * bv * bv;
        let na = av + (dA * lapA - abb + feed * (1 - av));
        let nb = bv + (dB * lapB + abb - (kill + feed) * bv);
        na = na < 0 ? 0 : na > 1 ? 1 : na;
        nb = nb < 0 ? 0 : nb > 1 ? 1 : nb;
        a2[i] = na;
        b2[i] = nb;
      }
    }
    // swap
    const ta = a; a = a2; a2 = ta;
    const tb = b; b = b2; b2 = tb;
  }

  gs.a = a; gs.b = b; gs.a2 = a2; gs.b2 = b2;
}
