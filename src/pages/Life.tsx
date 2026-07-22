import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Grid,
  WorldSize,
  makeGrid,
  randomize,
  step,
  countAlive,
  PATTERNS,
  PatternId,
  stampPattern,
  toggleCell,
} from "../features/life/engine";

const CELL = 8; // px per cell
const PATTERN_KEYS = Object.keys(PATTERNS) as PatternId[];

export default function Life() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<Grid>(new Uint8Array(0));
  const sizeRef = useRef<WorldSize>({ cols: 0, rows: 0 });
  const runningRef = useRef(false);
  const speedRef = useRef(12); // generations per second
  const paintingRef = useRef<null | 0 | 1>(null); // value being painted during drag
  const lastPaintRef = useRef(-1);

  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(12);
  const [generation, setGeneration] = useState(0);
  const [population, setPopulation] = useState(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { cols, rows } = sizeRef.current;
    const grid = gridRef.current;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#00ff41";
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (grid[y * cols + x]) {
          ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
        }
      }
    }
  }, []);

  const syncStats = useCallback((gen: number) => {
    setGeneration(gen);
    setPopulation(countAlive(gridRef.current));
  }, []);

  const setRunningBoth = useCallback((r: boolean) => {
    runningRef.current = r;
    setRunning(r);
  }, []);

  // Init canvas size + random soup, then run the generation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.parentElement!.getBoundingClientRect();
    const cols = Math.max(20, Math.floor(rect.width / CELL));
    const rows = Math.max(20, Math.floor(rect.height / CELL));
    canvas.width = cols * CELL;
    canvas.height = rows * CELL;
    sizeRef.current = { cols, rows };
    gridRef.current = randomize(makeGrid({ cols, rows }));

    let gen = 0;
    let last = 0;
    let raf = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      const interval = 1000 / speedRef.current;
      if (runningRef.current && t - last >= interval) {
        last = t;
        gridRef.current = step(gridRef.current, sizeRef.current);
        gen++;
        setGeneration(gen);
        setPopulation(countAlive(gridRef.current));
      }
      draw();
    };
    raf = requestAnimationFrame(loop);

    // Let the reset button zero the local counter via a custom event
    const onReset = () => { gen = 0; };
    canvas.addEventListener("life:resetgen", onReset);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("life:resetgen", onReset);
    };
  }, [draw]);

  const resetGeneration = useCallback(() => {
    canvasRef.current?.dispatchEvent(new Event("life:resetgen"));
    syncStats(0);
  }, [syncStats]);

  const handleClear = () => {
    gridRef.current = makeGrid(sizeRef.current);
    setRunningBoth(false);
    resetGeneration();
  };

  const handleRandom = () => {
    gridRef.current = randomize(makeGrid(sizeRef.current));
    resetGeneration();
  };

  const handlePattern = (p: PatternId) => {
    const { cols, rows } = sizeRef.current;
    gridRef.current = stampPattern(
      makeGrid(sizeRef.current),
      sizeRef.current,
      p,
      Math.floor(cols / 2) - 18,
      Math.floor(rows / 2) - 7
    );
    resetGeneration();
  };

  const handleStep = () => {
    gridRef.current = step(gridRef.current, sizeRef.current);
    setGeneration((g) => g + 1);
    setPopulation(countAlive(gridRef.current));
  };

  const cellFromEvent = (e: React.MouseEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * sizeRef.current.cols);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * sizeRef.current.rows);
    const { cols, rows } = sizeRef.current;
    if (x < 0 || y < 0 || x >= cols || y >= rows) return null;
    return { x, y };
  };

  const paintCell = (x: number, y: number) => {
    const { cols } = sizeRef.current;
    const idx = y * cols + x;
    if (idx === lastPaintRef.current) return;
    lastPaintRef.current = idx;
    if (paintingRef.current === null) {
      // First cell of the drag decides paint vs erase
      paintingRef.current = gridRef.current[idx] ? 0 : 1;
    }
    const next = new Uint8Array(gridRef.current);
    next[idx] = paintingRef.current;
    gridRef.current = next;
    setPopulation(countAlive(next));
  };

  const onMouseDown = (e: React.MouseEvent) => {
    const cell = cellFromEvent(e);
    if (!cell) return;
    paintingRef.current = null;
    lastPaintRef.current = -1;
    paintCell(cell.x, cell.y);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (paintingRef.current === null && lastPaintRef.current === -1) return;
    if (e.buttons !== 1) return;
    const cell = cellFromEvent(e);
    if (cell) paintCell(cell.x, cell.y);
  };

  const onMouseUp = () => {
    paintingRef.current = null;
    lastPaintRef.current = -1;
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
          <span className="text-sm">game of life</span>
        </div>
        <div className="text-xs text-primary/40">
          gen {generation} · pop {population}
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-3">
        <div className="flex gap-1 flex-wrap">
          {PATTERN_KEYS.map((p) => (
            <button
              key={p}
              onClick={() => handlePattern(p)}
              className="px-2 py-0.5 text-xs border border-primary/20 text-primary/40 hover:border-primary/50 hover:text-primary/70 transition-colors"
            >
              {PATTERNS[p].label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">speed</span>
          <input
            type="range"
            min={2}
            max={40}
            step={2}
            value={speed}
            onChange={(e) => {
              const v = Number(e.target.value);
              speedRef.current = v;
              setSpeed(v);
            }}
            className="w-24 accent-primary"
          />
          <span className="text-primary/60 text-xs w-10">{speed}/s</span>
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => setRunningBoth(!running)}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            {running ? "⏸ pause" : "▶ run"}
          </button>
          <button
            onClick={handleStep}
            disabled={running}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ⏭ step
          </button>
          <button
            onClick={handleRandom}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ⚄ soup
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ✕ clear
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
        <div className="absolute bottom-3 left-4 text-xs text-primary/30 pointer-events-none">
          click / drag to paint cells · edges wrap around
        </div>
      </div>
    </div>
  );
}
