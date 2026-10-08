import { describe, expect, it } from "vitest";
import { SAMPLES, apply, diff, minimumEdits, stats } from "./myers";

function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("correctness", () => {
  it.each(SAMPLES)("the $id diff replays onto the old text to give the new one", (sample) => {
    expect(apply(sample.before, diff(sample.before, sample.after).ops)).toEqual(sample.after);
  });

  it("replays correctly for 400 random pairs", () => {
    const rng = makeRng(31337);
    for (let trial = 0; trial < 400; trial++) {
      const a = Array.from({ length: Math.floor(rng() * 12) }, () => "abcd"[Math.floor(rng() * 4)]);
      const b = Array.from({ length: Math.floor(rng() * 12) }, () => "abcd"[Math.floor(rng() * 4)]);
      const d = diff(a, b);
      expect(apply(a, d.ops)).toEqual(b);
    }
  });

  it("handles empty inputs in both directions", () => {
    expect(apply([], diff([], ["a", "b"]).ops)).toEqual(["a", "b"]);
    expect(apply(["a", "b"], diff(["a", "b"], []).ops)).toEqual([]);
    expect(diff([], []).ops).toEqual([]);
    expect(diff([], []).editCount).toBe(0);
  });

  it("keeps the old indices in order and consistent", () => {
    for (const sample of SAMPLES) {
      const { ops } = diff(sample.before, sample.after);
      let cursor = 0;
      for (const op of ops) {
        if (op.kind === "keep") {
          expect(op.oldIndex).toBe(cursor);
          expect(sample.before[op.oldIndex]).toBe(op.text);
          expect(sample.after[op.newIndex]).toBe(op.text);
          cursor++;
        } else if (op.kind === "delete") {
          expect(op.oldIndex).toBe(cursor);
          expect(sample.before[op.oldIndex]).toBe(op.text);
          cursor++;
        } else {
          expect(sample.after[op.newIndex]).toBe(op.text);
        }
      }
      expect(cursor).toBe(sample.before.length);
    }
  });
});

describe("minimality", () => {
  it.each(SAMPLES)("$id uses exactly the fewest edits possible", (sample) => {
    expect(diff(sample.before, sample.after).editCount).toBe(
      minimumEdits(sample.before, sample.after)
    );
  });

  it("matches the dynamic-programming minimum on 400 random pairs", () => {
    const rng = makeRng(777);
    for (let trial = 0; trial < 400; trial++) {
      const a = Array.from({ length: Math.floor(rng() * 10) }, () => "abc"[Math.floor(rng() * 3)]);
      const b = Array.from({ length: Math.floor(rng() * 10) }, () => "abc"[Math.floor(rng() * 3)]);
      expect(diff(a, b).editCount).toBe(minimumEdits(a, b));
    }
  });

  it("spends nothing on identical input", () => {
    const same = ["one", "two", "three"];
    const d = diff(same, same);
    expect(d.editCount).toBe(0);
    expect(stats(d).kept).toBe(3);
  });

  it("spends everything when nothing is shared", () => {
    const d = diff(["a", "b", "c"], ["x", "y"]);
    expect(stats(d)).toEqual({ kept: 0, inserted: 2, deleted: 3 });
    expect(d.editCount).toBe(5);
  });
});

describe("the edit graph", () => {
  it("traces a path from the origin to the far corner", () => {
    for (const sample of SAMPLES) {
      const d = diff(sample.before, sample.after);
      expect(d.path[0]).toEqual({ x: 0, y: 0 });
      expect(d.path[d.path.length - 1]).toEqual({
        x: sample.before.length,
        y: sample.after.length,
      });
    }
  });

  it("never moves backwards or diagonally-up through the graph", () => {
    for (const sample of SAMPLES) {
      const { path } = diff(sample.before, sample.after);
      for (let i = 1; i < path.length; i++) {
        expect(path[i].x).toBeGreaterThanOrEqual(path[i - 1].x);
        expect(path[i].y).toBeGreaterThanOrEqual(path[i - 1].y);
      }
    }
  });

  it("records one wavefront per edit distance explored", () => {
    const d = diff(SAMPLES[0].before, SAMPLES[0].after);
    // The search stops as soon as it reaches the corner, so the trace is
    // bounded by the edit count rather than by the file size.
    expect(d.trace.length).toBeLessThanOrEqual(d.editCount + 1);
    expect(d.trace.length).toBeGreaterThan(0);
  });
});
