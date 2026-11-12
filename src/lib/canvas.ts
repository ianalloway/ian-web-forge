// Shared canvas helpers.
//
// Every experiment page used to size its canvas as `canvas.width = rect.width`,
// i.e. one backing-store pixel per CSS pixel. On the retina / high-DPI displays
// that almost everything now has, the browser then upscales that buffer and the
// drawing looks soft. These helpers size the backing store to the display's
// device pixels and scale the 2D context so page code can keep drawing in CSS
// pixels — the output is identical in layout, just rendered sharp.

import { prefersReducedMotion } from "./motion";

export { prefersReducedMotion };

/** 3x phones would make the backing store (and every fill) 9x the work for no
 *  visible gain over 2x, so the ratio is capped. */
export const MAX_DPR = 2;

/** The display's device-pixel ratio, clamped to [1, max]. SSR-safe. */
export function canvasDpr(max = MAX_DPR): number {
  const raw = (typeof window !== "undefined" && window.devicePixelRatio) || 1;
  return Math.min(Math.max(1, raw), max);
}

export interface FittedCanvas {
  /** 2D context with the device-pixel-ratio transform already applied. */
  ctx: CanvasRenderingContext2D | null;
  /** Logical width in CSS pixels — draw against this, not canvas.width. */
  width: number;
  /** Logical height in CSS pixels — draw against this, not canvas.height. */
  height: number;
  dpr: number;
}

/**
 * Size `canvas`'s backing store to `cssWidth × cssHeight` device pixels and
 * scale its 2D context by the device-pixel ratio, so all subsequent drawing is
 * done in CSS pixels. Returns the context plus the logical width/height to draw
 * against.
 *
 * IMPORTANT: after calling this, use the returned `width`/`height` for geometry,
 * not `canvas.width`/`canvas.height` (which are now device pixels).
 */
export function fitCanvas(
  canvas: HTMLCanvasElement,
  cssWidth: number,
  cssHeight: number,
  maxDpr = MAX_DPR,
): FittedCanvas {
  const dpr = canvasDpr(maxDpr);
  const width = Math.max(1, Math.round(cssWidth));
  const height = Math.max(1, Math.round(cssHeight));
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext("2d");
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width, height, dpr };
}

/**
 * Logical (CSS-pixel) position of a pointer/mouse event inside a canvas,
 * relative to its top-left. Works for PointerEvent, MouseEvent and the React
 * synthetic equivalents, so mouse, touch and pen all go through one path.
 */
export function pointerPos(
  e: { clientX: number; clientY: number },
  canvas: HTMLCanvasElement,
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

/** Whether ambient/auto-playing motion should run. False when the viewer has
 *  asked the OS to reduce motion — callers can start paused instead. */
export function shouldAutoAnimate(): boolean {
  return !prefersReducedMotion();
}
