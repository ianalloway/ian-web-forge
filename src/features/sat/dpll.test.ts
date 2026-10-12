import { describe, expect, it } from "vitest";
import {
  PRESETS,
  bruteForce,
  clauseStatus,
  countModels,
  evaluate,
  formatClause,
  graphColouring,
  implicationChain,
  lit,
  makeRng,
  parseClause,
  pigeonhole,
  random3Sat,
  solve,
  type Formula,
} from "./dpll";

describe("clause evaluation", () => {
  it("reports satisfied, unit, open and conflict correctly", () => {
    const clause = [lit(0), lit(1, true), lit(2)];
    expect(clauseStatus(clause, [null, null, null])).toBe("open");
    expect(clauseStatus(clause, [true, null, null])).toBe("satisfied");
    expect(clauseStatus(clause, [false, true, null])).toBe("unit");
    expect(clauseStatus(clause, [false, true, false])).toBe("conflict");
    // A negated literal is satisfied by false.
    expect(clauseStatus([lit(0, true)], [false])).toBe("satisfied");
  });

  it("treats the empty clause as an immediate conflict", () => {
    expect(clauseStatus([], [])).toBe("conflict");
    expect(evaluate({ variables: 1, clauses: [[]] }, [true])).toBe(false);
  });

  it("parses DIMACS-style clause text, 1-indexed with 0 as a terminator", () => {
    expect(parseClause("1 -2 3 0")).toEqual([lit(0), lit(1, true), lit(2)]);
    expect(parseClause("  -4  ")).toEqual([lit(3, true)]);
    expect(parseClause("")).toEqual([]);
  });

  it("formats clauses the way the page displays them", () => {
    expect(formatClause([lit(0), lit(1, true)])).toBe("(x1 ∨ ¬x2)");
    expect(formatClause([])).toBe("(⊥)");
  });
});

describe("solve agrees with brute force", () => {
  // The load-bearing test. A SAT answer can be checked from its own witness,
  // but an UNSAT answer cannot — so it is checked against enumeration of all
  // 2^n assignments, which shares no code with the solver's search.
  it("matches exhaustive enumeration on 400 random formulas", () => {
    const rand = makeRng(4242);
    let sat = 0;
    let unsat = 0;
    for (let trial = 0; trial < 400; trial++) {
      const variables = 3 + Math.floor(rand() * 7); // up to 2^9 assignments
      const formula = random3Sat(variables, 1 + rand() * 5, rand);
      const got = solve(formula);
      const want = bruteForce(formula);
      expect(got.sat).toBe(want.sat);
      if (got.sat) {
        sat++;
        expect(got.assignment).not.toBeNull();
        expect(evaluate(formula, got.assignment!)).toBe(true);
      } else {
        unsat++;
        expect(got.assignment).toBeNull();
      }
    }
    // Both branches must actually have been exercised, or the test proves
    // nothing about one of them.
    expect(sat).toBeGreaterThan(40);
    expect(unsat).toBeGreaterThan(40);
  });

  it("agrees with brute force however the search is configured", () => {
    // Unit propagation and pure literal elimination are forced moves, so
    // turning them off may change the node count but must never change the
    // answer. This is the invariant that catches a propagation bug.
    const rand = makeRng(99);
    for (let trial = 0; trial < 120; trial++) {
      const formula = random3Sat(4 + Math.floor(rand() * 5), 1 + rand() * 5, rand);
      const want = bruteForce(formula).sat;
      for (const useUnitPropagation of [true, false]) {
        for (const usePureLiterals of [true, false]) {
          const got = solve(formula, { useUnitPropagation, usePureLiterals });
          expect(got.sat).toBe(want);
          if (got.sat) expect(evaluate(formula, got.assignment!)).toBe(true);
        }
      }
    }
  });
});

describe("trivial formulas", () => {
  it("an empty formula is satisfiable", () => {
    expect(solve({ variables: 0, clauses: [] }).sat).toBe(true);
    expect(solve({ variables: 3, clauses: [] }).sat).toBe(true);
  });

  it("a formula containing the empty clause is unsatisfiable", () => {
    expect(solve({ variables: 2, clauses: [[]] }).sat).toBe(false);
  });

  it("contradictory units are unsatisfiable without any decision", () => {
    const formula: Formula = { variables: 1, clauses: [[lit(0)], [lit(0, true)]] };
    const r = solve(formula);
    expect(r.sat).toBe(false);
    expect(r.stats.decisions).toBe(0);
  });

  it("solves a single unit clause by propagation alone", () => {
    const r = solve({ variables: 1, clauses: [[lit(0, true)]] });
    expect(r.sat).toBe(true);
    expect(r.assignment).toEqual([false]);
    expect(r.stats.decisions).toBe(0);
  });
});

