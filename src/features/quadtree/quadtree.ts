// Quadtrees: not checking the things you do not need to check.
//
// Asking "which points are inside this box?" by testing every point is O(n) per
// query, and O(n²) if every point asks about every other — which is exactly
// what a naive collision check does. A quadtree stores points in a tree of
// nested squares, so a query can reject a whole square, and everything in it,
// with one rectangle overlap test.
//
// The saving is not a constant factor trick: it changes what the work depends
// on. A range query costs roughly the number of points it returns plus the
// nodes along the boundary, so a small query stays cheap no matter how many
// points exist in total.
//
// The counters here are the point of the module: every candidate a query
// actually examines is counted, for the tree and for brute force, so the two
// can be compared rather than asserted.

export interface Point {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface Rect {
  x: number; // centre
  y: number;
  hw: number; // half-width
  hh: number; // half-height
}

export function contains(r: Rect, p: Point): boolean {
  return p.x >= r.x - r.hw && p.x <= r.x + r.hw && p.y >= r.y - r.hh && p.y <= r.y + r.hh;
}

export function intersects(a: Rect, b: Rect): boolean {
  return !(
    b.x - b.hw > a.x + a.hw ||
    b.x + b.hw < a.x - a.hw ||
    b.y - b.hh > a.y + a.hh ||
    b.y + b.hh < a.y - a.hh
  );
}

export interface Node {
  bounds: Rect;
  points: Point[];
  divided: boolean;
  depth: number;
  nw?: Node;
  ne?: Node;
  sw?: Node;
  se?: Node;
}

export const MAX_DEPTH = 8;

export function newNode(bounds: Rect, depth = 0): Node {
  return { bounds, points: [], divided: false, depth };
}

function subdivide(node: Node): void {
  const { x, y, hw, hh } = node.bounds;
  const w = hw / 2;
  const h = hh / 2;
  const d = node.depth + 1;
  node.nw = newNode({ x: x - w, y: y - h, hw: w, hh: h }, d);
  node.ne = newNode({ x: x + w, y: y - h, hw: w, hh: h }, d);
  node.sw = newNode({ x: x - w, y: y + h, hw: w, hh: h }, d);
  node.se = newNode({ x: x + w, y: y + h, hw: w, hh: h }, d);
  node.divided = true;

  // Push the points already here down into the children, so a node either
  // holds points or has children, never both.
  const existing = node.points;
  node.points = [];
  for (const p of existing) insertInto(node, p);
}

export function insertInto(node: Node, p: Point, capacity = 4): boolean {
  if (!contains(node.bounds, p)) return false;

  if (!node.divided) {
    // A depth cap matters: without it, duplicate or near-duplicate points
    // subdivide forever and the build never terminates.
    if (node.points.length < capacity || node.depth >= MAX_DEPTH) {
      node.points.push(p);
      return true;
    }
    subdivide(node);
  }

  return (
    insertInto(node.nw!, p, capacity) ||
    insertInto(node.ne!, p, capacity) ||
    insertInto(node.sw!, p, capacity) ||
    insertInto(node.se!, p, capacity)
  );
}

export function build(points: Point[], bounds: Rect, capacity: number): Node {
  const root = newNode(bounds);
  for (const p of points) insertInto(root, p, capacity);
  return root;
}

export function countNodes(node: Node): number {
  if (!node.divided) return 1;
  return 1 + countNodes(node.nw!) + countNodes(node.ne!) + countNodes(node.sw!) + countNodes(node.se!);
}

export function depthOf(node: Node): number {
  if (!node.divided) return node.depth;
  return Math.max(depthOf(node.nw!), depthOf(node.ne!), depthOf(node.sw!), depthOf(node.se!));
}

// ── Queries ─────────────────────────────────────────────────────────────────

export interface QueryResult {
  found: Point[];
  checks: number; // individual points examined
  nodesVisited: Node[]; // for drawing what the query actually touched
  nodesRejected: number; // whole subtrees dismissed by one overlap test
}

export function queryRange(root: Node, range: Rect): QueryResult {
  const found: Point[] = [];
  const nodesVisited: Node[] = [];
  let checks = 0;
  let nodesRejected = 0;

  const visit = (node: Node) => {
    if (!intersects(node.bounds, range)) {
      nodesRejected++;
      return; // one test dismisses everything below here
    }
    nodesVisited.push(node);
    for (const p of node.points) {
      checks++;
      if (contains(range, p)) found.push(p);
    }
    if (node.divided) {
      visit(node.nw!);
      visit(node.ne!);
      visit(node.sw!);
      visit(node.se!);
    }
  };

  visit(root);
  return { found, checks, nodesVisited, nodesRejected };
}

export function bruteForceRange(points: Point[], range: Rect): QueryResult {
  const found: Point[] = [];
  for (const p of points) if (contains(range, p)) found.push(p);
  return { found, checks: points.length, nodesVisited: [], nodesRejected: 0 };
}

export interface NearestResult {
  point: Point | null;
  distance: number;
  checks: number;
}

// Nearest neighbour, searching the most promising quadrant first and pruning
// any node whose bounding box is already further away than the best found.
export function nearest(root: Node, x: number, y: number): NearestResult {
  let best: Point | null = null;
  let bestDist = Infinity;
  let checks = 0;

  const boxDistance = (r: Rect): number => {
    const dx = Math.max(Math.abs(x - r.x) - r.hw, 0);
    const dy = Math.max(Math.abs(y - r.y) - r.hh, 0);
    return Math.hypot(dx, dy);
  };

  const visit = (node: Node) => {
    if (boxDistance(node.bounds) > bestDist) return;
    for (const p of node.points) {
      checks++;
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < bestDist) {
        bestDist = d;
        best = p;
      }
    }
    if (node.divided) {
      const children = [node.nw!, node.ne!, node.sw!, node.se!];
      children.sort((a, b) => boxDistance(a.bounds) - boxDistance(b.bounds));
      for (const child of children) visit(child);
    }
  };

