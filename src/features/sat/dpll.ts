// DPLL: deciding satisfiability by guessing, then regretting it efficiently.
//
// A CNF formula is an AND of clauses, each clause an OR of literals. The
// question is whether any assignment of true/false to the variables makes
// every clause true. With n variables there are 2^n assignments, and the
// problem is NP-complete, so in the worst case nothing avoids that. What
// DPLL (Davis-Putnam-Logemann-Loveland, 1962) does is avoid it in practice,
// and the two tricks that do the avoiding are both forced moves rather than
// clever heuristics:
//
//   Unit propagation. A clause with exactly one unassigned literal and no
//   satisfied literal has only one way to be true. That is not a guess; it is
//   an implication, and taking it costs nothing and prunes half a subtree.
//
//   Pure literal elimination. If a variable only ever appears positively,
//   setting it true can never break a clause. Also not a guess.
//
// Everything else is a decision: pick an unassigned variable, try a value, and
// on conflict try the other. The interesting measurement is the ratio of
// propagations to decisions — on structured formulas almost all of the work
// turns out to be forced, which is the whole reason SAT solvers are useful.
//
// This implementation is chronological backtracking, deliberately: it is the
// algorithm as published, and the thing a modern CDCL solver is an
// optimisation of. No clause learning, no watched literals, no restarts.

/** A literal: a variable index, negated or not. */
export interface Literal {
  variable: number;
  negated: boolean;
}

export type Clause = Literal[];

export interface Formula {
  variables: number;
  clauses: Clause[];
}

export type Value = true | false | null;

/** Parse "1 -2 3" style DIMACS-ish clause text, 1-indexed as DIMACS is. */
export function parseClause(text: string): Clause {
  return text
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0 && t !== "0")
    .map((t) => {
      const n = Number(t);
      return { variable: Math.abs(n) - 1, negated: n < 0 };
    });
}

export function lit(variable: number, negated = false): Literal {
  return { variable, negated };
}

/** Render a clause the way the page shows it: (x1 ∨ ¬x2 ∨ x3). */
export function formatClause(clause: Clause): string {
  if (clause.length === 0) return "(⊥)";
  return `(${clause.map((l) => `${l.negated ? "¬" : ""}x${l.variable + 1}`).join(" ∨ ")})`;
}

/** Is this clause satisfied / unsatisfied / still open under an assignment? */
export function clauseStatus(
  clause: Clause,
  assignment: Value[],
): "satisfied" | "conflict" | "unit" | "open" {
  let unassigned = 0;
  for (const l of clause) {
    const v = assignment[l.variable];
    if (v === null) {
      unassigned++;
      continue;
    }
    if (v !== l.negated) return "satisfied";
  }
  if (unassigned === 0) return "conflict";
  if (unassigned === 1) return "unit";
  return "open";
}

/** Does this complete assignment satisfy every clause? */
export function evaluate(formula: Formula, assignment: Value[]): boolean {
  return formula.clauses.every((c) => clauseStatus(c, assignment) === "satisfied");
}

export interface TrailEntry {
  variable: number;
  value: boolean;
  /** How this value was chosen. Only "decision" can be backtracked over. */
  reason: "decision" | "unit" | "pure";
  /** The clause that forced it, for unit propagation. */
  clause?: number;
  level: number;
}

export interface SolveStats {
  decisions: number;
  propagations: number;
  pureLiterals: number;
  conflicts: number;
  backtracks: number;
  /** Assignments examined — the figure 2^n is the ceiling on. */
  nodes: number;
}

export interface SolveResult {
  sat: boolean;
  assignment: Value[] | null;
  stats: SolveStats;
  /** The trail as it stood when the answer was reached, for drawing. */
  trail: TrailEntry[];
  /** Capped step log for animation; see `maxSteps`. */
  steps: SolveStep[];
  truncated: boolean;
}

export interface SolveStep {
  kind: "decide" | "unit" | "pure" | "conflict" | "backtrack" | "sat" | "unsat";
  variable?: number;
  value?: boolean;
  clause?: number;
  level: number;
  /** A copy of the assignment after this step. */
  assignment: Value[];
}

export interface SolveOptions {
  useUnitPropagation?: boolean;
  usePureLiterals?: boolean;
  /** Stop logging steps after this many, so the UI cannot be flooded. */
  maxSteps?: number;
}

/**
 * Solve by DPLL, logging every step so the search can be replayed.
 *
 * The recursion is written out as an explicit loop over a trail because the
 * page needs to show the trail, and because a recursive version would hide
 * the one thing worth seeing: backtracking is just popping decisions off the
 * end until one of them has an untried value.
 */
