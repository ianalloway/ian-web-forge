import { describe, expect, it } from "vitest";
import {
  DISTRIBUTIONS,
  Point,
  Rect,
  WORLD,
  WORLD_BOUNDS,
  build,
  bruteForceNearest,
  bruteForceRange,
  contains,
  countNodes,
  depthOf,
  makeRng,
  movePoints,
  nearest,
  queryRange,
} from "./quadtree";

const key = (p: Point) => `${p.x.toFixed(6)},${p.y.toFixed(6)}`;
const asSet = (points: Point[]) => points.map(key).sort().join("|");

describe("range queries", () => {
  it.each(DISTRIBUTIONS)("returns exactly what brute force returns for $id points", (dist) => {
    const rng = makeRng(7);
    const points = dist.place(1200, rng);
    const tree = build(points, WORLD_BOUNDS, 4);

    for (let q = 0; q < 120; q++) {
      const range: Rect = {
        x: rng() * WORLD,
        y: rng() * WORLD,
        hw: 20 + rng() * 120,
        hh: 20 + rng() * 120,
      };
      expect(asSet(queryRange(tree, range).found)).toBe(asSet(bruteForceRange(points, range).found));
    }
  });

  it.each(DISTRIBUTIONS)("examines far fewer points than brute force for $id", (dist) => {
    const rng = makeRng(11);
    const points = dist.place(1200, rng);
    const tree = build(points, WORLD_BOUNDS, 4);

    let treeChecks = 0;
    let bruteChecks = 0;
    for (let q = 0; q < 200; q++) {
      const range: Rect = { x: rng() * WORLD, y: rng() * WORLD, hw: 20 + rng() * 100, hh: 20 + rng() * 100 };
      treeChecks += queryRange(tree, range).checks;
      bruteChecks += bruteForceRange(points, range).checks;
    }
    // The saving is the entire reason the structure exists.
    expect(treeChecks * 5).toBeLessThan(bruteChecks);
  });

  it("holds every point, so querying the whole world returns all of them", () => {
    for (const dist of DISTRIBUTIONS) {
      const points = dist.place(900, makeRng(3));
      const tree = build(points, WORLD_BOUNDS, 4);
      expect(queryRange(tree, WORLD_BOUNDS).found.length).toBe(points.length);
    }
  });

  it("returns nothing for a box outside the world", () => {
    const points = DISTRIBUTIONS[0].place(200, makeRng(1));
    const tree = build(points, WORLD_BOUNDS, 4);
    expect(queryRange(tree, { x: WORLD * 3, y: WORLD * 3, hw: 10, hh: 10 }).found).toEqual([]);
  });
});

describe("nearest neighbour", () => {
  it.each(DISTRIBUTIONS)("finds the same point brute force finds for $id", (dist) => {
    const rng = makeRng(13);
    const points = dist.place(800, rng);
    const tree = build(points, WORLD_BOUNDS, 4);

    for (let q = 0; q < 150; q++) {
      const x = rng() * WORLD;
      const y = rng() * WORLD;
      // Pruning must never lose the true nearest point.
      expect(nearest(tree, x, y).distance).toBeCloseTo(bruteForceNearest(points, x, y).distance, 9);
    }
  });

  it("prunes: it does not examine every point", () => {
    const rng = makeRng(17);
    const points = DISTRIBUTIONS[0].place(2000, rng);
    const tree = build(points, WORLD_BOUNDS, 4);
    let checks = 0;
    for (let q = 0; q < 100; q++) checks += nearest(tree, rng() * WORLD, rng() * WORLD).checks;
    expect(checks / 100).toBeLessThan(points.length / 4);
  });
});

describe("degenerate input", () => {
  it("caps depth on identical points instead of subdividing forever", () => {
    const same: Point[] = Array.from({ length: 400 }, () => ({ x: 500, y: 500, vx: 0, vy: 0 }));
    const tree = build(same, WORLD_BOUNDS, 4);
    expect(depthOf(tree)).toBeLessThanOrEqual(8);
    expect(countNodes(tree)).toBeLessThan(100);
    // Capped or not, no point may be lost.
    expect(queryRange(tree, WORLD_BOUNDS).found.length).toBe(400);
  });

  it("handles an empty world", () => {
    const tree = build([], WORLD_BOUNDS, 4);
    expect(queryRange(tree, WORLD_BOUNDS).found).toEqual([]);
    expect(nearest(tree, 10, 10).point).toBeNull();
    expect(countNodes(tree)).toBe(1);
  });
});

describe("movement", () => {
  it("keeps every point inside the world so the rebuild is total", () => {
    const points = DISTRIBUTIONS[0].place(500, makeRng(21));
    for (let frame = 0; frame < 3000; frame++) movePoints(points);
    for (const p of points) expect(contains(WORLD_BOUNDS, p)).toBe(true);
    expect(queryRange(build(points, WORLD_BOUNDS, 4), WORLD_BOUNDS).found.length).toBe(points.length);
  });
});
