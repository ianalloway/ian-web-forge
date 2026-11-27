import { describe, expect, it } from "vitest";
import { ALGORITHMS, makeSorter, type AlgoId } from "./algorithms";

const ids = Object.keys(ALGORITHMS) as AlgoId[];

/** Drive a sorter to completion and return the array from its final frame. */
function finalArray(algo: AlgoId, input: number[]): number[] {
  let last: number[] = [...input];
  for (const frame of makeSorter(algo, input)) last = frame.array;
  return last;
}

const cases: Record<string, number[]> = {
  random: [5, 2, 9, 1, 7, 3, 8, 4, 6, 0],
  reversed: [9, 8, 7, 6, 5, 4, 3, 2, 1],
  sorted: [1, 2, 3, 4, 5, 6],
  duplicates: [3, 1, 2, 3, 1, 2, 3],
  single: [42],
  empty: [],
};

describe("makeSorter", () => {
  for (const algo of ids) {
    for (const [name, input] of Object.entries(cases)) {
      it(`${algo} sorts the ${name} case`, () => {
        const expected = [...input].sort((a, b) => a - b);
        expect(finalArray(algo, input)).toEqual(expected);
      });
    }

    it(`${algo} output is a permutation of the input`, () => {
      const input = cases.random;
      const out = finalArray(algo, input);
      expect(out).toHaveLength(input.length);
      expect([...out].sort((a, b) => a - b)).toEqual([...input].sort((a, b) => a - b));
    });

    it(`${algo} does not mutate the caller's array`, () => {
      const input = [...cases.random];
      const snapshot = [...input];
      finalArray(algo, input);
      expect(input).toEqual(snapshot);
    });
  }
});