  visit(root);
  return { point: best, distance: bestDist, checks };
}

export function bruteForceNearest(points: Point[], x: number, y: number): NearestResult {
  let best: Point | null = null;
  let bestDist = Infinity;
  for (const p of points) {
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  }
  return { point: best, distance: bestDist, checks: points.length };
}

// ── Moving points ───────────────────────────────────────────────────────────

export const WORLD = 1000;

export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Distribution {
  id: string;
  label: string;
  note: string;
  place: (count: number, rng: () => number) => Point[];
}

const drift = (rng: () => number) => (rng() - 0.5) * 1.1;

export const DISTRIBUTIONS: Distribution[] = [
  {
    id: "uniform",
    label: "uniform",
    note: "points spread evenly — the tree stays shallow and balanced",
    place: (count, rng) =>
      Array.from({ length: count }, () => ({
        x: rng() * WORLD,
        y: rng() * WORLD,
        vx: drift(rng),
        vy: drift(rng),
      })),
  },
  {
    id: "clustered",
    label: "clustered",
    note: "a few dense clumps — the tree subdivides deeply only where it must",
    place: (count, rng) => {
      const centres = Array.from({ length: 5 }, () => [rng() * WORLD, rng() * WORLD]);
      return Array.from({ length: count }, () => {
        const [cx, cy] = centres[Math.floor(rng() * centres.length)];
        return {
          x: clamp(cx + (rng() - 0.5) * WORLD * 0.14),
          y: clamp(cy + (rng() - 0.5) * WORLD * 0.14),
          vx: drift(rng),
          vy: drift(rng),
        };
      });
    },
  },
  {
    id: "diagonal",
    label: "diagonal",
    note: "a thin band — most of the tree is empty, and empty nodes are free to skip",
    place: (count, rng) =>
      Array.from({ length: count }, () => {
        const t = rng();
        return {
          x: clamp(t * WORLD + (rng() - 0.5) * 70),
          y: clamp(t * WORLD + (rng() - 0.5) * 70),
          vx: drift(rng),
          vy: drift(rng),
        };
      }),
  },
  {
    id: "corner",
    label: "one corner",
    note: "everything crammed into a corner — the worst case for a fixed-capacity tree",
    place: (count, rng) =>
      Array.from({ length: count }, () => ({
        x: rng() * WORLD * 0.18,
        y: rng() * WORLD * 0.18,
        vx: drift(rng),
        vy: drift(rng),
      })),
  },
];

function clamp(v: number): number {
  return Math.max(1, Math.min(WORLD - 1, v));
}

// Points bounce off the walls, so the set stays inside the root bounds and the
// tree can be rebuilt every frame without anything escaping it.
export function movePoints(points: Point[]): void {
  for (const p of points) {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 1) {
      p.x = 1;
      p.vx = Math.abs(p.vx);
    } else if (p.x > WORLD - 1) {
      p.x = WORLD - 1;
      p.vx = -Math.abs(p.vx);
    }
    if (p.y < 1) {
      p.y = 1;
      p.vy = Math.abs(p.vy);
    } else if (p.y > WORLD - 1) {
      p.y = WORLD - 1;
      p.vy = -Math.abs(p.vy);
    }
  }
}

export const WORLD_BOUNDS: Rect = { x: WORLD / 2, y: WORLD / 2, hw: WORLD / 2, hh: WORLD / 2 };
