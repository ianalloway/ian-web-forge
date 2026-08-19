import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  PRESETS,
  DEFAULT_PARAMS,
  Params,
  Learner,
  buildGrid,
  newLearner,
  step,
  greedyAction,
  stateValue,
  greedyPath,
  successRate,
  WALL,
  GOAL,
  PIT,
} from "../features/qlearning/qlearning";

const CHART_H = 66; // learning-curve strip at the bottom
const TRAIL = 12; // remembered agent positions
const SUCCESS_WINDOW = 50;

// screen-space direction of each action (UP/RIGHT/DOWN/LEFT)
const DIR: [number, number][] = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

export default function QLearning() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const learnerRef = useRef<Learner>(newLearner(buildGrid(PRESETS[0])));
  const paramsRef = useRef<Params>({ ...DEFAULT_PARAMS });
  const speedRef = useRef(60); // env steps per animation frame
  const maxStepsRef = useRef(300);
  const runningRef = useRef(true);
  const trailRef = useRef<number[]>([]);
  const smoothRef = useRef<number[]>([]); // EMA of episode return
  const emaRef = useRef<number | null>(null);

  const [presetId, setPresetId] = useState(PRESETS[0].id);
  const [running, setRunning] = useState(true);
  const [alpha, setAlpha] = useState(DEFAULT_PARAMS.alpha);
  const [gamma, setGamma] = useState(DEFAULT_PARAMS.gamma);
  const [epsilon, setEpsilon] = useState(DEFAULT_PARAMS.epsilon);
  const [slip, setSlip] = useState(DEFAULT_PARAMS.slip);
  const [speed, setSpeed] = useState(60);
  const [hud, setHud] = useState({ episode: 0, success: 0, avgSteps: 0, solved: false });

  const recordEpisode = useCallback((ret: number) => {
    const ema = emaRef.current == null ? ret : emaRef.current * 0.95 + ret * 0.05;
    emaRef.current = ema;
    const s = smoothRef.current;
    s.push(ema);
    if (s.length > 2000) s.shift();
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: W, height: H } = canvas;
    const l = learnerRef.current;
    const g = l.grid;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    const chartH = H > 260 ? CHART_H : 0;
    const padX = 16;
    const padTop = 12;
    const areaH = H - chartH - padTop - 12;
    const cell = Math.max(
      8,
      Math.floor(Math.min((W - padX * 2) / g.cols, areaH / g.rows))
    );
    const gridW = cell * g.cols;
    const gridH = cell * g.rows;
    const ox = Math.floor((W - gridW) / 2);
    const oy = Math.floor(padTop + (areaH - gridH) / 2);
    const showNums = cell >= 40;

    // value range for the heatmap normalisation
    let vmax = 1e-6;
    let vmin = -1e-6;
    for (let i = 0; i < g.cells.length; i++) {
      if (g.cells[i] === WALL || g.cells[i] === GOAL || g.cells[i] === PIT) continue;
      const v = stateValue(l, i);
      if (v > vmax) vmax = v;
      if (v < vmin) vmin = v;
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let r = 0; r < g.rows; r++) {
      for (let c = 0; c < g.cols; c++) {
        const idx = r * g.cols + c;
        const x = ox + c * cell;
        const y = oy + r * cell;
        const type = g.cells[idx];

        if (type === WALL) {
          ctx.fillStyle = "#0c120c";
          ctx.fillRect(x, y, cell, cell);
          ctx.strokeStyle = "rgba(0,255,65,0.12)";
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1);
          continue;
        }

        if (type === GOAL) {
          ctx.fillStyle = "#00ff41";
          ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
          ctx.fillStyle = "#02150a";
          ctx.font = `bold ${Math.max(10, cell * 0.3)}px monospace`;
          ctx.fillText("+1", x + cell / 2, y + cell / 2 + 1);
          continue;
        }
        if (type === PIT) {
          ctx.fillStyle = "#ff3b3b";
          ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
          ctx.fillStyle = "#1a0303";
          ctx.font = `bold ${Math.max(10, cell * 0.3)}px monospace`;
          ctx.fillText("−1", x + cell / 2, y + cell / 2 + 1);
          continue;
        }

        // empty cell: value heatmap + policy arrow
        const v = stateValue(l, idx);
        if (v >= 0) {
          const t = v / vmax;
          ctx.fillStyle = `rgba(0,255,65,${0.05 + 0.55 * t})`;
        } else {
          const t = v / vmin;
          ctx.fillStyle = `rgba(255,70,70,${0.05 + 0.4 * t})`;
        }
        ctx.fillRect(x, y, cell, cell);
        ctx.strokeStyle = "rgba(0,255,65,0.06)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1);

        // policy arrow toward the greedy action
        const a = greedyAction(l, idx);
        const [dx, dy] = DIR[a];
        const [px, py] = [-dy, dx];
        const cx = x + cell / 2;
        const cy = y + cell / 2 + (showNums ? cell * 0.08 : 0);
        const s = cell * 0.2;
        ctx.fillStyle = "rgba(140,255,170,0.7)";
        ctx.beginPath();
        ctx.moveTo(cx + dx * s, cy + dy * s);
        ctx.lineTo(cx - dx * s * 0.45 + px * s * 0.62, cy - dy * s * 0.45 + py * s * 0.62);
        ctx.lineTo(cx - dx * s * 0.45 - px * s * 0.62, cy - dy * s * 0.45 - py * s * 0.62);
        ctx.closePath();
        ctx.fill();

        if (showNums) {
          ctx.fillStyle = "rgba(220,255,225,0.4)";
          ctx.font = "9px monospace";
          ctx.textAlign = "left";
          ctx.textBaseline = "top";
          ctx.fillText(v.toFixed(2), x + 3, y + 3);
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
        }

        if (idx === g.start) {
          ctx.strokeStyle = "rgba(0,255,65,0.5)";
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x + 2, y + 2, cell - 4, cell - 4);
        }
      }
    }

    // greedy route from the start (the current best policy, deterministic)
    const { path, solved } = greedyPath(l);
    if (path.length > 1) {
      ctx.strokeStyle = solved ? "rgba(0,207,255,0.6)" : "rgba(0,207,255,0.28)";
      ctx.lineWidth = Math.max(2, cell * 0.08);
      ctx.lineJoin = "round";
      ctx.beginPath();
      path.forEach((idx, i) => {
        const cx = ox + (idx % g.cols) * cell + cell / 2;
        const cy = oy + Math.floor(idx / g.cols) * cell + cell / 2;
        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      });
      ctx.stroke();
    }

    // agent trail + head
    const trail = trailRef.current;
    trail.forEach((idx, i) => {
      const cx = ox + (idx % g.cols) * cell + cell / 2;
      const cy = oy + Math.floor(idx / g.cols) * cell + cell / 2;
      const a = (i + 1) / trail.length;
      ctx.fillStyle = `rgba(255,255,255,${0.05 + 0.12 * a})`;
      ctx.beginPath();
      ctx.arc(cx, cy, cell * 0.14, 0, Math.PI * 2);
      ctx.fill();
    });
    const ax = ox + (l.agent % g.cols) * cell + cell / 2;
    const ay = oy + Math.floor(l.agent / g.cols) * cell + cell / 2;
    ctx.fillStyle = "rgba(0,255,65,0.35)";
    ctx.beginPath();
    ctx.arc(ax, ay, cell * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#eafff0";
    ctx.beginPath();
    ctx.arc(ax, ay, cell * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // learning-curve strip
    if (chartH > 0) {
      const s = smoothRef.current;
      const top = H - chartH + 6;
      const bh = chartH - 12;
      ctx.strokeStyle = "rgba(0,255,65,0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padX, top);
      ctx.lineTo(padX, top + bh);
      ctx.lineTo(W - padX, top + bh);
      ctx.stroke();
      ctx.fillStyle = "rgba(0,255,65,0.4)";
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("return / episode (smoothed)", padX + 4, top + 2);
      if (s.length > 1) {
        let lo = Infinity;
        let hi = -Infinity;
        for (const v of s) {
          if (v < lo) lo = v;
          if (v > hi) hi = v;
        }
        if (hi - lo < 1e-6) hi = lo + 1e-6;
        const cw = W - padX * 2;
        const px = (i: number) => padX + (i / (s.length - 1)) * cw;
        const py = (v: number) => top + bh - ((v - lo) / (hi - lo)) * bh;
        ctx.strokeStyle = "#00ff41";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        s.forEach((v, i) => {
          if (i === 0) ctx.moveTo(px(i), py(v));
          else ctx.lineTo(px(i), py(v));
        });
        ctx.stroke();
      }
      ctx.textBaseline = "middle";
    }
  }, []);

  const loadPreset = useCallback(
    (id: string) => {
      const preset = PRESETS.find((p) => p.id === id) ?? PRESETS[0];
      const grid = buildGrid(preset);
      learnerRef.current = newLearner(grid);
      maxStepsRef.current = Math.max(150, grid.rows * grid.cols * 3);
      trailRef.current = [grid.start];
      smoothRef.current = [];
      emaRef.current = null;
      setPresetId(id);
      setHud({ episode: 0, success: 0, avgSteps: 0, solved: false });
      draw();
    },
    [draw]
  );

  const resetLearner = useCallback(() => {
    const grid = learnerRef.current.grid;
    learnerRef.current = newLearner(grid);
    trailRef.current = [grid.start];
    smoothRef.current = [];
    emaRef.current = null;
    setHud({ episode: 0, success: 0, avgSteps: 0, solved: false });
    draw();
  }, [draw]);

  const runSteps = useCallback(
    (n: number) => {
      const l = learnerRef.current;
      const params = paramsRef.current;
      const maxSteps = maxStepsRef.current;
      for (let i = 0; i < n; i++) {
        const res = step(l, params, maxSteps);
        if (res.episodeEnded) {
          recordEpisode(l.returns[l.returns.length - 1]);
          trailRef.current = [l.grid.start];
        } else {
          const trail = trailRef.current;
          trail.push(res.to);
          if (trail.length > TRAIL) trail.shift();
        }
      }
    },
    [recordEpisode]
  );

  const refreshHud = useCallback(() => {
    const l = learnerRef.current;
    const recent = l.epSteps.slice(-SUCCESS_WINDOW);
    const avg = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
    setHud({
      episode: l.episode,
      success: successRate(l, SUCCESS_WINDOW),
      avgSteps: avg,
      solved: greedyPath(l).solved,
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
      if (runningRef.current) runSteps(speedRef.current);
      draw();
      if (++frame % 6 === 0) refreshHud();
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [draw, runSteps, refreshHud]);

  const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0];

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">q-learning gridworld</span>
        </div>
        <div className="text-xs text-primary/50 tabular-nums flex gap-3 flex-wrap">
          <span>ep {hud.episode.toLocaleString()}</span>
          <span>success {Math.round(hud.success * 100)}%</span>
          {hud.avgSteps > 0 && <span>~{hud.avgSteps.toFixed(0)} steps</span>}
          <span className={hud.solved ? "text-primary" : "text-primary/40"}>
            {hud.solved ? "◆ policy solved" : "◇ exploring"}
          </span>
        </div>
      </div>

      {/* Environment presets */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-2">
        <span className="text-primary/30 text-xs mr-1">environment</span>
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => loadPreset(p.id)}
            title={p.note}
            className={`px-2.5 py-1 text-xs border transition-colors ${
              p.id === presetId
                ? "border-primary bg-primary/15 text-primary"
                : "border-primary/25 text-primary/60 hover:border-primary hover:text-primary"
            }`}
          >
            {p.label}
          </button>
        ))}
        <span className="text-primary/30 text-xs hidden md:inline ml-1">{preset.note}</span>
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
            runSteps(1);
            draw();
            refreshHud();
          }}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ⇥ step
        </button>
        <button
          onClick={resetLearner}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ↺ reset Q
        </button>

        <Slider
          label="α"
          title="learning rate"
          min={0.02}
          max={1}
          step={0.02}
          value={alpha}
          fmt={(v) => v.toFixed(2)}
          onChange={(v) => {
            setAlpha(v);
            paramsRef.current = { ...paramsRef.current, alpha: v };
          }}
        />
        <Slider
          label="γ"
          title="discount factor"
          min={0.5}
          max={0.99}
          step={0.01}
          value={gamma}
          fmt={(v) => v.toFixed(2)}
          onChange={(v) => {
            setGamma(v);
            paramsRef.current = { ...paramsRef.current, gamma: v };
          }}
        />
        <Slider
          label="ε"
          title="exploration rate"
          min={0}
          max={1}
          step={0.01}
          value={epsilon}
          fmt={(v) => v.toFixed(2)}
          onChange={(v) => {
            setEpsilon(v);
            paramsRef.current = { ...paramsRef.current, epsilon: v };
          }}
        />
        <Slider
          label="slip"
          title="environment stochasticity"
          min={0}
          max={0.5}
          step={0.05}
          value={slip}
          fmt={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => {
            setSlip(v);
            paramsRef.current = { ...paramsRef.current, slip: v };
          }}
        />
        <Slider
          label="speed"
          title="env steps per frame"
          min={1}
          max={300}
          step={1}
          value={speed}
          fmt={(v) => `${v}×`}
          onChange={(v) => {
            setSpeed(v);
            speedRef.current = v;
          }}
        />
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute bottom-2 left-4 right-4 text-xs text-primary/40 pointer-events-none">
          green = high value, red = danger · arrows = learned policy · cyan = greedy route from start ·
          it learns only from reward, no map given
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
      <span className="text-primary/60 text-xs w-8 tabular-nums">{fmt(value)}</span>
    </div>
  );
}
