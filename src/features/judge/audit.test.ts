import { describe, expect, it } from "vitest";
import {
  DEFAULT_MATCHUP,
  PRESETS,
  THRESHOLDS,
  cohensKappa,
  logisticFit,
  makeItems,
  reliability,
  rng,
  runAudit,
  sigmoid,
  type JudgeConfig,
} from "./audit";

const preset = (id: string) => PRESETS.find((p) => p.id === id)!.judge;
const audit = (r: ReturnType<typeof runAudit>, id: string) => r.audits.find((a) => a.id === id)!;
const estimate = (r: ReturnType<typeof runAudit>, id: string) => r.estimates.find((e) => e.id === id)!.rate;

describe("the plumbing", () => {
  it("reproduces a run exactly from its seed", () => {
    const a = runAudit(preset("typical"), DEFAULT_MATCHUP);
    const b = runAudit(preset("typical"), DEFAULT_MATCHUP);
    expect(a).toEqual(b);
  });

  it("keeps the world fixed when only the judge changes", () => {
    // Swapping judges should re-grade the same prompts, not draw new ones.
    const a = runAudit(preset("typical"), DEFAULT_MATCHUP);
    const b = runAudit(preset("coin"), DEFAULT_MATCHUP);
    expect(a.truth).toBe(b.truth);
    expect(a.longerTrulyBetter).toBe(b.longerTrulyBetter);
  });

  it("draws quality and length independently", () => {
    const items = makeItems({ ...DEFAULT_MATCHUP, prompts: 20000, lengthRatio: 2 });
    const xs = items.map((i) => i.qCandidate - i.qBaseline);
    const ys = items.map((i) => Math.log(i.lenCandidate / i.lenBaseline));
    const mean = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length;
    const mx = mean(xs);
    const my = mean(ys);
    let cov = 0;
    let vx = 0;
    let vy = 0;
    for (let i = 0; i < xs.length; i++) {
      cov += (xs[i] - mx) * (ys[i] - my);
      vx += (xs[i] - mx) ** 2;
      vy += (ys[i] - my) ** 2;
    }
    expect(Math.abs(cov / Math.sqrt(vx * vy))).toBeLessThan(0.03);
    expect(my).toBeCloseTo(Math.log(2), 1);
  });

  it("produces uniform-looking random numbers", () => {
    const r = rng(1);
    let sum = 0;
    for (let i = 0; i < 50000; i++) sum += r();
    expect(sum / 50000).toBeCloseTo(0.5, 2);
  });
});

describe("Cohen's kappa", () => {
  it("is 1 for identical raters and about 0 for independent ones", () => {
    const r = rng(9);
    const a = Array.from({ length: 20000 }, () => r() < 0.5);
    const b = Array.from({ length: 20000 }, () => r() < 0.5);
    expect(cohensKappa(a, a)).toBe(1);
    expect(Math.abs(cohensKappa(a, b))).toBeLessThan(0.03);
  });

  it("matches a worked example", () => {
    // 20 yes/yes, 5 yes/no, 10 no/yes, 15 no/no → po 0.7, pe 0.5, κ 0.4.
    const a = [...Array(25).fill(true), ...Array(25).fill(false)];
    const b = [...Array(20).fill(true), ...Array(5).fill(false), ...Array(10).fill(true), ...Array(15).fill(false)];
    expect(cohensKappa(a, b)).toBeCloseTo(0.4, 10);
  });
});

describe("calibration", () => {
  it("scores a perfectly calibrated set near zero and an overconfident one high", () => {
    const r = rng(3);
    const conf: number[] = [];
    const honest: boolean[] = [];
    const cocky: boolean[] = [];
    for (let i = 0; i < 40000; i++) {
      const c = 0.5 + 0.5 * r();
      conf.push(c);
      honest.push(r() < c);
      cocky.push(r() < 0.6);
    }
    expect(reliability(conf, honest).ece).toBeLessThan(0.02);
    expect(reliability(conf, cocky).ece).toBeGreaterThan(0.1);
  });
});

describe("logistic regression", () => {
  it("recovers known coefficients", () => {
    const r = rng(5);
    const x: number[][] = [];
    const y: number[] = [];
    for (let i = 0; i < 30000; i++) {
      const s = r() < 0.5 ? 1 : -1;
      const l = r() * 2 - 1;
      x.push([1, s, l]);
      y.push(r() < sigmoid(0.3 + 0.8 * s - 1.5 * l) ? 1 : 0);
    }
    const [b0, b1, b2] = logisticFit(x, y);
    expect(b0).toBeCloseTo(0.3, 1);
    expect(b1).toBeCloseTo(0.8, 1);
    expect(b2).toBeCloseTo(-1.5, 1);
  });
});

describe("the audit battery", () => {
  const big = { ...DEFAULT_MATCHUP, prompts: 3000 };

  it("passes a judge with no position or length preference on both bias audits", () => {
    const r = runAudit(preset("fair"), big);
    expect(audit(r, "slot").status).toBe("pass");
    expect(audit(r, "verbosity").status).toBe("pass");
    expect(audit(r, "verbosity").value).toBe(0); // same noise draw, no length term
    expect(Math.abs(audit(r, "slot").value - 0.5)).toBeLessThan(0.03);
  });

  it("flags position bias and the swap-averaged estimate undoes it", () => {
    const r = runAudit(preset("slot"), { ...big, candidateFirst: true });
    expect(audit(r, "position").status).toBe("flag");
    expect(audit(r, "slot").status).toBe("flag");
    expect(estimate(r, "naive") - r.truth).toBeGreaterThan(0.2);
    expect(Math.abs(estimate(r, "swap") - r.truth)).toBeLessThan(0.05);
  });

  it("flags verbosity bias and length control undoes it where swapping cannot", () => {
    const r = runAudit(preset("verbose"), big);
    expect(audit(r, "verbosity").status).toBe("flag");
    expect(estimate(r, "swap") - r.truth).toBeGreaterThan(0.15);
    expect(Math.abs(estimate(r, "lc") - r.truth)).toBeLessThan(0.05);
    expect(r.lcModel.length).toBeGreaterThan(1);
  });

  it("flags a judge that barely reads the answers on consistency and agreement", () => {
    const r = runAudit(preset("coin"), big);
    expect(audit(r, "consistency").status).toBe("flag");
    expect(audit(r, "panel").status).toBe("flag");
    expect(audit(r, "panel").value).toBeLessThan(THRESHOLDS.minKappa);
  });

  it("shows panel agreement is not accuracy: biased judges agree with each other", () => {
    const loud: JudgeConfig = { sharpness: 0.3, positionBias: 0, verbosityBias: 3, noise: 0.3, overconfidence: 1 };
    const r = runAudit(loud, big);
    expect(audit(r, "panel").status).toBe("pass");
    expect(r.accuracy).toBeLessThan(0.7);
  });

  it("puts the truth near Φ(gap/√2)", () => {
    const r = runAudit(preset("fair"), { ...DEFAULT_MATCHUP, prompts: 20000, qualityGap: 0.5 });
    // Φ(0.5/√2) ≈ 0.638
    expect(r.truth).toBeCloseTo(0.638, 1);
  });
});
