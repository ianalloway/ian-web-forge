import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Boid,
  FlockParams,
  DEFAULT_PARAMS,
  makeFlock,
  stepFlock,
} from "../features/boids/flock";

const FLOCK_SIZES = [50, 100, 200];

interface SliderDef {
  key: keyof Pick<FlockParams, "cohesion" | "alignment" | "separation">;
  label: string;
}

const SLIDERS: SliderDef[] = [
  { key: "cohesion", label: "cohesion" },
  { key: "alignment", label: "alignment" },
  { key: "separation", label: "separation" },
];

export default function Boids() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boidsRef = useRef<Boid[]>([]);
  const paramsRef = useRef<FlockParams>({ ...DEFAULT_PARAMS });
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const pausedRef = useRef(false);

  const [params, setParams] = useState<FlockParams>({ ...DEFAULT_PARAMS });
  const [flockSize, setFlockSize] = useState(100);
  const [paused, setPaused] = useState(false);

  // Sim + render loop
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

    boidsRef.current = makeFlock(flockSize, canvas.width, canvas.height);

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const { width: W, height: H } = canvas;

      if (!pausedRef.current) {
        stepFlock(boidsRef.current, W, H, paramsRef.current, mouseRef.current);
      }

      // Motion-blur trail
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(0, 0, W, H);

      for (const b of boidsRef.current) {
        const angle = Math.atan2(b.vy, b.vx);
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(7, 0);
        ctx.lineTo(-4, 3.5);
        ctx.lineTo(-2, 0);
        ctx.lineTo(-4, -3.5);
        ctx.closePath();
        ctx.fillStyle = `hsl(${b.hue}, 100%, 55%)`;
        ctx.fill();
        ctx.restore();
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [flockSize]);

  const handleParam = (key: SliderDef["key"], value: number) => {
    paramsRef.current = { ...paramsRef.current, [key]: value };
    setParams(paramsRef.current);
  };

  const canvasPos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
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
          <span className="text-sm">boids</span>
        </div>
        <div className="text-xs text-primary/40">{flockSize} boids</div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        {SLIDERS.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-2">
            <span className="text-primary/40 text-xs w-16 text-right">{label}</span>
            <input
              type="range"
              min={0}
              max={1.5}
              step={0.1}
              value={params[key]}
              onChange={(e) => handleParam(key, Number(e.target.value))}
              className="w-20 accent-primary"
            />
          </div>
        ))}

        <div className="flex items-center gap-1">
          {FLOCK_SIZES.map((n) => (
            <button
              key={n}
              onClick={() => setFlockSize(n)}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                flockSize === n
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/20 text-primary/40 hover:border-primary/50 hover:text-primary/70"
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            pausedRef.current = !pausedRef.current;
            setPaused(pausedRef.current);
          }}
          className="ml-auto px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          {paused ? "▶ resume" : "⏸ pause"}
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas
          ref={canvasRef}
          className="block w-full h-full"
          onMouseMove={(e) => { mouseRef.current = canvasPos(e); }}
          onMouseLeave={() => { mouseRef.current = null; }}
        />
        <div className="absolute bottom-3 left-4 text-xs text-primary/30 pointer-events-none">
          move the cursor to scatter the flock
        </div>
      </div>
    </div>
  );
}
