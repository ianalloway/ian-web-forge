import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Ant, Turn, parseRule, palette, stepAnt } from "../features/langton/turmite";

const CELL = 4; // on-screen pixels per grid cell

interface Preset {
  rule: string;
  label: string;
  note: string;
}

const PRESETS: Preset[] = [
  { rule: "RL", label: "RL", note: "classic Langton — chaos, then a highway near step 10k" },
  { rule: "RLR", label: "RLR", note: "grows a chaotic, expanding blob" },
  { rule: "LLRR", label: "LLRR", note: "builds a symmetric cardioid" },
  { rule: "RRLL", label: "RRLL", note: "spiralling filled square" },
  { rule: "LRRRRRLLR", label: "LRRRRRLLR", note: "convex, near-triangular growth" },
  { rule: "RRLLLRLLLRRR", label: "RRLLLRLLLRRR", note: "filled triangle with clean edges" },
  { rule: "RLLLLLLLLL", label: "RLLLLLLLLL", note: "10 states — slow filigree" },
];

export default function Langton() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<ImageData | null>(null);
  const gridRef = useRef<Uint8Array>(new Uint8Array(0));
  const antsRef = useRef<Ant[]>([]);
  const ruleRef = useRef<Turn[]>(parseRule("RL"));
  const palRef = useRef(palette(2));
  const colsRef = useRef(0);
  const rowsRef = useRef(0);
  const stepsRef = useRef(0);

  const runningRef = useRef(true);
  const speedRef = useRef(1500);
  const antsCountRef = useRef(1);

  const [preset, setPreset] = useState("RL");
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1500);
  const [antCount, setAntCount] = useState(1);
  const [steps, setSteps] = useState(0);

  // (re)seed the grid and ants for the current rule / dimensions. Only ever
  // called from effects and event handlers — never during render.
  const reset = useCallback((cols: number, rows: number) => {
    const rule = ruleRef.current;
    palRef.current = palette(rule.length);
    gridRef.current = new Uint8Array(cols * rows);
    const cx = Math.floor(cols / 2);
    const cy = Math.floor(rows / 2);
    const n = antsCountRef.current;
    antsRef.current = Array.from({ length: n }, (_, i) => {
      const spread = n === 1 ? 0 : 6;
      return {
        x: (cx + (i - (n - 1) / 2) * spread + cols) % cols | 0,
        y: cy,
        dir: i & 3,
      };
    });
    colsRef.current = cols;
    rowsRef.current = rows;
    stepsRef.current = 0;
    setSteps(0);
  }, []);

  const applyPreset = (rule: string) => {
    setPreset(rule);
    ruleRef.current = parseRule(rule);
    reset(colsRef.current, rowsRef.current);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const off = document.createElement("canvas");
    offRef.current = off;
    const offCtx = off.getContext("2d");
    if (!offCtx) return;

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      const cols = Math.max(8, Math.floor(rect.width / CELL));
      const rows = Math.max(8, Math.floor(rect.height / CELL));
      off.width = cols;
      off.height = rows;
      imgRef.current = offCtx.createImageData(cols, rows);
      reset(cols, rows);
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let frame = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const cols = colsRef.current;
      const rows = rowsRef.current;
      const grid = gridRef.current;
      const img = imgRef.current;
      if (!img) return;

      if (runningRef.current) {
        const rule = ruleRef.current;
        const ants = antsRef.current;
        const budget = speedRef.current;
        for (let s = 0; s < budget; s++) {
          for (const ant of ants) stepAnt(grid, cols, rows, ant, rule);
        }
        stepsRef.current += budget;
      }

      // Repaint the whole grid from state (cheap: tens of thousands of cells).
      const data = img.data;
      const pal = palRef.current;
      for (let i = 0; i < grid.length; i++) {
        const c = pal[grid[i]] ?? pal[0];
        const o = i * 4;
        data[o] = c[0];
        data[o + 1] = c[1];
        data[o + 2] = c[2];
        data[o + 3] = 255;
      }
      offCtx.putImageData(img, 0, 0);
      ctx.drawImage(off, 0, 0, cols, rows, 0, 0, cols * CELL, rows * CELL);

      // Ant heads on top.
      ctx.fillStyle = "#eaffea";
      for (const ant of antsRef.current) {
        ctx.fillRect(ant.x * CELL - 1, ant.y * CELL - 1, CELL + 2, CELL + 2);
      }

      if ((frame++ & 7) === 0) setSteps(stepsRef.current);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [reset]);

  const activeNote = PRESETS.find((p) => p.rule === preset)?.note ?? "custom rule";

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">langton's ant</span>
        </div>
        <div className="text-xs text-primary/40 tabular-nums">
          rule {preset} · {steps.toLocaleString()} steps
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-primary/40 text-xs mr-1">rule</span>
          {PRESETS.map((p) => (
            <button
              key={p.rule}
              onClick={() => applyPreset(p.rule)}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                preset === p.rule
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/20 text-primary/50 hover:border-primary/50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-primary/40 text-xs">speed</span>
            <input
              type="range"
              min={100}
              max={8000}
              step={100}
              value={speed}
              onChange={(e) => {
                const v = Number(e.target.value);
                setSpeed(v);
                speedRef.current = v;
              }}
              className="w-28 accent-primary"
            />
            <span className="text-primary/60 text-xs w-16 tabular-nums">{speed}/frame</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-primary/40 text-xs">ants</span>
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => {
                  setAntCount(n);
                  antsCountRef.current = n;
                  reset(colsRef.current, rowsRef.current);
                }}
                className={`px-2 py-0.5 text-xs border transition-colors ${
                  antCount === n
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-primary/20 text-primary/50 hover:border-primary/50"
                }`}
              >
                {n}
              </button>
            ))}
          </div>

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
              onClick={() => reset(colsRef.current, rowsRef.current)}
              className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
            >
              ↺ reset
            </button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute bottom-3 left-4 text-xs text-primary/40 pointer-events-none max-w-xl">
          {activeNote}. one ant, one rule per cell state — no randomness. complexity is not
          designed here, it emerges.
        </div>
      </div>
    </div>
  );
}
