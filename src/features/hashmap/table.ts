// Hash tables: what actually happens when two keys land in the same slot.
//
// A hash table is O(1) only on average, and the average depends entirely on the
// load factor α = keys/slots and on how collisions are resolved. The four
// strategies here fail in different ways as the table fills:
//
//   chaining          each slot holds a list; cost grows linearly and gently
//   linear probing    walk forward to the next free slot; fast until clusters
//                     form, then catastrophic — clusters merge and grow
//   quadratic probing jump by 1, 4, 9, … so probes spread out and clusters
//                     stop merging, at the cost of worse cache behaviour
//   double hashing    the step size itself is hashed, so every key walks its
//                     own sequence — the closest thing to the uniform-hashing
//                     ideal the textbook analysis assumes
//
// Knuth's results for the expected number of probes are exact enough to check
// a simulation against, which is what `theoreticalProbes` is for.

export type Strategy = "chaining" | "linear" | "quadratic" | "double";

export interface StrategyInfo {
  id: Strategy;
  label: string;
  note: string;
}

export const STRATEGIES: StrategyInfo[] = [
  {
    id: "chaining",
    label: "chaining",
    note: "each slot keeps a list — degrades gently and never fills up",
    },
  {
    id: "linear",
    label: "linear probing",
    note: "walk to the next free slot — cache-friendly until clusters merge, then it falls apart",
  },
  {
    id: "quadratic",
    label: "quadratic probing",
    note: "jump 1, 4, 9, … — breaks up the clusters that ruin linear probing",
  },
  {
    id: "double",
    label: "double hashing",
    note: "hash the step size too, so every key walks its own path — closest to the ideal",
  },
];

// FNV-1a: a small, well-mixed string hash. The table size is kept prime so the
// double-hashing step is always coprime with it and the probe sequence visits
// every slot.
export function hash1(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

// A different mixing constant gives an independent second hash for the step.
export function hash2(key: string, size: number): number {
  let h = 0x9e3779b9;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x85ebca6b) >>> 0;
  }
  // 1..size-1, never 0, and coprime with a prime size.
  return 1 + (h % (size - 1));
}

export interface Table {
  size: number;
  strategy: Strategy;
  slots: (string | null)[]; // open addressing
  chains: string[][]; // chaining
  count: number;
  totalInsertProbes: number;
  inserts: number;
  lastProbe: number[]; // the slots touched by the most recent operation
  lastKey: string | null;
  lastSuccess: boolean;
}

export function newTable(size: number, strategy: Strategy): Table {
  return {
    size,
    strategy,
    slots: new Array(size).fill(null),
    chains: Array.from({ length: size }, () => []),
    count: 0,
    totalInsertProbes: 0,
    inserts: 0,
    lastProbe: [],
    lastKey: null,
    lastSuccess: false,
  };
}

export function loadFactor(t: Table): number {
  return t.count / t.size;
}

// The slot a key would be tried in on its `attempt`-th probe.
export function probeSlot(t: Table, key: string, attempt: number): number {
  const base = hash1(key) % t.size;
  if (attempt === 0) return base;
  switch (t.strategy) {
    case "linear":
      return (base + attempt) % t.size;
    case "quadratic":
      return (base + attempt * attempt) % t.size;
    case "double":
      return (base + attempt * hash2(key, t.size)) % t.size;
    default:
      return base;
  }
}

export interface OpResult {
  probes: number[]; // slots visited, in order
  found: boolean; // for lookups
  inserted: boolean; // for inserts
}

export function insert(t: Table, key: string): OpResult {
  const probes: number[] = [];

  if (t.strategy === "chaining") {
    const slot = hash1(key) % t.size;
    probes.push(slot);
    const chain = t.chains[slot];
    // Walking the chain to check for a duplicate is itself part of the cost.
    for (const existing of chain) {
      if (existing === key) {
        record(t, key, probes, false);
        return { probes, found: true, inserted: false };
      }
    }
    chain.push(key);
    t.count++;
    t.totalInsertProbes += 1 + chain.length / 2;
    t.inserts++;
    record(t, key, probes, true);
    return { probes, found: false, inserted: true };
  }

  for (let attempt = 0; attempt < t.size; attempt++) {
    const slot = probeSlot(t, key, attempt);
    probes.push(slot);
    if (t.slots[slot] === key) {
      record(t, key, probes, false);
      return { probes, found: true, inserted: false };
    }
    if (t.slots[slot] === null) {
      t.slots[slot] = key;
      t.count++;
      t.totalInsertProbes += probes.length;
      t.inserts++;
      record(t, key, probes, true);
      return { probes, found: false, inserted: true };
    }
  }
  // Quadratic probing only guarantees it visits half the slots, so a full
  // table can genuinely refuse an insert. That is a real property, not a bug.
  record(t, key, probes, false);
  return { probes, found: false, inserted: false };
}

