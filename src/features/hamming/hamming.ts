// Hamming codes: finding the broken bit by asking the right questions.
//
// Add parity bits at the power-of-two positions (1, 2, 4, 8, …) and have parity
// bit p cover every position whose index has p's bit set. Then if a single bit
// flips, the set of parity checks that fail spells out, in binary, the position
// of the bit that flipped. Not "something is wrong" — which bit. Flip it back
// and the message is recovered.
//
// That is the whole construction, and the elegance is that the syndrome is the
// address. Position 1 covers 1,3,5,7…; position 2 covers 2,3,6,7…; position 4
// covers 4,5,6,7… so a bit at position 6 = 110₂ is covered by exactly the
// checks at 4 and 2, and no others.
//
// Plain Hamming has minimum distance 3: it corrects one error but cannot tell a
// double error from a different single error, and will "correct" the wrong bit.
// One extra parity bit over the whole codeword lifts the distance to 4 and
// gives SECDED — single error correction, double error DETECTION — which is
// what ECC memory runs.

export interface CodeSpec {
  id: string;
  label: string;
  note: string;
  dataBits: number;
  parityBits: number;
  extended: boolean; // adds the overall parity bit, making it SECDED
}

export const CODES: CodeSpec[] = [
  {
    id: "h74",
    label: "Hamming(7,4)",
    note: "the original: 4 data bits, 3 parity, corrects any single error",
    dataBits: 4,
    parityBits: 3,
    extended: false,
  },
  {
    id: "h84",
    label: "SECDED(8,4)",
    note: "one more parity bit over everything — now a double error is detected rather than miscorrected",
    dataBits: 4,
    parityBits: 3,
    extended: true,
  },
  {
    id: "h1511",
    label: "Hamming(15,11)",
    note: "11 data bits for 4 parity — the longer the block, the cheaper the protection",
    dataBits: 11,
    parityBits: 4,
    extended: false,
  },
  {
    id: "h1611",
    label: "SECDED(16,11)",
    note: "the practical one: this is the shape ECC memory uses",
    dataBits: 11,
    parityBits: 4,
    extended: true,
  },
];

export function codeLength(spec: CodeSpec): number {
  return spec.dataBits + spec.parityBits + (spec.extended ? 1 : 0);
}

// Positions are 1-based: 1, 2, 4, 8 … hold parity, everything else holds data.
export function isParityPosition(position: number): boolean {
  return (position & (position - 1)) === 0;
}

// Which positions parity bit at `parityPos` covers: those whose index has that
// bit set. This is the whole trick, in one line.
export function covers(parityPos: number, position: number): boolean {
  return (position & parityPos) !== 0;
}

export interface Codeword {
  bits: number[]; // index 0 unused so positions read 1-based
  spec: CodeSpec;
}

export function encode(data: number[], spec: CodeSpec): Codeword {
  const n = spec.dataBits + spec.parityBits;
  const bits = new Array(n + 1).fill(0);

  let d = 0;
  for (let pos = 1; pos <= n; pos++) {
    if (!isParityPosition(pos)) bits[pos] = data[d++] ?? 0;
  }
  for (let p = 0; p < spec.parityBits; p++) {
    const parityPos = 1 << p;
    let sum = 0;
    for (let pos = 1; pos <= n; pos++) {
      if (pos !== parityPos && covers(parityPos, pos)) sum ^= bits[pos];
    }
    bits[parityPos] = sum;
  }

  if (spec.extended) {
    // The extra bit makes the parity of the whole codeword even, so any odd
    // number of errors shows up in it.
    let sum = 0;
    for (let pos = 1; pos <= n; pos++) sum ^= bits[pos];
    bits.push(sum);
  }

  return { bits, spec };
}

export function dataOf(word: Codeword): number[] {
  const n = word.spec.dataBits + word.spec.parityBits;
  const out: number[] = [];
  for (let pos = 1; pos <= n; pos++) if (!isParityPosition(pos)) out.push(word.bits[pos]);
  return out;
}

export type Verdict = "clean" | "corrected" | "double";

export interface Decoded {
  syndrome: number; // the failing checks, read as a binary number: the address
  failedChecks: number[]; // which parity positions disagreed
  overallParityFailed: boolean;
  verdict: Verdict;
  correctedPosition: number; // 0 when nothing was corrected
  bits: number[]; // the codeword after any correction
  data: number[];
}

