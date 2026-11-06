import { describe, expect, it } from "vitest";
import {
  covariance,
  eigenAxes,
  makeDataset,
  makeRng,
  mean,
  pca,
  project,
  variance,
} from "./pca";

describe("covariance", () => {
  it("is symmetric and (near) diagonal for an isotropic cloud", () => {
    const pts = makeDataset("round", 600, 400, makeRng(1));
    const [sxx, sxy, syy] = covariance(pts);
    expect(sxx).toBeGreaterThan(0);
    expect(syy).toBeGreaterThan(0);
    expect(Math.abs(sxy) / Math.sqrt(sxx * syy)).toBeLessThan(0.2); // |corr| small
  });
});

describe("eigenAxes", () => {
  it("eigenvalues sum to the trace and multiply to the determinant", () => {
    const [a, b, c] = [5, 2, 3];
    const e = eigenAxes(a, b, c);
    expect(e.l1 + e.l2).toBeCloseTo(a + c, 9);
    expect(e.l1 * e.l2).toBeCloseTo(a * c - b * b, 9);
    expect(e.l1).toBeGreaterThanOrEqual(e.l2);
  });

  it("returns orthonormal eigenvectors", () => {
    const e = eigenAxes(4, 1.3, 2);
    expect(Math.hypot(...e.v1)).toBeCloseTo(1, 9);
    expect(Math.hypot(...e.v2)).toBeCloseTo(1, 9);
    expect(e.v1[0] * e.v2[0] + e.v1[1] * e.v2[1]).toBeCloseTo(0, 9);
  });

  it("aligns PC1 with the x-axis when x-variance dominates", () => {
    const e = eigenAxes(10, 0, 1);
    expect(Math.abs(e.v1[1])).toBeCloseTo(0, 9); // horizontal
    expect(Math.abs(e.angle) % Math.PI).toBeCloseTo(0, 9);
  });
});

describe("pca on real clouds", () => {
  it("points PC1 along the correlation of a tilted cloud", () => {
    const r = pca(makeDataset("tilted", 600, 600, makeRng(2)));
    // the generator correlates x and y positively → PC1 slopes up-right
    expect(r.v1[0] * r.v1[1]).toBeGreaterThan(0.1);
    expect(r.varExplained).toBeGreaterThan(0.75);
  });

  it("splits variance evenly for an isotropic cloud", () => {
    const r = pca(makeDataset("round", 600, 400, makeRng(3)));
    expect(r.varExplained).toBeGreaterThan(0.45);
    expect(r.varExplained).toBeLessThan(0.65);
  });

  it("keeps almost all variance on PC1 for a stretched cloud", () => {
    const r = pca(makeDataset("wide", 600, 400, makeRng(4)));
    expect(r.varExplained).toBeGreaterThan(0.9);
  });
});

describe("projection", () => {
  it("variance along an eigenvector equals its eigenvalue", () => {
    const pts = makeDataset("tilted", 600, 600, makeRng(5));
    const r = pca(pts);
    const t1 = project(pts, r.mean, r.v1);
    const t2 = project(pts, r.mean, r.v2);
    expect(variance(t1)).toBeCloseTo(r.l1, 6);
    expect(variance(t2)).toBeCloseTo(r.l2, 6);
    // and PC1 carries strictly more spread than PC2
    expect(variance(t1)).toBeGreaterThan(variance(t2));
  });

  it("projections onto the two axes are uncorrelated (covariance ≈ 0)", () => {
    const pts = makeDataset("tilted", 600, 600, makeRng(6));
    const r = pca(pts);
    const t1 = project(pts, r.mean, r.v1);
    const t2 = project(pts, r.mean, r.v2);
    let cov = 0;
    for (let i = 0; i < t1.length; i++) cov += t1[i] * t2[i];
    cov /= t1.length;
    expect(Math.abs(cov)).toBeLessThan(1e-6 * (r.l1 + r.l2) + 1e-6);
  });
});

describe("mean", () => {
  it("is the centroid", () => {
    expect(mean([{ x: 0, y: 0 }, { x: 2, y: 4 }])).toEqual({ x: 1, y: 2 });
  });
});
