import { describe, expect, it } from "vitest";
import {
  type Graph,
  makeRng,
  newSurfer,
  powerStep,
  ranking,
  uniformRanks,
} from "./rank";

// Build a graph by hand from an adjacency list, so tests are fully deterministic
// (buildGraph randomises both edges and layout).
function graph(out: number[][]): Graph {
  const n = out.length;
  const inLinks: number[][] = Array.from({ length: n }, () => []);
  for (let i = 0; i < n; i++) for (const j of out[i]) inLinks[j].push(i);
  const pos = Array.from({ length: n }, () => [0, 0] as [number, number]);
  return { n, out, inLinks, pos };
}

function converge(g: Graph, damping = 0.85): Float64Array {
  let r = uniformRanks(g.n);
  for (let i = 0; i < 500; i++) {
    const step = powerStep(g, r, damping);
    r = step.ranks;
    if (step.delta < 1e-12) break;
  }
  return r;
}

const sum = (a: Float64Array) => a.reduce((s, x) => s + x, 0);

describe("makeRng", () => {
  it("is deterministic per seed and stays in [0,1)", () => {
    const a = makeRng(42);
    const b = makeRng(42);
    for (let i = 0; i < 100; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("gives different streams for different seeds", () => {
    expect(makeRng(1)()).not.toBe(makeRng(2)());
  });
});

describe("uniformRanks", () => {
  it("is a probability distribution of equal mass", () => {
    const r = uniformRanks(5);
    expect(sum(r)).toBeCloseTo(1, 12);
    expect([...r]).toEqual(Array(5).fill(0.2));
  });
});

describe("powerStep", () => {
  it("preserves total mass (ranks stay a distribution)", () => {
    const g = graph([[1, 2], [2], [0]]);
    let r = uniformRanks(g.n);
    for (let i = 0; i < 20; i++) {
      r = powerStep(g, r, 0.85).ranks;
      expect(sum(r)).toBeCloseTo(1, 12);
    }
  });

  it("converges to uniform on a symmetric cycle", () => {
    const g = graph([[1], [2], [0]]); // 0->1->2->0
    const r = converge(g);
    for (const v of r) expect(v).toBeCloseTo(1 / 3, 9);
  });

  it("drives the delta to zero as it converges", () => {
    const g = graph([[1, 2], [2], [0]]);
    let r = uniformRanks(g.n);
    let last = Infinity;
    for (let i = 0; i < 60; i++) {
      const step = powerStep(g, r, 0.85);
      r = step.ranks;
      last = step.delta;
    }
    expect(last).toBeLessThan(1e-9);
  });

  it("ranks a hub above its sources, and a dangling sink collects mass", () => {
    // 0 and 1 both link only to 2; 2 links nowhere (dangling).
    const g = graph([[2], [2], []]);
    const r = converge(g);
    expect(ranking(r)[0]).toBe(2);
    expect(r[2]).toBeGreaterThan(r[0]);
    expect(sum(r)).toBeCloseTo(1, 10);
  });
});

describe("ranking", () => {
  it("orders indices by descending rank", () => {
    const r = Float64Array.from([0.1, 0.5, 0.4]);
    expect(ranking(r)).toEqual([1, 2, 0]);
  });
});

describe("newSurfer", () => {
  it("starts at its origin with a single recorded visit", () => {
    const s = newSurfer(4, 2);
    expect(s.at).toBe(2);
    expect(s.steps).toBe(1);
    expect([...s.visits]).toEqual([0, 0, 1, 0]);
  });
});
