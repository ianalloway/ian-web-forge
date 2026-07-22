export type Dir = "up" | "down" | "left" | "right";

export interface GameState {
  cols: number;
  rows: number;
  snake: number[]; // cell indices, head first
  dir: Dir;
  food: number;
  score: number;
  over: boolean;
}

const OPPOSITE: Record<Dir, Dir> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

export function isOpposite(a: Dir, b: Dir): boolean {
  return OPPOSITE[a] === b;
}

function placeFood(state: Pick<GameState, "cols" | "rows" | "snake">): number {
  const occupied = new Set(state.snake);
  const free: number[] = [];
  for (let i = 0; i < state.cols * state.rows; i++) {
    if (!occupied.has(i)) free.push(i);
  }
  if (free.length === 0) return -1; // board full — player wins
  return free[Math.floor(Math.random() * free.length)];
}

export function newGame(cols: number, rows: number): GameState {
  const cy = Math.floor(rows / 2);
  const cx = Math.floor(cols / 2);
  const head = cy * cols + cx;
  const snake = [head, head - 1, head - 2];
  const state: GameState = {
    cols,
    rows,
    snake,
    dir: "right",
    food: 0,
    score: 0,
    over: false,
  };
  state.food = placeFood(state);
  return state;
}

/** Advance one tick. Returns a new state; sets `over` on wall/self collision. */
export function tick(state: GameState, nextDir: Dir): GameState {
  if (state.over) return state;

  const dir = isOpposite(state.dir, nextDir) ? state.dir : nextDir;
  const { cols, rows } = state;
  const head = state.snake[0];
  const hx = head % cols;
  const hy = Math.floor(head / cols);

  let nx = hx, ny = hy;
  if (dir === "up") ny--;
  else if (dir === "down") ny++;
  else if (dir === "left") nx--;
  else nx++;

  // Wall collision
  if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) {
    return { ...state, dir, over: true };
  }

  const newHead = ny * cols + nx;
  const ate = newHead === state.food;
  const body = ate ? state.snake : state.snake.slice(0, -1);

  // Self collision (tail cell just vacated is allowed when not eating)
  if (body.includes(newHead)) {
    return { ...state, dir, over: true };
  }

  const snake = [newHead, ...body];
  const next: GameState = {
    ...state,
    dir,
    snake,
    score: ate ? state.score + 1 : state.score,
  };
  if (ate) next.food = placeFood(next);
  return next;
}

/** Tick interval in ms — speeds up as the snake grows. */
export function tickInterval(score: number): number {
  return Math.max(60, 140 - score * 4);
}

const HISCORE_KEY = "snake-hiscore";

export function loadHiScore(): number {
  try {
    return Number(localStorage.getItem(HISCORE_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function saveHiScore(score: number): void {
  try {
    localStorage.setItem(HISCORE_KEY, String(score));
  } catch {
    // storage unavailable — ignore
  }
}
