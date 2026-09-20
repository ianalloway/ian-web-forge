import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  DOMAIN,
  HIST_BINS,
  TARGETS,
  Chain,
  Target,
  acceptRate,
  densityGrid,
  effectiveSampleSize,
  newChain,
  step,
  trueMarginal,
} from "../features/mcmc/metropolis";

const GRID = 150; // resolution of the background density
const HIST_H = 62; // marginal histogram strip
const TRACE_H = 62; // trace plot strip

export default function Mcmc() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetRef = useRef<Target>(TARGETS[0]);
  const chainRef = useRef<Chain>(newChain(TARGETS[0]));
  const sigmaRef = useRef(0.55);
  const rateRef = useRef(12);
  const runningRef = useRef(true);
  const surfaceRef = useRef<HTMLCanvasElement | null>(null);
  const marginalRef = useRef<Float64Array>(trueMarginal(TARGETS[0], HIST_BINS));

  const [targetId, setTargetId] = useState(TARGETS[0].id);
  const [sigma, setSigma] = useState(0.55);
  const [rate, setRate] = useState(12);
  const [running, setRunning] = useState(true);
  const [showPath, setShowPath] = useState(true);
  const [hud, setHud] = useState({ samples: 0, accept: 0, ess: 0, efficiency: 0 });

  const target = useMemo(() => TARGETS.find((t) => t.id === targetId) ?? TARGETS[0], [targetId]);

  // The density surface only changes with the target, so it is rasterised once
  // into an offscreen canvas and blitted every frame.
  const rebuildSurface = useCallback((t: Target) => {
    let surface = surfaceRef.current;
    if (!surface) {
      surface = document.createElement("canvas");
      surfaceRef.current = surface;
    }
    surface.width = GRID;
    surface.height = GRID;
    const sctx = surface.getContext("2d");
    if (!sctx) return;
    const grid = densityGrid(t, GRID, GRID);
    const img = sctx.createImageData(GRID, GRID);
    for (let j = 0; j < GRID; j++) {
      for (let i = 0; i < GRID; i++) {
        // Rows run bottom-up in world space, top-down on screen.
        const v = grid[(GRID - 1 - j) * GRID + i];
        const shade = Math.pow(v, 0.42); // gamma, so the tails stay visible
        const p = (j * GRID + i) * 4;
        img.data[p] = 0;
        img.data[p + 1] = Math.round(40 + 215 * shade);
        img.data[p + 2] = Math.round(20 + 45 * shade);
        img.data[p + 3] = Math.round(255 * Math.min(1, 0.06 + 0.72 * shade));
      }
    }
    sctx.putImageData(img, 0, 0);
  }, []);

  const reset = useCallback(
    (t: Target) => {
      targetRef.current = t;
      chainRef.current = newChain(t);
      marginalRef.current = trueMarginal(t, HIST_BINS);
      rebuildSurface(t);
    },
    [rebuildSurface]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: W, height: H } = canvas;
    const chain = chainRef.current;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    const pad = 16;
    const strips = (H > 340 ? HIST_H : 0) + (H > 430 ? TRACE_H : 0);
    // The trailing 20px keeps the trace plot clear of the caption below it.
    const plotSize = Math.max(80, Math.min(W - pad * 2, H - strips - pad * 2 - 20));
    const ox = (W - plotSize) / 2;
    const oy = pad;
    const sx = (x: number) => ox + ((x - DOMAIN.x0) / (DOMAIN.x1 - DOMAIN.x0)) * plotSize;
    const sy = (y: number) => oy + (1 - (y - DOMAIN.y0) / (DOMAIN.y1 - DOMAIN.y0)) * plotSize;

    const surface = surfaceRef.current;
    if (surface) {
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(surface, ox, oy, plotSize, plotSize);
    }
    ctx.strokeStyle = "rgba(0,255,65,0.22)";
    ctx.lineWidth = 1;
    ctx.strokeRect(ox + 0.5, oy + 0.5, plotSize - 1, plotSize - 1);

    // The walk itself — where the chain has actually been.
    if (showPath && chain.path.length > 1) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.beginPath();
      chain.path.forEach(([x, y], i) => {
        if (i === 0) ctx.moveTo(sx(x), sy(y));
        else ctx.lineTo(sx(x), sy(y));
      });
      ctx.stroke();
    }

    // Every accepted position, as a faint dot cloud: this is the sample.
    ctx.fillStyle = "rgba(0,207,255,0.5)";
    const tail = chain.path.slice(-260);
    for (const [x, y] of tail) ctx.fillRect(sx(x) - 0.75, sy(y) - 0.75, 1.5, 1.5);

    // The proposal that was just turned down.
    if (chain.lastRejected) {
      const [rx, ry] = chain.lastRejected;
      ctx.strokeStyle = "rgba(255,80,80,0.85)";
      ctx.lineWidth = 1.2;
      const r = 3.5;
      ctx.beginPath();
      ctx.moveTo(sx(rx) - r, sy(ry) - r);
      ctx.lineTo(sx(rx) + r, sy(ry) + r);
      ctx.moveTo(sx(rx) + r, sy(ry) - r);
      ctx.lineTo(sx(rx) - r, sy(ry) + r);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,80,80,0.35)";
      ctx.beginPath();
      ctx.moveTo(sx(chain.x), sy(chain.y));
      ctx.lineTo(sx(rx), sy(ry));
      ctx.stroke();
    }

    // Where the chain stands, and how far it can reach in one proposal.
    const cx = sx(chain.x);
    const cy = sy(chain.y);
    const reach = (sigmaRef.current / (DOMAIN.x1 - DOMAIN.x0)) * plotSize;
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.arc(cx, cy, reach, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#eafff0";
    ctx.beginPath();
    ctx.arc(cx, cy, 3.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    // Marginal histogram: what the chain thinks, against what is true.
    let cursorY = oy + plotSize + 8;
    if (H > 340) {
      const hist = chain.histogram;
      const truth = marginalRef.current;
      const bh = HIST_H - 16;
      let maxH = 1e-9;
      for (let b = 0; b < HIST_BINS; b++) if (hist[b] > maxH) maxH = hist[b];
      const bw = plotSize / HIST_BINS;
      ctx.fillStyle = "rgba(0,255,65,0.35)";
      ctx.fillText("marginal in x — bars are the chain, line is the truth", ox, cursorY - 1);
      const base = cursorY + bh + 10;
      for (let b = 0; b < HIST_BINS; b++) {
        const h = (hist[b] / maxH) * bh;
        ctx.fillStyle = "rgba(0,207,255,0.55)";
        ctx.fillRect(ox + b * bw, base - h, Math.max(1, bw - 1), h);
      }
      ctx.strokeStyle = "#00ff41";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let b = 0; b < HIST_BINS; b++) {
        const x = ox + (b + 0.5) * bw;
        const y = base - truth[b] * bh;
        if (b === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      cursorY = base + 12;
    }

    // Trace plot: a healthy chain looks like noise, a stuck one like a staircase.
    if (H > 430) {
      const trace = chain.trace;
      const th = TRACE_H - 16;
      ctx.fillStyle = "rgba(0,255,65,0.35)";
      ctx.fillText("trace of x — flat runs are rejections, the chain standing still", ox, cursorY - 1);
      const top = cursorY + 10;
      ctx.strokeStyle = "rgba(0,255,65,0.15)";
      ctx.lineWidth = 1;
      ctx.strokeRect(ox + 0.5, top + 0.5, plotSize - 1, th - 1);
      if (trace.length > 1) {
        const show = trace.slice(-1200);
        ctx.strokeStyle = "#00cfff";
        ctx.lineWidth = 1;
        ctx.beginPath();
        show.forEach((v, i) => {
          const x = ox + (i / (show.length - 1)) * plotSize;
          const y = top + th - ((v - DOMAIN.x0) / (DOMAIN.x1 - DOMAIN.x0)) * th;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }
    }
    ctx.textBaseline = "middle";
  }, [showPath]);

  const advance = useCallback((n: number) => {
    const chain = chainRef.current;
    const t = targetRef.current;
    const s = sigmaRef.current;
    for (let i = 0; i < n; i++) step(chain, t, s);
  }, []);

  const refreshHud = useCallback(() => {
    const chain = chainRef.current;
    const ess = effectiveSampleSize(chain.trace);
    setHud({
      samples: chain.proposals,
      accept: acceptRate(chain),
      ess,
      efficiency: chain.trace.length > 0 ? ess / chain.trace.length : 0,
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      draw();
    };
    if (!surfaceRef.current) rebuildSurface(targetRef.current);
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let frame = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (runningRef.current) advance(rateRef.current);
      draw();
      // The ESS sum is O(lag·n), so it is refreshed sparingly.
      if (++frame % 30 === 0) refreshHud();
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [advance, draw, refreshHud, rebuildSurface]);

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">metropolis-hastings</span>
        </div>
        <div className="text-xs text-primary/50 tabular-nums flex gap-3 flex-wrap">
          <span>{hud.samples.toLocaleString()} draws</span>
          <span className={hud.accept > 0.6 || hud.accept < 0.1 ? "text-[#ffbe3c]" : "text-primary"}>
            accept {Math.round(hud.accept * 100)}%
          </span>
          <span className="text-[#00cfff]">ess {hud.ess.toFixed(0)}</span>
          <span>{(hud.efficiency * 100).toFixed(1)}% independent</span>
        </div>
      </div>

      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-2">
        <span className="text-primary/30 text-xs mr-1">target</span>
        {TARGETS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTargetId(t.id);
              reset(t);
              setHud({ samples: 0, accept: 0, ess: 0, efficiency: 0 });
            }}
            title={t.note}
            className={`px-2.5 py-1 text-xs border transition-colors ${
              t.id === targetId
                ? "border-primary bg-primary/15 text-primary"
                : "border-primary/25 text-primary/60 hover:border-primary hover:text-primary"
            }`}
          >
            {t.label}
          </button>
        ))}
        <span className="text-primary/30 text-xs hidden md:inline ml-1">{target.note}</span>
      </div>

      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          onClick={() => {
            runningRef.current = !running;
            setRunning(!running);
          }}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          {running ? "⏸ pause" : "▶ resume"}
        </button>
        <button
          onClick={() => {
            advance(1);
            draw();
            refreshHud();
          }}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ⇥ one proposal
        </button>
        <button
          onClick={() => {
            reset(target);
            setHud({ samples: 0, accept: 0, ess: 0, efficiency: 0 });
          }}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ↺ restart chain
        </button>
        <button
          onClick={() => setShowPath((p) => !p)}
          className={`px-3 py-1 text-xs border transition-colors ${
            showPath
              ? "border-primary bg-primary/15 text-primary"
              : "border-primary/30 hover:border-primary text-primary/70 hover:text-primary"
          }`}
        >
          {showPath ? "◼ hide walk" : "◇ show walk"}
        </button>

        <Slider
          label="σ"
          title="proposal width — the whole tradeoff lives here"
          min={0.02}
          max={3}
          step={0.01}
          value={sigma}
          fmt={(v) => v.toFixed(2)}
          onChange={(v) => {
            setSigma(v);
            sigmaRef.current = v;
          }}
        />
        <Slider
          label="rate"
          title="proposals per animation frame"
          min={1}
          max={200}
          step={1}
          value={rate}
          fmt={(v) => `${v}×`}
          onChange={(v) => {
            setRate(v);
            rateRef.current = v;
          }}
        />
      </div>

      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute bottom-1 left-4 right-4 text-xs text-primary/40 pointer-events-none">
          green field = the density being sampled · dashed circle = one proposal&apos;s reach · red ✕ =
          a rejected move · a rejection still counts as a draw, which is why tiny σ looks busy and
          learns nothing
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
  step: stepSize,
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
        step={stepSize}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-20 accent-primary"
      />
      <span className="text-primary/60 text-xs w-9 tabular-nums">{fmt(value)}</span>
    </div>
  );
}
