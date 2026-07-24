import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Grid, StepResult, SudokuSolver, generate } from "../features/sudoku/sudoku";

const DIFFICULTY: { label: string; holes: number }[] = [
  { label: "easy", holes: 40 },
  { label: "medium", holes: 50 },
  { label: "hard", holes: 56 },
];

interface Meta {
  cursor: number;
  result: StepResult | "idle";
  done: boolean;
  failed: boolean;
  backtracks: number;
  steps: number;
}

export default function Sudoku() {
  const solverRef = useRef<SudokuSolver | null>(null);
  const puzzleRef = useRef<Grid | null>(null);
  const holesRef = useRef(50);
  const runningRef = useRef(false);
  const speedRef = useRef(40);
  const givenDirtyRef = useRef(true);
  const renderDirtyRef = useRef(true);
  const lastResultRef = useRef<StepResult | "idle">("idle");

  const [grid, setGrid] = useState<number[]>(() => new Array(81).fill(0));
  const [given, setGiven] = useState<number[]>(() => new Array(81).fill(0));
  const [meta, setMeta] = useState<Meta>({
    cursor: -1,
    result: "idle",
    done: false,
    failed: false,
    backtracks: 0,
    steps: 0,
  });
  const [holes, setHoles] = useState(50);
  const [speed, setSpeed] = useState(40);
  const [running, setRunning] = useState(false);

  // Ref-only (re)initialization — safe to call from the mount effect.
  const newPuzzle = useCallback((h: number) => {
    const { puzzle } = generate(h, Math.random);
    puzzleRef.current = puzzle;
    solverRef.current = new SudokuSolver(puzzle);
    lastResultRef.current = "idle";
    givenDirtyRef.current = true;
    renderDirtyRef.current = true;
  }, []);

  const resetPuzzle = useCallback(() => {
    if (!puzzleRef.current) return;
    solverRef.current = new SudokuSolver(puzzleRef.current);
    lastResultRef.current = "idle";
    givenDirtyRef.current = true;
    renderDirtyRef.current = true;
  }, []);

  useEffect(() => {
    newPuzzle(holesRef.current);

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const s = solverRef.current;
      if (!s) return;

      if (runningRef.current && !s.done && !s.failed) {
        for (let k = 0; k < speedRef.current; k++) {
          lastResultRef.current = s.step();
          if (s.done || s.failed) break;
        }
        renderDirtyRef.current = true;
      }

      if (renderDirtyRef.current) {
        renderDirtyRef.current = false;
        setGrid(Array.from(s.grid));
        if (givenDirtyRef.current) {
          givenDirtyRef.current = false;
          setGiven(Array.from(s.given));
        }
        setMeta({
          cursor: s.cursor,
          result: lastResultRef.current,
          done: s.done,
          failed: s.failed,
          backtracks: s.backtracks,
          steps: s.steps,
        });
        if (s.done || s.failed) {
          runningRef.current = false;
          setRunning(false);
        }
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [newPuzzle]);

  const onNew = (h: number) => {
    setHoles(h);
    holesRef.current = h;
    runningRef.current = false;
    setRunning(false);
    newPuzzle(h);
  };

  const status = meta.failed
    ? "no solution"
    : meta.done
      ? "solved"
      : meta.result === "backtrack"
        ? "backtracking"
        : running
          ? "searching"
          : "ready";

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">sudoku solver</span>
        </div>
        <div className="text-xs text-primary/40 tabular-nums">
          {status} · {meta.steps.toLocaleString()} steps · {meta.backtracks.toLocaleString()} backtracks
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-primary/40 text-xs mr-1">new</span>
          {DIFFICULTY.map((d) => (
            <button
              key={d.label}
              onClick={() => onNew(d.holes)}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                holes === d.holes
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/20 text-primary/50 hover:border-primary/50"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">speed</span>
          <input
            type="range"
            min={1}
            max={300}
            step={1}
            value={speed}
            onChange={(e) => {
              const v = Number(e.target.value);
              setSpeed(v);
              speedRef.current = v;
            }}
            className="w-24 accent-primary"
          />
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => {
              const s = solverRef.current;
              if (s && !s.done && !s.failed) {
                s.step();
                renderDirtyRef.current = true;
              }
            }}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ⇢ step
          </button>
          <button
            onClick={() => {
              runningRef.current = !running;
              setRunning(!running);
            }}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            {running ? "⏸ pause" : "▶ solve"}
          </button>
          <button
            onClick={() => {
              runningRef.current = false;
              setRunning(false);
              resetPuzzle();
            }}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ↺ reset
          </button>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 flex items-center justify-center p-4 min-h-0">
        <div
          className="grid border-2 border-primary/50"
          style={{ gridTemplateColumns: "repeat(9, minmax(0, 1fr))", width: "min(90vw, 60vh)", aspectRatio: "1" }}
        >
          {grid.map((v, i) => {
            const col = i % 9;
            const row = (i / 9) | 0;
            const isGiven = given[i] === 1;
            const isCursor = i === meta.cursor && !meta.done;
            const bt = isCursor && meta.result === "backtrack";
            return (
              <div
                key={i}
                className="flex items-center justify-center select-none"
                style={{
                  aspectRatio: "1",
                  fontSize: "clamp(10px, 2.4vh, 20px)",
                  borderRight: col % 3 === 2 && col !== 8 ? "2px solid rgba(0,255,65,0.4)" : "1px solid rgba(0,255,65,0.12)",
                  borderBottom: row % 3 === 2 && row !== 8 ? "2px solid rgba(0,255,65,0.4)" : "1px solid rgba(0,255,65,0.12)",
                  background: bt
                    ? "rgba(255,70,70,0.35)"
                    : isCursor
                      ? "rgba(0,255,65,0.18)"
                      : meta.done
                        ? "rgba(0,255,65,0.05)"
                        : "transparent",
                  color: isGiven ? "#eaffea" : "rgba(0,255,65,0.7)",
                  fontWeight: isGiven ? 700 : 400,
                }}
              >
                {v !== 0 ? v : ""}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
