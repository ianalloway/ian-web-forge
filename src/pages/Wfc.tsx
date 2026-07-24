import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { TILES, WFC } from "../features/wfc/wfc";

const CS = 22; // pixels per tile

// Edge-midpoint offsets for directions N,E,S,W within a cell of size CS.
const EDGE = [
  [CS / 2, 0],
  [CS, CS / 2],
  [CS / 2, CS],
  [0, CS / 2],
];

export default function Wfc() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wfcRef = useRef<WFC | null>(null);
  const colsRef = useRef(0);
  const rowsRef = useRef(0);
  const holdRef = useRef(0); // frames to linger on a finished board before re-rolling
  const runningRef = useRef(true);
  const speedRef = useRef(8);
  const loopRef = useRef(true);

  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(8);
  const [loop, setLoop] = useState(true);
  const [status, setStatus] = useState("collapsing");
  const [pct, setPct] = useState(0);

  const rebuild = useCallback(() => {
    const cols = colsRef.current;
    const rows = rowsRef.current;
    if (cols > 0 && rows > 0) wfcRef.current = new WFC(cols, rows);
    holdRef.current = 0;
    setStatus("collapsing");
    setPct(0);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      colsRef.current = Math.max(4, Math.floor(rect.width / CS));
      rowsRef.current = Math.max(4, Math.floor(rect.height / CS));
      rebuild();
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let frame = 0;
    const loopFn = () => {
      raf = requestAnimationFrame(loopFn);
      const wfc = wfcRef.current;
      if (!wfc) return;
      const cols = colsRef.current;
      const rows = rowsRef.current;

      // Advance the solver.
      if (runningRef.current) {
        if (holdRef.current > 0) {
          if (--holdRef.current === 0 && loopRef.current) rebuild();
        } else {
          for (let s = 0; s < speedRef.current; s++) {
            const r = wfc.step();
            if (r === "contradiction") {
              rebuild();
              break;
            }
            if (r === "done") {
              holdRef.current = 90;
              setStatus("solved");
              break;
            }
          }
        }
      }

      // Render.
      const W = canvas.width;
      const H = canvas.height;
      ctx.fillStyle = "#050805";
      ctx.fillRect(0, 0, W, H);
      ctx.lineCap = "round";
      ctx.lineWidth = 2;

      const gw = cols * CS;
      const gh = rows * CS;
      const ox = ((W - gw) / 2) | 0;
      const oy = ((H - gh) / 2) | 0;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const i = row * cols + col;
          const x0 = ox + col * CS;
          const y0 = oy + row * CS;
          const t = wfc.tileAt(i);
          if (t < 0) {
            // Superposition: faint dot marking the un-collapsed frontier.
            ctx.fillStyle = "rgba(0,255,65,0.06)";
            ctx.beginPath();
            ctx.arc(x0 + CS / 2, y0 + CS / 2, 1.4, 0, Math.PI * 2);
            ctx.fill();
            continue;
          }
          const s = TILES[t].sockets;
          const deg = s[0] + s[1] + s[2] + s[3];
          const cx = x0 + CS / 2;
          const cy = y0 + CS / 2;
          // Traces from center to each wired edge.
          ctx.strokeStyle = "rgba(0,255,65,0.85)";
          for (let d = 0; d < 4; d++) {
            if (!s[d]) continue;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(x0 + EDGE[d][0], y0 + EDGE[d][1]);
            ctx.stroke();
          }
          // Node: brighter at junctions.
          if (deg >= 1) {
            ctx.fillStyle = deg >= 3 ? "#b6ffce" : "#00ff41";
            ctx.beginPath();
            ctx.arc(cx, cy, deg >= 3 ? 2.6 : 1.8, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      if ((frame++ & 7) === 0) {
        setPct(Math.round((wfc.collapsed / (cols * rows)) * 100));
      }
    };
    raf = requestAnimationFrame(loopFn);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [rebuild]);

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">wave function collapse</span>
        </div>
        <div className="text-xs text-primary/40 tabular-nums">
          {status} · {pct}% · 12 tiles
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">speed</span>
          <input
            type="range"
            min={1}
            max={40}
            step={1}
            value={speed}
            onChange={(e) => {
              const v = Number(e.target.value);
              setSpeed(v);
              speedRef.current = v;
            }}
            className="w-32 accent-primary"
          />
          <span className="text-primary/60 text-xs w-16 tabular-nums">{speed}/frame</span>
        </div>

        <button
          onClick={() => {
            loopRef.current = !loop;
            setLoop(!loop);
          }}
          className={`px-2 py-0.5 text-xs border transition-colors ${
            loop
              ? "border-primary bg-primary/10 text-primary"
              : "border-primary/20 text-primary/40 hover:border-primary/50"
          }`}
        >
          auto-loop {loop ? "on" : "off"}
        </button>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => {
              runningRef.current = !running;
              setRunning(!running);
            }}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            {running ? "⏸ pause" : "▶ run"}
          </button>
          <button
            onClick={() => rebuild()}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ↺ new board
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute bottom-3 left-4 text-xs text-primary/40 pointer-events-none max-w-xl">
          each cell starts as every tile at once. the lowest-entropy cell collapses to one tile,
          then that choice propagates along matching edges — order assembled from local rules alone.
        </div>
      </div>
    </div>
  );
}