export function solve(formula: Formula, options: SolveOptions = {}): SolveResult {
  const useUnit = options.useUnitPropagation ?? true;
  const usePure = options.usePureLiterals ?? true;
  const maxSteps = options.maxSteps ?? 4000;

  const n = formula.variables;
  const assignment: Value[] = new Array(n).fill(null);
  const trail: TrailEntry[] = [];
  const steps: SolveStep[] = [];
  const stats: SolveStats = {
    decisions: 0,
    propagations: 0,
    pureLiterals: 0,
    conflicts: 0,
    backtracks: 0,
    nodes: 0,
  };
  let truncated = false;
  let level = 0;
  // Which decisions have had both values tried. Indexed by trail position.
  const triedBoth = new Set<number>();

  const log = (step: SolveStep) => {
    if (steps.length < maxSteps) steps.push(step);
    else truncated = true;
  };

  const assign = (
    variable: number,
    value: boolean,
    reason: TrailEntry["reason"],
    clause?: number,
  ) => {
    assignment[variable] = value;
    trail.push({ variable, value, reason, clause, level });
    stats.nodes++;
    log({
      kind: reason === "decision" ? "decide" : reason,
      variable,
      value,
      clause,
      level,
      assignment: assignment.slice(),
    });
  };

  const firstConflict = (): number => {
    for (let i = 0; i < formula.clauses.length; i++) {
      if (clauseStatus(formula.clauses[i], assignment) === "conflict") return i;
    }
    return -1;
  };

  /** Apply forced moves until none remain. Returns a conflicting clause, or -1. */
  const propagate = (): number => {
    for (;;) {
      const conflict = firstConflict();
      if (conflict >= 0) return conflict;

      if (useUnit) {
        let found = false;
        for (let i = 0; i < formula.clauses.length; i++) {
          const clause = formula.clauses[i];
          if (clauseStatus(clause, assignment) !== "unit") continue;
          const l = clause.find((x) => assignment[x.variable] === null);
          if (!l) continue;
          stats.propagations++;
          // The literal must be true, so the variable takes the value that
          // makes it true: false if the literal is negated.
          assign(l.variable, !l.negated, "unit", i);
          found = true;
          break;
        }
        if (found) continue;
      }

      if (usePure) {
        const polarity = new Map<number, { pos: boolean; neg: boolean }>();
        for (const clause of formula.clauses) {
          if (clauseStatus(clause, assignment) === "satisfied") continue;
          for (const l of clause) {
            if (assignment[l.variable] !== null) continue;
            const p = polarity.get(l.variable) ?? { pos: false, neg: false };
            if (l.negated) p.neg = true;
            else p.pos = true;
            polarity.set(l.variable, p);
          }
        }
        let found = false;
        for (const [variable, p] of polarity) {
          if (p.pos !== p.neg) {
            stats.pureLiterals++;
            assign(variable, p.pos, "pure");
            found = true;
            break;
          }
        }
        if (found) continue;
      }

      return -1;
    }
  };

  /** Undo the trail back to (and including) the last untried decision. */
  const backtrack = (): boolean => {
    for (;;) {
      // Pop everything implied since the last decision.
      while (trail.length > 0 && trail[trail.length - 1].reason !== "decision") {
        assignment[trail.pop()!.variable] = null;
      }
      if (trail.length === 0) return false;
      const idx = trail.length - 1;
      const entry = trail[idx];
      if (triedBoth.has(idx)) {
        // Both values of this decision failed: it is not the culprit either.
        triedBoth.delete(idx);
        assignment[trail.pop()!.variable] = null;
        continue;
      }
      // Flip it. Still the same decision level: this is the second branch.
      triedBoth.add(idx);
      assignment[entry.variable] = !entry.value;
      trail[idx] = { ...entry, value: !entry.value };
      stats.backtracks++;
      stats.nodes++;
      level = entry.level;
      log({
        kind: "backtrack",
        variable: entry.variable,
        value: !entry.value,
        level,
        assignment: assignment.slice(),
      });
      return true;
    }
  };

  for (;;) {
    const conflict = propagate();
    if (conflict >= 0) {
      stats.conflicts++;
      log({ kind: "conflict", clause: conflict, level, assignment: assignment.slice() });
      if (!backtrack()) {
        log({ kind: "unsat", level: 0, assignment: assignment.slice() });
        return { sat: false, assignment: null, stats, trail, steps, truncated };
      }
      continue;
    }

    const next = assignment.findIndex((v) => v === null);
    if (next === -1) {
      // Complete assignment with no conflict. Verified before returning,
      // rather than trusted: a solver that reports SAT with a bad witness is
      // worse than one that reports nothing.
      if (!evaluate(formula, assignment)) {
        throw new Error("solver bug: reported SAT with an assignment that fails a clause");
      }
      log({ kind: "sat", level, assignment: assignment.slice() });
      return { sat: true, assignment: assignment.slice(), stats, trail, steps, truncated };
    }

    level++;
    stats.decisions++;
    assign(next, true, "decision");
  }
}

/**
 * The same answer by trying all 2^n assignments. Exponential and only here so
 * the tests have something independent to check UNSAT against — a wrong UNSAT
 * is the one error a SAT solver cannot detect by checking its own output.
 */
export function bruteForce(formula: Formula): { sat: boolean; assignment: Value[] | null } {
  const n = formula.variables;
  const assignment: Value[] = new Array(n).fill(false);
  const total = 2 ** n;
  for (let mask = 0; mask < total; mask++) {
    for (let i = 0; i < n; i++) assignment[i] = ((mask >> i) & 1) === 1;
    if (evaluate(formula, assignment)) return { sat: true, assignment: assignment.slice() };
  }
  return { sat: false, assignment: null };
}

