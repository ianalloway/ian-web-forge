import { describe, expect, it } from "vitest";
import {
  Sample,
  auc,
  averagePrecision,
  confusionAt,
  makeRng,
  precision,
  prCurve,
  recall,
  rocCurve,
  sampleScores,
} from "./roc";

/** AUC equals the probability a random positive outranks a random negative. */
function rankAuc(samples: Sample[]): number {
  const pos = samples.filter((s) => s.label === 1).map((s) => s.score);
  const neg = samples.filter((s) => s.label === 0).map((s) => s.score);
  let wins = 0;
  for (const p of pos) for (const n of neg) wins += p > n ? 1 : p === n ? 0.5 : 0;
  return pos.length && neg.length ? wins / (pos.length * neg.length) : 0;
}

describe("confusion counts", () => {
  const samples = sampleScores({ n: 500, prior: 0.4, separation: 2, sigma: 1 }, makeRng(1));

  it("always partition the whole sample", () => {
    const c = confusionAt(samples, 0.3);
    expect(c.tp + c.fp + c.fn + c.tn).toBe(samples.length);
  });

  it("predict everything positive below all scores, nothing above all scores", () => {
    const lo = confusionAt(samples, -Infinity);
    expect(lo.fn).toBe(0);
    expect(lo.tn).toBe(0);
    const hi = confusionAt(samples, Infinity);
    expect(hi.tp).toBe(0);
    expect(hi.fp).toBe(0);
  });
});

describe("ROC", () => {
  it("starts at (0,0) and ends at (1,1)", () => {
    const pts = rocCurve(sampleScores({ n: 300, prior: 0.5, separation: 1.5, sigma: 1 }, makeRng(2)));
    expect(pts[0]).toMatchObject({ fpr: 0, tpr: 0 });
    const last = pts[pts.length - 1];
    expect(last.fpr).toBeCloseTo(1, 10);
    expect(last.tpr).toBeCloseTo(1, 10);
  });

  it("is monotonic non-decreasing in both axes", () => {
    const pts = rocCurve(sampleScores({ n: 400, prior: 0.45, separation: 1, sigma: 1 }, makeRng(3)));
    for (let i = 1; i < pts.length; i++) {
      expect(pts[i].fpr).toBeGreaterThanOrEqual(pts[i - 1].fpr - 1e-12);
      expect(pts[i].tpr).toBeGreaterThanOrEqual(pts[i - 1].tpr - 1e-12);
    }
  });

  it("matches the rank-based AUC (Mann–Whitney)", () => {
    const samples = sampleScores({ n: 600, prior: 0.5, separation: 1.2, sigma: 1 }, makeRng(4));
    expect(auc(rocCurve(samples))).toBeCloseTo(rankAuc(samples), 6);
  });

  it("is 1 for perfectly separable classes and ~0.5 for coincident ones", () => {
    const sep = sampleScores({ n: 400, prior: 0.5, separation: 20, sigma: 1 }, makeRng(5));
    expect(auc(rocCurve(sep))).toBeCloseTo(1, 6);

    const same = sampleScores({ n: 4000, prior: 0.5, separation: 0, sigma: 1 }, makeRng(6));
    expect(auc(rocCurve(same))).toBeGreaterThan(0.45);
    expect(auc(rocCurve(same))).toBeLessThan(0.55);
  });
});

describe("precision–recall", () => {
  it("average precision is near 1 when the classes are separable", () => {
    const s = sampleScores({ n: 400, prior: 0.5, separation: 20, sigma: 1 }, makeRng(7));
    expect(averagePrecision(s)).toBeGreaterThan(0.99);
  });

  it("recall never decreases as the threshold drops", () => {
    const pts = prCurve(sampleScores({ n: 300, prior: 0.5, separation: 1.5, sigma: 1 }, makeRng(8)));
    for (let i = 1; i < pts.length; i++) {
      expect(pts[i].recall).toBeGreaterThanOrEqual(pts[i - 1].recall - 1e-12);
    }
  });
});

describe("metrics at a threshold", () => {
  it("recall and precision follow from the confusion matrix", () => {
    const samples: Sample[] = [
      { score: 3, label: 1 },
      { score: 2, label: 1 },
      { score: 1, label: 0 },
      { score: 0, label: 1 },
      { score: -1, label: 0 },
    ];
    const c = confusionAt(samples, 1); // predict positive for scores 3,2,1
    expect(c).toEqual({ tp: 2, fp: 1, fn: 1, tn: 1 });
    expect(recall(c)).toBeCloseTo(2 / 3, 10);
    expect(precision(c)).toBeCloseTo(2 / 3, 10);
  });
});
