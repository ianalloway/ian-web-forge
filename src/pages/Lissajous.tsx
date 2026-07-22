import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  HarmonoParams,
  DEFAULT_HARMONO,
  PRESETS,
  pointAt,
  isFinished,
  randomParams,
} from "../features/lissajous/harmonograph";

const DT = 0.01; // parameter step per segment
const SEGMENTS_PER_FRAME = 120;

export default function Lissajous() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paramsRef = useRef<HarmonoParams>({ ...DEFAULT_HARMONO });
  const tRef = useRef(0);
  const doneRef = useRef(false);
  const pausedRef = useRef(false);

  const [params, setParams] = useState<HarmonoParams>({ ...DEFAULT_HARMONO });
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const clearAndRestart = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    tRef.current = 0;
    doneRef.current = false;
    setProgress(0);
  }, []);

  const applyParams = useCallback((p: HarmonoParams) => {
    paramsRef.current = p;
    setParams(p);
    clearAndRestart();
  }, [clearAndRestart]);

  // Drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      clearAndRestart();
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (pausedRef.current || doneRef.current) return;
      const { width: W, height: H } = canvas;
      const cx = W / 2;
      const cy = H / 2;
      const R = Math.min(W, H) * 0.42;
      const p = paramsRef.current;

      ctx.lineWidth = 1;
      ctx.beginPath();
      let t = tRef.current;
      const start = pointAt(t, p);
      ctx.moveTo(cx + start.x * R, cy + start.y * R);
      for (let i = 0; i < SEGMENTS_PER_FRAME; i++) {
        t += DT;
        const pt = pointAt(t, p);
        ctx.lineTo(cx + pt.x * R, cy + pt.y * R);
      }
      // Alpha accumulates: overlapping passes glow brighter
      ctx.strokeStyle = "rgba(0,255,65,0.22)";
      ctx.stroke();
      tRef.current = t;

      if (isFinished(t, p)) {
        doneRef.current = true;
        setProgress(100);
      } else if (p.damping > 0) {
        const pct = Math.min(99, Math.round((1 - Math.exp(-p.damping * t)) / 0.99 * 100));
        setProgress(pct);
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [clearAndRestart]);

  const sliderDefs: {
    key: keyof HarmonoParams;
    label: string;
    min: number;
    max: number;
    step: number;
    format: (v: number) => string;
  }[] = [
    { key: "fx", label: "fx", min: 1, max: 9, step: 1, format: (v) => String(v) },
    { key: "fy", label: "fy", min: 1, max: 9, step: 1, format: (v) => String(v) },
    { key: "detune", label: "detune", min: 0, max: 0.02, step: 0.001, format: (v) => v.toFixed(3) },
    { key: "damping", label: "damping", min: 0, max: 0.002, step: 0.0001, format: (v) => v.toFixed(4) },
  ];

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">harmonograph</span>
        </div>
        <div className="text-xs text-primary/40">
          {params.fx}:{params.fy} · drawing {progress}%
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex gap-1 flex-wrap">
          {PRESETS.map((pr) => (
            <button
              key={pr.label}
              onClick={() => applyParams({ ...pr.params })}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                params.fx === pr.params.fx && params.fy === pr.params.fy
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/20 text-primary/40 hover:border-primary/50 hover:text-primary/70"
              }`}
            >
              {pr.label}
            </button>
          ))}
        </div>

        {sliderDefs.map(({ key, label, min, max, step, format }) => (
          <div key={key} className="flex items-center gap-2">
            <span className="text-primary/40 text-xs w-14 text-right">{label}</span>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={params[key]}
              onChange={(e) => applyParams({ ...params, [key]: Number(e.target.value) })}
              className="w-24 accent-primary"
            />
            <span className="text-primary/60 text-xs w-12">{format(params[key])}</span>
          </div>
        ))}

        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => { pausedRef.current = !paused; setPaused(!paused); }}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            {paused ? "▶ resume" : "⏸ pause"}
          </button>
          <button
            onClick={() => applyParams(randomParams())}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ⚄ random
          </button>
          <button
            onClick={clearAndRestart}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ↺ redraw
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute bottom-3 left-4 text-xs text-primary/30 pointer-events-none">
          two damped pendulums, one per axis — detune makes the figure precess
        </div>
      </div>
    </div>
  );
}
