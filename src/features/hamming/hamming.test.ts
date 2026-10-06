import { describe, expect, it } from "vitest";
import {
  CODES,
  CodeSpec,
  codeLength,
  covers,
  decode,
  encode,
  flip,
  isParityPosition,
  makeRng,
  newStats,
  overhead,
  randomData,
  transmit,
} from "./hamming";

// Every data word of a 4-bit code, for exhaustive checks.
const allWords = (bits: number): number[][] => {
  const out: number[][] = [];
  for (let v = 0; v < 1 << bits; v++) {
    out.push(Array.from({ length: bits }, (_, i) => (v >> i) & 1));
  }
  return out;
};

describe("construction", () => {
  it("puts parity at the powers of two", () => {
    expect([1, 2, 4, 8, 16].every(isParityPosition)).toBe(true);
    expect([3, 5, 6, 7, 9, 12, 15].some(isParityPosition)).toBe(false);
  });

  it("covers exactly the positions whose index has that bit set", () => {
    // Position 6 is 110 in binary, so checks 4 and 2 cover it and check 1 does not.
    expect(covers(4, 6)).toBe(true);
    expect(covers(2, 6)).toBe(true);
    expect(covers(1, 6)).toBe(false);
  });

  it.each(CODES)("$label round-trips every data word untouched", (spec) => {
    for (const data of allWords(Math.min(spec.dataBits, 11))) {
      const padded = data.slice(0, spec.dataBits);
      while (padded.length < spec.dataBits) padded.push(0);
      const decoded = decode(encode(padded, spec));
      expect(decoded.verdict).toBe("clean");
      expect(decoded.data).toEqual(padded);
    }
  });
});

describe("single errors", () => {
  it.each(CODES)("$label corrects a flip at every position, for every word", (spec) => {
    const n = codeLength(spec);
    for (const data of allWords(Math.min(spec.dataBits, 8))) {
      const padded = data.slice(0, spec.dataBits);
      while (padded.length < spec.dataBits) padded.push(0);
      const clean = encode(padded, spec);

      for (let pos = 1; pos <= n; pos++) {
        const decoded = decode(flip(clean, pos));
        expect(decoded.verdict).toBe("corrected");
        // The syndrome is the address of the broken bit, which is the point.
        if (!spec.extended || pos <= spec.dataBits + spec.parityBits) {
          expect(decoded.correctedPosition).toBe(pos);
        }
        expect(decoded.data).toEqual(padded);
      }
    }
  });

  it("reads the syndrome as the position in binary", () => {
    const spec = CODES[0];
    const clean = encode([1, 0, 1, 1], spec);
    // Breaking position 6 should fail exactly the checks at 4 and 2.
    const decoded = decode(flip(clean, 6));
    expect(decoded.syndrome).toBe(6);
    expect(decoded.failedChecks.sort((a, b) => a - b)).toEqual([2, 4]);
  });
});

describe("double errors", () => {
  it("SECDED detects every double error instead of miscorrecting it", () => {
    for (const spec of CODES.filter((c) => c.extended)) {
      const n = codeLength(spec);
      for (const data of allWords(Math.min(spec.dataBits, 6))) {
        const padded = data.slice(0, spec.dataBits);
        while (padded.length < spec.dataBits) padded.push(0);
        const clean = encode(padded, spec);
        for (let a = 1; a <= n; a++) {
          for (let b = a + 1; b <= n; b++) {
            expect(decode(flip(flip(clean, a), b)).verdict).toBe("double");
          }
        }
      }
    }
  });

  it("plain Hamming silently delivers the wrong data on a double error", () => {
    // This is the failure SECDED exists to prevent, so it is worth pinning down.
    const spec = CODES[0];
    const clean = encode([1, 0, 1, 1], spec);
    const broken = flip(flip(clean, 3), 5);
    const decoded = decode(broken);
    expect(decoded.verdict).toBe("corrected"); // it believes it fixed something
    expect(decoded.data).not.toEqual([1, 0, 1, 1]); // and it is wrong
  });
});

describe("the channel", () => {
  it("never delivers wrong data through SECDED at a realistic error rate", () => {
    const spec = CODES.find((c) => c.id === "h1611")!;
    const rng = makeRng(2026);
    const stats = newStats();
    for (let i = 0; i < 20000; i++) transmit(spec, 0.01, rng, stats);
    expect(stats.words).toBe(20000);
    expect(stats.corrected).toBeGreaterThan(0);
    expect(stats.detected).toBeGreaterThan(0);
    // Triple errors can still slip through, but they must be vanishingly rare.
    expect(stats.wrong / stats.words).toBeLessThan(0.001);
  });

  it("delivers wrong data far more often without the extra parity bit", () => {
    const rng = makeRng(7);
    const plain = newStats();
    const secded = newStats();
    for (let i = 0; i < 20000; i++) {
      transmit(CODES.find((c) => c.id === "h1511")!, 0.03, rng, plain);
      transmit(CODES.find((c) => c.id === "h1611")!, 0.03, rng, secded);
    }
    expect(plain.wrong).toBeGreaterThan(secded.wrong * 5);
  });

  it("leaves a clean channel clean", () => {
    const rng = makeRng(1);
    const stats = newStats();
    for (let i = 0; i < 500; i++) {
      const t = transmit(CODES[1], 0, rng, stats);
      expect(t.decoded.verdict).toBe("clean");
      expect(t.decoded.data).toEqual(t.sent);
    }
    expect(stats.wrong).toBe(0);
  });
});

describe("cost", () => {
  it("gets cheaper as the block grows", () => {
    const of = (id: string) => overhead(CODES.find((c) => c.id === id) as CodeSpec);
    expect(of("h74")).toBeCloseTo(3 / 7, 9);
    expect(of("h1511")).toBeCloseTo(4 / 15, 9);
    expect(of("h1511")).toBeLessThan(of("h74"));
  });

  it("generates data of the right width", () => {
    const rng = makeRng(5);
    for (const spec of CODES) {
      const data = randomData(spec, rng);
      expect(data.length).toBe(spec.dataBits);
      expect(data.every((b) => b === 0 || b === 1)).toBe(true);
    }
  });
});
