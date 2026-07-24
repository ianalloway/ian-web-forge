// Iterated Function Systems rendered by the "chaos game": pick a weighted-random
// affine map, apply it to the running point, plot, repeat. Despite the
// randomness, the plotted points converge to a deterministic fractal attractor.

export interface Affine {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

export interface IFS {
  name: string;
  blurb: string;
  maps: Affine[];
  weights: number[]; // parallel to maps; should sum to ~1
}

/** x' = a·x + b·y + e ;  y' = c·x + d·y + f */
export function applyAffine(m: Affine, x: number, y: number): [number, number] {
  return [m.a * x + m.b * y + m.e, m.c * x + m.d * y + m.f];
}

/** Weighted pick given r in [0,1). Falls through to the last map. */
export function pickMap(weights: number[], r: number): number {
  let acc = 0;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i];
    if (r < acc) return i;
  }
  return weights.length - 1;
}

const affine = (a: number, b: number, c: number, d: number, e: number, f: number): Affine => ({
  a,
  b,
  c,
  d,
  e,
  f,
});

export const PRESETS: IFS[] = [
  {
    name: "Barnsley fern",
    blurb: "four affine maps — one draws the stem, one the ever-shrinking copy",
    maps: [
      affine(0, 0, 0, 0.16, 0, 0),
      affine(0.85, 0.04, -0.04, 0.85, 0, 1.6),
      affine(0.2, -0.26, 0.23, 0.22, 0, 1.6),
      affine(-0.15, 0.28, 0.26, 0.24, 0, 0.44),
    ],
    weights: [0.01, 0.85, 0.07, 0.07],
  },
  {
    name: "Sierpiński triangle",
    blurb: "jump halfway to a random corner, forever — the holes appear on their own",
    maps: [
      affine(0.5, 0, 0, 0.5, 0, 0),
      affine(0.5, 0, 0, 0.5, 0.5, 0),
      affine(0.5, 0, 0, 0.5, 0.25, 0.433),
    ],
    weights: [1 / 3, 1 / 3, 1 / 3],
  },
  {
    name: "Heighway dragon",
    blurb: "two rotations by ±45° — the boundary of the folded-paper dragon curve",
    maps: [
      affine(0.5, -0.5, 0.5, 0.5, 0, 0),
      affine(-0.5, -0.5, 0.5, -0.5, 1, 0),
    ],
    weights: [0.5, 0.5],
  },
  {
    name: "Lévy C curve",
    blurb: "two half-scale rotations that fold a line into a billowing coastline",
    maps: [
      affine(0.5, -0.5, 0.5, 0.5, 0, 0),
      affine(0.5, 0.5, -0.5, 0.5, 0.5, 0.5),
    ],
    weights: [0.5, 0.5],
  },
  {
    name: "Fractal spiral",
    blurb: "one dominant rotate-and-shrink map winds the attractor into a spiral",
    maps: [
      affine(0.787879, -0.424242, 0.242424, 0.859848, 1.758647, 1.408065),
      affine(-0.121212, 0.257576, 0.151515, 0.05303, -6.721654, 1.377236),
      affine(0.181818, -0.136364, 0.090909, 0.181818, 6.086107, 1.568035),
    ],
    weights: [0.9, 0.05, 0.05],
  },
];

export interface Bounds {
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
}

/**
 * Estimate the attractor's bounding box by running the chaos game, discarding
 * a short warm-up so the point has settled onto the attractor.
 */
export function computeBounds(ifs: IFS, iterations = 40000, rng: () => number = Math.random): Bounds {
  let x = 0;
  let y = 0;
  let xmin = Infinity;
  let xmax = -Infinity;
  let ymin = Infinity;
  let ymax = -Infinity;
  for (let i = 0; i < iterations; i++) {
    const m = ifs.maps[pickMap(ifs.weights, rng())];
    [x, y] = applyAffine(m, x, y);
    if (i < 20) continue;
    if (x < xmin) xmin = x;
    if (x > xmax) xmax = x;
    if (y < ymin) ymin = y;
    if (y > ymax) ymax = y;
  }
  return { xmin, xmax, ymin, ymax };
}
