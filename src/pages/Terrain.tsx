import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Terrain, diamondSquare } from "../features/terrain/diamondSquare";

const N = 8; // grid is 2^N + 1 = 257

// Light direction (from the upper-left), normalized.
const LX = -0.6;
const LY = -0.6;
const LZ = 0.53;

export default function TerrainPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<ImageData | null>(null);
  const terrainRef = useRef<Terrain | null>(null);
  const waterRef = useRef(0.34);
  const reliefRef = useRef(0.55);

  const [persistence, setPersistence] = useState(0.56);
  const [water, setWater] = useState(0.34);

  // Repaint the current terrain (colors depend on the water level).
  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const off = offRef.current;
    const img = imgRef.current;
    const terrain = terrainRef.current;
    if (!canvas || !off || !img || !terrain) return;
    const ctx = canvas.getContext("2d");
    const offCtx = off.getContext("2d");
    if (!ctx || !offCtx) return;

    const { size, heights } = terrain;
    const data = img.data;
    const w = waterRef.current;
    const relief = reliefRef.current;
    const clamp = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = y * size + x;
        const e = heights[i];
        // Surface normal from height differences.
        const l = heights[y * size + (x > 0 ? x - 1 : x)];
        const r = heights[y * size + (x < size - 1 ? x + 1 : x)];
        const u = heights[(y > 0 ? y - 1 : y) * size + x];
        const d = heights[(y < size - 1 ? y + 1 : y) * size + x];
        let nx = l - r;
        let ny = u - d;
        let nz = relief;
        const inv = 1 / Math.hypot(nx, ny, nz);
        nx *= inv;
        ny *= inv;
        nz *= inv;
        let shade = nx * LX + ny * LY + nz * LZ;
        shade = shade < 0.4 ? 0.4 : shade > 1 ? 1 : shade;

        let cr: number;
        let cg: number;
        let cb: number;
        if (e < w) {
          const depth = w > 0 ? (w - e) / w : 0; // 0 shore .. 1 deep
          const s = 0.75 + 0.25 * shade;
          cr = (6 + 8 * (1 - depth)) * s;
          cg = (45 + 70 * (1 - depth)) * s;
          cb = (70 + 70 * (1 - depth)) * s;
        } else {
          const t = (e - w) / (1 - w || 1);
          let r0: number;
          let g0: number;
          let b0: number;
          if (t < 0.5) {
            const k = t / 0.5;
            r0 = 12 + 18 * k;
            g0 = 70 + 120 * k;
            b0 = 34 + 26 * k;
          } else if (t < 0.85) {
            const k = (t - 0.5) / 0.35;
            r0 = 30 + 95 * k;
            g0 = 190 + 45 * k;
            b0 = 60 + 70 * k;
          } else {
            const k = (t - 0.85) / 0.15;
            r0 = 125 + 120 * k;
            g0 = 235 + 20 * k;
            b0 = 130 + 115 * k;
          }
          cr = r0 * shade;
          cg = g0 * shade;
          cb = b0 * shade;
        }
        const o = i * 4;
        data[o] = clamp(cr);
        data[o + 1] = clamp(cg);
        data[o + 2] = clamp(cb);
        data[o + 3] = 255;
      }
    }
    offCtx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(off, 0, 0, size, size, 0, 0, canvas.width, canvas.height);
  }, []);

  // Capture the initial persistence so the mount effect can seed the first
  // terrain (later changes go through the slider/button handlers).
  const initialPersistenceRef = useRef(persistence);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const off = document.createElement("canvas");
    const size = (1 << N) + 1;
    off.width = size;
    off.height = size;
    offRef.current = off;
    const offCtx = off.getContext("2d");
    if (!offCtx) return;
    imgRef.current = offCtx.createImageData(size, size);

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      paint();
    };

    terrainRef.current = diamondSquare(N, initialPersistenceRef.current, Math.random);
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [paint]);

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">fractal terrain</span>
        </div>
        <div className="text-xs text-primary/40 tabular-nums">diamond-square · {(1 << N) + 1}²</div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">roughness</span>
          <input
            type="range"
            min={0.35}
            max={0.75}
            step={0.01}
            value={persistence}
            onChange={(e) => {
              const v = Number(e.target.value);
              setPersistence(v);
              terrainRef.current = diamondSquare(N, v, Math.random);
              paint();
            }}
            className="w-32 accent-primary"
          />
          <span className="text-primary/60 text-xs w-8 tabular-nums">{persistence.toFixed(2)}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">sea level</span>
          <input
            type="range"
            min={0}
            max={0.75}
            step={0.01}
            value={water}
            onChange={(e) => {
              const v = Number(e.target.value);
              setWater(v);
              waterRef.current = v;
              paint();
            }}
            className="w-32 accent-primary"
          />
          <span className="text-primary/60 text-xs w-8 tabular-nums">{water.toFixed(2)}</span>
        </div>

        <button
          onClick={() => {
            terrainRef.current = diamondSquare(N, persistence, Math.random);
            paint();
          }}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors ml-auto"
        >
          ⛰ new terrain
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute bottom-3 left-4 text-xs text-primary/40 pointer-events-none max-w-xl">
          seed four corners, set each midpoint to its neighbors' average plus a shrinking random
          nudge, repeat. that one recursive rule carves coastlines, ridgelines, and peaks — hill-shaded
          from the upper-left.
        </div>
      </div>
    </div>
  );
}
