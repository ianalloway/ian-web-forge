import { describe, expect, it } from "vitest";
import { isSolved, parsePuzzle, SudokuSolver } from "./sudoku";

const solved = "534678912672195348198342567859761423426853791713924856961537284287419635345286179";

describe("import puzzle", () => {
  it("loads multiline clues and solves from the original givens", () => {
    const input = ("0." + solved.slice(2)).match(/.{9}/g)!.join("\n");
    const puzzle = parsePuzzle(input);
    const solver = new SudokuSolver(puzzle);
    while (!solver.done && !solver.failed) solver.step();
    expect(isSolved(solver.grid)).toBe(true);
    expect(puzzle[0]).toBe(0);
    expect(puzzle[1]).toBe(0);
  });

  it("rejects malformed grids and row, column and box conflicts", () => {
    for (const text of ["1", ".".repeat(80) + "a"]) expect(() => parsePuzzle(text)).toThrow(/81 cells/);
    for (const i of [1, 9, 10]) {
      const cells = Array<string>(81).fill(".");
      cells[0] = cells[i] = "8";
      expect(() => parsePuzzle(cells.join(""))).toThrow(/Conflicting 8/);
    }
  });
});
