/**
 * Tetris — pure game logic.
 *
 * Board: 10 cols × 20 rows, flat array (row-major).
 * Pieces: I O T S Z J L, each with 4 rotations.
 * Spawns at top-center; mines are placed on first reveal (no-op for Tetris).
 * Line clear, scoring (Tetris scoring table), level, and gravity speed.
 */

export type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";
export type Status = "playing" | "paused" | "over";

export const COLS = 10;
export const ROWS = 20;

// Relative [dr, dc] offsets for each piece and rotation (tight bounding box).
export const SHAPES: Record<PieceType, [number, number][][]> = {
  I: [
    [[0, 0], [0, 1], [0, 2], [0, 3]],
    [[0, 0], [1, 0], [2, 0], [3, 0]],
    [[0, 0], [0, 1], [0, 2], [0, 3]],
    [[0, 0], [1, 0], [2, 0], [3, 0]],
  ],
  O: [
    [[0, 0], [0, 1], [1, 0], [1, 1]],
    [[0, 0], [0, 1], [1, 0], [1, 1]],
    [[0, 0], [0, 1], [1, 0], [1, 1]],
    [[0, 0], [0, 1], [1, 0], [1, 1]],
  ],
  T: [
    [[0, 1], [1, 0], [1, 1], [1, 2]],
    [[0, 0], [1, 0], [1, 1], [2, 0]],
    [[1, 0], [1, 1], [1, 2], [2, 1]],
    [[0, 1], [1, 0], [1, 1], [2, 1]],
  ],
  S: [
    [[0, 1], [0, 2], [1, 0], [1, 1]],
    [[0, 0], [1, 0], [1, 1], [2, 1]],
    [[0, 1], [0, 2], [1, 0], [1, 1]],
    [[0, 0], [1, 0], [1, 1], [2, 1]],
  ],
  Z: [
    [[0, 0], [0, 1], [1, 1], [1, 2]],
    [[0, 1], [1, 0], [1, 1], [2, 0]],
    [[0, 0], [0, 1], [1, 1], [1, 2]],
    [[0, 1], [1, 0], [1, 1], [2, 0]],
  ],
  J: [
    [[0, 0], [1, 0], [1, 1], [1, 2]],
    [[0, 0], [0, 1], [1, 0], [2, 0]],
    [[1, 0], [1, 1], [1, 2], [2, 2]],
    [[0, 1], [1, 1], [2, 0], [2, 1]],
  ],
  L: [
    [[0, 2], [1, 0], [1, 1], [1, 2]],
    [[0, 0], [1, 0], [2, 0], [2, 1]],
    [[1, 0], [1, 1], [1, 2], [2, 0]],
    [[0, 0], [0, 1], [1, 1], [2, 1]],
  ],
};

const PIECE_TYPES: PieceType[] = ["I", "O", "T", "S", "Z", "J", "L"];

// Points per lines cleared × level.
const SCORE_TABLE = [0, 100, 300, 500, 800];

const SPAWN_COL = 3;

export const PIECE_COLORS: Record<PieceType, string> = {
  I: "bg-cyan-400",
  O: "bg-yellow-400",
  T: "bg-purple-400",
  S: "bg-green-400",
  Z: "bg-red-400",
  J: "bg-blue-400",
  L: "bg-orange-400",
};

export interface ActivePiece {
  type: PieceType;
  rotation: number;
  row: number;
  col: number;
}

export interface GameState {
  board: (PieceType | null)[];
  current: ActivePiece;
  next: PieceType;
  held: PieceType | null;
  canHold: boolean;
  score: number;
  lines: number;
  level: number;
  status: Status;
}

function randomPiece(random: () => number): PieceType {
  return PIECE_TYPES[Math.floor(random() * PIECE_TYPES.length)];
}

function spawnPiece(type: PieceType): ActivePiece {
  return { type, rotation: 0, row: 0, col: SPAWN_COL };
}

export function cellsOf(piece: ActivePiece): [number, number][] {
  return SHAPES[piece.type][piece.rotation].map(([dr, dc]) => [
    piece.row + dr,
    piece.col + dc,
  ]);
}

function isValid(board: (PieceType | null)[], piece: ActivePiece): boolean {
  for (const [r, c] of cellsOf(piece)) {
    if (c < 0 || c >= COLS || r >= ROWS) return false;
    if (r >= 0 && board[r * COLS + c] !== null) return false;
  }
  return true;
}