export function decode(word: Codeword): Decoded {
  const spec = word.spec;
  const n = spec.dataBits + spec.parityBits;
  const bits = word.bits.slice();

  let syndrome = 0;
  const failedChecks: number[] = [];
  for (let p = 0; p < spec.parityBits; p++) {
    const parityPos = 1 << p;
    let sum = 0;
    for (let pos = 1; pos <= n; pos++) if (covers(parityPos, pos)) sum ^= bits[pos];
    if (sum !== 0) {
      // Every failing check contributes its own position to the address.
      syndrome += parityPos;
      failedChecks.push(parityPos);
    }
  }

  let overallParityFailed = false;
  if (spec.extended) {
    let sum = 0;
    for (let pos = 1; pos <= n; pos++) sum ^= bits[pos];
    overallParityFailed = sum !== bits[n + 1];
  }

  let verdict: Verdict = "clean";
  let correctedPosition = 0;

  const correctAt = (position: number) => {
    verdict = "corrected";
    correctedPosition = position;
    bits[position] ^= 1;
  };

  if (spec.extended) {
    if (overallParityFailed) {
      // An odd number of errors. With distance 4 that means exactly one —
      // either in the codeword, or in the overall parity bit itself.
      if (syndrome === 0) correctAt(n + 1);
      else if (syndrome <= n) correctAt(syndrome);
      else verdict = "double";
    } else if (syndrome !== 0) {
      // Checks failed but the overall parity is even: an even number of
      // errors, which this code can see but cannot locate.
      verdict = "double";
    }
  } else if (syndrome !== 0) {
    // A syndrome past the end of the codeword cannot come from a single error,
    // but it is still evidence of corruption rather than something to act on.
    if (syndrome <= n) correctAt(syndrome);
    else verdict = "double";
  }

  const corrected: Codeword = { bits, spec };
  return {
    syndrome,
    failedChecks,
    overallParityFailed,
    verdict,
    correctedPosition,
    bits,
    data: dataOf(corrected),
  };
}

export function flip(word: Codeword, position: number): Codeword {
  const bits = word.bits.slice();
  bits[position] ^= 1;
  return { bits, spec: word.spec };
}

export function randomData(spec: CodeSpec, rng: () => number): number[] {
  return Array.from({ length: spec.dataBits }, () => (rng() < 0.5 ? 0 : 1));
}

export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The overhead the protection costs, as a fraction of the transmitted bits.
export function overhead(spec: CodeSpec): number {
  return 1 - spec.dataBits / codeLength(spec);
}

// ── Running a noisy channel ─────────────────────────────────────────────────

export interface ChannelStats {
  words: number;
  clean: number;
  corrected: number;
  detected: number; // double errors caught
  wrong: number; // delivered data that does not match what was sent
}

export function newStats(): ChannelStats {
  return { words: 0, clean: 0, corrected: 0, detected: 0, wrong: 0 };
}

export interface Transmission {
  sent: number[];
  word: Codeword;
  flipped: number[];
  decoded: Decoded;
  delivered: boolean; // whether the receiver handed the data on
}

// Send one word through a channel that flips each bit independently.
export function transmit(
  spec: CodeSpec,
  bitErrorRate: number,
  rng: () => number,
  stats: ChannelStats
): Transmission {
  const sent = randomData(spec, rng);
  const clean = encode(sent, spec);
  const noisy: Codeword = { bits: clean.bits.slice(), spec };
  const flipped: number[] = [];
  for (let pos = 1; pos < noisy.bits.length; pos++) {
    if (rng() < bitErrorRate) {
      noisy.bits[pos] ^= 1;
      flipped.push(pos);
    }
  }

  const decoded = decode(noisy);
  stats.words++;
  if (decoded.verdict === "clean") stats.clean++;
  else if (decoded.verdict === "corrected") stats.corrected++;
  else stats.detected++;

  // A double error that the plain code "corrects" delivers wrong data silently.
  const delivered = decoded.verdict !== "double";
  if (delivered && decoded.data.join("") !== sent.join("")) stats.wrong++;

  return { sent, word: noisy, flipped, decoded, delivered };
}
