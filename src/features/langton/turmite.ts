export type Turn = "L" | "R" | "U" | "N";

export interface Ant {
  x: number;
  y: number;
  dir: number; // 0=up, 1=right, 2=down, 3=left
}

const DX = [0, 1, 0, -1];
const DY = [-1, 0, 1, 0];

/**
 * Parse a rule string over {L,R,U,N} into a turn table. Each character is the
 * turn the ant makes when standing on a cell of that state; the number of
 * characters is the number of cell states. Junk characters are ignored, and an
 * empty/invalid rule falls back to the classic Langton "RL".
 */
export function parseRule(rule: string): Turn[] {
  const out: Turn[] = [];
  for (const ch of rule.toUpperCase()) {
    if (ch === "L" || ch === "R" || ch === "U" || ch === "N") out.push(ch);
  }
  return out.length >= 2 ? out : ["R", "L"];
}

/** Apply a turn to a direction (0=up,1=right,2=down,3=left). */
export function turn(dir: number, t: Turn): number {
  switch (t) {
    case "R":
      return (dir + 1) & 3;
    case "L":
      return (dir + 3) & 3;
    case "U":
      return (dir + 2) & 3;
    default:
      return dir; // N: straight on
  }
}

/**
 * Advance one ant by a single step on a toroidal grid. Mutates both `grid`
 * (the touched cell advances to its next state) and `ant` (turned and moved),
 * and returns the flat index of the cell that was written, so callers can
 * repaint just that pixel.
 */
export function stepAnt(
  grid: Uint8Array,
  w: number,
  h: number,
  ant: Ant,
  rule: Turn[]
): number {
  const idx = ant.y * w + ant.x;
  const state = grid[idx];
  ant.dir = turn(ant.dir, rule[state]);
  grid[idx] = (state + 1) % rule.length;
  ant.x = (ant.x + DX[ant.dir] + w) % w;
  ant.y = (ant.y + DY[ant.dir] + h) % h;
  return idx;
}

/** HSL (h in degrees, s/l in 0..1) to an [r,g,b] byte triple. */
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = ((h % 360) + 360) % 360 / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r: number;
  let g: number;
  let b: number;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

/**
 * Build a color palette for `n` cell states. State 0 is the dark background;
 * remaining states sweep from matrix green through the spectrum so multi-state
 * turmites read as distinct trails.
 */
export function palette(n: number): [number, number, number][] {
  const out: [number, number, number][] = [[8, 12, 8]];
  for (let i = 1; i < n; i++) {
    const t = (i - 1) / Math.max(1, n - 1);
    // Start near matrix green (135°) and sweep ~300° around the wheel.
    out.push(hslToRgb(135 + t * 300, 0.85, 0.35 + 0.25 * t));
  }
  return out;
}
