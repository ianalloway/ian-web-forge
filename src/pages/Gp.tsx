import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  DATASETS,
  DEFAULT_PARAMS,
  DOMAIN,
  KERNELS,
  KernelParams,
  Observation,
  makeRng,
  posterior,
} from "../features/gp/gp";

const GRID = 160; // test points across the domain
const SAMPLE_COUNT = 3;

export default function Gp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [obs, setObs] = useState<Observation[]>(() => DATASETS[0].points(makeRng(11)));
  const [kernelId, setKernelId] = useState(KERNELS[0].id);
  const [params, setParams] = useState<KernelParams>({ ...DEFAULT_PARAMS });
  const [seed, setSeed] = useState(5);
  const [showSamples, setShowSamples] = useState(true);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const kernel = KERNELS.find((k) => k.id === kernelId) ?? KERNELS[0];

  const grid = useMemo(() => {
    const g = new Float64Array(GRID);
    for (let i = 0; i < GRID; i++) g[i] = DOMAIN.x0 + (i / (GRID - 1)) * (DOMAIN.x1 - DOMAIN.x0);
    return g;
  }, []);

  // Everything on screen is a deterministic function of the data and the
  // hyper-parameters, so it is derived rather than stored.
  const post = useMemo(
    () => posterior(obs, grid, kernel, params, showSamples ? SAMPLE_COUNT : 0, makeRng(seed)),
    [obs, grid, kernel, params, showSamples, seed]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: W, height: H } = canvas;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    const pad = 26;
    const plotW = W - pad * 2;
    const plotH = H - pad * 2;
    const sx = (x: number) => pad + ((x - DOMAIN.x0) / (DOMAIN.x1 - DOMAIN.x0)) * plotW;
    const sy = (y: number) => pad + (1 - (y - DOMAIN.y0) / (DOMAIN.y1 - DOMAIN.y0)) * plotH;

    // axes
    ctx.strokeStyle = "rgba(0,255,65,0.1)";
    ctx.lineWidth = 1;
    for (let x = Math.ceil(DOMAIN.x0); x <= DOMAIN.x1; x++) {
      ctx.beginPath();
      ctx.moveTo(sx(x), pad);
      ctx.lineTo(sx(x), pad + plotH);
      ctx.stroke();
    }
    for (let y = Math.ceil(DOMAIN.y0); y <= DOMAIN.y1; y++) {
      ctx.beginPath();
      ctx.moveTo(pad, sy(y));
      ctx.lineTo(pad + plotW, sy(y));
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(0,255,65,0.28)";
    ctx.beginPath();
    ctx.moveTo(pad, sy(0));
    ctx.lineTo(pad + plotW, sy(0));
    ctx.stroke();

    // The 95% band. This is the part a single fitted curve cannot tell you:
    // it pinches at the data and flares wherever nothing was measured.
    ctx.fillStyle = "rgba(0,255,65,0.16)";
    ctx.beginPath();
    for (let i = 0; i < GRID; i++) ctx.lineTo(sx(grid[i]), sy(post.mean[i] + 2 * post.sd[i]));
    for (let i = GRID - 1; i >= 0; i--) ctx.lineTo(sx(grid[i]), sy(post.mean[i] - 2 * post.sd[i]));
    ctx.closePath();
    ctx.fill();

    // one-sigma, slightly stronger
    ctx.fillStyle = "rgba(0,255,65,0.16)";
    ctx.beginPath();
    for (let i = 0; i < GRID; i++) ctx.lineTo(sx(grid[i]), sy(post.mean[i] + post.sd[i]));
    for (let i = GRID - 1; i >= 0; i--) ctx.lineTo(sx(grid[i]), sy(post.mean[i] - post.sd[i]));
    ctx.closePath();
    ctx.fill();

    // Functions drawn from the posterior: every one of them is consistent with
    // the data, and their spread is the band.
    ctx.lineWidth = 1;
    for (const f of post.samples) {
      ctx.strokeStyle = "rgba(0,207,255,0.5)";
      ctx.beginPath();
      for (let i = 0; i < GRID; i++) {
        const px = sx(grid[i]);
        const py = sy(f[i]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // posterior mean
    ctx.strokeStyle = "#00ff41";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < GRID; i++) {
      const px = sx(grid[i]);
      const py = sy(post.mean[i]);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // observations, with their noise bars
    for (const o of obs) {
      const px = sx(o.x);
      const py = sy(o.y);
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, sy(o.y - params.noise));
      ctx.lineTo(px, sy(o.y + params.noise));
      ctx.stroke();
      ctx.fillStyle = "#eafff0";
      ctx.beginPath();
      ctx.arc(px, py, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "rgba(0,255,65,0.4)";
    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(
      obs.length === 0 ? "the prior — every band is guesswork until a point is placed" : "click to add a point · shift-click to remove one",
      pad,
      pad - 14
    );
    ctx.textBaseline = "middle";
  }, [grid, obs, params.noise, post]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      setSize({ w: rect.width, h: rect.height });
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    draw();
  }, [draw, size]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const pad = 26;
    const plotW = rect.width - pad * 2;
    const plotH = rect.height - pad * 2;
    const x = DOMAIN.x0 + ((e.clientX - rect.left - pad) / plotW) * (DOMAIN.x1 - DOMAIN.x0);
    const y = DOMAIN.y0 + (1 - (e.clientY - rect.top - pad) / plotH) * (DOMAIN.y1 - DOMAIN.y0);
    if (x < DOMAIN.x0 || x > DOMAIN.x1 || y < DOMAIN.y0 || y > DOMAIN.y1) return;

    if (e.shiftKey) {
      setObs((prev) => {
        if (prev.length === 0) return prev;
        let best = 0;
        for (let i = 1; i < prev.length; i++) {
          if (Math.hypot(prev[i].x - x, prev[i].y - y) < Math.hypot(prev[best].x - x, prev[best].y - y)) best = i;
        }
        return prev.filter((_, i) => i !== best);
      });
      return;
    }
    setObs((prev) => [...prev, { x, y }]);
  };

  const set = (patch: Partial<KernelParams>) => setParams((p) => ({ ...p, ...patch }));

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">gaussian process</span>
        </div>
        <div className="text-xs text-primary/50 tabular-nums flex gap-3 flex-wrap">
          <span>{obs.length} observations</span>
          <span title="log marginal likelihood — how well these hyper-parameters explain the data">
            log p(y|X) {Number.isFinite(post.logMarginalLikelihood) ? post.logMarginalLikelihood.toFixed(1) : "—"}
          </span>
          <span className="text-[#00cfff]">{kernel.label}</span>
        </div>
      </div>

      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-2">
        <span className="text-primary/30 text-xs mr-1">kernel</span>
        {KERNELS.map((k) => (
          <button
            key={k.id}
            onClick={() => setKernelId(k.id)}
            title={k.note}
            className={`px-2.5 py-1 text-xs border transition-colors ${
              k.id === kernelId
                ? "border-primary bg-primary/15 text-primary"
                : "border-primary/25 text-primary/60 hover:border-primary hover:text-primary"
            }`}
          >
            {k.label}
          </button>
        ))}
        <span className="text-primary/30 text-xs hidden lg:inline ml-1">{kernel.note}</span>
      </div>

      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-2">
        <span className="text-primary/30 text-xs mr-1">data</span>
        {DATASETS.map((d) => (
          <button
            key={d.id}
            onClick={() => setObs(d.points(makeRng(11)))}
            title={d.note}
            className="px-2.5 py-1 text-xs border border-primary/25 text-primary/60 hover:border-primary hover:text-primary transition-colors"
          >
            {d.label}
          </button>
        ))}
        <button
          onClick={() => setObs([])}
          className="px-2.5 py-1 text-xs border border-primary/25 text-primary/60 hover:border-primary hover:text-primary transition-colors"
        >
          ↺ clear
        </button>
        <button
          onClick={() => setSeed((s) => s + 1)}
          title="draw different functions from the same posterior"
          className="px-2.5 py-1 text-xs border border-primary/25 text-primary/60 hover:border-primary hover:text-primary transition-colors"
        >
          ⟳ resample
        </button>
        <button
          onClick={() => setShowSamples((s) => !s)}
          className={`px-2.5 py-1 text-xs border transition-colors ${
            showSamples
              ? "border-primary bg-primary/15 text-primary"
              : "border-primary/25 text-primary/60 hover:border-primary hover:text-primary"
          }`}
        >
          {showSamples ? "◼ hide draws" : "◇ show draws"}
        </button>
      </div>

      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Slider
          label="ℓ"
          title="lengthscale — how far one observation's influence reaches"
          min={0.1}
          max={4}
          step={0.05}
          value={params.lengthscale}
          fmt={(v) => v.toFixed(2)}
          onChange={(v) => set({ lengthscale: v })}
        />
        <Slider
          label="σf"
          title="amplitude — the prior standard deviation of the function"
          min={0.2}
          max={3}
          step={0.05}
          value={params.amplitude}
          fmt={(v) => v.toFixed(2)}
          onChange={(v) => set({ amplitude: v })}
        />
        <Slider
          label="σn"
          title="observation noise — how much of the data is measurement error"
          min={0.01}
          max={1}
          step={0.01}
          value={params.noise}
          fmt={(v) => v.toFixed(2)}
          onChange={(v) => set({ noise: v })}
        />
        {kernel.id === "periodic" && (
          <Slider
            label="p"
            title="period — how far apart the pattern repeats"
            min={0.5}
            max={6}
            step={0.1}
            value={params.period}
            fmt={(v) => v.toFixed(1)}
            onChange={(v) => set({ period: v })}
          />
        )}
      </div>

      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} onClick={handleClick} className="block w-full h-full cursor-crosshair" />
        <div className="absolute bottom-1 left-4 right-4 text-xs text-primary/40 pointer-events-none">
          green line = posterior mean · the band is ±1σ and ±2σ · cyan = functions drawn from the
          posterior, all of them consistent with the data · the band ignores y entirely: it knows
          only where you looked
        </div>
      </div>
    </div>
  );
}

function Slider({
  label,
  title,
  min,
  max,
  step,
  value,
  fmt,
  onChange,
}: {
  label: string;
  title: string;
  min: number;
  max: number;
  step: number;
  value: number;
  fmt: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2" title={title}>
      <span className="text-primary/40 text-xs">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-20 accent-primary"
      />
      <span className="text-primary/60 text-xs w-9 tabular-nums">{fmt(value)}</span>
    </div>
  );
}
