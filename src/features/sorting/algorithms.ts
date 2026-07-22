export type AlgoId = "bubble" | "insertion" | "selection" | "quick" | "merge";

export interface Frame {
  array: number[];
  comparing: number[]; // indices being compared this step
  swapping: number[]; // indices being written this step
  sorted: number[]; // indices known to be in final position
}

export const ALGORITHMS: Record<AlgoId, { label: string; complexity: string }> = {
  bubble: { label: "Bubble", complexity: "O(n²)" },
  insertion: { label: "Insertion", complexity: "O(n²)" },
  selection: { label: "Selection", complexity: "O(n²)" },
  quick: { label: "Quick", complexity: "O(n log n)" },
  merge: { label: "Merge", complexity: "O(n log n)" },
};

export function randomArray(n: number): number[] {
  return Array.from({ length: n }, () => 5 + Math.floor(Math.random() * 95));
}

function frame(array: number[], comparing: number[] = [], swapping: number[] = [], sorted: number[] = []): Frame {
  return { array: [...array], comparing, swapping, sorted: [...sorted] };
}

function* bubbleSort(input: number[]): Generator<Frame> {
  const a = [...input];
  const sorted: number[] = [];
  for (let end = a.length - 1; end > 0; end--) {
    let swappedAny = false;
    for (let i = 0; i < end; i++) {
      yield frame(a, [i, i + 1], [], sorted);
      if (a[i] > a[i + 1]) {
        [a[i], a[i + 1]] = [a[i + 1], a[i]];
        swappedAny = true;
        yield frame(a, [], [i, i + 1], sorted);
      }
    }
    sorted.push(end);
    if (!swappedAny) {
      for (let i = 0; i < end; i++) sorted.push(i);
      break;
    }
  }
  sorted.push(0);
  yield frame(a, [], [], sorted);
}

function* insertionSort(input: number[]): Generator<Frame> {
  const a = [...input];
  for (let i = 1; i < a.length; i++) {
    const key = a[i];
    let j = i - 1;
    yield frame(a, [i], []);
    while (j >= 0 && a[j] > key) {
      yield frame(a, [j, j + 1], []);
      a[j + 1] = a[j];
      yield frame(a, [], [j + 1]);
      j--;
    }
    a[j + 1] = key;
    yield frame(a, [], [j + 1]);
  }
  yield frame(a, [], [], a.map((_, i) => i));
}

function* selectionSort(input: number[]): Generator<Frame> {
  const a = [...input];
  const sorted: number[] = [];
  for (let i = 0; i < a.length - 1; i++) {
    let min = i;
    for (let j = i + 1; j < a.length; j++) {
      yield frame(a, [min, j], [], sorted);
      if (a[j] < a[min]) min = j;
    }
    if (min !== i) {
      [a[i], a[min]] = [a[min], a[i]];
      yield frame(a, [], [i, min], sorted);
    }
    sorted.push(i);
  }
  sorted.push(a.length - 1);
  yield frame(a, [], [], sorted);
}

function* quickSort(input: number[]): Generator<Frame> {
  const a = [...input];
  const sorted: number[] = [];

  function* partition(lo: number, hi: number): Generator<Frame, number> {
    const pivot = a[hi];
    let i = lo - 1;
    for (let j = lo; j < hi; j++) {
      yield frame(a, [j, hi], [], sorted);
      if (a[j] < pivot) {
        i++;
        if (i !== j) {
          [a[i], a[j]] = [a[j], a[i]];
          yield frame(a, [], [i, j], sorted);
        }
      }
    }
    if (i + 1 !== hi) {
      [a[i + 1], a[hi]] = [a[hi], a[i + 1]];
      yield frame(a, [], [i + 1, hi], sorted);
    }
    return i + 1;
  }

  function* sort(lo: number, hi: number): Generator<Frame> {
    if (lo > hi) return;
    if (lo === hi) { sorted.push(lo); yield frame(a, [], [], sorted); return; }
    const p = yield* partition(lo, hi);
    sorted.push(p);
    yield frame(a, [], [], sorted);
    yield* sort(lo, p - 1);
    yield* sort(p + 1, hi);
  }

  yield* sort(0, a.length - 1);
  yield frame(a, [], [], a.map((_, i) => i));
}

function* mergeSort(input: number[]): Generator<Frame> {
  const a = [...input];

  function* merge(lo: number, mid: number, hi: number): Generator<Frame> {
    const left = a.slice(lo, mid + 1);
    const right = a.slice(mid + 1, hi + 1);
    let i = 0, j = 0, k = lo;
    while (i < left.length && j < right.length) {
      yield frame(a, [lo + i, mid + 1 + j], []);
      a[k] = left[i] <= right[j] ? left[i++] : right[j++];
      yield frame(a, [], [k]);
      k++;
    }
    while (i < left.length) { a[k] = left[i++]; yield frame(a, [], [k]); k++; }
    while (j < right.length) { a[k] = right[j++]; yield frame(a, [], [k]); k++; }
  }

  function* sort(lo: number, hi: number): Generator<Frame> {
    if (lo >= hi) return;
    const mid = Math.floor((lo + hi) / 2);
    yield* sort(lo, mid);
    yield* sort(mid + 1, hi);
    yield* merge(lo, mid, hi);
  }

  yield* sort(0, a.length - 1);
  yield frame(a, [], [], a.map((_, i) => i));
}

export function makeSorter(algo: AlgoId, input: number[]): Generator<Frame> {
  switch (algo) {
    case "bubble": return bubbleSort(input);
    case "insertion": return insertionSort(input);
    case "selection": return selectionSort(input);
    case "quick": return quickSort(input);
    case "merge": return mergeSort(input);
  }
}
