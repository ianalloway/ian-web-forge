import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bounds, PRESETS, applyAffine, computeBounds, pickMap } from "../features/ifs/ifs";

export default function Chaos() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<ImageData | null>(null);
  const densRef = useRef<Uint32Array>(new Uint32Array(0));
  const maxDensRef = useRef(1);
  const rwRef = useRef(0);
  const rhRef = useRef(0);
  const presetRef = useRef(0);
  const boundsRef = useRef<Bounds>({ xmin: 0, xmax: 1, ymin: 0, ymax: 1 });
  const sxRef = useRef(1);
  const syRef = useRef(1);
  const oxRef = useRef(0);
  const oyRef = useRef(0);
  const ptRef = useRef<[number, number]>([0, 0]);
  const runningRef = useRef(true);
  const speedRef = useRef(30000);

  const [preset, setPreset] = useState(0);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(30000);
  const [plotted, setPlotted] = useState(0);
  const plottedRef = useRef(0);

  // Fit the current attractor into the render buffer and clear the density map.
  const fit = useCallback(() => {
    const rw = rwRef.current;
    const rh = rhRef.current;
    if (rw === 0 || rh === 0) return;
    const ifs = PRESETS[presetRef.current];
    const b = computeBounds(ifs);
    boundsRef.current = b;
    const pad = 0.06;
    const bw = (b.xmax - b.xmin) || 1;
    const bh = (b.ymax - b.ymin) || 1;
    // Uniform scale that fits both axes, with padding.
    const s = Math.min((rw * (1 - pad)) / bw, (rh * (1 - pad)) / bh);
    sxRef.current = s;
    syRef.current = s;
    oxRef.current = (rw - s * bw) / 2 - s * b.xmin;
    oyRef.current = (rh - s * bh) / 2 - s * b.ymin;
    densRef.current = new Uint32Array(rw * rh);
    maxDensRef.current = 1;
    ptRef.current = [0, 0];
    plottedRef.current = 0;
    setPlotted(0);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;

    const off = document.createElement("canvas");
    offRef.current = off;
    const offCtx = off.getContext("2d");
    if (!offCtx) return;

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      const rw = Math.max(2, Math.round(rect.width * 0.75));
      const rh = Math.max(2, Math.round(rect.height * 0.75));
      rwRef.current = rw;
      rhRef.current = rh;
      off.width = rw;
      off.height = rh;
      imgRef.current = offCtx.createImageData(rw, rh);
      fit();
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const rw = rwRef.current;
      const rh = rhRef.current;
      const dens = densRef.current;
      const img = imgRef.current;
      if (!img || dens.length === 0) return;

      const ifs = PRESETS[presetRef.current];
      const { maps, weights } = ifs;
      const sx = sxRef.current;
      const sy = syRef.current;
      const ox = oxRef.current;
      const oy = oyRef.current;

      if (runningRef.current) {
        let [x, y] = ptRef.current;
        let maxD = maxDensRef.current;
        const budget = speedRef.current;
        for (let n = 0; n < budget; n++) {
          const m = maps[pickMap(weights, Math.random())];
          const nx = m.a * x + m.b * y + m.e;
          const ny = m.c * x + m.d * y + m.f;
          x = nx;
          y = ny;
          // Screen: flip y so +y points up.
          const px = (ox + sx * x) | 0;
          const py = (rh - 1 - (oy + sy * y)) | 0;
          if (px >= 0 && px < rw && py >= 0 && py < rh) {
            const idx = py * rw + px;
            const d = ++dens[idx];
            if (d > maxD) maxD = d;
          }
        }
        ptRef.current = [x, y];
        maxDensRef.current = maxD;
        plottedRef.current += budget;
      }

      // Map density -> matrix-green brightness on a log scale.
      const data = img.data;
      const inv = 1 / Math.log(maxDensRef.current + 1);
      for (let i = 0; i < dens.length; i++) {
        const d = dens[i];
        const o = i * 4;
        if (d === 0) {
          data[o] = 5;
          data[o + 1] = 8;
          data[o + 2] = 5;
          data[o + 3] = 255;
          continue;
        }
        const t = Math.log(d + 1) * inv; // 0..1
        data[o] = Math.round(30 * t);
        data[o + 1] = Math.round(90 + 165 * t);
        data[o + 2] = Math.round(50 + 40 * t);
        data[o + 3] = 255;
      }
      offCtx.putImageData(img, 0, 0);
      ctx.drawImage(off, 0, 0, rw, rh, 0, 0, canvas.width, canvas.height);

      if ((plottedRef.current & 0x3ffff) < speedRef.current) setPlotted(plottedRef.current);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [fit]);

  const choosePreset = (i: number) => {
    setPreset(i);
    presetRef.current = i;
    fit();
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
          <span className="text-sm">chaos game</span>
        </div>
        <div className="text-xs text-primary/40 tabular-nums">
          {plotted >= 1e6 ? `${(plotted / 1e6).toFixed(1)}M` : `${(plotted / 1e3) | 0}k`} points
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-primary/40 text-xs mr-1">attractor</span>
          {PRESETS.map((p, i) => (
            <button
              key={p.name}
              onClick={() => choosePreset(i)}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                preset === i
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/20 text-primary/50 hover:border-primary/50"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-primary/40 text-xs">speed</span>
            <input
              type="range"
              min={2000}
              max={80000}
              step={2000}
              value={speed}
              onChange={(e) => {
                const v = Number(e.target.value);
                setSpeed(v);
                speedRef.current = v;
              }}
              className="w-32 accent-primary"
            />
            <span className="text-primary/60 text-xs w-20 tabular-nums">
              {(speed / 1000) | 0}k/frame
            </span>
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
              onClick={() => fit()}
              className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
            >
              ↺ restart
            </button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute bottom-3 left-4 text-xs text-primary/40 pointer-events-none max-w-xl">
          {PRESETS[preset].blurb}. a single point hops under randomly chosen maps — yet the cloud
          of where it lands is an exact fractal, brighter where the point visits most.
        </div>
      </div>
    </div>
  );
}
