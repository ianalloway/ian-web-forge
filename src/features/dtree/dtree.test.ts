import { describe, expect, it } from "vitest";
import {
  LabeledPt,
  accuracy,
  bestSplit,
  build,
  gini,
  leafCount,
  leafRegions,
  makeDataset,
  makeRng,
  predict,
  treeDepth,
} from "./dtree";

describe("Gini impurity", () => {
  it("is 0 for a pure node", () => {
    expect(gini([10, 0], 10)).toBe(0);
  });
  it("is 0.5 for a balanced binary node", () => {
    expect(gini([5, 5], 10)).toBeCloseTo(0.5, 10);
  });
  it("is (C-1)/C at a uniform C-way split", () => {
    expect(gini([3, 3, 3], 9)).toBeCloseTo(2 / 3, 10);
  });
});

describe("best split", () => {
  it("finds the clean cut on linearly separable data", () => {
    const points: LabeledPt[] = [
      { x: 0, y: 0, label: 0 },
      { x: 1, y: 0, label: 0 },
      { x: 5, y: 0, label: 1 },
      { x: 6, y: 0, label: 1 },
    ];
    const s = bestSplit(points, 2);
    expect(s).not.toBeNull();
    expect(s!.feature).toBe(0);
    expect(s!.threshold).toBeGreaterThan(1);
    expect(s!.threshold).toBeLessThan(5);
    expect(s!.gain).toBeCloseTo(0.5, 10); // from 0.5 down to 0
  });

  it("returns null when no cut helps", () => {
    const points: LabeledPt[] = [
      { x: 0, y: 0, label: 0 },
      { x: 0, y: 0, label: 1 },
    ];
    expect(bestSplit(points, 2)).toBeNull();
  });
});

describe("tree building", () => {
  it("respects max depth", () => {
    const points = makeDataset("spiral", 600, 400, makeRng(1));
    const tree = build(points, { maxDepth: 3, minLeaf: 2, numClasses: 2 });
    expect(treeDepth(tree)).toBeLessThanOrEqual(3);
  });

  it("fits training data perfectly when grown deep enough", () => {
    const points = makeDataset("xor", 600, 400, makeRng(2));
    const tree = build(points, { maxDepth: 30, minLeaf: 2, numClasses: 2 });
    expect(accuracy(tree, points)).toBe(1);
  });

  it("gets better on training data as depth grows (never worse)", () => {
    const points = makeDataset("circles", 600, 400, makeRng(3));
    let prev = -1;
    for (let d = 1; d <= 10; d++) {
      const acc = accuracy(build(points, { maxDepth: d, minLeaf: 2, numClasses: 2 }), points);
      expect(acc).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = acc;
    }
  });

  it("a depth-1 stump separates two blobs well", () => {
    const points = makeDataset("blobs", 600, 400, makeRng(4));
    const stump = build(points, { maxDepth: 1, minLeaf: 2, numClasses: 2 });
    expect(stump.kind).toBe("split");
    expect(accuracy(stump, points)).toBeGreaterThan(0.9);
  });
});

describe("leaf regions", () => {
  it("there is exactly one region per leaf", () => {
    const points = makeDataset("xor", 600, 400, makeRng(5));
    const tree = build(points, { maxDepth: 6, minLeaf: 2, numClasses: 2 });
    expect(leafRegions(tree, 0, 0, 600, 400).length).toBe(leafCount(tree));
  });

  it("every region's label is what predict() returns at its center", () => {
    const points = makeDataset("circles", 600, 400, makeRng(6));
    const tree = build(points, { maxDepth: 8, minLeaf: 2, numClasses: 2 });
    for (const r of leafRegions(tree, 0, 0, 600, 400)) {
      expect(predict(tree, (r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2)).toBe(r.label);
    }
  });
});
