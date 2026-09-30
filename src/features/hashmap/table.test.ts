import { describe, expect, it } from "vitest";
import {
  SIZES,
  STRATEGIES,
  Strategy,
  insert,
  loadFactor,
  longestCluster,
  lookup,
  makeKeys,
  makeRng,
  measuredProbes,
  newTable,
  theoreticalProbes,
} from "./table";

const STRATEGY_IDS = STRATEGIES.map((s) => s.id);

function fill(size: number, strategy: Strategy, alpha: number, seed: number) {
  const table = newTable(size, strategy);
  const keys = makeKeys(Math.floor(size * alpha), makeRng(seed));
  for (const key of keys) insert(table, key);
  return { table, keys };
}

describe("storage", () => {
  it.each(STRATEGY_IDS)("%s finds every key it stored", (strategy) => {
    const { table, keys } = fill(197, strategy, 0.76, 99);
    for (const key of keys) expect(lookup(table, key).found).toBe(true);
    expect(table.count).toBe(keys.length);
  });

  it.each(STRATEGY_IDS)("%s never reports a key it was not given", (strategy) => {
    const { table, keys } = fill(197, strategy, 0.76, 99);
    const absent = makeKeys(200, makeRng(12345)).filter((k) => !keys.includes(k));
    expect(absent.length).toBeGreaterThan(0);
    for (const key of absent) expect(lookup(table, key).found).toBe(false);
  });

  it.each(STRATEGY_IDS)("%s ignores duplicate inserts", (strategy) => {
    const { table, keys } = fill(97, strategy, 0.5, 7);
    const before = table.count;
    for (const key of keys) insert(table, key);
    expect(table.count).toBe(before);
  });

  it.each(SIZES)("reports the load factor for a table of %i slots", (size) => {
    const { table } = fill(size, "linear", 0.5, 3);
    expect(loadFactor(table)).toBeCloseTo(table.count / size, 10);
  });
});

describe("probe counts against Knuth", () => {
  // The closed forms are asymptotic in the table size, so this averages over
  // many tables rather than trusting one unlucky set of keys.
  const measure = (strategy: Strategy, alpha: number) => {
    let total = 0;
    const reps = 40;
    for (let r = 0; r < reps; r++) {
      const { table, keys } = fill(389, strategy, alpha, r * 7919 + 13);
      total += measuredProbes(table, keys);
    }
    return total / reps;
  };

  // Quadratic probing has no exact closed form; it is covered separately below.
  const exact: Strategy[] = ["chaining", "linear", "double"];

  it.each(exact)("%s matches the theoretical successful-lookup cost", (strategy) => {
    for (const alpha of [0.5, 0.75, 0.9]) {
      const measured = measure(strategy, alpha);
      const theory = theoreticalProbes(strategy, alpha, true);
      expect(Math.abs(measured - theory) / theory).toBeLessThan(0.25);
    }
  });

  it("costs more as the table fills, for every strategy", () => {
    for (const strategy of STRATEGY_IDS) {
      expect(measure(strategy, 0.9)).toBeGreaterThan(measure(strategy, 0.5));
    }
  });

  it("ranks the strategies the way the theory says", () => {
    const alpha = 0.9;
    const chaining = measure("chaining", alpha);
    const double = measure("double", alpha);
    const linear = measure("linear", alpha);
    // Chaining walks a short list; linear probing walks a merged cluster.
    expect(chaining).toBeLessThan(double);
    expect(double).toBeLessThan(linear);
  });
});

describe("clustering", () => {
  it("shows linear probing clustering worse than double hashing", () => {
    const longest = (strategy: Strategy) => {
      let total = 0;
      for (let r = 0; r < 20; r++) total += longestCluster(fill(389, strategy, 0.85, r * 104729 + 5).table);
      return total / 20;
    };
    const linear = longest("linear");
    const double = longest("double");
    const quadratic = longest("quadratic");
    expect(linear).toBeGreaterThan(double);
    // Quadratic probing exists precisely to stop clusters merging.
    expect(quadratic).toBeLessThan(linear);
  });

  it("measures a chain, not a run, when chaining", () => {
    const { table } = fill(53, "chaining", 1.4, 21);
    // With more keys than slots every slot may be used, but chains stay short.
    expect(longestCluster(table)).toBeLessThan(table.count);
    expect(longestCluster(table)).toBeGreaterThan(1);
  });
});

describe("probe sequences", () => {
  it.each(STRATEGY_IDS)("%s records the slots it touched", (strategy) => {
    const { table, keys } = fill(97, strategy, 0.6, 31);
    const result = lookup(table, keys[0]);
    expect(result.probes.length).toBeGreaterThan(0);
    expect(table.lastProbe).toEqual(result.probes);
    for (const slot of result.probes) {
      expect(slot).toBeGreaterThanOrEqual(0);
      expect(slot).toBeLessThan(97);
    }
  });

  it("walks consecutive slots when probing linearly", () => {
    const { table, keys } = fill(97, "linear", 0.8, 5);
    for (const key of keys) {
      const probes = lookup(table, key).probes;
      for (let i = 1; i < probes.length; i++) {
        expect(probes[i]).toBe((probes[i - 1] + 1) % 97);
      }
    }
  });
});
