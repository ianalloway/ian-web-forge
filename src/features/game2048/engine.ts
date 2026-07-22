export type Board = number[]; // 16 cells, row-major, 0 = empty
export type Dir = "left" | "right" | "up" | "down";

export interface MoveResult {
  board: Board;
  gained: number;
  moved: boolean;
}

export function emptyBoard(): Board {
  return new Array<number>(16).fill(0);
}

export function spawnTile(board: Board): Board {
  const empties: number[] = [];
  board.forEach((v, i) => { if (v === 0) empties.push(i); });
  if (empties.length === 0) return board;
  const next = [...board];
  const idx = empties[Math.floor(Math.random() * empties.length)];
  next[idx] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

export function newBoard(): Board {
  return spawnTile(spawnTile(emptyBoard()));
}

/** Slide+merge one row toward index 0. Returns new row and score gained. */
function slideRow(row: number[]): { row: number[]; gained: number } {
  const vals = row.filter((v) => v !== 0);
  const out: number[] = [];
  let gained = 0;
  for (let i = 0; i < vals.length; i++) {
    if (i + 1 < vals.length && vals[i] === vals[i + 1]) {
      const merged = vals[i] * 2;
      out.push(merged);
      gained += merged;
      i++; // consume both tiles — a tile merges at most once per move
    } else {
      out.push(vals[i]);
    }
  }
  while (out.length < 4) out.push(0);
  return { row: out, gained };
}

function getRow(board: Board, r: number, dir: Dir): number[] {
  const row: number[] = [];
  for (let i = 0; i < 4; i++) {
    switch (dir) {
      case "left": row.push(board[r * 4 + i]); break;
      case "right": row.push(board[r * 4 + (3 - i)]); break;
      case "up": row.push(board[i * 4 + r]); break;
      case "down": row.push(board[(3 - i) * 4 + r]); break;
    }
  }
  return row;
}

function setRow(board: Board, r: number, dir: Dir, row: number[]): void {
  for (let i = 0; i < 4; i++) {
    switch (dir) {
      case "left": board[r * 4 + i] = row[i]; break;
      case "right": board[r * 4 + (3 - i)] = row[i]; break;
      case "up": board[i * 4 + r] = row[i]; break;
      case "down": board[(3 - i) * 4 + r] = row[i]; break;
    }
  }
}

export function move(board: Board, dir: Dir): MoveResult {
  const next = [...board];
  let gained = 0;
  for (let r = 0; r < 4; r++) {
    const row = getRow(board, r, dir);
    const res = slideRow(row);
    gained += res.gained;
    setRow(next, r, dir, res.row);
  }
  const moved = next.some((v, i) => v !== board[i]);
  return { board: next, gained, moved };
}

export function canMove(board: Board): boolean {
  if (board.includes(0)) return true;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const v = board[r * 4 + c];
      if (c < 3 && board[r * 4 + c + 1] === v) return true;
      if (r < 3 && board[(r + 1) * 4 + c] === v) return true;
    }
  }
  return false;
}

export function hasWon(board: Board): boolean {
  return board.some((v) => v >= 2048);
}

const BEST_KEY = "2048-best";

export function loadBest(): number {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function saveBest(score: number): void {
  try {
    localStorage.setItem(BEST_KEY, String(score));
  } catch {
    // storage unavailable — ignore
  }
}

/** Terminal-green tile styling by value. */
export function tileClasses(v: number): string {
  if (v === 0) return "bg-primary/5 text-transparent";
  if (v <= 4) return "bg-primary/10 text-primary/70";
  if (v <= 16) return "bg-primary/20 text-primary/80";
  if (v <= 64) return "bg-primary/30 text-primary";
  if (v <= 256) return "bg-primary/50 text-black";
  if (v <= 1024) return "bg-primary/70 text-black";
  return "bg-primary text-black";
}
