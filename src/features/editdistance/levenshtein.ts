// Levenshtein edit distance by the Wagner-Fischer dynamic program.
//
// Cell (i, j) holds the cost of turning the first i characters of `a` into the
// first j characters of `b`. Every cell is one of three neighbours plus a cost,
// so the whole table is filled bottom-up and the cheapest edit script is read
// back by walking from the corner to the origin.

export type Op = "match" | "substitute" | "insert" | "delete";

export interface Cell {
  cost: number;
  from: Op | null; // which neighbour this cell was cheapest from
}

export interface Table {
  a: string;
  b: string;
  rows: number; // a.length + 1
  cols: number; // b.length + 1
  cells: Cell[]; // row-major, rows × cols
  distance: number;
}

export interface Step {
  op: Op;
  i: number; // index into a (1-based end of prefix)
  j: number; // index into b
  aChar: string;
  bChar: string;
}

/** Fill the full DP table, recording the choice made in each cell. */
export function buildTable(a: string, b: string): Table {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const cells: Cell[] = new Array(rows * cols);
  const at = (i: number, j: number) => i * cols + j;

  cells[0] = { cost: 0, from: null };
  for (let j = 1; j < cols; j++) cells[at(0, j)] = { cost: j, from: "insert" };
  for (let i = 1; i < rows; i++) cells[at(i, 0)] = { cost: i, from: "delete" };

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const same = a[i - 1] === b[j - 1];
      const diagonal = cells[at(i - 1, j - 1)].cost + (same ? 0 : 1);
      const up = cells[at(i - 1, j)].cost + 1; // delete from a
      const left = cells[at(i, j - 1)].cost + 1; // insert from b

      let cost = diagonal;
      let from: Op = same ? "match" : "substitute";
      if (up < cost) {
        cost = up;
        from = "delete";
      }
      if (left < cost) {
        cost = left;
        from = "insert";
      }
      cells[at(i, j)] = { cost, from };
    }
  }

  return { a, b, rows, cols, cells, distance: cells[at(rows - 1, cols - 1)].cost };
}

/** Walk the recorded choices back from the corner to recover an edit script. */
export function traceback(table: Table): Step[] {
  const { a, b, cols, cells } = table;
  const at = (i: number, j: number) => i * cols + j;
  const steps: Step[] = [];
  let i = table.rows - 1;
  let j = cols - 1;

  while (i > 0 || j > 0) {
    const from = cells[at(i, j)].from;
    if (from === "match" || from === "substitute") {
      steps.push({ op: from, i, j, aChar: a[i - 1], bChar: b[j - 1] });
      i--;
      j--;
    } else if (from === "delete") {
      steps.push({ op: "delete", i, j, aChar: a[i - 1], bChar: "" });
      i--;
    } else {
      steps.push({ op: "insert", i, j, aChar: "", bChar: b[j - 1] });
      j--;
    }
  }
  return steps.reverse();
}

/** The (i, j) coordinates the traceback passes through, for highlighting. */
export function tracebackPath(table: Table): [number, number][] {
  const { cols, cells } = table;
  const at = (i: number, j: number) => i * cols + j;
  const path: [number, number][] = [];
  let i = table.rows - 1;
  let j = cols - 1;
  path.push([i, j]);
  while (i > 0 || j > 0) {
    const from = cells[at(i, j)].from;
    if (from === "match" || from === "substitute") {
      i--;
      j--;
    } else if (from === "delete") i--;
    else j--;
    path.push([i, j]);
  }
  return path.reverse();
}

/** Apply an edit script to `a`; should reproduce `b`. */
export function applyScript(a: string, steps: Step[]): string {
  let out = "";
  for (const s of steps) {
    if (s.op === "match" || s.op === "substitute") out += s.bChar;
    else if (s.op === "insert") out += s.bChar;
    // delete contributes nothing
  }
  return out;
}

export const distance = (a: string, b: string): number => buildTable(a, b).distance;
