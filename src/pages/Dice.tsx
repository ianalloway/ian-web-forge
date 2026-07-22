import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  DiceState,
  newDiceState,
  rollMany,
  theoreticalStats,
  normalOverlay,
  empiricalMean,
} from "../features/dice/clt";

const DICE_OPTIONS = [1, 2, 5, 10];
const SIDES_OPTIONS = [6, 8, 20];

export default function Dice() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<DiceState>(newDiceState(2, 6));
  const autoRef = useRef(false);

  const [diceCount, setDiceCount] = useState(2);
  const [sides, setSides] = useState(6);
  const [auto, setAuto] = useState(false);
  const [totalRolls, setTotalRolls] = useState(0);
  const [lastRoll, setLastRoll] = useState<number[]>([]);
  const [empMean, setEmpMean] = useState(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: W, height: H } = canvas;
    const s = stateRef.current;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    const buckets = s.counts.length;
    const maxCount = Math.max(1, ...s.counts);
    const gap = buckets > 40 ? 0 : 2;
    const barW = (W - 40) / buckets - gap;
    const baseY = H - 30;

    // Bars
    s.counts.forEach((c, i) => {
      const h = (c / maxCount) * (H - 70);
      const x = 20 + i * (barW + gap);
      ctx.fillStyle = "rgba(0,255,65,0.55)";
      ctx.fillRect(x, baseY - h, Math.max(1, barW), h);
    });

    // Normal overlay (scaled to the same max as bars)
    if (s.totalRolls > 0 && s.diceCount > 1) {
      const peakOverlay = normalOverlay(s, Math.round(theoreticalStats(s).mean));
      if (peakOverlay > 0) {
        ctx.strokeStyle = "#ffe066";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < buckets; i++) {
          const sum = i + s.diceCount;
          const v = normalOverlay(s, sum);
          const h = (v / peakOverlay) * ((Math.max(...s.counts) / maxCount) * (H - 70));
          const x = 20 + i * (barW + gap) + barW / 2;
          if (i === 0) ctx.moveTo(x, baseY - h);
          else ctx.lineTo(x, baseY - h);
        }
        ctx.stroke();
      }
    }

    // Axis labels: min, mean, max
    ctx.fillStyle = "rgba(0,255,65,0.4)";
    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.fillText(String(s.diceCount), 20, H - 14);
    ctx.textAlign = "right";
    ctx.fillText(String(s.diceCount * s.sides), W - 20, H - 14);
    const { mean } = theoreticalStats(s);
    const meanX = 20 + ((mean - s.diceCount) / (buckets - 1)) * (W - 40);
    ctx.textAlign = "center";
    ctx.fillText(`μ=${mean.toFixed(1)}`, meanX, H - 14);
    ctx.strokeStyle = "rgba(255,224,102,0.3)";
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(meanX, 30);
    ctx.lineTo(meanX, baseY);
    ctx.stroke();
    ctx.setLineDash([]);
  }, []);

  const syncStats = useCallback(() => {
    const s = stateRef.current;
    setTotalRolls(s.totalRolls);
    setLastRoll([...s.lastRoll]);
    setEmpMean(empiricalMean(s));
  }, []);

  const reset = useCallback((dc: number, sd: number) => {
    stateRef.current = newDiceState(dc, sd);
    syncStats();
    draw();
  }, [draw, syncStats]);

  const roll = useCallback((n: number) => {
    rollMany(stateRef.current, n);
    syncStats();
    draw();
  }, [draw, syncStats]);

  // Auto-roll loop
  useEffect(() => {
    const id = setInterval(() => {
      if (!autoRef.current) return;
      rollMany(stateRef.current, 200);
      syncStats();
      draw();
    }, 60);
    return () => clearInterval(id);
  }, [draw, syncStats]);

  // Canvas sizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      draw();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [draw]);

  const { mean, sd } = theoreticalStats({ diceCount, sides, counts: [], totalRolls: 0, lastRoll: [] });

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">dice & the bell curve</span>
        </div>
        <div className="text-xs text-primary/40 flex gap-4 tabular-nums">
          <span>{totalRolls.toLocaleString()} rolls</span>
          {totalRolls > 0 && (
            <span>
              mean {empMean.toFixed(2)} <span className="text-primary/25">(μ {mean.toFixed(1)})</span>
            </span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1">
          <span className="text-primary/40 text-xs mr-1">dice</span>
          {DICE_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => { setDiceCount(n); reset(n, sides); }}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                diceCount === n
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/20 text-primary/40 hover:border-primary/50 hover:text-primary/70"
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <span className="text-primary/40 text-xs mr-1">d</span>
          {SIDES_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => { setSides(n); reset(diceCount, n); }}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                sides === n
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/20 text-primary/40 hover:border-primary/50 hover:text-primary/70"
              }`}
            >
              d{n}
            </button>
          ))}
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => roll(1)}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            🎲 roll
          </button>
          <button
            onClick={() => roll(1000)}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ×1000
          </button>
          <button
            onClick={() => { autoRef.current = !auto; setAuto(!auto); }}
            className={`px-3 py-1 text-xs border transition-colors ${
              auto
                ? "border-primary bg-primary/10 text-primary"
                : "border-primary/30 text-primary/70 hover:border-primary hover:text-primary"
            }`}
          >
            {auto ? "⏸ stop" : "▶ auto"}
          </button>
          <button
            onClick={() => reset(diceCount, sides)}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ↺ reset
          </button>
        </div>
      </div>

      {/* Last roll */}
      {lastRoll.length > 0 && (
        <div className="border-b border-primary/10 px-4 py-2 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-primary/30">last roll</span>
          {lastRoll.map((f, i) => (
            <span
              key={i}
              className="inline-flex items-center justify-center w-7 h-7 border border-primary/30 text-sm text-primary/80"
            >
              {f}
            </span>
          ))}
          <span className="text-xs text-primary/50 ml-1">
            = {lastRoll.reduce((a, b) => a + b, 0)}
          </span>
        </div>
      )}

      {/* Histogram */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute bottom-1 left-4 text-xs text-primary/30 pointer-events-none">
          σ = {sd.toFixed(2)} · yellow curve: normal approximation — more dice per roll → closer fit
        </div>
      </div>
    </div>
  );
}
