// Arithmetic coding: a message as a single number.
//
// Huffman coding (see /huffman) assigns each symbol a whole number of bits. If a
// symbol has probability 0.9 its information content is 0.152 bits, but Huffman
// must still spend one — six times too many. On skewed data that gap is most of
// the file.
//
// Arithmetic coding never names a symbol. It starts with the interval [0,1) and
// narrows it once per symbol, each symbol claiming a slice proportional to its
// probability. After the whole message the interval is tiny, and ANY number
// inside it identifies the message exactly. Transmit the shortest binary
// fraction that lands in the interval and you have spent
//
//   ceil(log2(1 / width)) + 1 bits
//
// where width is the product of the symbol probabilities — which is the
// message's information content, to within two bits, no matter how the
// probabilities fall.
//
// The arithmetic here is exact. Rather than the usual fixed-width renormalising
// coder, the interval is kept as BigInt numerators over a denominator of T^n,
// so nothing rounds and the page shows the real interval rather than a
// floating-point approximation of it.

export interface Symbol {
  ch: string;
  count: number;
}

export interface Model {
  symbols: Symbol[];
  total: number;
  // Cumulative counts: symbol i owns [cum[i], cum[i+1]) out of `total`.
  cum: number[];
}

export function buildModel(text: string): Model {
  const counts = new Map<string, number>();
  for (const ch of text) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  const symbols = [...counts.entries()]
    .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]))
    .map(([ch, count]) => ({ ch, count }));
  const cum: number[] = [0];
  let total = 0;
  for (const s of symbols) {
    total += s.count;
    cum.push(total);
  }
  return { symbols, total, cum };
}

export function indexOf(model: Model, ch: string): number {
  return model.symbols.findIndex((s) => s.ch === ch);
}

export function probability(model: Model, index: number): number {
  return model.symbols[index].count / model.total;
}

// ── Encoding ────────────────────────────────────────────────────────────────

export interface Step {
  index: number; // position in the message
  symbol: string;
  // The interval after this symbol, as numerators over `den`.
  low: bigint;
  high: bigint;
  den: bigint;
  widthBits: number; // -log2(width/den): the bits spent so far
}

export interface Encoded {
  steps: Step[];
  low: bigint;
  high: bigint;
  den: bigint;
  bits: number; // length of the transmitted code
  code: bigint; // the chosen value, as code/2^bits
  model: Model;
}

// One symbol narrows the interval to its slice of the current width. Keeping
// the denominator as T^i and multiplying through by T each step means the
// numerators stay exact integers.
export function encode(text: string, model: Model): Encoded {
  const T = BigInt(model.total);
  let low = 0n;
  let high = 1n;
  let den = 1n;
  const steps: Step[] = [];

  for (let i = 0; i < text.length; i++) {
    const idx = indexOf(model, text[i]);
    if (idx < 0) throw new Error(`symbol "${text[i]}" is not in the model`);
    const width = high - low;
    const cumLow = BigInt(model.cum[idx]);
    const cumHigh = BigInt(model.cum[idx + 1]);
    const nextLow = low * T + width * cumLow;
    const nextHigh = low * T + width * cumHigh;
    low = nextLow;
    high = nextHigh;
    den *= T;
    steps.push({
      index: i,
      symbol: text[i],
      low,
      high,
      den,
      widthBits: bitsOfRatio(den, high - low),
    });
  }

  const { bits, code } = chooseCode(low, high, den);
  return { steps, low, high, den, bits, code, model };
}

// log2(den / width), computed on BigInts so it stays accurate for intervals far
// below the smallest double.
function bitsOfRatio(den: bigint, width: bigint): number {
  if (width <= 0n) return Infinity;
  return log2Big(den) - log2Big(width);
}

export function log2Big(v: bigint): number {
  if (v <= 0n) return -Infinity;
  const bits = v.toString(2).length;
  if (bits <= 52) return Math.log2(Number(v));
  // Keep the top 52 bits and account for the rest in the exponent.
  const shift = BigInt(bits - 52);
  return Math.log2(Number(v >> shift)) + Number(shift);
}

// The transmitted code: ceil(log2(1/width)) + 1 bits, truncating `low` up into
// the interval.
//
// It is tempting to search instead for the SHORTEST binary fraction that lands
// inside the interval, and for a lucky interval that is a handful of bits
// cheaper. It is also wrong: such a code is only decodable by a receiver who
// already knows how many bits to read, so the saving is paid for out of band.
// Measured that way the coder appears to beat the entropy on average, which no
// code can do — a sure sign the length being reported is not the real cost.
// This rule is self-delimiting given the message length, and lands within two
// bits of the entropy, never under it.
export function chooseCode(low: bigint, high: bigint, den: bigint): { bits: number; code: bigint } {
  const width = high - low;
  if (width <= 0n) throw new Error("empty interval");
  let bits = Math.max(1, Math.ceil(log2Big(den) - log2Big(width)) + 1);
  for (let attempt = 0; attempt < 64; attempt++) {
    const scale = 1n << BigInt(bits);
    // The smallest multiple of 2^-bits that is >= low/den.
    const candidate = (low * scale + den - 1n) / den;
    if (candidate * den < high * scale) return { bits, code: candidate };
    // Rounding at the boundary can need one more bit; the loop is a guard, not
    // a search for a shorter code.
    bits++;
  }
  throw new Error("no code found");
}

