// PageRank: the rank of a page is the chance a bored surfer is looking at it.
//
// Follow links at random forever and you spend more time on pages that many
// pages link to — and much more on pages that well-visited pages link to. That
// recursive definition is a fixed point,
//
//   r = d · Mᵀ r + (1 − d)/n
//
// solved here by power iteration: start uniform, apply the rule, repeat until
// nothing moves. The damping factor d is the probability the surfer follows a
// link at all; with probability 1 − d they get bored and teleport somewhere
// random, which is what keeps rank from pooling in dead ends and what makes the
// whole thing converge.
//
// The page runs both readings at once: the linear algebra, and an actual surfer
// whose visit counts drift toward the same numbers.

export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Graph {
  n: number;
  out: number[][]; // out[i] = pages i links to
  inLinks: number[][]; // reverse index, for the update
  pos: [number, number][]; // layout in [0,1]², filled by relaxLayout
}

export interface Topology {
  id: string;
  label: string;
  note: string;
}

export const TOPOLOGIES: Topology[] = [
  {
    id: "web",
    label: "web",
    note: "preferential attachment — links beget links, so rank is wildly unequal",
  },
  {
    id: "uniform",
    label: "uniform",
    note: "links placed at random — rank ends up nearly flat, with no hubs",
  },
  {
    id: "sink",
    label: "dead ends",
    note: "clusters draining into pages that link nowhere — only teleportation gets you out",
  },
  {
    id: "clique",
    label: "link farm",
    note: "a dense clique citing itself, trying to manufacture rank out of nothing",
  },
];

function buildEdges(n: number, topology: string, rnd: () => number): number[][] {
  const out: number[][] = Array.from({ length: n }, () => []);
  const link = (a: number, b: number) => {
    if (a !== b && !out[a].includes(b)) out[a].push(b);
  };

  if (topology === "uniform") {
    for (let i = 0; i < n; i++) {
      const k = 1 + Math.floor(rnd() * 3);
      for (let e = 0; e < k; e++) link(i, Math.floor(rnd() * n));
    }
    return out;
  }

  if (topology === "sink") {
    const sinks = [0, 1];
    for (let i = 2; i < n; i++) {
      const k = 1 + Math.floor(rnd() * 2);
      for (let e = 0; e < k; e++) {
        // Most links drain toward a sink; the rest wander.
        link(i, rnd() < 0.45 ? sinks[Math.floor(rnd() * sinks.length)] : 2 + Math.floor(rnd() * (n - 2)));
      }
    }
    return out; // sinks deliberately link nowhere
  }

  if (topology === "clique") {
    const farm = Math.min(6, Math.max(3, Math.floor(n / 4)));
    for (let i = 0; i < farm; i++) for (let j = 0; j < farm; j++) link(i, j);
    for (let i = farm; i < n; i++) {
      const k = 1 + Math.floor(rnd() * 3);
      for (let e = 0; e < k; e++) link(i, farm + Math.floor(rnd() * (n - farm)));
      // One honest page links into the farm; that single edge is all the rank
      // the farm can ever multiply among itself.
      if (i === farm) link(i, 0);
    }
    return out;
  }

  // "web": preferential attachment — a new page links to existing ones with
  // probability proportional to how many links they already have.
  const targets: number[] = [0];
  for (let i = 1; i < n; i++) {
    const k = Math.min(i, 1 + Math.floor(rnd() * 2));
    for (let e = 0; e < k; e++) {
      const pick = targets[Math.floor(rnd() * targets.length)];
      link(i, pick);
      targets.push(pick);
    }
    targets.push(i);
    if (rnd() < 0.3) link(Math.floor(rnd() * i), i); // an occasional link back out
  }
  return out;
}

export function buildGraph(n: number, topology: string, seed: number): Graph {
  const rnd = makeRng(seed);
  const out = buildEdges(n, topology, rnd);
  const inLinks: number[][] = Array.from({ length: n }, () => []);
  for (let i = 0; i < n; i++) for (const j of out[i]) inLinks[j].push(i);
  const pos: [number, number][] = Array.from({ length: n }, (_, i) => {
    // Seed the layout on a circle so relaxation starts untangled.
    const a = (i / n) * Math.PI * 2;
    return [0.5 + 0.36 * Math.cos(a), 0.5 + 0.36 * Math.sin(a)];
  });
  const g: Graph = { n, out, inLinks, pos };
  relaxLayout(g, 420, seed);
  return g;
}

