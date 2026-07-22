import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  GaltonState,
  newGalton,
  spawnBall,
  stepBalls,
  binomialPmf,
  ballX,
} from "../features/galton/board";

const ROW_OPTIONS = [8, 12, 16];

export default function Galton() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GaltonState>(newGalton(12, 0.5));
  const runningRef = useRef(true);
  const rateRef = useRef(3); // balls per 10 frames

  const [rows, setRows] = useState(12);
  const [p, setP] = useState(0.5);
  const [running, setRunning] = useState(true);
  const [dropped, setDropped] = useState(0);

  const reset = useCallback((r: number, prob: number) => {
    stateRef.current = newGalton(r, prob);
    setDropped(0);
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
    };
    resize();
    window.addEventListener("resize", resize);

    let frame = 0;
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      frame++;
      const s = stateRef.current;
      const { width: W, height: H } = canvas;

      if (runningRef.current) {
        if (frame % 10 < rateRef.current && s.balls.length < 120) spawnBall(s);
        stepBalls(s, 0.12);
        if (frame % 10 === 0) setDropped(s.dropped);
      }

      // Layout: pegs occupy top 55%, bins the rest
      const pegTop = 40;
      const pegBottom = H * 0.55;
      const rowH = (pegBottom - pegTop) / s.rows;
      const binW = Math.min(36, (W - 60) / (s.rows + 1));
      const cx = W / 2;

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      // Pegs
      ctx.fillStyle = "rgba(0,255,65,0.4)";
      for (let r = 0; r < s.rows; r++) {
        const y = pegTop + (r + 1) * rowH;
        for (let k = 0; k <= r; k++) {
          const x = cx + (k - r / 2) * binW;
          ctx.beginPath();
          ctx.arc(x, y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Balls
      ctx.fillStyle = "#00ff41";
      for (const b of s.balls) {
        const y = pegTop + (b.row + b.progress) * rowH;
        const x = cx + ballX(b, s) * binW;
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Bins
      const binTop = pegBottom + 20;
      const binMax = Math.max(1, ...s.bins);
      const binAreaH = H - binTop - 26;
      s.bins.forEach((count, k) => {
        const x = cx + (k - s.rows / 2) * binW;
        const h = (count / binMax) * binAreaH;
        ctx.fillStyle = "rgba(0,255,65,0.5)";
        ctx.fillRect(x - binW / 2 + 2, H - 26 - h, binW - 4, h);
      });

      // Binomial expectation overlay: expected count = dropped × pmf,
      // drawn on the same scale as the bars
      if (s.dropped > 20) {
        ctx.strokeStyle = "#ffe066";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        s.bins.forEach((_, k) => {
          const x = cx + (k - s.rows / 2) * binW;
          const expected = s.dropped * binomialPmf(s.rows, s.p, k);
          const h = Math.min(binAreaH, (expected / binMax) * binAreaH);
          const y = H - 26 - h;
          if (k === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }

      // Bin divider baseline
      ctx.strokeStyle = "rgba(0,255,65,0.25)";
      ctx.beginPath();
      ctx.moveTo(30, H - 25.5);
      ctx.lineTo(W - 30, H - 25.5);
      ctx.stroke();
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">galton board</span>
        </div>
        <div className="text-xs text-primary/40 tabular-nums">
          {dropped.toLocaleString()} balls landed
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1">
          <span className="text-primary/40 text-xs mr-1">rows</span>
          {ROW_OPTIONS.map((r) => (
            <button
              key={r}
              onClick={() => { setRows(r); reset(r, p); }}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                rows === r
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/20 text-primary/40 hover:border-primary/50 hover:text-primary/70"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">bias p(right)</span>
          <input
            type="range"
            min={0.2}
            max={0.8}
            step={0.05}
            value={p}
            onChange={(e) => {
              const v = Number(e.target.value);
              setP(v);
              reset(rows, v);
            }}
            className="w-24 accent-primary"
          />
          <span className="text-primary/60 text-xs w-8">{p.toFixed(2)}</span>
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => {
              runningRef.current = !running;
              setRunning(!running);
            }}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            {running ? "⏸ pause" : "▶ resume"}
          </button>
          <button
            onClick={() => reset(rows, p)}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ↺ reset
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute bottom-1 left-4 text-xs text-primary/30 pointer-events-none">
          each peg deflects right with probability p — bins fill toward the binomial (yellow)
        </div>
      </div>
    </div>
  );
}
