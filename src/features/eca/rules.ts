/**
 * Elementary cellular automata (Wolfram). A rule is a number 0-255 whose
 * bits map each of the 8 three-cell neighborhoods to the next cell state.
 */

export function ruleToTable(rule: number): Uint8Array {
  // table[neighborhood] = next state; neighborhood is (left<<2)|(center<<1)|right
  const t = new Uint8Array(8);
  for (let i = 0; i < 8; i++) t[i] = (rule >> i) & 1;
  return t;
}

/** Advance one generation with the given rule table. Wraps at edges. */
export function nextRow(row: Uint8Array, table: Uint8Array): Uint8Array {
  const n = row.length;
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const l = row[(i - 1 + n) % n];
    const c = row[i];
    const r = row[(i + 1) % n];
    out[i] = table[(l << 2) | (c << 1) | r];
  }
  return out;
}

export type SeedMode = "single" | "random";

export function seedRow(width: number, mode: SeedMode): Uint8Array {
  const row = new Uint8Array(width);
  if (mode === "single") {
    row[width >> 1] = 1;
  } else {
    for (let i = 0; i < width; i++) row[i] = Math.random() < 0.5 ? 1 : 0;
  }
  return row;
}

// A few famously interesting rules to feature as quick picks
export const NOTABLE_RULES = [30, 54, 60, 90, 110, 150, 184, 250];

export const RULE_NOTES: Record<number, string> = {
  30: "chaotic — used as a random generator",
  54: "complex, class 4",
  60: "Sierpiński (Pascal mod 2)",
  90: "Sierpiński triangle, XOR rule",
  110: "Turing-complete",
  150: "additive XOR of all three",
  184: "traffic / majority flow",
  250: "simple alternating fill",
};
