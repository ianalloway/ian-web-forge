import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Body, loadPreset, makeBody, stepLeapfrog, Preset } from "../features/gravity/sim";

const PRESETS: { id: Preset; label: string }[] = [
  { id: "binary", label: "Binary Star" },
  { id: "solar", label: "Solar System" },
  { id: "figure8", label: "Figure-8" },
  { id: "random", label: "Random" },
];

const DT = 0.35;
const STEPS_PER_FRAME = 3;

export default function Gravity() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bodiesRef = useRef<Body[]>([]);
  const pausedRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragCurrentRef = useRef<{ x: number; y: number } | null>(null);


  const [paused, setPaused] = useState(false);
  const [preset, setPreset] = useState<Preset>("binary");
  const [bodyCount, setBodyCount] = useState(0);

  const getCanvas = () => canvasRef.current;

  const initPreset = useCallback((p: Preset) => {
    const canvas = getCanvas();
    if (!canvas) return;
    bodiesRef.current = loadPreset(p, canvas.width, canvas.height);
    setBodyCount(bodiesRef.current.length);
  }, []);

  const draw = useCallback(() => {
    const canvas = getCanvas();
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: W, height: H } = canvas;

    // Fade trails
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(0, 0, W, H);

    // Draw trails
    for (const b of bodiesRef.current) {
      if (b.trail.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(b.trail[0].x, b.trail[0].y);
      for (let i = 1; i < b.trail.length; i++) {
        ctx.lineTo(b.trail[i].x, b.trail[i].y);
      }
      ctx.strokeStyle = b.color + "55";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw bodies
    for (const b of bodiesRef.current) {
      // Glow
      const grd = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius * 2.5);
      grd.addColorStop(0, b.color + "cc");
      grd.addColorStop(1, b.color + "00");
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.fill();
    }

    // Draw drag arrow
    if (dragStartRef.current && dragCurrentRef.current) {
      const { x: sx, y: sy } = dragStartRef.current;
      const { x: ex, y: ey } = dragCurrentRef.current;
      const dx = ex - sx;
      const dy = ey - sy;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 5) {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.strokeStyle = "#00ff4199";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Arrowhead
        const angle = Math.atan2(dy, dx);
        const headLen = 12;
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - headLen * Math.cos(angle - 0.4), ey - headLen * Math.sin(angle - 0.4));
        ctx.lineTo(ex - headLen * Math.cos(angle + 0.4), ey - headLen * Math.sin(angle + 0.4));
        ctx.closePath();
        ctx.fillStyle = "#00ff41";
        ctx.fill();

        // Launch point circle
        ctx.beginPath();
        ctx.arc(sx, sy, 6, 0, Math.PI * 2);
        ctx.strokeStyle = "#00ff41";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }, []);

  // Resize canvas to fill container
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      initPreset(preset);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start rAF loop — local function avoids self-reference lint error
  useEffect(() => {
    let raf: number;
    const loop = () => {
      if (!pausedRef.current) {
        for (let i = 0; i < STEPS_PER_FRAME; i++) {
          bodiesRef.current = stepLeapfrog(bodiesRef.current, DT);
        }
        setBodyCount(bodiesRef.current.length);
      }
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [draw]);

  // Sync paused state → ref
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const toCanvasPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      const t = e.touches[0] ?? e.changedTouches[0];
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const onPointerDown = (e: React.MouseEvent) => {
    const canvas = getCanvas();
    if (!canvas) return;
    dragStartRef.current = toCanvasPos(e, canvas);
    dragCurrentRef.current = toCanvasPos(e, canvas);
  };

  const onPointerMove = (e: React.MouseEvent) => {
    if (!dragStartRef.current) return;
    const canvas = getCanvas();
    if (!canvas) return;
    dragCurrentRef.current = toCanvasPos(e, canvas);
  };

  const onPointerUp = (e: React.MouseEvent) => {
    if (!dragStartRef.current) return;
    const canvas = getCanvas();
    if (!canvas) return;
    const end = toCanvasPos(e, canvas);
    const { x: sx, y: sy } = dragStartRef.current;
    const dx = end.x - sx;
    const dy = end.y - sy;
    const VEL_SCALE = 0.15;
    bodiesRef.current = [
      ...bodiesRef.current,
      makeBody(sx, sy, dx * VEL_SCALE, dy * VEL_SCALE, 80),
    ];
    setBodyCount(bodiesRef.current.length);
    dragStartRef.current = null;
    dragCurrentRef.current = null;
  };

  const onPointerLeave = () => {
    dragStartRef.current = null;
    dragCurrentRef.current = null;
  };

  const handlePreset = (p: Preset) => {
    setPreset(p);
    initPreset(p);
  };

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">gravity sandbox</span>
        </div>
        <div className="text-xs text-primary/40">
          bodies: {bodyCount}
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-3">
        <div className="flex gap-2 flex-wrap">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handlePreset(p.id)}
              className={`px-3 py-1 text-xs border transition-colors ${
                preset === p.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/30 text-primary/50 hover:border-primary/60 hover:text-primary/80"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => setPaused((p) => !p)}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            {paused ? "▶ resume" : "⏸ pause"}
          </button>
          <button
            onClick={() => initPreset(preset)}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ↺ reset
          </button>
          <button
            onClick={() => { bodiesRef.current = []; setBodyCount(0); }}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ✕ clear
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas
          ref={canvasRef}
          className="block w-full h-full cursor-crosshair"
          onMouseDown={onPointerDown}
          onMouseMove={onPointerMove}
          onMouseUp={onPointerUp}
          onMouseLeave={onPointerLeave}
        />
        <div className="absolute bottom-3 left-4 text-xs text-primary/30 pointer-events-none">
          drag to launch a body · bodies merge on collision
        </div>
      </div>
    </div>
  );
}
