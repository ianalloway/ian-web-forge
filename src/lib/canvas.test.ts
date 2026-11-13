// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { canvasDpr, fitCanvas, fitCanvasFixed, pointerPos, shouldAutoAnimate } from "./canvas";

function setDpr(v: number) {
  Object.defineProperty(window, "devicePixelRatio", { configurable: true, value: v });
}
function setReducedMotion(reduce: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (q: string) => ({ matches: reduce, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false }),
  });
}

// jsdom has no 2D context, so record what fitCanvas does to one.
function canvasWithRecordingCtx() {
  const calls: Array<[string, unknown[]]> = [];
  const ctx = new Proxy({}, { get: (_t, p: string) => (...args: unknown[]) => calls.push([p, args]) }) as unknown as CanvasRenderingContext2D;
  const canvas = document.createElement("canvas");
  canvas.getContext = (() => ctx) as unknown as HTMLCanvasElement["getContext"];
  return { canvas, calls };
}

afterEach(() => vi.unstubAllGlobals());

describe("canvasDpr", () => {
  it("clamps to [1, max] and caps high-DPI phones at 2", () => {
    setDpr(1); expect(canvasDpr()).toBe(1);
    setDpr(2); expect(canvasDpr()).toBe(2);
    setDpr(3); expect(canvasDpr()).toBe(2); // capped
    setDpr(0); expect(canvasDpr()).toBe(1); // floored
    setDpr(1.5); expect(canvasDpr()).toBe(1.5);
    setDpr(3); expect(canvasDpr(3)).toBe(3); // explicit cap honored
  });
});

describe("fitCanvas", () => {
  it("sizes the backing store to css × dpr and reports logical css dims", () => {
    setDpr(2);
    const { canvas } = canvasWithRecordingCtx();
    const { width, height, dpr } = fitCanvas(canvas, 300, 150);
    expect(dpr).toBe(2);
    expect(width).toBe(300);   // logical, for drawing
    expect(height).toBe(150);
    expect(canvas.width).toBe(600); // backing store, device pixels
    expect(canvas.height).toBe(300);
  });

  it("applies the dpr transform so drawing happens in css pixels", () => {
    setDpr(2);
    const { canvas, calls } = canvasWithRecordingCtx();
    fitCanvas(canvas, 100, 100);
    expect(calls).toContainEqual(["setTransform", [2, 0, 0, 2, 0, 0]]);
  });

  it("is identity at dpr 1 (non-retina unchanged)", () => {
    setDpr(1);
    const { canvas, calls } = canvasWithRecordingCtx();
    const f = fitCanvas(canvas, 240, 120);
    expect(canvas.width).toBe(240);
    expect(canvas.height).toBe(120);
    expect(f.width).toBe(240);
    expect(calls).toContainEqual(["setTransform", [1, 0, 0, 1, 0, 0]]);
  });

  it("never produces a zero-sized buffer", () => {
    setDpr(2);
    const { canvas } = canvasWithRecordingCtx();
    const f = fitCanvas(canvas, 0, 0);
    expect(canvas.width).toBeGreaterThanOrEqual(1);
    expect(f.width).toBeGreaterThanOrEqual(1);
  });
});

describe("fitCanvasFixed", () => {
  it("pins the CSS display size to the logical dims while scaling the backing store", () => {
    setDpr(2);
    const { canvas } = canvasWithRecordingCtx();
    const { width, height } = fitCanvasFixed(canvas, 300, 150);
    expect(width).toBe(300);
    expect(height).toBe(150);
    expect(canvas.width).toBe(600); // backing, device pixels
    expect(canvas.height).toBe(300);
    expect(canvas.style.width).toBe("300px"); // display stays logical
    expect(canvas.style.height).toBe("150px");
  });
});

describe("pointerPos", () => {
  it("returns css coordinates relative to the canvas top-left", () => {
    const canvas = document.createElement("canvas");
    canvas.getBoundingClientRect = () => ({ left: 10, top: 20, right: 0, bottom: 0, width: 0, height: 0, x: 10, y: 20, toJSON: () => ({}) });
    expect(pointerPos({ clientX: 30, clientY: 25 }, canvas)).toEqual({ x: 20, y: 5 });
  });
});

describe("shouldAutoAnimate", () => {
  it("is false when the viewer asked to reduce motion", () => {
    setReducedMotion(true);
    expect(shouldAutoAnimate()).toBe(false);
    setReducedMotion(false);
    expect(shouldAutoAnimate()).toBe(true);
  });
});
