// Tabular Q-learning on a gridworld.
//
// The agent lives on a grid of cells. Four actions (up/right/down/left) move it
// one cell; walls and edges block (it stays put). Reaching the goal ends the
// episode with +1, falling in a pit ends it with -1, and every other step pays a
// small living cost so the agent learns to hurry. Learning is the textbook
// off-policy update
//
//   Q(s,a) ← Q(s,a) + α · [ r + γ · maxₐ' Q(s',a') − Q(s,a) ]
//
// with ε-greedy exploration. No environment model is used — the agent only ever
// sees (state, action, reward, next state) tuples.

export const EMPTY = 0;
export const WALL = 1;
export const GOAL = 2;
export const PIT = 3;
export type CellType = typeof EMPTY | typeof WALL | typeof GOAL | typeof PIT;

// Actions, ordered so that (a + 2) % 4 is the opposite direction.
export const UP = 0;
export const RIGHT = 1;
export const DOWN = 2;
export const LEFT = 3;
export const ACTIONS = [UP, RIGHT, DOWN, LEFT] as const;
export type Action = (typeof ACTIONS)[number];

// Row/column deltas indexed by action.
const DR = [-1, 0, 1, 0];
const DC = [0, 1, 0, -1];

export interface Grid {
  rows: number;
  cols: number;
  cells: CellType[]; // row-major, length rows*cols
  start: number; // start cell index
  goal: number; // goal cell index (for quick reference)
}

export interface Params {
  alpha: number; // learning rate
  gamma: number; // discount factor
  epsilon: number; // exploration probability
  slip: number; // probability the environment sends you perpendicular
  stepCost: number; // reward paid on every non-terminal step (negative)
}

export const DEFAULT_PARAMS: Params = {
  alpha: 0.2,
  gamma: 0.95,
  epsilon: 0.2,
  slip: 0,
  stepCost: -0.04,
};

export interface Learner {
  grid: Grid;
  q: Float64Array; // length rows*cols*4, indexed by (cell*4 + action)
  agent: number; // current cell index
  episode: number; // completed-episode count
  steps: number; // steps taken in the current episode
  totalSteps: number; // steps taken across all episodes
  epReward: number; // reward accumulated in the current episode
  returns: number[]; // return of each finished episode
  epSteps: number[]; // length of each finished episode
  outcomes: number[]; // 1 = reached goal, 0 = pit or timed out
}

// ── Grid construction ────────────────────────────────────────────────────────

// Presets are written as ASCII maps: '.' empty, '#' wall, 'S' start, 'G' goal,
// 'X' pit. Every row must be the same length. Each map has a safe path from S to
// G that touches neither walls nor pits.
export interface Preset {
  id: string;
  label: string;
  note: string;
  map: string[];
}

export const PRESETS: Preset[] = [
  {
    id: "cliff",
    label: "cliff",
    note: "a wall of pits to skirt — the classic cliff walk",
    map: [
      "............",
      "............",
      "............",
      "............",
      "............",
      "S.XXXXXXXX.G",
    ],
  },
  {
    id: "maze",
    label: "maze",
    note: "walls only — find the shortest way out",
    map: [
      "S....#.....G",
      ".###.#.###..",
      ".#...#.#.#..",
      ".#.###.#.#.#",
      ".#.....#...#",
      ".#####.####.",
      "......#.....",
      ".####.#.###.",
      "....#...#...",
    ],
  },
  {
    id: "rooms",
    label: "rooms",
    note: "two rooms, one doorway, a pit by the door",
    map: [
      "S.....#.....",
      "......#.....",
      "......#..X..",
      "............",
      "......#.....",
      "..X...#.....",
      "......#....G",
    ],
  },
  {
    id: "field",
    label: "minefield",
    note: "open ground, scattered pits — watch the value gradient",
    map: [
      "S...........",
      "...X....X...",
      ".......X....",
      "..X.........",
      ".....X....X.",
      "...X........",
      "........X..G",
    ],
  },
];

const CHAR_TO_CELL: Record<string, CellType> = {
  ".": EMPTY,
  S: EMPTY,
  G: GOAL,
  X: PIT,
  "#": WALL,
};

export function buildGrid(preset: Preset): Grid {
  const rows = preset.map.length;
  const cols = preset.map[0].length;
  const cells: CellType[] = new Array(rows * cols).fill(EMPTY);
  let start = 0;
  let goal = 0;
  for (let r = 0; r < rows; r++) {
    const line = preset.map[r];
    for (let c = 0; c < cols; c++) {
      const ch = line[c];
      const idx = r * cols + c;
      cells[idx] = CHAR_TO_CELL[ch] ?? EMPTY;
      if (ch === "S") start = idx;
      if (ch === "G") goal = idx;
    }
  }
  return { rows, cols, cells, start, goal };
}

// ── Learner ──────────────────────────────────────────────────────────────────

