import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Cyclic } from "../features/cyclic/cyclic";

const CS = 3; // pixels per cell

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r: number;
  let g: number;
  let b: number;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

function makePalette(n: number): [number, number, number][] {
  // Sweep green -> cyan -> blue -> violet so cyclic waves read clearly.
  return Array.from({ length: n }, (_, i) => hslToRgb(110 + (i / n) * 250, 0.85, 0.55));
}

export default function CyclicPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<ImageData | null>(null);
  const caRef = useRef<Cyclic | null>(null);
  const palRef = useRef(makePalette(6));
  const colsRef = useRef(0);
  const rowsRef = useRef(0);
  const statesRef = useRef(6);
  const thresholdRef = useRef(3);
  const speedRef = useRef(2);
  const runningRef = useRef(true);

  const [states, setStates] = useState(6);
  const [threshold, setThreshold] = useState(3);
  const [speed, setSpeed] = useState(2);
  const [running, setRunning] = useState(true);
  const [gen, setGen] = useState(0);

  const build = useCallback(() => {
    const cols = colsRef.current;
    const rows = rowsRef.current;
    if (cols === 0 || rows === 0) return;
    palRef.current = makePalette(statesRef.current);
    caRef.current = new Cyclic(cols, rows, statesRef.current, thresholdRef.current);
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
      build();
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let frame = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const ca = caRef.current;
      const img = imgRef.current;
      if (!ca || !img) return;

      if (runningRef.current) {
        for (let s = 0; s < speedRef.current; s++) ca.step();
      }

      const data = img.data;
      const grid = ca.grid;
      const pal = palRef.current;
      for (let i = 0; i < grid.length; i++) {
        const c = pal[grid[i]] ?? pal[0];
        const o = i * 4;
        data[o] = c[0];
        data[o + 1] = c[1];
        data[o + 2] = c[2];
        data[o + 3] = 255;
      }
      offCtx.putImageData(img, 0, 0);
      ctx.drawImage(off, 0, 0, ca.w, ca.h, 0, 0, canvas.width, canvas.height);

      if ((frame++ & 7) === 0) setGen(ca.generation);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [build]);

  const chooseStates = (n: number) => {
    setStates(n);
    statesRef.current = n;
    build();
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
          <span className="text-sm">cyclic automaton</span>
        </div>
        <div className="text-xs text-primary/40 tabular-nums">
          {states} states · gen {gen}
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-primary/40 text-xs mr-1">states</span>
          {[3, 4, 5, 6, 8].map((n) => (
            <button
              key={n}
              onClick={() => chooseStates(n)}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                states === n
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/20 text-primary/50 hover:border-primary/50"
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">threshold</span>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={threshold}
            onChange={(e) => {
              const v = Number(e.target.value);
              setThreshold(v);
              thresholdRef.current = v;
              if (caRef.current) caRef.current.threshold = v;
            }}
            className="w-24 accent-primary"
          />
          <span className="text-primary/60 text-xs w-4 tabular-nums">{threshold}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">speed</span>
          <input
            type="range"
            min={1}
            max={6}
            step={1}
            value={speed}
            onChange={(e) => {
              const v = Number(e.target.value);
              setSpeed(v);
              speedRef.current = v;
            }}
            className="w-20 accent-primary"
          />
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => {
              runningRef.current = !running;
              setRunning(!running);
            }}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            {running ? "⏸ pause" : "▶ run"}
          </button>
          <button
            onClick={() => caRef.current?.randomize()}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ↺ randomize
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute bottom-3 left-4 text-xs text-primary/40 pointer-events-none max-w-xl">
          each cell is beaten by the next color in the cycle and advances when enough neighbors already
          hold it. from pure noise, the rock-paper-scissors rule winds itself into rotating spirals.
        </div>
      </div>
    </div>
  );
}
