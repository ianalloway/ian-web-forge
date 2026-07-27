// A small regular-expression engine built the textbook way: parse the pattern
// into a syntax tree, compile that to an NFA by Thompson's construction, then
// convert the NFA to a DFA by subset construction.
//
// Supported syntax: literals, concatenation, alternation `|`, `*`, `+`, `?`,
// grouping with parentheses, and `.` for any character. No backtracking is
// involved, so matching is linear in the input length.

export type Node =
  | { kind: "empty" }
  | { kind: "char"; ch: string }
  | { kind: "any" }
  | { kind: "concat"; left: Node; right: Node }
  | { kind: "alt"; left: Node; right: Node }
  | { kind: "star"; node: Node }
  | { kind: "plus"; node: Node }
  | { kind: "opt"; node: Node };

/** Recursive-descent parser: alt → concat → repeat → atom. */
export function parse(pattern: string): Node {
  let pos = 0;
  const peek = () => pattern[pos];
  const eof = () => pos >= pattern.length;

  function parseAlt(): Node {
    let left = parseConcat();
    while (!eof() && peek() === "|") {
      pos++;
      left = { kind: "alt", left, right: parseConcat() };
    }
    return left;
  }

  function parseConcat(): Node {
    let left: Node | null = null;
    while (!eof() && peek() !== "|" && peek() !== ")") {
      const next = parseRepeat();
      left = left === null ? next : { kind: "concat", left, right: next };
    }
    return left ?? { kind: "empty" };
  }

  function parseRepeat(): Node {
    let node = parseAtom();
    for (;;) {
      const c = peek();
      if (c === "*") {
        pos++;
        node = { kind: "star", node };
      } else if (c === "+") {
        pos++;
        node = { kind: "plus", node };
      } else if (c === "?") {
        pos++;
        node = { kind: "opt", node };
      } else break;
    }
    return node;
  }

  function parseAtom(): Node {
    const c = peek();
    if (c === "(") {
      pos++;
      const inner = parseAlt();
      if (peek() === ")") pos++;
      else throw new Error("unclosed (");
      return inner;
    }
    if (c === ".") {
      pos++;
      return { kind: "any" };
    }
    if (c === "\\") {
      pos++;
      const escaped = peek();
      if (escaped === undefined) throw new Error("trailing backslash");
      pos++;
      return { kind: "char", ch: escaped };
    }
    if (c === undefined || c === ")" || c === "|") return { kind: "empty" };
    if (c === "*" || c === "+" || c === "?") throw new Error(`nothing to repeat at ${pos}`);
    pos++;
    return { kind: "char", ch: c };
  }

  const tree = parseAlt();
  if (!eof()) throw new Error(`unexpected '${peek()}' at ${pos}`);
  return tree;
}

/** An NFA edge. `symbol === null` is an epsilon (free) transition. */
export interface Edge {
  to: number;
  symbol: string | null;
  any?: boolean;
}

export interface NFA {
  start: number;
  accept: number;
  edges: Edge[][]; // edges[state] = outgoing edges
}

/** Thompson's construction: every node becomes a fragment with one entry and
 *  one exit, wired together with epsilon transitions. */
export function toNFA(tree: Node): NFA {
  const edges: Edge[][] = [];
  const newState = () => {
    edges.push([]);
    return edges.length - 1;
  };
  const link = (from: number, to: number, symbol: string | null, any = false) => {
    edges[from].push({ to, symbol, any });
  };

  function build(node: Node): { start: number; accept: number } {
    switch (node.kind) {
      case "empty": {
        const s = newState();
        const a = newState();
        link(s, a, null);
        return { start: s, accept: a };
      }
      case "char": {
        const s = newState();
        const a = newState();
        link(s, a, node.ch);
        return { start: s, accept: a };
      }
      case "any": {
        const s = newState();
        const a = newState();
        link(s, a, null, true);
        // Mark as a consuming "any" edge rather than an epsilon.
        edges[s][edges[s].length - 1] = { to: a, symbol: null, any: true };
        return { start: s, accept: a };
      }
      case "concat": {
        const l = build(node.left);
        const r = build(node.right);
        link(l.accept, r.start, null);
        return { start: l.start, accept: r.accept };
      }
      case "alt": {
        const s = newState();
        const a = newState();
        const l = build(node.left);
        const r = build(node.right);
        link(s, l.start, null);
        link(s, r.start, null);
        link(l.accept, a, null);
        link(r.accept, a, null);
        return { start: s, accept: a };
      }
      case "star": {
        const s = newState();
        const a = newState();
        const inner = build(node.node);
        link(s, inner.start, null);
        link(s, a, null); // skip entirely
        link(inner.accept, inner.start, null); // loop
        link(inner.accept, a, null);
        return { start: s, accept: a };
      }
      case "plus": {
        const inner = build(node.node);
        const a = newState();
        link(inner.accept, inner.start, null); // at least one pass, then loop
        link(inner.accept, a, null);
        return { start: inner.start, accept: a };
      }
      case "opt": {
        const s = newState();
        const a = newState();
        const inner = build(node.node);
        link(s, inner.start, null);
        link(s, a, null);
        link(inner.accept, a, null);
        return { start: s, accept: a };
      }
    }
  }

  const { start, accept } = build(tree);
  return { start, accept, edges };
}

