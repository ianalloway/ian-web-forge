import { describe, expect, it } from "vitest";
import { applyScript, buildTable, distance, traceback, tracebackPath } from "./levenshtein";

describe("levenshtein distance", () => {
  it("is zero for identical strings and for two empty strings", () => {
    expect(distance("", "")).toBe(0);
    expect(distance("abc", "abc")).toBe(0);
  });

  it("equals the length when one side is empty", () => {
    expect(distance("", "abc")).toBe(3);
    expect(distance("hello", "")).toBe(5);
  });

  it("matches the textbook examples", () => {
    expect(distance("kitten", "sitting")).toBe(3);
    expect(distance("sunday", "saturday")).toBe(3);
    expect(distance("flaw", "lawn")).toBe(2);
  });

  it("is symmetric", () => {
    expect(distance("sitting", "kitten")).toBe(distance("kitten", "sitting"));
    expect(distance("abcdef", "azced")).toBe(distance("azced", "abcdef"));
  });

  it("obeys the triangle inequality against a midpoint", () => {
    const d = (a: string, b: string) => distance(a, b);
    expect(d("kitten", "sitting")).toBeLessThanOrEqual(d("kitten", "mitten") + d("mitten", "sitting"));
  });
});

describe("table shape", () => {
  it("is (a.length+1) x (b.length+1) with the distance in the corner", () => {
    const t = buildTable("ab", "abc");
    expect(t.rows).toBe(3);
    expect(t.cols).toBe(4);
    expect(t.cells.length).toBe(t.rows * t.cols);
    expect(t.distance).toBe(1);
    expect(t.cells[t.cells.length - 1].cost).toBe(1);
  });
});

describe("traceback", () => {
  it("recovers an edit script that turns a into b", () => {
    for (const [a, b] of [["kitten", "sitting"], ["sunday", "saturday"], ["", "abc"], ["abc", ""], ["same", "same"]]) {
      const steps = traceback(buildTable(a, b));
      expect(applyScript(a, steps)).toBe(b);
    }
  });

  it("has exactly `distance` non-match operations", () => {
    const a = "kitten";
    const b = "sitting";
    const steps = traceback(buildTable(a, b));
    const edits = steps.filter((s) => s.op !== "match").length;
    expect(edits).toBe(distance(a, b));
  });

  it("walks a contiguous path from the origin to the corner", () => {
    const t = buildTable("abc", "axc");
    const path = tracebackPath(t);
    expect(path[0]).toEqual([0, 0]);
    expect(path[path.length - 1]).toEqual([t.rows - 1, t.cols - 1]);
    // each hop moves by at most one in each axis
    for (let k = 1; k < path.length; k++) {
      expect(Math.abs(path[k][0] - path[k - 1][0])).toBeLessThanOrEqual(1);
      expect(Math.abs(path[k][1] - path[k - 1][1])).toBeLessThanOrEqual(1);
    }
  });
});
