import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  PiEstimate,
  ErrorPoint,
  estimate,
  sampleBatch,
  applyBatch,
  shouldRecord,
  absError,
} from "../features/montecarlo/pi";

const RATES = [
  { label: "slow", perFrame: 20 },
  { label: "fast", perFrame: 400 },
  { label: "turbo", perFrame: 8000 },
];

// Quarter-circle outline + border
function drawBoard(ctx: CanvasRenderingContext2D, size: number) {
  ctx.strokeStyle = "rgba(0,255,65,0.4)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(0.5, 0.5, size - 1, size - 1);
  ctx.beginPath();
  ctx.arc(0, size, size, -Math.PI / 2, 0);
  ctx.stroke();
}

export default function Pi() {
  const dartsRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<PiEstimate>({ total: 0, inside: 0 });
  const errorsRef = useRef<ErrorPoint[]>([]);
  const lastRecordedRef = useRef(0);
  const runningRef = useRef(true);
  const rateRef = useRef(1); // index into RATES

  const [running, setRunning] = useState(true);
  const [rateIdx, setRateIdx] = useState(1);
  const [total, setTotal] = useState(0);
  const [piEst, setPiEst] = useState(0);

  const drawChart = useCallback(() => {
    const canvas = chartRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: W, height: H } = canvas;
    const errors = errorsRef.current;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
    if (errors.length < 2) return;

    // log-log axes: x = log10(total), y = log10(absError)
    const xs = errors.map((e) => Math.log10(e.total));
    const ys = errors.map((e) => Math.log10(Math.max(e.absError, 1e-7)));
    const minX = xs[0];
    const maxX = Math.max(xs[xs.length - 1], minX + 1);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys, minY + 0.5);
    const px = (lx: number) => ((lx - minX) / (maxX - minX)) * (W - 16) + 8;
    const py = (ly: number) => H - 10 - ((ly - minY) / (maxY - minY)) * (H - 20);

    // Reference slope -1/2 line (theoretical Monte Carlo convergence)
    ctx.strokeStyle = "rgba(255,224,102,0.35)";
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    const refY0 = ys[0];
    ctx.moveTo(px(xs[0]), py(refY0));
    ctx.lineTo(px(maxX), py(refY0 - 0.5 * (maxX - xs[0])));
    ctx.stroke();
    ctx.setLineDash([]);

    // Actual error trace
    ctx.strokeStyle = "#00ff41";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    errors.forEach((e, i) => {
      const x = px(Math.log10(e.total));
      const y = py(Math.log10(Math.max(e.absError, 1e-7)));
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, []);

  const resetAll = useCallback(() => {
    stateRef.current = { total: 0, inside: 0 };
    errorsRef.current = [];
    lastRecordedRef.current = 0;
    setTotal(0);
    setPiEst(0);
    const canvas = dartsRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawBoard(ctx, canvas.width);
    }
    drawChart();
  }, [drawChart]);

  // Main loop
  useEffect(() => {
    const canvas = dartsRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Square board sized to the container
    const parent = canvas.parentElement!;
    const size = Math.min(parent.clientWidth, parent.clientHeight) - 8;
    canvas.width = size;
    canvas.height = size;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, size, size);
    drawBoard(ctx, size);

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!runningRef.current) return;

      const batch = sampleBatch(RATES[rateRef.current].perFrame);
      stateRef.current = applyBatch(stateRef.current, batch);

      // Plot darts: y axis flipped so the quarter circle hugs bottom-left
      for (const s of batch) {
        ctx.fillStyle = s.inside ? "rgba(0,255,65,0.55)" : "rgba(255,77,166,0.55)";
        ctx.fillRect(s.x * size, size - s.y * size, 1.6, 1.6);
      }

      const st = stateRef.current;
      if (shouldRecord(st.total, lastRecordedRef.current)) {
        lastRecordedRef.current = st.total;
        errorsRef.current.push({ total: st.total, absError: absError(st) });
        drawChart();
      }

      setTotal(st.total);
      setPiEst(estimate(st));
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [drawChart]);

  const err = piEst === 0 ? null : Math.abs(piEst - Math.PI);

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">monte carlo π</span>
        </div>
        <div className="text-xs text-primary/40">
          π ≈ 4 × (darts inside quarter circle / total darts)
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {RATES.map((r, i) => (
            <button
              key={r.label}
              onClick={() => { rateRef.current = i; setRateIdx(i); }}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                rateIdx === i
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/20 text-primary/40 hover:border-primary/50 hover:text-primary/70"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => { runningRef.current = !running; setRunning(!running); }}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            {running ? "⏸ pause" : "▶ resume"}
          </button>
          <button
            onClick={resetAll}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ↺ reset
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col lg:flex-row gap-px bg-primary/10" style={{ minHeight: 0 }}>
        {/* Dart board */}
        <div className="flex-1 bg-background flex items-center justify-center p-2 min-h-72">
          <canvas ref={dartsRef} className="block max-w-full max-h-full" />
        </div>

        {/* Stats + convergence */}
        <div className="lg:w-80 bg-background p-4 flex flex-col gap-4">
          <div>
            <div className="text-xs text-primary/40 mb-1">estimate</div>
            <div className="text-3xl text-primary tabular-nums">
              {piEst === 0 ? "—" : piEst.toFixed(6)}
            </div>
            <div className="text-xs text-primary/30 mt-1">π = 3.141593…</div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-primary/40">darts</div>
              <div className="tabular-nums">{total.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-primary/40">abs error</div>
              <div className="tabular-nums">{err === null ? "—" : err.toFixed(6)}</div>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-32">
            <div className="text-xs text-primary/40 mb-1">
              error vs samples (log-log) · <span className="text-yellow-300/70">--- slope −½</span>
            </div>
            <canvas ref={chartRef} width={288} height={140} className="border border-primary/10 w-full" />
            <div className="text-xs text-primary/30 mt-2 leading-relaxed">
              Monte Carlo error shrinks like 1/√n — every extra digit of π costs
              100× more darts. The green trace should roughly track the dashed
              reference slope.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
