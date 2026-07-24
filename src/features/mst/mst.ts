// Minimum spanning tree over points in the plane (complete Euclidean graph),
// via Prim's and Kruskal's algorithms. Both return the same optimal tree, but
// the order they add edges — grow one tree from a seed vs. glue globally-cheapest
// edges across a forest — animates very differently.

export interface Pt {
  x: number;
  y: number;
}

export type Edge = [number, number]; // indices into the point list

export interface MSTResult {
  edges: Edge[]; // in the order the algorithm accepts them
  totalWeight: number;
}

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

/** Prim's algorithm: grow a single tree from node 0, adding the cheapest edge
 *  from the tree to a new node each step. O(n²), fine for a few hundred nodes. */
export function primMST(pts: Pt[]): MSTResult {
  const n = pts.length;
  const edges: Edge[] = [];
  if (n < 2) return { edges, totalWeight: 0 };
  const best = new Float64Array(n).fill(Infinity);
  const parent = new Int32Array(n).fill(-1);
  const inTree = new Uint8Array(n);
  best[0] = 0;
  let total = 0;

  for (let iter = 0; iter < n; iter++) {
    let u = -1;
    let bd = Infinity;
    for (let v = 0; v < n; v++) {
      if (!inTree[v] && best[v] < bd) {
        bd = best[v];
        u = v;
      }
    }
    if (u < 0) break;
    inTree[u] = 1;
    if (parent[u] >= 0) {
      edges.push([parent[u], u]);
      total += bd;
    }
    for (let v = 0; v < n; v++) {
      if (!inTree[v]) {
        const d = dist(pts[u], pts[v]);
        if (d < best[v]) {
          best[v] = d;
          parent[v] = u;
        }
      }
    }
  }
  return { edges, totalWeight: total };
}

/** Kruskal's algorithm: sort all edges, accept each if it joins two different
 *  components (union-find). Accepted edges are returned in cheapest-first order. */
export function kruskalMST(pts: Pt[]): MSTResult {
  const n = pts.length;
  const edges: Edge[] = [];
  if (n < 2) return { edges, totalWeight: 0 };

  const all: { i: number; j: number; w: number }[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) all.push({ i, j, w: dist(pts[i], pts[j]) });
  }
  all.sort((a, b) => a.w - b.w);

  const par = new Int32Array(n);
  for (let i = 0; i < n; i++) par[i] = i;
  const find = (x: number): number => {
    while (par[x] !== x) {
      par[x] = par[par[x]];
      x = par[x];
    }
    return x;
  };

  let total = 0;
  for (const e of all) {
    const ri = find(e.i);
    const rj = find(e.j);
    if (ri !== rj) {
      par[ri] = rj;
      edges.push([e.i, e.j]);
      total += e.w;
      if (edges.length === n - 1) break;
    }
  }
  return { edges, totalWeight: total };
}
