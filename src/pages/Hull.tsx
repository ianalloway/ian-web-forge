import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { HullResult, Pt, monotoneChain } from "../features/hull/hull";

export default function Hull() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Points stored normalized in [0,1] so they survive resizes.
  const ptsRef = useRef<Pt[]>([]);
  const resultRef = useRef<HullResult | null>(null);
  const frameRef = useRef(0); // current animation frame index
  const playingRef = useRef(true);
  const speedRef = useRef(6);
  const accRef = useRef(0);
  const dimsRef = useRef<[number, number]>([1, 1]);

  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);
  const [speed, setSpeed] = useState(6);

  // Recompute the hull + animation trace from the current points, in pixels.
  const recompute = useCallback(() => {
    const [w, h] = dimsRef.current;
    const px = ptsRef.current.map((p) => ({ x: p.x * w, y: p.y * h }));
    resultRef.current = px.length >= 3 ? monotoneChain(px) : null;
    frameRef.current = 0;
    accRef.current = 0;
    setDone(px.length < 3);
    setCount(px.length);
  }, []);

  const scatter = useCallback(
    (n: number) => {
      const next = ptsRef.current.slice();
      for (let i = 0; i < n; i++) {
        next.push({ x: 0.08 + Math.random() * 0.84, y: 0.1 + Math.random() * 0.8 });
      }
      ptsRef.current = next;
      recompute();
    },
    [recompute]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      dimsRef.current = [rect.width, rect.height];
      recompute();
    };
    resize();
    window.addEventListener("resize", resize);
    if (ptsRef.current.length === 0) scatter(14);

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const W = canvas.width;
      const H = canvas.height;
      const res = resultRef.current;

      // Advance animation.
      if (res && playingRef.current && frameRef.current < res.frames.length) {
        accRef.current += speedRef.current;
        while (accRef.current >= 1 && frameRef.current < res.frames.length) {
          accRef.current -= 1;
          frameRef.current++;
        }
        if (frameRef.current >= res.frames.length) setDone(true);
      }

      // Draw.
      ctx.fillStyle = "#050805";
      ctx.fillRect(0, 0, W, H);

      const pts = ptsRef.current;
      if (res) {
        const S = res.sorted;
        const fi = Math.min(frameRef.current, res.frames.length - 1);
        const frame = res.frames[fi];
        const finished = frameRef.current >= res.frames.length;

        // Hull-in-progress (or final hull) polyline.
        const chain = finished ? res.hull : frame.chain;
        if (chain.length >= 2) {
          ctx.beginPath();
          ctx.moveTo(S[chain[0]].x, S[chain[0]].y);
          for (let i = 1; i < chain.length; i++) ctx.lineTo(S[chain[i]].x, S[chain[i]].y);
          if (finished) ctx.closePath();
          ctx.strokeStyle = finished ? "rgba(0,255,65,0.9)" : "rgba(0,255,65,0.55)";
          ctx.lineWidth = 2;
          ctx.stroke();
          if (finished) {
            ctx.fillStyle = "rgba(0,255,65,0.07)";
            ctx.fill();
          }
        }

        // The point currently being considered.
        if (!finished) {
          const c = S[frame.processed];
          ctx.strokeStyle = frame.popped ? "rgba(255,80,80,0.9)" : "rgba(180,255,200,0.9)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(c.x, c.y, 7, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // All points on top.
      const [w, h] = dimsRef.current;
      ctx.fillStyle = "#00ff41";
      for (const p of pts) {
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [recompute, scatter]);

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    ptsRef.current = [
      ...ptsRef.current,
      { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height },
    ];
    recompute();
  };

  const clear = () => {
    ptsRef.current = [];
    recompute();
  };

  const replay = () => {
    frameRef.current = 0;
    accRef.current = 0;
    setDone(false);
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
          <span className="text-sm">convex hull</span>
        </div>
        <div className="text-xs text-primary/40 tabular-nums">
          {count} points · monotone chain{done && count >= 3 ? " · done" : ""}
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <span className="text-primary/30 text-xs hidden md:inline">click to add a point</span>
        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">speed</span>
          <input
            type="range"
            min={1}
            max={30}
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
            onClick={() => scatter(12)}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            + scatter 12
          </button>
          <button
            onClick={replay}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ↺ replay
          </button>
          <button
            onClick={clear}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ✕ clear
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} onClick={onClick} className="block w-full h-full cursor-crosshair" />
        <div className="absolute bottom-3 left-4 text-xs text-primary/40 pointer-events-none max-w-xl">
          sort by x, then sweep: keep a point only while the last turn stays left. a red ring marks a
          point being popped off because it would dent the hull inward.
        </div>
      </div>
    </div>
  );
}
