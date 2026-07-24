import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { sequence } from "../features/collatz/collatz";

const SEG = 5; // pixels per step

export default function Collatz() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nextRef = useRef(1); // next starting number to draw
  const bendRef = useRef(0.16); // radians per step
  const countRef = useRef(4000);
  const batchRef = useRef(40);
  const runningRef = useRef(true);

  const [bendDeg, setBendDeg] = useState(9);
  const [count, setCount] = useState(4000);
  const [drawn, setDrawn] = useState(0);

  const reset = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#050805";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    nextRef.current = 1;
    setDrawn(0);
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
      reset();
    };
    resize();
    window.addEventListener("resize", resize);

    // Draw one number's reversed trajectory as a parity-bent path from the root.
    const drawOne = (n: number) => {
      const seq = sequence(n);
      const bend = bendRef.current;
      let x = canvas.width / 2;
      let y = canvas.height - 8;
      let heading = -Math.PI / 2; // up
      ctx.beginPath();
      ctx.moveTo(x, y);
      // Walk from 1 outward (reverse order); turn by parity of each value.
      for (let i = seq.length - 1; i >= 0; i--) {
        heading += seq[i] % 2 === 0 ? bend : -bend;
        x += Math.cos(heading) * SEG;
        y += Math.sin(heading) * SEG;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!runningRef.current) return;
      const target = countRef.current;
      if (nextRef.current > target) return;

      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = "rgba(0,200,70,0.16)";
      ctx.lineWidth = 1;
      const end = Math.min(target, nextRef.current + batchRef.current - 1);
      for (let n = nextRef.current; n <= end; n++) drawOne(n);
      nextRef.current = end + 1;
      setDrawn(end);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [reset]);

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">collatz coral</span>
        </div>
        <div className="text-xs text-primary/40 tabular-nums">
          {drawn.toLocaleString()} / {count.toLocaleString()} trajectories
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">bend</span>
          <input
            type="range"
            min={2}
            max={22}
            step={1}
            value={bendDeg}
            onChange={(e) => {
              const v = Number(e.target.value);
              setBendDeg(v);
              bendRef.current = (v * Math.PI) / 180;
              reset();
            }}
            className="w-32 accent-primary"
          />
          <span className="text-primary/60 text-xs w-8 tabular-nums">{bendDeg}°</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">numbers</span>
          <input
            type="range"
            min={500}
            max={12000}
            step={500}
            value={count}
            onChange={(e) => {
              const v = Number(e.target.value);
              setCount(v);
              countRef.current = v;
              reset();
            }}
            className="w-32 accent-primary"
          />
          <span className="text-primary/60 text-xs w-12 tabular-nums">{count}</span>
        </div>

        <button
          onClick={reset}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors ml-auto"
        >
          ↺ redraw
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute bottom-3 left-4 text-xs text-primary/40 pointer-events-none max-w-xl">
          every number's 3n+1 descent to 1, drawn from a shared root and bent one way at each even
          step, the other at each odd. the paths merge on their common tails — order growing like coral
          from a conjecture no one has proved.
        </div>
      </div>
    </div>
  );
}
