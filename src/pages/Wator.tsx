import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { DEFAULT_PARAMS, EMPTY, FISH, Wator } from "../features/wator/wator";

const CS = 4; // pixels per cell
const HISTORY = 260;

export default function WatorPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<ImageData | null>(null);
  const modelRef = useRef<Wator | null>(null);
  const colsRef = useRef(0);
  const rowsRef = useRef(0);
  const speedRef = useRef(1);
  const runningRef = useRef(true);
  const histRef = useRef<{ f: number; s: number }[]>([]);

  const [speed, setSpeed] = useState(1);
  const [running, setRunning] = useState(true);
  const [params, setParams] = useState({ ...DEFAULT_PARAMS });
  const [stat, setStat] = useState({ chronon: 0, fish: 0, sharks: 0 });

  const reseed = useCallback(() => {
    modelRef.current?.seed();
    histRef.current = [];
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
      const cols = Math.max(20, Math.floor(rect.width / CS));
      const rows = Math.max(20, Math.floor(rect.height / CS));
      colsRef.current = cols;
      rowsRef.current = rows;
      off.width = cols;
      off.height = rows;
      imgRef.current = offCtx.createImageData(cols, rows);
      const m = new Wator(cols, rows, params);
      m.seed();
      modelRef.current = m;
      histRef.current = [];
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let frame = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const m = modelRef.current;
      const img = imgRef.current;
      if (!m || !img) return;
      const cols = colsRef.current;
      const rows = rowsRef.current;

      if (runningRef.current) {
        for (let s = 0; s < speedRef.current; s++) {
          m.step();
          const c = m.counts();
          const hist = histRef.current;
          hist.push({ f: c.fish, s: c.sharks });
          if (hist.length > HISTORY) hist.shift();
        }
      }

      // Paint the ocean.
      const data = img.data;
      const type = m.type;
      for (let i = 0; i < type.length; i++) {
        const o = i * 4;
        const t = type[i];
        if (t === FISH) {
          data[o] = 0;
          data[o + 1] = 220;
          data[o + 2] = 90;
        } else if (t === EMPTY) {
          data[o] = 4;
          data[o + 1] = 12;
          data[o + 2] = 20;
        } else {
          data[o] = 255;
          data[o + 1] = 120;
          data[o + 2] = 30;
        }
        data[o + 3] = 255;
      }
      offCtx.putImageData(img, 0, 0);
      const W = canvas.width;
      const H = canvas.height;
      ctx.drawImage(off, 0, 0, cols, rows, 0, 0, W, H);

      // Population history chart (bottom overlay).
      const hist = histRef.current;
      if (hist.length > 1) {
        const ch = 64;
        const cy = H - ch - 8;
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(8, cy, W - 16, ch);
        let maxV = 1;
        for (const p of hist) maxV = Math.max(maxV, p.f, p.s);
        const plot = (key: "f" | "s", color: string) => {
          ctx.beginPath();
          for (let i = 0; i < hist.length; i++) {
            const x = 8 + (i / (HISTORY - 1)) * (W - 16);
            const y = cy + ch - (hist[i][key] / maxV) * (ch - 4) - 2;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        };
        plot("f", "#00dc5a");
        plot("s", "#ff781e");
      }

      if ((frame++ & 3) === 0) {
        const c = m.counts();
        setStat({ chronon: m.chronon, fish: c.fish, sharks: c.sharks });
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
    // params intentionally excluded: slider changes mutate the live model in place
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setParam = (key: keyof typeof params, v: number) => {
    setParams((p) => {
      const np = { ...p, [key]: v };
      if (modelRef.current) modelRef.current.params = np;
      return np;
    });
  };

  const sliders: { key: keyof typeof params; label: string; min: number; max: number }[] = [
    { key: "fishBreed", label: "fish breed", min: 1, max: 10 },
    { key: "sharkBreed", label: "shark breed", min: 3, max: 20 },
    { key: "sharkStarve", label: "shark energy", min: 3, max: 25 },
    { key: "fishEnergy", label: "eat gain", min: 1, max: 10 },
  ];

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">wa-tor — predator &amp; prey</span>
        </div>
        <div className="text-xs tabular-nums">
          <span className="text-primary/40">chronon {stat.chronon} · </span>
          <span style={{ color: "#00dc5a" }}>{stat.fish} fish</span>
          <span className="text-primary/40"> · </span>
          <span style={{ color: "#ff781e" }}>{stat.sharks} sharks</span>
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        {sliders.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <span className="text-primary/40 text-xs">{s.label}</span>
            <input
              type="range"
              min={s.min}
              max={s.max}
              step={1}
              value={params[s.key]}
              onChange={(e) => setParam(s.key, Number(e.target.value))}
              className="w-16 accent-primary"
            />
            <span className="text-primary/60 text-xs w-4 tabular-nums">{params[s.key]}</span>
          </div>
        ))}

        <div className="flex items-center gap-1.5">
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
            className="w-16 accent-primary"
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
            onClick={reseed}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ↺ reseed
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute top-3 left-4 text-xs text-primary/40 pointer-events-none max-w-md">
          fish wander and breed; sharks hunt, breed, and starve without food. neither is steered —
          the green and orange curves chase each other in endless predator-prey cycles.
        </div>
      </div>
    </div>
  );
}
