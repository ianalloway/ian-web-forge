import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  SIZES,
  STRATEGIES,
  Strategy,
  Table,
  insert,
  loadFactor,
  longestCluster,
  lookup,
  makeKeys,
  makeRng,
  measuredProbes,
  newTable,
  theoreticalProbes,
} from "../features/hashmap/table";

const MAX_ALPHA_OPEN = 0.95; // open addressing cannot exceed a full table
const MAX_ALPHA_CHAIN = 1.6;

interface Run {
  table: Table;
  keys: string[];
  pool: string[];
  curve: { alpha: number; probes: number }[];
}

function freshRun(size: number, strategy: Strategy, seed: number): Run {
  return {
    table: newTable(size, strategy),
    keys: [],
    pool: makeKeys(Math.ceil(size * MAX_ALPHA_CHAIN) + 40, makeRng(seed)),
    curve: [],
  };
}

export default function Hashmap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runRef = useRef<Run>(freshRun(SIZES[1], "linear", 17));
  const runningRef = useRef(true);
  const paceRef = useRef(4);
  const flashRef = useRef(0);

  const [strategy, setStrategy] = useState<Strategy>("linear");
  const [size, setSize] = useState(SIZES[1]);
  const [running, setRunning] = useState(true);
  const [pace, setPace] = useState(4);
  const [seed, setSeed] = useState(17);
  const [hud, setHud] = useState({ count: 0, alpha: 0, probes: 0, theory: 0, cluster: 0, full: false });

  const refreshHud = useCallback(() => {
    const { table, keys } = runRef.current;
    const alpha = loadFactor(table);
    setHud({
      count: table.count,
      alpha,
      probes: measuredProbes(table, keys),
      theory: theoreticalProbes(table.strategy, Math.min(alpha, 0.99), true),
      cluster: longestCluster(table),
      full: isFull(runRef.current),
    });
  }, []);

  const reset = useCallback(
    (nextSize: number, nextStrategy: Strategy, nextSeed: number) => {
      runRef.current = freshRun(nextSize, nextStrategy, nextSeed);
      flashRef.current = 0;
      refreshHud();
    },
    [refreshHud]
  );

  const insertOne = useCallback(() => {
    const run = runRef.current;
    if (isFull(run)) return false;
    const key = run.pool[run.keys.length];
    if (!key) return false;
    const result = insert(run.table, key);
    if (!result.inserted) return false;
    run.keys.push(key);
    flashRef.current = 24;
    // Record the cost curve as the table fills — this is the shape the theory
    // predicts, measured rather than assumed.
    const alpha = loadFactor(run.table);
    run.curve.push({ alpha, probes: measuredProbes(run.table, run.keys) });
    return true;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: W, height: H } = canvas;
    const run = runRef.current;
    const t = run.table;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    const pad = 18;
    // The grid takes only the rows it needs; the chart then fills whatever is
    // left, rather than a fixed slice that leaves the canvas half empty.
    const gridW = W - pad * 2;
    const gridH = H * 0.42;

    // ── the table itself ───────────────────────────────────────────────────
    // Cells are capped: a 53-slot table would otherwise blow up into enormous
    // squares and squeeze the chart off the bottom of the canvas.
    const MAX_CELL = 30;
    let cols = Math.ceil(Math.sqrt((t.size * gridW) / Math.max(1, gridH)));
    cols = Math.max(cols, Math.ceil(gridW / MAX_CELL));
    const cell = Math.max(
      6,
      Math.min(MAX_CELL, Math.floor(gridW / cols), Math.floor(gridH / Math.ceil(t.size / cols)))
    );
    const rows = Math.ceil(t.size / cols);
    const ox = pad;
    const oy = pad + 14;

    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(0,255,65,0.4)";
    ctx.fillText(
      t.strategy === "chaining"
        ? "slots — brightness is chain length, so a tall chain is a slow lookup"
        : "slots — an unbroken run is a cluster, and every key landing in it must walk to the end",
      ox,
      pad
    );

    const probeSet = flashRef.current > 0 ? new Set(t.lastProbe) : new Set<number>();
    const homeSlot = t.lastProbe.length > 0 ? t.lastProbe[0] : -1;

    for (let i = 0; i < t.size; i++) {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const x = ox + c * cell;
      const y = oy + r * cell;

      const chain = t.chains[i].length;
      const occupied = t.strategy === "chaining" ? chain > 0 : t.slots[i] !== null;

      if (occupied) {
        const depth = t.strategy === "chaining" ? Math.min(1, chain / 4) : 0.55;
        ctx.fillStyle = `rgba(0,255,65,${0.3 + 0.55 * depth})`;
        ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
      } else {
        ctx.strokeStyle = "rgba(0,255,65,0.12)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1.5, y + 1.5, cell - 3, cell - 3);
      }

      if (probeSet.has(i)) {
        // The probe path of the most recent insert: where the key wanted to go
        // and every slot it had to try.
        ctx.fillStyle = i === homeSlot ? "rgba(0,207,255,0.85)" : "rgba(255,190,60,0.8)";
        ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
      }

      if (t.strategy === "chaining" && chain > 1 && cell >= 12) {
        ctx.fillStyle = "#04140a";
        ctx.font = `${Math.round(cell * 0.5)}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(chain), x + cell / 2, y + cell / 2);
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.font = "10px monospace";
      }
    }
    if (flashRef.current > 0) flashRef.current--;

    // ── probes against load factor ─────────────────────────────────────────
    const chartTop = oy + rows * cell + 24;
    const chartH = Math.max(110, H - chartTop - pad - 14);
    const chartW = W - pad * 2;
    const maxProbes = 8;
    const alphaMax = t.strategy === "chaining" ? MAX_ALPHA_CHAIN : 1;
    const px = (a: number) => pad + (a / alphaMax) * chartW;
    const py = (p: number) => chartTop + chartH - (Math.min(p, maxProbes) / maxProbes) * chartH;

    ctx.strokeStyle = "rgba(0,255,65,0.18)";
    ctx.lineWidth = 1;
    ctx.strokeRect(pad + 0.5, chartTop + 0.5, chartW - 1, chartH - 1);
    ctx.fillStyle = "rgba(0,255,65,0.4)";
    ctx.fillText("probes per successful lookup vs load factor", pad + 4, chartTop + 4);

    for (let p = 2; p <= maxProbes; p += 2) {
      const y = py(p);
      ctx.strokeStyle = "rgba(0,255,65,0.08)";
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(pad + chartW, y);
      ctx.stroke();
      ctx.fillStyle = "rgba(0,255,65,0.3)";
      ctx.fillText(String(p), pad + 3, Math.max(chartTop + 2, y - 10));
    }

    // Knuth's curve for this strategy, and the measured points on top of it.
    ctx.strokeStyle = "rgba(255,190,60,0.7)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 0; i <= 120; i++) {
      const a = (i / 120) * Math.min(alphaMax, 0.985);
      const y = py(theoreticalProbes(t.strategy, a, true));
      if (i === 0) ctx.moveTo(px(a), y);
      else ctx.lineTo(px(a), y);
    }
    ctx.stroke();
    ctx.fillStyle = "rgba(255,190,60,0.75)";
    ctx.fillText("theory", pad + chartW - 44, chartTop + 4);

    ctx.strokeStyle = "#00cfff";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    run.curve.forEach((pt, i) => {
      const x = px(pt.alpha);
      const y = py(pt.probes);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.fillStyle = "rgba(0,207,255,0.85)";
    ctx.fillText("measured", pad + chartW - 100, chartTop + 4);
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
        if (insertOne()) refreshHud();
      }
      draw();
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [draw, insertOne, refreshHud]);

  const info = STRATEGIES.find((s) => s.id === strategy) ?? STRATEGIES[1];

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">hash table collisions</span>
        </div>
        <div className="text-xs text-primary/50 tabular-nums flex gap-3 flex-wrap">
          <span>{hud.count}/{size} keys</span>
          <span className={hud.alpha > 0.85 ? "text-[#ffbe3c]" : "text-primary"}>
            α {hud.alpha.toFixed(2)}
          </span>
          <span className="text-[#00cfff]">{hud.probes.toFixed(2)} probes</span>
          <span className="text-[#ffbe3c]">theory {hud.theory.toFixed(2)}</span>
          <span>{strategy === "chaining" ? "longest chain" : "longest cluster"} {hud.cluster}</span>
          {hud.full && <span className="text-primary">◆ full</span>}
        </div>
      </div>

      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-2">
        <span className="text-primary/30 text-xs mr-1">collisions</span>
        {STRATEGIES.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setStrategy(s.id);
              reset(size, s.id, seed);
            }}
            title={s.note}
            className={`px-2.5 py-1 text-xs border transition-colors ${
              s.id === strategy
                ? "border-primary bg-primary/15 text-primary"
                : "border-primary/25 text-primary/60 hover:border-primary hover:text-primary"
            }`}
          >
            {s.label}
          </button>
        ))}
        <span className="text-primary/30 text-xs hidden lg:inline ml-1">{info.note}</span>
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
            insertOne();
            refreshHud();
            draw();
          }}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ⇥ insert one
        </button>
        <button
          onClick={() => {
            const run = runRef.current;
            // Look up a key that is in the table, to show the probe path a
            // successful lookup walks — the same path the insert took.
            if (run.keys.length === 0) return;
            const key = run.keys[Math.floor(Math.random() * run.keys.length)];
            lookup(run.table, key);
            flashRef.current = 40;
            refreshHud();
            draw();
          }}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ⌕ look one up
        </button>
        <button
          onClick={() => {
            const next = (seed * 16807 + 11) % 2147483647;
            setSeed(next);
            reset(size, strategy, next);
          }}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ⟳ new keys
        </button>
        <button
          onClick={() => reset(size, strategy, seed)}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ↺ empty
        </button>

        <Slider
          label="slots"
          title="table size — kept prime so double hashing's step is coprime with it"
          min={0}
          max={SIZES.length - 1}
          step={1}
          value={SIZES.indexOf(size)}
          fmt={() => `${size}`}
          onChange={(i) => {
            const next = SIZES[i];
            setSize(next);
            reset(next, strategy, seed);
          }}
        />
        <Slider
          label="pace"
          title="frames between inserts — lower is faster"
          min={1}
          max={20}
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
          cyan = the slot a key hashed to, amber = the slots it had to try instead · watch linear
          probing track the theory curve and then run away with it past α ≈ 0.8, as clusters merge
        </div>
      </div>
    </div>
  );
}

function isFull(run: Run): boolean {
  const cap = run.table.strategy === "chaining" ? MAX_ALPHA_CHAIN : MAX_ALPHA_OPEN;
  return loadFactor(run.table) >= cap || run.keys.length >= run.pool.length;
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
      <span className="text-primary/60 text-xs w-9 tabular-nums">{fmt(value)}</span>
    </div>
  );
}
