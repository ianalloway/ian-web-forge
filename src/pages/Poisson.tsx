import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PoissonDisk } from "../features/poisson/bridson";

export default function Poisson() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const samplerRef = useRef<PoissonDisk | null>(null);
  const radiusRef = useRef(16);
  const speedRef = useRef(12);
  const runningRef = useRef(true);

  const [radius, setRadius] = useState(16);
  const [speed, setSpeed] = useState(12);
  const [running, setRunning] = useState(true);
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);

  const rebuild = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0) return;
    samplerRef.current = new PoissonDisk(canvas.width, canvas.height, radiusRef.current);
    setCount(0);
    setDone(false);
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
      rebuild();
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let frame = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const s = samplerRef.current;
      if (!s) return;

      if (runningRef.current && !s.done) {
        for (let k = 0; k < speedRef.current; k++) {
          s.step();
          if (s.done) break;
        }
      }

      const pts = s.snapshot().points;
      const n = pts.length / 2;
      const dotR = Math.max(1.5, Math.min(4, radiusRef.current * 0.16));

      ctx.fillStyle = "#050805";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // All points, dim.
      ctx.fillStyle = "rgba(0,190,70,0.72)";
      for (let i = 0; i < n; i++) {
        ctx.beginPath();
        ctx.arc(pts[i * 2], pts[i * 2 + 1], dotR, 0, Math.PI * 2);
        ctx.fill();
      }
      // Recent additions, bright, to show the growth front.
      if (!s.done) {
        ctx.fillStyle = "#c9ffd6";
        for (let i = Math.max(0, n - 24); i < n; i++) {
          ctx.beginPath();
          ctx.arc(pts[i * 2], pts[i * 2 + 1], dotR + 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if ((frame++ & 3) === 0) {
        setCount(n);
        setDone(s.done);
      }
    };
    raf = requestAnimationFrame(loop);

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
          <span className="text-sm">poisson-disk sampling</span>
        </div>
        <div className="text-xs text-primary/40 tabular-nums">
          {count.toLocaleString()} points{done ? " · complete" : " · filling"}
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">radius</span>
          <input
            type="range"
            min={8}
            max={42}
            step={1}
            value={radius}
            onChange={(e) => {
              const v = Number(e.target.value);
              setRadius(v);
              radiusRef.current = v;
              rebuild();
            }}
            className="w-32 accent-primary"
          />
          <span className="text-primary/60 text-xs w-8 tabular-nums">{radius}px</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">speed</span>
          <input
            type="range"
            min={1}
            max={60}
            step={1}
            value={speed}
            onChange={(e) => {
              const v = Number(e.target.value);
              setSpeed(v);
              speedRef.current = v;
            }}
            className="w-24 accent-primary"
          />
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
            onClick={() => rebuild()}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ↺ new
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute bottom-3 left-4 text-xs text-primary/40 pointer-events-none max-w-xl">
          from each new point, throw darts into the ring around it; keep the first that lands far
          enough from every neighbor. a background grid makes that test instant — the result is "blue
          noise": evenly spaced, never clumped.
        </div>
      </div>
    </div>
  );
}
