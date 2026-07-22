import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Vec3,
  LorenzParams,
  DEFAULT_LORENZ,
  stepRK4,
  project,
  randomStart,
} from "../features/lorenz/attractor";

const TRAIL = 2600;
const STEPS_PER_FRAME = 6;
const DT = 0.006;

interface Particle {
  pos: Vec3;
  hue: number;
  trail: Vec3[];
}

export default function Lorenz() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paramsRef = useRef<LorenzParams>({ ...DEFAULT_LORENZ });
  const particlesRef = useRef<Particle[]>([]);
  const angleRef = useRef(0);
  const autoRotateRef = useRef(true);
  const pausedRef = useRef(false);

  const [rho, setRho] = useState(DEFAULT_LORENZ.rho);
  const [autoRotate, setAutoRotate] = useState(true);
  const [paused, setPaused] = useState(false);

  const spawn = (n: number) => {
    // Cluster of nearby starts to show sensitive dependence (they diverge)
    const base = randomStart();
    particlesRef.current = Array.from({ length: n }, (_, i) => ({
      pos: { x: base.x + i * 1e-3, y: base.y, z: base.z },
      hue: 120 + i * 40,
      trail: [],
    }));
  };

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
    if (particlesRef.current.length === 0) spawn(3);

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const { width: W, height: H } = canvas;
      const cx = W / 2;
      const cy = H / 2;
      const scale = Math.min(W, H) / 60;

      if (!pausedRef.current) {
        for (const p of particlesRef.current) {
          for (let s = 0; s < STEPS_PER_FRAME; s++) {
            p.pos = stepRK4(p.pos, paramsRef.current, DT);
            p.trail.push({ ...p.pos });
          }
          if (p.trail.length > TRAIL) p.trail.splice(0, p.trail.length - TRAIL);
        }
        if (autoRotateRef.current) angleRef.current += 0.004;
      }

      // Fade
      ctx.fillStyle = "rgba(0,0,0,0.16)";
      ctx.fillRect(0, 0, W, H);

      const angle = angleRef.current;
      for (const p of particlesRef.current) {
        const tr = p.trail;
        if (tr.length < 2) continue;
        for (let i = 1; i < tr.length; i++) {
          const a = project(tr[i - 1], angle, scale, cx, cy);
          const b = project(tr[i], angle, scale, cx, cy);
          const age = i / tr.length; // 0 old -> 1 new
          const depthShade = 0.4 + Math.min(1, (a.depth + 30) / 60) * 0.6;
          ctx.strokeStyle = `hsla(${p.hue}, 100%, ${(35 + age * 30) * depthShade}%, ${age})`;
          ctx.lineWidth = age * 1.8;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
        // Head
        const head = project(tr[tr.length - 1], angle, scale, cx, cy);
        ctx.beginPath();
        ctx.arc(head.x, head.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${p.hue}, 100%, 70%)`;
        ctx.fill();
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">lorenz attractor</span>
        </div>
        <div className="text-xs text-primary/40 tabular-nums">
          σ=10 ρ={rho.toFixed(0)} β=2.67
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">ρ (rho)</span>
          <input
            type="range"
            min={14}
            max={45}
            step={0.5}
            value={rho}
            onChange={(e) => {
              const v = Number(e.target.value);
              setRho(v);
              paramsRef.current = { ...paramsRef.current, rho: v };
            }}
            className="w-32 accent-primary"
          />
          <span className="text-primary/60 text-xs w-8">{rho.toFixed(1)}</span>
          <span className="text-primary/30 text-xs hidden md:inline">
            {rho < 24.7 ? "settles to a fixed point" : "chaotic butterfly"}
          </span>
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => { autoRotateRef.current = !autoRotate; setAutoRotate(!autoRotate); }}
            className={`px-2 py-0.5 text-xs border transition-colors ${
              autoRotate
                ? "border-primary bg-primary/10 text-primary"
                : "border-primary/20 text-primary/40 hover:border-primary/50"
            }`}
          >
            auto-rotate {autoRotate ? "on" : "off"}
          </button>
          <button
            onClick={() => { pausedRef.current = !paused; setPaused(!paused); }}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            {paused ? "▶ resume" : "⏸ pause"}
          </button>
          <button
            onClick={() => spawn(3)}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ⚄ new start
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute bottom-3 left-4 text-xs text-primary/30 pointer-events-none max-w-xl">
          three trajectories start 0.001 apart — watch them trace the same butterfly yet drift
          onto different wings. deterministic, yet unpredictable.
        </div>
      </div>
    </div>
  );
}
