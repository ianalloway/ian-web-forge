import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  SlimeParams,
  SlimeWorld,
  DEFAULT_SLIME,
  makeWorld,
  stepSlime,
} from "../features/slime/physarum";

const SCALE = 2; // sim grid is 1/SCALE of display
const AGENT_COUNTS = [4000, 10000, 20000];

export default function Slime() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<SlimeWorld | null>(null);
  const paramsRef = useRef<SlimeParams>({ ...DEFAULT_SLIME });
  const pausedRef = useRef(false);

  const [agents, setAgents] = useState(10000);
  const [paused, setPaused] = useState(false);
  const [sensorAngle, setSensorAngle] = useState(DEFAULT_SLIME.sensorAngle);
  const [evaporate, setEvaporate] = useState(DEFAULT_SLIME.evaporate);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let off: HTMLCanvasElement | null = null;
    let offCtx: CanvasRenderingContext2D | null = null;
    let img: ImageData | null = null;

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      const gw = Math.max(100, Math.floor(rect.width / SCALE));
      const gh = Math.max(80, Math.floor(rect.height / SCALE));
      worldRef.current = makeWorld(gw, gh, agents);
      off = document.createElement("canvas");
      off.width = gw;
      off.height = gh;
      offCtx = off.getContext("2d");
      img = offCtx!.createImageData(gw, gh);
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const world = worldRef.current;
      if (!world || !off || !offCtx || !img) return;

      if (!pausedRef.current) {
        stepSlime(world, paramsRef.current);
      }

      // Trail -> green-tinted pixels
      const { trail } = world;
      const data = img.data;
      for (let i = 0; i < trail.length; i++) {
        const v = Math.min(255, trail[i]);
        data[i * 4] = v * 0.12;
        data[i * 4 + 1] = v;
        data[i * 4 + 2] = v * 0.35;
        data[i * 4 + 3] = 255;
      }
      offCtx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(off, 0, 0, world.w, world.h, 0, 0, canvas.width, canvas.height);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [agents]);

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">slime mold</span>
        </div>
        <div className="text-xs text-primary/40 tabular-nums">
          {agents.toLocaleString()} agents · physarum
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <div className="flex gap-1">
          {AGENT_COUNTS.map((n) => (
            <button
              key={n}
              onClick={() => setAgents(n)}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                agents === n
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/20 text-primary/40 hover:border-primary/50 hover:text-primary/70"
              }`}
            >
              {n / 1000}k
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">sensor angle</span>
          <input
            type="range"
            min={0.2}
            max={1.2}
            step={0.05}
            value={sensorAngle}
            onChange={(e) => {
              const v = Number(e.target.value);
              setSensorAngle(v);
              paramsRef.current = { ...paramsRef.current, sensorAngle: v };
            }}
            className="w-24 accent-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">persistence</span>
          <input
            type="range"
            min={0.9}
            max={0.99}
            step={0.005}
            value={evaporate}
            onChange={(e) => {
              const v = Number(e.target.value);
              setEvaporate(v);
              paramsRef.current = { ...paramsRef.current, evaporate: v };
            }}
            className="w-24 accent-primary"
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
            onClick={() => {
              // Rebuild world at same agent count
              const canvas = canvasRef.current;
              if (!canvas || !worldRef.current) return;
              worldRef.current = makeWorld(worldRef.current.w, worldRef.current.h, agents);
            }}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ⚄ reseed
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute bottom-3 left-4 text-xs text-primary/30 pointer-events-none max-w-lg">
          agents deposit pheromone and steer toward the strongest trail ahead —
          vein networks emerge with nobody in charge
        </div>
      </div>
    </div>
  );
}
