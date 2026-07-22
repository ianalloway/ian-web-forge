import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  SeedMode,
  ruleToTable,
  nextRow,
  seedRow,
  NOTABLE_RULES,
  RULE_NOTES,
} from "../features/eca/rules";

const CELL = 3; // px per cell

export default function Eca() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rowRef = useRef<Uint8Array>(new Uint8Array(0));
  const yRef = useRef(0);
  const ruleRef = useRef(30);
  const seedRef = useRef<SeedMode>("single");
  const runningRef = useRef(true);

  const [rule, setRule] = useState(30);
  const [seed, setSeed] = useState<SeedMode>("single");
  const [running, setRunning] = useState(true);

  const restart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const cols = Math.floor(canvas.width / CELL);
    rowRef.current = seedRow(cols, seedRef.current);
    yRef.current = 0;
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
      restart();
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!runningRef.current) return;
      const rows = Math.floor(canvas.height / CELL);
      const table = ruleToTable(ruleRef.current);

      // Draw a few generations per frame
      for (let step = 0; step < 3; step++) {
        const y = yRef.current;
        if (y >= rows) {
          // Scroll up by shifting the canvas image and keep going
          ctx.drawImage(canvas, 0, -CELL);
          ctx.fillStyle = "#000";
          ctx.fillRect(0, (rows - 1) * CELL, canvas.width, CELL);
          yRef.current = rows - 1;
        }
        const row = rowRef.current;
        const drawY = Math.min(yRef.current, rows - 1) * CELL;
        ctx.fillStyle = "#00ff41";
        for (let i = 0; i < row.length; i++) {
          if (row[i]) ctx.fillRect(i * CELL, drawY, CELL, CELL);
        }
        rowRef.current = nextRow(row, table);
        yRef.current++;
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [restart]);

  const applyRule = (r: number) => {
    const clamped = Math.max(0, Math.min(255, r));
    ruleRef.current = clamped;
    setRule(clamped);
    restart();
  };

  const note = RULE_NOTES[rule];

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">elementary cellular automata</span>
        </div>
        <div className="text-xs text-primary/40">
          Rule {rule}{note && <span className="text-primary/25"> · {note}</span>}
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">rule</span>
          <input
            type="range"
            min={0}
            max={255}
            value={rule}
            onChange={(e) => applyRule(Number(e.target.value))}
            className="w-40 accent-primary"
          />
          <input
            type="number"
            min={0}
            max={255}
            value={rule}
            onChange={(e) => applyRule(Number(e.target.value))}
            className="w-16 bg-transparent border border-primary/20 focus:border-primary/60 outline-none px-2 py-0.5 text-xs text-primary text-center"
          />
        </div>

        <div className="flex gap-1 flex-wrap">
          {NOTABLE_RULES.map((r) => (
            <button
              key={r}
              onClick={() => applyRule(r)}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                rule === r
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/20 text-primary/40 hover:border-primary/50 hover:text-primary/70"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          {(["single", "random"] as SeedMode[]).map((s) => (
            <button
              key={s}
              onClick={() => { seedRef.current = s; setSeed(s); restart(); }}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                seed === s
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/20 text-primary/40 hover:border-primary/50 hover:text-primary/70"
              }`}
            >
              {s === "single" ? "single seed" : "random seed"}
            </button>
          ))}
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => { runningRef.current = !running; setRunning(!running); }}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            {running ? "⏸ pause" : "▶ resume"}
          </button>
          <button
            onClick={restart}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ↺ restart
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute bottom-3 left-4 text-xs text-primary/30 pointer-events-none">
          each cell's next state depends on itself and its two neighbors — 256 rules, wildly different worlds
        </div>
      </div>
    </div>
  );
}
