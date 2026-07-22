import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Perlin,
  Particle,
  FlowParams,
  DEFAULT_FLOW,
  makeParticles,
  stepParticles,
} from "../features/flow/noise";

const PARTICLE_COUNTS = [800, 2000, 4000];

type Palette = "matrix" | "cyan" | "ember";
const PALETTES: Record<Palette, { label: string; color: string }> = {
  matrix: { label: "Matrix", color: "rgba(0,255,65,0.08)" },
  cyan: { label: "Cyan", color: "rgba(0,207,255,0.08)" },
  ember: { label: "Ember", color: "rgba(255,107,53,0.08)" },
};
const PALETTE_KEYS = Object.keys(PALETTES) as Palette[];

export default function Flow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const noiseRef = useRef<Perlin>(new Perlin(42));
  const paramsRef = useRef<FlowParams>({ ...DEFAULT_FLOW });
  const paletteRef = useRef<Palette>("matrix");
  const pausedRef = useRef(false);

  const [count, setCount] = useState(2000);
  const [palette, setPalette] = useState<Palette>("matrix");
  const [paused, setPaused] = useState(false);
  const [scale, setScale] = useState(DEFAULT_FLOW.scale);
  const [speed, setSpeed] = useState(DEFAULT_FLOW.speed);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      particlesRef.current = makeParticles(count, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let t = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (pausedRef.current) return;
      t++;
      const { width: W, height: H } = canvas;

      // Slow fade instead of clear — lines accumulate into silky streams
      ctx.fillStyle = "rgba(0,0,0,0.04)";
      ctx.fillRect(0, 0, W, H);

      stepParticles(particlesRef.current, noiseRef.current, t, W, H, paramsRef.current);

      ctx.strokeStyle = PALETTES[paletteRef.current].color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const p of particlesRef.current) {
        // Skip the long segment drawn by a respawn jump
        const dx = p.x - p.px;
        const dy = p.y - p.py;
        if (dx * dx + dy * dy > 400) continue;
        ctx.moveTo(p.px, p.py);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [count]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const reseed = () => {
    noiseRef.current = new Perlin(Math.floor(Math.random() * 0xffffffff));
    clearCanvas();
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
          <span className="text-sm">flow field</span>
        </div>
        <div className="text-xs text-primary/40">{count} particles · perlin noise</div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <div className="flex gap-1">
          {PALETTE_KEYS.map((k) => (
            <button
              key={k}
              onClick={() => { setPalette(k); paletteRef.current = k; }}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                palette === k
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/20 text-primary/40 hover:border-primary/50 hover:text-primary/70"
              }`}
            >
              {PALETTES[k].label}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          {PARTICLE_COUNTS.map((n) => (
            <button
              key={n}
              onClick={() => setCount(n)}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                count === n
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/20 text-primary/40 hover:border-primary/50 hover:text-primary/70"
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">zoom</span>
          <input
            type="range"
            min={0.001}
            max={0.01}
            step={0.0005}
            value={scale}
            onChange={(e) => {
              const v = Number(e.target.value);
              setScale(v);
              paramsRef.current = { ...paramsRef.current, scale: v };
            }}
            className="w-20 accent-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.25}
            value={speed}
            onChange={(e) => {
              const v = Number(e.target.value);
              setSpeed(v);
              paramsRef.current = { ...paramsRef.current, speed: v };
            }}
            className="w-20 accent-primary"
          />
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => { pausedRef.current = !paused; setPaused(!paused); }}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            {paused ? "▶ resume" : "⏸ pause"}
          </button>
          <button
            onClick={reseed}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ⚄ new field
          </button>
          <button
            onClick={clearCanvas}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ✕ clear
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute bottom-3 left-4 text-xs text-primary/30 pointer-events-none">
          particles trace an evolving perlin vector field
        </div>
      </div>
    </div>
  );
}
