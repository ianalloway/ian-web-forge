// A single-tape Turing machine with a two-way infinite tape.
//
// The tape is stored as a sparse Map keyed by (possibly negative) cell index,
// so it really is unbounded in both directions — cells default to the blank
// symbol and are only materialised once written or visited.

export type Direction = "L" | "R" | "N";

export interface Rule {
  state: string;
  read: string;
  write: string;
  move: Direction;
  next: string;
}

export interface Program {
  name: string;
  blurb: string;
  start: string;
  halt: string;
  blank: string;
  input: string;
  rules: Rule[];
}

export interface Snapshot {
  head: number;
  state: string;
  steps: number;
  halted: boolean;
  stuck: boolean; // no rule matched — halted without reaching the halt state
}

export class Machine {
  readonly program: Program;
  tape = new Map<number, string>();
  head = 0;
  state: string;
  steps = 0;
  halted = false;
  stuck = false;
  private index = new Map<string, Rule>();
  minSeen = 0;
  maxSeen = 0;

  constructor(program: Program) {
    this.program = program;
    this.state = program.start;
    for (const r of program.rules) this.index.set(`${r.state}|${r.read}`, r);
    this.loadInput(program.input);
  }

  private loadInput(input: string) {
    this.tape.clear();
    for (let i = 0; i < input.length; i++) this.tape.set(i, input[i]);
    this.head = 0;
    this.minSeen = 0;
    this.maxSeen = Math.max(0, input.length - 1);
    this.state = this.program.start;
    this.steps = 0;
    this.halted = false;
    this.stuck = false;
  }

  reset() {
    this.loadInput(this.program.input);
  }

  read(at = this.head): string {
    return this.tape.get(at) ?? this.program.blank;
  }

  /** Execute one transition. Returns the rule applied, or null if it stopped. */
  step(): Rule | null {
    if (this.halted || this.stuck) return null;
    if (this.state === this.program.halt) {
      this.halted = true;
      return null;
    }
    const rule = this.index.get(`${this.state}|${this.read()}`);
    if (!rule) {
      this.stuck = true;
      return null;
    }
    this.tape.set(this.head, rule.write);
    if (rule.move === "L") this.head--;
    else if (rule.move === "R") this.head++;
    this.state = rule.next;
    this.steps++;
    if (this.head < this.minSeen) this.minSeen = this.head;
    if (this.head > this.maxSeen) this.maxSeen = this.head;
    if (this.state === this.program.halt) this.halted = true;
    return rule;
  }

  /** Run until it halts or the step budget is exhausted. */
  run(maxSteps = 100000): Snapshot {
    while (!this.halted && !this.stuck && this.steps < maxSteps) this.step();
    return this.snapshot();
  }

  snapshot(): Snapshot {
    return {
      head: this.head,
      state: this.state,
      steps: this.steps,
      halted: this.halted,
      stuck: this.stuck,
    };
  }

  /** Non-blank contents, trimmed, as a plain string. */
  output(): string {
    let lo = Infinity;
    let hi = -Infinity;
    for (const [k, v] of this.tape) {
      if (v !== this.program.blank) {
        if (k < lo) lo = k;
        if (k > hi) hi = k;
      }
    }
    if (lo === Infinity) return "";
    let out = "";
    for (let i = lo; i <= hi; i++) out += this.read(i);
    return out;
  }

  /** Count of cells holding a given symbol — the score for busy beavers. */
  count(symbol: string): number {
    let n = 0;
    for (const v of this.tape.values()) if (v === symbol) n++;
    return n;
  }
}

const rule = (state: string, read: string, write: string, move: Direction, next: string): Rule => ({
  state,
  read,
  write,
  move,
  next,
});

