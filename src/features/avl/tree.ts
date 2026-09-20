// AVL trees: the same keys, kept shallow.
//
// A binary search tree only answers lookups quickly while it stays bushy. Insert
// already-sorted keys into a plain BST and every key goes right of the last one:
// the "tree" is a linked list and lookups degrade to scanning. An AVL tree
// notices — every node keeps the height of its subtrees, and if they ever differ
// by more than one it rotates to fix it.
//
// A rotation is local and cheap: three pointers move, the in-order sequence is
// untouched, and the subtree gets shorter. Four cases (LL, RR, LR, RL) cover
// every way a node can go out of balance, so the tree is always within about
// 1.44·log₂(n) of perfectly balanced.
//
// Both trees are built here from the same keys so the difference is visible
// rather than asserted.

export interface Node {
  key: number;
  left: Node | null;
  right: Node | null;
  height: number;
}

export function newNode(key: number): Node {
  return { key, left: null, right: null, height: 1 };
}

export function height(node: Node | null): number {
  return node ? node.height : 0;
}

export function balanceFactor(node: Node | null): number {
  return node ? height(node.left) - height(node.right) : 0;
}

function refresh(node: Node): void {
  node.height = 1 + Math.max(height(node.left), height(node.right));
}

export function size(node: Node | null): number {
  return node ? 1 + size(node.left) + size(node.right) : 0;
}

// ── Rotations ────────────────────────────────────────────────────────────────

export type RotationKind = "LL" | "RR" | "LR" | "RL";

export interface Rotation {
  kind: RotationKind;
  pivot: number; // key of the node that was out of balance
  newRoot: number; // key that took its place
}

function rotateRight(node: Node): Node {
  const l = node.left!;
  node.left = l.right;
  l.right = node;
  refresh(node);
  refresh(l);
  return l;
}

function rotateLeft(node: Node): Node {
  const r = node.right!;
  node.right = r.left;
  r.left = node;
  refresh(node);
  refresh(r);
  return r;
}

// ── Insertion ────────────────────────────────────────────────────────────────

export interface InsertResult {
  root: Node | null;
  rotations: Rotation[];
  inserted: boolean;
  path: number[]; // keys compared on the way down
}

export function insertBST(root: Node | null, key: number): InsertResult {
  const path: number[] = [];
  let inserted = false;

  const go = (node: Node | null): Node => {
    if (!node) {
      inserted = true;
      return newNode(key);
    }
    path.push(node.key);
    if (key < node.key) node.left = go(node.left);
    else if (key > node.key) node.right = go(node.right);
    else return node; // duplicate keys are ignored
    refresh(node);
    return node;
  };

  return { root: go(root), rotations: [], inserted, path };
}

export function insertAVL(root: Node | null, key: number): InsertResult {
  const path: number[] = [];
  const rotations: Rotation[] = [];
  let inserted = false;

  const go = (node: Node | null): Node => {
    if (!node) {
      inserted = true;
      return newNode(key);
    }
    path.push(node.key);
    if (key < node.key) node.left = go(node.left);
    else if (key > node.key) node.right = go(node.right);
    else return node;
    refresh(node);

    // Rebalance on the way back up. Only the first unbalanced ancestor can need
    // a rotation after an insert, and fixing it restores the whole tree.
    const bf = balanceFactor(node);
    if (bf > 1) {
      if (balanceFactor(node.left) < 0) {
        // Left-Right: straighten the zig-zag into a line, then rotate.
        node.left = rotateLeft(node.left!);
        const rotated = rotateRight(node);
        rotations.push({ kind: "LR", pivot: node.key, newRoot: rotated.key });
        return rotated;
      }
      const rotated = rotateRight(node);
      rotations.push({ kind: "LL", pivot: node.key, newRoot: rotated.key });
      return rotated;
    }
    if (bf < -1) {
      if (balanceFactor(node.right) > 0) {
        node.right = rotateRight(node.right!);
        const rotated = rotateLeft(node);
        rotations.push({ kind: "RL", pivot: node.key, newRoot: rotated.key });
        return rotated;
      }
      const rotated = rotateLeft(node);
      rotations.push({ kind: "RR", pivot: node.key, newRoot: rotated.key });
      return rotated;
    }
    return node;
  };

  return { root: go(root), rotations, inserted, path };
}

