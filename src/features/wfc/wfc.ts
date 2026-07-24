// Wave Function Collapse — "simple tiled" model over a circuit/pipe tileset.
//
// Each tile carries four edge "sockets" [N, E, S, W], each 0 (blank) or 1
// (wire). Two tiles may sit next to each other only if their touching edges
// agree. The solver repeatedly collapses the lowest-entropy cell to a single
// tile and propagates that constraint outward until the whole grid is
// consistent (or hits a contradiction, in which case the caller re-rolls).

export type Sockets = [number, number, number, number]; // N, E, S, W

export interface Tile {
  sockets: Sockets;
  weight: number;
}

// Opposite edge: N<->S, E<->W.
const OPP = [2, 3, 0, 1];
// Neighbor pixel/grid deltas per direction N,E,S,W.
export const DX = [0, 1, 0, -1];
export const DY = [-1, 0, 1, 0];

/** Rotate a tile 90° clockwise (N takes the old W socket). */
function rotate(s: Sockets): Sockets {
  return [s[3], s[0], s[1], s[2]];
}

/** Expand base tiles into all distinct rotations. */
function expand(base: { sockets: Sockets; weight: number }[]): Tile[] {
  const seen = new Set<string>();
  const out: Tile[] = [];
  for (const b of base) {
    let s = b.sockets;
    for (let r = 0; r < 4; r++) {
      const key = s.join("");
      if (!seen.has(key)) {
        seen.add(key);
        out.push({ sockets: s, weight: b.weight });
      }
      s = rotate(s);
    }
  }
  return out;
}

export const TILES: Tile[] = expand([
  { sockets: [0, 0, 0, 0], weight: 0.35 }, // empty
  { sockets: [1, 0, 1, 0], weight: 1.1 }, // straight (2 rotations)
  { sockets: [1, 1, 0, 0], weight: 1.0 }, // corner (4)
  { sockets: [1, 1, 1, 0], weight: 0.6 }, // T-junction (4)
  { sockets: [1, 1, 1, 1], weight: 0.25 }, // cross (1)
]);

const T = TILES.length;
const FULL = (1 << T) - 1;

/** compatMask[d][a] = bitmask of tiles b that may sit on side d of tile a. */
const compatMask: number[][] = (() => {
  const m: number[][] = [[], [], [], []];
  for (let d = 0; d < 4; d++) {
    for (let a = 0; a < T; a++) {
      let mask = 0;
      for (let b = 0; b < T; b++) {
        if (TILES[a].sockets[d] === TILES[b].sockets[OPP[d]]) mask |= 1 << b;
      }
      m[d][a] = mask;
    }
  }
  return m;
})();

function popcount(x: number): number {
  let n = 0;
  while (x) {
    x &= x - 1;
    n++;
  }
  return n;
}

export type StepResult = "ok" | "done" | "contradiction";

export class WFC {
  readonly w: number;
  readonly h: number;
  domains: Int32Array; // bitmask of possible tiles per cell
  private rng: () => number;
  collapsed = 0;

  constructor(w: number, h: number, rng: () => number = Math.random) {
    this.w = w;
    this.h = h;
    this.rng = rng;
    this.domains = new Int32Array(w * h);
    this.reset();
  }

  reset() {
    this.domains.fill(FULL);
    this.collapsed = 0;
  }

  /** Tile index if the cell is collapsed to exactly one option, else -1. */
  tileAt(i: number): number {
    const d = this.domains[i];
    if (d !== 0 && (d & (d - 1)) === 0) {
      // single bit set
      return Math.log2(d) | 0;
    }
    return -1;
  }

  /** Perform one collapse + propagation. */
  step(): StepResult {
    const idx = this.pickCell();
    if (idx < 0) return "done";
    this.collapseCell(idx);
    if (!this.propagate(idx)) return "contradiction";
    return "ok";
  }

  /** Lowest-entropy uncollapsed cell (random tie-break), or -1 if all done. */
  private pickCell(): number {
    let best = -1;
    let bestCount = Infinity;
    let bestNoise = 0;
    for (let i = 0; i < this.domains.length; i++) {
      const c = popcount(this.domains[i]);
      if (c <= 1) continue;
      const noise = this.rng();
      if (c < bestCount || (c === bestCount && noise > bestNoise)) {
        best = i;
        bestCount = c;
        bestNoise = noise;
      }
    }
    return best;
  }

  private collapseCell(i: number) {
    const dom = this.domains[i];
    let total = 0;
    for (let b = 0; b < T; b++) if (dom & (1 << b)) total += TILES[b].weight;
    let r = this.rng() * total;
    let chosen = -1;
    for (let b = 0; b < T; b++) {
      if (dom & (1 << b)) {
        r -= TILES[b].weight;
        if (r <= 0) {
          chosen = b;
          break;
        }
      }
    }
    if (chosen < 0) {
      // Fallback to the highest set bit (guards float rounding).
      for (let b = T - 1; b >= 0; b--) if (dom & (1 << b)) { chosen = b; break; }
    }
    this.domains[i] = 1 << chosen;
    this.collapsed++;
  }

  /** Constraint propagation from a changed cell. False on contradiction. */
  private propagate(start: number): boolean {
    const stack = [start];
    while (stack.length) {
      const cell = stack.pop()!;
      const cx = cell % this.w;
      const cy = (cell / this.w) | 0;
      const dom = this.domains[cell];
      for (let d = 0; d < 4; d++) {
        const nx = cx + DX[d];
        const ny = cy + DY[d];
        if (nx < 0 || ny < 0 || nx >= this.w || ny >= this.h) continue;
        const nb = ny * this.w + nx;
        // Tiles allowed in the neighbor given this cell's remaining options.
        let allowed = 0;
        let bits = dom;
        while (bits) {
          const a = 31 - Math.clz32(bits & -bits);
          allowed |= compatMask[d][a];
          bits &= bits - 1;
        }
        const before = this.domains[nb];
        const after = before & allowed;
        if (after === 0) return false;
        if (after !== before) {
          this.domains[nb] = after;
          stack.push(nb);
        }
      }
    }
    return true;
  }
}
