// Consistent hashing: adding a server without moving everything.
//
// The obvious way to spread keys over n servers is `hash(key) % n`. It works
// until n changes: go from 4 servers to 5 and the modulus changes for almost
// every key, so roughly 4/5 of the cache is suddenly in the wrong place. For a
// cache in front of a database that is not a slow morning, it is an outage.
//
// Consistent hashing puts servers and keys on the same circle. A key belongs to
// the first server clockwise from it. Adding a server inserts one new point on
// the circle, and only the keys in the arc behind it move — about 1/n of them.
// Removing one hands its arc to the next server along and touches nothing else.
//
// The catch is that a handful of random points divide a circle very unevenly,
// so each server is placed at many positions ("virtual nodes"). The spread of
// the load then falls like 1/sqrt(replicas), which is what makes the idea
// usable rather than merely elegant.

export function hash(key: string): number {
  let h = 0x811c9dc5 >>> 0;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  return h >>> 0;
}

export const RING_SIZE = 2 ** 32;

export interface Placement {
  position: number; // 0 .. RING_SIZE-1
  node: string;
  replica: number;
}

export interface Ring {
  nodes: string[];
  replicas: number; // virtual nodes per server
  placements: Placement[]; // sorted by position
}

export function newRing(replicas: number, nodes: string[] = []): Ring {
  const ring: Ring = { nodes: [], replicas, placements: [] };
  for (const node of nodes) addNode(ring, node);
  return ring;
}

export function addNode(ring: Ring, node: string): void {
  if (ring.nodes.includes(node)) return;
  ring.nodes.push(node);
  for (let r = 0; r < ring.replicas; r++) {
    ring.placements.push({ position: hash(`${node}#${r}`), node, replica: r });
  }
  ring.placements.sort((a, b) => a.position - b.position);
}

export function removeNode(ring: Ring, node: string): void {
  ring.nodes = ring.nodes.filter((n) => n !== node);
  ring.placements = ring.placements.filter((p) => p.node !== node);
}

export function clone(ring: Ring): Ring {
  return {
    nodes: ring.nodes.slice(),
    replicas: ring.replicas,
    placements: ring.placements.map((p) => ({ ...p })),
  };
}

// The first placement clockwise from the key, wrapping past the top of the
// circle back to the first one.
export function lookup(ring: Ring, key: string): string | null {
  if (ring.placements.length === 0) return null;
  const h = hash(key);
  let lo = 0;
  let hi = ring.placements.length - 1;
  if (h > ring.placements[hi].position) return ring.placements[0].node;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (ring.placements[mid].position < h) lo = mid + 1;
    else hi = mid;
  }
  return ring.placements[lo].node;
}

// What everyone writes first, and the thing being argued against.
export function naiveLookup(nodes: string[], key: string): string | null {
  if (nodes.length === 0) return null;
  return nodes[hash(key) % nodes.length];
}

export function distribution(ring: Ring, keys: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const node of ring.nodes) counts.set(node, 0);
  for (const key of keys) {
    const node = lookup(ring, key);
    if (node) counts.set(node, (counts.get(node) ?? 0) + 1);
  }
  return counts;
}

// The fraction of keys that change owner between two rings — the number the
// whole technique exists to keep small.
export function remapFraction(before: Ring, after: Ring, keys: string[]): number {
  if (keys.length === 0) return 0;
  let moved = 0;
  for (const key of keys) if (lookup(before, key) !== lookup(after, key)) moved++;
  return moved / keys.length;
}

export function naiveRemapFraction(before: string[], after: string[], keys: string[]): number {
  if (keys.length === 0) return 0;
  let moved = 0;
  for (const key of keys) if (naiveLookup(before, key) !== naiveLookup(after, key)) moved++;
  return moved / keys.length;
}

// How lumpy the load is: the standard deviation of each server's share,
// relative to a perfectly even split.
export function loadImbalance(ring: Ring, keys: string[]): number {
  if (ring.nodes.length === 0 || keys.length === 0) return 0;
  const counts = [...distribution(ring, keys).values()];
  const mean = keys.length / ring.nodes.length;
  const variance = counts.reduce((acc, c) => acc + (c - mean) ** 2, 0) / counts.length;
  return Math.sqrt(variance) / mean;
}

export function makeKeys(count: number, prefix = "key"): string[] {
  return Array.from({ length: count }, (_, i) => `${prefix}-${i}`);
}

export const NODE_NAMES = [
  "alpha",
  "bravo",
  "charlie",
  "delta",
  "echo",
  "foxtrot",
  "golf",
  "hotel",
];
