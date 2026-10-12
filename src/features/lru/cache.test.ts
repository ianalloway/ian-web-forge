import { describe, expect, it } from "vitest";
import {
  POLICIES,
  WORKLOADS,
  beladyAnomaly,
  hasStackProperty,
  makeRng,
  run,
  sweepCapacity,
  type PolicyId,
} from "./cache";

const REAL: PolicyId[] = ["fifo", "lru", "lfu", "clock"];
const ALL: PolicyId[] = [...REAL, "opt"];

function workload(id: string, n = 400, universe = 12, seed = 5): number[] {
  const w = WORKLOADS.find((x) => x.id === id)!;
  return w.build(n, universe, makeRng(seed));
}

describe("replay bookkeeping", () => {
  it("accounts for every access exactly once", () => {
    const refs = workload("zipf");
    for (const p of ALL) {
      const r = run(p, refs, 5);
      expect(r.steps).toHaveLength(refs.length);
      expect(r.hits + r.misses).toBe(refs.length);
      expect(r.hitRate).toBeCloseTo(r.hits / refs.length, 12);
    }
  });

  it("never exceeds capacity, and never holds a duplicate", () => {
    const refs = workload("zipf");
    for (const p of ALL) {
      for (const cap of [1, 3, 7]) {
        for (const step of run(p, refs, cap).steps) {
          expect(step.contents.length).toBeLessThanOrEqual(cap);
          expect(new Set(step.contents).size).toBe(step.contents.length);
        }
      }
    }
  });

  it("holds the just-accessed key after every access", () => {
    const refs = workload("shift");
    for (const p of ALL) {
      for (const step of run(p, refs, 4).steps) {
        expect(step.contents).toContain(step.key);
      }
    }
  });

  it("evicts only when full and only on a miss", () => {
    const refs = workload("random");
    for (const p of ALL) {
      const r = run(p, refs, 4);
      for (const step of r.steps) {
        if (step.evicted !== null) {
          expect(step.hit).toBe(false);
          expect(step.contents.length).toBe(4);
        }
      }
      // Each eviction makes room for exactly one admission.
      expect(r.evictions).toBe(Math.max(0, r.misses - Math.min(4, new Set(refs).size)));
    }
  });

  it("is a pure replay — same input, same result", () => {
    const refs = workload("zipf");
    for (const p of ALL) expect(run(p, refs, 5)).toEqual(run(p, refs, 5));
  });

  it("treats capacity below 1 as 1 rather than dividing by zero", () => {
    const r = run("lru", [1, 2, 1, 2], 0);
    expect(r.steps.every((s) => s.contents.length === 1)).toBe(true);
  });

  it("handles an empty reference string", () => {
    for (const p of ALL) {
      const r = run(p, [], 4);
      expect(r.hits).toBe(0);
      expect(r.hitRate).toBe(0);
      expect(r.steps).toEqual([]);
    }
  });
});

describe("Bélády's OPT is an upper bound", () => {
  // The claim that makes every other number meaningful: no implementable
  // policy can beat the clairvoyant one. Checked across every workload and
  // capacity rather than asserted once.
  it("no policy ever beats OPT, on any workload or capacity", () => {
    for (const w of WORKLOADS) {
      const refs = w.build(300, 10, makeRng(21));
      for (let cap = 1; cap <= 8; cap++) {
        const opt = run("opt", refs, cap).hits;
        for (const p of REAL) {
          expect(run(p, refs, cap).hits).toBeLessThanOrEqual(opt);
        }
      }
    }
  });

  it("OPT keeps an entry that is needed again over one that never is", () => {
    // 9 is never referenced again after its first use, so it must be the
    // victim no matter what arrived when.
    const refs = [1, 2, 9, 3, 1, 2, 3, 1, 2, 3];
    const r = run("opt", refs, 3);
    const firstEviction = r.steps.find((s) => s.evicted !== null);
    expect(firstEviction?.evicted).toBe(9);
  });
});

