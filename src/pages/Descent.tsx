import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  SurfaceId,
  SURFACES,
  OptimizerId,
  OPTIMIZERS,
  OptState,
  newOpt,
  stepOpt,
} from "../features/descent/optimizers";

const SURFACE_KEYS = Object.keys(SURFACES) as SurfaceId[];
const OPT_KEYS = Object.keys(OPTIMIZERS) as OptimizerId[];
const HEAT_RES = 3; // px per heatmap sample

export default function Descent() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heatRef = useRef<HTMLCanvasElement | null>(null);
  const optsRef = useRef<Record<OptimizerId, OptState> | null>(null);
  const surfaceRef = useRef<SurfaceId>("twopits");
  const lrRef = useRef(0.02);

  const [surface, setSurface] = useState<SurfaceId>("twopits");
  const [lr, setLr] = useState(0.02);
  const [steps, setSteps] = useState(0);

  // Render the loss surface to an offscreen heatmap
  const buildHeatmap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { width: W, height: H } = canvas;
    const gw = Math.max(2, Math.floor(W / HEAT_RES));
    const gh = Math.max(2, Math.floor(H / HEAT_RES));
    const off = document.createElement("canvas");
    off.width = gw;
    off.height = gh;
    const octx = off.getContext("2d")!;
    const img = octx.createImageData(gw, gh);
    const surf = SURFACES[surfaceRef.current];

    // Find range for normalization
    let min = Infinity, max = -Infinity;
    const vals = new Float32Array(gw * gh);
    for (let gy = 0; gy < gh; gy++) {
      for (let gx = 0; gx < gw; gx++) {
        const x = (gx / (gw - 1)) * 2 - 1;
        const y = (gy / (gh - 1)) * 2 - 1;
        const v = surf.f(x, y);
        vals[gy * gw + gx] = v;
        if (v < min) min = v;
        if (v > max) max = v;
      }
    }
    const span = Math.max(1e-9, max - min);
    for (let i = 0; i < vals.length; i++) {
      const t = (vals[i] - min) / span; // 0 = deepest
      // Deep = bright green, high = near black, with contour banding
      const band = Math.abs(((vals[i] - min) / span * 14) % 1 - 0.5) < 0.06 ? 0.25 : 0;
      const g = Math.max(0, (1 - t) * 150 + band * 80);
      img.data[i * 4] = g * 0.15;
      img.data[i * 4 + 1] = g;
      img.data[i * 4 + 2] = g * 0.3;
      img.data[i * 4 + 3] = 255;
    }
    octx.putImageData(img, 0, 0);
    heatRef.current = off;
  }, []);

  const dropAt = useCallback((x: number, y: number) => {
    optsRef.current = {
      sgd: newOpt(x, y),
      momentum: newOpt(x, y),
      adam: newOpt(x, y),
    };
    setSteps(0);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      buildHeatmap();
      dropAt(-0.8, -0.75);
    };
    resize();
    window.addEventListener("resize", resize);

    let frame = 0;
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      frame++;
      const { width: W, height: H } = canvas;
      const opts = optsRef.current;
      const surf = SURFACES[surfaceRef.current];

      if (opts) {
        for (const id of OPT_KEYS) {
          stepOpt(opts[id], id, surf, lrRef.current);
        }
        if (frame % 10 === 0) {
          setSteps((s) => s + 10);
        }
      }

      const toPx = (x: number) => ((x + 1) / 2) * W;
      const toPy = (y: number) => ((y + 1) / 2) * H;

      // Heatmap
      if (heatRef.current) {
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(heatRef.current, 0, 0, W, H);
      }

      // Trails + heads
      if (opts) {
        for (const id of OPT_KEYS) {
          const o = opts[id];
          const color = OPTIMIZERS[id].color;
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          o.trail.forEach((p, i) => {
            const px = toPx(p.x);
            const py = toPy(p.y);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          });
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(toPx(o.x), toPy(o.y), 5, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
          ctx.strokeStyle = "#000";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [buildHeatmap, dropAt]);

  const onClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    dropAt(x, y);
  };

  const handleSurface = (s: SurfaceId) => {
    surfaceRef.current = s;
    setSurface(s);
    buildHeatmap();
    dropAt(-0.8, -0.75);
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
          <span className="text-sm">gradient descent arena</span>
        </div>
        <div className="text-xs text-primary/40 flex gap-4 tabular-nums">
          <span>{steps} steps</span>
          {OPT_KEYS.map((id) => (
            <span key={id} style={{ color: OPTIMIZERS[id].color }}>
              ● {OPTIMIZERS[id].label}
            </span>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <div className="flex gap-1">
          {SURFACE_KEYS.map((s) => (
            <button
              key={s}
              onClick={() => handleSurface(s)}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                surface === s
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/20 text-primary/40 hover:border-primary/50 hover:text-primary/70"
              }`}
            >
              {SURFACES[s].label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">learning rate</span>
          <input
            type="range"
            min={0.002}
            max={0.08}
            step={0.002}
            value={lr}
            onChange={(e) => {
              const v = Number(e.target.value);
              lrRef.current = v;
              setLr(v);
            }}
            className="w-28 accent-primary"
          />
          <span className="text-primary/60 text-xs w-10">{lr.toFixed(3)}</span>
        </div>

        <button
          onClick={() => dropAt(-0.8, -0.75)}
          className="ml-auto px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ↺ restart from corner
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas
          ref={canvasRef}
          className="block w-full h-full cursor-crosshair"
          onClick={onClick}
        />
        <div className="absolute bottom-3 left-4 text-xs text-primary/40 pointer-events-none">
          click to drop all three optimizers · bright = low loss · on ripples, watch SGD stall in local dips while momentum coasts through
        </div>
      </div>
    </div>
  );
}
