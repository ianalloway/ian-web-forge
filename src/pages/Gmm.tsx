import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fitCanvas } from "../lib/canvas";
import {
  DatasetId,
  DATASETS,
  GmmState,
  Pt,
  CLUSTER_COLORS,
  eigen2x2,
  initGmm,
  makeDataset,
  step,
} from "../features/gmm/gmm";

const DATASET_KEYS = Object.keys(DATASETS) as DatasetId[];
const STEP_MS = 320;

type RGB = [number, number, number];
const RGB_COLORS: RGB[] = CLUSTER_COLORS.map((h) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
]);

export default function Gmm() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const pointsRef = useRef<Pt[]>([]);
  const stateRef = useRef<GmmState | null>(null);
  const historyRef = useRef<number[]>([]);
  const runningRef = useRef(false);
  const kRef = useRef(3);
  const prevLLRef = useRef(-Infinity);

  const [k, setK] = useState(3);
  const [running, setRunning] = useState(false);
  const [iteration, setIteration] = useState(0);
  const [logLik, setLogLik] = useState<number | null>(null);
  const [converged, setConverged] = useState(false);
  const [pointCount, setPointCount] = useState(0);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w: W, h: H } = sizeRef.current;
    const points = pointsRef.current;
    const st = stateRef.current;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    // Points coloured by their soft responsibility — overlap blends colours.
    points.forEach((p, i) => {
      let r = 255;
      let g = 255;
      let b = 255;
      let alpha = 0.32;
      if (st) {
        r = g = b = 0;
        const row = st.resp[i];
        for (let j = 0; j < row.length; j++) {
          r += RGB_COLORS[j % RGB_COLORS.length][0] * row[j];
          g += RGB_COLORS[j % RGB_COLORS.length][1] * row[j];
          b += RGB_COLORS[j % RGB_COLORS.length][2] * row[j];
        }
        alpha = 0.85;
      }
      ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Each component: 1σ and 2σ covariance ellipses, plus a mean marker.
    if (st) {
      st.comps.forEach((c, i) => {
        const color = CLUSTER_COLORS[i % CLUSTER_COLORS.length];
        const [a, bb, cc] = c.cov;
        const { l1, l2, angle } = eigen2x2(a, bb, cc);
        const rx = Math.sqrt(Math.max(l1, 0));
        const ry = Math.sqrt(Math.max(l2, 0));
        for (const s of [1, 2]) {
          ctx.beginPath();
          ctx.ellipse(c.mean.x, c.mean.y, rx * s, ry * s, angle, 0, Math.PI * 2);
          ctx.strokeStyle = color + (s === 1 ? "cc" : "55");
          ctx.lineWidth = s === 1 ? 2 : 1;
          ctx.stroke();
        }
        // mean cross + weight
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        const r = 6;
        ctx.beginPath();
        ctx.moveTo(c.mean.x - r, c.mean.y);
        ctx.lineTo(c.mean.x + r, c.mean.y);
        ctx.moveTo(c.mean.x, c.mean.y - r);
        ctx.lineTo(c.mean.x, c.mean.y + r);
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.font = "10px monospace";
        ctx.fillText(`π ${c.weight.toFixed(2)}`, c.mean.x + 9, c.mean.y - 7);
      });
    }

    // Log-likelihood sparkline (bottom-left).
    const hist = historyRef.current;
    if (hist.length > 1) {
      const cw = 150;
      const ch = 40;
      const x0 = 16;
      const y1 = H - 16;
      const y0 = y1 - ch;
      let lo = Infinity;
      let hi = -Infinity;
      for (const v of hist) {
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
      if (hi - lo < 1e-9) hi = lo + 1;
      ctx.strokeStyle = "rgba(0,255,65,0.15)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x0 + 0.5, y0 + 0.5, cw, ch);
      ctx.beginPath();
      hist.forEach((v, i) => {
        const px = x0 + (i / (hist.length - 1)) * cw;
        const py = y1 - ((v - lo) / (hi - lo)) * ch;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      });
      ctx.strokeStyle = "#00ff41";
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.fillStyle = "rgba(0,255,65,0.45)";
      ctx.font = "10px monospace";
      ctx.fillText("log-likelihood ↑", x0 + 4, y0 - 5);
    }

    setPointCount(points.length);
  }, []);

  const syncState = useCallback(() => {
    const st = stateRef.current;
    setIteration(st?.iteration ?? 0);
    setLogLik(st?.logLik ?? null);
  }, []);

  const reset = useCallback(() => {
    stateRef.current = null;
    historyRef.current = [];
    prevLLRef.current = -Infinity;
    runningRef.current = false;
    setRunning(false);
    setConverged(false);
    syncState();
    redraw();
  }, [redraw, syncState]);

  const seed = useCallback(() => {
    const points = pointsRef.current;
    if (points.length < kRef.current) return false;
    stateRef.current = initGmm(points, kRef.current);
    historyRef.current = [stateRef.current.logLik];
    prevLLRef.current = stateRef.current.logLik;
    setConverged(false);
    syncState();
    redraw();
    return true;
  }, [redraw, syncState]);

  const doStep = useCallback(() => {
    if (!stateRef.current) {
      seed();
      return;
    }
    stateRef.current = step(pointsRef.current, stateRef.current);
    const ll = stateRef.current.logLik;
    historyRef.current.push(ll);
    if (historyRef.current.length > 400) historyRef.current.shift();
    if (ll - prevLLRef.current < 1e-3) setConverged(true);
    prevLLRef.current = ll;
    syncState();
    redraw();
  }, [seed, redraw, syncState]);

  useEffect(() => {
    const id = setInterval(() => {
      if (!runningRef.current) return;
      if (!stateRef.current) {
        if (!seed()) {
          runningRef.current = false;
          setRunning(false);
        }
        return;
      }
      stateRef.current = step(pointsRef.current, stateRef.current);
      const ll = stateRef.current.logLik;
      historyRef.current.push(ll);
      if (historyRef.current.length > 400) historyRef.current.shift();
      if (ll - prevLLRef.current < 1e-3) {
        setConverged(true);
        runningRef.current = false;
        setRunning(false);
      }
      prevLLRef.current = ll;
      syncState();
      redraw();
    }, STEP_MS);
    return () => clearInterval(id);
  }, [seed, redraw, syncState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      const { width, height } = fitCanvas(canvas, rect.width, rect.height);
      sizeRef.current = { w: width, h: height };
      if (pointsRef.current.length === 0) {
        pointsRef.current = makeDataset("blobs", width, height);
      }
      redraw();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [redraw]);

  const onClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    pointsRef.current.push({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    reset();
  };

  const handleDataset = (id: DatasetId) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    pointsRef.current = makeDataset(id, sizeRef.current.w, sizeRef.current.h);
    reset();
  };

  const handleK = (v: number) => {
    kRef.current = v;
    setK(v);
    reset();
  };

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/lab" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← lab
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">gaussian mixture (EM)</span>
        </div>
        <div className="text-xs text-primary/40 flex gap-4 tabular-nums">
          <span>{pointCount} pts</span>
          <span>iter {iteration}</span>
          {logLik !== null && <span>ℓ {logLik.toFixed(1)}</span>}
          {converged && <span className="text-primary">✓ converged</span>}
        </div>
      </div>

      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">components</span>
          <input
            type="range"
            min={2}
            max={6}
            value={k}
            onChange={(e) => handleK(Number(e.target.value))}
            className="w-24 accent-primary"
          />
          <span className="text-primary/60 text-xs w-4">{k}</span>
        </div>

        <div className="flex gap-1 flex-wrap">
          {DATASET_KEYS.map((id) => (
            <button
              key={id}
              onClick={() => handleDataset(id)}
              className="px-2 py-0.5 text-xs border border-primary/20 text-primary/40 hover:border-primary/50 hover:text-primary/70 transition-colors"
            >
              {DATASETS[id]}
            </button>
          ))}
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => {
              if (!runningRef.current) setConverged(false);
              runningRef.current = !running;
              setRunning(!running);
            }}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            {running ? "⏸ pause" : "▶ run"}
          </button>
          <button
            onClick={doStep}
            disabled={running}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ⏭ step
          </button>
          <button
            onClick={() => { seed(); }}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ⚄ reseed
          </button>
          <button
            onClick={() => { pointsRef.current = []; reset(); }}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ✕ clear
          </button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Gaussian mixture model fit by expectation–maximization, drawing each component's covariance ellipse over the clustered points; click to add points."
          className="block w-full h-full cursor-crosshair"
          onClick={onClick}
        />
        <div className="absolute bottom-3 right-4 text-xs text-primary/30 pointer-events-none max-w-md text-right">
          ellipses are 1σ &amp; 2σ covariances · point colour = soft responsibility · click to add points · try “Stretched” — k-means can’t tilt
        </div>
      </div>
    </div>
  );
}
