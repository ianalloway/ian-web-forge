/**
 * Minesweeper — pure game logic.
 *
 * Same shape as the other feature modules: framework-free, immutable
 * board transforms, injectable RNG. The React page in pages/Minesweeper.tsx
 * owns input, the timer, and rendering.
 *
 * Mines are placed on the first reveal (excluding the clicked cell and its
 * neighbours) so the opening click is always safe and usually opens an area.
 * Revealing an empty (0-adjacent) cell flood-fills outward.
 */

export type Difficulty = "beginner" | "intermediate" | "expert";
export type Status = "ready" | "playing" | "won" | "lost";

export interface DifficultyConfig {
  cols: number;
  rows: number;
  mines: number;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  beginner: { cols: 9, rows: 9, mines: 10 },
  intermediate: { cols: 16, rows: 16, mines: 40 },
  expert: { cols: 16, rows: 30, mines: 99 },
};

export interface Cell {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  /** Number of mines in the 8 surrounding cells. */
  adjacent: number;
}

export interface Board {
  cols: number;
  rows: number;
  mines: number;
  cells: Cell[];
  status: Status;
}

function makeCell(): Cell {
  return { mine: false, revealed: false, flagged: false, adjacent: 0 };
}

export function createGame(difficulty: Difficulty = "beginner"): Board {
  const { cols, rows, mines } = DIFFICULTIES[difficulty];
  return {
    cols,
    rows,
    mines,
    cells: Array.from({ length: cols * rows }, makeCell),
    status: "ready",
  };
}

export function neighbors(board: Pick<Board, "cols" | "rows">, index: number): number[] {
  const { cols, rows } = board;
  const x = index % cols;
  const y = Math.floor(index / cols);
  const result: number[] = [];

  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) {
        continue;
      }
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
        result.push(ny * cols + nx);
      }
    }
  }
  return result;
}

function cloneCells(cells: Cell[]): Cell[] {
  return cells.map((cell) => ({ ...cell }));
}

/**
 * Place mines avoiding `safeIndex` and its neighbours, then compute the
 * adjacency counts. Mutates the provided cells array in place.
 */
function placeMines(
  board: Board,
  cells: Cell[],
  safeIndex: number,
  random: () => number,
): void {
  const excluded = new Set<number>([safeIndex, ...neighbors(board, safeIndex)]);
  const candidates: number[] = [];
  for (let i = 0; i < cells.length; i += 1) {
    if (!excluded.has(i)) {
      candidates.push(i);
    }
  }

  // Fisher–Yates partial shuffle to pick `mines` distinct cells.
  const mineCount = Math.min(board.mines, candidates.length);
  for (let i = 0; i < mineCount; i += 1) {
    const j = i + Math.floor(random() * (candidates.length - i));
    const tmp = candidates[i];
    candidates[i] = candidates[j];
    candidates[j] = tmp;
    cells[candidates[i]].mine = true;
  }

  for (let i = 0; i < cells.length; i += 1) {
    if (!cells[i].mine) {
      cells[i].adjacent = neighbors(board, i).filter((n) => cells[n].mine).length;
    }
  }
}

function countRevealedNonMines(cells: Cell[]): number {
  let count = 0;
  for (const cell of cells) {
    if (cell.revealed && !cell.mine) {
      count += 1;
    }
  }
  return count;
}

function isWin(board: Board, cells: Cell[]): boolean {
  const safeCells = cells.length - board.mines;
  return countRevealedNonMines(cells) === safeCells;
}

/** Reveal a cell. Handles first-click mine placement and flood fill. */
export function reveal(board: Board, index: number, random: () => number = Math.random): Board {
  if (board.status === "won" || board.status === "lost") {
    return board;
  }

  const target = board.cells[index];
  if (target.revealed || target.flagged) {
    return board;
  }

  const cells = cloneCells(board.cells);

  if (board.status === "ready") {
    placeMines(board, cells, index, random);
  }

  if (cells[index].mine) {
    for (const cell of cells) {
      if (cell.mine) {
        cell.revealed = true;
      }
    }
    return { ...board, cells, status: "lost" };
  }

  // Flood-fill from the clicked cell, opening empty regions.
  const stack = [index];
  while (stack.length > 0) {
    const current = stack.pop() as number;
    const cell = cells[current];
    if (cell.revealed || cell.flagged || cell.mine) {
      continue;
    }
    cell.revealed = true;
    if (cell.adjacent === 0) {
      for (const n of neighbors(board, current)) {
        if (!cells[n].revealed && !cells[n].flagged) {
          stack.push(n);
        }
      }
    }
  }

  const status: Status = isWin(board, cells) ? "won" : "playing";
  return { ...board, cells, status };
}

export function toggleFlag(board: Board, index: number): Board {
  if (board.status === "won" || board.status === "lost") {
    return board;
  }
  const target = board.cells[index];
  if (target.revealed) {
    return board;
  }
  const cells = cloneCells(board.cells);
  cells[index].flagged = !cells[index].flagged;
  const status: Status = board.status === "ready" ? "ready" : board.status;
  return { ...board, cells, status };
}

export function flagCount(board: Board): number {
  let count = 0;
  for (const cell of board.cells) {
    if (cell.flagged) {
      count += 1;
    }
  }
  return count;
}

/** Mines minus flags placed — can go negative if over-flagged. */
export function minesRemaining(board: Board): number {
  return board.mines - flagCount(board);
}
