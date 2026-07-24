// Sudoku: a backtracking solver instrumented for step-by-step visualization,
// plus a puzzle generator. Cells are a flat length-81 array; 0 means empty.

export type Grid = Int8Array;

/** Can `val` (1..9) legally go in cell `idx`, ignoring that cell's own value? */
export function canPlace(grid: Grid, idx: number, val: number): boolean {
  const r = (idx / 9) | 0;
  const c = idx % 9;
  for (let k = 0; k < 9; k++) {
    if (grid[r * 9 + k] === val) return false;
    if (grid[k * 9 + c] === val) return false;
  }
  const br = r - (r % 3);
  const bc = c - (c % 3);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (grid[(br + i) * 9 + (bc + j)] === val) return false;
    }
  }
  return true;
}

/** True if a filled grid satisfies every row/column/box constraint. */
export function isSolved(grid: Grid): boolean {
  for (let i = 0; i < 81; i++) {
    const v = grid[i];
    if (v < 1 || v > 9) return false;
    grid[i] = 0;
    const ok = canPlace(grid, i, v);
    grid[i] = v;
    if (!ok) return false;
  }
  return true;
}

/** Recursive solver used for generation; fills `grid` in place. */
function solveInPlace(grid: Grid, order: number[]): boolean {
  let idx = -1;
  for (let i = 0; i < 81; i++) {
    if (grid[i] === 0) {
      idx = i;
      break;
    }
  }
  if (idx === -1) return true;
  for (const v of order) {
    if (canPlace(grid, idx, v)) {
      grid[idx] = v;
      if (solveInPlace(grid, order)) return true;
      grid[idx] = 0;
    }
  }
  return false;
}

function shuffled(rng: () => number): number[] {
  const a = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = a.length - 1; i > 0; i--) {
    const j = (rng() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** A fully solved, randomized grid. */
export function solvedGrid(rng: () => number = Math.random): Grid {
  const g = new Int8Array(81);
  solveInPlace(g, shuffled(rng));
  return g;
}

/**
 * Generate a puzzle by digging `holes` cells out of a random solution. The
 * puzzle is always solvable (the original solution works); uniqueness isn't
 * enforced. Returns the puzzle and one valid solution.
 */
export function generate(holes: number, rng: () => number = Math.random): { puzzle: Grid; solution: Grid } {
  const solution = solvedGrid(rng);
  const puzzle = solution.slice();
  const cells = Array.from({ length: 81 }, (_, i) => i);
  for (let i = cells.length - 1; i > 0; i--) {
    const j = (rng() * (i + 1)) | 0;
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  for (let k = 0; k < holes && k < 81; k++) puzzle[cells[k]] = 0;
  return { puzzle, solution };
}

export type StepResult = "place" | "backtrack" | "done" | "fail";

/**
 * Iterative backtracking solver that advances one decision per `step()` call,
 * so a UI can animate the search (including backtracks). Given cells are fixed.
 */
export class SudokuSolver {
  grid: Grid;
  readonly given: Uint8Array;
  private empties: number[];
  private ptr = 0;
  cursor = -1; // cell touched by the most recent step
  done = false;
  failed = false;
  steps = 0;
  backtracks = 0;

  constructor(puzzle: Grid) {
    this.grid = puzzle.slice();
    this.given = new Uint8Array(81);
    this.empties = [];
    for (let i = 0; i < 81; i++) {
      if (puzzle[i] !== 0) this.given[i] = 1;
      else this.empties.push(i);
    }
  }

  step(): StepResult {
    if (this.done) return "done";
    if (this.failed) return "fail";
    this.steps++;
    if (this.ptr >= this.empties.length) {
      this.done = true;
      return "done";
    }
    const cell = this.empties[this.ptr];
    this.cursor = cell;
    let v = this.grid[cell] + 1;
    while (v <= 9 && !canPlace(this.grid, cell, v)) v++;
    if (v <= 9) {
      this.grid[cell] = v;
      this.ptr++;
      if (this.ptr >= this.empties.length) this.done = true;
      return this.done ? "done" : "place";
    }
    // No value works here: reset and step back.
    this.grid[cell] = 0;
    this.ptr--;
    this.backtracks++;
    if (this.ptr < 0) {
      this.failed = true;
      return "fail";
    }
    this.cursor = this.empties[this.ptr];
    return "backtrack";
  }
}
