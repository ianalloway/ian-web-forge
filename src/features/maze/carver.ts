// Walls stored per cell as a bitmask
export const N = 1, S = 2, E = 4, W = 8;

export interface MazeGrid {
  cols: number;
  rows: number;
  walls: Uint8Array; // bitmask per cell, starts at N|S|E|W
}

export type CarveEvent =
  | { type: "visit"; index: number } // cell joined the maze
  | { type: "backtrack"; index: number } // head retreated to this cell
  | { type: "done" };

export type SolveEvent =
  | { type: "explore"; index: number }
  | { type: "path"; path: number[] }
  | { type: "done" };

export function newGrid(cols: number, rows: number): MazeGrid {
  return {
    cols,
    rows,
    walls: new Uint8Array(cols * rows).fill(N | S | E | W),
  };
}

interface Neighbor {
  index: number;
  wall: number; // wall to knock down on the current cell
  opposite: number; // wall to knock down on the neighbor
}

function neighbors(g: MazeGrid, idx: number): Neighbor[] {
  const x = idx % g.cols;
  const y = Math.floor(idx / g.cols);
  const out: Neighbor[] = [];
  if (y > 0) out.push({ index: idx - g.cols, wall: N, opposite: S });
  if (y < g.rows - 1) out.push({ index: idx + g.cols, wall: S, opposite: N });
  if (x < g.cols - 1) out.push({ index: idx + 1, wall: E, opposite: W });
  if (x > 0) out.push({ index: idx - 1, wall: W, opposite: E });
  return out;
}

/** Recursive-backtracker (iterative) carve, yielding one event per step. */
export function* carve(g: MazeGrid): Generator<CarveEvent> {
  const visited = new Uint8Array(g.cols * g.rows);
  const stack: number[] = [0];
  visited[0] = 1;
  yield { type: "visit", index: 0 };

  while (stack.length > 0) {
    const cur = stack[stack.length - 1];
    const options = neighbors(g, cur).filter((n) => !visited[n.index]);
    if (options.length === 0) {
      stack.pop();
      if (stack.length > 0) {
        yield { type: "backtrack", index: stack[stack.length - 1] };
      }
      continue;
    }
    const pick = options[Math.floor(Math.random() * options.length)];
    g.walls[cur] &= ~pick.wall;
    g.walls[pick.index] &= ~pick.opposite;
    visited[pick.index] = 1;
    stack.push(pick.index);
    yield { type: "visit", index: pick.index };
  }
  yield { type: "done" };
}

/** Cells connected to idx (walls already carved). */
function openNeighbors(g: MazeGrid, idx: number): number[] {
  const out: number[] = [];
  const w = g.walls[idx];
  if (!(w & N)) out.push(idx - g.cols);
  if (!(w & S)) out.push(idx + g.cols);
  if (!(w & E)) out.push(idx + 1);
  if (!(w & W)) out.push(idx - 1);
  return out;
}

/** BFS solve from top-left to bottom-right, yielding exploration then the path. */
export function* solve(g: MazeGrid): Generator<SolveEvent> {
  const start = 0;
  const goal = g.cols * g.rows - 1;
  const cameFrom = new Map<number, number>();
  const seen = new Uint8Array(g.cols * g.rows);
  seen[start] = 1;
  let frontier = [start];
  yield { type: "explore", index: start };

  outer: while (frontier.length > 0) {
    const next: number[] = [];
    for (const cur of frontier) {
      for (const n of openNeighbors(g, cur)) {
        if (seen[n]) continue;
        seen[n] = 1;
        cameFrom.set(n, cur);
        yield { type: "explore", index: n };
        if (n === goal) break outer;
        next.push(n);
      }
    }
    frontier = next;
  }

  const path = [goal];
  let cur = goal;
  while (cameFrom.has(cur)) {
    cur = cameFrom.get(cur)!;
    path.push(cur);
  }
  yield { type: "path", path: path.reverse() };
  yield { type: "done" };
}
