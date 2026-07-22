import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  PercField,
  CRITICAL_P,
  newField,
  analyze,
} from "../features/percolation/perc";

const CELL = 6;

export default function Percolation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fieldRef = useRef<PercField | null>(null);
  const sweepRef = useRef(false);
  const sweepDirRef = useRef(1);
  const pRef = useRef(0.45);

  const [p, setP] = useState(0.45);
  const [sweep, setSweep] = useState(false);
  const [percolates, setPercolates] = useState(false);
  const [fillPct, setFillPct] = useState(0);
  const [largestPct, setLargestPct] = useState(0);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const field = fieldRef.current;
    if (!canvas || !field) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const result = analyze(field, pRef.current);
    const { cols, rows } = field;
    const n = cols * rows;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < n; i++) {
      if (!result.open[i]) continue;
      const x = (i % cols) * CELL;
      const y = ((i / cols) | 0) * CELL;
      if (result.cluster[i] === result.spanningId && result.spanningId !== -1) {
        ctx.fillStyle = "#00ff41"; // the spanning cluster glows
      } else {
        ctx.fillStyle = "rgba(0,255,65,0.22)";
      }
      ctx.fillRect(x, y, CELL - 1, CELL - 1);
    }

    setPercolates(result.spanningId !== -1);
    setFillPct((result.openCount / n) * 100);
    setLargestPct((result.largestSize / n) * 100);
  }, []);

  // Init + sweep loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      const cols = Math.max(40, Math.floor(rect.width / CELL));
      const rows = Math.max(40, Math.floor(rect.height / CELL));
      canvas.width = cols * CELL;
      canvas.height = rows * CELL;
      fieldRef.current = newField(cols, rows);
      render();
    };
    resize();
    window.addEventListener("resize", resize);

    const id = setInterval(() => {
      if (!sweepRef.current) return;
      let next = pRef.current + 0.002 * sweepDirRef.current;
      if (next > 0.75) { next = 0.75; sweepDirRef.current = -1; }
      if (next < 0.35) { next = 0.35; sweepDirRef.current = 1; }
      pRef.current = next;
      setP(next);
      render();
    }, 50);

    return () => {
      clearInterval(id);
      window.removeEventListener("resize", resize);
    };
  }, [render]);

  const handleP = (v: number) => {
    pRef.current = v;
    setP(v);
    sweepRef.current = false;
    setSweep(false);
    render();
  };

  const distFromCritical = p - CRITICAL_P;

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">percolation</span>
        </div>
        <div className="text-xs tabular-nums flex gap-4">
          <span className={percolates ? "text-primary" : "text-primary/40"}>
            {percolates ? "⚡ percolates" : "· disconnected"}
          </span>
          <span className="text-primary/40">fill {fillPct.toFixed(1)}%</span>
          <span className="text-primary/40">largest {largestPct.toFixed(1)}%</span>
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">p</span>
          <input
            type="range"
            min={0.3}
            max={0.8}
            step={0.002}
            value={p}
            onChange={(e) => handleP(Number(e.target.value))}
            className="w-48 accent-primary"
          />
          <span className="text-primary/70 text-xs w-12 tabular-nums">{p.toFixed(3)}</span>
          <span className={`text-xs tabular-nums ${Math.abs(distFromCritical) < 0.02 ? "text-yellow-300" : "text-primary/30"}`}>
            p_c ≈ {CRITICAL_P} ({distFromCritical >= 0 ? "+" : ""}{distFromCritical.toFixed(3)})
          </span>
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => {
              sweepRef.current = !sweep;
              setSweep(!sweep);
            }}
            className={`px-3 py-1 text-xs border transition-colors ${
              sweep
                ? "border-primary bg-primary/10 text-primary"
                : "border-primary/30 text-primary/70 hover:border-primary hover:text-primary"
            }`}
          >
            {sweep ? "⏸ stop sweep" : "▶ auto sweep"}
          </button>
          <button
            onClick={() => {
              const canvas = canvasRef.current;
              if (!canvas || !fieldRef.current) return;
              fieldRef.current = newField(fieldRef.current.cols, fieldRef.current.rows);
              render();
            }}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ⚄ new field
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block" />
        <div className="absolute bottom-3 left-4 text-xs text-primary/30 pointer-events-none max-w-xl">
          sites open with probability p over a fixed random field — bright green marks the cluster
          connecting top to bottom. it appears abruptly near p_c: a phase transition.
        </div>
      </div>
    </div>
  );
}
