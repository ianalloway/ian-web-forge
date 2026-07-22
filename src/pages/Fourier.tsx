import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  WaveId,
  WAVES,
  harmonics,
  epicyclePoints,
  seriesValue,
} from "../features/fourier/series";

const WAVE_KEYS = Object.keys(WAVES) as WaveId[];
const TRACE_LEN = 700;

export default function Fourier() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waveRef = useRef<WaveId>("square");
  const countRef = useRef(4);
  const speedRef = useRef(0.02);
  const pausedRef = useRef(false);
  const traceRef = useRef<number[]>([]);

  const [wave, setWave] = useState<WaveId>("square");
  const [count, setCount] = useState(4);
  const [speed, setSpeed] = useState(0.02);
  const [paused, setPaused] = useState(false);

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

    let t = 0;
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const { width: W, height: H } = canvas;
      if (!pausedRef.current) t += speedRef.current * 2;

      const hs = harmonics(waveRef.current, countRef.current);
      // Scale: total radius budget ~ 1/4 of the smaller dimension
      const totalAmp = hs.reduce((s, h) => s + Math.abs(h.amp), 0);
      const R = (Math.min(W, H) * 0.30) / Math.max(1, totalAmp);
      const cx = Math.min(W * 0.22, 260);
      const cy = H / 2;

      if (!pausedRef.current) {
        traceRef.current.unshift(seriesValue(hs, t) * R);
        if (traceRef.current.length > TRACE_LEN) traceRef.current.pop();
      }

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      // Epicycles
      const pts = epicyclePoints(hs, t).map((p) => ({
        x: cx + p.x * R,
        y: cy + p.y * R,
      }));
      for (let i = 0; i < hs.length; i++) {
        const r = Math.abs(hs[i].amp) * R;
        ctx.beginPath();
        ctx.arc(pts[i].x, pts[i].y, r, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(0,255,65,0.25)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
        ctx.strokeStyle = "rgba(0,255,65,0.7)";
        ctx.stroke();
      }
      const tip = pts[pts.length - 1];
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#00ff41";
      ctx.fill();

      // Connector from tip to the wave trace
      const waveX = cx + Math.min(W, H) * 0.34 + 30;
      ctx.beginPath();
      ctx.moveTo(tip.x, tip.y);
      ctx.lineTo(waveX, cy + traceRef.current[0]);
      ctx.strokeStyle = "rgba(255,224,102,0.35)";
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Trace
      ctx.beginPath();
      traceRef.current.forEach((v, i) => {
        const x = waveX + i;
        if (x > W) return;
        if (i === 0) ctx.moveTo(x, cy + v);
        else ctx.lineTo(x, cy + v);
      });
      ctx.strokeStyle = "#00ff41";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Axis
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.beginPath();
      ctx.moveTo(waveX, cy);
      ctx.lineTo(W, cy);
      ctx.stroke();
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const setWaveAll = (w: WaveId) => {
    waveRef.current = w;
    setWave(w);
    traceRef.current = [];
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
          <span className="text-sm">fourier epicycles</span>
        </div>
        <div className="text-xs text-primary/40 hidden sm:block">{WAVES[wave].formula}</div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <div className="flex gap-1">
          {WAVE_KEYS.map((w) => (
            <button
              key={w}
              onClick={() => setWaveAll(w)}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                wave === w
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/20 text-primary/40 hover:border-primary/50 hover:text-primary/70"
              }`}
            >
              {WAVES[w].label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">harmonics</span>
          <input
            type="range"
            min={1}
            max={30}
            value={count}
            onChange={(e) => {
              const v = Number(e.target.value);
              countRef.current = v;
              setCount(v);
              traceRef.current = [];
            }}
            className="w-28 accent-primary"
          />
          <span className="text-primary/60 text-xs w-6">{count}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">speed</span>
          <input
            type="range"
            min={0.005}
            max={0.06}
            step={0.005}
            value={speed}
            onChange={(e) => {
              const v = Number(e.target.value);
              speedRef.current = v;
              setSpeed(v);
            }}
            className="w-24 accent-primary"
          />
        </div>

        <button
          onClick={() => { pausedRef.current = !paused; setPaused(!paused); }}
          className="ml-auto px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          {paused ? "▶ resume" : "⏸ pause"}
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute bottom-3 left-4 text-xs text-primary/30 pointer-events-none">
          rotating circles stack harmonics — more harmonics, sharper corners (and gibbs ringing)
        </div>
      </div>
    </div>
  );
}
