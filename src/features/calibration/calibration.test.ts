import { describe, expect, it } from "vitest";
import {
  accuracy,
  brier,
  ece,
  fitTemperature,
  logit,
  logLoss,
  makeDataset,
  makeRng,
  mce,
  predict,
  reliability,
  sigmoid,
} from "./calibration";

const preds = (samples: ReturnType<typeof makeDataset>, c: number, b: number) =>
  samples.map((s) => predict(s, c, b));
const ys = (samples: ReturnType<typeof makeDataset>) => samples.map((s) => s.y);

describe("sigmoid / logit", () => {
  it("are inverses", () => {
    for (const p of [0.1, 0.37, 0.5, 0.82, 0.99]) expect(sigmoid(logit(p))).toBeCloseTo(p, 9);
  });
});

describe("reliability binning", () => {
  const samples = makeDataset(2000, 1.6, makeRng(1));
  const p = preds(samples, 1, 0);
  const bins = reliability(p, ys(samples), 12);

  it("accounts for every sample exactly once", () => {
    expect(bins.reduce((s, b) => s + b.count, 0)).toBe(samples.length);
  });
  it("keeps each bin's mean prediction inside the bin", () => {
    for (const b of bins) if (b.count) {
      expect(b.meanPred).toBeGreaterThanOrEqual(b.lo - 1e-9);
      expect(b.meanPred).toBeLessThanOrEqual(b.hi + 1e-9);
    }
  });
});

describe("Brier score", () => {
  it("is 0 for perfect hard predictions and bounded in [0,1]", () => {
    expect(brier([1, 0, 1], [1, 0, 1])).toBe(0);
    const s = makeDataset(500, 1.5, makeRng(2));
    const b = brier(preds(s, 1.4, 0.2), ys(s));
    expect(b).toBeGreaterThanOrEqual(0);
    expect(b).toBeLessThanOrEqual(1);
  });
});

describe("calibration error", () => {
  const samples = makeDataset(4000, 1.6, makeRng(3));
  const y = ys(samples);

  it("is small when the model reports its true probabilities", () => {
    const bins = reliability(preds(samples, 1, 0), y, 15);
    expect(ece(bins, samples.length)).toBeLessThan(0.05);
  });

  it("grows when the model is made overconfident", () => {
    const calib = ece(reliability(preds(samples, 1, 0), y, 15), samples.length);
    const over = ece(reliability(preds(samples, 2.2, 0), y, 15), samples.length);
    expect(over).toBeGreaterThan(calib);
    expect(mce(reliability(preds(samples, 2.2, 0), y, 15))).toBeGreaterThanOrEqual(over);
  });

  it("ECE and MCE stay in [0,1]", () => {
    const bins = reliability(preds(samples, 0.5, -0.5), y, 15);
    const e = ece(bins, samples.length);
    expect(e).toBeGreaterThanOrEqual(0);
    expect(e).toBeLessThanOrEqual(1);
    expect(mce(bins)).toBeLessThanOrEqual(1);
  });
});

describe("temperature scaling", () => {
  const samples = makeDataset(4000, 1.6, makeRng(4));
  const y = ys(samples);

  it("recovers T≈2 for a model scaled by 2, and cuts its log loss", () => {
    const over = samples.map((s) => predict(s, 2, 0)); // logits are 2·z
    const logits = over.map((p) => logit(p));
    const T = fitTemperature(logits, y);
    expect(T).toBeGreaterThan(1.5);
    expect(T).toBeLessThan(2.6);

    const scaled = logits.map((l) => sigmoid(l / T));
    expect(logLoss(scaled, y)).toBeLessThan(logLoss(over, y));
  });

  it("leaves a calibrated model near T≈1", () => {
    const logits = samples.map((s) => logit(predict(s, 1, 0)));
    const T = fitTemperature(logits, y);
    expect(T).toBeGreaterThan(0.8);
    expect(T).toBeLessThan(1.25);
  });
});

describe("accuracy", () => {
  it("is unchanged by any positive temperature (threshold at 0.5 ↔ logit 0)", () => {
    const s = makeDataset(800, 1.5, makeRng(5));
    const logits = s.map((x) => logit(predict(x, 1.7, 0)));
    const raw = logits.map(sigmoid);
    const scaled = logits.map((l) => sigmoid(l / 3));
    expect(accuracy(scaled, ys(s))).toBeCloseTo(accuracy(raw, ys(s)), 10);
  });
});
