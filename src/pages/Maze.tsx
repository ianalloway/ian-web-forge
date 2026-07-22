import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  MazeGrid,
  CarveEvent,
  SolveEvent,
  N, S, E, W,
  newGrid,
  carve,
  solve,
} from "../features/maze/carver";

const CELL = 18;

type Phase = "carving" | "carved" | "solving" | "solved";

export default function Maze() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<MazeGrid | null>(null);
  const carverRef = useRef<Generator<CarveEvent> | null>(null);
  const solverRef = useRef<Generator<SolveEvent> | null>(null);
  const visitedRef = useRef<Set<number>>(new Set());
  const exploredRef = useRef<Set<number>>(new Set());
  const pathRef = useRef<number[]>([]);
  const headRef = useRef(0);
  const phaseRef = useRef<Phase>("carving");
  const speedRef = useRef(6);

  const [phase, setPhase] = useState<Phase>("carving");
  const [speed, setSpeed] = useState(6);
  const [pathLen, setPathLen] = useState(0);

  const setPhaseBoth = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const g = gridRef.current;
    if (!canvas || !g) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const pathSet = new Set(pathRef.current);

    // Cell fills
    for (let y = 0; y < g.rows; y++) {
      for (let x = 0; x < g.cols; x++) {
        const idx = y * g.cols + x;
        const px = x * CELL, py = y * CELL;
        if (pathSet.has(idx)) {
          ctx.fillStyle = "rgba(0,255,65,0.45)";
          ctx.fillRect(px, py, CELL, CELL);
        } else if (exploredRef.current.has(idx)) {
          ctx.fillStyle = "rgba(255,224,102,0.12)";
          ctx.fillRect(px, py, CELL, CELL);
        } else if (visitedRef.current.has(idx)) {
          ctx.fillStyle = "rgba(0,255,65,0.06)";
          ctx.fillRect(px, py, CELL, CELL);
        }
      }
    }

    // Carving head
    if (phaseRef.current === "carving") {
      const hx = (headRef.current % g.cols) * CELL;
      const hy = Math.floor(headRef.current / g.cols) * CELL;
      ctx.fillStyle = "#00ff41";
      ctx.fillRect(hx + 3, hy + 3, CELL - 6, CELL - 6);
    }

    // Walls
    ctx.strokeStyle = "rgba(0,255,65,0.55)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let y = 0; y < g.rows; y++) {
      for (let x = 0; x < g.cols; x++) {
        const idx = y * g.cols + x;
        const w = g.walls[idx];
        const px = x * CELL, py = y * CELL;
        if (w & N) { ctx.moveTo(px, py); ctx.lineTo(px + CELL, py); }
        if (w & S) { ctx.moveTo(px, py + CELL); ctx.lineTo(px + CELL, py + CELL); }
        if (w & E) { ctx.moveTo(px + CELL, py); ctx.lineTo(px + CELL, py + CELL); }
        if (w & W) { ctx.moveTo(px, py); ctx.lineTo(px, py + CELL); }
      }
    }
    ctx.stroke();

    // Entrance / exit markers
    ctx.fillStyle = "#00cfff";
    ctx.fillRect(4, 4, CELL - 8, CELL - 8);
    ctx.fillStyle = "#ff4da6";
    const gx = (g.cols - 1) * CELL, gy = (g.rows - 1) * CELL;
    ctx.fillRect(gx + 4, gy + 4, CELL - 8, CELL - 8);
  }, []);

  const restart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.parentElement!.getBoundingClientRect();
    const cols = Math.max(10, Math.floor(rect.width / CELL));
    const rows = Math.max(10, Math.floor(rect.height / CELL));
    canvas.width = cols * CELL;
    canvas.height = rows * CELL;

    const g = newGrid(cols, rows);
    gridRef.current = g;
    carverRef.current = carve(g);
    solverRef.current = null;
    visitedRef.current = new Set();
    exploredRef.current = new Set();
    pathRef.current = [];
    headRef.current = 0;
    setPathLen(0);
    setPhaseBoth("carving");
    draw();
  }, [draw, setPhaseBoth]);

  // Stepping loop
  useEffect(() => {
    const id = setInterval(() => {
      const phase = phaseRef.current;
      const steps = speedRef.current;

      if (phase === "carving" && carverRef.current) {
        for (let i = 0; i < steps; i++) {
          const r = carverRef.current.next();
          if (r.done) break;
          const ev = r.value;
          if (ev.type === "visit") {
            visitedRef.current.add(ev.index);
            headRef.current = ev.index;
          } else if (ev.type === "backtrack") {
            headRef.current = ev.index;
          } else if (ev.type === "done") {
            setPhaseBoth("carved");
            break;
          }
        }
        draw();
      } else if (phase === "solving" && solverRef.current) {
        for (let i = 0; i < steps * 2; i++) {
          const r = solverRef.current.next();
          if (r.done) break;
          const ev = r.value;
          if (ev.type === "explore") {
            exploredRef.current.add(ev.index);
          } else if (ev.type === "path") {
            pathRef.current = ev.path;
            setPathLen(ev.path.length);
          } else if (ev.type === "done") {
            setPhaseBoth("solved");
            break;
          }
        }
        draw();
      }
    }, 16);
    return () => clearInterval(id);
  }, [draw, setPhaseBoth]);

  // Init on mount + resize restarts
  useEffect(() => {
    restart();
    window.addEventListener("resize", restart);
    return () => window.removeEventListener("resize", restart);
  }, [restart]);

  const handleSolve = () => {
    if (!gridRef.current || phaseRef.current !== "carved") return;
    solverRef.current = solve(gridRef.current);
    exploredRef.current = new Set();
    pathRef.current = [];
    setPhaseBoth("solving");
  };

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">maze carver</span>
        </div>
        <div className="text-xs text-primary/40">
          {phase === "carving" && "carving..."}
          {phase === "carved" && "ready to solve"}
          {phase === "solving" && "solving..."}
          {phase === "solved" && <span className="text-primary">✓ path {pathLen} cells</span>}
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">speed</span>
          <input
            type="range"
            min={1}
            max={30}
            value={speed}
            onChange={(e) => {
              const v = Number(e.target.value);
              speedRef.current = v;
              setSpeed(v);
            }}
            className="w-24 accent-primary"
          />
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={handleSolve}
            disabled={phase !== "carved"}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ▶ solve
          </button>
          <button
            onClick={restart}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ⚄ new maze
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block" />
        <div className="absolute bottom-3 left-4 text-xs text-primary/30 pointer-events-none flex gap-4">
          <span><span className="text-cyan-400">■</span> start</span>
          <span><span className="text-pink-400">■</span> goal</span>
          <span>recursive backtracker carve · BFS solve</span>
        </div>
      </div>
    </div>
  );
}
