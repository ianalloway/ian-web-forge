import { describe, expect, it } from "vitest";
import {
  bezierPoint,
  deCasteljauLevels,
  defaultPoints,
  sampleCurve,
  type Pt,
} from "./decasteljau";

const quad: Pt[] = [
  { x: 0, y: 0 },
  { x: 2, y: 4 },
  { x: 4, y: 0 },
];

describe("bezierPoint", () => {
  it("interpolates the endpoints at t=0 and t=1", () => {
    expect(bezierPoint(quad, 0)).toEqual(quad[0]);
    expect(bezierPoint(quad, 1)).toEqual(quad[quad.length - 1]);
  });

  it("matches the analytic quadratic Bézier at interior t", () => {
    const [p0, p1, p2] = quad;
    for (const t of [0.1, 0.25, 0.5, 0.8]) {
      const mt = 1 - t;
      const ex = mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x;
      const ey = mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y;
      const p = bezierPoint(quad, t);
      expect(p.x).toBeCloseTo(ex, 10);
      expect(p.y).toBeCloseTo(ey, 10);
    }
  });

  it("evaluates a 2-point curve as a straight-line lerp", () => {
    const line: Pt[] = [
      { x: 0, y: 0 },
      { x: 10, y: 20 },
    ];
    // 0.25 and 0.5 are exact in binary floating point
    expect(bezierPoint(line, 0.5)).toEqual({ x: 5, y: 10 });
    expect(bezierPoint(line, 0.25)).toEqual({ x: 2.5, y: 5 });
  });
});

describe("deCasteljauLevels", () => {
  it("forms a shrinking pyramid ending in a single point", () => {
    const levels = deCasteljauLevels(quad, 0.5);
    expect(levels.map((l) => l.length)).toEqual([3, 2, 1]);
    expect(levels[0]).toBe(quad); // the first level is the control polygon itself
    expect(levels[levels.length - 1][0]).toEqual(bezierPoint(quad, 0.5));
  });
});

describe("sampleCurve", () => {
  it("returns samples+1 points spanning the endpoints", () => {
    const pts = sampleCurve(quad, 10);
    expect(pts).toHaveLength(11);
    expect(pts[0]).toEqual(quad[0]);
    expect(pts[pts.length - 1]).toEqual(quad[2]);
  });
});

describe("defaultPoints", () => {
  it("lays out four control points inside the given box", () => {
    const pts = defaultPoints(100, 200);
    expect(pts).toHaveLength(4);
    for (const p of pts) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(100);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(200);
    }
  });
});
