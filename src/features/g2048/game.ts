/**
 * 2048 — pure game logic.
 *
 * Same shape as the snake/life/typing modules: framework-free, immutable
 * state, injectable RNG for deterministic tests. The React page in
 * pages/Game2048.tsx owns input, animation, and the persisted best score.
 *
 * The board is a flat length-16 array (4x4), row-major: cell (r, c) lives
 * at index r * SIZE + c. 0 means empty.
 */

export const SIZE = 4;
export const WINNING_TILE = 2048;

export type Direction = "up" | "down" | "left" | "right";
export type GameStatus = "playing" | "won" | "lost";

export interface GameState {
  board: number[];
  score: number;
  status: GameStatus;
  /** Latched true once 2048 is reached (so "keep playing" still shows it). */
  reached2048: boolean;
}

function emptyBoard(): number[] {
  return new Array<number>(SIZE * SIZE).fill(0);
}

export function emptyCells(board: number[]): number[] {
  const cells: number[] = [];
  for (let i = 0; i < board.length; i += 1) {
    if (board[i] === 0) {
      cells.push(i);
    }
  }
  return cells;
}

/** Place a 2 (90%) or 4 (10%) on a random empty cell. Returns a new board. */
export function spawnTile(board: number[], random: () => number = Math.random): number[] {
  const cells = emptyCells(board);
  if (cells.length === 0) {
    return board;
  }
  const next = board.slice();
  const cell = cells[Math.floor(random() * cells.length) % cells.length];
  next[cell] = random() < 0.9 ? 2 : 4;
  return next;
}

export function createGame(random: () => number = Math.random): GameState {
  let board = spawnTile(emptyBoard(), random);
  board = spawnTile(board, random);
  return { board, score: 0, status: "playing", reached2048: false };
}

/**
 * The four board indices that make up "line i" for a given direction,
 * ordered from the edge the tiles slide toward.
 */
function lineIndices(direction: Direction, i: number): number[] {
  const indices: number[] = [];
  for (let j = 0; j < SIZE; j += 1) {
    let r: number;
    let c: number;
    switch (direction) {
      case "left":
        r = i;
        c = j;
        break;
      case "right":
        r = i;
        c = SIZE - 1 - j;
        break;
      case "up":
        r = j;
        c = i;
        break;
      case "down":
        r = SIZE - 1 - j;
        c = i;
        break;
    }
    indices.push(r * SIZE + c);
  }
  return indices;
}

/** Slide + merge one line toward index 0. Returns the new line and points gained. */
export function slideLine(values: number[]): { line: number[]; gained: number } {
  const nonzero = values.filter((value) => value !== 0);
  const line: number[] = [];
  let gained = 0;

  for (let i = 0; i < nonzero.length; i += 1) {
    if (i + 1 < nonzero.length && nonzero[i] === nonzero[i + 1]) {
      const merged = nonzero[i] * 2;
      line.push(merged);
      gained += merged;
      i += 1; // consume the partner tile
    } else {
      line.push(nonzero[i]);
    }
  }

  while (line.length < SIZE) {
    line.push(0);
  }

  return { line, gained };
}

/** Apply a slide in a direction without spawning. Pure board transform. */
export function move(
  board: number[],
  direction: Direction,
): { board: number[]; moved: boolean; gained: number } {
  const next = board.slice();
  let moved = false;
  let gained = 0;

  for (let i = 0; i < SIZE; i += 1) {
    const indices = lineIndices(direction, i);
    const values = indices.map((index) => board[index]);
    const { line, gained: lineGained } = slideLine(values);
    gained += lineGained;
    for (let k = 0; k < SIZE; k += 1) {
      if (next[indices[k]] !== line[k]) {
        moved = true;
      }
      next[indices[k]] = line[k];
    }
  }

  return { board: next, moved, gained };
}

export function hasWon(board: number[]): boolean {
  return board.some((value) => value >= WINNING_TILE);
}

/** True if any slide in any direction would change the board. */
export function canMove(board: number[]): boolean {
  if (emptyCells(board).length > 0) {
    return true;
  }
  const directions: Direction[] = ["up", "down", "left", "right"];
  return directions.some((direction) => move(board, direction).moved);
}

/**
 * Advance the game by one move. If the move changes nothing, the same
 * state is returned (so no tile spawns on a no-op). Otherwise a tile
 * spawns and status is recomputed.
 */
export function applyMove(
  state: GameState,
  direction: Direction,
  random: () => number = Math.random,
): GameState {
  if (state.status === "lost") {
    return state;
  }

  const { board, moved, gained } = move(state.board, direction);
  if (!moved) {
    return state;
  }

  const spawned = spawnTile(board, random);
  const reached2048 = state.reached2048 || hasWon(spawned);
  let status: GameStatus = state.status === "won" ? "won" : "playing";
  if (!state.reached2048 && hasWon(spawned)) {
    status = "won";
  }
  if (!canMove(spawned)) {
    status = "lost";
  }

  return {
    board: spawned,
    score: state.score + gained,
    status,
    reached2048,
  };
}

/** Dismiss the win banner and keep playing past 2048. */
export function continuePlaying(state: GameState): GameState {
  if (state.status !== "won") {
    return state;
  }
  return { ...state, status: "playing" };
}
