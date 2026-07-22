export interface LSystem {
  axiom: string;
  rules: Record<string, string>;
  angle: number; // degrees
  startAngle: number; // initial heading, degrees (0 = up)
  iterations: number; // default depth
  maxIterations: number;
  stepShrink: number; // step length multiplier per '<' — 1 for none
}

export type PresetId = "plant" | "dragon" | "sierpinski" | "koch" | "bush";

export const PRESETS: Record<PresetId, { label: string; system: LSystem }> = {
  plant: {
    label: "Fern plant",
    system: {
      axiom: "X",
      rules: { X: "F+[[X]-X]-F[-FX]+X", F: "FF" },
      angle: 25,
      startAngle: 0,
      iterations: 5,
      maxIterations: 7,
      stepShrink: 1,
    },
  },
  dragon: {
    label: "Dragon curve",
    system: {
      axiom: "FX",
      rules: { X: "X+YF+", Y: "-FX-Y" },
      angle: 90,
      startAngle: 90,
      iterations: 10,
      maxIterations: 15,
      stepShrink: 1,
    },
  },
  sierpinski: {
    label: "Sierpiński",
    system: {
      axiom: "F-G-G",
      rules: { F: "F-G+F+G-F", G: "GG" },
      angle: 120,
      startAngle: 90,
      iterations: 5,
      maxIterations: 8,
      stepShrink: 1,
    },
  },
  koch: {
    label: "Koch snowflake",
    system: {
      axiom: "F--F--F",
      rules: { F: "F+F--F+F" },
      angle: 60,
      startAngle: 90,
      iterations: 4,
      maxIterations: 6,
      stepShrink: 1,
    },
  },
  bush: {
    label: "Bush",
    system: {
      axiom: "F",
      rules: { F: "FF+[+F-F-F]-[-F+F+F]" },
      angle: 22.5,
      startAngle: 0,
      iterations: 4,
      maxIterations: 5,
      stepShrink: 1,
    },
  },
};

const EXPANSION_CAP = 400_000;

/** Expand the axiom `n` times (capped so deep dragons can't hang the tab). */
export function expand(system: LSystem, n: number): string {
  let s = system.axiom;
  for (let i = 0; i < n; i++) {
    let next = "";
    for (const ch of s) {
      next += system.rules[ch] ?? ch;
      if (next.length > EXPANSION_CAP) return next;
    }
    s = next;
  }
  return s;
}

export interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  depth: number; // bracket nesting depth when drawn (for color)
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Run the turtle over an expanded string. F and G draw, f moves,
 * +/- turn, [ ] push/pop state. Returns segments in unit coordinates.
 */
export function trace(
  s: string,
  angleDeg: number,
  startAngleDeg: number
): { segments: Segment[]; bounds: Bounds } {
  const rad = (d: number) => (d * Math.PI) / 180;
  const turn = rad(angleDeg);
  let x = 0, y = 0;
  // startAngle 0 means "up" on canvas => angle from +x axis is -90deg
  let heading = rad(-90 + startAngleDeg);
  const stack: { x: number; y: number; heading: number; depth: number }[] = [];
  let depth = 0;
  const segments: Segment[] = [];
  const bounds: Bounds = { minX: 0, minY: 0, maxX: 0, maxY: 0 };

  const stretch = (nx: number, ny: number) => {
    if (nx < bounds.minX) bounds.minX = nx;
    if (ny < bounds.minY) bounds.minY = ny;
    if (nx > bounds.maxX) bounds.maxX = nx;
    if (ny > bounds.maxY) bounds.maxY = ny;
  };

  for (const ch of s) {
    if (ch === "F" || ch === "G") {
      const nx = x + Math.cos(heading);
      const ny = y + Math.sin(heading);
      segments.push({ x1: x, y1: y, x2: nx, y2: ny, depth });
      x = nx; y = ny;
      stretch(x, y);
    } else if (ch === "f") {
      x += Math.cos(heading);
      y += Math.sin(heading);
      stretch(x, y);
    } else if (ch === "+") {
      heading += turn;
    } else if (ch === "-") {
      heading -= turn;
    } else if (ch === "[") {
      stack.push({ x, y, heading, depth });
      depth++;
    } else if (ch === "]") {
      const st = stack.pop();
      if (st) { x = st.x; y = st.y; heading = st.heading; depth = st.depth; }
    }
  }
  return { segments, bounds };
}