export function createGame(random: () => number = Math.random): GameState {
  return {
    board: Array<PieceType | null>(COLS * ROWS).fill(null),
    current: spawnPiece(randomPiece(random)),
    next: randomPiece(random),
    held: null,
    canHold: true,
    score: 0,
    lines: 0,
    level: 1,
    status: "playing",
  };
}

function lockAndClear(state: GameState): GameState {
  const board = [...state.board];
  for (const [r, c] of cellsOf(state.current)) {
    if (r >= 0) board[r * COLS + c] = state.current.type;
  }

  const kept: (PieceType | null)[] = [];
  let cleared = 0;
  for (let r = 0; r < ROWS; r++) {
    const row = board.slice(r * COLS, (r + 1) * COLS);
    if (row.every((cell) => cell !== null)) {
      cleared += 1;
    } else {
      kept.push(...row);
    }
  }
  const finalBoard: (PieceType | null)[] = [
    ...Array<PieceType | null>(cleared * COLS).fill(null),
    ...kept,
  ];

  const lines = state.lines + cleared;
  const level = Math.floor(lines / 10) + 1;
  const score = state.score + SCORE_TABLE[Math.min(cleared, 4)] * level;
  return { ...state, board: finalBoard, lines, level, score };
}

function spawnNext(state: GameState, random: () => number): GameState {
  const current = spawnPiece(state.next);
  const next = randomPiece(random);
  if (!isValid(state.board, current)) {
    return { ...state, current, next, status: "over", canHold: true };
  }
  return { ...state, current, next, canHold: true };
}

export function moveLeft(state: GameState): GameState {
  if (state.status !== "playing") return state;
  const moved = { ...state.current, col: state.current.col - 1 };
  return isValid(state.board, moved) ? { ...state, current: moved } : state;
}

export function moveRight(state: GameState): GameState {
  if (state.status !== "playing") return state;
  const moved = { ...state.current, col: state.current.col + 1 };
  return isValid(state.board, moved) ? { ...state, current: moved } : state;
}

export function rotateCW(state: GameState): GameState {
  if (state.status !== "playing") return state;
  const rotation = (state.current.rotation + 1) % 4;
  const rotated = { ...state.current, rotation };
  for (const dc of [0, 1, -1, 2, -2]) {
    const kicked = { ...rotated, col: rotated.col + dc };
    if (isValid(state.board, kicked)) return { ...state, current: kicked };
  }
  return state;
}

export function softDrop(state: GameState, random: () => number): GameState {
  if (state.status !== "playing") return state;
  const moved = { ...state.current, row: state.current.row + 1 };
  if (!isValid(state.board, moved)) {
    return spawnNext(lockAndClear(state), random);
  }
  return { ...state, current: moved, score: state.score + 1 };
}

export function hardDrop(state: GameState, random: () => number): GameState {
  if (state.status !== "playing") return state;
  let current = state.current;
  let dropped = 0;
  for (;;) {
    const moved = { ...current, row: current.row + 1 };
    if (!isValid(state.board, moved)) break;
    current = moved;
    dropped += 1;
  }
  const landed = { ...state, current, score: state.score + dropped * 2 };
  return spawnNext(lockAndClear(landed), random);
}

export function holdPiece(state: GameState, random: () => number): GameState {
  if (state.status !== "playing" || !state.canHold) return state;
  const newHeld = state.current.type;
  const nextType = state.held ?? state.next;
  const newNext = state.held !== null ? state.next : randomPiece(random);
  const newCurrent = spawnPiece(nextType);
  if (!isValid(state.board, newCurrent)) return { ...state, status: "over" };
  return { ...state, current: newCurrent, next: newNext, held: newHeld, canHold: false };
}

export function tick(state: GameState, random: () => number): GameState {
  return softDrop(state, random);
}

export function togglePause(state: GameState): GameState {
  if (state.status === "over") return state;
  return { ...state, status: state.status === "playing" ? "paused" : "playing" };
}

export function ghostPiece(state: GameState): ActivePiece {
  let current = state.current;
  for (;;) {
    const moved = { ...current, row: current.row + 1 };
    if (!isValid(state.board, moved)) break;
    current = moved;
  }
  return current;
}

export function gravityMs(level: number): number {
  return Math.max(50, 800 - (level - 1) * 75);
}
