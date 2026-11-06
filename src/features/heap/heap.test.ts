import { describe, expect, it } from "vitest";
import {
  extractTop,
  heapify,
  heapsort,
  insert,
  isHeap,
  left,
  makeRng,
  parent,
  randomValues,
  right,
} from "./heap";

describe("index arithmetic", () => {
  it("parent inverts the child maps", () => {
    for (let i = 1; i < 50; i++) {
      expect(parent(left(i))).toBe(i);
      expect(parent(right(i))).toBe(i);
    }
  });
});

describe("heapify", () => {
  it("turns any array into a valid heap, both orders", () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const vals = randomValues(40, makeRng(seed));
      for (const min of [true, false]) {
        const a = [...vals];
        heapify(a, min);
        expect(isHeap(a, min)).toBe(true);
        expect([...a].sort((x, y) => x - y)).toEqual([...vals].sort((x, y) => x - y)); // permutation
      }
    }
  });

  it("puts the extreme at the root", () => {
    const vals = randomValues(30, makeRng(7));
    const max = [...vals];
    heapify(max, false);
    expect(max[0]).toBe(Math.max(...vals));
    const min = [...vals];
    heapify(min, true);
    expect(min[0]).toBe(Math.min(...vals));
  });
});

describe("insert", () => {
  it("keeps the heap valid after each insertion", () => {
    const a: number[] = [];
    const rng = makeRng(8);
    for (let k = 0; k < 60; k++) {
      insert(a, 1 + Math.floor(rng() * 98), false);
      expect(isHeap(a, false)).toBe(true);
    }
  });
});

describe("extractTop", () => {
  it("returns elements in priority order and keeps the heap valid", () => {
    const a = randomValues(50, makeRng(9));
    heapify(a, false);
    const out: number[] = [];
    while (a.length) {
      out.push(extractTop(a, false)!);
      expect(isHeap(a, false)).toBe(true);
    }
    // a max-heap hands them back in descending order
    expect(out).toEqual([...out].sort((x, y) => y - x));
    expect(extractTop([], false)).toBeUndefined();
  });
});

describe("heapsort", () => {
  it("sorts ascending with a max-heap and descending with a min-heap", () => {
    for (const seed of [11, 12, 13]) {
      const vals = randomValues(64, makeRng(seed));
      const asc = [...vals].sort((x, y) => x - y);
      expect(heapsort(vals, false)).toEqual(asc);
      expect(heapsort(vals, true)).toEqual([...asc].reverse());
    }
  });

  it("does not mutate its input", () => {
    const vals = randomValues(10, makeRng(14));
    const copy = [...vals];
    heapsort(vals, false);
    expect(vals).toEqual(copy);
  });

  it("handles trivial arrays", () => {
    expect(heapsort([], false)).toEqual([]);
    expect(heapsort([42], false)).toEqual([42]);
  });
});
