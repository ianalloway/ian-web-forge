import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Sandpile } from "../features/sandpile/sandpile";

const CS = 3; // pixels per cell

// height -> [r,g,b]; 0 background, 1..3 rising green, >=4 transient white front.
const COLORS: [number, number, number][] = [
  [5, 8, 5],
  [0, 74, 28],
  [0, 150, 52],
  [128, 255, 160],
];

export default function Sandpile() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<ImageData | null>(null);
  const pileRef = useRef<Sandpile | null>(null);
  const colsRef = useRef(0);
  const rowsRef = useRef(0);
  const speedRef = useRef(60000);
  const rainRef = useRef(false);

  const [speed, setSpeed] = useState(60000);
  const [rain, setRain] = useState(false);
  const [topples, setTopples] = useState(0);
  const [unstable, setUnstable] = useState(0);

  const dropCenter = useCallback((n: number) => {
    const p = pileRef.current;
    if (!p) return;
    const cx = (colsRef.current / 2) | 0;
    const cy = (rowsRef.current / 2) | 0;
    p.drop(cy * colsRef.current + cx, n);
  }, []);

  const reset = useCallback(() => {
    pileRef.current?.reset();
    setTopples(0);
    setUnstable(0);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const off = document.createElement("canvas");
    offRef.current = off;
    const offCtx = off.getContext("2d");
    if (!offCtx) return;

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      const cols = Math.max(16, Math.floor(rect.width / CS));
      const rows = Math.max(16, Math.floor(rect.height / CS));
      colsRef.current = cols;
      rowsRef.current = rows;
      off.width = cols;
      off.height = rows;
      imgRef.current = offCtx.createImageData(cols, rows);
      pileRef.current = new Sandpile(cols, rows);
      dropCenter(30000);
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let frame = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const p = pileRef.current;
      const img = imgRef.current;
      if (!p || !img) return;
      const cols = colsRef.current;
      const rows = rowsRef.current;

      // Rain mode: scatter grains to drive self-organized criticality.
      if (rainRef.current) {
        for (let k = 0; k < 40; k++) {
          p.drop((Math.random() * cols * rows) | 0, 1);
        }
      }
      p.step(speedRef.current);

      // Paint the grid.
      const grid = p.grid;
      const data = img.data;
      for (let i = 0; i < grid.length; i++) {
        const g = grid[i];
        const c = g >= 4 ? null : COLORS[g];
        const o = i * 4;
        if (c) {
          data[o] = c[0];
          data[o + 1] = c[1];
          data[o + 2] = c[2];
        } else {
          data[o] = 255;
          data[o + 1] = 255;
          data[o + 2] = 255;
        }
        data[o + 3] = 255;
      }
      offCtx.putImageData(img, 0, 0);
      ctx.drawImage(off, 0, 0, cols, rows, 0, 0, canvas.width, canvas.height);

      if ((frame++ & 7) === 0) {
        setTopples(p.topples);
        setUnstable(p.unstable);
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [dropCenter]);

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const p = pileRef.current;
    if (!p) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const col = Math.min(colsRef.current - 1, Math.floor(((e.clientX - rect.left) / rect.width) * colsRef.current));
    const row = Math.min(rowsRef.current - 1, Math.floor(((e.clientY - rect.top) / rect.height) * rowsRef.current));
    p.drop(row * colsRef.current + col, 800);
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
          <span className="text-sm">abelian sandpile</span>
        </div>
        <div className="text-xs text-primary/40 tabular-nums">
          {topples.toLocaleString()} topples · {unstable.toLocaleString()} unstable
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">speed</span>
          <input
            type="range"
            min={2000}
            max={200000}
            step={2000}
            value={speed}
            onChange={(e) => {
              const v = Number(e.target.value);
              setSpeed(v);
              speedRef.current = v;
            }}
            className="w-28 accent-primary"
          />
        </div>

        <button
          onClick={() => {
            rainRef.current = !rain;
            setRain(!rain);
          }}
          className={`px-2 py-0.5 text-xs border transition-colors ${
            rain
              ? "border-primary bg-primary/10 text-primary"
              : "border-primary/20 text-primary/40 hover:border-primary/50"
          }`}
        >
          rain {rain ? "on" : "off"}
        </button>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => dropCenter(30000)}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            + 30k @ center
          </button>
          <button
            onClick={reset}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ↺ reset
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} onClick={onClick} className="block w-full h-full cursor-crosshair" />
        <div className="absolute bottom-3 left-4 text-xs text-primary/40 pointer-events-none max-w-xl">
          a cell with ≥4 grains topples one to each neighbor. the same simple rule builds a fractal
          from a single pile, and — with steady rain — self-organizes to the critical state where one
          grain can trigger an avalanche of any size. click to drop more.
        </div>
      </div>
    </div>
  );
}
