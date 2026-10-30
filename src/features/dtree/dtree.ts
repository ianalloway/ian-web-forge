// A CART-style decision tree for 2-D points. At each node it searches both axes
// for the single straight cut that most reduces Gini impurity, then recurses —
// so the decision boundary is always a union of axis-aligned rectangles, the
// characteristic "staircase" that tells a tree apart from a smooth classifier.

export interface LabeledPt {
  x: number;
  y: number;
  label: number; // 0 .. numClasses-1
}

export type Tree =
  | { kind: "leaf"; label: number; counts: number[]; n: number }
  | {
      kind: "split";
      feature: 0 | 1; // 0 = split on x, 1 = split on y
      threshold: number; // left: value < threshold, right: value ≥ threshold
      left: Tree;
      right: Tree;
      counts: number[];
      n: number;
    };

export const CLASS_COLORS = ["#00ff41", "#00cfff", "#ff6b35", "#ff4da6", "#ffe066"];

export function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function classCounts(points: LabeledPt[], numClasses: number): number[] {
  const counts = new Array(numClasses).fill(0);
  for (const p of points) counts[p.label]++;
  return counts;
}

/** Gini impurity of a label distribution: 0 when pure, (C-1)/C at uniform. */
export function gini(counts: number[], n: number): number {
  if (n === 0) return 0;
  let s = 0;
  for (const c of counts) {
    const p = c / n;
    s += p * p;
  }
  return 1 - s;
}

function majority(counts: number[]): number {
  let best = 0;
  for (let i = 1; i < counts.length; i++) if (counts[i] > counts[best]) best = i;
  return best;
}

export interface Split {
  feature: 0 | 1;
  threshold: number;
  gain: number; // impurity decrease
}

/** The axis-aligned cut that most reduces Gini, or null if none helps. */
export function bestSplit(points: LabeledPt[], numClasses: number): Split | null {
  const n = points.length;
  if (n < 2) return null;
  const parent = gini(classCounts(points, numClasses), n);
  let best: Split | null = null;

  for (const feature of [0, 1] as const) {
    const sorted = [...points].sort((a, b) =>
      feature === 0 ? a.x - b.x : a.y - b.y
    );
    const left = new Array(numClasses).fill(0);
    const right = classCounts(points, numClasses);
    for (let i = 0; i < n - 1; i++) {
      const lbl = sorted[i].label;
      left[lbl]++;
      right[lbl]--;
      const cur = feature === 0 ? sorted[i].x : sorted[i].y;
      const nxt = feature === 0 ? sorted[i + 1].x : sorted[i + 1].y;
      if (cur === nxt) continue; // can't cut between identical coordinates
      const nl = i + 1;
      const nr = n - nl;
      const weighted = (nl / n) * gini(left, nl) + (nr / n) * gini(right, nr);
      const gain = parent - weighted;
      if (!best || gain > best.gain) {
        best = { feature, threshold: (cur + nxt) / 2, gain };
      }
    }
  }
  return best && best.gain > 1e-12 ? best : null;
}

export interface BuildOpts {
  maxDepth: number;
  minLeaf: number; // minimum points to attempt a split
  numClasses: number;
}

export function build(points: LabeledPt[], opts: BuildOpts, depth = 0): Tree {
  const counts = classCounts(points, opts.numClasses);
  const n = points.length;
  const leaf = (): Tree => ({ kind: "leaf", label: majority(counts), counts, n });

  if (depth >= opts.maxDepth || n < opts.minLeaf || gini(counts, n) === 0) return leaf();
  const split = bestSplit(points, opts.numClasses);
  if (!split) return leaf();

  const left: LabeledPt[] = [];
  const right: LabeledPt[] = [];
  for (const p of points) {
    const v = split.feature === 0 ? p.x : p.y;
    (v < split.threshold ? left : right).push(p);
  }
  if (left.length === 0 || right.length === 0) return leaf();

  return {
    kind: "split",
    feature: split.feature,
    threshold: split.threshold,
    left: build(left, opts, depth + 1),
    right: build(right, opts, depth + 1),
    counts,
    n,
  };
}

export function predict(tree: Tree, x: number, y: number): number {
  let node = tree;
  while (node.kind === "split") {
    const v = node.feature === 0 ? x : y;
    node = v < node.threshold ? node.left : node.right;
  }
  return node.label;
}

