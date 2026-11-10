import { describe, expect, it } from "vitest";
import { type City, type TspEvent, nearestNeighbor, solveTsp, tourLength, twoOpt } from "./tour";

// Drain a generator and return the tour it `return`s.
function finalTour(gen: Generator<unknown, number[]>): number[] {
  let r = gen.next();
  while (!r.done) r = gen.next();
  return r.value;
}

// solveTsp delegates with `yield*` and does not itself return the tour, so
// recover the final route from the last event that carries one.
function lastTourFromEvents(gen: Generator<TspEvent>, fallback: number[]): number[] {
  let tour = fallback;
  for (const ev of gen) if ("tour" in ev) tour = ev.tour;
  return tour;
}

const square: City[] = [
  { x: 0, y: 0 }, // 0
  { x: 1, y: 0 }, // 1
  { x: 1, y: 1 }, // 2
  { x: 0, y: 1 }, // 3
];

const isPermutation = (tour: number[], n: number) =>
  tour.length === n && new Set(tour).size === n && tour.every((c) => c >= 0 && c < n);

describe("tourLength", () => {
  it("is the closed-loop perimeter", () => {
    expect(tourLength(square, [0, 1, 2, 3])).toBeCloseTo(4, 12); // unit square perimeter
  });
  it("counts the return leg for a two-city tour", () => {
    expect(tourLength([{ x: 0, y: 0 }, { x: 3, y: 0 }], [0, 1])).toBeCloseTo(6, 12);
  });
});

describe("nearestNeighbor", () => {
  it("produces a tour that visits every city exactly once", () => {
    const cities: City[] = Array.from({ length: 20 }, (_, i) => ({
      x: Math.sin(i * 1.3) * 100 + 120,
      y: Math.cos(i * 2.1) * 100 + 120,
    }));
    const tour = finalTour(nearestNeighbor(cities));
    expect(isPermutation(tour, cities.length)).toBe(true);
  });
});

describe("twoOpt", () => {
  it("never lengthens the tour and uncrosses a crossed square", () => {
    const crossed = [0, 2, 1, 3]; // figure-eight across the square
    const before = tourLength(square, crossed);
    const after = finalTour(twoOpt(square, crossed));
    expect(isPermutation(after, square.length)).toBe(true);
    expect(tourLength(square, after)).toBeLessThanOrEqual(before + 1e-9);
    expect(tourLength(square, after)).toBeCloseTo(4, 9); // optimal perimeter
  });

  it("is a no-op on an already-optimal tour", () => {
    const optimal = [0, 1, 2, 3];
    const after = finalTour(twoOpt(square, optimal));
    expect(tourLength(square, after)).toBeCloseTo(tourLength(square, optimal), 12);
  });
});

describe("solveTsp", () => {
  it("returns a valid permutation no worse than nearest-neighbor alone", () => {
    const cities: City[] = Array.from({ length: 25 }, (_, i) => ({
      x: Math.sin(i * 0.9) * 140 + 160,
      y: Math.cos(i * 1.7) * 140 + 160,
    }));
    const nn = finalTour(nearestNeighbor(cities));
    const solved = lastTourFromEvents(solveTsp(cities), nn);
    expect(isPermutation(solved, cities.length)).toBe(true);
    expect(tourLength(cities, solved)).toBeLessThanOrEqual(tourLength(cities, nn) + 1e-9);
  });
});
