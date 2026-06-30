export type AlgoId = "bubble" | "insertion" | "selection" | "merge" | "quick";

export const ALGO_LABELS: Record<AlgoId, string> = {
  bubble: "Bubble",
  insertion: "Insertion",
  selection: "Selection",
  merge: "Merge",
  quick: "Quick",
};

export const ALGO_IDS: AlgoId[] = [
  "bubble",
  "insertion",
  "selection",
  "merge",
  "quick",
];

export interface SortStep {
  arr: number[];
  hi: [number, number] | null;
}

type Snap = (hi: [number, number] | null) => void;

function bubbleAlgo(a: number[], snap: Snap) {
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      snap([j, j + 1]);
      if (a[j] > a[j + 1]) {
        const t = a[j]; a[j] = a[j + 1]; a[j + 1] = t;
      }
    }
  }
}

function insertionAlgo(a: number[], snap: Snap) {
  for (let i = 1; i < a.length; i++) {
    snap([i - 1, i]);
    let j = i;
    while (j > 0 && a[j - 1] > a[j]) {
      snap([j - 1, j]);
      const t = a[j - 1]; a[j - 1] = a[j]; a[j] = t;
      j--;
    }
  }
}

function selectionAlgo(a: number[], snap: Snap) {
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      snap([minIdx, j]);
      if (a[j] < a[minIdx]) minIdx = j;
    }
    if (minIdx !== i) {
      snap([i, minIdx]);
      const t = a[i]; a[i] = a[minIdx]; a[minIdx] = t;
    }
  }
}

function mergeAlgo(a: number[], lo: number, hi: number, snap: Snap) {
  if (hi - lo <= 1) return;
  const mid = Math.floor((lo + hi) / 2);
  mergeAlgo(a, lo, mid, snap);
  mergeAlgo(a, mid, hi, snap);
  const left = a.slice(lo, mid);
  const right = a.slice(mid, hi);
  let i = 0, j = 0, k = lo;
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) a[k++] = left[i++];
    else a[k++] = right[j++];
    snap(null);
  }
  while (i < left.length) { a[k++] = left[i++]; snap(null); }
  while (j < right.length) { a[k++] = right[j++]; snap(null); }
}

function quickAlgo(a: number[], lo: number, hi: number, snap: Snap) {
  if (lo >= hi) return;
  let i = lo - 1;
  for (let j = lo; j < hi; j++) {
    snap([j, hi]);
    if (a[j] <= a[hi]) {
      i++;
      if (i !== j) {
        const t = a[i]; a[i] = a[j]; a[j] = t;
        snap([i, j]);
      }
    }
  }
  const t = a[i + 1]; a[i + 1] = a[hi]; a[hi] = t;
  snap([i + 1, hi]);
  quickAlgo(a, lo, i, snap);
  quickAlgo(a, i + 2, hi, snap);
}

export function generateSteps(input: number[], algo: AlgoId): SortStep[] {
  const a = [...input];
  const steps: SortStep[] = [{ arr: [...a], hi: null }];

  function snap(hi: [number, number] | null) {
    steps.push({ arr: [...a], hi });
  }

  switch (algo) {
    case "bubble":    bubbleAlgo(a, snap);              break;
    case "insertion": insertionAlgo(a, snap);           break;
    case "selection": selectionAlgo(a, snap);           break;
    case "merge":     mergeAlgo(a, 0, a.length, snap);  break;
    case "quick":     quickAlgo(a, 0, a.length - 1, snap); break;
  }

  steps.push({ arr: [...a], hi: null });
  return steps;
}
