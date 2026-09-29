import { describe, expect, it } from "vitest";
import {
  additive,
  americanToImplied,
  decimalToImplied,
  devig,
  edgeVersusFair,
  formatAmerican,
  fromImplied,
  impliedToAmerican,
  impliedToDecimal,
  multiplicative,
  power,
  shin,
  toImplied,
} from "./vig";

const approx = (actual: number, expected: number, eps = 1e-6) => {
  expect(Math.abs(actual - expected)).toBeLessThan(eps);
};

describe("odds conversion", () => {
  it("maps −110 american to ~52.381% implied", () => {
    approx(americanToImplied(-110), 110 / 210);
  });

  it("maps +150 american to 40% implied", () => {
    approx(americanToImplied(150), 0.4);
  });

  it("maps decimal 1.91 to ~52.356% implied", () => {
    approx(decimalToImplied(1.91), 1 / 1.91);
  });

  it("round-trips probability ↔ american for favorites and dogs", () => {
    // 0.5 → +100 by convention (even money).
    expect(impliedToAmerican(0.5)).toBe(100);
    approx(americanToImplied(impliedToAmerican(0.6)), 0.6, 0.001);
    approx(americanToImplied(impliedToAmerican(0.4)), 0.4, 0.001);
  });

  it("converts via format helpers", () => {
    approx(toImplied(-110, "american"), 110 / 210);
    approx(toImplied(1.91, "decimal"), 1 / 1.91);
    approx(toImplied(0.5238, "probability"), 0.5238);
    approx(toImplied(52.38, "probability"), 0.5238);
    approx(fromImplied(0.5, "decimal"), 2);
    expect(formatAmerican(-110)).toBe("-110");
    expect(formatAmerican(150)).toBe("+150");
  });

  it("rejects invalid prices", () => {
    expect(() => americanToImplied(0)).toThrow(RangeError);
    expect(() => decimalToImplied(1)).toThrow(RangeError);
    expect(() => impliedToDecimal(0)).toThrow(RangeError);
    expect(() => toImplied(150, "probability")).toThrow(RangeError);
  });
});

describe("−110 / −110 standard juice", () => {
  const implied = [americanToImplied(-110), americanToImplied(-110)];

  it("has ~4.762% overround and ~4.545% hold", () => {
    const total = implied[0] + implied[1];
    approx(total - 1, 1 / 21); // 4.7619…%
    approx(1 - 1 / total, 1 / 22); // 4.5454…%
  });

  it("devig reports 4.55% hold and 50/50 fair probs (multiplicative)", () => {
    const r = devig(
      [
        { label: "a", odds: -110 },
        { label: "b", odds: -110 },
      ],
      "american",
      "multiplicative"
    );
    approx(r.holdPct, 4.545454, 1e-4);
    approx(r.overroundPct, 4.761904, 1e-4);
    approx(r.outcomes[0].fair, 0.5);
    approx(r.outcomes[1].fair, 0.5);
    approx(r.outcomes[0].fairDecimal, 2);
  });

  it("additive / power / shin also collapse to 50/50 on a balanced book", () => {
    for (const method of ["additive", "power", "shin"] as const) {
      const r = devig(
        [
          { odds: -110 },
          { odds: -110 },
        ],
        "american",
        method
      );
      approx(r.outcomes[0].fair, 0.5, 1e-5);
      approx(r.outcomes[1].fair, 0.5, 1e-5);
    }
  });
});

describe("devig methods on an unbalanced two-way", () => {
  // −150 / +130 ≈ 60% / 43.48% raw → overround ~3.48%
  const a = americanToImplied(-150);
  const b = americanToImplied(130);
  const implied = [a, b];

  it("multiplicative renormalizes to sum 1", () => {
    const fair = multiplicative(implied);
    approx(fair[0] + fair[1], 1);
    approx(fair[0], a / (a + b));
    approx(fair[1], b / (a + b));
  });

  it("additive peels equal absolute juice", () => {
    const fair = additive(implied);
    approx(fair[0] + fair[1], 1);
    // Favorite keeps more probability than the dog after equal peel.
    expect(fair[0]).toBeGreaterThan(fair[1]);
    // Equal absolute peel hurts the shorter side less than proportional, so
    // the favorite's fair share is slightly higher than multiplicative.
    const mult = multiplicative(implied);
    expect(fair[0]).toBeGreaterThan(mult[0]);
  });
  it("power and shin stay in (0,1) and sum to 1", () => {
    for (const fn of [power, shin]) {
      const fair = fn(implied);
      approx(sum(fair), 1, 1e-6);
      expect(fair[0]).toBeGreaterThan(0);
      expect(fair[1]).toBeGreaterThan(0);
      expect(fair[0]).toBeLessThan(1);
    }
  });

  it("shin is close to multiplicative when juice is small", () => {
    const m = multiplicative(implied);
    const s = shin(implied);
    approx(s[0], m[0], 0.01);
    approx(s[1], m[1], 0.01);
  });
});

describe("three-way market", () => {
  it("de-vigs a soccer 1X2 book", () => {
    // Classic example: 1.80 / 3.60 / 4.50 → raw ~55.6 / 27.8 / 22.2 = 105.6%
    const r = devig(
      [
        { label: "home", odds: 1.8 },
        { label: "draw", odds: 3.6 },
        { label: "away", odds: 4.5 },
      ],
      "decimal",
      "multiplicative"
    );
    approx(r.overroundPct, 5.555555, 1e-3);
    approx(sum(r.outcomes.map((o) => o.fair)), 1);
    approx(r.outcomes[0].fair, (1 / 1.8) / (1 / 1.8 + 1 / 3.6 + 1 / 4.5));
  });

  it("power and shin handle three-ways", () => {
    const outcomes = [
      { odds: 2.1 },
      { odds: 3.4 },
      { odds: 3.6 },
    ];
    for (const method of ["power", "shin", "additive"] as const) {
      const r = devig(outcomes, "decimal", method);
      approx(sum(r.outcomes.map((o) => o.fair)), 1, 1e-5);
    }
  });
});

describe("edgeVersusFair + quarter Kelly", () => {
  it("suggests quarter-Kelly when you have an edge at −110", () => {
    // Fair coin, book −110, you have 55% — classic positive edge.
    const r = edgeVersusFair(0.55, 0.5, 1 + 100 / 110, 1000);
    expect(r.hasEdge).toBe(true);
    expect(r.edge).toBeCloseTo(0.05, 6);
    // Full Kelly at p=0.55, b=100/110≈0.909: f=(0.909*0.55−0.45)/0.909≈0.055
    approx(r.kellyFraction, ((100 / 110) * 0.55 - 0.45) / (100 / 110), 1e-6);
    approx(r.quarterKelly, r.kellyFraction / 4);
    expect(r.quarterKellyDollars).not.toBeNull();
    approx(r.quarterKellyDollars!, 1000 * r.quarterKelly, 0.02);
  });

  it("returns zero Kelly with no edge", () => {
    const r = edgeVersusFair(0.45, 0.5, 1.91);
    expect(r.hasEdge).toBe(false);
    expect(r.kellyFraction).toBe(0);
    expect(r.quarterKelly).toBe(0);
    expect(r.quarterKellyDollars).toBeNull();
  });
});

describe("devig validation", () => {
  it("requires at least two outcomes", () => {
    expect(() => devig([{ odds: -110 }], "american")).toThrow(RangeError);
  });
});

function sum(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0);
}
