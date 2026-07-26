import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Ball, fieldAt, marchingSquares } from "../features/metaballs/marchingSquares";

const CELL = 9; // grid sample spacing in pixels

export default function Metaballs() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ballsRef = useRef<Ball[]>([]);
  const valsRef = useRef<Float32Array>(new Float32Array(0));
  const colsRef = useRef(0);
  const rowsRef = useRef(0);
  const isoRef = useRef(1);
  const speedRef = useRef(1);
  const runningRef = useRef(true);

  const [count, setCount] = useState(5);
  const [iso, setIso] = useState(1);
  const [running, setRunning] = useState(true);

  const makeBalls = useCallback((n: number, w: number, h: number) => {
    ballsRef.current = Array.from({ length: n }, () => {
      const r = 26 + Math.random() * 26;
      const ang = Math.random() * Math.PI * 2;
      const sp = 0.6 + Math.random() * 1.1;
      return {
        x: r + Math.random() * (w - 2 * r),
        y: r + Math.random() * (h - 2 * r),
        r,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
      };
    });
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
      colsRef.current = Math.ceil(rect.width / CELL) + 1;
      rowsRef.current = Math.ceil(rect.height / CELL) + 1;
      valsRef.current = new Float32Array(colsRef.current * rowsRef.current);
      if (ballsRef.current.length === 0) makeBalls(count, rect.width, rect.height);
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const W = canvas.width;
      const H = canvas.height;
      const balls = ballsRef.current;

      if (runningRef.current) {
        const sp = speedRef.current;
        for (const b of balls) {
          b.x += b.vx * sp;
          b.y += b.vy * sp;
          if (b.x < 0) {
            b.x = 0;
            b.vx = Math.abs(b.vx);
          } else if (b.x > W) {
            b.x = W;
            b.vx = -Math.abs(b.vx);
          }
          if (b.y < 0) {
            b.y = 0;
            b.vy = Math.abs(b.vy);
          } else if (b.y > H) {
            b.y = H;
            b.vy = -Math.abs(b.vy);
          }
        }
      }

      // Background.
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#050805";
      ctx.fillRect(0, 0, W, H);

      // Soft additive glow gives the balls a gooey body.
      ctx.globalCompositeOperation = "lighter";
      for (const b of balls) {
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * 2.6);
        g.addColorStop(0, "rgba(0,255,65,0.30)");
        g.addColorStop(1, "rgba(0,255,65,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r * 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";

      // Sample the field on the grid.
      const cols = colsRef.current;
      const rows = rowsRef.current;
      const vals = valsRef.current;
      for (let gy = 0; gy < rows; gy++) {
        const py = gy * CELL;
        for (let gx = 0; gx < cols; gx++) {
          vals[gy * cols + gx] = fieldAt(gx * CELL, py, balls);
        }
      }

      // Marching-squares iso-contour outline.
      const segs = marchingSquares(vals, cols, rows, isoRef.current, 0, 0, CELL, CELL);
      ctx.beginPath();
      for (let i = 0; i < segs.length; i += 4) {
        ctx.moveTo(segs[i], segs[i + 1]);
        ctx.lineTo(segs[i + 2], segs[i + 3]);
      }
      ctx.strokeStyle = "rgba(180,255,200,0.9)";
      ctx.lineWidth = 1.6;
      ctx.stroke();
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [count, makeBalls]);

  const chooseCount = (n: number) => {
    setCount(n);
    const canvas = canvasRef.current;
    if (canvas) makeBalls(n, canvas.width, canvas.height);
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
          <span className="text-sm">metaballs · marching squares</span>
        </div>
        <div className="text-xs text-primary/40 tabular-nums">
          {count} balls · iso {iso.toFixed(2)}
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-primary/40 text-xs mr-1">balls</span>
          {[2, 3, 5, 7, 9].map((n) => (
            <button
              key={n}
              onClick={() => chooseCount(n)}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                count === n
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/20 text-primary/50 hover:border-primary/50"
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">threshold</span>
          <input
            type="range"
            min={0.5}
            max={1.8}
            step={0.05}
            value={iso}
            onChange={(e) => {
              const v = Number(e.target.value);
              setIso(v);
              isoRef.current = v;
            }}
            className="w-28 accent-primary"
          />
          <span className="text-primary/60 text-xs w-8 tabular-nums">{iso.toFixed(2)}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">speed</span>
          <input
            type="range"
            min={0.2}
            max={2.5}
            step={0.1}
            defaultValue={1}
            onChange={(e) => {
              speedRef.current = Number(e.target.value);
            }}
            className="w-20 accent-primary"
          />
        </div>

        <button
          onClick={() => {
            runningRef.current = !running;
            setRunning(!running);
          }}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors ml-auto"
        >
          {running ? "⏸ pause" : "▶ run"}
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute bottom-3 left-4 text-xs text-primary/40 pointer-events-none max-w-xl">
          each blob radiates an inverse-square field; the bright line is where the sum crosses a
          threshold, traced cell by cell with marching squares. drop the threshold and separate blobs
          reach out and fuse.
        </div>
      </div>
    </div>
  );
}