export function lookup(t: Table, key: string): OpResult {
  const probes: number[] = [];

  if (t.strategy === "chaining") {
    const slot = hash1(key) % t.size;
    probes.push(slot);
    const chain = t.chains[slot];
    for (const existing of chain) {
      if (existing === key) {
        record(t, key, probes, true);
        return { probes, found: true, inserted: false };
      }
    }
    record(t, key, probes, false);
    return { probes, found: false, inserted: false };
  }

  for (let attempt = 0; attempt < t.size; attempt++) {
    const slot = probeSlot(t, key, attempt);
    probes.push(slot);
    if (t.slots[slot] === key) {
      record(t, key, probes, true);
      return { probes, found: true, inserted: false };
    }
    if (t.slots[slot] === null) break; // an empty slot proves the key is absent
  }
  record(t, key, probes, false);
  return { probes, found: false, inserted: false };
}

function record(t: Table, key: string, probes: number[], success: boolean): void {
  t.lastKey = key;
  t.lastProbe = probes;
  t.lastSuccess = success;
}

// Probes for a chaining lookup are list steps, not slot visits, so they are
// counted separately from the single slot touched.
export function chainCost(t: Table, key: string): number {
  const slot = hash1(key) % t.size;
  const chain = t.chains[slot];
  const idx = chain.indexOf(key);
  return idx >= 0 ? idx + 1 : chain.length + 1;
}

export function measuredProbes(t: Table, keys: string[]): number {
  if (keys.length === 0) return 0;
  let total = 0;
  for (const key of keys) {
    total += t.strategy === "chaining" ? chainCost(t, key) : lookup(t, key).probes.length;
  }
  return total / keys.length;
}

// The longest run of consecutive occupied slots — the thing that kills linear
// probing, and the reason the other strategies exist.
export function longestCluster(t: Table): number {
  if (t.strategy === "chaining") {
    let longest = 0;
    for (const chain of t.chains) if (chain.length > longest) longest = chain.length;
    return longest;
  }
  let longest = 0;
  let run = 0;
  // Scan twice so a cluster wrapping around the end is measured whole.
  for (let i = 0; i < t.size * 2; i++) {
    if (t.slots[i % t.size] !== null) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 0;
    }
  }
  return Math.min(longest, t.size);
}

// ── Theory ──────────────────────────────────────────────────────────────────

// Knuth's expected probe counts. These are asymptotic in the table size, so a
// small table wanders around them, but they are close enough to check against.
export function theoreticalProbes(strategy: Strategy, alpha: number, successful: boolean): number {
  const a = Math.min(alpha, 0.999);
  switch (strategy) {
    case "chaining":
      return successful ? 1 + a / 2 : 1 + a;
    case "linear":
      return successful ? 0.5 * (1 + 1 / (1 - a)) : 0.5 * (1 + 1 / ((1 - a) * (1 - a)));
    case "double":
    case "quadratic":
      // The uniform-hashing result; quadratic probing sits close to it in
      // practice, a little worse as the table fills.
      return successful ? (a === 0 ? 1 : (1 / a) * Math.log(1 / (1 - a))) : 1 / (1 - a);
  }
}

// ── Keys ────────────────────────────────────────────────────────────────────

export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LETTERS = "abcdefghijklmnopqrstuvwxyz";

export function makeKeys(count: number, rng: () => number): string[] {
  const keys = new Set<string>();
  while (keys.size < count) {
    let key = "";
    const len = 3 + Math.floor(rng() * 5);
    for (let i = 0; i < len; i++) key += LETTERS[Math.floor(rng() * LETTERS.length)];
    keys.add(key);
  }
  return [...keys];
}

// Primes, so double hashing's step is always coprime with the table size.
export const SIZES = [53, 97, 197, 389];
