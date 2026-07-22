import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  GrayScott,
  RdParams,
  PresetId,
  PRESETS,
  makeGrayScott,
  seed,
  stepGrayScott,
} from "../features/reaction/grayscott";

const SCALE = 3; // sim grid is 1/SCALE of display
const STEPS_PER_FRAME = 8;

export default function Reaction() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gsRef = useRef<GrayScott | null>(null);
  const paramsRef = useRef<RdParams>({ ...PRESETS.coral.params });
  const pausedRef = useRef(false);
  const paintRef = useRef(false);

  const [preset, setPreset] = useState<PresetId>("coral");
  const [feed, setFeed] = useState(PRESETS.coral.params.feed);
  const [kill, setKill] = useState(PRESETS.coral.params.kill);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let gw = 0, gh = 0;
    let off: HTMLCanvasElement | null = null;
    let offCtx: CanvasRenderingContext2D | null = null;
    let img: ImageData | null = null;

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      gw = Math.max(80, Math.floor(rect.width / SCALE));
      gh = Math.max(60, Math.floor(rect.height / SCALE));
      gsRef.current = makeGrayScott(gw, gh);
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
      const gs = gsRef.current;
      if (!gs || !off || !offCtx || !img) return;

      if (!pausedRef.current) {
        stepGrayScott(gs, paramsRef.current, STEPS_PER_FRAME);
      }

      // Map B concentration to a green ramp
      const { a, b } = gs;
      const data = img.data;
      for (let i = 0; i < b.length; i++) {
        const v = a[i] - b[i]; // ~1 where A dominates, low where B is
        const c = Math.max(0, Math.min(1, v));
        const g = (1 - c) * 255; // B-rich = bright
        data[i * 4] = g * 0.13;
        data[i * 4 + 1] = g;
        data[i * 4 + 2] = g * 0.35;
        data[i * 4 + 3] = 255;
      }
      offCtx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(off, 0, 0, gw, gh, 0, 0, canvas.width, canvas.height);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const paintAt = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    const gs = gsRef.current;
    if (!canvas || !gs) return;
    const rect = canvas.getBoundingClientRect();
    const gx = Math.floor(((e.clientX - rect.left) / rect.width) * gs.w);
    const gy = Math.floor(((e.clientY - rect.top) / rect.height) * gs.h);
    seed(gs, gx, gy, 5);
  };

  const applyPreset = (p: PresetId) => {
    const params = PRESETS[p].params;
    paramsRef.current = { ...params };
    setPreset(p);
    setFeed(params.feed);
    setKill(params.kill);
    const gs = gsRef.current;
    if (gs) gsRef.current = makeGrayScott(gs.w, gs.h);
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
          <span className="text-sm">reaction-diffusion</span>
        </div>
        <div className="text-xs text-primary/40 tabular-nums">
          gray-scott · f={feed.toFixed(4)} k={kill.toFixed(4)}
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <div className="flex gap-1 flex-wrap">
          {(Object.keys(PRESETS) as PresetId[]).map((p) => (
            <button
              key={p}
              onClick={() => applyPreset(p)}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                preset === p
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/20 text-primary/40 hover:border-primary/50 hover:text-primary/70"
              }`}
            >
              {PRESETS[p].label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">feed</span>
          <input
            type="range"
            min={0.01}
            max={0.09}
            step={0.0005}
            value={feed}
            onChange={(e) => {
              const v = Number(e.target.value);
              setFeed(v);
              paramsRef.current = { ...paramsRef.current, feed: v };
            }}
            className="w-24 accent-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">kill</span>
          <input
            type="range"
            min={0.045}
            max={0.07}
            step={0.0005}
            value={kill}
            onChange={(e) => {
              const v = Number(e.target.value);
              setKill(v);
              paramsRef.current = { ...paramsRef.current, kill: v };
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
              const gs = gsRef.current;
              if (gs) gsRef.current = makeGrayScott(gs.w, gs.h);
            }}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ⚄ reseed
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas
          ref={canvasRef}
          className="block w-full h-full cursor-crosshair"
          onMouseDown={() => { paintRef.current = true; }}
          onMouseUp={() => { paintRef.current = false; }}
          onMouseLeave={() => { paintRef.current = false; }}
          onMouseMove={(e) => { if (paintRef.current) paintAt(e); }}
          onMouseDownCapture={paintAt}
        />
        <div className="absolute bottom-3 left-4 text-xs text-primary/30 pointer-events-none max-w-lg">
          two chemicals react and diffuse — the same equations Turing proposed for
          how a leopard gets its spots. drag to inject chemical B.
        </div>
      </div>
    </div>
  );
}
