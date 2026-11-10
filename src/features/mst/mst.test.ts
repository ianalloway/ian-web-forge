import { describe, expect, it } from "vitest";
import { kruskalMST, primMST, type Pt } from "./mst";

const square: Pt[] = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
];

const collinear: Pt[] = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 2, y: 0 },
];

describe("degenerate inputs", () => {
  it("returns no edges for fewer than two points", () => {
    for (const pts of [[], [{ x: 3, y: 4 }]] as Pt[][]) {
      expect(primMST(pts)).toEqual({ edges: [], totalWeight: 0 });
      expect(kruskalMST(pts)).toEqual({ edges: [], totalWeight: 0 });
    }
  });
});

describe("tree shape", () => {
  it("accepts exactly n-1 edges", () => {
    expect(primMST(square).edges.length).toBe(3);
    expect(kruskalMST(square).edges.length).toBe(3);
    expect(primMST(collinear).edges.length).toBe(2);
  });

  it("connects every vertex (the accepted edges span all nodes)", () => {
    for (const result of [primMST(square), kruskalMST(square)]) {
      const seen = new Set<number>();
      for (const [a, b] of result.edges) {
        seen.add(a);
        seen.add(b);
      }
      expect(seen.size).toBe(square.length);
    }
  });
});

describe("optimal weight", () => {
  it("is the known minimum on a unit square (3 unit edges)", () => {
    expect(primMST(square).totalWeight).toBeCloseTo(3, 10);
    expect(kruskalMST(square).totalWeight).toBeCloseTo(3, 10);
  });

  it("is the span of a collinear chain", () => {
    expect(primMST(collinear).totalWeight).toBeCloseTo(2, 10);
    expect(kruskalMST(collinear).totalWeight).toBeCloseTo(2, 10);
  });

  it("Prim and Kruskal agree on total weight for scattered points", () => {
    const pts: Pt[] = Array.from({ length: 30 }, (_, i) => ({
      x: Math.sin(i * 2.399963) * 50 + 50,
      y: Math.cos(i * 1.618034) * 50 + 50,
    }));
    expect(primMST(pts).totalWeight).toBeCloseTo(kruskalMST(pts).totalWeight, 9);
  });
});