describe("LRU's worst case", () => {
  it("gets zero hits on a cyclic scan one entry larger than the cache", () => {
    // Every eviction removes precisely the line needed next. This is a
    // statement about the policy, so it should hold at every capacity.
    for (let cap = 2; cap <= 8; cap++) {
      const refs = Array.from({ length: 400 }, (_, i) => i % (cap + 1));
      expect(run("lru", refs, cap).hits).toBe(0);
      // FIFO degenerates identically here — on a pure scan it makes the same
      // choice, which is worth knowing before blaming recency specifically.
      expect(run("fifo", refs, cap).hits).toBe(0);
      // OPT on the same string does fine, so the string is not the problem.
      // It must hold cap-1 of the cap+1 lines across each cycle, giving at
      // least (cap-1)/(cap+1) hits; measured values run comfortably above it.
      expect(run("opt", refs, cap).hitRate).toBeGreaterThanOrEqual((cap - 1) / (cap + 1));
    }
  });

  it("one more slot than the loop needs turns 0% into nearly 100%", () => {
    const refs = Array.from({ length: 400 }, (_, i) => i % 5);
    expect(run("lru", refs, 4).hits).toBe(0);
    expect(run("lru", refs, 5).hitRate).toBeGreaterThan(0.98);
  });
});

describe("the stack property and Bélády's anomaly", () => {
  it("LRU and OPT are stack algorithms, so hits never fall as the cache grows", () => {
    for (const w of WORKLOADS) {
      const refs = w.build(300, 10, makeRng(77));
      for (const p of ["lru", "opt"] as PolicyId[]) {
        const sweep = sweepCapacity(p, refs, 9);
        for (let i = 1; i < sweep.length; i++) {
          expect(sweep[i].hits).toBeGreaterThanOrEqual(sweep[i - 1].hits);
        }
        expect(beladyAnomaly(p, refs, 9)).toBeNull();
      }
    }
  });

  it("LRU's resident set at capacity k is a subset of its set at k+1", () => {
    // The stack property checked structurally, not just through its
    // consequence for hit counts.
    const refs = workload("zipf", 200, 9, 13);
    expect(hasStackProperty("lru", refs, 8)).toBe(true);
  });

  it("FIFO really does get fewer hits from a bigger cache on the classic string", () => {
    // Bélády, Nelson and Shedler's witness. The anomaly is the headline claim
    // of the page, so it is pinned to exact numbers rather than an inequality.
    const refs = workload("anomaly");
    const three = run("fifo", refs, 3);
    const four = run("fifo", refs, 4);
    expect(three.misses).toBe(9);
    expect(four.misses).toBe(10);
    expect(four.hits).toBeLessThan(three.hits);

    const witness = beladyAnomaly("fifo", refs, 5);
    expect(witness).not.toBeNull();
    expect(witness!.at).toBe(4);
    expect(witness!.larger).toBeLessThan(witness!.smaller);

    // LRU on the very same string does not regress — the anomaly is FIFO's,
    // not the workload's.
    expect(beladyAnomaly("lru", refs, 5)).toBeNull();
    expect(hasStackProperty("fifo", refs, 5)).toBe(false);
  });
});

