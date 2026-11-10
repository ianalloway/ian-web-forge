import { describe, expect, it } from "vitest";
import { cross, monotoneChain, type Pt } from "./hull";

describe("cross product orientation", () => {
  const o: Pt = { x: 0, y: 0 };
  it("is positive for a left turn", () => {
    expect(cross(o, { x: 1, y: 0 }, { x: 0, y: 1 })).toBeGreaterThan(0);
  });
  it("is negative for a right turn", () => {
    expect(cross(o, { x: 1, y: 0 }, { x: 1, y: -1 })).toBeLessThan(0);
  });
  it("is zero for collinear points", () => {
    expect(cross(o, { x: 1, y: 0 }, { x: 2, y: 0 })).toBe(0);
  });
});

describe("monotone chain hull", () => {
  it("returns every point when there are fewer than three", () => {
    const pts: Pt[] = [{ x: 0, y: 0 }, { x: 1, y: 1 }];
    const r = monotoneChain(pts);
    expect(r.hull.length).toBe(2);
    expect(r.frames.length).toBe(0);
  });

  it("drops interior points and keeps the four corners of a square", () => {
    const pts: Pt[] = [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 2 },
      { x: 0, y: 2 },
      { x: 1, y: 1 }, // interior
    ];
    const r = monotoneChain(pts);
    expect(r.hull.length).toBe(4);

    const hullPts = r.hull.map((i) => r.sorted[i]);
    const key = (p: Pt) => `${p.x},${p.y}`;
    const got = new Set(hullPts.map(key));
    expect(got).toEqual(new Set(["0,0", "2,0", "2,2", "0,2"]));
    expect(got.has("1,1")).toBe(false);
  });

  it("emits an animation trace for non-trivial inputs", () => {
    const pts: Pt[] = Array.from({ length: 12 }, (_, i) => ({
      x: Math.cos((i / 12) * Math.PI * 2),
      y: Math.sin((i / 12) * Math.PI * 2),
    }));
    const r = monotoneChain(pts);
    // all 12 points lie on a circle, so all are hull vertices
    expect(r.hull.length).toBe(12);
    expect(r.frames.length).toBeGreaterThan(0);
  });

  it("produces a counter-clockwise (positive-area) polygon", () => {
    const pts: Pt[] = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 3 },
      { x: 0, y: 3 },
    ];
    const r = monotoneChain(pts);
    const poly = r.hull.map((i) => r.sorted[i]);
    let area2 = 0;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      area2 += a.x * b.y - b.x * a.y;
    }
    expect(area2).toBeGreaterThan(0); // CCW winding
    expect(area2 / 2).toBeCloseTo(12, 10); // 4 x 3 rectangle
  });
});
