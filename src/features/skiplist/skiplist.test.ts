import { describe, expect, it } from "vitest";
import {
  MAX_LEVEL,
  SEQUENCES,
  insert,
  lane,
  levelCounts,
  linearComparisons,
  makeRng,
  newList,
  remove,
  search,
  toArray,
} from "./skiplist";

function build(keys: number[], seed = 7) {
  const list = newList(0.5, seed);
  for (const key of keys) insert(list, key);
  return list;
}

describe("as a sorted set", () => {
  it.each(SEQUENCES)("holds every key from the $id sequence, in order", (sequence) => {
    const keys = sequence.keys(300);
    const list = build(keys);
    expect(list.size).toBe(keys.length);
    expect(toArray(list)).toEqual([...keys].sort((a, b) => a - b));
  });

  it("finds everything it stored and nothing it did not", () => {
    const keys = SEQUENCES[1].keys(400);
    const list = build(keys);
    for (const key of keys) expect(search(list, key).found).toBe(true);
    // The sequences use even keys, so every odd one is absent.
    for (let key = 1; key < 800; key += 2) expect(search(list, key).found).toBe(false);
  });

  it("ignores duplicate inserts", () => {
    const list = build([10, 20, 30]);
    expect(insert(list, 20).inserted).toBe(false);
    expect(list.size).toBe(3);
    expect(toArray(list)).toEqual([10, 20, 30]);
  });

  it("removes keys without disturbing the rest", () => {
    const keys = SEQUENCES[1].keys(200);
    const list = build(keys);
    const doomed = keys.slice(0, 80);
    for (const key of doomed) expect(remove(list, key)).toBe(true);
    for (const key of doomed) expect(search(list, key).found).toBe(false);

    const survivors = keys.slice(80).sort((a, b) => a - b);
    expect(toArray(list)).toEqual(survivors);
    expect(list.size).toBe(survivors.length);
  });

  it("refuses to remove what is not there", () => {
    const list = build([2, 4, 6]);
    expect(remove(list, 5)).toBe(false);
    expect(list.size).toBe(3);
  });

  it("empties cleanly and collapses its express lanes", () => {
    const keys = SEQUENCES[0].keys(120);
    const list = build(keys);
    for (const key of keys) remove(list, key);
    expect(toArray(list)).toEqual([]);
    expect(list.size).toBe(0);
    expect(list.level).toBe(1);
  });
});

describe("the express lanes", () => {
  it("promotes about half the nodes each level, as the coin dictates", () => {
    const list = build(SEQUENCES[1].keys(4000), 12345);
    const counts = levelCounts(list);
    // Level 1 holds everything; each level up should hold roughly half of the
    // one below. Generous bounds, since this is a coin flip, not a guarantee.
    for (let level = 1; level < 6; level++) {
      const above = counts.slice(level).reduce((a, b) => a + b, 0);
      const below = counts.slice(level - 1).reduce((a, b) => a + b, 0);
      expect(above / below).toBeGreaterThan(0.3);
      expect(above / below).toBeLessThan(0.7);
    }
  });

  it("never exceeds the level cap", () => {
    const list = build(SEQUENCES[1].keys(2000), 999);
    expect(list.level).toBeLessThanOrEqual(MAX_LEVEL);
    let node = list.head.forward[0];
    while (node) {
      expect(node.level).toBeLessThanOrEqual(MAX_LEVEL);
      expect(node.forward.length).toBe(node.level);
      node = node.forward[0];
    }
  });

  it("keeps every lane sorted and a subset of the one below", () => {
    const list = build(SEQUENCES[1].keys(800), 42);
    for (let level = 0; level < list.level; level++) {
      const keys = lane(list, level).map((n) => n.key);
      expect([...keys].sort((a, b) => a - b)).toEqual(keys);
      if (level > 0) {
        const below = new Set(lane(list, level - 1).map((n) => n.key));
        for (const key of keys) expect(below.has(key)).toBe(true);
      }
    }
  });
});

describe("why it is worth the coin flips", () => {
  it("searches in far fewer comparisons than walking the list", () => {
    const keys = SEQUENCES[1].keys(2000);
    const list = build(keys, 2024);
    let skipTotal = 0;
    let linearTotal = 0;
    for (const key of keys) {
      skipTotal += search(list, key).comparisons;
      linearTotal += linearComparisons(list, key);
    }
    const skipAvg = skipTotal / keys.length;
    const linearAvg = linearTotal / keys.length;
    expect(skipAvg).toBeLessThan(linearAvg / 10);
    // Expected cost is O(log n); 2000 keys is about 11 levels of halving, and
    // the constant is small. A generous ceiling still catches a broken search.
    expect(skipAvg).toBeLessThan(4 * Math.log2(keys.length));
  });

  it("grows its search cost logarithmically, not linearly", () => {
    const cost = (n: number) => {
      const keys = SEQUENCES[1].keys(n);
      const list = build(keys, 5150);
      return keys.reduce((acc, k) => acc + search(list, k).comparisons, 0) / keys.length;
    };
    const small = cost(250);
    const large = cost(4000);
    // Sixteen times the data must not cost anything like sixteen times the work.
    expect(large).toBeLessThan(small * 3);
  });

  it("does not care what order the keys arrive in", () => {
    const costs = SEQUENCES.map((sequence) => {
      const keys = sequence.keys(1500);
      const list = build(keys, 31);
      return keys.reduce((acc, k) => acc + search(list, k).comparisons, 0) / keys.length;
    });
    // Sorted input is the case that destroys a plain BST; here it is unremarkable.
    const [sorted, shuffled] = costs;
    expect(Math.abs(sorted - shuffled) / shuffled).toBeLessThan(0.35);
  });

  it("reports a search path that starts high and ends on level 0", () => {
    const list = build(SEQUENCES[1].keys(500), 8);
    const { path } = search(list, 400);
    expect(path.length).toBeGreaterThan(0);
    expect(path[0].level).toBe(list.level - 1);
    expect(path[path.length - 1].level).toBe(0);
    // Levels only ever descend as the search proceeds.
    for (let i = 1; i < path.length; i++) {
      expect(path[i].level).toBeLessThanOrEqual(path[i - 1].level);
    }
  });
});

describe("determinism", () => {
  it("builds the same structure from the same seed", () => {
    const a = build(SEQUENCES[1].keys(300), 4242);
    const b = build(SEQUENCES[1].keys(300), 4242);
    expect(levelCounts(a)).toEqual(levelCounts(b));
    expect(toArray(a)).toEqual(toArray(b));
  });

  it("gives a different shape from a different seed", () => {
    const rng = makeRng(1);
    expect(rng()).not.toBe(makeRng(2)());
    const a = build(SEQUENCES[1].keys(500), 1);
    const b = build(SEQUENCES[1].keys(500), 2);
    expect(levelCounts(a)).not.toEqual(levelCounts(b));
    expect(toArray(a)).toEqual(toArray(b)); // same contents, different lanes
  });
});
