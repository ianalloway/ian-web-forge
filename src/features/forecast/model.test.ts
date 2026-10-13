import { describe, expect, it } from "vitest";
import { COIN_FLIP, FORECASTS, brier, brierTerm, emptyHistory, parseHistory, percent, posterior, record } from "./model";

describe("forecast model", () => {
  it("starts every forecast at its prior mean, strictly inside (0, 1)", () => {
    for (const spec of FORECASTS) {
      const p = posterior(spec);
      expect(p).toBeCloseTo(spec.alpha / (spec.alpha + spec.beta));
      expect(p).toBeGreaterThan(0);
      expect(p).toBeLessThan(1);
    }
  });

  it("moves toward what the visitor actually does", () => {
    const spec = { alpha: 1, beta: 3 };
    expect(posterior(spec, { yes: 4, no: 0 })).toBeCloseTo(5 / 8);
    expect(posterior(spec, { yes: 0, no: 12 })).toBeLessThan(posterior(spec));
    expect(posterior(spec, { yes: 500, no: 500 })).toBeCloseTo(0.5, 2);
  });

  it("scores a coin flip at 0.25 and certainty at 0 or 1", () => {
    expect(brierTerm(0.5, 1)).toBe(COIN_FLIP);
    expect(brierTerm(1, 1)).toBe(0);
    expect(brierTerm(1, 0)).toBe(1);
    expect(brier([])).toBeNull();
    expect(brier([0.04, 0.36])).toBeCloseTo(0.2);
  });

  it("records outcomes without mutating the previous history", () => {
    const before = emptyHistory();
    const after = record(before, "scroll", 0.8, 1, true);
    expect(before.counts.scroll).toEqual({ yes: 0, no: 0 });
    expect(after.counts.scroll).toEqual({ yes: 1, no: 0 });
    expect(after.visits).toBe(1);
    expect(after.sumSq).toBeCloseTo(0.04);
    const later = record(after, "lab", 0.2, 0, false);
    expect(later.visits).toBe(1);
    expect(later.scored).toBe(2);
    expect(later.counts.lab).toEqual({ yes: 0, no: 1 });
  });

  it("survives malformed storage", () => {
    for (const raw of [null, "", "nope", "[]", "42", '{"visits":"x","counts":{"scroll":{"yes":-3,"no":"7"}}}']) {
      const history = parseHistory(raw);
      expect(history.visits).toBe(0);
      expect(history.counts.scroll).toEqual({ yes: 0, no: 0 });
    }
    const round = parseHistory(JSON.stringify(record(emptyHistory(), "stay", 0.6, 1, true)));
    expect(round.counts.stay.yes).toBe(1);
    expect(round.scored).toBe(1);
  });

  it("never prints 0% or 100%", () => {
    expect(percent(0.001)).toBe("1%");
    expect(percent(0.999)).toBe("99%");
    expect(percent(0.776)).toBe("78%");
  });
});