/** All states reachable from `states` using only epsilon transitions. */
export function epsilonClosure(nfa: NFA, states: Iterable<number>): Set<number> {
  const out = new Set<number>(states);
  const stack = [...out];
  while (stack.length) {
    const s = stack.pop()!;
    for (const e of nfa.edges[s]) {
      if (e.symbol === null && !e.any && !out.has(e.to)) {
        out.add(e.to);
        stack.push(e.to);
      }
    }
  }
  return out;
}

export interface DFA {
  start: number;
  accepting: Set<number>;
  /** transitions[state] maps a symbol to a target; `any` is the fallback. */
  transitions: Map<string, number>[];
  anyTransition: (number | undefined)[];
  /** Which NFA states each DFA state represents, for display. */
  members: number[][];
}

/** Subset construction: each DFA state is a set of NFA states. */
export function toDFA(nfa: NFA, alphabet: string[]): DFA {
  const startSet = epsilonClosure(nfa, [nfa.start]);
  const key = (s: Set<number>) => [...s].sort((a, b) => a - b).join(",");

  const index = new Map<string, number>([[key(startSet), 0]]);
  const sets: Set<number>[] = [startSet];
  const transitions: Map<string, number>[] = [];
  const anyTransition: (number | undefined)[] = [];

  for (let i = 0; i < sets.length; i++) {
    const current = sets[i];
    const row = new Map<string, number>();

    const moveOn = (symbol: string | null): Set<number> => {
      const next = new Set<number>();
      for (const s of current) {
        for (const e of nfa.edges[s]) {
          if (e.any && symbol !== null) next.add(e.to);
          else if (e.symbol !== null && e.symbol === symbol) next.add(e.to);
        }
      }
      return next.size ? epsilonClosure(nfa, next) : next;
    };

    for (const sym of alphabet) {
      const target = moveOn(sym);
      if (target.size === 0) continue;
      const k = key(target);
      let id = index.get(k);
      if (id === undefined) {
        id = sets.length;
        index.set(k, id);
        sets.push(target);
      }
      row.set(sym, id);
    }

    // A transition for characters outside the sampled alphabet, via `.`.
    const anyTarget = (() => {
      const next = new Set<number>();
      for (const s of current) for (const e of nfa.edges[s]) if (e.any) next.add(e.to);
      return next.size ? epsilonClosure(nfa, next) : next;
    })();
    if (anyTarget.size > 0) {
      const k = key(anyTarget);
      let id = index.get(k);
      if (id === undefined) {
        id = sets.length;
        index.set(k, id);
        sets.push(anyTarget);
      }
      anyTransition[i] = id;
    } else {
      anyTransition[i] = undefined;
    }

    transitions[i] = row;
  }

  const accepting = new Set<number>();
  sets.forEach((s, i) => {
    if (s.has(nfa.accept)) accepting.add(i);
  });

  return {
    start: 0,
    accepting,
    transitions,
    anyTransition,
    members: sets.map((s) => [...s].sort((a, b) => a - b)),
  };
}

/** Characters that appear literally in the pattern — the DFA's alphabet. */
export function literalsOf(tree: Node, out = new Set<string>()): Set<string> {
  switch (tree.kind) {
    case "char":
      out.add(tree.ch);
      break;
    case "concat":
    case "alt":
      literalsOf(tree.left, out);
      literalsOf(tree.right, out);
      break;
    case "star":
    case "plus":
    case "opt":
      literalsOf(tree.node, out);
      break;
    default:
      break;
  }
  return out;
}

export interface RunStep {
  index: number; // character position consumed
  ch: string;
  from: number;
  to: number | null; // null = no transition, match dies here
}

/** Run the DFA over the input, recording each transition. */
export function run(dfa: DFA, input: string): { accepted: boolean; steps: RunStep[] } {
  const steps: RunStep[] = [];
  let state: number | null = dfa.start;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    const from = state as number;
    const explicit = dfa.transitions[from]?.get(ch);
    const next = explicit !== undefined ? explicit : dfa.anyTransition[from];
    steps.push({ index: i, ch, from, to: next ?? null });
    if (next === undefined) {
      state = null;
      break;
    }
    state = next;
  }
  return { accepted: state !== null && dfa.accepting.has(state), steps };
}

/** Compile a pattern and test a full-string match. */
export function matches(pattern: string, input: string): boolean {
  const tree = parse(pattern);
  const nfa = toNFA(tree);
  const alphabet = [...new Set([...literalsOf(tree), ...input])];
  const dfa = toDFA(nfa, alphabet);
  return run(dfa, input).accepted;
}
