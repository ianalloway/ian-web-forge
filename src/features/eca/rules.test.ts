import { describe, expect, it } from "vitest";
import { nextRow, ruleToTable, seedRow } from "./rules";

describe("ruleToTable", () => {
  it("reads rule bits little-endian into the 8 neighborhood outputs", () => {
    expect(Array.from(ruleToTable(0))).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    expect(Array.from(ruleToTable(255))).toEqual([1, 1, 1, 1, 1, 1, 1, 1]);
    // 30 = 0b00011110
    expect(Array.from(ruleToTable(30))).toEqual([0, 1, 1, 1, 1, 0, 0, 0]);
  });
});

describe("nextRow", () => {
  const apply = (rule: number, row: number[]) =>
    Array.from(nextRow(Uint8Array.from(row), ruleToTable(rule)));

  it("rule 0 clears and rule 255 fills", () => {
    expect(apply(0, [1, 0, 1, 1, 0])).toEqual([0, 0, 0, 0, 0]);
    expect(apply(255, [0, 0, 0, 0, 0])).toEqual([1, 1, 1, 1, 1]);
  });

  it("rule 204 is the identity (output = centre cell)", () => {
    const row = [1, 0, 1, 1, 0, 0, 1];
    expect(apply(204, row)).toEqual(row);
  });

  it("rule 90 is the XOR of the two neighbours and wraps toroidally", () => {
    // single seed in the middle → the two adjacent cells light up
    expect(apply(90, [0, 0, 1, 0, 0])).toEqual([0, 1, 0, 1, 0]);
    // a lone seed at index 0 reaches its wrapped left neighbour at the far end
    expect(apply(90, [1, 0, 0, 0, 0])).toEqual([0, 1, 0, 0, 1]);
  });
});

describe("seedRow", () => {
  it("single mode lights only the centre cell", () => {
    const row = seedRow(7, "single");
    expect(row).toHaveLength(7);
    expect(Array.from(row)).toEqual([0, 0, 0, 1, 0, 0, 0]);
    expect(row.reduce((s, v) => s + v, 0)).toBe(1);
  });
});
