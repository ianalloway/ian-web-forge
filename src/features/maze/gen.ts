export const ROWS = 18;
export const COLS = 24;
export const CELL = 30;
export const CANVAS_W = COLS * CELL; // 720
export const CANVAS_H = ROWS * CELL; // 540

// Wall bitmask — set bits = open passages
export const N = 1, S = 2, E = 4, W = 8;
const OPPOSITE: Record<number, number> = { [N]: S, [S]: N, [E]: W, [W]: E };
const DR: Record<number, number> = { [N]: -1, [S]: 1, [E]: 0, [W]: 0 };
const DC: Record<number, number> = { [N]: 0, [S]: 0, [E]: 1, [W]: -1 };

export function idx(r: number, c: number) { return r * COLS + c; }
export function pos(i: number): [number, number] { return [Math.floor(i / COLS), i % COLS]; }

export interface CarveStep {
  from: number;
  to: number;
  dir: number;
  stack: number[]; // DFS stack state after this carve (top = `to`)
}

export function generateMaze(): { walls: Uint8Array; steps: CarveStep[] } {
  const walls = new Uint8Array(ROWS * COLS);
  const visited = new Uint8Array(ROWS * COLS);
  const steps: CarveStep[] = [];
  const stack: number[] = [0];
  visited[0] = 1;

  while (stack.length) {
    const curr = stack[stack.length - 1];
    const [r, c] = pos(curr);

    const dirs = [N, S, E, W];
    for (let i = 3; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
    }

    let carved = false;
    for (const dir of dirs) {
      const nr = r + DR[dir];
      const nc = c + DC[dir];
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
      const next = idx(nr, nc);
      if (visited[next]) continue;

      walls[curr] |= dir;
      walls[next] |= OPPOSITE[dir];
      visited[next] = 1;
      stack.push(next);
      steps.push({ from: curr, to: next, dir, stack: [...stack] });
      carved = true;
      break;
    }

    if (!carved) stack.pop();
  }

  return { walls, steps };
}

export interface SolveStep {
  cell: number;
  newVisited: number[];
  done: boolean;
  path: number[];
}

export function solveMaze(walls: Uint8Array): SolveStep[] {
  const end = ROWS * COLS - 1;
  const visited = new Uint8Array(ROWS * COLS);
  const parent = new Int32Array(ROWS * COLS).fill(-1);
  const steps: SolveStep[] = [];
  const queue: number[] = [0];
  visited[0] = 1;

  while (queue.length) {
    const curr = queue.shift()!;
    const [r, c] = pos(curr);
    const newVisited: number[] = [];

    for (const [dir, dr, dc] of [[N, -1, 0], [S, 1, 0], [E, 0, 1], [W, 0, -1]] as [number, number, number][]) {
      if (!(walls[curr] & dir)) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
      const ni = idx(nr, nc);
      if (visited[ni]) continue;
      visited[ni] = 1;
      parent[ni] = curr;
      queue.push(ni);
      newVisited.push(ni);
    }

    if (curr === end) {
      const path: number[] = [];
      let p = end;
      while (p !== -1) { path.unshift(p); p = parent[p]; }
      steps.push({ cell: curr, newVisited, done: true, path });
      break;
    }

    steps.push({ cell: curr, newVisited, done: false, path: [] });
  }

  return steps;
}

const WALL_COLOR = "#00ff41";
const BG = "#0d0d0d";

export function drawMaze(
  ctx: CanvasRenderingContext2D,
  walls: Uint8Array,
  opts: {
    currentCell?: number;
    dfsStack?: Set<number>;
    visitedSolve?: Set<number>;
    frontier?: Set<number>;
    path?: Set<number>;
  } = {}
): void {
  const {
    currentCell = -1,
    dfsStack = new Set<number>(),
    visitedSolve = new Set<number>(),
    frontier = new Set<number>(),
    path = new Set<number>(),
  } = opts;

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Cell fills
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const i = idx(r, c);
      const x = c * CELL;
      const y = r * CELL;

      let fill = "";
      if (path.has(i)) fill = "rgba(255,215,0,0.55)";
      else if (frontier.has(i)) fill = "rgba(0,255,65,0.35)";
      else if (visitedSolve.has(i)) fill = "rgba(0,255,65,0.12)";
      else if (i === currentCell) fill = "rgba(0,255,65,0.75)";
      else if (dfsStack.has(i)) fill = "rgba(0,255,65,0.18)";

      if (fill) {
        ctx.fillStyle = fill;
        ctx.fillRect(x + 1, y + 1, CELL - 1, CELL - 1);
      }
    }
  }

  // Walls
  ctx.strokeStyle = WALL_COLOR;
  ctx.lineWidth = 1.5;

  // Outer border
  ctx.beginPath();
  ctx.rect(0.75, 0.75, CANVAS_W - 1.5, CANVAS_H - 1.5);
  ctx.stroke();

  // Interior walls: draw S and E wall of each cell when that passage is not open
  ctx.beginPath();
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const i = idx(r, c);
      const x = c * CELL;
      const y = r * CELL;

      if (r < ROWS - 1 && !(walls[i] & S)) {
        ctx.moveTo(x, y + CELL);
        ctx.lineTo(x + CELL, y + CELL);
      }
      if (c < COLS - 1 && !(walls[i] & E)) {
        ctx.moveTo(x + CELL, y);
        ctx.lineTo(x + CELL, y + CELL);
      }
    }
  }
  ctx.stroke();

  // Start/end labels
  ctx.font = `bold ${CELL * 0.38}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = WALL_COLOR;
  ctx.fillText("S", CELL * 0.5, CELL * 0.5);

  ctx.fillStyle = path.has(idx(ROWS - 1, COLS - 1)) ? "rgba(255,215,0,0.9)" : "#ff4444";
  ctx.fillText("E", (COLS - 0.5) * CELL, (ROWS - 0.5) * CELL);
}
