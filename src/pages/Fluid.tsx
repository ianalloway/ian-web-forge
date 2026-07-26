import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Fluid } from "../features/fluid/stableFluids";

const N = 128; // simulation grid resolution

export default function FluidPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<ImageData | null>(null);
  const fluidRef = useRef<Fluid | null>(null);
  const pointerRef = useRef({ x: 0, y: 0, px: 0, py: 0, down: false });
  const viscRef = useRef(0);
  const dissRef = useRef(0.996);
  const autoRef = useRef(true);
  const tRef = useRef(0);

  const [viscosity, setViscosity] = useState(0);
  const [dissipation, setDissipation] = useState(0.996);
  const [auto, setAuto] = useState(true);

  const reset = useCallback(() => {
    fluidRef.current?.clear();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;

    const off = document.createElement("canvas");
    off.width = N;
    off.height = N;
    offRef.current = off;
    const offCtx = off.getContext("2d");
    if (!offCtx) return;
    imgRef.current = offCtx.createImageData(N, N);

    const fluid = new Fluid(N);
    fluidRef.current = fluid;

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const f = fluidRef.current;
      const img = imgRef.current;
      if (!f || !img) return;
      f.viscosity = viscRef.current;
      f.dissipation = dissRef.current;

      const W = canvas.width;
      const H = canvas.height;
      const side = Math.min(W, H);
      const ox = (W - side) / 2;
      const oy = (H - side) / 2;

      // Pointer stirring: inject dye and momentum along the drag direction.
      const p = pointerRef.current;
      if (p.down) {
        const gx = Math.floor(((p.x - ox) / side) * N) + 1;
        const gy = Math.floor(((p.y - oy) / side) * N) + 1;
        if (gx >= 1 && gx <= N && gy >= 1 && gy <= N) {
          const dx = (p.x - p.px) * 0.22;
          const dy = (p.y - p.py) * 0.22;
          for (let j = -2; j <= 2; j++) {
            for (let i = -2; i <= 2; i++) {
              const x = gx + i;
              const y = gy + j;
              if (x < 1 || x > N || y < 1 || y > N) continue;
              const falloff = 1 - Math.hypot(i, j) / 3.2;
              if (falloff <= 0) continue;
              f.addDye(x, y, 0.34 * falloff);
              f.addVelocity(x, y, dx * falloff, dy * falloff);
            }
          }
        }
      }
      p.px = p.x;
      p.py = p.y;

      // Ambient plume so the page is alive before you touch it.
      if (autoRef.current) {
        tRef.current += 0.016;
        const t = tRef.current;
        const cx = Math.floor(N / 2 + Math.cos(t * 0.7) * N * 0.22);
        const cy = Math.floor(N * 0.78);
        for (let j = -2; j <= 2; j++) {
          for (let i = -2; i <= 2; i++) {
            const x = cx + i;
            const y = cy + j;
            if (x < 1 || x > N || y < 1 || y > N) continue;
            f.addDye(x, y, 0.14);
            f.addVelocity(x, y, Math.cos(t * 1.3) * 0.6, -2.4);
          }
        }
      }

      f.step(0.11);

      // Render dye as a green-to-white glow.
      const data = img.data;
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
          const d = Math.min(1, f.dye[f.idx(i + 1, j + 1)]);
          const o = (j * N + i) * 4;
          const g = Math.pow(d, 0.72);
          data[o] = Math.round(40 * g * g);
          data[o + 1] = Math.round(18 + 232 * g);
          data[o + 2] = Math.round(24 + 90 * g * g);
          data[o + 3] = 255;
        }
      }
      offCtx.putImageData(img, 0, 0);
      ctx.fillStyle = "#050805";
      ctx.fillRect(0, 0, W, H);
      ctx.drawImage(off, 0, 0, N, N, ox, oy, side, side);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = pos(e);
    pointerRef.current = { x, y, px: x, py: y, down: true };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = pos(e);
    pointerRef.current.x = x;
    pointerRef.current.y = y;
  };

  const onUp = () => {
    pointerRef.current.down = false;
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
          <span className="text-sm">stable fluids</span>
        </div>
        <div className="text-xs text-primary/40 tabular-nums">
          {N}² grid · navier-stokes
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">viscosity</span>
          <input
            type="range"
            min={0}
            max={0.00004}
            step={0.000002}
            value={viscosity}
            onChange={(e) => {
              const v = Number(e.target.value);
              setViscosity(v);
              viscRef.current = v;
            }}
            className="w-28 accent-primary"
          />
          <span className="text-primary/60 text-xs w-10 tabular-nums">
            {(viscosity * 1e6).toFixed(0)}µ
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">fade</span>
          <input
            type="range"
            min={0.97}
            max={1}
            step={0.001}
            value={dissipation}
            onChange={(e) => {
              const v = Number(e.target.value);
              setDissipation(v);
              dissRef.current = v;
            }}
            className="w-24 accent-primary"
          />
          <span className="text-primary/60 text-xs w-10 tabular-nums">{dissipation.toFixed(3)}</span>
        </div>

        <button
          onClick={() => {
            autoRef.current = !auto;
            setAuto(!auto);
          }}
          className={`px-2 py-0.5 text-xs border transition-colors ${
            auto
              ? "border-primary bg-primary/10 text-primary"
              : "border-primary/20 text-primary/40 hover:border-primary/50"
          }`}
        >
          plume {auto ? "on" : "off"}
        </button>

        <button
          onClick={reset}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors ml-auto"
        >
          ↺ clear
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas
          ref={canvasRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          className="block w-full h-full touch-none cursor-crosshair"
        />
        <div className="absolute bottom-3 left-4 text-xs text-primary/40 pointer-events-none max-w-xl">
          drag to stir. every frame the velocity field is diffused, advected along itself, then
          projected divergence-free — that last step is what conserves mass and curls the flow into
          vortices instead of letting it just blur away.
        </div>
      </div>
    </div>
  );
}
