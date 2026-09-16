import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  SCENARIOS,
  WORLD,
  Errors,
  Estimate,
  Frame,
  Scenario,
  Sensor,
  Target,
  newErrors,
  newEstimate,
  newTarget,
  rmse,
  stepFilter,
  uncertaintyEllipse,
} from "../features/kalman/filter";

const DT = 1 / 30; // seconds per filter cycle
// Q models acceleration as independent noise each step, so tracking a sustained
// turn wants a process noise several times the target's actual acceleration.
const DEFAULT_Q = 22;
const TRAIL = 260; // remembered truth/estimate points
const FIXES = 90; // remembered measurements
const ERR_HISTORY = 320; // samples in the bottom error strip
const CHART_H = 74;

interface Hud {
  steps: number;
  rmseMeasure: number;
  rmseEstimate: number;
  sigma: number;
  speed: number;
  dropped: number;
}

export default function Kalman() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scenarioRef = useRef<Scenario>(SCENARIOS[0]);
  const truthRef = useRef<Target>(newTarget(SCENARIOS[0]));
  const estimateRef = useRef<Estimate>(newEstimate(WORLD * 0.3, WORLD * 0.62, 25));
  const errorsRef = useRef<Errors>(newErrors());
  const sensorRef = useRef<Sensor>({ sigma: 4, dropout: 0 });
  const qRef = useRef(DEFAULT_Q);
  const runningRef = useRef(true);
  const rateRef = useRef(1);

  const truthTrail = useRef<[number, number][]>([]);
  const estTrail = useRef<[number, number][]>([]);
  const fixes = useRef<([number, number] | null)[]>([]);
  const errHistory = useRef<[number, number | null][]>([]);

  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id);
  const [running, setRunning] = useState(true);
  const [sigma, setSigma] = useState(4);
  const [q, setQ] = useState(DEFAULT_Q);
  const [dropout, setDropout] = useState(0);
  const [rate, setRate] = useState(1);
  const [hud, setHud] = useState<Hud>({
    steps: 0,
    rmseMeasure: 0,
    rmseEstimate: 0,
    sigma: 25,
    speed: 0,
    dropped: 0,
  });

  const reset = useCallback((scenario: Scenario) => {
    scenarioRef.current = scenario;
    const truth = newTarget(scenario);
    truthRef.current = truth;
    // Start the filter off-target and uncertain: convergence from a bad guess is
    // half the point of watching one run.
    estimateRef.current = newEstimate(truth.x + 14, truth.y - 10, 25);
    errorsRef.current = newErrors();
    truthTrail.current = [];
    estTrail.current = [];
    fixes.current = [];
    errHistory.current = [];
    setHud({ steps: 0, rmseMeasure: 0, rmseEstimate: 0, sigma: 25, speed: 0, dropped: 0 });
  }, []);

  const advance = useCallback(() => {
    const frame: Frame = stepFilter(
      truthRef.current,
      estimateRef.current,
      scenarioRef.current,
      sensorRef.current,
      qRef.current,
      DT,
      errorsRef.current
    );
    truthRef.current = frame.truth;
    estimateRef.current = frame.estimate;

    truthTrail.current.push([frame.truth.x, frame.truth.y]);
    if (truthTrail.current.length > TRAIL) truthTrail.current.shift();
    estTrail.current.push([frame.estimate.x[0], frame.estimate.x[1]]);
    if (estTrail.current.length > TRAIL) estTrail.current.shift();
    fixes.current.push(frame.measurement);
    if (fixes.current.length > FIXES) fixes.current.shift();
    errHistory.current.push([frame.estimateError, frame.measureError]);
    if (errHistory.current.length > ERR_HISTORY) errHistory.current.shift();
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: W, height: H } = canvas;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    const chartH = H > 300 ? CHART_H : 0;
    const pad = 18;
    const areaH = H - chartH - pad * 2;
    const size = Math.max(60, Math.min(W - pad * 2, areaH));
    const ox = (W - size) / 2;
    const oy = pad + (areaH - size) / 2;
    const sx = (x: number) => ox + (x / WORLD) * size;
    const sy = (y: number) => oy + (y / WORLD) * size;
    const scale = size / WORLD;

    // world frame + grid
    ctx.strokeStyle = "rgba(0,255,65,0.07)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 10; i++) {
      const p = (i / 10) * size;
      ctx.beginPath();
      ctx.moveTo(ox + p, oy);
      ctx.lineTo(ox + p, oy + size);
      ctx.moveTo(ox, oy + p);
      ctx.lineTo(ox + size, oy + p);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(0,255,65,0.18)";
    ctx.strokeRect(ox + 0.5, oy + 0.5, size - 1, size - 1);

    // raw sensor fixes — the only thing the filter is ever shown
    ctx.fillStyle = "rgba(255,190,60,0.5)";
    fixes.current.forEach((fix, i) => {
      if (!fix) return;
      const a = (i + 1) / fixes.current.length;
      ctx.globalAlpha = 0.12 + 0.55 * a;
      ctx.beginPath();
      ctx.arc(sx(fix[0]), sy(fix[1]), 1.9, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // ground truth
    const truthPath = truthTrail.current;
    if (truthPath.length > 1) {
      ctx.strokeStyle = "rgba(0,255,65,0.32)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      truthPath.forEach(([x, y], i) => {
        if (i === 0) ctx.moveTo(sx(x), sy(y));
        else ctx.lineTo(sx(x), sy(y));
      });
      ctx.stroke();
    }

    // filter estimate
    const estPath = estTrail.current;
    if (estPath.length > 1) {
      ctx.strokeStyle = "rgba(0,207,255,0.85)";
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.beginPath();
      estPath.forEach(([x, y], i) => {
        if (i === 0) ctx.moveTo(sx(x), sy(y));
        else ctx.lineTo(sx(x), sy(y));
      });
      ctx.stroke();
    }

    const est = estimateRef.current;
    const ex = sx(est.x[0]);
    const ey = sy(est.x[1]);

    // 2σ positional uncertainty ellipse
    const { major, minor, angle } = uncertaintyEllipse(est.P);
    ctx.save();
    ctx.translate(ex, ey);
    ctx.rotate(angle);
    ctx.strokeStyle = "rgba(0,207,255,0.45)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, Math.max(1, major * 2 * scale), Math.max(1, minor * 2 * scale), 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(0,207,255,0.07)";
    ctx.fill();
    ctx.restore();

    // estimated velocity — never measured, only inferred
    const vlen = Math.hypot(est.x[2], est.x[3]);
    if (vlen > 0.5) {
      const k = 0.55 * scale;
      ctx.strokeStyle = "rgba(0,207,255,0.6)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex + est.x[2] * k, ey + est.x[3] * k);
      ctx.stroke();
    }

    // truth marker + estimate marker + the error between them
    const truth = truthRef.current;
    const tx = sx(truth.x);
    const ty = sy(truth.y);
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#00ff41";
    ctx.beginPath();
    ctx.arc(tx, ty, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#00cfff";
    ctx.beginPath();
    ctx.arc(ex, ey, 3.2, 0, Math.PI * 2);
    ctx.fill();

    // error strip: measurement error (orange) against filter error (cyan)
    if (chartH > 0) {
      const hist = errHistory.current;
      const top = H - chartH + 6;
      const bh = chartH - 14;
      const left = pad;
      const cw = W - pad * 2;
      ctx.strokeStyle = "rgba(0,255,65,0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(left, top);
      ctx.lineTo(left, top + bh);
      ctx.lineTo(left + cw, top + bh);
      ctx.stroke();
      ctx.fillStyle = "rgba(0,255,65,0.4)";
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("distance from truth — sensor vs filter", left + 4, top + 2);

      if (hist.length > 1) {
        let hi = 1e-6;
        for (const [e, m] of hist) {
          if (e > hi) hi = e;
          if (m != null && m > hi) hi = m;
        }
        const px = (i: number) => left + (i / (hist.length - 1)) * cw;
        const py = (v: number) => top + bh - (v / hi) * bh;

        ctx.fillStyle = "rgba(255,190,60,0.55)";
        hist.forEach(([, m], i) => {
          if (m == null) return;
          ctx.fillRect(px(i) - 0.6, py(m) - 0.6, 1.6, 1.6);
        });

        ctx.strokeStyle = "#00cfff";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        hist.forEach(([e], i) => {
          if (i === 0) ctx.moveTo(px(i), py(e));
          else ctx.lineTo(px(i), py(e));
        });
        ctx.stroke();
      }
      ctx.textBaseline = "middle";
    }
  }, []);

  const refreshHud = useCallback(() => {
    const e = errorsRef.current;
    const est = estimateRef.current;
    setHud({
      steps: e.n,
      rmseMeasure: rmse(e.sumSqMeasure, e.nMeasure),
      rmseEstimate: rmse(e.sumSqEstimate, e.n),
      sigma: Math.sqrt(Math.max(est.P[0][0], est.P[1][1])),
      speed: Math.hypot(est.x[2], est.x[3]),
      dropped: e.dropped,
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
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let frame = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (runningRef.current) for (let i = 0; i < rateRef.current; i++) advance();
      draw();
      if (++frame % 6 === 0) refreshHud();
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [advance, draw, refreshHud]);

  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0];
  const gain = hud.rmseEstimate > 0 ? hud.rmseMeasure / hud.rmseEstimate : 0;

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">kalman filter</span>
        </div>
        <div className="text-xs text-primary/50 tabular-nums flex gap-3 flex-wrap">
          <span>t {(hud.steps * DT).toFixed(1)}s</span>
          <span className="text-[#ffbe3c]">sensor rmse {hud.rmseMeasure.toFixed(2)}</span>
          <span className="text-[#00cfff]">filter rmse {hud.rmseEstimate.toFixed(2)}</span>
          <span className={gain > 1 ? "text-primary" : "text-primary/40"}>
            {gain > 0 ? `${gain.toFixed(1)}× sharper` : "—"}
          </span>
          <span>±{hud.sigma.toFixed(1)} 1σ</span>
          {hud.dropped > 0 && <span className="text-primary/40">{hud.dropped} dropped</span>}
        </div>
      </div>

      {/* Scenarios */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-2">
        <span className="text-primary/30 text-xs mr-1">target</span>
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setScenarioId(s.id);
              reset(s);
            }}
            title={s.note}
            className={`px-2.5 py-1 text-xs border transition-colors ${
              s.id === scenarioId
                ? "border-primary bg-primary/15 text-primary"
                : "border-primary/25 text-primary/60 hover:border-primary hover:text-primary"
            }`}
          >
            {s.label}
          </button>
        ))}
        <span className="text-primary/30 text-xs hidden md:inline ml-1">{scenario.note}</span>
      </div>

      {/* Controls */}
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
            advance();
            draw();
            refreshHud();
          }}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ⇥ step
        </button>
        <button
          onClick={() => reset(scenario)}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ↺ restart
        </button>

        <Slider
          label="σ"
          title="sensor noise — the spread of each position fix"
          min={0.5}
          max={14}
          step={0.5}
          value={sigma}
          fmt={(v) => v.toFixed(1)}
          onChange={(v) => {
            setSigma(v);
            sensorRef.current = { ...sensorRef.current, sigma: v };
          }}
        />
        <Slider
          label="q"
          title="process noise — how much acceleration the filter expects"
          min={0.5}
          max={50}
          step={0.5}
          value={q}
          fmt={(v) => v.toFixed(1)}
          onChange={(v) => {
            setQ(v);
            qRef.current = v;
          }}
        />
        <Slider
          label="dropout"
          title="probability a frame delivers no fix at all"
          min={0}
          max={0.9}
          step={0.05}
          value={dropout}
          fmt={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => {
            setDropout(v);
            sensorRef.current = { ...sensorRef.current, dropout: v };
          }}
        />
        <Slider
          label="rate"
          title="filter cycles per animation frame"
          min={1}
          max={4}
          step={1}
          value={rate}
          fmt={(v) => `${v}×`}
          onChange={(v) => {
            setRate(v);
            rateRef.current = v;
          }}
        />
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute bottom-2 left-4 right-4 text-xs text-primary/40 pointer-events-none">
          green = truth (never observed) · orange = noisy fixes · cyan = estimate, its 2σ ellipse and
          its inferred velocity · low q lags hard turns, high q chases noise
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
      <span className="text-primary/60 text-xs w-10 tabular-nums">{fmt(value)}</span>
    </div>
  );
}
