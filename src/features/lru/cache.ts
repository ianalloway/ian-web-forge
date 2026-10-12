// Cache eviction: five policies, and the two facts that make the comparison
// more than a horse race.
//
// Every policy here answers one question — the cache is full, which entry
// goes? — and they are all defensible. What makes the subject interesting is
// that two of the answers come with proofs attached.
//
// The first is Bélády's OPT: evict whatever is needed furthest in the future.
// It requires knowing the future, so nothing can implement it, but no policy
// can beat it either. That makes it the only honest ceiling to measure
// against: "LRU got 62%" means nothing until you know whether the ceiling was
// 64% or 95%.
//
// The second is subtler and genuinely surprising. LRU is a *stack algorithm*:
// at any moment, the contents of an LRU cache of size k are a subset of the
// contents at size k+1. So growing the cache can never turn a hit into a miss,
// and the hit rate is monotonic in capacity. FIFO has no such property, and
// on the right reference string a *bigger* FIFO cache gets *fewer* hits. That
// is Bélády's anomaly, and the classic witness is on the page as a preset.
//
// Nothing here is a model or an estimate: every number is a replay of the
// reference string, one access at a time.

export type PolicyId = "fifo" | "lru" | "lfu" | "clock" | "opt";

export interface PolicyInfo {
  id: PolicyId;
  label: string;
  blurb: string;
  /** True if it needs the future, and so cannot be built. */
  clairvoyant?: boolean;
}

export const POLICIES: PolicyInfo[] = [
  { id: "fifo", label: "FIFO", blurb: "evict the oldest arrival, regardless of use" },
  { id: "lru", label: "LRU", blurb: "evict the least recently used — a stack algorithm" },
  { id: "lfu", label: "LFU", blurb: "evict the least frequently used; slow to forget" },
  { id: "clock", label: "CLOCK", blurb: "one reference bit per entry: LRU on a budget" },
  {
    id: "opt",
    label: "OPT",
    blurb: "Bélády: evict what is needed furthest ahead — needs the future",
    clairvoyant: true,
  },
];

export interface Step {
  key: number;
  hit: boolean;
  evicted: number | null;
  /** Cache contents after this access, for drawing. */
  contents: number[];
}

export interface RunResult {
  steps: Step[];
  hits: number;
  misses: number;
  hitRate: number;
  evictions: number;
}

/**
 * Replay a reference string under one policy.
 *
 * The implementations are deliberately plain: an array of resident keys plus
 * whatever metadata the policy needs. Capacity is small and strings are short,
 * so an O(capacity) scan per access is irrelevant and the code stays readable
 * enough to check by eye against the description above.
 */
export function run(policy: PolicyId, refs: number[], capacity: number): RunResult {
  const cap = Math.max(1, Math.floor(capacity));
  const resident: number[] = [];
  const meta = new Map<number, number>(); // arrival order / last use / frequency
  const refBit = new Map<number, boolean>(); // CLOCK only
  let hand = 0; // CLOCK only
  let clock = 0;
  const steps: Step[] = [];
  let hits = 0;
  let evictions = 0;

  for (let i = 0; i < refs.length; i++) {
    const key = refs[i];
    clock++;
    const present = resident.includes(key);
    let evicted: number | null = null;

    if (present) {
      hits++;
      if (policy === "lru") meta.set(key, clock);
      if (policy === "lfu") meta.set(key, (meta.get(key) ?? 0) + 1);
      if (policy === "clock") refBit.set(key, true);
    } else {
      if (resident.length >= cap) {
        const victimIdx = chooseVictim(policy, resident, meta, refBit, refs, i, () => hand, (h) => {
          hand = h;
        });
        evicted = resident[victimIdx];
        resident.splice(victimIdx, 1);
        meta.delete(evicted);
        refBit.delete(evicted);
        evictions++;
        // CLOCK's hand indexes the resident array, which just shrank.
        if (policy === "clock" && hand > victimIdx) hand--;
      }
      resident.push(key);
      meta.set(key, policy === "lfu" ? 1 : clock);
      if (policy === "clock") refBit.set(key, false);
    }

    steps.push({ key, hit: present, evicted, contents: resident.slice() });
  }

  const misses = refs.length - hits;
  return {
    steps,
    hits,
    misses,
    hitRate: refs.length === 0 ? 0 : hits / refs.length,
    evictions,
  };
}

