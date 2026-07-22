export interface Complex {
  re: number;
  im: number;
}

export interface PolyDef {
  label: string;
  roots: Complex[]; // known roots, for basin coloring
}

/** Featured polynomials (all with known closed-form roots). */
export const POLYS: Record<string, PolyDef> = {
  cube: {
    label: "z³ − 1",
    roots: [
      { re: 1, im: 0 },
      { re: -0.5, im: Math.sqrt(3) / 2 },
      { re: -0.5, im: -Math.sqrt(3) / 2 },
    ],
  },
  quartic: {
    label: "z⁴ − 1",
    roots: [
      { re: 1, im: 0 },
      { re: -1, im: 0 },
      { re: 0, im: 1 },
      { re: 0, im: -1 },
    ],
  },
  quintic: {
    label: "z⁵ − 1",
    roots: Array.from({ length: 5 }, (_, k) => ({
      re: Math.cos((2 * Math.PI * k) / 5),
      im: Math.sin((2 * Math.PI * k) / 5),
    })),
  },
};

export type PolyId = keyof typeof POLYS;

// Root hues spaced around the wheel
export const ROOT_HUES = [140, 200, 30, 300, 0];

/** Evaluate z^n and n*z^(n-1) via repeated multiplication (n = roots.length). */
function evalPoly(z: Complex, n: number): { f: Complex; df: Complex } {
  // z^n
  let re = 1, im = 0;
  for (let i = 0; i < n; i++) {
    const nr = re * z.re - im * z.im;
    const ni = re * z.im + im * z.re;
    re = nr; im = ni;
  }
  const f = { re: re - 1, im }; // z^n - 1
  // derivative n*z^(n-1)
  let dr = 1, di = 0;
  for (let i = 0; i < n - 1; i++) {
    const nr = dr * z.re - di * z.im;
    const ni = dr * z.im + di * z.re;
    dr = nr; di = ni;
  }
  const df = { re: n * dr, im: n * di };
  return { f, df };
}

export interface View {
  cx: number;
  cy: number;
  scale: number; // complex units across the shorter axis
}

export const DEFAULT_VIEW: View = { cx: 0, cy: 0, scale: 3 };

const MAX_ITER = 40;
const TOL2 = 1e-6;

/**
 * Render Newton basins into an RGBA buffer of size w*h. Each pixel is
 * colored by which root Newton's method converges to (hue) and how fast
 * (brightness). Uses the HSL->RGB of the matched root hue.
 */
export function renderNewton(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  poly: PolyDef,
  view: View
): void {
  const n = poly.roots.length;
  const aspect = w / h;
  const spanY = view.scale;
  const spanX = view.scale * aspect;

  let di = 0;
  for (let py = 0; py < h; py++) {
    const im0 = view.cy + (py / h - 0.5) * spanY;
    for (let px = 0; px < w; px++) {
      const re0 = view.cx + (px / w - 0.5) * spanX;
      let z = { re: re0, im: im0 };
      let iter = 0;
      for (; iter < MAX_ITER; iter++) {
        const { f, df } = evalPoly(z, n);
        const denom = df.re * df.re + df.im * df.im;
        if (denom < 1e-18) break;
        // z = z - f/df  (complex division)
        const qr = (f.re * df.re + f.im * df.im) / denom;
        const qi = (f.im * df.re - f.re * df.im) / denom;
        z = { re: z.re - qr, im: z.im - qi };
        // Converged near a root?
        let done = false;
        for (let r = 0; r < n; r++) {
          const dr = z.re - poly.roots[r].re;
          const dz = z.im - poly.roots[r].im;
          if (dr * dr + dz * dz < TOL2) { done = true; break; }
        }
        if (done) break;
      }

      // Which root?
      let best = 0;
      let bestD = Infinity;
      for (let r = 0; r < n; r++) {
        const dr = z.re - poly.roots[r].re;
        const dz = z.im - poly.roots[r].im;
        const d = dr * dr + dz * dz;
        if (d < bestD) { bestD = d; best = r; }
      }

      const hue = ROOT_HUES[best % ROOT_HUES.length];
      const light = Math.max(0.12, 0.62 - iter / MAX_ITER * 0.5);
      const [rr, gg, bb] = hslToRgb(hue / 360, 0.75, light);
      data[di] = rr;
      data[di + 1] = gg;
      data[di + 2] = bb;
      data[di + 3] = 255;
      di += 4;
    }
  }
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hk = (t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  return [
    Math.round(hk(h + 1 / 3) * 255),
    Math.round(hk(h) * 255),
    Math.round(hk(h - 1 / 3) * 255),
  ];
}

/** Zoom the view toward a pixel by a multiplicative factor. */
export function zoomAt(
  view: View, px: number, py: number, w: number, h: number, factor: number
): View {
  const aspect = w / h;
  const spanY = view.scale;
  const spanX = view.scale * aspect;
  const tx = view.cx + (px / w - 0.5) * spanX;
  const ty = view.cy + (py / h - 0.5) * spanY;
  const ns = view.scale * factor;
  // keep (tx,ty) under the cursor
  return { cx: tx - (px / w - 0.5) * ns * aspect, cy: ty - (py / h - 0.5) * ns, scale: ns };
}
