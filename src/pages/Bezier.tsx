import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Pt,
  deCasteljauLevels,
  sampleCurve,
  defaultPoints,
  MAX_POINTS,
  MIN_POINTS,
} from "../features/bezier/decasteljau";

const LEVEL_COLORS = [
  "rgba(255,255,255,0.25)",
  "rgba(0,207,255,0.6)",
  "rgba(255,224,102,0.6)",
  "rgba(255,107,53,0.6)",
  "rgba(185,126,255,0.6)",
  "rgba(255,77,166,0.6)",
  "rgba(77,255,219,0.6)",
];

export default function Bezier() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<Pt[]>([]);
  const dragIdxRef = useRef(-1);
  const tRef = useRef(0);
  const animateRef = useRef(true);
  const showLevelsRef = useRef(true);

  const [animate, setAnimate] = useState(true);
  const [showLevels, setShowLevels] = useState(true);
  const [tDisplay, setTDisplay] = useState(0);
  const [pointCount, setPointCount] = useState(4);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      if (pointsRef.current.length === 0) {
        pointsRef.current = defaultPoints(canvas.width, canvas.height);
        setPointCount(pointsRef.current.length);
      }
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let frame = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      frame++;
      const { width: W, height: H } = canvas;
      const points = pointsRef.current;
      if (points.length < MIN_POINTS) return;

      if (animateRef.current) {
        // Ping-pong t between 0 and 1
        const cycle = (frame % 480) / 480;
        tRef.current = cycle < 0.5 ? cycle * 2 : 2 - cycle * 2;
        if (frame % 6 === 0) setTDisplay(tRef.current);
      }
      const t = tRef.current;

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      // Control polygon
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // Full curve
      const curve = sampleCurve(points);
      ctx.strokeStyle = "#00ff41";
      ctx.lineWidth = 2;
      ctx.beginPath();
      curve.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();

      // De Casteljau construction at t
      const levels = deCasteljauLevels(points, t);
      if (showLevelsRef.current) {
        for (let li = 1; li < levels.length - 1; li++) {
          const level = levels[li];
          ctx.strokeStyle = LEVEL_COLORS[li % LEVEL_COLORS.length];
          ctx.lineWidth = 1;
          ctx.beginPath();
          level.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          });
          ctx.stroke();
          for (const p of level) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = LEVEL_COLORS[li % LEVEL_COLORS.length];
            ctx.fill();
          }
        }
      }

      // Moving curve point
      const tip = levels[levels.length - 1][0];
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();

      // Control points
      points.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
        ctx.strokeStyle = "#00ff41";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "#000";
        ctx.fill();
        ctx.fillStyle = "rgba(0,255,65,0.8)";
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        ctx.fillText(String(i), p.x, p.y - 12);
      });
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const canvasPos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onMouseDown = (e: React.MouseEvent) => {
    const { x, y } = canvasPos(e);
    const idx = pointsRef.current.findIndex(
      (p) => (p.x - x) ** 2 + (p.y - y) ** 2 < 14 * 14
    );
    if (idx >= 0) {
      dragIdxRef.current = idx;
    } else if (pointsRef.current.length < MAX_POINTS) {
      pointsRef.current = [...pointsRef.current, { x, y }];
      setPointCount(pointsRef.current.length);
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (dragIdxRef.current < 0 || e.buttons !== 1) return;
    const { x, y } = canvasPos(e);
    const next = [...pointsRef.current];
    next[dragIdxRef.current] = { x, y };
    pointsRef.current = next;
  };

  const onMouseUp = () => { dragIdxRef.current = -1; };

  const onDoubleClick = (e: React.MouseEvent) => {
    const { x, y } = canvasPos(e);
    if (pointsRef.current.length <= MIN_POINTS) return;
    const idx = pointsRef.current.findIndex(
      (p) => (p.x - x) ** 2 + (p.y - y) ** 2 < 14 * 14
    );
    if (idx >= 0) {
      pointsRef.current = pointsRef.current.filter((_, i) => i !== idx);
      setPointCount(pointsRef.current.length);
    }
  };

  const degreeName = ["", "", "linear", "quadratic", "cubic", "quartic", "quintic", "sextic", "septic"][pointCount] ?? "";

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">bézier playground</span>
        </div>
        <div className="text-xs text-primary/40 tabular-nums">
          {pointCount} pts · {degreeName} · t = {tDisplay.toFixed(2)}
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">t</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={tDisplay}
            onChange={(e) => {
              const v = Number(e.target.value);
              tRef.current = v;
              setTDisplay(v);
              animateRef.current = false;
              setAnimate(false);
            }}
            className="w-32 accent-primary"
          />
        </div>

        <button
          onClick={() => {
            animateRef.current = !animate;
            setAnimate(!animate);
          }}
          className={`px-2 py-0.5 text-xs border transition-colors ${
            animate
              ? "border-primary bg-primary/10 text-primary"
              : "border-primary/20 text-primary/40 hover:border-primary/50"
          }`}
        >
          animate {animate ? "on" : "off"}
        </button>

        <button
          onClick={() => {
            showLevelsRef.current = !showLevels;
            setShowLevels(!showLevels);
          }}
          className={`px-2 py-0.5 text-xs border transition-colors ${
            showLevels
              ? "border-primary bg-primary/10 text-primary"
              : "border-primary/20 text-primary/40 hover:border-primary/50"
          }`}
        >
          construction {showLevels ? "on" : "off"}
        </button>

        <button
          onClick={() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            pointsRef.current = defaultPoints(canvas.width, canvas.height);
            setPointCount(pointsRef.current.length);
          }}
          className="ml-auto px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ↺ reset
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas
          ref={canvasRef}
          className="block w-full h-full cursor-pointer"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onDoubleClick={onDoubleClick}
        />
        <div className="absolute bottom-3 left-4 text-xs text-primary/30 pointer-events-none">
          drag points · click empty space to add (max {MAX_POINTS}) · double-click a point to remove
        </div>
      </div>
    </div>
  );
}
