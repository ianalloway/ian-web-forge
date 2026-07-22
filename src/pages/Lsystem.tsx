import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  PresetId,
  PRESETS,
  expand,
  trace,
} from "../features/lsystem/turtle";

const PRESET_KEYS = Object.keys(PRESETS) as PresetId[];
const DRAW_PER_FRAME = 400;

export default function Lsystem() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawIdxRef = useRef(0);
  const segmentsRef = useRef<ReturnType<typeof trace>["segments"]>([]);
  const transformRef = useRef({ scale: 1, ox: 0, oy: 0 });

  const [preset, setPreset] = useState<PresetId>("plant");
  const [iterations, setIterations] = useState(PRESETS.plant.system.iterations);
  const [angle, setAngle] = useState(PRESETS.plant.system.angle);
  const [segmentCount, setSegmentCount] = useState(0);

  const rebuild = useCallback((pr: PresetId, iters: number, ang: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const sys = PRESETS[pr].system;
    const expanded = expand(sys, iters);
    const { segments, bounds } = trace(expanded, ang, sys.startAngle);
    segmentsRef.current = segments;
    setSegmentCount(segments.length);
    drawIdxRef.current = 0;

    // Fit bounds into canvas with padding
    const W = canvas.width, H = canvas.height;
    const bw = Math.max(1e-6, bounds.maxX - bounds.minX);
    const bh = Math.max(1e-6, bounds.maxY - bounds.minY);
    const scale = Math.min((W - 60) / bw, (H - 60) / bh);
    transformRef.current = {
      scale,
      ox: (W - bw * scale) / 2 - bounds.minX * scale,
      oy: (H - bh * scale) / 2 - bounds.minY * scale,
    };

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
  }, []);

  // Progressive draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const segments = segmentsRef.current;
      const i0 = drawIdxRef.current;
      if (i0 >= segments.length) return;
      const { scale, ox, oy } = transformRef.current;
      const i1 = Math.min(segments.length, i0 + DRAW_PER_FRAME);

      for (let i = i0; i < i1; i++) {
        const s = segments[i];
        // Deeper branches render thinner and dimmer
        const alpha = Math.max(0.25, 0.9 - s.depth * 0.08);
        ctx.strokeStyle = `rgba(0,255,65,${alpha.toFixed(2)})`;
        ctx.lineWidth = Math.max(0.5, 1.6 - s.depth * 0.15);
        ctx.beginPath();
        ctx.moveTo(s.x1 * scale + ox, s.y1 * scale + oy);
        ctx.lineTo(s.x2 * scale + ox, s.y2 * scale + oy);
        ctx.stroke();
      }
      drawIdxRef.current = i1;
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Init + resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      rebuild(preset, iterations, angle);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rebuild]);

  const applyPreset = (pr: PresetId) => {
    const sys = PRESETS[pr].system;
    setPreset(pr);
    setIterations(sys.iterations);
    setAngle(sys.angle);
    rebuild(pr, sys.iterations, sys.angle);
  };

  const sys = PRESETS[preset].system;

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">l-system garden</span>
        </div>
        <div className="text-xs text-primary/40 tabular-nums">
          {segmentCount.toLocaleString()} segments
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <div className="flex gap-1 flex-wrap">
          {PRESET_KEYS.map((pr) => (
            <button
              key={pr}
              onClick={() => applyPreset(pr)}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                preset === pr
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/20 text-primary/40 hover:border-primary/50 hover:text-primary/70"
              }`}
            >
              {PRESETS[pr].label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">depth</span>
          <input
            type="range"
            min={1}
            max={sys.maxIterations}
            value={iterations}
            onChange={(e) => {
              const v = Number(e.target.value);
              setIterations(v);
              rebuild(preset, v, angle);
            }}
            className="w-24 accent-primary"
          />
          <span className="text-primary/60 text-xs w-4">{iterations}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">angle</span>
          <input
            type="range"
            min={5}
            max={140}
            step={1}
            value={angle}
            onChange={(e) => {
              const v = Number(e.target.value);
              setAngle(v);
              rebuild(preset, iterations, v);
            }}
            className="w-24 accent-primary"
          />
          <span className="text-primary/60 text-xs w-8">{angle}°</span>
        </div>

        <button
          onClick={() => rebuild(preset, iterations, angle)}
          className="ml-auto px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ↺ redraw
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute bottom-3 left-4 text-xs text-primary/30 pointer-events-none">
          {sys.axiom} → {Object.entries(sys.rules).map(([k, v]) => `${k}:${v}`).join("  ")} · drag the angle off its natural value and watch the form mutate
        </div>
      </div>
    </div>
  );
}
