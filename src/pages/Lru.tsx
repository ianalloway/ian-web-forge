import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  POLICIES,
  WORKLOADS,
  beladyAnomaly,
  makeRng,
  run,
  sweepCapacity,
  type PolicyId,
} from "../features/lru/cache";

const COLORS: Record<PolicyId, string> = {
  fifo: "rgba(255,255,255,0.55)",
  lru: "#00ff41",
  lfu: "#c98cff",
  clock: "#5cf0e0",
  opt: "#ffbe3c",
};

export default function Lru() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [workloadId, setWorkloadId] = useState(WORKLOADS[0].id);
  const [capacity, setCapacity] = useState(4);
  const [universe, setUniverse] = useState(12);
  const [seed, setSeed] = useState(5);
  const [cursor, setCursor] = useState(0);
  const [running, setRunning] = useState(true);
  const runningRef = useRef(true);
  const cursorRef = useRef(0);
  const paceRef = useRef(6);
  const [pace, setPace] = useState(6);

  const workload = WORKLOADS.find((w) => w.id === workloadId) ?? WORKLOADS[0];
  const isFixed = workload.id === "anomaly";

  const sim = useMemo(() => {
    const refs = workload.build(isFixed ? 12 : 240, universe, makeRng(seed));
    const runs = POLICIES.map((p) => ({ ...p, result: run(p.id, refs, capacity) }));
    const optHits = runs.find((r) => r.id === "opt")!.result.hits;
    return {
      refs,
      runs,
      optHits,
      // The anomaly witness is computed, not assumed: if this policy regresses
      // anywhere in the capacity range, the page says where.
      anomalies: POLICIES.map((p) => ({
        id: p.id,
        witness: beladyAnomaly(p.id, refs, Math.min(10, Math.max(6, capacity + 3))),
      })),
      sweeps: POLICIES.map((p) => ({
        id: p.id,
        sweep: sweepCapacity(p.id, refs, Math.min(10, Math.max(6, capacity + 3))),
      })),
    };
  }, [workload, capacity, universe, seed, isFixed]);

  const reset = useCallback(() => {
    cursorRef.current = 0;
    setCursor(0);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: W, height: H } = canvas;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    const pad = 24;
    const labelW = 70;
    const at = Math.min(cursorRef.current, sim.refs.length);
    ctx.font = "10px monospace";
    ctx.textBaseline = "middle";

    // --- the reference string, with the current position marked -------------
    const stripW = W - pad * 2 - labelW;
    const cell = stripW / Math.max(1, sim.refs.length);
    const stripY = pad + 4;
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(0,255,65,0.5)";
    ctx.fillText("accesses", pad + labelW - 10, stripY + 9);
    ctx.textAlign = "center";
    for (let i = 0; i < sim.refs.length; i++) {
      const x = pad + labelW + i * cell;
      const done = i < at;
      ctx.fillStyle = done ? "rgba(0,255,65,0.22)" : "rgba(0,255,65,0.07)";
      ctx.fillRect(x, stripY, Math.max(1, cell - 1), 18);
      if (cell > 11) {
        ctx.fillStyle = done ? "rgba(0,255,65,0.8)" : "rgba(0,255,65,0.25)";
        ctx.fillText(String(sim.refs[i]), x + cell / 2, stripY + 9);
      }
    }
    if (at > 0 && at <= sim.refs.length) {
      ctx.fillStyle = "#ffbe3c";
      ctx.fillRect(pad + labelW + (at - 1) * cell, stripY + 19, Math.max(2, cell - 1), 2);
    }

    // --- one lane per policy: cache contents now, then its hit/miss trail ---
    const laneTop = stripY + 34;
    const laneH = Math.min(68, Math.max(40, (H - laneTop - 150) / POLICIES.length));
    const slotW = Math.min(34, Math.max(16, (W * 0.3) / Math.max(1, capacity)));

    sim.runs.forEach((r, i) => {
      const y = laneTop + i * laneH;
      const step = at > 0 ? r.result.steps[at - 1] : null;
      const color = COLORS[r.id];

      ctx.textAlign = "left";
      ctx.fillStyle = color;
      ctx.fillText(r.label, pad, y + 10);
      if (r.clairvoyant) {
        ctx.fillStyle = "rgba(255,190,60,0.45)";
        ctx.fillText("needs future", pad, y + 23);
      }

      // Resident set as slots. A slot that just changed is outlined so the
      // eviction is visible at a glance rather than inferred.
      const slotsX = pad + labelW;
      for (let s = 0; s < capacity; s++) {
        const x = slotsX + s * (slotW + 3);
        const key = step?.contents[s];
        ctx.fillStyle = key === undefined ? "rgba(0,255,65,0.05)" : "rgba(0,255,65,0.12)";
        ctx.fillRect(x, y, slotW, 20);
        if (key !== undefined) {
          ctx.fillStyle = color;
          ctx.textAlign = "center";
          ctx.fillText(String(key), x + slotW / 2, y + 10);
          ctx.textAlign = "left";
        }
        if (step && key !== undefined && key === step.key && !step.hit) {
          ctx.strokeStyle = "rgba(255,190,60,0.9)";
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, slotW - 1, 19);
        }
      }

      // The hit/miss trail: a tick per access, so the shape of the run reads
      // as a texture — long miss streaks look like gaps.
      const trailX = slotsX + capacity * (slotW + 3) + 12;
      // The hit-rate readout is right-aligned at W - pad, so the trail has to
      // stop short of it or the two draw on top of each other.
      const readoutW = 78;
      const trailW = W - pad - readoutW - trailX;
      if (trailW > 40) {
        const tcell = trailW / Math.max(1, sim.refs.length);
        for (let t = 0; t < at; t++) {
          const st = r.result.steps[t];
          ctx.fillStyle = st.hit ? color : "rgba(255,60,60,0.5)";
          const h = st.hit ? 14 : 5;
          ctx.fillRect(trailX + t * tcell, y + 20 - h, Math.max(1, tcell - 0.5), h);
        }
      }

      if (step) {
        const hitsSoFar = r.result.steps.slice(0, at).filter((s) => s.hit).length;
        const rate = at === 0 ? 0 : hitsSoFar / at;
        ctx.textAlign = "right";
        ctx.fillStyle = color;
        ctx.fillText(`${(rate * 100).toFixed(1)}%`, W - pad, y + 10);
        if (r.id !== "opt" && sim.optHits > 0) {
          const optSoFar = sim.runs
            .find((x) => x.id === "opt")!
            .result.steps.slice(0, at)
            .filter((s) => s.hit).length;
          ctx.fillStyle = "rgba(0,255,65,0.35)";
          ctx.fillText(
            optSoFar > 0 ? `${((hitsSoFar / optSoFar) * 100).toFixed(0)}% of OPT` : "",
            W - pad,
            y + 23,
          );
        }
        ctx.textAlign = "left";
      }
    });

    // --- hits vs capacity: where the anomaly is visible --------------------
    const chartTop = laneTop + POLICIES.length * laneH + 18;
    // Bounded, and with room left under it for the axis labels plus the page
    // caption below the canvas — unbounded it swallowed the lower third and
    // printed its x-axis on top of the caption.
    const captionRoom = 54;
    const chartH = Math.max(50, Math.min(150, H - chartTop - captionRoom));
    if (chartH > 44 && chartTop + chartH + captionRoom <= H) {
      const sweeps = sim.sweeps;
      const maxCap = sweeps[0].sweep.length;
      const maxHits = Math.max(1, ...sweeps.flatMap((s) => s.sweep.map((x) => x.hits)));
      const chartW = Math.min(W - pad * 2, 420);
      const colW = chartW / maxCap;

      ctx.fillStyle = "rgba(0,255,65,0.4)";
      ctx.textAlign = "left";
      ctx.fillText("hits as the cache grows →", pad, chartTop - 6);

      for (const { id, sweep } of sweeps) {
        ctx.strokeStyle = COLORS[id];
        ctx.globalAlpha = 0.85;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        sweep.forEach((pt, i) => {
          const x = pad + i * colW + colW / 2;
          const y = chartTop + chartH - (pt.hits / maxHits) * chartH;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Mark every downward step — a bigger cache with fewer hits.
        for (let i = 1; i < sweep.length; i++) {
          if (sweep[i].hits < sweep[i - 1].hits) {
            const x = pad + i * colW + colW / 2;
            const y = chartTop + chartH - (sweep[i].hits / maxHits) * chartH;
            ctx.strokeStyle = "rgba(255,60,60,0.95)";
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }

      ctx.fillStyle = "rgba(0,255,65,0.3)";
      ctx.textAlign = "center";
      for (let i = 0; i < maxCap; i++) {
        ctx.fillText(String(i + 1), pad + i * colW + colW / 2, chartTop + chartH + 10);
      }

      // Spell the anomaly out in words when one is present, beside the chart
      // where there is always room rather than under its axis.
      const noteX = pad + chartW + 20;
      const noteFits = noteX < W - 220;
      const hit = sim.anomalies.filter((a) => a.witness);
      ctx.textAlign = "left";
      if (hit.length > 0) {
        const a = hit[0];
        ctx.fillStyle = "rgba(255,60,60,0.95)";
        const text = `Bélády's anomaly: ${a.id.toUpperCase()} gets ${a.witness!.larger} hits with ${a.witness!.at} slots but ${a.witness!.smaller} with ${a.witness!.at - 1}`;
        if (noteFits) {
          ctx.fillText(text, noteX, chartTop + 6);
          ctx.fillStyle = "rgba(0,255,65,0.35)";
          ctx.fillText("a bigger cache, fewer hits — LRU cannot do this", noteX, chartTop + 22);
        } else {
          ctx.fillText(text, pad, chartTop + chartH + 24);
        }
      } else if (noteFits) {
        ctx.fillStyle = "rgba(0,255,65,0.35)";
        ctx.fillText("every curve is monotonic here — no policy regresses", noteX, chartTop + 6);
      }
    }
  }, [sim, capacity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      canvas.width = Math.max(320, Math.floor(rect.width));
      canvas.height = Math.max(380, Math.floor(rect.height));
      draw();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [draw]);

  useEffect(() => {
    let raf = 0;
    let frame = 0;
    const tick = () => {
      frame++;
      if (runningRef.current && frame % paceRef.current === 0) {
        if (cursorRef.current < sim.refs.length) {
          cursorRef.current++;
          setCursor(cursorRef.current);
        }
      }
      draw();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [draw, sim.refs.length]);

  const best = sim.runs
    .filter((r) => !r.clairvoyant)
    .reduce((a, b) => (b.result.hits > a.result.hits ? b : a));
  const anomalyNow = sim.anomalies.find((a) => a.witness);

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/lab" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← lab
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">cache eviction</span>
        </div>
        <div className="text-xs text-primary/50 tabular-nums flex gap-3 flex-wrap">
          <span>
            {capacity} slots · {sim.refs.length} accesses
          </span>
          <span>access {Math.min(cursor, sim.refs.length)}</span>
          <span className="text-[#ffbe3c]">
            OPT {((sim.optHits / Math.max(1, sim.refs.length)) * 100).toFixed(0)}%
          </span>
          <span style={{ color: COLORS[best.id] }}>
            best real: {best.label} {((best.result.hitRate) * 100).toFixed(0)}%
          </span>
          {anomalyNow && (
            <span className="text-red-400">✕ {anomalyNow.id.toUpperCase()} anomaly</span>
          )}
        </div>
      </div>

      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-2">
        <span className="text-primary/30 text-xs mr-1">workload</span>
        {WORKLOADS.map((w) => (
          <button
            key={w.id}
            onClick={() => {
              setWorkloadId(w.id);
              reset();
            }}
            title={w.note}
            className={`px-2.5 py-1 text-xs border transition-colors ${
              w.id === workloadId
                ? "border-primary bg-primary/15 text-primary"
                : "border-primary/25 text-primary/60 hover:border-primary hover:text-primary"
            }`}
          >
            {w.label}
          </button>
        ))}
        <span className="text-primary/30 text-xs hidden lg:inline ml-1">{workload.note}</span>
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
            cursorRef.current = Math.min(sim.refs.length, cursorRef.current + 1);
            setCursor(cursorRef.current);
            draw();
          }}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ⇥ step
        </button>
        <button
          onClick={() => {
            cursorRef.current = sim.refs.length;
            setCursor(sim.refs.length);
            draw();
          }}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ⏭ run all
        </button>
        <button
          onClick={() => {
            setSeed((s) => s + 1);
            reset();
          }}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ↻ new trace
        </button>

        <Slider
          label="slots"
          title="cache capacity"
          min={1}
          max={8}
          step={1}
          value={capacity}
          fmt={(v) => `${v}`}
          onChange={(v) => {
            setCapacity(v);
            reset();
          }}
        />
        {!isFixed && (
          <Slider
            label="keys"
            title="how many distinct keys the workload touches"
            min={4}
            max={30}
            step={1}
            value={universe}
            fmt={(v) => `${v}`}
            onChange={(v) => {
              setUniverse(v);
              reset();
            }}
          />
        )}
        <Slider
          label="pace"
          title="frames per access"
          min={1}
          max={30}
          step={1}
          value={pace}
          fmt={(v) => `${v}f`}
          onChange={(v) => {
            setPace(v);
            paceRef.current = v;
          }}
        />
      </div>

      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute bottom-1 left-4 right-4 text-xs text-primary/40 pointer-events-none">
          amber OPT evicts whatever is needed furthest ahead — impossible to build, and nothing can
          beat it, so it is the only honest ceiling · try the loop workload with slots one below the
          cycle for LRU's 0% worst case, or the anomaly string, where FIFO gets fewer hits from a
          bigger cache
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
