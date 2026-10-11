import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ALGORITHMS,
  Algorithm,
  Config,
  Decision,
  PATTERNS,
  allowedCount,
  run,
  worstWindow,
} from "../features/ratelimit/limiter";

const SPAN_MS = 10000;
const COLOURS: Record<Algorithm, string> = {
  fixed: "#ff5d8f",
  log: "#00ff41",
  counter: "#00cfff",
  bucket: "#ffbe3c",
};

export default function Ratelimit() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [patternId, setPatternId] = useState(PATTERNS[1].id);
  const [limit, setLimit] = useState(10);
  const [windowMs, setWindowMs] = useState(1000);
  const [reveal, setReveal] = useState(0); // how much of the timeline is played
  const [running, setRunning] = useState(true);
  const runningRef = useRef(true);
  const revealRef = useRef(0);

  const pattern = PATTERNS.find((p) => p.id === patternId) ?? PATTERNS[1];
  const config: Config = useMemo(() => ({ limit, windowMs }), [limit, windowMs]);

  // Everything on screen is a function of the pattern and the config, so the
  // four runs are derived rather than stored.
  const results = useMemo(() => {
    const times = pattern.times(SPAN_MS, windowMs, limit);
    const out = new Map<Algorithm, Decision[]>();
    for (const info of ALGORITHMS) out.set(info.id, run(info.id, config, times));
    return { times, out };
  }, [pattern, config, limit, windowMs]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: W, height: H } = canvas;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    const pad = 22;
    const labelW = 112;
    const plotX = pad + labelW;
    const plotW = W - plotX - pad - 70;
    // Four lanes should fill the canvas rather than huddling at the top.
    const laneH = Math.min(150, Math.max(48, (H - pad * 2 - 30) / ALGORITHMS.length));
    const tx = (t: number) => plotX + (t / SPAN_MS) * plotW;
    const now = revealRef.current;

    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(0,255,65,0.4)";
    ctx.fillText(
      `${results.times.length} requests over ${SPAN_MS / 1000}s · limit ${config.limit} per ${config.windowMs}ms · green allowed, red refused`,
      pad,
      pad - 12
    );

    ALGORITHMS.forEach((info, i) => {
      const decisions = results.out.get(info.id)!;
      const y = pad + 6 + i * laneH;
      const mid = y + laneH * 0.42;

      ctx.fillStyle = COLOURS[info.id];
      ctx.fillText(info.label, pad, y + 6);

      // Window boundaries, which is where the fixed window gives itself away.
      ctx.strokeStyle = "rgba(0,255,65,0.1)";
      ctx.lineWidth = 1;
      for (let t = 0; t <= SPAN_MS; t += config.windowMs) {
        ctx.beginPath();
        ctx.moveTo(tx(t), y + 2);
        ctx.lineTo(tx(t), y + laneH - 12);
        ctx.stroke();
      }

      ctx.strokeStyle = "rgba(0,255,65,0.18)";
      ctx.beginPath();
      ctx.moveTo(plotX, mid);
      ctx.lineTo(plotX + plotW, mid);
      ctx.stroke();

      const revealed = decisions.filter((d) => d.time <= now);
      for (const decision of revealed) {
        const x = tx(decision.time);
        ctx.fillStyle = decision.allowed ? COLOURS[info.id] : "rgba(255,85,85,0.75)";
        const up = Math.min(42, laneH * 0.36);
        if (decision.allowed) ctx.fillRect(x - 0.8, mid - up, 1.6, up);
        else ctx.fillRect(x - 0.8, mid + 1, 1.6, up * 0.6);
      }

      // The number that matters: the most this algorithm ever let through in
      // any single window, against what it promised.
      const worst = worstWindow(revealed, config.windowMs);
      const over = worst > config.limit;
      ctx.textAlign = "right";
      ctx.fillStyle = over ? "#ff5555" : "rgba(0,255,65,0.5)";
      ctx.fillText(`worst ${worst}/${config.limit}`, W - pad, y + 6);
      ctx.fillStyle = "rgba(0,255,65,0.35)";
      ctx.fillText(`${allowedCount(revealed)} allowed`, W - pad, y + 20);
      ctx.textAlign = "left";

      if (over) {
        ctx.fillStyle = "rgba(255,85,85,0.9)";
        ctx.fillText("over its own limit", plotX + 4, y + laneH - 12);
      }
    });

    // The playhead.
    if (now < SPAN_MS) {
      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tx(now), pad);
      ctx.lineTo(tx(now), pad + ALGORITHMS.length * laneH);
      ctx.stroke();
    }
    ctx.textBaseline = "middle";
  }, [config, results]);

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
      if (runningRef.current) {
        revealRef.current = Math.min(SPAN_MS, revealRef.current + SPAN_MS / 260);
        if (++frame % 8 === 0) setReveal(revealRef.current);
      }
      draw();
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [draw]);

  const restart = useCallback(() => {
    revealRef.current = 0;
    setReveal(0);
  }, []);

  const worst = useMemo(() => {
    const out: Partial<Record<Algorithm, number>> = {};
    for (const info of ALGORITHMS) {
      out[info.id] = worstWindow(
        results.out.get(info.id)!.filter((d) => d.time <= reveal),
        windowMs
      );
    }
    return out;
  }, [results, reveal, windowMs]);

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">rate limiting</span>
        </div>
        <div className="text-xs text-primary/50 tabular-nums flex gap-3 flex-wrap">
          <span>t {(reveal / 1000).toFixed(1)}s</span>
          {ALGORITHMS.map((info) => (
            <span key={info.id} style={{ color: (worst[info.id] ?? 0) > limit ? "#ff5555" : COLOURS[info.id] }}>
              {info.label.split(" ")[0]} {worst[info.id] ?? 0}
            </span>
          ))}
          <span className="text-primary/40">limit {limit}</span>
        </div>
      </div>

      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-2">
        <span className="text-primary/30 text-xs mr-1">traffic</span>
        {PATTERNS.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setPatternId(p.id);
              restart();
            }}
            title={p.note}
            className={`px-2.5 py-1 text-xs border transition-colors ${
              p.id === patternId
                ? "border-primary bg-primary/15 text-primary"
                : "border-primary/25 text-primary/60 hover:border-primary hover:text-primary"
            }`}
          >
            {p.label}
          </button>
        ))}
        <span className="text-primary/30 text-xs hidden lg:inline ml-1">{pattern.note}</span>
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
            revealRef.current = SPAN_MS;
            setReveal(SPAN_MS);
          }}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ⏭ play it all
        </button>
        <button
          onClick={restart}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ↺ restart
        </button>

        <Slider
          label="limit"
          title="requests allowed per window"
          min={2}
          max={40}
          step={1}
          value={limit}
          fmt={(v) => `${v}`}
          onChange={(v) => {
            setLimit(v);
            restart();
          }}
        />
        <Slider
          label="window"
          title="the window each algorithm measures against"
          min={250}
          max={2500}
          step={50}
          value={windowMs}
          fmt={(v) => `${v}ms`}
          onChange={(v) => {
            setWindowMs(v);
            restart();
          }}
        />
      </div>

      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute bottom-1 left-4 right-4 text-xs text-primary/40 pointer-events-none">
          &quot;worst&quot; is the most each algorithm let through in any window of that length · run the
          boundary burst and watch the fixed window pass twice its own limit while the sliding log
          never does
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
      <span className="text-primary/60 text-xs w-12 tabular-nums">{fmt(value)}</span>
    </div>
  );
}
