// Skip lists: a balanced structure that never balances anything.
//
// An AVL tree (see /avl) stays shallow by measuring its own height and rotating
// when it drifts. A skip list reaches the same O(log n) by flipping a coin.
//
// Start with a sorted linked list. Every node gets promoted to the next level
// up with probability p, so about half the nodes have a second pointer, a
// quarter have a third, and so on. The top levels are express lanes that skip
// most of the list; a search walks right along the highest lane until the next
// node would overshoot, drops a level, and repeats. Each level roughly halves
// what remains, so a search costs O(log n) expected — not guaranteed, expected.
//
// That trade is the point. There is no rebalancing, no rotation cases, and
// concurrent implementations are far simpler than a balanced tree's, which is
// why skip lists show up inside databases. The price is that the guarantee is
// probabilistic: a run of unlucky coin flips makes a slow structure, and the
// only defence is that it is vanishingly unlikely at any useful size.

export const MAX_LEVEL = 12;
export const DEFAULT_P = 0.5;

export interface Node {
  key: number;
  // forward[i] is the next node on level i, or null at the end of that lane.
  forward: (Node | null)[];
  level: number;
}

export interface SkipList {
  head: Node; // sentinel, carries MAX_LEVEL pointers and no key
  level: number; // highest level currently in use
  size: number;
  p: number;
  rng: () => number;
}

export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function newList(p = DEFAULT_P, seed = 1): SkipList {
  return {
    head: { key: -Infinity, forward: new Array(MAX_LEVEL).fill(null), level: MAX_LEVEL },
    level: 1,
    size: 0,
    p,
    rng: makeRng(seed),
  };
}

// Keep flipping while the coin says yes: level 1 always, level 2 with
// probability p, level 3 with p², and so on.
export function randomLevel(list: SkipList): number {
  let level = 1;
  while (list.rng() < list.p && level < MAX_LEVEL) level++;
  return level;
}

export interface SearchResult {
  found: boolean;
  node: Node | null;
  // The route taken, for drawing: which node the search sat on at each level.
  path: { level: number; from: Node; to: Node | null }[];
  comparisons: number;
}

// Walk right while the next key is smaller than the target, then drop a level.
export function search(list: SkipList, key: number): SearchResult {
  const path: SearchResult["path"] = [];
  let comparisons = 0;
  let current = list.head;

  for (let level = list.level - 1; level >= 0; level--) {
    while (current.forward[level] !== null) {
      comparisons++;
      if (current.forward[level]!.key >= key) break;
      path.push({ level, from: current, to: current.forward[level] });
      current = current.forward[level]!;
    }
    path.push({ level, from: current, to: current.forward[level] });
  }

  const candidate = current.forward[0];
  if (candidate && candidate.key === key) return { found: true, node: candidate, path, comparisons };
  return { found: false, node: null, path, comparisons };
}

// The node immediately before the target on every level — where new pointers
// have to be spliced in.
function predecessors(list: SkipList, key: number): Node[] {
  const update: Node[] = new Array(MAX_LEVEL).fill(list.head);
  let current = list.head;
  for (let level = list.level - 1; level >= 0; level--) {
    while (current.forward[level] !== null && current.forward[level]!.key < key) {
      current = current.forward[level]!;
    }
    update[level] = current;
  }
  return update;
}

export interface InsertResult {
  inserted: boolean;
  level: number; // the coin-flipped height of the new node
  node: Node | null;
}

export function insert(list: SkipList, key: number): InsertResult {
  const update = predecessors(list, key);
  const existing = update[0].forward[0];
  if (existing && existing.key === key) return { inserted: false, level: existing.level, node: existing };

  const level = randomLevel(list);
  if (level > list.level) {
    // New express lanes start at the sentinel.
    for (let i = list.level; i < level; i++) update[i] = list.head;
    list.level = level;
  }

  const node: Node = { key, forward: new Array(level).fill(null), level };
  for (let i = 0; i < level; i++) {
    node.forward[i] = update[i].forward[i];
    update[i].forward[i] = node;
  }
  list.size++;
  return { inserted: true, level, node };
}

export function remove(list: SkipList, key: number): boolean {
  const update = predecessors(list, key);
  const target = update[0].forward[0];
  if (!target || target.key !== key) return false;

  for (let i = 0; i < list.level; i++) {
    if (update[i].forward[i] === target) update[i].forward[i] = target.forward[i];
  }
  // Drop any express lanes that just emptied.
  while (list.level > 1 && list.head.forward[list.level - 1] === null) list.level--;
  list.size--;
  return true;
}

export function toArray(list: SkipList): number[] {
  const out: number[] = [];
  let current = list.head.forward[0];
  while (current) {
    out.push(current.key);
    current = current.forward[0];
  }
  return out;
}

// Every node on a given level, for drawing the lanes.
export function lane(list: SkipList, level: number): Node[] {
  const out: Node[] = [];
  let current = list.head.forward[level];
  while (current) {
    out.push(current);
    current = current.forward[level];
  }
  return out;
}

export function levelCounts(list: SkipList): number[] {
  const counts = new Array(MAX_LEVEL).fill(0);
  let current = list.head.forward[0];
  while (current) {
    counts[current.level - 1]++;
    current = current.forward[0];
  }
  return counts;
}

// A sorted linked list with no express lanes: what a skip list degenerates to
// when every coin flip comes up tails, and the thing it is beating.
export function linearComparisons(list: SkipList, key: number): number {
  let comparisons = 0;
  let current = list.head.forward[0];
  while (current) {
    comparisons++;
    if (current.key >= key) break;
    current = current.forward[0];
  }
  return comparisons;
}

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
    note: "ascending input — fatal for a plain BST, irrelevant here: the coin does not care",
    keys: (n) => Array.from({ length: n }, (_, i) => (i + 1) * 2),
  },
  {
    id: "shuffled",
    label: "shuffled",
    note: "random order, which changes nothing either — the structure is built from coin flips",
    keys: (n) => {
      const arr = Array.from({ length: n }, (_, i) => (i + 1) * 2);
      const rng = makeRng(99);
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    },
  },
  {
    id: "clustered",
    label: "clustered",
    note: "keys bunched into a narrow range — still nothing to rebalance",
    keys: (n) => Array.from({ length: n }, (_, i) => 100 + (i % 10) * 2 + Math.floor(i / 10) * 21),
  },
];