export const PROGRAMS: Program[] = [
  {
    name: "binary increment",
    blurb: "adds one to a binary number by rippling carries from the right",
    start: "right",
    halt: "done",
    blank: "_",
    input: "1011",
    rules: [
      // Walk to the right end of the number.
      rule("right", "0", "0", "R", "right"),
      rule("right", "1", "1", "R", "right"),
      rule("right", "_", "_", "L", "carry"),
      // Ripple the carry leftwards.
      rule("carry", "1", "0", "L", "carry"),
      rule("carry", "0", "1", "N", "done"),
      rule("carry", "_", "1", "N", "done"),
    ],
  },
  {
    name: "unary doubler",
    blurb: "rewrites n tally marks as 2n — the classic copy-and-append trick",
    start: "scan",
    halt: "done",
    blank: "_",
    input: "111",
    rules: [
      // Mark the leftmost unprocessed 1, then append one Y at the far right.
      // Each original tally therefore ends up as itself plus one Y — 2n total
      // once cleanup turns every marker back into a tally.
      rule("scan", "1", "X", "R", "toEnd"),
      rule("scan", "Y", "Y", "R", "scan"),
      rule("scan", "_", "_", "L", "cleanup"),
      rule("toEnd", "1", "1", "R", "toEnd"),
      rule("toEnd", "Y", "Y", "R", "toEnd"),
      rule("toEnd", "_", "Y", "L", "back"),
      rule("back", "Y", "Y", "L", "back"),
      rule("back", "1", "1", "L", "back"),
      rule("back", "X", "X", "R", "scan"),
      // Turn every marker back into a tally.
      rule("cleanup", "Y", "1", "L", "cleanup"),
      rule("cleanup", "1", "1", "L", "cleanup"),
      rule("cleanup", "X", "1", "L", "cleanup"),
      rule("cleanup", "_", "_", "N", "done"),
    ],
  },
  {
    name: "busy beaver (3-state)",
    blurb: "the 3-state champion: halts having written six 1s — the most possible",
    start: "A",
    halt: "H",
    blank: "0",
    input: "",
    rules: [
      rule("A", "0", "1", "R", "B"),
      rule("A", "1", "1", "R", "H"),
      rule("B", "0", "0", "R", "C"),
      rule("B", "1", "1", "R", "B"),
      rule("C", "0", "1", "L", "C"),
      rule("C", "1", "1", "L", "A"),
    ],
  },
  {
    name: "busy beaver (4-state)",
    blurb: "the 4-state champion: 107 steps, thirteen 1s — then it stops, forever",
    start: "A",
    halt: "H",
    blank: "0",
    input: "",
    rules: [
      rule("A", "0", "1", "R", "B"),
      rule("A", "1", "1", "L", "B"),
      rule("B", "0", "1", "L", "A"),
      rule("B", "1", "0", "L", "C"),
      rule("C", "0", "1", "R", "H"),
      rule("C", "1", "1", "L", "D"),
      rule("D", "0", "1", "R", "D"),
      rule("D", "1", "0", "R", "A"),
    ],
  },
  {
    name: "palindrome check",
    blurb: "matches outer characters inward, writing Y or N for the verdict",
    start: "start",
    halt: "done",
    blank: "_",
    input: "abba",
    rules: [
      // Consume the leftmost letter, remember it, and look for its partner.
      rule("start", "a", "_", "R", "haveA"),
      rule("start", "b", "_", "R", "haveB"),
      rule("start", "_", "Y", "N", "done"),
      rule("haveA", "a", "a", "R", "haveA"),
      rule("haveA", "b", "b", "R", "haveA"),
      rule("haveA", "_", "_", "L", "matchA"),
      rule("haveB", "a", "a", "R", "haveB"),
      rule("haveB", "b", "b", "R", "haveB"),
      rule("haveB", "_", "_", "L", "matchB"),
      rule("matchA", "a", "_", "L", "rewind"),
      rule("matchA", "b", "b", "N", "reject"),
      rule("matchA", "_", "Y", "N", "done"),
      rule("matchB", "b", "_", "L", "rewind"),
      rule("matchB", "a", "a", "N", "reject"),
      rule("matchB", "_", "Y", "N", "done"),
      rule("rewind", "a", "a", "L", "rewind"),
      rule("rewind", "b", "b", "L", "rewind"),
      rule("rewind", "_", "_", "R", "start"),
      rule("reject", "a", "N", "N", "done"),
      rule("reject", "b", "N", "N", "done"),
    ],
  },
];
