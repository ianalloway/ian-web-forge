import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Map, Play, RotateCcw, Zap } from "lucide-react";
import MatrixRain from "@/components/MatrixRain";
import { Button } from "@/components/ui/button";
import {
  CANVAS_H,
  CANVAS_W,
  COLS,
  ROWS,
  type CarveStep,
  type SolveStep,
  drawMaze,
  generateMaze,
  solveMaze,
} from "@/features/maze/gen";

type Phase = "idle" | "generating" | "generated" | "solving" | "solved";

const SPEEDS = [
  { label: "slow", ms: 40 },
  { label: "normal", ms: 12 },
  { label: "fast", ms: 3 },
];

export default function Maze() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef<Phase>("idle");
  const genStepsRef = useRef<CarveStep[]>([]);
  const genIdxRef = useRef(0);
  const wallsRef = useRef(new Uint8Array(ROWS * COLS));
  const solveStepsRef = useRef<SolveStep[]>([]);
  const solveIdxRef = useRef(0);
  const visitedSolveRef = useRef(new Set<number>());
  const frontierRef = useRef(new Set<number>());
  const pathRef = useRef(new Set<number>());
  const speedRef = useRef(12);
  const lastStepAtRef = useRef(0);

  const [phase, setPhase] = useState<Phase>("idle");
  const [speedIdx, setSpeedIdx] = useState(1);

  // rAF loop — draws and advances steps based on elapsed time
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId: number;

    function advanceGen() {
      const steps = genStepsRef.current;
      const i = genIdxRef.current;
      if (i >= steps.length) {
        phaseRef.current = "generated";
        setPhase("generated");
        return;
      }
      const step = steps[i];
      wallsRef.current[step.from] |= step.dir;
      const opp = step.dir === 1 ? 2 : step.dir === 2 ? 1 : step.dir === 4 ? 8 : 4; // N↔S, E↔W
      wallsRef.current[step.to] |= opp;
      genIdxRef.current = i + 1;
    }

    function advanceSolve() {
      const steps = solveStepsRef.current;
      const i = solveIdxRef.current;
      if (i >= steps.length) {
        phaseRef.current = "solved";
        setPhase("solved");
        return;
      }
      const step = steps[i];
      for (const n of step.newVisited) {
        visitedSolveRef.current.add(n);
        frontierRef.current.add(n);
      }
      // remove previous frontier cell that was just dequeued
      frontierRef.current.delete(step.cell);
      solveIdxRef.current = i + 1;

      if (step.done) {
        for (const p of step.path) pathRef.current.add(p);
        frontierRef.current.clear();
        phaseRef.current = "solved";
        setPhase("solved");
      }
    }

    function loop(ts: number) {
      rafId = requestAnimationFrame(loop);
      const p = phaseRef.current;

      if (p === "generating" || p === "solving") {
        if (ts - lastStepAtRef.current >= speedRef.current) {
          lastStepAtRef.current = ts;
          if (p === "generating") advanceGen();
          else advanceSolve();
        }
      }

      const step = genStepsRef.current[genIdxRef.current - 1];
      const dfsStack = step ? new Set(step.stack) : new Set<number>();
      const currentCell = p === "generating" ? (step ? step.to : -1) : -1;

      drawMaze(ctx!, wallsRef.current, {
        currentCell,
        dfsStack: p === "generating" ? dfsStack : new Set<number>(),
        visitedSolve: visitedSolveRef.current,
        frontier: frontierRef.current,
        path: pathRef.current,
      });
    }

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const handleGenerate = useCallback(() => {
    const result = generateMaze();
    genStepsRef.current = result.steps;
    genIdxRef.current = 0;
    wallsRef.current = new Uint8Array(ROWS * COLS);
    solveStepsRef.current = [];
    solveIdxRef.current = 0;
    visitedSolveRef.current = new Set();
    frontierRef.current = new Set();
    pathRef.current = new Set();
    lastStepAtRef.current = 0;
    phaseRef.current = "generating";
    setPhase("generating");
  }, []);

  const handleSkipGen = useCallback(() => {
    // Apply all remaining gen steps instantly
    const steps = genStepsRef.current;
    const walls = wallsRef.current;
    for (let i = genIdxRef.current; i < steps.length; i++) {
      const step = steps[i];
      walls[step.from] |= step.dir;
      const opp = step.dir === 1 ? 2 : step.dir === 2 ? 1 : step.dir === 4 ? 8 : 4;
      walls[step.to] |= opp;
    }
    genIdxRef.current = steps.length;
    phaseRef.current = "generated";
    setPhase("generated");
  }, []);

  const handleSolve = useCallback(() => {
    const steps = solveMaze(wallsRef.current);
    solveStepsRef.current = steps;
    solveIdxRef.current = 0;
    visitedSolveRef.current = new Set([0]);
    frontierRef.current = new Set([0]);
    pathRef.current = new Set();
    lastStepAtRef.current = 0;
    phaseRef.current = "solving";
    setPhase("solving");
  }, []);

  const handleSkipSolve = useCallback(() => {
    const steps = solveStepsRef.current;
    for (let i = solveIdxRef.current; i < steps.length; i++) {
      const step = steps[i];
      for (const n of step.newVisited) visitedSolveRef.current.add(n);
      if (step.done) {
        for (const p of step.path) pathRef.current.add(p);
      }
    }
    frontierRef.current.clear();
    solveIdxRef.current = steps.length;
    phaseRef.current = "solved";
    setPhase("solved");
  }, []);

  const handleReset = useCallback(() => {
    genStepsRef.current = [];
    genIdxRef.current = 0;
    wallsRef.current = new Uint8Array(ROWS * COLS);
    solveStepsRef.current = [];
    solveIdxRef.current = 0;
    visitedSolveRef.current = new Set();
    frontierRef.current = new Set();
    pathRef.current = new Set();
    phaseRef.current = "idle";
    setPhase("idle");
  }, []);

  const handleSpeedChange = useCallback((i: number) => {
    setSpeedIdx(i);
    speedRef.current = SPEEDS[i].ms;
  }, []);

  const genTotal = genStepsRef.current.length;
  const genDone = Math.min(genIdxRef.current, genTotal);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <MatrixRain />

      <main className="relative z-10 max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="outline"
            className="font-mono terminal-border text-primary border-primary"
            asChild
          >
            <Link to="/playground">
              <ArrowLeft className="mr-2" />
              Playground
            </Link>
          </Button>
          <p className="text-xs font-mono text-primary/80">ianalloway.xyz/maze</p>
        </div>

        <header className="mb-6">
          <p className="inline-block px-2 py-1 text-xs font-mono text-primary terminal-border mb-3">
            SIM
          </p>
          <h1 className="text-3xl md:text-4xl font-mono font-bold matrix-text text-primary mb-2">
            Maze Generator
          </h1>
          <p className="text-sm text-muted-foreground font-mono">
            Recursive-backtracker DFS carves a perfect maze. BFS finds the shortest path.
          </p>
        </header>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {(phase === "idle" || phase === "generated" || phase === "solved") && (
            <button
              onClick={handleGenerate}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-primary text-primary rounded hover:bg-primary/10 transition-colors"
            >
              <Map size={12} />
              {phase === "idle" ? "generate" : "new maze"}
            </button>
          )}

          {phase === "generating" && (
            <button
              onClick={handleSkipGen}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-primary text-primary rounded hover:bg-primary/10 transition-colors"
            >
              <Zap size={12} />
              skip
            </button>
          )}

          {phase === "generated" && (
            <button
              onClick={handleSolve}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-primary text-primary rounded hover:bg-primary/10 transition-colors"
            >
              <Play size={12} />
              solve
            </button>
          )}

          {phase === "solving" && (
            <button
              onClick={handleSkipSolve}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-primary text-primary rounded hover:bg-primary/10 transition-colors"
            >
              <Zap size={12} />
              skip
            </button>
          )}

          {phase !== "idle" && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-primary/40 text-primary/80 rounded hover:border-primary hover:text-primary transition-colors"
            >
              <RotateCcw size={12} />
              reset
            </button>
          )}

          {/* Speed */}
          <div className="flex items-center gap-1 ml-auto">
            {SPEEDS.map((s, i) => (
              <button
                key={s.label}
                onClick={() => handleSpeedChange(i)}
                className={`px-2 py-1 text-xs font-mono rounded border transition-colors ${
                  i === speedIdx
                    ? "border-primary text-primary"
                    : "border-primary/30 text-primary/50 hover:border-primary/60 hover:text-primary/70"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="mb-2 h-5 flex items-center gap-2 text-xs font-mono text-muted-foreground">
          {phase === "generating" && genTotal > 0 && (
            <>
              <span className="text-primary/70">carving</span>
              <span>{genDone}/{genTotal} passages</span>
            </>
          )}
          {phase === "generated" && (
            <span className="text-primary/70">maze ready — {genTotal} passages</span>
          )}
          {phase === "solving" && (
            <span className="text-primary/70">BFS searching…</span>
          )}
          {phase === "solved" && (
            <span className="text-primary/70">
              path found — {pathRef.current.size} cells
            </span>
          )}
        </div>

        {/* Canvas */}
        <div
          className={`rounded-xl border overflow-hidden transition-colors ${
            phase === "idle" ? "border-primary/20" : "border-primary/40"
          }`}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="w-full block"
          />
        </div>

        {phase === "idle" && (
          <p className="mt-4 text-xs font-mono text-muted-foreground text-center">
            click <span className="text-primary">generate</span> to carve a new maze
          </p>
        )}

        {/* Legend */}
        {phase !== "idle" && (
          <div className="mt-5 grid sm:grid-cols-3 gap-3 text-xs font-mono text-muted-foreground">
            <div className="rounded-lg border border-primary/20 bg-card/30 px-3 py-2">
              <span className="text-primary">DFS stack</span>
              <p className="mt-0.5 leading-relaxed">dim green trail shows the current backtracking path</p>
            </div>
            <div className="rounded-lg border border-primary/20 bg-card/30 px-3 py-2">
              <span className="text-primary">BFS frontier</span>
              <p className="mt-0.5 leading-relaxed">bright cells are the active wavefront searching for E</p>
            </div>
            <div className="rounded-lg border border-primary/20 bg-card/30 px-3 py-2">
              <span className="text-primary">solution path</span>
              <p className="mt-0.5 leading-relaxed">gold cells show the shortest route from S to E</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