// Fruchterman-Reingold: every pair repels with k²/d, every edge attracts with
// d²/k, and a little gravity keeps the drawing from drifting apart. Positions
// are fitted to the unit square at the end rather than clamped during the run —
// clamping presses nodes into straight lines along the border.
export function relaxLayout(g: Graph, iterations: number, seed: number): void {
  const rnd = makeRng(seed ^ 0x9e3779b9);
  const n = g.n;
  if (n === 0) return;
  const k = 0.9 * Math.sqrt(1 / n);

  for (let i = 0; i < n; i++) {
    g.pos[i][0] += (rnd() - 0.5) * 0.05;
    g.pos[i][1] += (rnd() - 0.5) * 0.05;
  }

  const dx = new Float64Array(n);
  const dy = new Float64Array(n);
  for (let it = 0; it < iterations; it++) {
    const temp = 0.12 * (1 - it / iterations) + 0.0015;
    dx.fill(0);
    dy.fill(0);

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let ex = g.pos[i][0] - g.pos[j][0];
        let ey = g.pos[i][1] - g.pos[j][1];
        let d = Math.hypot(ex, ey);
        if (d < 1e-4) {
          ex = (rnd() - 0.5) * 1e-3;
          ey = (rnd() - 0.5) * 1e-3;
          d = Math.hypot(ex, ey) || 1e-4;
        }
        const rep = (k * k) / d;
        dx[i] += (ex / d) * rep;
        dy[i] += (ey / d) * rep;
        dx[j] -= (ex / d) * rep;
        dy[j] -= (ey / d) * rep;
      }
    }

    for (let i = 0; i < n; i++) {
      for (const j of g.out[i]) {
        const ex = g.pos[i][0] - g.pos[j][0];
        const ey = g.pos[i][1] - g.pos[j][1];
        const d = Math.max(1e-4, Math.hypot(ex, ey));
        const att = (d * d) / k;
        dx[i] -= (ex / d) * att;
        dy[i] -= (ey / d) * att;
        dx[j] += (ex / d) * att;
        dy[j] += (ey / d) * att;
      }
    }

    for (let i = 0; i < n; i++) {
      // Gravity: without it, components with no edges between them drift apart
      // forever and the drawing scales down to nothing.
      dx[i] += (0.5 - g.pos[i][0]) * 0.22;
      dy[i] += (0.5 - g.pos[i][1]) * 0.22;
      const d = Math.hypot(dx[i], dy[i]) || 1;
      const scale = Math.min(d, temp) / d;
      g.pos[i][0] += dx[i] * scale;
      g.pos[i][1] += dy[i] * scale;
    }
  }

  fitToUnitSquare(g);
}

// Scale and centre the finished layout into [0.06, 0.94]², keeping the aspect
// ratio so the drawing is not stretched.
function fitToUnitSquare(g: Graph): void {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of g.pos) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const spanX = Math.max(1e-6, maxX - minX);
  const spanY = Math.max(1e-6, maxY - minY);
  const scale = 0.88 / Math.max(spanX, spanY);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  for (const pos of g.pos) {
    pos[0] = 0.5 + (pos[0] - cx) * scale;
    pos[1] = 0.5 + (pos[1] - cy) * scale;
  }
}

export function uniformRanks(n: number): Float64Array {
  return new Float64Array(n).fill(1 / n);
}

export interface IterationResult {
  ranks: Float64Array;
  delta: number; // L1 change, the convergence measure
}

// One power-iteration sweep. Pages with no outgoing links would leak rank out of
// the system, so their mass is redistributed as if they linked everywhere —
// exactly what the bored surfer does when they hit a dead end.
export function powerStep(g: Graph, ranks: Float64Array, damping: number): IterationResult {
  const n = g.n;
  const next = new Float64Array(n);
  let dangling = 0;
  for (let i = 0; i < n; i++) if (g.out[i].length === 0) dangling += ranks[i];

  const base = (1 - damping) / n + (damping * dangling) / n;
  for (let i = 0; i < n; i++) {
    let acc = 0;
    for (const j of g.inLinks[i]) acc += ranks[j] / g.out[j].length;
    next[i] = base + damping * acc;
  }

  let delta = 0;
  for (let i = 0; i < n; i++) delta += Math.abs(next[i] - ranks[i]);
  return { ranks: next, delta };
}

export function ranking(ranks: Float64Array): number[] {
  return Array.from(ranks.keys()).sort((a, b) => ranks[b] - ranks[a]);
}

// ── The surfer ──────────────────────────────────────────────────────────────

export interface Surfer {
  at: number;
  visits: Float64Array;
  steps: number;
  teleported: boolean; // whether the last move was a teleport, for drawing
}

export function newSurfer(n: number, start = 0): Surfer {
  const visits = new Float64Array(n);
  visits[start] = 1;
  return { at: start, visits, steps: 1, teleported: false };
}

export function surf(g: Graph, s: Surfer, damping: number): void {
  const links = g.out[s.at];
  // Bored, or standing on a dead end: teleport. Otherwise follow a link.
  if (links.length === 0 || Math.random() > damping) {
    s.at = Math.floor(Math.random() * g.n);
    s.teleported = true;
  } else {
    s.at = links[Math.floor(Math.random() * links.length)];
    s.teleported = false;
  }
  s.visits[s.at]++;
  s.steps++;
}

// How far the surfer's visit frequencies still are from the computed ranks:
// total variation distance, which should fall toward zero.
export function surferError(s: Surfer, ranks: Float64Array): number {
  let err = 0;
  for (let i = 0; i < ranks.length; i++) err += Math.abs(s.visits[i] / s.steps - ranks[i]);
  return err / 2;
}