describe("unit propagation earns its place", () => {
  it("solves an implication chain with zero decisions", () => {
    // x1, and x_i -> x_{i+1}. Every variable is forced, so a correct
    // propagator never guesses — this is the cleanest possible check that
    // propagation is actually firing.
    const formula = implicationChain(30);
    const r = solve(formula);
    expect(r.sat).toBe(true);
    expect(r.stats.decisions).toBe(0);
    // 30 propagations, not 29: the initial unit clause is itself one.
    expect(r.stats.propagations).toBe(30);
    expect(r.assignment!.every((v) => v === true)).toBe(true);
  });

  it("turns 30 guesses into 30 forced moves on the chain", () => {
    // Without propagation the solver has to *decide* all 30 variables. It
    // happens to reach the same node count here, because guessing true every
    // time is right every time on this formula — so the honest comparison on
    // the chain is decisions, not nodes.
    const formula = implicationChain(30);
    const without = solve(formula, { useUnitPropagation: false, usePureLiterals: false });
    expect(without.sat).toBe(true);
    expect(without.stats.decisions).toBe(30);
    expect(solve(formula).stats.decisions).toBe(0);
  });

  it("explores strictly fewer nodes on every random instance at the phase transition", () => {
    // Where propagation actually pays, measured rather than assumed: 200 of
    // 200 instances, no ties. On the pigeonhole preset the same effect is
    // 229 nodes against 1564.
    const rand = makeRng(5);
    let fewer = 0;
    for (let i = 0; i < 200; i++) {
      const formula = random3Sat(14, 4.26, rand);
      const withProp = solve(formula).stats.nodes;
      const withoutProp = solve(formula, {
        useUnitPropagation: false,
        usePureLiterals: false,
      }).stats.nodes;
      if (withProp < withoutProp) fewer++;
    }
    expect(fewer).toBe(200);
  });

  it("does most of its work by propagation on structured formulas", () => {
    // The practical claim behind every SAT solver: on structure, the forced
    // moves dominate the guesses.
    const formula = PRESETS.find((p) => p.id === "colouring-sat")!.build(makeRng(1));
    const r = solve(formula);
    expect(r.sat).toBe(true);
    expect(r.stats.propagations + r.stats.pureLiterals).toBeGreaterThan(r.stats.decisions);
  });
});

describe("pure literal elimination", () => {
  it("sets a variable that only ever appears with one polarity", () => {
    // x3 appears only positively, so it can be set true with no risk.
    const formula: Formula = {
      variables: 3,
      clauses: [
        [lit(0), lit(2)],
        [lit(1, true), lit(2)],
      ],
    };
    const r = solve(formula, { useUnitPropagation: false, usePureLiterals: true });
    expect(r.sat).toBe(true);
    expect(r.stats.pureLiterals).toBeGreaterThan(0);
    expect(evaluate(formula, r.assignment!)).toBe(true);
  });

  it("never changes the answer on formulas where it does not apply", () => {
    const rand = makeRng(6);
    for (let i = 0; i < 60; i++) {
      const formula = random3Sat(6, 4.5, rand);
      expect(solve(formula, { usePureLiterals: true }).sat).toBe(
        solve(formula, { usePureLiterals: false }).sat,
      );
    }
  });
});

describe("graph colouring", () => {
  it("3-colours a graph that is 3-colourable, and the colouring is legal", () => {
    const edges: [number, number][] = [
      [0, 1],
      [1, 2],
      [2, 0],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 3],
    ];
    const formula = graphColouring(6, edges, 3);
    const r = solve(formula);
    expect(r.sat).toBe(true);

    // Decode the witness and check the colouring against the graph directly,
    // not against the CNF encoding — that way a bug in the encoding cannot
    // hide behind a bug in the solver.
    const colourOf = (node: number) => {
      const assigned: number[] = [];
      for (let c = 0; c < 3; c++) if (r.assignment![node * 3 + c]) assigned.push(c);
      return assigned;
    };
    for (let node = 0; node < 6; node++) expect(colourOf(node)).toHaveLength(1);
    for (const [a, b] of edges) expect(colourOf(a)[0]).not.toBe(colourOf(b)[0]);
  });

  it("proves K5 is not 3-colourable, and not 4-colourable either", () => {
    const edges: [number, number][] = [];
    for (let a = 0; a < 5; a++) for (let b = a + 1; b < 5; b++) edges.push([a, b]);
    expect(solve(graphColouring(5, edges, 3)).sat).toBe(false);
    expect(solve(graphColouring(5, edges, 4)).sat).toBe(false);
    // Five colours is exactly enough for a 5-clique.
    expect(solve(graphColouring(5, edges, 5)).sat).toBe(true);
  });
});