// ── Decoding ────────────────────────────────────────────────────────────────

// Decoding retraces the same narrowing: at each step, find which symbol's slice
// contains the transmitted value. That it recovers the message exactly is the
// only proof that the encoding is lossless.
export function decode(code: bigint, bits: number, model: Model, length: number): string {
  const T = BigInt(model.total);
  const scale = 1n << BigInt(bits);
  let low = 0n;
  let high = 1n;
  let den = 1n;
  let out = "";

  for (let i = 0; i < length; i++) {
    const width = high - low;
    // Which slice of [low, high) does code/scale fall into? Compare
    // (code/scale - low/den) / (width/den) against cum/T, cross-multiplied.
    const offset = code * den - low * scale;
    let chosen = -1;
    for (let s = 0; s < model.symbols.length; s++) {
      const sliceLow = BigInt(model.cum[s]);
      const sliceHigh = BigInt(model.cum[s + 1]);
      if (offset * T >= width * sliceLow * scale && offset * T < width * sliceHigh * scale) {
        chosen = s;
        break;
      }
    }
    if (chosen < 0) throw new Error("decode fell outside every slice");
    out += model.symbols[chosen].ch;
    const nextLow = low * T + width * BigInt(model.cum[chosen]);
    const nextHigh = low * T + width * BigInt(model.cum[chosen + 1]);
    low = nextLow;
    high = nextHigh;
    den *= T;
  }
  return out;
}

// ── What it is compared against ─────────────────────────────────────────────

export function entropyBits(text: string, model: Model): number {
  let bits = 0;
  for (const ch of text) {
    const idx = indexOf(model, ch);
    bits += -Math.log2(probability(model, idx));
  }
  return bits;
}

// Huffman code lengths for the same model, by the usual merge of the two
// rarest symbols. The point of comparison is that these are whole numbers.
export function huffmanLengths(model: Model): Map<string, number> {
  const lengths = new Map<string, number>();
  if (model.symbols.length === 0) return lengths;
  if (model.symbols.length === 1) {
    lengths.set(model.symbols[0].ch, 1); // a single symbol still costs a bit
    return lengths;
  }

  interface N {
    weight: number;
    leaves: string[];
  }
  let nodes: N[] = model.symbols.map((s) => ({ weight: s.count, leaves: [s.ch] }));
  for (const s of model.symbols) lengths.set(s.ch, 0);

  while (nodes.length > 1) {
    nodes.sort((a, b) => a.weight - b.weight);
    const a = nodes.shift()!;
    const b = nodes.shift()!;
    for (const leaf of [...a.leaves, ...b.leaves]) lengths.set(leaf, (lengths.get(leaf) ?? 0) + 1);
    nodes = [...nodes, { weight: a.weight + b.weight, leaves: [...a.leaves, ...b.leaves] }];
  }
  return lengths;
}

export function huffmanBits(text: string, model: Model): number {
  const lengths = huffmanLengths(model);
  let bits = 0;
  for (const ch of text) bits += lengths.get(ch) ?? 0;
  return bits;
}

// ── Samples ─────────────────────────────────────────────────────────────────

export interface Sample {
  id: string;
  label: string;
  note: string;
  text: string;
}

export const SAMPLES: Sample[] = [
  {
    id: "skewed",
    label: "skewed",
    note: "one symbol dominates — Huffman must spend a whole bit on it, arithmetic spends a fraction",
    text: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab",
  },
  {
    id: "balanced",
    label: "balanced",
    note: "four equally likely symbols — exactly 2 bits each, and nothing to gain",
    text: "abcdbadccdabdcba",
  },
  {
    id: "english",
    label: "english",
    note: "a natural letter mix — a few percent better than Huffman, which is the usual story",
    text: "the theme of these three thieves",
  },
  {
    id: "dna",
    label: "dna",
    note: "four bases, unevenly used — the skew is mild but it is free to exploit",
    text: "ACGTAAACGTAAACCGTAAACGAAACGTAAAC",
  },
  {
    id: "binary",
    label: "very skewed",
    note: "1 in 32 — Huffman cannot go below one bit per symbol, so it spends 32x what the data holds",
    text: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab",
  },
];
