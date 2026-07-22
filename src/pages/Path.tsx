import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  AlgoId,
  ALGORITHMS,
  SearchEvent,
  makeSearch,
  randomWalls,
} from "../features/pathfinding/search";

const ALGO_KEYS = Object.keys(ALGORITHMS) as AlgoId[];
const CELL = 22;

type Status = "idle" | "running" | "done" | "failed";
type DragMode = null | "wall" | "erase" | "start" | "end";

export default function Path() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dimsRef = useRef({ cols: 0, rows: 0 });
  const wallsRef = useRef<Set<number>>(new Set());
  const startRef = useRef(0);
  const endRef = useRef(0);
  const searchRef = useRef<Generator<SearchEvent> | null>(null);
  const visitedRef = useRef<Set<number>>(new Set());
  const frontierRef = useRef<Set<number>>(new Set());
  const pathRef = useRef<number[]>([]);
  const statusRef = useRef<Status>("idle");
  const dragRef = useRef<DragMode>(null);

  const [algo, setAlgo] = useState<AlgoId>("astar");
  const [status, setStatus] = useState<Status>("idle");
  const [visitedCount, setVisitedCount] = useState(0);
  const [pathLen, setPathLen] = useState(0);

  const algoRef = useRef<AlgoId>(algo);

  const setStatusBoth = useCallback((s: Status) => {
    statusRef.current = s;
    setStatus(s);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { cols, rows } = dimsRef.current;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const pathSet = new Set(pathRef.current);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const idx = y * cols + x;
        const px = x * CELL, py = y * CELL;
        if (idx === startRef.current || idx === endRef.current) {
          ctx.fillStyle = idx === startRef.current ? "#00cfff" : "#ff4da6";
          ctx.fillRect(px + 2, py + 2, CELL - 4, CELL - 4);
        } else if (wallsRef.current.has(idx)) {
          ctx.fillStyle = "rgba(0,255,65,0.25)";
          ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
        } else if (pathSet.has(idx)) {
          ctx.fillStyle = "#00ff41";
          ctx.fillRect(px + 4, py + 4, CELL - 8, CELL - 8);
        } else if (frontierRef.current.has(idx) && !visitedRef.current.has(idx)) {
          ctx.fillStyle = "rgba(255,224,102,0.5)";
          ctx.fillRect(px + 6, py + 6, CELL - 12, CELL - 12);
        } else if (visitedRef.current.has(idx)) {
          ctx.fillStyle = "rgba(0,255,65,0.10)";
          ctx.fillRect(px + 3, py + 3, CELL - 6, CELL - 6);
        }
      }
    }
  }, []);

  const clearSearch = useCallback(() => {
    searchRef.current = null;
    visitedRef.current = new Set();
    frontierRef.current = new Set();
    pathRef.current = [];
    setStatusBoth("idle");
    setVisitedCount(0);
    setPathLen(0);
    draw();
  }, [draw, setStatusBoth]);

  // Init grid + stepping loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.parentElement!.getBoundingClientRect();
    const cols = Math.max(10, Math.floor(rect.width / CELL));
    const rows = Math.max(10, Math.floor(rect.height / CELL));
    canvas.width = cols * CELL;
    canvas.height = rows * CELL;
    dimsRef.current = { cols, rows };
    startRef.current = Math.floor(rows / 2) * cols + 2;
    endRef.current = Math.floor(rows / 2) * cols + (cols - 3);
    wallsRef.current = randomWalls(cols, rows, startRef.current, endRef.current);
    draw();

    const id = setInterval(() => {
      if (statusRef.current !== "running" || !searchRef.current) return;
      for (let i = 0; i < 6; i++) {
        const r = searchRef.current.next();
        if (r.done) break;
        const ev = r.value;
        if (ev.type === "visit") visitedRef.current.add(ev.index);
        else if (ev.type === "frontier") frontierRef.current.add(ev.index);
        else if (ev.type === "path") {
          pathRef.current = ev.path;
          setPathLen(ev.path.length);
          setStatusBoth("done");
          break;
        } else if (ev.type === "fail") {
          setStatusBoth("failed");
          break;
        }
      }
      setVisitedCount(visitedRef.current.size);
      draw();
    }, 16);

    return () => clearInterval(id);
  }, [draw, setStatusBoth]);

  const handleRun = () => {
    visitedRef.current = new Set();
    frontierRef.current = new Set();
    pathRef.current = [];
    setPathLen(0);
    searchRef.current = makeSearch(algoRef.current, {
      cols: dimsRef.current.cols,
      rows: dimsRef.current.rows,
      walls: wallsRef.current,
      start: startRef.current,
      end: endRef.current,
    });
    setStatusBoth("running");
  };

  const handleMaze = () => {
    wallsRef.current = randomWalls(
      dimsRef.current.cols,
      dimsRef.current.rows,
      startRef.current,
      endRef.current
    );
    clearSearch();
  };

  const handleClearWalls = () => {
    wallsRef.current = new Set();
    clearSearch();
  };

  const cellFromEvent = (e: React.MouseEvent): number | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / CELL);
    const y = Math.floor((e.clientY - rect.top) / CELL);
    const { cols, rows } = dimsRef.current;
    if (x < 0 || y < 0 || x >= cols || y >= rows) return null;
    return y * cols + x;
  };

  const applyDrag = (idx: number) => {
    const mode = dragRef.current;
    if (mode === null) return;
    if (mode === "start" && idx !== endRef.current && !wallsRef.current.has(idx)) {
      startRef.current = idx;
    } else if (mode === "end" && idx !== startRef.current && !wallsRef.current.has(idx)) {
      endRef.current = idx;
    } else if (mode === "wall" && idx !== startRef.current && idx !== endRef.current) {
      wallsRef.current.add(idx);
    } else if (mode === "erase") {
      wallsRef.current.delete(idx);
    }
    draw();
  };

  const onMouseDown = (e: React.MouseEvent) => {
    const idx = cellFromEvent(e);
    if (idx === null) return;
    if (statusRef.current === "running") return;
    if (pathRef.current.length > 0 || visitedRef.current.size > 0) clearSearch();
    if (idx === startRef.current) dragRef.current = "start";
    else if (idx === endRef.current) dragRef.current = "end";
    else dragRef.current = wallsRef.current.has(idx) ? "erase" : "wall";
    applyDrag(idx);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (dragRef.current === null || e.buttons !== 1) return;
    const idx = cellFromEvent(e);
    if (idx !== null) applyDrag(idx);
  };

  const onMouseUp = () => { dragRef.current = null; };

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">pathfinding visualizer</span>
        </div>
        <div className="text-xs text-primary/40">
          visited {visitedCount}
          {status === "done" && <span className="text-primary ml-2">path {pathLen} ✓</span>}
          {status === "failed" && <span className="text-red-400 ml-2">no path ✗</span>}
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-3">
        <div className="flex gap-1 flex-wrap">
          {ALGO_KEYS.map((id) => (
            <button
              key={id}
              onClick={() => { setAlgo(id); algoRef.current = id; clearSearch(); }}
              title={ALGORITHMS[id].note}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                algo === id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/20 text-primary/40 hover:border-primary/50 hover:text-primary/70"
              }`}
            >
              {ALGORITHMS[id].label}
            </button>
          ))}
        </div>
        <span className="text-xs text-primary/30 hidden sm:inline">{ALGORITHMS[algo].note}</span>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={handleRun}
            disabled={status === "running"}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ▶ run
          </button>
          <button
            onClick={clearSearch}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ↺ clear search
          </button>
          <button
            onClick={handleMaze}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ▦ random walls
          </button>
          <button
            onClick={handleClearWalls}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ✕ clear walls
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas
          ref={canvasRef}
          className="block cursor-crosshair"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        />
        <div className="absolute bottom-3 left-4 text-xs text-primary/30 pointer-events-none flex gap-4">
          <span><span className="text-cyan-400">■</span> start</span>
          <span><span className="text-pink-400">■</span> end</span>
          <span>drag walls · drag start/end to move them</span>
        </div>
      </div>
    </div>
  );
}
