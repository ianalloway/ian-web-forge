// A binary heap: a complete binary tree packed into an array, where every parent
// sits above its children (smallest on top for a min-heap, largest for a max-heap).
// That one invariant makes the top element O(1) to read and O(log n) to remove,
// which is all a priority queue needs — and heapsort falls out of it for free.
//
// The operations are written as generators that mutate the array and yield the
// cells they are comparing or swapping, so the page can step through them one
// swap at a time; plain wrappers drain a generator for callers that just want the
// result.

export const parent = (i: number): number => (i - 1) >> 1;
export const left = (i: number): number => 2 * i + 1;
export const right = (i: number): number => 2 * i + 2;

/** Should `a` sit above `b`? (min-heap: smaller is higher). */
const above = (a: number, b: number, min: boolean): boolean => (min ? a < b : a > b);

function swap(arr: number[], i: number, j: number): void {
  const t = arr[i];
  arr[i] = arr[j];
  arr[j] = t;
}

export interface HeapStep {
  active: number[]; // the node currently moving
  compare: number[]; // node(s) being compared against
  sorted: number; // elements already fixed at the tail (heapsort)
}

function* siftDown(arr: number[], i: number, bound: number, min: boolean, sorted: number): Generator<HeapStep> {
  for (;;) {
    const l = left(i);
    const r = right(i);
    let top = i;
    if (l < bound) {
      yield { active: [i], compare: [l], sorted };
      if (above(arr[l], arr[top], min)) top = l;
    }
    if (r < bound) {
      yield { active: [i], compare: [r], sorted };
      if (above(arr[r], arr[top], min)) top = r;
    }
    if (top === i) break;
    swap(arr, i, top);
    yield { active: [i, top], compare: [], sorted };
    i = top;
  }
}

export function* insertAnim(arr: number[], v: number, min: boolean): Generator<HeapStep> {
  arr.push(v);
  let i = arr.length - 1;
  yield { active: [i], compare: [], sorted: 0 };
  while (i > 0) {
    const p = parent(i);
    yield { active: [i], compare: [p], sorted: 0 };
    if (!above(arr[i], arr[p], min)) break;
    swap(arr, i, p);
    i = p;
    yield { active: [i], compare: [], sorted: 0 };
  }
}

export function* extractAnim(arr: number[], min: boolean): Generator<HeapStep, number | undefined> {
  if (arr.length === 0) return undefined;
  const top = arr[0];
  const last = arr.pop()!;
  if (arr.length > 0) {
    arr[0] = last;
    yield { active: [0], compare: [], sorted: 0 };
    yield* siftDown(arr, 0, arr.length, min, 0);
  }
  return top;
}

export function* heapifyAnim(arr: number[], min: boolean): Generator<HeapStep> {
  for (let i = (arr.length >> 1) - 1; i >= 0; i--) yield* siftDown(arr, i, arr.length, min, 0);
}

/** Heapsort in place: build a heap, then swap the top to the tail and re-sift. */
export function* heapsortAnim(arr: number[], min: boolean): Generator<HeapStep> {
  const n = arr.length;
  for (let i = (n >> 1) - 1; i >= 0; i--) yield* siftDown(arr, i, n, min, 0);
  for (let end = n; end > 1; end--) {
    swap(arr, 0, end - 1);
    yield { active: [0, end - 1], compare: [], sorted: n - end + 1 };
    yield* siftDown(arr, 0, end - 1, min, n - end + 1);
  }
  yield { active: [], compare: [], sorted: n };
}

function drain<T>(g: Generator<HeapStep, T>): T {
  let r = g.next();
  while (!r.done) r = g.next();
  return r.value;
}

// ── Plain wrappers (used by tests and for non-animated calls) ────────────────

export function insert(arr: number[], v: number, min: boolean): void {
  drain(insertAnim(arr, v, min));
}
export function extractTop(arr: number[], min: boolean): number | undefined {
  return drain(extractAnim(arr, min));
}
export function heapify(arr: number[], min: boolean): void {
  drain(heapifyAnim(arr, min));
}
/** Sorts a copy and returns it (ascending for a max-heap, descending for a min-heap). */
export function heapsort(input: number[], min: boolean): number[] {
  const arr = [...input];
  drain(heapsortAnim(arr, min));
  return arr;
}

export function isHeap(arr: number[], min: boolean): boolean {
  for (let i = 0; i < arr.length; i++) {
    const l = left(i);
    const r = right(i);
    if (l < arr.length && above(arr[l], arr[i], min)) return false;
    if (r < arr.length && above(arr[r], arr[i], min)) return false;
  }
  return true;
}

export function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomValues(n: number, rng: () => number = Math.random): number[] {
  return Array.from({ length: n }, () => 1 + Math.floor(rng() * 98));
}
