export type SeedMode = "center" | "line";

export interface DlaWorld {
  w: number;
  h: number;
  grid: Uint8Array; // 0 = empty, 1 = frozen (part of the cluster)
  age: Uint16Array; // frozen tick, for coloring by growth order
  count: number; // frozen cells
  tick: number;
  maxR: number; // radius of the cluster from center (for center mode)
}

export function makeWorld(w: number, h: number, mode: SeedMode): DlaWorld {
  const grid = new Uint8Array(w * h);
  const age = new Uint16Array(w * h);
  let count = 0;
  if (mode === "center") {
    const cx = w >> 1;
    const cy = h >> 1;
    grid[cy * w + cx] = 1;
    count = 1;
  } else {
    for (let x = 0; x < w; x++) {
      grid[(h - 1) * w + x] = 1;
      count++;
    }
  }
  return { w, h, grid, age, count, tick: 0, maxR: 1 };
}

function hasFrozenNeighbor(world: DlaWorld, x: number, y: number): boolean {
  const { w, h, grid } = world;
  if (x > 0 && grid[y * w + x - 1]) return true;
  if (x < w - 1 && grid[y * w + x + 1]) return true;
  if (y > 0 && grid[(y - 1) * w + x]) return true;
  if (y < h - 1 && grid[(y + 1) * w + x]) return true;
  // diagonals for denser dendrites
  if (x > 0 && y > 0 && grid[(y - 1) * w + x - 1]) return true;
  if (x < w - 1 && y > 0 && grid[(y - 1) * w + x + 1]) return true;
  if (x > 0 && y < h - 1 && grid[(y + 1) * w + x - 1]) return true;
  if (x < w - 1 && y < h - 1 && grid[(y + 1) * w + x + 1]) return true;
  return false;
}

interface Walker {
  x: number;
  y: number;
}

/** Spawn a walker: on a circle around center, or along the top for line mode. */
function spawnWalker(world: DlaWorld, mode: SeedMode): Walker {
  const { w, h } = world;
  if (mode === "center") {
    const cx = w / 2, cy = h / 2;
    const r = Math.min(Math.min(w, h) / 2 - 2, world.maxR + 6);
    const a = Math.random() * Math.PI * 2;
    return { x: Math.floor(cx + Math.cos(a) * r), y: Math.floor(cy + Math.sin(a) * r) };
  }
  return { x: Math.floor(Math.random() * w), y: 0 };
}

/**
 * Release `walkers` random walkers; each wanders until it touches the
 * cluster and freezes, or wanders off-grid and is discarded. Returns the
 * number that stuck this call.
 */
export function growStep(world: DlaWorld, mode: SeedMode, walkers: number): number {
  const { w, h } = world;
  const cx = w / 2, cy = h / 2;
  let stuck = 0;

  for (let n = 0; n < walkers; n++) {
    const walker = spawnWalker(world, mode);
    let { x, y } = walker;
    // cap steps so a walker can't loop forever
    for (let step = 0; step < 4000; step++) {
      if (x < 0 || y < 0 || x >= w || y >= h) break;
      if (hasFrozenNeighbor(world, x, y) && !world.grid[y * w + x]) {
        const idx = y * w + x;
        world.grid[idx] = 1;
        world.age[idx] = world.tick;
        world.count++;
        stuck++;
        if (mode === "center") {
          const r = Math.hypot(x - cx, y - cy);
          if (r > world.maxR) world.maxR = r;
        }
        break;
      }
      // random step (8-directional)
      x += (Math.random() * 3 | 0) - 1;
      y += (Math.random() * 3 | 0) - 1;
    }
  }
  world.tick++;
  return stuck;
}