function chooseVictim(
  policy: PolicyId,
  resident: number[],
  meta: Map<number, number>,
  refBit: Map<number, boolean>,
  refs: number[],
  now: number,
  getHand: () => number,
  setHand: (h: number) => void,
): number {
  switch (policy) {
    case "fifo":
    case "lru":
    case "lfu": {
      // All three are "smallest metadata wins"; only the bookkeeping differs.
      // FIFO's is arrival time and is never refreshed on a hit, which is the
      // entire difference between it and LRU.
      let best = 0;
      for (let i = 1; i < resident.length; i++) {
        if ((meta.get(resident[i]) ?? 0) < (meta.get(resident[best]) ?? 0)) best = i;
      }
      return best;
    }
    case "clock": {
      // Sweep the hand, clearing reference bits until one is already clear.
      // Guaranteed to terminate: a full lap clears every bit.
      let hand = getHand() % resident.length;
      for (let guard = 0; guard < resident.length * 2 + 1; guard++) {
        const key = resident[hand];
        if (refBit.get(key)) {
          refBit.set(key, false);
          hand = (hand + 1) % resident.length;
        } else {
          setHand((hand + 1) % resident.length);
          return hand;
        }
      }
      setHand(0);
      return 0;
    }
    case "opt": {
      // Evict the entry whose next use is furthest away. One never used again
      // is the best possible victim.
      let best = 0;
      let bestDist = -1;
      for (let i = 0; i < resident.length; i++) {
        let dist = Infinity;
        for (let t = now + 1; t < refs.length; t++) {
          if (refs[t] === resident[i]) {
            dist = t - now;
            break;
          }
        }
        if (dist > bestDist) {
          bestDist = dist;
          best = i;
        }
        if (dist === Infinity) break;
      }
      return best;
    }
  }
}

/** Hit rate for one policy across a range of capacities. */
export function sweepCapacity(
  policy: PolicyId,
  refs: number[],
  maxCapacity: number,
): { capacity: number; hits: number; hitRate: number }[] {
  const out = [];
  for (let c = 1; c <= maxCapacity; c++) {
    const r = run(policy, refs, c);
    out.push({ capacity: c, hits: r.hits, hitRate: r.hitRate });
  }
  return out;
}

/**
 * Does this policy's hit count ever *fall* as the cache grows?
 *
 * For LRU and OPT the answer is provably never (both are stack algorithms).
 * For FIFO and CLOCK it can, and when it does this returns the witness, which
 * the page displays rather than merely asserting the anomaly exists.
 */
export function beladyAnomaly(
  policy: PolicyId,
  refs: number[],
  maxCapacity: number,
): { at: number; smaller: number; larger: number } | null {
  const sweep = sweepCapacity(policy, refs, maxCapacity);
  for (let i = 1; i < sweep.length; i++) {
    if (sweep[i].hits < sweep[i - 1].hits) {
      return { at: sweep[i].capacity, smaller: sweep[i - 1].hits, larger: sweep[i].hits };
    }
  }
  return null;
}

/**
 * The stack property itself, checked directly: is the resident set at capacity
 * k always a subset of the resident set at k+1, after every access?
 */
export function hasStackProperty(policy: PolicyId, refs: number[], maxCapacity: number): boolean {
  for (let c = 1; c < maxCapacity; c++) {
    const small = run(policy, refs, c).steps;
    const large = run(policy, refs, c + 1).steps;
    for (let t = 0; t < small.length; t++) {
      const bigSet = new Set(large[t].contents);
      for (const key of small[t].contents) if (!bigSet.has(key)) return false;
    }
  }
  return true;
}

// --- workloads -------------------------------------------------------------
//
// Each one exists because it separates the policies differently. The loop is
// the famous LRU killer: a cyclic scan one entry larger than the cache evicts
// exactly the line about to be needed, every single time, for a 0% hit rate —
// while OPT on the same string sails through.

export interface Workload {
  id: string;
  label: string;
  note: string;
  build: (n: number, universe: number, rand: () => number) => number[];
}

export const WORKLOADS: Workload[] = [
  {
    id: "zipf",
    label: "zipf",
    note: "a few hot keys and a long tail — what a real cache mostly sees",
    build: (n, universe, rand) => {
      const weights = Array.from({ length: universe }, (_, i) => 1 / (i + 1));
      const total = weights.reduce((a, b) => a + b, 0);
      return Array.from({ length: n }, () => {
        let r = rand() * total;
        for (let i = 0; i < universe; i++) {
          r -= weights[i];
          if (r <= 0) return i;
        }
        return universe - 1;
      });
    },
  },
  {
    id: "loop",
    label: "loop",
    note: "a cyclic scan just bigger than the cache: LRU's worst case, 0% hits",
    build: (n, universe) => Array.from({ length: n }, (_, i) => i % universe),
  },
  {
    id: "anomaly",
    label: "anomaly",
    note: "the textbook string where FIFO gets fewer hits from a bigger cache",
    // Bélády, Nelson and Shedler's witness: under FIFO this takes 9 faults
    // with 3 frames and 10 with 4.
    build: () => [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5],
  },
  {
    id: "shift",
    label: "working set",
    note: "a working set that moves: LFU keeps yesterday's winners too long",
    build: (n, universe, rand) => {
      const refs: number[] = [];
      const phases = 4;
      const per = Math.max(1, Math.floor(n / phases));
      for (let p = 0; p < phases; p++) {
        const base = Math.floor((p * universe) / phases);
        const span = Math.max(2, Math.floor(universe / phases));
        for (let i = 0; i < per; i++) refs.push(base + Math.floor(rand() * span));
      }
      return refs.slice(0, n).map((k) => k % universe);
    },
  },
  {
    id: "random",
    label: "uniform",
    note: "no locality at all — the floor, where every policy is equally blind",
    build: (n, universe, rand) => Array.from({ length: n }, () => Math.floor(rand() * universe)),
  },
];

/** Small deterministic PRNG so a seed reproduces a workload exactly. */
export function makeRng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}
