import { describe, expect, it } from "vitest";
import { epicyclePoints, harmonics, seriesValue } from "./series";

describe("harmonics", () => {
  it("square wave uses odd harmonics with 4/(nπ) amplitudes", () => {
    const hs = harmonics("square", 4);
    expect(hs.map((h) => h.n)).toEqual([1, 3, 5, 7]);
    for (const h of hs) expect(h.amp).toBeCloseTo(4 / (h.n * Math.PI), 12);
  });

  it("sawtooth uses every harmonic with alternating sign", () => {
    const hs = harmonics("sawtooth", 4);
    expect(hs.map((h) => h.n)).toEqual([1, 2, 3, 4]);
    expect(Math.sign(hs[0].amp)).toBe(1);
    expect(Math.sign(hs[1].amp)).toBe(-1);
    expect(Math.sign(hs[2].amp)).toBe(1);
  });

  it("triangle uses odd harmonics decaying like 1/n²", () => {
    const hs = harmonics("triangle", 3);
    expect(hs.map((h) => h.n)).toEqual([1, 3, 5]);
    for (const h of hs) {
      expect(Math.abs(h.amp)).toBeCloseTo(8 / (h.n * h.n * Math.PI * Math.PI), 12);
    }
  });
});

describe("seriesValue", () => {
  it("a square-wave partial sum sits near +1 across the positive half", () => {
    const hs = harmonics("square", 400);
    // Away from the discontinuities the Fourier square wave converges to +1.
    expect(seriesValue(hs, Math.PI / 2)).toBeCloseTo(1, 2);
    expect(seriesValue(hs, Math.PI / 4)).toBeGreaterThan(0.8);
  });

  it("is an odd function about the origin", () => {
    const hs = harmonics("sawtooth", 10);
    for (const t of [0.3, 1.1, 2.0]) {
      expect(seriesValue(hs, -t)).toBeCloseTo(-seriesValue(hs, t), 12);
    }
  });
});

describe("epicyclePoints", () => {
  it("chains one joint per harmonic starting at the origin", () => {
    const hs = harmonics("square", 5);
    const pts = epicyclePoints(hs, 0.7);
    expect(pts).toHaveLength(hs.length + 1);
    expect(pts[0]).toEqual({ x: 0, y: 0 });
  });

  it("gives each epicycle arm a radius equal to its harmonic amplitude", () => {
    const hs = harmonics("square", 4);
    const pts = epicyclePoints(hs, 0.9);
    for (let i = 0; i < hs.length; i++) {
      const dx = pts[i + 1].x - pts[i].x;
      const dy = pts[i + 1].y - pts[i].y;
      expect(Math.hypot(dx, dy)).toBeCloseTo(Math.abs(hs[i].amp), 12);
    }
  });
});
