import { describe, expect, it } from "vitest";
import {
  Pt,
  eigen2x2,
  eStep,
  gaussian2,
  initGmm,
  makeDataset,
  makeRng,
  step,
} from "./gmm";

describe("the 2-D Gaussian", () => {
  it("peaks at the mean and integrates toward 1 on a grid", () => {
    const mean = { x: 0, y: 0 };
    const cov: [number, number, number] = [1, 0, 1];
    expect(gaussian2(mean, mean, cov)).toBeCloseTo(1 / (2 * Math.PI), 10);
    // Riemann sum over a wide grid ≈ 1
    let sum = 0;
    const d = 0.1;
    for (let x = -5; x <= 5; x += d) for (let y = -5; y <= 5; y += d) sum += gaussian2({ x, y }, mean, cov) * d * d;
    expect(sum).toBeCloseTo(1, 2);
  });
});

describe("eigen-decomposition of symmetric 2×2", () => {
  it("recovers axis-aligned variances", () => {
    const e = eigen2x2(4, 0, 1);
    expect(e.l1).toBeCloseTo(4, 10);
    expect(e.l2).toBeCloseTo(1, 10);
    expect(e.angle).toBeCloseTo(0, 10);
  });

  it("orients the major axis vertically when y-variance dominates", () => {
    const e = eigen2x2(1, 0, 4);
    expect(e.l1).toBeCloseTo(4, 10);
    expect(Math.abs(e.angle)).toBeCloseTo(Math.PI / 2, 10);
  });

  it("eigenvalues sum to the trace and multiply to the determinant", () => {
    const [a, b, c] = [3, 1.2, 2];
    const e = eigen2x2(a, b, c);
    expect(e.l1 + e.l2).toBeCloseTo(a + c, 10);
    expect(e.l1 * e.l2).toBeCloseTo(a * c - b * b, 10);
  });
});

describe("responsibilities", () => {
  it("sum to 1 for every point", () => {
    const points = makeDataset("blobs", 600, 400, makeRng(1));
    const state = initGmm(points, 3, makeRng(2));
    for (const row of state.resp) {
      expect(row.reduce((s, r) => s + r, 0)).toBeCloseTo(1, 10);
    }
  });
});

describe("EM convergence", () => {
  const points = makeDataset("blobs", 600, 400, makeRng(10));

  it("never decreases the log-likelihood", () => {
    let state = initGmm(points, 3, makeRng(11));
    let prev = -Infinity;
    for (let i = 0; i < 40; i++) {
      state = step(points, state);
      const { logLik } = eStep(points, state.comps);
      expect(logLik).toBeGreaterThanOrEqual(prev - 1e-6);
      prev = logLik;
    }
  });

  it("keeps the mixing weights a valid distribution", () => {
    let state = initGmm(points, 3, makeRng(12));
    for (let i = 0; i < 20; i++) state = step(points, state);
    const sum = state.comps.reduce((s, c) => s + c.weight, 0);
    expect(sum).toBeCloseTo(1, 8);
    for (const c of state.comps) expect(c.weight).toBeGreaterThanOrEqual(0);
  });

  it("recovers three well-separated blob centers", () => {
    const truth: Pt[] = [
      { x: 600 * 0.27, y: 400 * 0.32 },
      { x: 600 * 0.72, y: 400 * 0.28 },
      { x: 600 * 0.5, y: 400 * 0.72 },
    ];
    let state = initGmm(points, 3, makeRng(13));
    for (let i = 0; i < 80; i++) state = step(points, state);
    // every true center has a fitted mean sitting essentially on top of it
    for (const t of truth) {
      const near = state.comps.some(
        (c) => Math.hypot(c.mean.x - t.x, c.mean.y - t.y) < 40
      );
      expect(near).toBe(true);
    }
  });
});
