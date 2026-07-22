import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Point,
  PresetId,
  PRESETS,
  polyFit,
  fitStats,
  makePreset,
} from "../features/regression/fit";

const PRESET_KEYS = Object.keys(PRESETS) as PresetId[];
const POINT_R = 5;

export default function Regress() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<Point[]>([]);
  const degreeRef = useRef(1);

  const [degree, setDegree] = useState(1);
  const [pointCount, setPointCount] = useState(0);
  const [stats, setStats] = useState<{ r2: number; rmse: number } | null>(null);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: W, height: H } = canvas;
    const points = pointsRef.current;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = "rgba(0,255,65,0.06)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Fit curve + residuals
    const predict = polyFit(points, degreeRef.current);
    if (predict) {
      // Residual lines
      ctx.strokeStyle = "rgba(255,224,102,0.25)";
      for (const p of points) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x, predict(p.x));
        ctx.stroke();
      }
      // Curve, clipped to plausible range
      ctx.strokeStyle = "#00ff41";
      ctx.lineWidth = 2;
      ctx.beginPath();
      let started = false;
      for (let x = 0; x <= W; x += 2) {
        const y = predict(x);
        if (y < -H || y > 2 * H) { started = false; continue; }
        if (!started) { ctx.moveTo(x, y); started = true; }
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      setStats(fitStats(points, predict));
    } else {
      setStats(null);
    }

    // Points on top
    for (const p of points) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, POINT_R, 0, Math.PI * 2);
      ctx.fillStyle = "#00cfff";
      ctx.fill();
    }

    setPointCount(points.length);
  }, []);

  // Canvas init + resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      if (pointsRef.current.length === 0) {
        pointsRef.current = makePreset("wave", canvas.width, canvas.height);
      }
      redraw();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [redraw]);

  const canvasPos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onClick = (e: React.MouseEvent) => {
    const { x, y } = canvasPos(e);
    // Clicking an existing point removes it; empty space adds one
    const idx = pointsRef.current.findIndex(
      (p) => (p.x - x) ** 2 + (p.y - y) ** 2 < (POINT_R * 2.5) ** 2
    );
    if (idx >= 0) pointsRef.current.splice(idx, 1);
    else pointsRef.current.push({ x, y });
    redraw();
  };

  const handleDegree = (d: number) => {
    degreeRef.current = d;
    setDegree(d);
    redraw();
  };

  const handlePreset = (id: PresetId) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    pointsRef.current = makePreset(id, canvas.width, canvas.height);
    redraw();
  };

  const handleClear = () => {
    pointsRef.current = [];
    redraw();
  };

  const underdetermined = pointCount > 0 && pointCount < degree + 1;

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">regression playground</span>
        </div>
        <div className="text-xs text-primary/40 flex gap-4">
          <span>{pointCount} pts</span>
          {stats && (
            <>
              <span>R² {stats.r2.toFixed(3)}</span>
              <span>RMSE {stats.rmse.toFixed(1)}</span>
            </>
          )}
          {underdetermined && <span className="text-yellow-300">need ≥ {degree + 1} pts</span>}
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">degree</span>
          <input
            type="range"
            min={1}
            max={9}
            value={degree}
            onChange={(e) => handleDegree(Number(e.target.value))}
            className="w-32 accent-primary"
          />
          <span className="text-primary/60 text-xs w-4">{degree}</span>
          <span className="text-primary/30 text-xs hidden sm:inline">
            {degree === 1 ? "line" : degree <= 3 ? "gentle curve" : degree <= 6 ? "flexible" : "overfit territory"}
          </span>
        </div>

        <div className="flex gap-1 flex-wrap">
          {PRESET_KEYS.map((id) => (
            <button
              key={id}
              onClick={() => handlePreset(id)}
              className="px-2 py-0.5 text-xs border border-primary/20 text-primary/40 hover:border-primary/50 hover:text-primary/70 transition-colors"
            >
              {PRESETS[id]}
            </button>
          ))}
        </div>

        <button
          onClick={handleClear}
          className="ml-auto px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ✕ clear
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas
          ref={canvasRef}
          className="block w-full h-full cursor-crosshair"
          onClick={onClick}
        />
        <div className="absolute bottom-3 left-4 text-xs text-primary/30 pointer-events-none flex gap-4">
          <span>click to add a point · click a point to remove it</span>
          <span><span className="text-yellow-300">|</span> residuals</span>
        </div>
      </div>
    </div>
  );
}
