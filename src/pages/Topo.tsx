import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  PRESETS,
  Preset,
  buildGraph,
  isValidOrder,
  longestPath,
  missingDependencies,
  schedule,
} from "../features/topo/topo";

export default function Topo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [presetId, setPresetId] = useState(PRESETS[0].id);
  const [revealed, setRevealed] = useState(0); // waves shown
  const [running, setRunning] = useState(true);
  const runningRef = useRef(true);
  const revealedRef = useRef(0);
  const paceRef = useRef(40);
  const [pace, setPace] = useState(40);

  const preset: Preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0];
  const { graph, result, valid, independent, missing } = useMemo(() => {
    const g = buildGraph(preset.tasks);
    const r = schedule(g);
    return {
      graph: g,
      result: r,
      // Checked on the page, not just in the test suite.
      valid: !r.cyclic && isValidOrder(g, r.order),
      independent: longestPath(g),
      missing: missingDependencies(g),
    };
  }, [preset]);

  const reset = useCallback(() => {
    revealedRef.current = 0;
    setRevealed(0);
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
    const waves = result.waves;
    const shown = revealedRef.current;
    const laneW = Math.max(90, Math.min(190, (W - pad * 2) / Math.max(1, waves.length + (result.cyclic ? 1 : 0))));
    const boxH = 26;
    const gap = 12;
    const criticalSet = new Set(result.criticalPath);

    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(0,255,65,0.4)";
    ctx.fillText(
      "each column is a wave: everything in it has its dependencies met, so it can all run at once",
      pad,
      pad - 12
    );

    const position = new Map<string, { x: number; y: number }>();
    waves.forEach((wave, i) => {
      const x = pad + i * laneW;
      const visible = i < shown;
      ctx.fillStyle = visible ? "rgba(0,255,65,0.35)" : "rgba(0,255,65,0.15)";
      ctx.fillText(`wave ${i + 1}`, x, pad + 8);
      ctx.fillStyle = "rgba(0,255,65,0.25)";
      ctx.fillText(`${wave.endsAt}s`, x, pad + 20);

      wave.tasks.forEach((id, j) => {
        const y = pad + 40 + j * (boxH + gap);
        position.set(id, { x, y });
        const task = graph.byId.get(id)!;
        const onCritical = criticalSet.has(id);

        ctx.fillStyle = !visible
          ? "rgba(0,255,65,0.07)"
          : onCritical
            ? "rgba(255,190,60,0.3)"
            : "rgba(0,255,65,0.16)";
        ctx.fillRect(x, y, laneW - 22, boxH);
        if (visible && onCritical) {
          ctx.strokeStyle = "#ffbe3c";
          ctx.lineWidth = 1.2;
          ctx.strokeRect(x + 0.5, y + 0.5, laneW - 23, boxH - 1);
        }
        ctx.fillStyle = !visible ? "rgba(0,255,65,0.2)" : onCritical ? "#ffbe3c" : "rgba(0,255,65,0.85)";
        ctx.fillText(id.slice(0, 14), x + 6, y + 5);
        ctx.fillStyle = !visible ? "rgba(0,255,65,0.15)" : "rgba(0,255,65,0.4)";
        ctx.fillText(`${task.duration}s`, x + 6, y + 15);
      });
    });

    // Dependency edges, drawn under the boxes they connect.
    for (const task of graph.tasks) {
      const to = position.get(task.id);
      if (!to) continue;
      for (const dep of task.deps) {
        const from = position.get(dep);
        if (!from) continue;
        const onCritical = criticalSet.has(task.id) && criticalSet.has(dep);
        ctx.strokeStyle = onCritical ? "rgba(255,190,60,0.7)" : "rgba(0,255,65,0.16)";
        ctx.lineWidth = onCritical ? 1.6 : 1;
        ctx.beginPath();
        ctx.moveTo(from.x + laneW - 22, from.y + boxH / 2);
        ctx.lineTo(to.x, to.y + boxH / 2);
        ctx.stroke();
      }
    }

    // Anything caught in a cycle sits off to the side: it has no wave.
    if (result.cyclic) {
      const x = pad + waves.length * laneW;
      ctx.fillStyle = "rgba(255,85,85,0.9)";
      ctx.fillText("never runnable", x, pad + 8);
      result.stuck.forEach((id, j) => {
        const y = pad + 40 + j * (boxH + gap);
        ctx.fillStyle = "rgba(255,85,85,0.2)";
        ctx.fillRect(x, y, laneW - 22, boxH);
        ctx.fillStyle = "#ff5555";
        ctx.fillText(id.slice(0, 14), x + 6, y + 5);
        ctx.fillText("waiting", x + 6, y + 15);
      });
    }

    // ── the schedule's cost ───────────────────────────────────────────────
    // The caption below the canvas is two lines tall, so the footer has to stop
    // well short of the bottom or the critical path prints on top of it.
    const footY = H - 118;
    if (footY > pad + 60) {
      const barW = Math.min(420, W - pad * 2 - 150);
      const worst = Math.max(result.serialLength, 1);
      const rows: [string, number, string][] = [
        ["one at a time", result.serialLength, "rgba(255,120,120,0.8)"],
        ["unlimited machines", result.criticalLength, "#ffbe3c"],
      ];
      rows.forEach(([label, value, colour], i) => {
        const y = footY + i * 17;
        ctx.fillStyle = "rgba(0,255,65,0.4)";
        ctx.fillText(label, pad, y);
        ctx.fillStyle = "rgba(0,255,65,0.12)";
        ctx.fillRect(pad + 118, y, barW, 10);
        ctx.fillStyle = colour;
        ctx.fillRect(pad + 118, y, barW * (value / worst), 10);
        ctx.fillStyle = colour;
        ctx.fillText(`${value}s`, pad + 124 + barW, y);
      });

      ctx.fillStyle = "rgba(0,255,65,0.35)";
      ctx.fillText(
        result.cyclic
          ? "a cycle means no order exists — the build can never finish"
          : `the critical path is ${result.criticalPath.join(" → ")}`,
        pad,
        footY + 38
      );
    }
    ctx.textBaseline = "middle";
  }, [graph, result]);

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
      if (runningRef.current && ++frame % paceRef.current === 0) {
        if (revealedRef.current < result.waves.length) {
          revealedRef.current++;
          setRevealed(revealedRef.current);
        }
      }
      draw();
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [draw, result]);

  const speedup = result.criticalLength > 0 ? result.serialLength / result.criticalLength : 0;

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">build scheduler</span>
        </div>
        <div className="text-xs text-primary/50 tabular-nums flex gap-3 flex-wrap">
          <span>{preset.tasks.length} tasks</span>
          <span>{result.waves.length} waves</span>
          <span>wave {Math.min(revealed, result.waves.length)}</span>
          <span className="text-[#ffbe3c]">critical {result.criticalLength}s</span>
          <span>serial {result.serialLength}s</span>
          {!result.cyclic && speedup > 1.05 && (
            <span className="text-primary">{speedup.toFixed(1)}× from parallelism</span>
          )}
          {result.cyclic ? (
            <span className="text-red-400">✕ cycle: {result.stuck.join(", ")}</span>
          ) : (
            <span className={valid ? "text-primary" : "text-red-400"}>
              {valid ? "◆ order is legal" : "✕ order breaks a dependency"}
            </span>
          )}
        </div>
      </div>

      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-2">
        <span className="text-primary/30 text-xs mr-1">graph</span>
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setPresetId(p.id);
              reset();
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
            revealedRef.current = Math.min(result.waves.length, revealedRef.current + 1);
            setRevealed(revealedRef.current);
            draw();
          }}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ⇥ next wave
        </button>
        <button
          onClick={() => {
            revealedRef.current = result.waves.length;
            setRevealed(result.waves.length);
            draw();
          }}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ⏭ show all
        </button>
        <button
          onClick={reset}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ↺ restart
        </button>
        <span
          className="text-primary/30 text-xs"
          title="the same figure computed by plain recursion, as a check on the scheduler"
        >
          longest chain {independent}s
        </span>
        {missing.length > 0 && (
          <span className="text-[#ffbe3c] text-xs">missing dep: {missing.join(", ")}</span>
        )}

        <Slider
          label="pace"
          title="frames between waves"
          min={6}
          max={90}
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
          amber is the critical path: the longest chain of dependencies, and the floor on the build
          time that no number of machines can get under · a cycle has no legal order at all, and
          Kahn finds it without a separate pass
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
