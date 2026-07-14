export const CANVAS_W = 720;
export const CANVAS_H = 480;

export interface ViewState {
  cx: number;   // center real
  cy: number;   // center imaginary
  zoom: number; // pixels per unit
}

export const DEFAULT_VIEW: ViewState = { cx: -0.5, cy: 0, zoom: 180 };

export type ColorMode = "green" | "fire" | "electric";
export const COLOR_MODES: ColorMode[] = ["green", "fire", "electric"];

export function pixelToComplex(px: number, py: number, v: ViewState): [number, number] {
  return [v.cx + (px - CANVAS_W / 2) / v.zoom, v.cy + (py - CANVAS_H / 2) / v.zoom];
}

export function zoomToward(px: number, py: number, factor: number, v: ViewState): ViewState {
  const newZoom = v.zoom * factor;
  const [re, im] = pixelToComplex(px, py, v);
  return {
    cx: re - (px - CANVAS_W / 2) / newZoom,
    cy: im - (py - CANVAS_H / 2) / newZoom,
    zoom: newZoom,
  };
}

function mandelbrotIter(re: number, im: number, maxIter: number): number {
  let zr = 0, zi = 0, zr2 = 0, zi2 = 0;
  for (let i = 0; i < maxIter; i++) {
    zi = 2 * zr * zi + im;
    zr = zr2 - zi2 + re;
    zr2 = zr * zr;
    zi2 = zi * zi;
    if (zr2 + zi2 > 4) return i;
  }
  return -1;
}

function iterColor(t: number, mode: ColorMode): [number, number, number] {
  if (mode === "green") {
    const v = Math.sqrt(t);
    return [Math.round(v * 20), Math.round(v * 255), Math.round(v * 50)];
  }
  if (mode === "fire") {
    return [
      Math.min(255, Math.round(t * 3 * 255)),
      Math.min(255, Math.max(0, Math.round((t * 3 - 1) * 255))),
      Math.min(255, Math.max(0, Math.round((t * 3 - 2) * 255))),
    ];
  }
  // electric: blue → cyan → white
  return [
    Math.min(255, Math.max(0, Math.round((t * 3 - 2) * 255))),
    Math.min(255, Math.max(0, Math.round((t * 2 - 0.5) * 255))),
    Math.min(255, Math.round(55 + t * 200)),
  ];
}

function inSetColor(mode: ColorMode): [number, number, number] {
  if (mode === "green") return [0, 8, 3];
  if (mode === "fire") return [6, 0, 0];
  return [0, 0, 10];
}

export function renderMandelbrot(
  ctx: CanvasRenderingContext2D,
  view: ViewState,
  maxIter: number,
  mode: ColorMode
): void {
  const imageData = ctx.createImageData(CANVAS_W, CANVAS_H);
  const data = imageData.data;
  const [br, bg, bb] = inSetColor(mode);

  for (let py = 0; py < CANVAS_H; py++) {
    const im = view.cy + (py - CANVAS_H / 2) / view.zoom;
    for (let px = 0; px < CANVAS_W; px++) {
      const re = view.cx + (px - CANVAS_W / 2) / view.zoom;
      const iter = mandelbrotIter(re, im, maxIter);
      const idx = (py * CANVAS_W + px) * 4;
      if (iter === -1) {
        data[idx] = br; data[idx + 1] = bg; data[idx + 2] = bb;
      } else {
        const [r, g, b] = iterColor(iter / maxIter, mode);
        data[idx] = r; data[idx + 1] = g; data[idx + 2] = b;
      }
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}
