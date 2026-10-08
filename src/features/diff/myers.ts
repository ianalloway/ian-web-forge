// Myers diff: the algorithm behind `git diff`.
//
// Turning one file into another is a path-finding problem. Lay the old file
// along the x axis and the new one along y: moving right deletes a line, moving
// down inserts one, and moving diagonally keeps a line that both files share
// and costs nothing. The best diff is the path from the top-left to the
// bottom-right with the fewest non-diagonal moves.
//
// Myers walks the graph in order of edit distance: first every square reachable
// with 0 edits, then 1, then 2, following every free diagonal ("snake") as far
// as it goes before spending another edit. The first time a wavefront reaches
// the far corner, that edit count is minimal, and the path back through the
// recorded wavefronts is the diff. It costs O((N+M)·D) — fast precisely because
// D, the number of changes, is small for the edits people actually make.
//
// The practical difference from a Levenshtein table (see /editdistance) is that
// this never fills an N×M grid. It only explores the diagonals it needs.

export type OpKind = "keep" | "insert" | "delete";

export interface Op {
  kind: OpKind;
  text: string;
  oldIndex: number; // -1 for an insert
  newIndex: number; // -1 for a delete
}

export interface Point {
  x: number;
  y: number;
}

export interface Diff {
  ops: Op[];
  editCount: number; // inserts + deletes, which Myers makes minimal
  path: Point[]; // the route through the edit graph, for drawing
  trace: number[][]; // the wavefront after each edit, also for drawing
}

// The greedy forward pass. `trace[d]` is the furthest-reaching x on each
// diagonal k after d edits, which is everything the backtrack needs.
function forwardPass(a: string[], b: string[]): number[][] {
  const n = a.length;
  const m = b.length;
  const max = n + m;
  const offset = max;
  const v = new Array(2 * max + 1).fill(0);
  const trace: number[][] = [];

  for (let d = 0; d <= max; d++) {
    trace.push(v.slice());
    for (let k = -d; k <= d; k += 2) {
      // Step down from the diagonal above, or right from the one below —
      // whichever has already reached further.
      let x: number;
      if (k === -d || (k !== d && v[k - 1 + offset] < v[k + 1 + offset])) {
        x = v[k + 1 + offset]; // moving down: an insert
      } else {
        x = v[k - 1 + offset] + 1; // moving right: a delete
      }
      let y = x - k;
      // Free diagonal: run it as far as the files agree.
      while (x < n && y < m && a[x] === b[y]) {
        x++;
        y++;
      }
      v[k + offset] = x;
      if (x >= n && y >= m) return trace;
    }
  }
  return trace;
}

export function diff(a: string[], b: string[]): Diff {
  const n = a.length;
  const m = b.length;
  const trace = forwardPass(a, b);
  const offset = n + m;

  const ops: Op[] = [];
  const path: Point[] = [];
  let x = n;
  let y = m;

  for (let d = trace.length - 1; d >= 0; d--) {
    const v = trace[d];
    const k = x - y;
    const prevK =
      k === -d || (k !== d && v[k - 1 + offset] < v[k + 1 + offset]) ? k + 1 : k - 1;
    const prevX = d === 0 ? 0 : v[prevK + offset];
    const prevY = prevX - prevK;

    // Walk back down the snake first: those are the lines both files share.
    while (x > prevX && y > prevY) {
      ops.push({ kind: "keep", text: a[x - 1], oldIndex: x - 1, newIndex: y - 1 });
      path.push({ x, y });
      x--;
      y--;
    }

    if (d > 0) {
      if (x === prevX) {
        ops.push({ kind: "insert", text: b[prevY], oldIndex: -1, newIndex: prevY });
      } else {
        ops.push({ kind: "delete", text: a[prevX], oldIndex: prevX, newIndex: -1 });
      }
      path.push({ x, y });
      x = prevX;
      y = prevY;
    }
  }
  path.push({ x: 0, y: 0 });

  ops.reverse();
  path.reverse();
  const editCount = ops.filter((op) => op.kind !== "keep").length;
  return { ops, editCount, path, trace };
}

// Replaying the script onto the old text must reproduce the new text exactly.
// It is the only check that matters for a diff.
export function apply(a: string[], ops: Op[]): string[] {
  const out: string[] = [];
  let cursor = 0;
  for (const op of ops) {
    if (op.kind === "keep") {
      out.push(a[cursor]);
      cursor++;
    } else if (op.kind === "delete") {
      cursor++;
    } else {
      out.push(op.text);
    }
  }
  return out;
}

// The same minimum, computed the slow way, to check Myers against. This is the
// O(N·M) table Myers is avoiding.
export function minimumEdits(a: string[], b: string[]): number {
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      // No substitution: a diff only inserts and deletes.
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[n][m];
}

export function stats(d: Diff): { kept: number; inserted: number; deleted: number } {
  return {
    kept: d.ops.filter((o) => o.kind === "keep").length,
    inserted: d.ops.filter((o) => o.kind === "insert").length,
    deleted: d.ops.filter((o) => o.kind === "delete").length,
  };
}

export interface Sample {
  id: string;
  label: string;
  note: string;
  before: string[];
  after: string[];
}

const lines = (s: string) => s.trim().split("\n");

export const SAMPLES: Sample[] = [
  {
    id: "edit",
    label: "small edit",
    note: "two lines changed in the middle — the diagonal runs almost the whole way",
    before: lines(`function total(items) {
  let sum = 0;
  for (const item of items) {
    sum += item.price;
  }
  return sum;
}`),
    after: lines(`function total(items) {
  let sum = 0;
  for (const item of items) {
    sum += item.price * item.quantity;
  }
  return Math.round(sum);
}`),
  },
  {
    id: "move",
    label: "moved block",
    note: "a block relocated — a line diff sees a delete and an insert, not a move",
    before: lines(`import react
import router
setup()
render()
cleanup()`),
    after: lines(`import react
import router
render()
cleanup()
setup()`),
  },
  {
    id: "rewrite",
    label: "rewrite",
    note: "nothing in common — the path is all edits and no free diagonal",
    before: lines(`alpha
bravo
charlie`),
    after: lines(`one
two
three
four`),
  },
  {
    id: "insert",
    label: "pure insert",
    note: "lines added and nothing removed — the path goes straight down, then across",
    before: lines(`header
body
footer`),
    after: lines(`header
nav
sidebar
body
footer`),
  },
  {
    id: "same",
    label: "identical",
    note: "zero edits: one diagonal from corner to corner, which is the best case",
    before: lines(`one
two
three`),
    after: lines(`one
two
three`),
  },
];
