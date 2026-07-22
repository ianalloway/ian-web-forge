export interface City {
  x: number;
  y: number;
}

export function randomCities(n: number, w: number, h: number): City[] {
  const margin = 30;
  return Array.from({ length: n }, () => ({
    x: margin + Math.random() * (w - margin * 2),
    y: margin + Math.random() * (h - margin * 2),
  }));
}

function dist(a: City, b: City): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function tourLength(cities: City[], tour: number[]): number {
  let total = 0;
  for (let i = 0; i < tour.length; i++) {
    total += dist(cities[tour[i]], cities[tour[(i + 1) % tour.length]]);
  }
  return total;
}

export type TspEvent =
  | { type: "extend"; tour: number[] } // nearest-neighbor grew the tour
  | { type: "swap"; tour: number[]; improvement: number } // 2-opt improved
  | { type: "phase"; phase: "construct" | "improve" | "done" };

/** Nearest-neighbor construction, one city per yield. */
export function* nearestNeighbor(cities: City[]): Generator<TspEvent> {
  yield { type: "phase", phase: "construct" };
  const n = cities.length;
  const visited = new Uint8Array(n);
  const tour = [0];
  visited[0] = 1;
  while (tour.length < n) {
    const last = cities[tour[tour.length - 1]];
    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < n; i++) {
      if (visited[i]) continue;
      const d = dist(last, cities[i]);
      if (d < bestD) { bestD = d; best = i; }
    }
    visited[best] = 1;
    tour.push(best);
    yield { type: "extend", tour: [...tour] };
  }
  return tour;
}

/**
 * 2-opt improvement: repeatedly reverse tour segments that shorten the
 * route, yielding after each improving swap, until a full pass finds none.
 */
export function* twoOpt(cities: City[], initial: number[]): Generator<TspEvent> {
  yield { type: "phase", phase: "improve" };
  const tour = [...initial];
  const n = tour.length;
  let improvedInPass = true;

  while (improvedInPass) {
    improvedInPass = false;
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 2; j < n; j++) {
        if (i === 0 && j === n - 1) continue; // same edge
        const a = cities[tour[i]];
        const b = cities[tour[i + 1]];
        const c = cities[tour[j]];
        const d = cities[tour[(j + 1) % n]];
        const before = dist(a, b) + dist(c, d);
        const after = dist(a, c) + dist(b, d);
        if (after < before - 1e-9) {
          // Reverse the segment between i+1 and j
          let lo = i + 1, hi = j;
          while (lo < hi) {
            [tour[lo], tour[hi]] = [tour[hi], tour[lo]];
            lo++; hi--;
          }
          improvedInPass = true;
          yield { type: "swap", tour: [...tour], improvement: before - after };
        }
      }
    }
  }
  yield { type: "phase", phase: "done" };
  return tour;
}

/** Full pipeline: construct then improve. */
export function* solveTsp(cities: City[]): Generator<TspEvent> {
  const construction = nearestNeighbor(cities);
  let tour: number[] = [];
  for (const ev of construction) {
    if (ev.type === "extend") tour = ev.tour;
    yield ev;
  }
  yield* twoOpt(cities, tour);
}
