import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  PRESETS,
  Sim,
  advance,
  inSystem,
  measured,
  newSim,
  queueLength,
  theory,
  waitingFromBack,
} from "../features/queue/mmc";

const DT = 0.02; // simulated time per animation frame, before the speed multiplier
const MAX_DRAWN = 26; // waiting customers drawn before the queue is summarised

export default function Queue() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<Sim>(newSim(PRESETS[1].lambda, PRESETS[1].mu, PRESETS[1].servers));
  const runningRef = useRef(true);
  const speedRef = useRef(40);

  const [presetId, setPresetId] = useState(PRESETS[1].id);
  const [lambda, setLambda] = useState(PRESETS[1].lambda);
  const [mu, setMu] = useState(PRESETS[1].mu);
  const [servers, setServers] = useState(PRESETS[1].servers);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(40);
  const [hud, setHud] = useState({ t: 0, inSystem: 0, L: 0, W: 0, util: 0, served: 0 });

  const rebuild = useCallback((l: number, m: number, c: number) => {
    simRef.current = newSim(l, m, c);
    setHud({ t: 0, inSystem: 0, L: 0, W: 0, util: 0, served: 0 });
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: W, height: H } = canvas;
    const sim = simRef.current;
    const th = theory(sim.lambda, sim.mu, sim.servers);
    const m = measured(sim);

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    const pad = 20;
    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    // ── the line and the servers ───────────────────────────────────────────
    const laneY = pad + 30;
    const boxW = 16;
    const boxH = 22;
    const serverX = W - pad - 90;

    ctx.fillStyle = "rgba(0,255,65,0.35)";
    ctx.fillText("arrivals →", pad, laneY - 16);
    ctx.fillText("servers", serverX, laneY - 16);

    // Waiting customers, newest at the back of the line (left).
    const waiting = queueLength(sim);
    const drawn = Math.min(waiting, MAX_DRAWN);
    for (let i = 0; i < drawn; i++) {
      const x = serverX - 26 - (i + 1) * (boxW + 3);
      if (x < pad) break;
      const customer = waitingFromBack(sim, i);
      if (!customer) break;
      const age = sim.t - customer.arrived;
      // Colour by how long they have been waiting: green fresh, amber stale.
      const t = Math.min(1, age / 12);
      ctx.fillStyle = `rgb(${Math.round(40 + 215 * t)},${Math.round(255 - 65 * t)},${Math.round(65 - 5 * t)})`;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(x, laneY, boxW, boxH);
      ctx.globalAlpha = 1;
    }
    if (waiting > drawn) {
      ctx.fillStyle = "rgba(255,190,60,0.9)";
      ctx.fillText(`+${waiting - drawn} more`, pad, laneY + boxH + 6);
    }

    for (let s = 0; s < sim.servers; s++) {
      const y = laneY + s * (boxH + 6);
      const busy = sim.inService[s] !== null;
      ctx.strokeStyle = busy ? "rgba(0,255,65,0.8)" : "rgba(0,255,65,0.25)";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(serverX + 0.5, y + 0.5, 46, boxH);
      if (busy) {
        ctx.fillStyle = "rgba(0,255,65,0.55)";
        ctx.fillRect(serverX + 3, y + 3, 40, boxH - 6);
        ctx.fillStyle = "#04140a";
        ctx.fillText("busy", serverX + 13, y + 7);
      } else {
        ctx.fillStyle = "rgba(0,255,65,0.3)";
        ctx.fillText("idle", serverX + 14, y + 7);
      }
    }

    // ── number in the system over time ─────────────────────────────────────
    const chartTop = laneY + Math.max(sim.servers * (boxH + 6), boxH + 24) + 26;
    const chartH = Math.max(60, H - chartTop - pad - 92);
    const chartW = W - pad * 2;
    ctx.strokeStyle = "rgba(0,255,65,0.18)";
    ctx.lineWidth = 1;
    ctx.strokeRect(pad + 0.5, chartTop + 0.5, chartW - 1, chartH - 1);
    ctx.fillStyle = "rgba(0,255,65,0.35)";
    ctx.fillText("customers in the system", pad + 4, chartTop + 4);

    const history = sim.history;
    if (history.length > 1) {
      let peak = 4;
      for (const v of history) if (v > peak) peak = v;
      // The theoretical mean is the line the simulation should hover around.
      if (th) {
        const ly = Math.max(chartTop + 6, chartTop + chartH - (th.L / peak) * chartH);
        if (ly < chartTop + chartH) {
          ctx.strokeStyle = "rgba(255,190,60,0.55)";
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(pad, ly);
          ctx.lineTo(pad + chartW, ly);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = "rgba(255,190,60,0.75)";
          ctx.fillText(`theory L = ${th.L.toFixed(1)}`, pad + chartW - 92, ly - 12);
        }
      }
      ctx.strokeStyle = "#00cfff";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      history.forEach((v, i) => {
        const x = pad + (i / (history.length - 1)) * chartW;
        const y = chartTop + chartH - (v / peak) * chartH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.fillStyle = "rgba(0,255,65,0.3)";
      ctx.fillText(`peak ${peak}`, pad + 4, chartTop + chartH - 14);
    }

    // ── measured against theory ────────────────────────────────────────────
    const tableTop = chartTop + chartH + 14;
    const rows: [string, string, string][] = [
      ["utilisation", fmt(m.utilisation), th ? fmt(th.rho) : "1.00+"],
      ["in system L", fmt(m.L), th ? fmt(th.L) : "∞"],
      ["time in system W", fmt(m.W), th ? fmt(th.W) : "∞"],
      ["queueing Wq", fmt(m.Wq), th ? fmt(th.Wq) : "∞"],
    ];
    ctx.fillStyle = "rgba(0,255,65,0.45)";
    ctx.fillText("measured", pad + 150, tableTop);
    ctx.fillText("theory", pad + 215, tableTop);
    ctx.fillStyle = "rgba(0,255,65,0.3)";
    const nearSaturation = th !== null && th.rho > 0.95;
    ctx.fillText(
      `averaged over t = ${sim.t.toFixed(0)}${nearSaturation ? " · this close to saturation a single run stays noisy however long it runs" : ""}`,
      pad + 270,
      tableTop
    );
    if (!th) {
      ctx.fillStyle = "rgba(255,80,80,0.9)";
      ctx.fillText("ρ ≥ 1 — no steady state exists, the queue grows without bound", pad + 270, tableTop);
    }
    // At high load the averages converge slowly and a short run is genuinely
    // noisy, so say so rather than letting the gap read as a wrong answer.
    if (th && sim.t < 20000) {
      ctx.fillStyle = "rgba(255,190,60,0.7)";
      ctx.fillText("still settling — press settle for a longer average", pad + 270, tableTop + 14);
    }
    rows.forEach(([name, meas, theo], i) => {
      const y = tableTop + 15 + i * 14;
      ctx.fillStyle = "rgba(0,255,65,0.4)";
      ctx.fillText(name, pad, y);
      ctx.fillStyle = "#00cfff";
      ctx.fillText(meas, pad + 150, y);
      ctx.fillStyle = th ? "rgba(255,190,60,0.85)" : "rgba(255,80,80,0.7)";
      ctx.fillText(theo, pad + 215, y);
    });
    ctx.textBaseline = "middle";
  }, []);

  const refreshHud = useCallback(() => {
    const sim = simRef.current;
    const m = measured(sim);
    setHud({
      t: sim.t,
      inSystem: inSystem(sim),
      L: m.L,
      W: m.W,
      util: m.utilisation,
      served: sim.stats.served,
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
      if (runningRef.current) advance(simRef.current, DT * speedRef.current);
      draw();
      if (++frame % 10 === 0) refreshHud();
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [draw, refreshHud]);

  const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[1];
  const rho = lambda / (servers * mu);

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">queueing theory</span>
        </div>
        <div className="text-xs text-primary/50 tabular-nums flex gap-3 flex-wrap">
          <span>t {hud.t.toFixed(0)}</span>
          <span className={rho >= 1 ? "text-red-400" : rho > 0.92 ? "text-[#ffbe3c]" : "text-primary"}>
            ρ {rho.toFixed(2)}
          </span>
          <span>{hud.inSystem} in system</span>
          <span className="text-[#00cfff]">mean wait {hud.W.toFixed(1)}</span>
          <span>{hud.served.toLocaleString()} served</span>
        </div>
      </div>

      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-2">
        <span className="text-primary/30 text-xs mr-1">scenario</span>
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setPresetId(p.id);
              setLambda(p.lambda);
              setMu(p.mu);
              setServers(p.servers);
              rebuild(p.lambda, p.mu, p.servers);
            }}
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
        <span className="text-primary/30 text-xs hidden lg:inline ml-1">{preset.note}</span>
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
            // The averages converge slowly — the relaxation time grows like
            // 1/(1-ρ)² — so this runs a long stretch at once rather than making
            // you watch the measured column crawl toward theory.
            advance(simRef.current, 50000);
            refreshHud();
            draw();
          }}
          title="run 50000 units of simulated time at once, so the averages settle"
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ⏩ settle
        </button>
        <button
          onClick={() => rebuild(lambda, mu, servers)}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ↺ restart
        </button>

        <Slider
          label="λ"
          title="arrival rate — customers per unit time"
          min={0.1}
          max={4}
          step={0.01}
          value={lambda}
          fmt={(v) => v.toFixed(2)}
          onChange={(v) => {
            setLambda(v);
            rebuild(v, mu, servers);
          }}
        />
        <Slider
          label="μ"
          title="service rate — customers each server can finish per unit time"
          min={0.2}
          max={4}
          step={0.01}
          value={mu}
          fmt={(v) => v.toFixed(2)}
          onChange={(v) => {
            setMu(v);
            rebuild(lambda, v, servers);
          }}
        />
        <Slider
          label="c"
          title="servers sharing the one line"
          min={1}
          max={5}
          step={1}
          value={servers}
          fmt={(v) => `${v}`}
          onChange={(v) => {
            setServers(v);
            rebuild(lambda, mu, v);
          }}
        />
        <Slider
          label="speed"
          title="simulated time per frame"
          min={1}
          max={80}
          step={1}
          value={speed}
          fmt={(v) => `${v}×`}
          onChange={(v) => {
            setSpeed(v);
            speedRef.current = v;
          }}
        />
      </div>

      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute bottom-1 left-4 right-4 text-xs text-primary/40 pointer-events-none">
          waiting customers redden as they age · the wait grows like 1/(1−ρ), so 90% → 95% busy
          doubles it and 95% → 98% doubles it again · three servers sharing one line beat one server
          working three times as fast
        </div>
      </div>
    </div>
  );
}

function fmt(v: number): string {
  if (!Number.isFinite(v)) return "∞";
  return v >= 100 ? v.toFixed(0) : v.toFixed(2);
}

function Slider({
  label,
  title,
  min,
  max,
  step,
  value,
  fmt: format,
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
      <span className="text-primary/60 text-xs w-9 tabular-nums">{format(value)}</span>
    </div>
  );
}
