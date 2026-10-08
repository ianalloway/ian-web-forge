import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  SEQUENCES,
  Sequence,
  SkipList,
  insert,
  lane,
  linearComparisons,
  newList,
  remove,
  search,
  toArray,
} from "../features/skiplist/skiplist";

const TOTAL = 40;

interface Run {
  sequence: Sequence;
  list: SkipList;
  queue: number[];
  lastInserted: number | null;
  lastLevel: number;
  searchKey: number | null;
  searchPath: Set<string>; // "level:key" of each hop the search took
  searchFound: boolean;
  comparisons: number;
  linear: number;
}

function freshRun(sequence: Sequence, p: number, seed: number): Run {
  return {
    sequence,
    list: newList(p, seed),
    queue: sequence.keys(TOTAL),
    lastInserted: null,
    lastLevel: 0,
    searchKey: null,
    searchPath: new Set(),
    searchFound: false,
    comparisons: 0,
    linear: 0,
  };
}

export default function Skiplist() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runRef = useRef<Run>(freshRun(SEQUENCES[1], 0.5, 7));
  const runningRef = useRef(true);
  const paceRef = useRef(26);
  const flashRef = useRef(0);

  const [sequenceId, setSequenceId] = useState(SEQUENCES[1].id);
  const [p, setP] = useState(0.5);
  const [seed, setSeed] = useState(7);
  const [running, setRunning] = useState(true);
  const [pace, setPace] = useState(26);
  const [hud, setHud] = useState({ size: 0, levels: 1, remaining: TOTAL, comparisons: 0, linear: 0 });

  const refreshHud = useCallback(() => {
    const run = runRef.current;
    setHud({
      size: run.list.size,
      levels: run.list.level,
      remaining: run.queue.length,
      comparisons: run.comparisons,
      linear: run.linear,
    });
  }, []);

  const reset = useCallback(
    (sequence: Sequence, prob: number, s: number) => {
      runRef.current = freshRun(sequence, prob, s);
      flashRef.current = 0;
      refreshHud();
    },
    [refreshHud]
  );

  const insertNext = useCallback(() => {
    const run = runRef.current;
    const key = run.queue.shift();
    if (key === undefined) return false;
    const result = insert(run.list, key);
    run.lastInserted = key;
    run.lastLevel = result.level;
    run.searchKey = null;
    run.searchPath = new Set();
    flashRef.current = 30;
    return true;
  }, []);

  // Searching is the whole argument, so the page shows the route it takes.
  const runSearch = useCallback((key: number) => {
    const run = runRef.current;
    const result = search(run.list, key);
    run.searchKey = key;
    run.searchFound = result.found;
    run.comparisons = result.comparisons;
    run.linear = linearComparisons(run.list, key);
    run.searchPath = new Set(result.path.map((hop) => `${hop.level}:${hop.from.key}`));
    run.lastInserted = null;
    flashRef.current = 90;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: W, height: H } = canvas;
    const run = runRef.current;
    const list = run.list;
    const keys = toArray(list);

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    const pad = 24;
    const laneH = Math.min(42, Math.max(22, (H - pad * 2 - 40) / Math.max(1, list.level)));
    const colW = Math.max(16, Math.min(44, (W - pad * 2 - 46) / Math.max(1, keys.length)));
    const ox = pad + 42;
    const oy = pad + 10;
    const columnOf = new Map<number, number>();
    keys.forEach((key, i) => columnOf.set(key, i));

    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(0,255,65,0.4)";
    ctx.fillText(
      "express lanes — a node reaches level k when k coin flips in a row come up heads",
      pad,
      pad - 10
    );

    // Lanes top-down, so level 1 (which holds everything) sits at the bottom.
    for (let level = list.level - 1; level >= 0; level--) {
      const y = oy + (list.level - 1 - level) * laneH;
      ctx.fillStyle = "rgba(0,255,65,0.35)";
      ctx.fillText(`L${level + 1}`, pad, y + laneH / 2 - 5);

      ctx.strokeStyle = "rgba(0,255,65,0.12)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ox - 14, y + laneH / 2);
      ctx.lineTo(W - pad, y + laneH / 2);
      ctx.stroke();

      // The sentinel each lane starts from.
      ctx.fillStyle = "rgba(0,255,65,0.22)";
      ctx.fillRect(ox - 20, y + laneH / 2 - 7, 12, 14);

      const nodes = lane(list, level);
      for (const node of nodes) {
        const col = columnOf.get(node.key) ?? 0;
        const x = ox + col * colW;
        const onPath = flashRef.current > 0 && run.searchPath.has(`${level}:${node.key}`);
        const isTarget = run.searchKey === node.key && flashRef.current > 0;
        const justInserted = run.lastInserted === node.key && flashRef.current > 0;

        ctx.fillStyle = isTarget
          ? "#ffffff"
          : justInserted
            ? "#ffbe3c"
            : onPath
              ? "#00cfff"
              : "rgba(0,255,65,0.5)";
        const w = Math.min(colW - 3, 30);
        ctx.fillRect(x, y + laneH / 2 - 8, w, 16);

        if (colW >= 22) {
          ctx.fillStyle = "#04140a";
          ctx.font = "10px monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(node.key), x + w / 2, y + laneH / 2);
          ctx.textAlign = "left";
          ctx.textBaseline = "top";
        }
      }
    }
    if (flashRef.current > 0) flashRef.current--;

    // ── the comparison that justifies the structure ────────────────────────
    const footY = oy + list.level * laneH + 18;
    if (footY < H - 30) {
      if (run.searchKey !== null) {
        ctx.fillStyle = run.searchFound ? "#00cfff" : "rgba(255,85,85,0.9)";
        ctx.fillText(
          run.searchFound
            ? `searched for ${run.searchKey}: found in ${run.comparisons} comparisons`
            : `searched for ${run.searchKey}: absent, ${run.comparisons} comparisons`,
          pad,
          footY
        );
        ctx.fillStyle = "rgba(255,120,120,0.8)";
        ctx.fillText(
          `walking level 1 alone would have taken ${run.linear}`,
          pad,
          footY + 15
        );

        const barY = footY + 34;
        const barW = Math.min(360, W - pad * 2 - 90);
        const worst = Math.max(run.linear, run.comparisons, 1);
        const rows: [string, number, string][] = [
          ["skip list", run.comparisons, "#00cfff"],
          ["linear", run.linear, "rgba(255,120,120,0.85)"],
        ];
        rows.forEach(([label, value, colour], i) => {
          const y = barY + i * 15;
          ctx.fillStyle = "rgba(0,255,65,0.4)";
          ctx.fillText(label, pad, y);
          ctx.fillStyle = "rgba(0,255,65,0.12)";
          ctx.fillRect(pad + 58, y, barW, 9);
          ctx.fillStyle = colour;
          ctx.fillRect(pad + 58, y, barW * (value / worst), 9);
          ctx.fillStyle = colour;
          ctx.fillText(String(value), pad + 64 + barW, y);
        });
      } else if (run.lastInserted !== null) {
        ctx.fillStyle = "#ffbe3c";
        ctx.fillText(
          `inserted ${run.lastInserted} — the coin came up heads ${run.lastLevel - 1} time${
            run.lastLevel === 2 ? "" : "s"
          }, so it sits on ${run.lastLevel} level${run.lastLevel === 1 ? "" : "s"}`,
          pad,
          footY
        );
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
        if (insertNext()) refreshHud();
      }
      draw();
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [draw, insertNext, refreshHud]);

  const sequence = SEQUENCES.find((s) => s.id === sequenceId) ?? SEQUENCES[1];

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">skip list</span>
        </div>
        <div className="text-xs text-primary/50 tabular-nums flex gap-3 flex-wrap">
          <span>{hud.size} keys</span>
          <span>{hud.levels} levels</span>
          <span>{hud.remaining} left</span>
          {hud.comparisons > 0 && (
            <>
              <span className="text-[#00cfff]">{hud.comparisons} comparisons</span>
              <span className="text-red-400">{hud.linear} if linear</span>
            </>
          )}
        </div>
      </div>

      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-2">
        <span className="text-primary/30 text-xs mr-1">insert order</span>
        {SEQUENCES.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setSequenceId(s.id);
              reset(s, p, seed);
            }}
            title={s.note}
            className={`px-2.5 py-1 text-xs border transition-colors ${
              s.id === sequenceId
                ? "border-primary bg-primary/15 text-primary"
                : "border-primary/25 text-primary/60 hover:border-primary hover:text-primary"
            }`}
          >
            {s.label}
          </button>
        ))}
        <span className="text-primary/30 text-xs hidden lg:inline ml-1">{sequence.note}</span>
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
            insertNext();
            refreshHud();
            draw();
          }}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ⇥ insert next
        </button>
        <button
          onClick={() => {
            while (insertNext());
            refreshHud();
            draw();
          }}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ⏭ insert all
        </button>
        <button
          onClick={() => {
            const keys = toArray(runRef.current.list);
            if (keys.length === 0) return;
            runningRef.current = false;
            setRunning(false);
            runSearch(keys[Math.floor(keys.length * 0.8)]);
            refreshHud();
            draw();
          }}
          title="search a key near the far end, where the express lanes earn their keep"
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ⌕ search a far key
        </button>
        <button
          onClick={() => {
            const keys = toArray(runRef.current.list);
            if (keys.length === 0) return;
            remove(runRef.current.list, keys[Math.floor(Math.random() * keys.length)]);
            refreshHud();
            draw();
          }}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ✕ remove one
        </button>
        <button
          onClick={() => {
            const next = (seed * 16807 + 11) % 2147483647;
            setSeed(next);
            reset(sequence, p, next);
          }}
          title="the structure is built from coin flips, so a new seed is a different shape"
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ⟳ reflip
        </button>

        <Slider
          label="p"
          title="promotion probability — higher builds taller lanes and searches faster, at the cost of pointers"
          min={0.1}
          max={0.8}
          step={0.05}
          value={p}
          fmt={(v) => v.toFixed(2)}
          onChange={(v) => {
            setP(v);
            reset(sequence, v, seed);
          }}
        />
        <Slider
          label="pace"
          title="frames between inserts"
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
          amber = the node just inserted, at the height its coin flips bought · cyan = the route a
          search takes, running right along the top lane and dropping a level whenever the next hop
          would overshoot · nothing here ever rebalances
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