describe("pigeonhole", () => {
  it("is unsatisfiable for every size, as the principle says", () => {
    for (const holes of [1, 2, 3, 4]) {
      expect(solve(pigeonhole(holes)).sat).toBe(false);
    }
  });

  it("has the right shape: n+1 pigeons, n holes, and the expected clause count", () => {
    const holes = 4;
    const f = pigeonhole(holes);
    const pigeons = holes + 1;
    expect(f.variables).toBe(pigeons * holes);
    // One clause per pigeon, plus one per hole per pair of pigeons.
    expect(f.clauses).toHaveLength(pigeons + holes * ((pigeons * (pigeons - 1)) / 2));
  });

  it("costs DPLL exponentially more work as it grows", () => {
    // The reason this preset is on the page: the formula a human dismisses in
    // a second is the one that makes chronological backtracking fall over.
    const nodes = [2, 3, 4].map((h) => solve(pigeonhole(h)).stats.nodes);
    expect(nodes[1]).toBeGreaterThan(nodes[0]);
    expect(nodes[2]).toBeGreaterThan(nodes[1] * 2);
  });
});

describe("model counting", () => {
  it("counts every satisfying assignment, and agrees with satisfiability", () => {
    const rand = makeRng(17);
    for (let i = 0; i < 50; i++) {
      const formula = random3Sat(3 + Math.floor(rand() * 4), 1 + rand() * 4, rand);
      const models = countModels(formula);
      expect(models >= 1).toBe(solve(formula).sat);
      expect(models).toBeLessThanOrEqual(2 ** formula.variables);
    }
  });

  it("a formula with no clauses has 2^n models", () => {
    expect(countModels({ variables: 4, clauses: [] })).toBe(16);
  });
});

describe("statistics and step log", () => {
  it("counts a node for every assignment the search makes", () => {
    const formula = PRESETS.find((p) => p.id === "random")!.build(makeRng(3));
    const r = solve(formula);
    expect(r.stats.nodes).toBe(
      r.stats.decisions + r.stats.propagations + r.stats.pureLiterals + r.stats.backtracks,
    );
    expect(r.stats.nodes).toBeGreaterThan(0);
  });

  it("logs a terminal step saying how the search ended", () => {
    const satRun = solve(implicationChain(6));
    expect(satRun.steps[satRun.steps.length - 1].kind).toBe("sat");
    const unsatRun = solve(pigeonhole(2));
    expect(unsatRun.steps[unsatRun.steps.length - 1].kind).toBe("unsat");
  });

  it("caps the step log rather than growing without bound", () => {
    const r = solve(pigeonhole(4), { maxSteps: 50 });
    expect(r.steps.length).toBeLessThanOrEqual(50);
    expect(r.truncated).toBe(true);
    // Truncating the log must not affect the answer.
    expect(r.sat).toBe(false);
  });

  it("every conflict step names a clause that is genuinely conflicting", () => {
    const formula = PRESETS.find((p) => p.id === "colouring-unsat")!.build(makeRng(1));
    const r = solve(formula, { maxSteps: 500 });
    const conflicts = r.steps.filter((s) => s.kind === "conflict");
    expect(conflicts.length).toBeGreaterThan(0);
    for (const step of conflicts) {
      expect(step.clause).toBeDefined();
      expect(clauseStatus(formula.clauses[step.clause!], step.assignment)).toBe("conflict");
    }
  });

  it("every unit step names a clause that forced it", () => {
    const formula = PRESETS.find((p) => p.id === "colouring-sat")!.build(makeRng(1));
    const r = solve(formula, { maxSteps: 800 });
    const units = r.steps.filter((s) => s.kind === "unit");
    expect(units.length).toBeGreaterThan(0);
    for (const step of units) {
      expect(step.clause).toBeDefined();
      // The clause must contain the variable that was assigned.
      expect(
        formula.clauses[step.clause!].some((l) => l.variable === step.variable),
      ).toBe(true);
    }
  });
});

describe("presets", () => {
  it("every preset builds a well-formed formula with in-range literals", () => {
    for (const p of PRESETS) {
      const f = p.build(makeRng(1));
      expect(f.variables).toBeGreaterThan(0);
      expect(f.clauses.length).toBeGreaterThan(0);
      for (const clause of f.clauses) {
        for (const l of clause) {
          expect(l.variable).toBeGreaterThanOrEqual(0);
          expect(l.variable).toBeLessThan(f.variables);
        }
      }
    }
  });

  it("the presets labelled unsatisfiable are, and the others are not", () => {
    const expected: Record<string, boolean> = {
      chain: true,
      "colouring-sat": true,
      "colouring-unsat": false,
      pigeonhole: false,
    };
    for (const [id, sat] of Object.entries(expected)) {
      const f = PRESETS.find((p) => p.id === id)!.build(makeRng(1));
      expect(solve(f).sat, `${id} should be ${sat ? "SAT" : "UNSAT"}`).toBe(sat);
    }
  });

  it("random 3-SAT near the phase transition is a genuine mix", () => {
    // At ratio 4.26 roughly half of instances are satisfiable. If this came
    // out all-SAT or all-UNSAT the preset would be a bad demonstration.
    let sat = 0;
    const trials = 60;
    for (let i = 0; i < trials; i++) {
      if (solve(random3Sat(18, 4.26, makeRng(200 + i))).sat) sat++;
    }
    expect(sat).toBeGreaterThan(trials * 0.15);
    expect(sat).toBeLessThan(trials * 0.85);
  });
});