export function leafCount(tree: Tree): number {
  return tree.kind === "leaf" ? 1 : leafCount(tree.left) + leafCount(tree.right);
}

export function treeDepth(tree: Tree): number {
  return tree.kind === "leaf" ? 0 : 1 + Math.max(treeDepth(tree.left), treeDepth(tree.right));
}

export function accuracy(tree: Tree, points: LabeledPt[]): number {
  if (points.length === 0) return 1;
  let correct = 0;
  for (const p of points) if (predict(tree, p.x, p.y) === p.label) correct++;
  return correct / points.length;
}

export interface Region {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  label: number;
  counts: number[];
  n: number;
}

/** Tile a rectangle into the leaf regions the tree carves it into. */
export function leafRegions(tree: Tree, x0: number, y0: number, x1: number, y1: number): Region[] {
  if (tree.kind === "leaf") {
    return [{ x0, y0, x1, y1, label: tree.label, counts: tree.counts, n: tree.n }];
  }
  if (tree.feature === 0) {
    const t = Math.max(x0, Math.min(x1, tree.threshold));
    return [
      ...leafRegions(tree.left, x0, y0, t, y1),
      ...leafRegions(tree.right, t, y0, x1, y1),
    ];
  }
  const t = Math.max(y0, Math.min(y1, tree.threshold));
  return [
    ...leafRegions(tree.left, x0, y0, x1, t),
    ...leafRegions(tree.right, x0, t, x1, y1),
  ];
}

export type DatasetId = "blobs" | "xor" | "circles" | "spiral";

export const DATASETS: Record<DatasetId, { label: string; classes: number }> = {
  blobs: { label: "2 blobs", classes: 2 },
  xor: { label: "XOR", classes: 2 },
  circles: { label: "Rings", classes: 2 },
  spiral: { label: "Spiral", classes: 2 },
};

export function makeDataset(
  id: DatasetId,
  w: number,
  h: number,
  rng: () => number = Math.random
): LabeledPt[] {
  const pts: LabeledPt[] = [];
  const g = () => {
    const u = rng() || 1e-9;
    const v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const clamp = (p: LabeledPt): LabeledPt => ({
    x: Math.max(12, Math.min(w - 12, p.x)),
    y: Math.max(12, Math.min(h - 12, p.y)),
    label: p.label,
  });
  if (id === "blobs") {
    for (let i = 0; i < 90; i++) pts.push(clamp({ x: w * 0.33 + g() * w * 0.08, y: h * 0.4 + g() * h * 0.1, label: 0 }));
    for (let i = 0; i < 90; i++) pts.push(clamp({ x: w * 0.68 + g() * w * 0.08, y: h * 0.6 + g() * h * 0.1, label: 1 }));
  } else if (id === "xor") {
    const cs = [
      { x: w * 0.3, y: h * 0.3, label: 0 },
      { x: w * 0.7, y: h * 0.7, label: 0 },
      { x: w * 0.7, y: h * 0.3, label: 1 },
      { x: w * 0.3, y: h * 0.7, label: 1 },
    ];
    for (const c of cs) for (let i = 0; i < 55; i++) pts.push(clamp({ x: c.x + g() * w * 0.07, y: c.y + g() * h * 0.09, label: c.label }));
  } else if (id === "circles") {
    const cx = w / 2;
    const cy = h / 2;
    const R = Math.min(w, h) * 0.34;
    for (let i = 0; i < 110; i++) {
      const a = rng() * Math.PI * 2;
      const r = R + g() * R * 0.07;
      pts.push(clamp({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, label: 0 }));
    }
    for (let i = 0; i < 80; i++) pts.push(clamp({ x: cx + g() * R * 0.28, y: cy + g() * R * 0.28, label: 1 }));
  } else {
    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.min(w, h) * 0.42;
    for (let c = 0; c < 2; c++) {
      for (let i = 0; i < 110; i++) {
        const t = i / 110;
        const a = t * Math.PI * 2.3 + c * Math.PI;
        const r = t * maxR;
        pts.push(clamp({ x: cx + Math.cos(a) * r + g() * 8, y: cy + Math.sin(a) * r + g() * 8, label: c }));
      }
    }
  }
  return pts;
}
