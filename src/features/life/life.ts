/**
 * Conway's Game of Life — pure, framework-free simulation logic.
 *
 * Mirrors the structure of features/snake/game.ts: immutable state, an
 * injectable random source for deterministic behaviour, and no rendering
 * concerns. The React page in pages/Life.tsx is a thin view over this.
 *
 * Rules (B3/S23):
 *   - A live cell with 2 or 3 live neighbours survives.
 *   - A dead cell with exactly 3 live neighbours becomes alive.
 *   - Everything else dies or stays dead.
 */

export const GRID_COLUMNS = 38;
export const GRID_ROWS = 26;
export const TICK_MS = 110;

export type LifeGrid = {
  columns: number;
  rows: number;
  /** Row-major flat array, indexed as `y * columns + x`. */
  cells: boolean[];
  generation: number;
  population: number;
};

export type PatternName =
  | "glider"
  | "blinker"
  | "pulsar"
  | "lwss"
  | "gosper_glider_gun";

/** Relative (x, y) offsets of the live cells in each seed pattern. */
const PATTERNS: Record<PatternName, ReadonlyArray<readonly [number, number]>> = {
  blinker: [
    [0, 0],
    [1, 0],
    [2, 0],
  ],
  glider: [
    [1, 0],
    [2, 1],
    [0, 2],
    [1, 2],
    [2, 2],
  ],
  // Lightweight spaceship — travels horizontally.
  lwss: [
    [0, 0],
    [3, 0],
    [4, 1],
    [0, 2],
    [4, 2],
    [1, 3],
    [2, 3],
    [3, 3],
    [4, 3],
  ],
  pulsar: [
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
  // Gosper glider gun — emits a glider every 30 generations.
  gosper_glider_gun: [
    [0, 4], [0, 5], [1, 4], [1, 5],
    [10, 4], [10, 5], [10, 6], [11, 3], [11, 7], [12, 2], [12, 8], [13, 2], [13, 8],
    [14, 5], [15, 3], [15, 7], [16, 4], [16, 5], [16, 6], [17, 5],
    [20, 2], [20, 3], [20, 4], [21, 2], [21, 3], [21, 4], [22, 1], [22, 5],
    [24, 0], [24, 1], [24, 5], [24, 6],
    [34, 2], [34, 3], [35, 2], [35, 3],
  ],
};

export const PATTERN_LABELS: Record<PatternName, string> = {
  glider: "Glider",
  blinker: "Blinker",
  pulsar: "Pulsar",
  lwss: "Spaceship",
  gosper_glider_gun: "Glider gun",
};

function patternExtent(
  cells: ReadonlyArray<readonly [number, number]>,
): { width: number; height: number } {
  let width = 0;
  let height = 0;
  for (const [x, y] of cells) {
    width = Math.max(width, x + 1);
    height = Math.max(height, y + 1);
  }
  return { width, height };
}

export function indexOf(grid: LifeGrid, x: number, y: number): number {
  return y * grid.columns + x;
}

export function isAlive(grid: LifeGrid, x: number, y: number): boolean {
  return grid.cells[indexOf(grid, x, y)] === true;
}

function withCells(grid: LifeGrid, cells: boolean[]): LifeGrid {
  return {
    ...grid,
    cells,
    population: countPopulation(cells),
  };
}

export function countPopulation(cells: boolean[]): number {
  let total = 0;
  for (const alive of cells) {
    if (alive) {
      total += 1;
    }
  }
  return total;
}

export function createGrid({
  columns = GRID_COLUMNS,
  rows = GRID_ROWS,
}: {
  columns?: number;
  rows?: number;
} = {}): LifeGrid {
  return {
    columns,
    rows,
    cells: new Array<boolean>(columns * rows).fill(false),
    generation: 0,
    population: 0,
  };
}

export function clearGrid(grid: LifeGrid): LifeGrid {
  return {
    ...grid,
    cells: new Array<boolean>(grid.columns * grid.rows).fill(false),
    generation: 0,
    population: 0,
  };
}

export function toggleCell(grid: LifeGrid, x: number, y: number): LifeGrid {
  if (x < 0 || x >= grid.columns || y < 0 || y >= grid.rows) {
    return grid;
  }

  const cells = grid.cells.slice();
  const index = indexOf(grid, x, y);
  cells[index] = !cells[index];
  return withCells(grid, cells);
}

export function randomize(
  grid: LifeGrid,
  density = 0.28,
  random: () => number = Math.random,
): LifeGrid {
  const cells = grid.cells.map(() => random() < density);
  return {
    ...withCells(grid, cells),
    generation: 0,
  };
}

/**
 * Stamp a named seed pattern onto a cleared grid, centred on the board.
 */
export function placePattern(grid: LifeGrid, name: PatternName): LifeGrid {
  const pattern = PATTERNS[name];
  const { width, height } = patternExtent(pattern);
  const offsetX = Math.max(0, Math.floor((grid.columns - width) / 2));
  const offsetY = Math.max(0, Math.floor((grid.rows - height) / 2));

  const cells = new Array<boolean>(grid.columns * grid.rows).fill(false);
  for (const [x, y] of pattern) {
    const px = offsetX + x;
    const py = offsetY + y;
    if (px >= 0 && px < grid.columns && py >= 0 && py < grid.rows) {
      cells[py * grid.columns + px] = true;
    }
  }

  return {
    ...withCells(grid, cells),
    generation: 0,
  };
}

export function countNeighbors(
  grid: LifeGrid,
  x: number,
  y: number,
  wrap: boolean,
): number {
  let count = 0;

  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) {
        continue;
      }

      let nx = x + dx;
      let ny = y + dy;

      if (wrap) {
        nx = (nx + grid.columns) % grid.columns;
        ny = (ny + grid.rows) % grid.rows;
      } else if (nx < 0 || nx >= grid.columns || ny < 0 || ny >= grid.rows) {
        continue;
      }

      if (grid.cells[ny * grid.columns + nx]) {
        count += 1;
      }
    }
  }

  return count;
}

/** Advance the board by one generation under the B3/S23 rules. */
export function step(grid: LifeGrid, { wrap = true }: { wrap?: boolean } = {}): LifeGrid {
  const next = new Array<boolean>(grid.columns * grid.rows).fill(false);

  for (let y = 0; y < grid.rows; y += 1) {
    for (let x = 0; x < grid.columns; x += 1) {
      const index = y * grid.columns + x;
      const neighbours = countNeighbors(grid, x, y, wrap);
      next[index] = grid.cells[index]
        ? neighbours === 2 || neighbours === 3
        : neighbours === 3;
    }
  }

  return {
    ...grid,
    cells: next,
    generation: grid.generation + 1,
    population: countPopulation(next),
  };
}
