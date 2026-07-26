// Raycasting with DDA grid traversal — the technique behind Wolfenstein 3D.
//
// Instead of projecting geometry, one ray is cast per screen column and walked
// through the grid using a digital differential analyser: from any point, the
// next vertical and horizontal gridline crossings are tracked, and the walk
// always advances to whichever is nearer. That visits every cell the ray
// touches, in order, with no missed corners and no fixed step size.

export interface Grid {
  w: number;
  h: number;
  cells: Uint8Array; // 0 = empty, >0 = wall material id
}

export interface Hit {
  distance: number; // perpendicular distance to the wall (avoids fisheye)
  cellX: number;
  cellY: number;
  material: number; // 0 if the ray escaped without hitting anything
  side: 0 | 1; // 0 = hit a vertical (N/S-facing) wall, 1 = horizontal
  wallX: number; // where along the wall the hit landed, in [0,1)
}

export const cellAt = (g: Grid, x: number, y: number): number =>
  x < 0 || y < 0 || x >= g.w || y >= g.h ? 1 : g.cells[y * g.w + x];

/**
 * Cast a ray from (px, py) in direction (dx, dy) — which must be a unit vector
 * for `distance` to be in world units. Returns the first wall hit, or a
 * material of 0 if nothing was hit within `maxDist`.
 */
export function castRay(
  g: Grid,
  px: number,
  py: number,
  dx: number,
  dy: number,
  maxDist = 64
): Hit {
  let mapX = Math.floor(px);
  let mapY = Math.floor(py);

  // Distance the ray travels to cross one full cell in each axis.
  const deltaX = dx === 0 ? Infinity : Math.abs(1 / dx);
  const deltaY = dy === 0 ? Infinity : Math.abs(1 / dy);
  const stepX = dx < 0 ? -1 : 1;
  const stepY = dy < 0 ? -1 : 1;

  // Distance to the first gridline crossing on each axis.
  let sideDistX = dx === 0 ? Infinity : (dx < 0 ? px - mapX : mapX + 1 - px) * deltaX;
  let sideDistY = dy === 0 ? Infinity : (dy < 0 ? py - mapY : mapY + 1 - py) * deltaY;

  let side: 0 | 1 = 0;
  let distance = 0;

  while (distance <= maxDist) {
    // Advance to whichever gridline is closer.
    if (sideDistX < sideDistY) {
      distance = sideDistX;
      sideDistX += deltaX;
      mapX += stepX;
      side = 0;
    } else {
      distance = sideDistY;
      sideDistY += deltaY;
      mapY += stepY;
      side = 1;
    }
    const material = cellAt(g, mapX, mapY);
    if (material > 0) {
      // Where along the wall face the hit landed, for texturing.
      const hitX = px + dx * distance;
      const hitY = py + dy * distance;
      const raw = side === 0 ? hitY : hitX;
      let wallX = raw - Math.floor(raw);
      // Flip so texture orientation is consistent on opposite faces.
      if ((side === 0 && dx > 0) || (side === 1 && dy < 0)) wallX = 1 - wallX;
      return { distance, cellX: mapX, cellY: mapY, material, side, wallX };
    }
  }
  return { distance: maxDist, cellX: mapX, cellY: mapY, material: 0, side, wallX: 0 };
}

/** True if a circle of the given radius at (x, y) overlaps any wall. */
export function collides(g: Grid, x: number, y: number, radius = 0.2): boolean {
  for (const [ox, oy] of [
    [-radius, -radius],
    [radius, -radius],
    [-radius, radius],
    [radius, radius],
  ]) {
    if (cellAt(g, Math.floor(x + ox), Math.floor(y + oy)) > 0) return true;
  }
  return false;
}

/** Carve a maze with a recursive backtracker on the odd-indexed lattice. */
export function generateMaze(w: number, h: number, rng: () => number = Math.random): Grid {
  const cells = new Uint8Array(w * h).fill(1);
  const set = (x: number, y: number, v: number) => {
    if (x >= 0 && y >= 0 && x < w && y < h) cells[y * w + x] = v;
  };
  const get = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? 1 : cells[y * w + x]);

  const stack: [number, number][] = [[1, 1]];
  set(1, 1, 0);
  while (stack.length) {
    const [cx, cy] = stack[stack.length - 1];
    const dirs: [number, number][] = [
      [2, 0],
      [-2, 0],
      [0, 2],
      [0, -2],
    ];
    // Shuffle so the maze isn't biased toward one direction.
    for (let i = dirs.length - 1; i > 0; i--) {
      const j = (rng() * (i + 1)) | 0;
      [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
    }
    let carved = false;
    for (const [ddx, ddy] of dirs) {
      const nx = cx + ddx;
      const ny = cy + ddy;
      if (nx > 0 && ny > 0 && nx < w - 1 && ny < h - 1 && get(nx, ny) === 1) {
        set(cx + ddx / 2, cy + ddy / 2, 0);
        set(nx, ny, 0);
        stack.push([nx, ny]);
        carved = true;
        break;
      }
    }
    if (!carved) stack.pop();
  }

  // Give walls a few different materials so the view isn't monotonous.
  for (let i = 0; i < cells.length; i++) {
    if (cells[i] > 0) cells[i] = 1 + ((rng() * 3) | 0);
  }
  return { w, h, cells };
}
