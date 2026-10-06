import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  STREAMS,
  Sketch,
  Stream,
  add,
  estimate,
  exactMemoryBytes,
  memoryBytes,
  newSketch,
  registerStats,
  relativeError,
} from "../features/hyperloglog/hll";

const MAX_ITEMS = 2_000_000;

interface Run {
  stream: Stream;
  sketch: Sketch;
  seen: number; // items pushed through
  truth: Set<string> | null; // exact count, kept only while it is affordable
  truthCount: number;
  exactGaveUp: boolean;
  history: { n: number; est: number; truth: number }[];
}

const TRUTH_LIMIT = 200_000; // beyond this, keeping every id is the point being made

// Most streams know their own distinct count by construction, so the truth is
// exact and free. Only the "popular few" stream has to be counted the hard way,
// with a set — and that set is what runs out of room.
function derivesTruth(stream: Stream): boolean {
  return stream.distinct(10) >= 0;
}

function freshRun(stream: Stream, p: number): Run {
  return {
    stream,
    sketch: newSketch(p),
    seen: 0,
    truth: derivesTruth(stream) ? null : new Set<string>(),
    truthCount: 0,
    exactGaveUp: false,
    history: [],
  };
}

export default function Hyperloglog() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runRef = useRef<Run>(freshRun(STREAMS[0], 10));
  const runningRef = useRef(true);
  const rateRef = useRef(2000);

  const [streamId, setStreamId] = useState(STREAMS[0].id);
  const [p, setP] = useState(10);
  const [running, setRunning] = useState(true);
  const [rate, setRate] = useState(2000);
  const [hud, setHud] = useState({
    seen: 0,
    est: 0,
    truth: 0,
    error: 0,
    registers: 1024,
    bytes: 1024,
    exactBytes: 0,
  });

  const refreshHud = useCallback(() => {
    const run = runRef.current;
    const est = estimate(run.sketch);
    const truthKnown = !run.exactGaveUp && run.truthCount > 0;
    setHud({
      seen: run.seen,
      est,
      truth: truthKnown ? run.truthCount : 0,
      error: truthKnown ? (est - run.truthCount) / run.truthCount : 0,
      registers: run.sketch.m,
      bytes: memoryBytes(run.sketch),
      exactBytes: exactMemoryBytes(run.truthCount),
    });
  }, []);

  const reset = useCallback(
    (stream: Stream, precision: number) => {
      runRef.current = freshRun(stream, precision);
      refreshHud();
    },
    [refreshHud]
  );

  const pump = useCallback((count: number) => {
    const run = runRef.current;
    for (let i = 0; i < count && run.seen < MAX_ITEMS; i++) {
      run.seen++;
      const item = run.stream.item(run.seen);
      add(run.sketch, item);
      if (run.truth) {
        run.truth.add(item);
        run.truthCount = run.truth.size;
        // The exact set is dropped once it gets expensive — which is the
        // argument for the sketch, made by actually running into it. The
        // comparison stops with it rather than freezing at a stale number.
        if (run.truth.size > TRUTH_LIMIT) {
          run.truth = null;
          run.exactGaveUp = true;
        }
      } else if (!run.exactGaveUp) {
        run.truthCount = run.stream.distinct(run.seen);
      }
    }
    const est = estimate(run.sketch);
    run.history.push({ n: run.seen, est, truth: run.exactGaveUp ? -1 : run.truthCount });
    if (run.history.length > 1200) run.history.shift();
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: W, height: H } = canvas;
    const run = runRef.current;
    const sketch = run.sketch;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    const pad = 20;
    const regionW = W - pad * 2;

    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    // ── the registers ──────────────────────────────────────────────────────
    ctx.fillStyle = "rgba(0,255,65,0.4)";
    ctx.fillText(
      `${sketch.m} registers, one byte each — brightness is the longest run of leading zeros that register has seen`,
      pad,
      pad - 12
    );
    const regH = Math.min(150, Math.max(70, H * 0.22));
    const cols = Math.min(sketch.m, Math.floor(regionW / 3));
    const rows = Math.ceil(sketch.m / cols);
    const cw = regionW / cols;
    const ch = Math.max(2, Math.min(10, regH / rows));
    const stats = registerStats(sketch);
    for (let i = 0; i < sketch.m; i++) {
      const v = sketch.registers[i];
      const x = pad + (i % cols) * cw;
      const y = pad + Math.floor(i / cols) * ch;
      const t = stats.max === 0 ? 0 : v / stats.max;
      ctx.fillStyle = v === 0 ? "rgba(0,255,65,0.07)" : `rgba(0,255,65,${0.15 + 0.75 * t})`;
      ctx.fillRect(x, y, Math.max(1, cw - 0.5), Math.max(1, ch - 0.5));
    }

    const chartTop = pad + rows * ch + 30;
    const chartH = Math.max(120, H - chartTop - 76);

    // ── estimate against truth, on a log x axis ────────────────────────────
    ctx.fillStyle = "rgba(0,255,65,0.4)";
    ctx.fillText("estimate against the true distinct count, log scale", pad, chartTop - 13);
    ctx.strokeStyle = "rgba(0,255,65,0.18)";
    ctx.lineWidth = 1;
    ctx.strokeRect(pad + 0.5, chartTop + 0.5, regionW - 1, chartH - 1);

    const maxN = Math.max(1000, run.seen);
    const lx = (n: number) => pad + (Math.log10(Math.max(1, n)) / Math.log10(maxN)) * regionW;
    const maxV = Math.max(1000, run.truthCount, estimate(sketch));
    const ly = (v: number) => chartTop + chartH - (Math.log10(Math.max(1, v)) / Math.log10(maxV)) * chartH;

    for (let decade = 1; decade <= Math.log10(maxN); decade++) {
      const x = lx(10 ** decade);
      ctx.strokeStyle = "rgba(0,255,65,0.07)";
      ctx.beginPath();
      ctx.moveTo(x, chartTop);
      ctx.lineTo(x, chartTop + chartH);
      ctx.stroke();
      ctx.fillStyle = "rgba(0,255,65,0.3)";
      ctx.fillText(`10^${decade}`, x + 3, chartTop + chartH - 12);
    }

    if (run.history.length > 1) {
      // The error band the theory promises: 1.04/sqrt(m).
      const err = relativeError(sketch.m);
      ctx.fillStyle = "rgba(255,190,60,0.12)";
      ctx.beginPath();
      for (const point of run.history) {
        if (point.truth <= 0) continue;
        ctx.lineTo(lx(point.n), ly(point.truth * (1 + err)));
      }
      for (let i = run.history.length - 1; i >= 0; i--) {
        const point = run.history[i];
        if (point.truth <= 0) continue;
        ctx.lineTo(lx(point.n), ly(point.truth * (1 - err)));
      }
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "rgba(255,190,60,0.85)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      let started = false;
      for (const point of run.history) {
        if (point.truth <= 0) continue;
        const x = lx(point.n);
        const y = ly(point.truth);
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.strokeStyle = "#00cfff";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      run.history.forEach((point, i) => {
        const x = lx(point.n);
        const y = ly(point.est);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(255,190,60,0.85)";
    ctx.fillText("true distinct", pad + regionW - 190, chartTop + 6);
    ctx.fillStyle = "#00cfff";
    ctx.fillText("estimate", pad + regionW - 90, chartTop + 6);

    // ── the memory argument ────────────────────────────────────────────────
    const memY = chartTop + chartH + 16;
    const sketchBytes = memoryBytes(sketch);
    const exactBytes = exactMemoryBytes(run.truthCount);
    ctx.fillStyle = "rgba(0,255,65,0.45)";
    ctx.fillText(
      `sketch memory ${fmtBytes(sketchBytes)} — fixed, whatever the count` +
        (run.truthCount > 0 && !run.exactGaveUp
          ? `   ·   an exact set of ${run.truthCount.toLocaleString()} ids would need about ${fmtBytes(exactBytes)}`
          : ""),
      pad,
      memY
    );
    if (run.exactGaveUp) {
      ctx.fillStyle = "rgba(255,190,60,0.85)";
      ctx.fillText(
        `exact counting stopped at ${TRUTH_LIMIT.toLocaleString()} ids — the sketch keeps going on the same ${fmtBytes(sketchBytes)}`,
        pad,
        memY + 15
      );
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
      if (runningRef.current) pump(rateRef.current);
      draw();
      if (++frame % 10 === 0) refreshHud();
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [draw, pump, refreshHud]);

  const stream = STREAMS.find((s) => s.id === streamId) ?? STREAMS[0];
  const theoretical = relativeError(1 << p);

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">hyperloglog</span>
        </div>
        <div className="text-xs text-primary/50 tabular-nums flex gap-3 flex-wrap">
          <span>{hud.seen.toLocaleString()} items seen</span>
          <span className="text-[#00cfff]">estimate {Math.round(hud.est).toLocaleString()}</span>
          {hud.truth > 0 && <span className="text-[#ffbe3c]">true {hud.truth.toLocaleString()}</span>}
          {hud.truth > 0 && (
            <span className={Math.abs(hud.error) < 3 * theoretical ? "text-primary" : "text-red-400"}>
              off by {(hud.error * 100).toFixed(2)}%
            </span>
          )}
          <span>±{(theoretical * 100).toFixed(2)}% expected</span>
          <span>{fmtBytes(hud.bytes)}</span>
        </div>
      </div>

      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-2">
        <span className="text-primary/30 text-xs mr-1">stream</span>
        {STREAMS.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setStreamId(s.id);
              reset(s, p);
            }}
            title={s.note}
            className={`px-2.5 py-1 text-xs border transition-colors ${
              s.id === streamId
                ? "border-primary bg-primary/15 text-primary"
                : "border-primary/25 text-primary/60 hover:border-primary hover:text-primary"
            }`}
          >
            {s.label}
          </button>
        ))}
        <span className="text-primary/30 text-xs hidden lg:inline ml-1">{stream.note}</span>
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
            pump(100000);
            refreshHud();
            draw();
          }}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ⏭ pour in 100k
        </button>
        <button
          onClick={() => reset(stream, p)}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ↺ empty the sketch
        </button>

        <Slider
          label="p"
          title="address bits — m = 2^p registers, and the error falls as 1.04/sqrt(m)"
          min={4}
          max={14}
          step={1}
          value={p}
          fmt={(v) => `${v} (${1 << v})`}
          onChange={(v) => {
            setP(v);
            reset(stream, v);
          }}
        />
        <Slider
          label="rate"
          title="items pushed through per frame"
          min={100}
          max={20000}
          step={100}
          value={rate}
          fmt={(v) => `${v >= 1000 ? `${v / 1000}k` : v}`}
          onChange={(v) => {
            setRate(v);
            rateRef.current = v;
          }}
        />
      </div>

      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute bottom-1 left-4 right-4 text-xs text-primary/40 pointer-events-none">
          the sketch never stores an id — only the longest run of leading zeros each register has seen
          · the amber band is the ±1.04/√m error the theory promises · repeats cannot move a register,
          so pouring the same ids through again changes nothing
        </div>
      </div>
    </div>
  );
}

function fmtBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
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
      <span className="text-primary/60 text-xs w-14 tabular-nums">{fmt(value)}</span>
    </div>
  );
}
