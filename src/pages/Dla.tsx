import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  DlaWorld,
  SeedMode,
  makeWorld,
  growStep,
} from "../features/dla/aggregate";

const SCALE = 2; // sim grid is 1/SCALE of display

export default function Dla() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<DlaWorld | null>(null);
  const modeRef = useRef<SeedMode>("center");
  const runningRef = useRef(true);
  const walkersRef = useRef(30);
  const rebuildRef = useRef<() => void>(() => {});

  const [mode, setMode] = useState<SeedMode>("center");
  const [running, setRunning] = useState(true);
  const [walkers, setWalkers] = useState(30);
  const [count, setCount] = useState(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let gw = 0, gh = 0;
    let off: HTMLCanvasElement | null = null;
    let offCtx: CanvasRenderingContext2D | null = null;
    let img: ImageData | null = null;

    const rebuild = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      gw = Math.max(120, Math.floor(rect.width / SCALE));
      gh = Math.max(90, Math.floor(rect.height / SCALE));
      worldRef.current = makeWorld(gw, gh, modeRef.current);
      off = document.createElement("canvas");
      off.width = gw; off.height = gh;
      offCtx = off.getContext("2d");
      img = offCtx!.createImageData(gw, gh);
    };
    rebuild();
    window.addEventListener("resize", rebuild);
    // Expose rebuild for control handlers via ref
    rebuildRef.current = rebuild;

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const world = worldRef.current;
      if (!world || !off || !offCtx || !img) return;

      if (runningRef.current) {
        growStep(world, modeRef.current, walkersRef.current);
        setCount(world.count);
      }

      // Color frozen cells by age (green -> cyan -> white as they get older/newer)
      const { grid, age, tick } = world;
      const data = img.data;
      for (let i = 0; i < grid.length; i++) {
        if (grid[i]) {
          const t = tick > 0 ? age[i] / tick : 0; // 0 = oldest (core), 1 = newest (tips)
          const g = 200;
          data[i * 4] = t * 120;
          data[i * 4 + 1] = g;
          data[i * 4 + 2] = 80 + t * 175;
          data[i * 4 + 3] = 255;
        } else {
          data[i * 4] = 0;
          data[i * 4 + 1] = 0;
          data[i * 4 + 2] = 0;
          data[i * 4 + 3] = 255;
        }
      }
      offCtx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, 0, 0, gw, gh, 0, 0, canvas.width, canvas.height);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", rebuild);
    };
  }, []);

  const setModeAll = (m: SeedMode) => {
    modeRef.current = m;
    setMode(m);
    rebuildRef.current();
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
          <span className="text-sm">diffusion-limited aggregation</span>
        </div>
        <div className="text-xs text-primary/40 tabular-nums">{count.toLocaleString()} particles</div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <div className="flex gap-1">
          {(["center", "line"] as SeedMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setModeAll(m)}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                mode === m
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/20 text-primary/40 hover:border-primary/50 hover:text-primary/70"
              }`}
            >
              {m === "center" ? "seed: center" : "seed: floor"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">walkers/frame</span>
          <input
            type="range"
            min={5}
            max={120}
            step={5}
            value={walkers}
            onChange={(e) => {
              const v = Number(e.target.value);
              walkersRef.current = v;
              setWalkers(v);
            }}
            className="w-28 accent-primary"
          />
          <span className="text-primary/60 text-xs w-6">{walkers}</span>
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => { runningRef.current = !running; setRunning(!running); }}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            {running ? "⏸ pause" : "▶ resume"}
          </button>
          <button
            onClick={() => rebuildRef.current()}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ↺ restart
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute bottom-3 left-4 text-xs text-primary/30 pointer-events-none max-w-lg">
          random-walking particles freeze on contact with the cluster — the same process behind
          frost, coral, and lightning. tips (newer) glow brighter than the core.
        </div>
      </div>
    </div>
  );
}
