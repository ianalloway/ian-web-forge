import { describe, expect, it } from "vitest";
import {
  STREAMS,
  add,
  estimate,
  exactMemoryBytes,
  hash,
  memoryBytes,
  merge,
  newSketch,
  rank,
  registerStats,
  relativeError,
} from "./hll";

const countDistinct = (p: number, items: string[]) => {
  const sketch = newSketch(p);
  for (const item of items) add(sketch, item);
  return estimate(sketch);
};

describe("the hash", () => {
  it("is deterministic and well spread across the register space", () => {
    expect(hash("abc")).toBe(hash("abc"));
    expect(hash("abc")).not.toBe(hash("abd"));

    // Every one of 64 buckets should see roughly 1/64 of 200k keys. A badly
    // distributed hash makes the whole estimator meaningless.
    const buckets = new Array(64).fill(0);
    for (let i = 0; i < 200000; i++) buckets[hash(`key-${i}`) >>> 26]++;
    const expected = 200000 / 64;
    for (const count of buckets) {
      expect(Math.abs(count - expected) / expected).toBeLessThan(0.1);
    }
  });

  it("counts leading zeros as the rank", () => {
    expect(rank(0b1000, 4)).toBe(1);
    expect(rank(0b0100, 4)).toBe(2);
    expect(rank(0b0001, 4)).toBe(4);
    expect(rank(0, 4)).toBe(5); // all zeros: the deepest possible
  });
});

describe("accuracy", () => {
  // The guarantee is 1.04/sqrt(m) standard error, so a 3x allowance catches a
  // broken estimator while tolerating ordinary sampling noise.
  it.each([
    [10, 1000],
    [10, 50000],
    [12, 10000],
    [12, 500000],
    [14, 1000000],
  ])("precision %i estimates %i distinct items within tolerance", (p, n) => {
    const sketch = newSketch(p);
    for (let i = 0; i < n; i++) add(sketch, `item-${i}`);
    const error = Math.abs(estimate(sketch) - n) / n;
    expect(error).toBeLessThan(3 * relativeError(1 << p));
  });

  it("is exact enough on tiny cardinalities, where linear counting takes over", () => {
    for (const n of [1, 5, 50, 200]) {
      const sketch = newSketch(12);
      for (let i = 0; i < n; i++) add(sketch, `item-${i}`);
      const error = Math.abs(estimate(sketch) - n) / n;
      expect(error).toBeLessThan(0.1);
    }
  });

  it("reports zero for an empty sketch", () => {
    expect(estimate(newSketch(10))).toBe(0);
  });

  it("gets more accurate with more registers", () => {
    const n = 100000;
    const items = Array.from({ length: n }, (_, i) => `item-${i}`);
    const coarse = Math.abs(countDistinct(8, items) - n) / n;
    const fine = Math.abs(countDistinct(14, items) - n) / n;
    expect(fine).toBeLessThan(coarse);
    expect(relativeError(1 << 14)).toBeLessThan(relativeError(1 << 8));
  });
});

describe("what it is counting", () => {
  it("ignores repeats entirely", () => {
    const once = newSketch(12);
    const many = newSketch(12);
    for (let i = 0; i < 20000; i++) add(once, `user-${i}`);
    for (let i = 0; i < 20000; i++) for (let r = 0; r < 5; r++) add(many, `user-${i}`);
    // Adding the same item again cannot change a register, so these must be
    // bit-for-bit identical, not merely close.
    expect([...many.registers]).toEqual([...once.registers]);
  });

  it("flattens when the audience is bounded", () => {
    const sketch = newSketch(12);
    const stream = STREAMS.find((s) => s.id === "bounded")!;
    for (let i = 1; i <= 5000; i++) add(sketch, stream.item(i));
    const atFive = estimate(sketch);
    for (let i = 5001; i <= 50000; i++) add(sketch, stream.item(i));
    expect(Math.abs(estimate(sketch) - atFive) / atFive).toBeLessThan(0.001);
  });

  it.each(STREAMS.filter((s) => s.distinct(10) >= 0))("tracks the $id stream", (stream) => {
    const sketch = newSketch(12);
    const n = 40000;
    for (let i = 1; i <= n; i++) add(sketch, stream.item(i));
    const truth = stream.distinct(n);
    expect(Math.abs(estimate(sketch) - truth) / truth).toBeLessThan(3 * relativeError(1 << 12));
  });
});

describe("merging", () => {
  it("gives the same answer as one sketch over the whole stream", () => {
    const a = newSketch(12);
    const b = newSketch(12);
    const whole = newSketch(12);
    for (let i = 0; i < 30000; i++) {
      add(i % 2 === 0 ? a : b, `item-${i}`);
      add(whole, `item-${i}`);
    }
    // A pairwise maximum of registers is exactly what one sketch would hold.
    expect([...merge(a, b).registers]).toEqual([...whole.registers]);
  });

  it("counts the union, not the sum, when the halves overlap", () => {
    const a = newSketch(12);
    const b = newSketch(12);
    for (let i = 0; i < 20000; i++) add(a, `item-${i}`);
    for (let i = 10000; i < 30000; i++) add(b, `item-${i}`);
    // 30000 distinct across both, not 40000.
    const merged = estimate(merge(a, b));
    expect(Math.abs(merged - 30000) / 30000).toBeLessThan(3 * relativeError(1 << 12));
  });

  it("refuses to merge different precisions", () => {
    expect(() => merge(newSketch(10), newSketch(12))).toThrow();
  });
});

describe("the memory argument", () => {
  it("stays fixed while an exact count grows without bound", () => {
    const sketch = newSketch(14);
    expect(memoryBytes(sketch)).toBe(16384);
    for (let i = 0; i < 200000; i++) add(sketch, `item-${i}`);
    // Still 16 KB after 200k items, where exact counting would need megabytes.
    expect(memoryBytes(sketch)).toBe(16384);
    expect(exactMemoryBytes(200000)).toBeGreaterThan(100 * memoryBytes(sketch));
  });

  it("keeps registers small enough for a byte", () => {
    const sketch = newSketch(10);
    for (let i = 0; i < 300000; i++) add(sketch, `item-${i}`);
    const stats = registerStats(sketch);
    expect(stats.max).toBeLessThanOrEqual(23); // 32 - p + 1 is the ceiling
    expect(stats.zeros).toBe(0);
    expect(stats.mean).toBeGreaterThan(1);
  });
});
