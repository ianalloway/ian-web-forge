import { describe, expect, it } from "vitest";
import {
  SAMPLES,
  SENTINEL,
  alphabetOf,
  inverse,
  inverseMoveToFront,
  longestRun,
  meanCode,
  moveToFront,
  runCount,
  sortedRotations,
  transform,
  zeroFraction,
} from "./bwt";

function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("the transform", () => {
  it("matches the textbook result for banana", () => {
    // Rotations of "banana\u0003" sorted give last column "annb\u0003aa".
    expect(transform("banana")).toBe(`annb${SENTINEL}aa`);
  });

  it("is a permutation: same characters, same counts", () => {
    for (const sample of SAMPLES) {
      const out = transform(sample.text);
      expect(out.length).toBe(sample.text.length + 1);
      const tally = (s: string) => [...s].sort().join("");
      expect(tally(out)).toBe(tally(sample.text + SENTINEL));
    }
  });

  it("sorts the rotations, so the first column is the last column sorted", () => {
    for (const sample of SAMPLES.slice(0, 3)) {
      const rows = sortedRotations(sample.text);
      for (let i = 1; i < rows.length; i++) {
        expect(rows[i - 1].text <= rows[i].text).toBe(true);
      }
      const first = rows.map((r) => r.text[0]).join("");
      expect(first).toBe([...transform(sample.text)].sort().join(""));
    }
  });
});

describe("the inverse", () => {
  it.each(SAMPLES)("recovers $id exactly", (sample) => {
    expect(inverse(transform(sample.text))).toBe(sample.text);
  });

  it("recovers 300 random strings exactly", () => {
    const rng = makeRng(90210);
    for (let trial = 0; trial < 300; trial++) {
      const length = 1 + Math.floor(rng() * 40);
      let text = "";
      for (let i = 0; i < length; i++) text += "abcdef"[Math.floor(rng() * 6)];
      expect(inverse(transform(text))).toBe(text);
    }
  });

  it("handles the degenerate inputs", () => {
    expect(inverse(transform(""))).toBe("");
    expect(inverse(transform("a"))).toBe("a");
    expect(inverse(transform("aaaaaa"))).toBe("aaaaaa");
  });
});

describe("why it helps the next stage", () => {
  it("gathers repeated contexts into longer runs", () => {
    // The samples with real repetition should come out blockier than they went
    // in. This is the entire justification for the transform.
    for (const id of ["english", "repeat", "dna"]) {
      const sample = SAMPLES.find((s) => s.id === id)!;
      const out = transform(sample.text);
      expect(runCount(out)).toBeLessThan(runCount(sample.text));
      expect(longestRun(out)).toBeGreaterThanOrEqual(longestRun(sample.text));
    }
  });

  it("cannot invent structure that is not there", () => {
    // Every character distinct: nothing to gather, and the transform is honest
    // about it rather than magically compressing.
    const sample = SAMPLES.find((s) => s.id === "random")!;
    expect(runCount(transform(sample.text))).toBeGreaterThanOrEqual(
      runCount(sample.text) - 1
    );
  });

  it("turns those runs into zeros under move-to-front", () => {
    for (const id of ["english", "repeat"]) {
      const sample = SAMPLES.find((s) => s.id === id)!;
      const plain = moveToFront(sample.text);
      const transformed = moveToFront(transform(sample.text));
      expect(zeroFraction(transformed)).toBeGreaterThan(zeroFraction(plain));
      expect(meanCode(transformed)).toBeLessThan(meanCode(plain));
    }
  });
});

describe("move-to-front", () => {
  it("round-trips", () => {
    for (const sample of SAMPLES) {
      const alphabet = alphabetOf(sample.text);
      expect(inverseMoveToFront(moveToFront(sample.text, alphabet), alphabet)).toBe(sample.text);
    }
  });

  it("emits a zero for every repeat of the character just seen", () => {
    // "aaaa" is one position then three zeros, by construction.
    expect(moveToFront("aaaa", ["a", "b"])).toEqual([0, 0, 0, 0]);
    expect(moveToFront("baaa", ["a", "b"])).toEqual([1, 1, 0, 0]);
  });

  it("round-trips the full bzip2-style pipeline", () => {
    for (const sample of SAMPLES) {
      const transformed = transform(sample.text);
      const alphabet = alphabetOf(transformed);
      const codes = moveToFront(transformed, alphabet);
      expect(inverse(inverseMoveToFront(codes, alphabet))).toBe(sample.text);
    }
  });
});