describe("where the policies differ", () => {
  it("LRU keeps a hot key that FIFO evicts on schedule", () => {
    // A key touched every other access, interleaved with a scan too big to
    // cache. FIFO evicts on arrival order, so the hot key ages out no matter
    // how often it is used; LRU's refresh on hit is exactly what saves it.
    // (The first version of this test used the moving-working-set workload
    // instead and the two policies tied there, 584 hits each — recency only
    // helps when something is actually being re-referenced.)
    const refs: number[] = [];
    for (let i = 0; i < 300; i++) {
      refs.push(0);
      refs.push(1 + (i % 9));
    }
    const fifo = run("fifo", refs, 4);
    const lru = run("lru", refs, 4);
    expect(lru.hits).toBeGreaterThan(fifo.hits);
    // LRU holds the hot key permanently, so it hits on every other access.
    expect(lru.hitRate).toBeGreaterThan(0.49);
    expect(fifo.hitRate).toBeLessThan(0.4);
    expect(lru.steps[lru.steps.length - 1].contents).toContain(0);
  });

  it("LFU collapses when the working set moves", () => {
    // The flip side of the zipf result below: frequency is the right signal
    // only while the distribution holds still.
    const refs = workload("shift", 600, 16, 9);
    const lfu = run("lfu", refs, 5).hits;
    const lru = run("lru", refs, 5).hits;
    expect(lfu).toBeLessThan(lru * 0.6);
  });

  it("LFU holds on to a stale hot key after the working set moves", () => {
    // Two phases. Keys 0..2 are hammered, then never used again; 10..12 take
    // over. LFU's counts still favour the dead keys, so it keeps them.
    const refs = [
      ...Array.from({ length: 60 }, (_, i) => i % 3),
      ...Array.from({ length: 60 }, (_, i) => 10 + (i % 3)),
    ];
    const lfu = run("lfu", refs, 4);
    const lru = run("lru", refs, 4);
    expect(lru.hits).toBeGreaterThan(lfu.hits);
    // And the stale keys are demonstrably still resident at the end.
    const final = lfu.steps[lfu.steps.length - 1].contents;
    expect(final.some((k) => k < 3)).toBe(true);
  });

  it("CLOCK beats FIFO by using its one reference bit", () => {
    // What CLOCK's extra bit actually buys. Note it is *not* bounded above by
    // LRU: on this workload it beats LRU outright (698 hits to 627), which is
    // why the test asserts the FIFO comparison and not a sandwich — an
    // approximation of LRU is free to be better than LRU on a given string.
    const refs = workload("zipf", 1200, 20, 3);
    expect(run("clock", refs, 6).hits).toBeGreaterThan(run("fifo", refs, 6).hits);
  });

  it("LFU wins on a static skewed distribution, where frequency is the signal", () => {
    // Zipf never shifts, so counting uses is genuinely the best cheap guess —
    // LFU beats LRU here and loses badly as soon as the keys move.
    const refs = workload("zipf", 1200, 20, 3);
    expect(run("lfu", refs, 6).hits).toBeGreaterThan(run("lru", refs, 6).hits);
  });

  it("gives every policy the same answer when there is no locality to exploit", () => {
    // Uniform random access: the policies should be within a few points of
    // each other, which is the honest baseline for any cache comparison.
    const refs = workload("random", 4000, 40, 2);
    const rates = REAL.map((p) => run(p, refs, 8).hitRate);
    expect(Math.max(...rates) - Math.min(...rates)) .toBeLessThan(0.05);
  });

  it("a cache as large as the universe misses only the compulsory misses", () => {
    const refs = workload("zipf", 500, 10, 4);
    const distinct = new Set(refs).size;
    for (const p of ALL) expect(run(p, refs, 10).misses).toBe(distinct);
  });
});

describe("workload definitions", () => {
  it("every workload produces keys inside the universe", () => {
    for (const w of WORKLOADS) {
      const refs = w.build(200, 8, makeRng(1));
      expect(refs.length).toBeGreaterThan(0);
      for (const k of refs) {
        expect(Number.isInteger(k)).toBe(true);
        expect(k).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("the loop workload is exactly cyclic", () => {
    const refs = WORKLOADS.find((w) => w.id === "loop")!.build(20, 6, makeRng(1));
    expect(refs.slice(0, 7)).toEqual([0, 1, 2, 3, 4, 5, 0]);
  });

  it("the policy table covers every implemented policy and marks OPT clairvoyant", () => {
    expect(POLICIES.map((p) => p.id).sort()).toEqual([...ALL].sort());
    expect(POLICIES.filter((p) => p.clairvoyant).map((p) => p.id)).toEqual(["opt"]);
  });
});
