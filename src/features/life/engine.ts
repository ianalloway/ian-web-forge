export type Grid = Uint8Array;

export interface WorldSize {
  cols: number;
  rows: number;
}

export function makeGrid({ cols, rows }: WorldSize): Grid {
  return new Uint8Array(cols * rows);
}

export function randomize(grid: Grid, density = 0.25): Grid {
  const next = new Uint8Array(grid.length);
  for (let i = 0; i < next.length; i++) {
    next[i] = Math.random() < density ? 1 : 0;
  }
  return next;
}

/** One generation with toroidal (wrap-around) edges. */
export function step(grid: Grid, { cols, rows }: WorldSize): Grid {
  const next = new Uint8Array(grid.length);
  for (let y = 0; y < rows; y++) {
    const up = ((y - 1 + rows) % rows) * cols;
    const mid = y * cols;
    const down = ((y + 1) % rows) * cols;
    for (let x = 0; x < cols; x++) {
      const left = (x - 1 + cols) % cols;
      const right = (x + 1) % cols;
      const n =
        grid[up + left] + grid[up + x] + grid[up + right] +
        grid[mid + left] + grid[mid + right] +
        grid[down + left] + grid[down + x] + grid[down + right];
      const alive = grid[mid + x] === 1;
      next[mid + x] = n === 3 || (alive && n === 2) ? 1 : 0;
    }
  }
  return next;
}

export function countAlive(grid: Grid): number {
  let total = 0;
  for (let i = 0; i < grid.length; i++) total += grid[i];
  return total;
}

export type PatternId = "glider" | "gosper" | "pulsar" | "rpentomino";

export const PATTERNS: Record<PatternId, { label: string; cells: [number, number][] }> = {
  glider: {
    label: "Gliders",
    cells: [
      [1, 0], [2, 1], [0, 2], [1, 2], [2, 2],
    ],
  },
  gosper: {
    label: "Gosper Gun",
    cells: [
      [24, 0], [22, 1], [24, 1], [12, 2], [13, 2], [20, 2], [21, 2], [34, 2], [35, 2],
      [11, 3], [15, 3], [20, 3], [21, 3], [34, 3], [35, 3], [0, 4], [1, 4], [10, 4],
      [16, 4], [20, 4], [21, 4], [0, 5], [1, 5], [10, 5], [14, 5], [16, 5], [17, 5],
      [22, 5], [24, 5], [10, 6], [16, 6], [24, 6], [11, 7], [15, 7], [12, 8], [13, 8],
    ],
  },
  pulsar: {
    label: "Pulsar",
    cells: [
      [2, 0], [3, 0], [4, 0], [8, 0], [9, 0], [10, 0],
      [0, 2], [5, 2], [7, 2], [12, 2],
      [0, 3], [5, 3], [7, 3], [12, 3],
      [0, 4], [5, 4], [7, 4], [12, 4],
      [2, 5], [3, 5], [4, 5], [8, 5], [9, 5], [10, 5],
      [2, 7], [3, 7], [4, 7], [8, 7], [9, 7], [10, 7],
      [0, 8], [5, 8], [7, 8], [12, 8],
      [0, 9], [5, 9], [7, 9], [12, 9],
      [0, 10], [5, 10], [7, 10], [12, 10],
      [2, 12], [3, 12], [4, 12], [8, 12], [9, 12], [10, 12],
    ],
  },
  rpentomino: {
    label: "R-pentomino",
    cells: [
      [1, 0], [2, 0], [0, 1], [1, 1], [1, 2],
    ],
  },
};

/** Stamp a pattern with its top-left near (ox, oy); wraps toroidally. */
export function stampPattern(
  grid: Grid,
  { cols, rows }: WorldSize,
  pattern: PatternId,
  ox: number,
  oy: number
): Grid {
  const next = new Uint8Array(grid);
  for (const [dx, dy] of PATTERNS[pattern].cells) {
    const x = (ox + dx + cols) % cols;
    const y = (oy + dy + rows) % rows;
    next[y * cols + x] = 1;
  }
  return next;
}

export function toggleCell(grid: Grid, { cols }: WorldSize, x: number, y: number): Grid {
  const next = new Uint8Array(grid);
  const idx = y * cols + x;
  next[idx] = next[idx] ? 0 : 1;
  return next;
}
