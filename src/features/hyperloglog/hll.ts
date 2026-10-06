// HyperLogLog: counting distinct things without remembering any of them.
//
// Counting unique visitors exactly means storing every id you have seen —
// memory grows with the answer. HyperLogLog answers the same question in a
// fixed few kilobytes, for any cardinality, by storing nothing but a pile of
// small integers.
//
// The idea: hash each item to a uniform bit string. The chance a hash begins
// with k zeros is 2^-k, so seeing a hash with 10 leading zeros hints that
// you have probably seen about 2^10 distinct items. One such observation is
// hopeless — it is a single sample from a very long-tailed distribution — so
// the stream is split by its first p bits into m = 2^p registers, each keeping
// only the largest leading-zero count it has seen, and the estimate is built
// from the HARMONIC mean of 2^register across them. The harmonic mean is what
// tames the outliers, and it is the difference between LogLog and HyperLogLog.
//
// Relative error settles at about 1.04/sqrt(m), independent of how many items
// there are: 16 KB of registers estimates a billion distinct items to within a
// percent or so. Registers only ever rise, and merging two sketches is a
// pairwise maximum — which is why counts from different machines can be
// combined exactly as if one sketch had seen everything.

export interface Sketch {
  p: number; // register address bits
  m: number; // register count, 2^p
  registers: Uint8Array;
}

export function newSketch(p: number): Sketch {
  const m = 1 << p;
  return { p, m, registers: new Uint8Array(m) };
}

// A 32-bit mixer (murmur3's finalizer) over a string. The algorithm's accuracy
// rests entirely on this being well distributed.
export function hash(key: string): number {
  let h = 0x811c9dc5 >>> 0;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}

// Leading zeros in the remaining bits, plus one — the "rank" of this hash.
export function rank(bits: number, width: number): number {
  if (bits === 0) return width + 1;
  let r = 1;
  let mask = 1 << (width - 1);
  while ((bits & mask) === 0 && mask !== 0) {
    r++;
    mask >>>= 1;
  }
  return r;
}

export function add(sketch: Sketch, key: string): void {
  const h = hash(key);
  const index = h >>> (32 - sketch.p);
  const tailWidth = 32 - sketch.p;
  const tail = (h << sketch.p) >>> sketch.p; // the bits after the address
  const r = rank(tail, tailWidth);
  // Registers only ever rise, which is what makes a merge a pairwise maximum.
  if (r > sketch.registers[index]) sketch.registers[index] = r;
}

// The bias constant for the raw estimator, which depends on m.
export function alpha(m: number): number {
  if (m === 16) return 0.673;
  if (m === 32) return 0.697;
  if (m === 64) return 0.709;
  return 0.7213 / (1 + 1.079 / m);
}

export function estimate(sketch: Sketch): number {
  const { m, registers } = sketch;
  let sum = 0;
  let zeros = 0;
  for (let i = 0; i < m; i++) {
    sum += 2 ** -registers[i];
    if (registers[i] === 0) zeros++;
  }

  const raw = (alpha(m) * m * m) / sum;

  // Below about 2.5m the raw estimator is biased, but empty registers are
  // themselves a good estimator there (linear counting), and they only exist
  // while the cardinality is small.
  if (raw <= 2.5 * m && zeros > 0) return m * Math.log(m / zeros);
  return raw;
}

// The standard error of the estimate: the accuracy you are buying with memory.
export function relativeError(m: number): number {
  return 1.04 / Math.sqrt(m);
}

// Merging is a pairwise maximum, so sketches from different machines combine
// into exactly the sketch one machine would have built from the whole stream.
export function merge(a: Sketch, b: Sketch): Sketch {
  if (a.p !== b.p) throw new Error("sketches must have the same precision to merge");
  const out = newSketch(a.p);
  for (let i = 0; i < a.m; i++) out.registers[i] = Math.max(a.registers[i], b.registers[i]);
  return out;
}

export function memoryBytes(sketch: Sketch): number {
  return sketch.m; // one byte per register
}

// What an exact count would cost: the ids themselves, conservatively.
export function exactMemoryBytes(distinct: number): number {
  return distinct * 16;
}

export function registerStats(sketch: Sketch): { max: number; mean: number; zeros: number } {
  let max = 0;
  let sum = 0;
  let zeros = 0;
  for (let i = 0; i < sketch.m; i++) {
    const v = sketch.registers[i];
    if (v > max) max = v;
    sum += v;
    if (v === 0) zeros++;
  }
  return { max, mean: sum / sketch.m, zeros };
}

// ── Streams to count ────────────────────────────────────────────────────────

export interface Stream {
  id: string;
  label: string;
  note: string;
  // Item i of the stream. Distinctness is controlled by the generator, so the
  // true cardinality is always known exactly.
  item: (i: number) => string;
  distinct: (i: number) => number;
}

export const STREAMS: Stream[] = [
  {
    id: "unique",
    label: "all unique",
    note: "every item is new — the estimate has to track the count itself",
    item: (i) => `user-${i}`,
    distinct: (i) => i,
  },
  {
    id: "repeats",
    label: "heavy repeats",
    note: "ten views each — a counter would be ten times too high, the sketch is not fooled",
    item: (i) => `user-${Math.floor(i / 10)}`,
    distinct: (i) => Math.ceil(i / 10),
  },
  {
    id: "zipf",
    label: "popular few",
    note: "a few items dominate the traffic, as real traffic does",
    item: (i) => `page-${Math.floor(Math.sqrt(i) * (1 + (i % 3)))}`,
    distinct: () => -1, // counted exactly by the caller, not derivable
  },
  {
    id: "bounded",
    label: "fixed audience",
    note: "only 5000 distinct ids exist — the estimate should flatten, and stay flat",
    item: (i) => `user-${i % 5000}`,
    distinct: (i) => Math.min(i, 5000),
  },
];