// ── Queries ──────────────────────────────────────────────────────────────────

// Comparisons needed to find a key — the cost balancing is protecting.
export function lookupCost(root: Node | null, key: number): number {
  let steps = 0;
  let node = root;
  while (node) {
    steps++;
    if (key === node.key) return steps;
    node = key < node.key ? node.left : node.right;
  }
  return steps;
}

export function worstLookup(root: Node | null): number {
  return height(root);
}

export function inOrder(root: Node | null): number[] {
  const out: number[] = [];
  const walk = (n: Node | null) => {
    if (!n) return;
    walk(n.left);
    out.push(n.key);
    walk(n.right);
  };
  walk(root);
  return out;
}

// An AVL tree is valid when every node is within one of balanced and every
// height field agrees with the subtrees below it.
export function isValidAVL(root: Node | null): boolean {
  if (!root) return true;
  if (root.height !== 1 + Math.max(height(root.left), height(root.right))) return false;
  if (Math.abs(balanceFactor(root)) > 1) return false;
  return isValidAVL(root.left) && isValidAVL(root.right);
}

// ── Layout ───────────────────────────────────────────────────────────────────

export interface Placed {
  key: number;
  x: number; // in-order index, so no two nodes overlap
  depth: number;
  balance: number;
  parent: { x: number; depth: number } | null;
}

// In-order position across, depth down: the classic tree drawing, and the one
// that makes a degenerate BST look exactly like the linked list it is. A node's
// x is only known after its left subtree has been placed, so each call returns
// its own placement and wires up its children's parent links on the way back.
export function layout(root: Node | null): { nodes: Placed[]; width: number; depth: number } {
  const nodes: Placed[] = [];
  let cursor = 0;
  let maxDepth = 0;

  const place = (node: Node | null, depth: number): Placed | null => {
    if (!node) return null;
    const left = place(node.left, depth + 1);
    const self: Placed = { key: node.key, x: cursor++, depth, balance: balanceFactor(node), parent: null };
    nodes.push(self);
    if (depth > maxDepth) maxDepth = depth;
    const right = place(node.right, depth + 1);
    if (left) left.parent = { x: self.x, depth };
    if (right) right.parent = { x: self.x, depth };
    return self;
  };

  place(root, 0);
  return { nodes, width: Math.max(1, cursor), depth: maxDepth };
}

// ── Key sequences ────────────────────────────────────────────────────────────

export interface Sequence {
  id: string;
  label: string;
  note: string;
  keys: (n: number) => number[];
}

export const SEQUENCES: Sequence[] = [
  {
    id: "sorted",
    label: "sorted",
    note: "the worst case: a plain BST degenerates into a list, the AVL tree shrugs",
    keys: (n) => Array.from({ length: n }, (_, i) => i + 1),
  },
  {
    id: "shuffled",
    label: "shuffled",
    note: "random order — a plain BST does fine on average, just not reliably",
    keys: (n) => {
      const arr = Array.from({ length: n }, (_, i) => i + 1);
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    },
  },
  {
    id: "zigzag",
    label: "zig-zag",
    note: "alternating extremes — the case that needs the double rotations",
    keys: (n) => {
      const out: number[] = [];
      let lo = 1;
      let hi = n;
      while (lo <= hi) {
        out.push(lo++);
        if (lo <= hi) out.push(hi--);
      }
      return out;
    },
  },
  {
    id: "sawtooth",
    label: "sawtooth",
    note: "ascending runs that restart — locally sorted data, as real data often is",
    keys: (n) => {
      const out: number[] = [];
      const run = Math.max(3, Math.floor(n / 5));
      for (let start = 0; start < run; start++) {
        for (let k = start; k < n; k += run) out.push(k + 1);
      }
      return out;
    },
  },
];