export function newLearner(grid: Grid): Learner {
  return {
    grid,
    q: new Float64Array(grid.rows * grid.cols * 4),
    agent: grid.start,
    episode: 0,
    steps: 0,
    totalSteps: 0,
    epReward: 0,
    returns: [],
    epSteps: [],
    outcomes: [],
  };
}

function isTerminal(grid: Grid, cell: number): boolean {
  return grid.cells[cell] === GOAL || grid.cells[cell] === PIT;
}

export function greedyAction(l: Learner, cell: number): Action {
  const base = cell * 4;
  let best: Action = UP;
  let bestQ = l.q[base];
  for (let a = 1; a < 4; a++) {
    if (l.q[base + a] > bestQ) {
      bestQ = l.q[base + a];
      best = a as Action;
    }
  }
  return best;
}

export function stateValue(l: Learner, cell: number): number {
  const base = cell * 4;
  let v = l.q[base];
  for (let a = 1; a < 4; a++) if (l.q[base + a] > v) v = l.q[base + a];
  return v;
}

// Where does `action` from `cell` land? Walls and edges bounce back to `cell`.
function moveResult(grid: Grid, cell: number, action: Action): number {
  const r = Math.floor(cell / grid.cols) + DR[action];
  const c = (cell % grid.cols) + DC[action];
  if (r < 0 || c < 0 || r >= grid.rows || c >= grid.cols) return cell;
  const next = r * grid.cols + c;
  return grid.cells[next] === WALL ? cell : next;
}

function chooseAction(l: Learner, cell: number, epsilon: number): Action {
  if (Math.random() < epsilon) return ACTIONS[(Math.random() * 4) | 0];
  return greedyAction(l, cell);
}

// The environment may `slip`: with that probability the intended action is
// replaced by one of the two perpendicular directions, chosen evenly.
function applySlip(action: Action, slip: number): Action {
  if (slip > 0 && Math.random() < slip) {
    return (Math.random() < 0.5 ? (action + 1) % 4 : (action + 3) % 4) as Action;
  }
  return action;
}

export interface StepResult {
  from: number;
  to: number;
  action: Action;
  reward: number;
  terminal: boolean;
  episodeEnded: boolean;
}

// Advance the simulation by a single environment step, learning from it.
export function step(l: Learner, params: Params, maxSteps: number): StepResult {
  const from = l.agent;
  const action = chooseAction(l, from, params.epsilon);
  const to = moveResult(l.grid, from, applySlip(action, params.slip));

  const cellType = l.grid.cells[to];
  const terminal = cellType === GOAL || cellType === PIT;
  const reward = cellType === GOAL ? 1 : cellType === PIT ? -1 : params.stepCost;

  // Q-learning update: bootstrap off the greedy value of the next state, except
  // at a terminal state whose value is defined to be zero.
  const base = from * 4 + action;
  const target = reward + (terminal ? 0 : params.gamma * stateValue(l, to));
  l.q[base] += params.alpha * (target - l.q[base]);

  l.agent = to;
  l.steps++;
  l.totalSteps++;
  l.epReward += reward;

  const timedOut = l.steps >= maxSteps;
  const episodeEnded = terminal || timedOut;
  if (episodeEnded) {
    l.returns.push(l.epReward);
    l.epSteps.push(l.steps);
    l.outcomes.push(cellType === GOAL ? 1 : 0);
    if (l.returns.length > 4000) {
      l.returns.shift();
      l.epSteps.shift();
      l.outcomes.shift();
    }
    l.episode++;
    l.agent = l.grid.start;
    l.steps = 0;
    l.epReward = 0;
  }

  return { from, to, action, reward, terminal, episodeEnded };
}

// Follow the current greedy policy from the start, deterministically, until it
// reaches a terminal cell or loops. Returns the visited path and whether it
// actually made it to the goal — a live "is the policy solved yet?" readout.
export function greedyPath(l: Learner): { path: number[]; solved: boolean } {
  const path: number[] = [l.grid.start];
  const seen = new Set<number>([l.grid.start]);
  let cell = l.grid.start;
  const cap = l.grid.rows * l.grid.cols;
  for (let i = 0; i < cap; i++) {
    if (isTerminal(l.grid, cell)) {
      return { path, solved: l.grid.cells[cell] === GOAL };
    }
    const next = moveResult(l.grid, cell, greedyAction(l, cell));
    if (seen.has(next)) break; // stuck in a loop
    seen.add(next);
    path.push(next);
    cell = next;
  }
  return { path, solved: isTerminal(l.grid, cell) && l.grid.cells[cell] === GOAL };
}

// Success rate over the last `window` finished episodes.
export function successRate(l: Learner, window: number): number {
  const o = l.outcomes;
  if (o.length === 0) return 0;
  const n = Math.min(window, o.length);
  let hits = 0;
  for (let i = o.length - n; i < o.length; i++) hits += o[i];
  return hits / n;
}
