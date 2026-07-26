// Mandelbrot escape-time with continuous (smooth) iteration coloring.

export interface View {
  cx: number; // center real
  cy: number; // center imaginary
  scale: number; // complex units per pixel
}

export const HOME: View = { cx: -0.6, cy: 0, scale: 3.2 / 900 };

/**
 * Smooth escape time for c = x + iy. Returns a fractional iteration count in
 * [0, maxIter); returns maxIter exactly for points that never escape (inside
 * the set). The fractional part uses the standard normalized-iteration formula
 * so color bands are continuous rather than stepped.
 */
export function escape(x: number, y: number, maxIter: number): number {
  // Quick reject: main cardioid and period-2 bulb are entirely in the set.
  const xm = x - 0.25;
  const q = xm * xm + y * y;
  if (q * (q + xm) <= 0.25 * y * y) return maxIter;
  if ((x + 1) * (x + 1) + y * y <= 0.0625) return maxIter;

  let zr = 0;
  let zi = 0;
  let zr2 = 0;
  let zi2 = 0;
  let i = 0;
  // Escape radius 2^8 gives a smooth normalized count with little banding.
  const bail = 256;
  while (i < maxIter && zr2 + zi2 <= bail * bail) {
    zi = 2 * zr * zi + y;
    zr = zr2 - zi2 + x;
    zr2 = zr * zr;
    zi2 = zi * zi;
    i++;
  }
  if (i >= maxIter) return maxIter;
  // Normalized iteration count: i + 1 - log2(log(|z|)).
  const logZn = Math.log(zr2 + zi2) / 2;
  const nu = Math.log(logZn / Math.LN2) / Math.LN2;
  return i + 1 - nu;
}

/** Pixel column/row -> complex coordinate for a view centered on the canvas. */
export function pixelToComplex(
  px: number,
  py: number,
  w: number,
  h: number,
  view: View
): { x: number; y: number } {
  return {
    x: view.cx + (px - w / 2) * view.scale,
    y: view.cy + (py - h / 2) * view.scale,
  };
}

/** A reasonable iteration budget for the current zoom level. */
export function iterationsFor(scale: number): number {
  // Deeper zoom (smaller scale) needs more iterations to resolve detail.
  const zoom = HOME.scale / scale;
  return Math.min(2000, Math.round(120 + 60 * Math.log2(zoom + 1)));
}

/**
 * Map a smooth iteration value to an [r,g,b] byte triple. Interior points
 * (m >= maxIter) are near-black; exterior points ride a cyclic matrix-green
 * palette shifted by `phase`.
 */
export function color(
  m: number,
  maxIter: number,
  phase: number
): [number, number, number] {
  if (m >= maxIter) return [4, 8, 5];
  // Cyclic coloring on the smooth count; sqrt spreads the inner bands.
  const t = Math.sqrt(m) * 0.28 + phase;
  const wave = (p: number) => 0.5 + 0.5 * Math.sin(Math.PI * 2 * (t + p));
  // Weight toward green with cyan/amber accents for depth.
  const g = 0.35 + 0.65 * wave(0);
  const r = 0.15 * wave(0.15) + 0.25 * wave(0.6);
  const b = 0.2 + 0.35 * wave(0.33);
  return [
    Math.min(255, Math.round(r * 255)),
    Math.min(255, Math.round(g * 255)),
    Math.min(255, Math.round(b * 255)),
  ];
}
