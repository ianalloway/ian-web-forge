// A Bloom filter: a bit array plus k hash functions. Adding an item sets k
// bits; querying checks those same k bits. If any is clear the item is
// definitely absent; if all are set it is *probably* present — other items may
// have collectively set them, which is a false positive.
//
// The filter never produces a false negative, and the false-positive rate has
// a closed form: (1 - e^(-kn/m))^k for n items in m bits with k hashes.

/**
 * FNV-1a followed by an avalanche finalizer.
 *
 * The finalizer matters: raw FNV-1a mixes its low bits poorly, and because
 * bucket selection is `hash % m` it reads exactly those low bits. Without this
 * step the filter shows structured collisions — measurably worse than random
 * hashing, and a chi-square test over the buckets fails.
 */
export function fnv1a(text: string, seed = 0x811c9dc5): number {
  let h = seed >>> 0;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  // MurmurHash3 fmix32 avalanche — spreads entropy into the low bits.
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * Kirsch-Mitzenmacher: two independent hashes generate k derived hashes as
 * h1 + i·h2, which performs as well as k separate hash functions.
 */
export function hashes(text: string, k: number, m: number): number[] {
  const h1 = fnv1a(text, 0x811c9dc5);
  const h2 = fnv1a(text, 0x01000193) | 1; // odd, so it strides the whole array
  const out: number[] = [];
  for (let i = 0; i < k; i++) out.push(((h1 + Math.imul(i, h2)) >>> 0) % m);
  return out;
}

export class BloomFilter {
  readonly m: number; // bits
  readonly k: number; // hash functions
  bits: Uint8Array;
  added = 0;

  constructor(m: number, k: number) {
    this.m = Math.max(1, m);
    this.k = Math.max(1, k);
    this.bits = new Uint8Array(this.m);
  }

  clear() {
    this.bits.fill(0);
    this.added = 0;
  }

  add(item: string): number[] {
    const idx = hashes(item, this.k, this.m);
    for (const i of idx) this.bits[i] = 1;
    this.added++;
    return idx;
  }

  /** True means "probably present"; false means "definitely absent". */
  has(item: string): boolean {
    return hashes(item, this.k, this.m).every((i) => this.bits[i] === 1);
  }

  /** Which bits a query touches, and whether each was already set. */
  probe(item: string): { index: number; set: boolean }[] {
    return hashes(item, this.k, this.m).map((i) => ({ index: i, set: this.bits[i] === 1 }));
  }

  get bitsSet(): number {
    let n = 0;
    for (let i = 0; i < this.m; i++) n += this.bits[i];
    return n;
  }

  get fillRatio(): number {
    return this.bitsSet / this.m;
  }

  /** Predicted false-positive rate from the closed form. */
  theoreticalFpr(n = this.added): number {
    return Math.pow(1 - Math.exp((-this.k * n) / this.m), this.k);
  }

  /** Estimated rate from the bits actually set — closer to reality. */
  observedFprEstimate(): number {
    return Math.pow(this.fillRatio, this.k);
  }
}

/** The k that minimises false positives for m bits and n items: (m/n)·ln2. */
export const optimalK = (m: number, n: number): number =>
  Math.max(1, Math.round((m / Math.max(1, n)) * Math.LN2));

/** Bits needed for a target false-positive rate. */
export const bitsFor = (n: number, targetFpr: number): number =>
  Math.ceil((-n * Math.log(targetFpr)) / (Math.LN2 * Math.LN2));