/** How many of the 2^n assignments satisfy the formula. For small n only. */
export function countModels(formula: Formula): number {
  const n = formula.variables;
  const assignment: Value[] = new Array(n).fill(false);
  let count = 0;
  for (let mask = 0; mask < 2 ** n; mask++) {
    for (let i = 0; i < n; i++) assignment[i] = ((mask >> i) & 1) === 1;
    if (evaluate(formula, assignment)) count++;
  }
  return count;
}

// --- formula families ------------------------------------------------------

/**
 * Pigeonhole: n+1 pigeons into n holes. Unsatisfiable for the obvious reason,
 * and famously hard for exactly this kind of solver — resolution needs
 * exponentially many steps, so the node count explodes while a human sees the
 * answer instantly. The best demonstration on the page that "NP-complete" is
 * not an abstraction.
 */
export function pigeonhole(holes: number): Formula {
  const pigeons = holes + 1;
  const v = (p: number, h: number) => p * holes + h;
  const clauses: Clause[] = [];
  // Every pigeon is in some hole.
  for (let p = 0; p < pigeons; p++) {
    clauses.push(Array.from({ length: holes }, (_, h) => lit(v(p, h))));
  }
  // No hole holds two pigeons.
  for (let h = 0; h < holes; h++) {
    for (let p = 0; p < pigeons; p++) {
      for (let q = p + 1; q < pigeons; q++) {
        clauses.push([lit(v(p, h), true), lit(v(q, h), true)]);
      }
    }
  }
  return { variables: pigeons * holes, clauses };
}

/** A chain of implications plus a unit — pure propagation, zero decisions. */
export function implicationChain(length: number): Formula {
  const clauses: Clause[] = [[lit(0)]];
  for (let i = 0; i + 1 < length; i++) {
    clauses.push([lit(i, true), lit(i + 1)]); // x_i -> x_{i+1}
  }
  return { variables: length, clauses };
}

/** Graph colouring as CNF: can this graph be k-coloured? */
export function graphColouring(
  nodes: number,
  edges: [number, number][],
  colours: number,
): Formula {
  const v = (node: number, c: number) => node * colours + c;
  const clauses: Clause[] = [];
  for (let node = 0; node < nodes; node++) {
    clauses.push(Array.from({ length: colours }, (_, c) => lit(v(node, c))));
    for (let a = 0; a < colours; a++) {
      for (let b = a + 1; b < colours; b++) {
        clauses.push([lit(v(node, a), true), lit(v(node, b), true)]);
      }
    }
  }
  for (const [x, y] of edges) {
    for (let c = 0; c < colours; c++) {
      clauses.push([lit(v(x, c), true), lit(v(y, c), true)]);
    }
  }
  return { variables: nodes * colours, clauses };
}

/** Uniform random 3-SAT at a given clause-to-variable ratio. */
export function random3Sat(variables: number, ratio: number, rand: () => number): Formula {
  const count = Math.round(variables * ratio);
  const clauses: Clause[] = [];
  for (let i = 0; i < count; i++) {
    const picked = new Set<number>();
    while (picked.size < Math.min(3, variables)) picked.add(Math.floor(rand() * variables));
    clauses.push([...picked].map((variable) => lit(variable, rand() < 0.5)));
  }
  return { variables, clauses };
}

export interface Preset {
  id: string;
  label: string;
  note: string;
  build: (rand: () => number) => Formula;
}

// K5 needs 5 colours; asking for 3 is unsatisfiable, and asking for 4 on the
// 4-cycle-with-a-chord below is satisfiable — a pair that shows the solver
// doing real work in both directions.
export const PRESETS: Preset[] = [
  {
    id: "chain",
    label: "implication chain",
    note: "one unit clause and a chain: every step is forced, so zero decisions",
    build: () => implicationChain(14),
  },
  {
    id: "colouring-sat",
    label: "3-colour a graph",
    note: "satisfiable colouring — the solver finds a witness you can check",
    build: () =>
      graphColouring(
        6,
        [
          [0, 1],
          [1, 2],
          [2, 0],
          [2, 3],
          [3, 4],
          [4, 5],
          [5, 3],
        ],
        3,
      ),
  },
  {
    id: "colouring-unsat",
    label: "3-colour K5",
    note: "K5 needs five colours: unsatisfiable, and the solver must prove it",
    build: () => {
      const edges: [number, number][] = [];
      for (let a = 0; a < 5; a++) for (let b = a + 1; b < 5; b++) edges.push([a, b]);
      return graphColouring(5, edges, 3);
    },
  },
  {
    id: "pigeonhole",
    label: "pigeonhole 5→4",
    note: "obvious to a human, exponential for DPLL — watch the node count",
    build: () => pigeonhole(4),
  },
  {
    id: "random",
    label: "random 3-SAT",
    note: "ratio 4.26 is the phase transition, where instances are hardest",
    build: (rand) => random3Sat(18, 4.26, rand),
  },
];

/** Small deterministic PRNG so a seed reproduces a formula exactly. */
export function makeRng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}
