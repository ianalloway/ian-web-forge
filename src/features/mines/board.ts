export interface Cell {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacent: number;
}

export interface MinesBoard {
  cols: number;
  rows: number;
  mineCount: number;
  cells: Cell[];
  minesPlaced: boolean; // mines placed lazily on first reveal
}

export type DifficultyId = "easy" | "medium" | "hard";

export const DIFFICULTIES: Record<DifficultyId, { label: string; cols: number; rows: number; mines: number }> = {
  easy: { label: "9×9 · 10", cols: 9, rows: 9, mines: 10 },
  medium: { label: "16×16 · 40", cols: 16, rows: 16, mines: 40 },
  hard: { label: "24×16 · 72", cols: 24, rows: 16, mines: 72 },
};

export function newMinesBoard(d: DifficultyId): MinesBoard {
  const { cols, rows, mines } = DIFFICULTIES[d];
  return {
    cols,
    rows,
    mineCount: mines,
    minesPlaced: false,
    cells: Array.from({ length: cols * rows }, () => ({
      mine: false,
      revealed: false,
      flagged: false,
      adjacent: 0,
    })),
  };
}

function neighborsOf(board: MinesBoard, idx: number): number[] {
  const { cols, rows } = board;
  const x = idx % cols;
  const y = Math.floor(idx / cols);
  const out: number[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < cols && ny < rows) out.push(ny * cols + nx);
    }
  }
  return out;
}

/** Place mines avoiding the first-clicked cell and its neighbors. */
function placeMines(board: MinesBoard, safeIdx: number): void {
  const forbidden = new Set([safeIdx, ...neighborsOf(board, safeIdx)]);
  const candidates: number[] = [];
  for (let i = 0; i < board.cells.length; i++) {
    if (!forbidden.has(i)) candidates.push(i);
  }
  // Fisher-Yates partial shuffle for the first mineCount picks
  const mines = Math.min(board.mineCount, candidates.length);
  for (let i = 0; i < mines; i++) {
    const j = i + Math.floor(Math.random() * (candidates.length - i));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    board.cells[candidates[i]].mine = true;
  }
  for (let i = 0; i < board.cells.length; i++) {
    board.cells[i].adjacent = neighborsOf(board, i).filter((n) => board.cells[n].mine).length;
  }
  board.minesPlaced = true;
}

export type RevealOutcome = "ok" | "boom" | "noop";

/** Reveal a cell (placing mines lazily on the first reveal). Flood-fills zeros. */
export function reveal(board: MinesBoard, idx: number): RevealOutcome {
  const cell = board.cells[idx];
  if (cell.revealed || cell.flagged) return "noop";
  if (!board.minesPlaced) placeMines(board, idx);

  if (board.cells[idx].mine) {
    board.cells[idx].revealed = true;
    return "boom";
  }

  // Iterative flood fill from the clicked cell across zero-adjacent regions
  const stack = [idx];
  while (stack.length > 0) {
    const i = stack.pop()!;
    const c = board.cells[i];
    if (c.revealed || c.flagged || c.mine) continue;
    c.revealed = true;
    if (c.adjacent === 0) {
      for (const n of neighborsOf(board, i)) {
        if (!board.cells[n].revealed) stack.push(n);
      }
    }
  }
  return "ok";
}

/** Chord: if a revealed number has exactly that many flags around it, reveal the rest. */
export function chord(board: MinesBoard, idx: number): RevealOutcome {
  const cell = board.cells[idx];
  if (!cell.revealed || cell.adjacent === 0) return "noop";
  const ns = neighborsOf(board, idx);
  const flags = ns.filter((n) => board.cells[n].flagged).length;
  if (flags !== cell.adjacent) return "noop";
  let outcome: RevealOutcome = "noop";
  for (const n of ns) {
    const c = board.cells[n];
    if (c.revealed || c.flagged) continue;
    const r = reveal(board, n);
    if (r === "boom") return "boom";
    if (r === "ok") outcome = "ok";
  }
  return outcome;
}

export function toggleFlag(board: MinesBoard, idx: number): void {
  const cell = board.cells[idx];
  if (cell.revealed) return;
  cell.flagged = !cell.flagged;
}

export function flagsUsed(board: MinesBoard): number {
  return board.cells.filter((c) => c.flagged).length;
}

export function isWon(board: MinesBoard): boolean {
  if (!board.minesPlaced) return false;
  return board.cells.every((c) => c.mine || c.revealed);
}

/** Reveal all mines (on loss). */
export function revealMines(board: MinesBoard): void {
  for (const c of board.cells) {
    if (c.mine) c.revealed = true;
  }
}
