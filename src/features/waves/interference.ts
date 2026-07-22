export interface Source {
  x: number; // in render-grid coords
  y: number;
  phase: number; // radians
}

export interface WaveParams {
  wavelength: number; // px in render-grid space
  speed: number; // phase velocity, radians of ωt per frame unit
  attenuate: boolean; // 1/sqrt(r) falloff
}

export const DEFAULT_WAVE: WaveParams = {
  wavelength: 26,
  speed: 0.18,
  attenuate: true,
};

export const MAX_SOURCES = 6;

/**
 * Render superposed circular waves into an RGBA buffer.
 * The buffer is (w × h); caller scales it up onto the visible canvas.
 * Green channel encodes positive amplitude, dim blue-green negative,
 * giving the matrix-style ripple look.
 */
export function renderWaves(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  sources: Source[],
  t: number,
  params: WaveParams
): void {
  const { wavelength, attenuate } = params;
  const k = (2 * Math.PI) / wavelength;
  const n = sources.length;
  if (n === 0) {
    data.fill(0);
    for (let i = 3; i < data.length; i += 4) data[i] = 255;
    return;
  }

  // Normalize so max possible |sum| ≈ n (or less with attenuation)
  const norm = 1 / n;

  let di = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      for (let s = 0; s < n; s++) {
        const dx = x - sources[s].x;
        const dy = y - sources[s].y;
        const r = Math.sqrt(dx * dx + dy * dy);
        let amp = Math.sin(k * r - t + sources[s].phase);
        if (attenuate) amp /= Math.sqrt(Math.max(r, 4) / 4);
        sum += amp;
      }
      const v = sum * norm; // roughly [-1, 1]

      if (v > 0) {
        const g = Math.min(255, v * 320);
        data[di] = g * 0.15;
        data[di + 1] = g;
        data[di + 2] = g * 0.3;
      } else {
        const b = Math.min(255, -v * 200);
        data[di] = 0;
        data[di + 1] = b * 0.25;
        data[di + 2] = b * 0.55;
      }
      data[di + 3] = 255;
      di += 4;
    }
  }
}

export function defaultSources(w: number, h: number): Source[] {
  return [
    { x: w * 0.35, y: h * 0.5, phase: 0 },
    { x: w * 0.65, y: h * 0.5, phase: 0 },
  ];
}
