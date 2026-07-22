export type AlgoId = "bfs" | "dfs" | "greedy" | "astar";

export const ALGORITHMS: Record<AlgoId, { label: string; note: string }> = {
  bfs: { label: "BFS", note: "uniform flood, optimal" },
  dfs: { label: "DFS", note: "depth-first, chaotic" },
  greedy: { label: "Greedy", note: "beeline, not optimal" },
  astar: { label: "A*", note: "directed, optimal" },
};

export interface GridSpec {
  cols: number;
  rows: number;
  walls: Set<number>;
  start: number;
  end: number;
}

export type SearchEvent =
  | { type: "visit"; index: number }
  | { type: "frontier"; index: number }
  | { type: "path"; path: number[] }
  | { type: "fail" };

function neighbors(idx: number, cols: number, rows: number): number[] {
  const x = idx % cols;
  const y = Math.floor(idx / cols);
  const out: number[] = [];
  if (y > 0) out.push(idx - cols);
  if (x < cols - 1) out.push(idx + 1);
  if (y < rows - 1) out.push(idx + cols);
  if (x > 0) out.push(idx - 1);
  return out;
}

function manhattan(a: number, b: number, cols: number): number {
  const ax = a % cols, ay = Math.floor(a / cols);
  const bx = b % cols, by = Math.floor(b / cols);
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

function reconstruct(cameFrom: Map<number, number>, end: number): number[] {
  const path = [end];
  let cur = end;
  while (cameFrom.has(cur)) {
    cur = cameFrom.get(cur)!;
    path.push(cur);
  }
  return path.reverse();
}

/** Simple binary min-heap keyed by priority. */
class MinHeap {
  private items: { idx: number; pri: number }[] = [];

  get size() { return this.items.length; }

  push(idx: number, pri: number) {
    this.items.push({ idx, pri });
    let i = this.items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.items[parent].pri <= this.items[i].pri) break;
      [this.items[parent], this.items[i]] = [this.items[i], this.items[parent]];
      i = parent;
    }
  }

  pop(): number {
    const top = this.items[0].idx;
    const last = this.items.pop()!;
    if (this.items.length > 0) {
      this.items[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = 2 * i + 2;
        let smallest = i;
        if (l < this.items.length && this.items[l].pri < this.items[smallest].pri) smallest = l;
        if (r < this.items.length && this.items[r].pri < this.items[smallest].pri) smallest = r;
        if (smallest === i) break;
        [this.items[smallest], this.items[i]] = [this.items[i], this.items[smallest]];
        i = smallest;
      }
    }
    return top;
  }
}

function* frontierSearch(spec: GridSpec, mode: "bfs" | "dfs"): Generator<SearchEvent> {
  const { cols, rows, walls, start, end } = spec;
  const container: number[] = [start];
  const seen = new Set<number>([start]);
  const cameFrom = new Map<number, number>();

  while (container.length > 0) {
    const cur = mode === "bfs" ? container.shift()! : container.pop()!;
    yield { type: "visit", index: cur };
    if (cur === end) {
      yield { type: "path", path: reconstruct(cameFrom, end) };
      return;
    }
    for (const n of neighbors(cur, cols, rows)) {
      if (seen.has(n) || walls.has(n)) continue;
      seen.add(n);
      cameFrom.set(n, cur);
      container.push(n);
      yield { type: "frontier", index: n };
    }
  }
  yield { type: "fail" };
}

function* heapSearch(spec: GridSpec, mode: "greedy" | "astar"): Generator<SearchEvent> {
  const { cols, rows, walls, start, end } = spec;
  const heap = new MinHeap();
  const gScore = new Map<number, number>([[start, 0]]);
  const cameFrom = new Map<number, number>();
  const closed = new Set<number>();
  heap.push(start, manhattan(start, end, cols));

  while (heap.size > 0) {
    const cur = heap.pop();
    if (closed.has(cur)) continue;
    closed.add(cur);
    yield { type: "visit", index: cur };
    if (cur === end) {
      yield { type: "path", path: reconstruct(cameFrom, end) };
      return;
    }
    const g = gScore.get(cur)!;
    for (const n of neighbors(cur, cols, rows)) {
      if (closed.has(n) || walls.has(n)) continue;
      const tentative = g + 1;
      const known = gScore.get(n);
      if (known !== undefined && tentative >= known) continue;
      gScore.set(n, tentative);
      cameFrom.set(n, cur);
      const h = manhattan(n, end, cols);
      heap.push(n, mode === "astar" ? tentative + h : h);
      yield { type: "frontier", index: n };
    }
  }
  yield { type: "fail" };
}

export function makeSearch(algo: AlgoId, spec: GridSpec): Generator<SearchEvent> {
  if (algo === "bfs" || algo === "dfs") return frontierSearch(spec, algo);
  return heapSearch(spec, algo);
}

/** Recursive-division maze walls for a more interesting default board. */
export function randomWalls(cols: number, rows: number, start: number, end: number): Set<number> {
  const walls = new Set<number>();
  for (let i = 0; i < cols * rows; i++) {
    if (Math.random() < 0.28) walls.add(i);
  }
  walls.delete(start);
  walls.delete(end);
  // Clear a little space around start/end so they're never boxed in
  const clear = (idx: number) => {
    const x = idx % cols, y = Math.floor(idx / cols);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < cols && ny < rows) walls.delete(ny * cols + nx);
      }
    }
  };
  clear(start);
  clear(end);
  return walls;
}
