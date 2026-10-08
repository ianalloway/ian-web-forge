import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Diff as DiffResult, SAMPLES, Sample, apply, diff, minimumEdits, stats } from "../features/diff/myers";

interface Run {
  sample: Sample;
  result: DiffResult;
  depth: number; // how many wavefronts to reveal
  verified: boolean;
}

function freshRun(sample: Sample): Run {
  const result = diff(sample.before, sample.after);
  return {
    sample,
    result,
    depth: 0,
    // The diff is only worth drawing if replaying it reproduces the new text.
    verified: apply(sample.before, result.ops).join("\n") === sample.after.join("\n"),
  };
}

export default function Diff() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runRef = useRef<Run>(freshRun(SAMPLES[0]));
  const runningRef = useRef(true);
  const paceRef = useRef(26);

  const [sampleId, setSampleId] = useState(SAMPLES[0].id);
  const [running, setRunning] = useState(true);
  const [pace, setPace] = useState(26);
  const [hud, setHud] = useState({ depth: 0, edits: 0, minimum: 0, kept: 0, inserted: 0, deleted: 0, verified: true });

  const refreshHud = useCallback(() => {
    const run = runRef.current;
    const s = stats(run.result);
    setHud({
      depth: run.depth,
      edits: run.result.editCount,
      minimum: minimumEdits(run.sample.before, run.sample.after),
      kept: s.kept,
      inserted: s.inserted,
      deleted: s.deleted,
      verified: run.verified,
    });
  }, []);

  const reset = useCallback(
    (sample: Sample) => {
      runRef.current = freshRun(sample);
      refreshHud();
    },
    [refreshHud]
  );

  const advance = useCallback(() => {
    const run = runRef.current;
    if (run.depth >= run.result.trace.length) return false;
    run.depth++;
    return true;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: W, height: H } = canvas;
    const { sample, result, depth } = runRef.current;
    const n = sample.before.length;
    const m = sample.after.length;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    const pad = 22;
    // The graph should fill the space it has: a five-line diff on a tall canvas
    // was drawing a postage stamp in the corner.
    const graphW = Math.min(W * 0.46, H - pad * 4 - 40);
    const cell = Math.max(10, Math.min(graphW / Math.max(n, m, 1), 72));
    const ox = pad + 10;
    const oy = pad + 16;
    const gx = (x: number) => ox + x * cell;
    const gy = (y: number) => oy + y * cell;

    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(0,255,65,0.4)";
    ctx.fillText("edit graph — right deletes, down inserts, diagonal is free", ox, pad - 2);

    // Grid, with the free diagonals marked: those are the lines both files share.
    ctx.strokeStyle = "rgba(0,255,65,0.08)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= n; x++) {
      ctx.beginPath();
      ctx.moveTo(gx(x), gy(0));
      ctx.lineTo(gx(x), gy(m));
      ctx.stroke();
    }
    for (let y = 0; y <= m; y++) {
      ctx.beginPath();
      ctx.moveTo(gx(0), gy(y));
      ctx.lineTo(gx(n), gy(y));
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(0,255,65,0.45)";
    ctx.lineWidth = 2;
    for (let x = 0; x < n; x++) {
      for (let y = 0; y < m; y++) {
        if (sample.before[x] !== sample.after[y]) continue;
        ctx.beginPath();
        ctx.moveTo(gx(x), gy(y));
        ctx.lineTo(gx(x + 1), gy(y + 1));
        ctx.stroke();
      }
    }

    // The wavefronts, each one the set of squares reachable in d edits.
    const offset = n + m;
    for (let d = 0; d < Math.min(depth, result.trace.length); d++) {
      const v = result.trace[d];
      const fade = 0.12 + 0.5 * (d / Math.max(1, depth - 1));
      ctx.fillStyle = `rgba(0,207,255,${fade})`;
      for (let k = -d; k <= d; k += 2) {
        const x = v[k + offset];
        const y = x - k;
        if (x < 0 || y < 0 || x > n || y > m) continue;
        ctx.beginPath();
        ctx.arc(gx(x), gy(y), 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Once the search has reached the corner, draw the route it found.
    const finished = depth >= result.trace.length;
    if (finished && result.path.length > 1) {
      ctx.strokeStyle = "#ffbe3c";
      ctx.lineWidth = 2.4;
      ctx.lineJoin = "round";
      ctx.beginPath();
      result.path.forEach((p, i) => {
        if (i === 0) ctx.moveTo(gx(p.x), gy(p.y));
        else ctx.lineTo(gx(p.x), gy(p.y));
      });
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(0,255,65,0.3)";
    ctx.fillText(`old ${n} lines →`, ox, gy(m) + 8);
    ctx.save();
    ctx.translate(ox - 14, gy(0));
    ctx.rotate(Math.PI / 2);
    ctx.fillText(`new ${m} lines →`, 0, 0);
    ctx.restore();

    // ── the diff itself ────────────────────────────────────────────────────
    const listX = Math.max(ox + n * cell + 60, W * 0.52);
    const listW = W - listX - pad;
    if (listW > 160) {
      ctx.fillStyle = "rgba(0,255,65,0.4)";
      ctx.fillText(
        finished ? `${result.editCount} edits, the fewest possible` : "exploring…",
        listX,
        pad - 2
      );
      const lineH = 15;
      let y = oy;
      const maxLines = Math.floor((H - oy - 24) / lineH);
      for (const op of result.ops.slice(0, maxLines)) {
        const colour =
          op.kind === "insert" ? "#00ff41" : op.kind === "delete" ? "#ff5555" : "rgba(0,255,65,0.35)";
        const prefix = op.kind === "insert" ? "+" : op.kind === "delete" ? "−" : " ";
        if (op.kind !== "keep") {
          ctx.fillStyle = op.kind === "insert" ? "rgba(0,255,65,0.1)" : "rgba(255,85,85,0.1)";
          ctx.fillRect(listX - 4, y - 2, listW, lineH);
        }
        ctx.fillStyle = colour;
        const text = `${prefix} ${op.text}`;
        ctx.fillText(text.length > listW / 6.2 ? `${text.slice(0, Math.floor(listW / 6.2))}…` : text, listX, y);
        y += lineH;
      }
      if (result.ops.length > maxLines) {
        ctx.fillStyle = "rgba(0,255,65,0.3)";
        ctx.fillText(`… ${result.ops.length - maxLines} more`, listX, y);
      }
    }
    ctx.textBaseline = "middle";
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
      if (runningRef.current && ++frame % paceRef.current === 0) {
        if (advance()) refreshHud();
      }
      draw();
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [advance, draw, refreshHud]);

  const sample = SAMPLES.find((s) => s.id === sampleId) ?? SAMPLES[0];

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">myers diff</span>
        </div>
        <div className="text-xs text-primary/50 tabular-nums flex gap-3 flex-wrap">
          <span>d = {hud.depth}</span>
          <span className="text-primary">+{hud.inserted}</span>
          <span className="text-red-400">−{hud.deleted}</span>
          <span>{hud.kept} kept</span>
          <span className={hud.edits === hud.minimum ? "text-primary" : "text-red-400"}>
            {hud.edits} edits {hud.edits === hud.minimum ? "(minimal)" : "(NOT minimal)"}
          </span>
          <span className={hud.verified ? "text-primary/40" : "text-red-400"}>
            {hud.verified ? "◆ replays exactly" : "✕ replay mismatch"}
          </span>
        </div>
      </div>

      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-2">
        <span className="text-primary/30 text-xs mr-1">change</span>
        {SAMPLES.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setSampleId(s.id);
              reset(s);
            }}
            title={s.note}
            className={`px-2.5 py-1 text-xs border transition-colors ${
              s.id === sampleId
                ? "border-primary bg-primary/15 text-primary"
                : "border-primary/25 text-primary/60 hover:border-primary hover:text-primary"
            }`}
          >
            {s.label}
          </button>
        ))}
        <span className="text-primary/30 text-xs hidden lg:inline ml-1">{sample.note}</span>
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
            advance();
            refreshHud();
            draw();
          }}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ⇥ one more edit
        </button>
        <button
          onClick={() => {
            while (advance());
            refreshHud();
            draw();
          }}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ⏭ finish
        </button>
        <button
          onClick={() => reset(sample)}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ↺ restart
        </button>

        <Slider
          label="pace"
          title="frames between wavefronts — lower is faster"
          min={4}
          max={60}
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
          cyan dots are everything reachable in d edits · green diagonals are lines both files share
          and cost nothing · the first wavefront to touch the far corner gives the fewest-edit diff,
          drawn in amber
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
