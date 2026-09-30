import { describe, expect, it } from "vitest";
import { SAMPLES, buildFailure, newSearch, runToEnd, step } from "./kmp";

// A plain scan, used as the source of truth both algorithms must agree with.
function allIndices(text: string, pattern: string): number[] {
  const out: number[] = [];
  for (let i = 0; i + pattern.length <= text.length; i++) {
    if (text.startsWith(pattern, i)) out.push(i);
  }
  return out;
}

function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("failure function", () => {
  it("matches the textbook tables", () => {
    expect(buildFailure("ababaca")).toEqual([0, 0, 1, 2, 3, 0, 1]);
    expect(buildFailure("aabaaab")).toEqual([0, 1, 0, 1, 2, 2, 3]);
    expect(buildFailure("abcabcabd")).toEqual([0, 0, 0, 1, 2, 3, 4, 5, 0]);
  });

  it("is all zeroes when no prefix is ever a suffix", () => {
    expect(buildFailure("abcdef")).toEqual([0, 0, 0, 0, 0, 0]);
  });

  it("counts the full run for a repeated character", () => {
    expect(buildFailure("aaaa")).toEqual([0, 1, 2, 3]);
  });
});

describe("search correctness", () => {
  it.each(SAMPLES)("finds every match in the $id sample", (sample) => {
    const truth = allIndices(sample.text, sample.pattern);
    expect(runToEnd(sample.text, sample.pattern, "naive").matches).toEqual(truth);
    expect(runToEnd(sample.text, sample.pattern, "kmp").matches).toEqual(truth);
  });

  it("finds overlapping matches", () => {
    // "aa" occurs at 0, 1 and 2 in "aaaa" — a searcher that skips the whole
    // pattern after a match would miss two of them.
    expect(runToEnd("aaaa", "aa", "kmp").matches).toEqual([0, 1, 2]);
    expect(runToEnd("abababa", "aba", "kmp").matches).toEqual([0, 2, 4]);
  });

  it("agrees with a plain scan on random strings over a tiny alphabet", () => {
    const rng = makeRng(4242);
    for (let trial = 0; trial < 400; trial++) {
      let text = "";
      let pattern = "";
      for (let i = 0; i < 5 + Math.floor(rng() * 60); i++) text += "abc"[Math.floor(rng() * 3)];
      for (let i = 0; i < 1 + Math.floor(rng() * 5); i++) pattern += "abc"[Math.floor(rng() * 3)];
      const truth = allIndices(text, pattern);
      expect(runToEnd(text, pattern, "kmp").matches).toEqual(truth);
      expect(runToEnd(text, pattern, "naive").matches).toEqual(truth);
    }
  });

  it("handles patterns that cannot match", () => {
    expect(runToEnd("short", "much longer than the text", "kmp").matches).toEqual([]);
    expect(runToEnd("abc", "", "kmp").matches).toEqual([]);
    expect(runToEnd("", "abc", "kmp").matches).toEqual([]);
  });
});

describe("the point of KMP", () => {
  it("stays linear where naive search goes quadratic", () => {
    const text = "a".repeat(4000) + "b";
    const pattern = "a".repeat(40) + "b";
    const naive = runToEnd(text, pattern, "naive");
    const kmp = runToEnd(text, pattern, "kmp");

    // KMP never re-examines a text character, so it is bounded by about 2n.
    expect(kmp.comparisons).toBeLessThan(2 * text.length);
    // Naive rereads the run on every mismatch, and pays for it.
    expect(naive.comparisons).toBeGreaterThan(10 * kmp.comparisons);
    expect(kmp.matches).toEqual(naive.matches);
  });

  it("never does more work than naive search on the samples", () => {
    for (const sample of SAMPLES) {
      const naive = runToEnd(sample.text, sample.pattern, "naive");
      const kmp = runToEnd(sample.text, sample.pattern, "kmp");
      expect(kmp.comparisons).toBeLessThanOrEqual(naive.comparisons);
    }
  });
});

describe("the animated stepper", () => {
  it.each(SAMPLES)("terminates and agrees with the batch run on $id", (sample) => {
    for (const algorithm of ["naive", "kmp"] as const) {
      const state = newSearch(sample.text, sample.pattern, algorithm);
      let guard = 0;
      while (!state.done) {
        step(state);
        expect(++guard).toBeLessThan(1_000_000);
      }
      expect(state.matches).toEqual(runToEnd(sample.text, sample.pattern, algorithm).matches);
    }
  });

  it("reports a failure-table jump only when a partial match is reused", () => {
    // "abcabd" against "abcabcabd": the mismatch at depth 5 reuses "ab".
    const state = newSearch("abcabcabd", "abcabd", "kmp");
    let sawFailureJump = false;
    let guard = 0;
    while (!state.done && guard++ < 10_000) {
      step(state);
      if (state.lastJump?.kind === "failure") {
        sawFailureJump = true;
        // A failure jump must move the pattern forward, never backwards.
        expect(state.lastJump.to).toBeGreaterThan(state.lastJump.from);
      }
    }
    expect(sawFailureJump).toBe(true);
  });
});
