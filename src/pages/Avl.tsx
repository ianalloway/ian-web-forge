import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  SEQUENCES,
  Node,
  Rotation,
  Sequence,
  height,
  insertAVL,
  insertBST,
  layout,
  lookupCost,
  size,
} from "../features/avl/tree";

const TOTAL = 31; // keys in a full run

interface TreeState {
  avl: Node | null;
  bst: Node | null;
  queue: number[];
  placed: number[];
  lastKey: number | null;
  lastRotations: Rotation[];
  rotationCount: number;
}

function freshState(seq: Sequence): TreeState {
  return {
    avl: null,
    bst: null,
    queue: seq.keys(TOTAL),
    placed: [],
    lastKey: null,
    lastRotations: [],
    rotationCount: 0,
  };
}

export default function Avl() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<TreeState>(freshState(SEQUENCES[0]));
  const runningRef = useRef(true);
  const speedRef = useRef(22); // frames between inserts
  const flashRef = useRef(0); // frames left highlighting the last rotation

  const [seqId, setSeqId] = useState(SEQUENCES[0].id);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(22);
  const [hud, setHud] = useState({ n: 0, avlH: 0, bstH: 0, rotations: 0, avlWorst: 0, bstWorst: 0, remaining: TOTAL });

  const refreshHud = useCallback(() => {
    const s = stateRef.current;
    const worst = (root: Node | null) =>
      s.placed.length === 0 ? 0 : Math.max(...s.placed.map((k) => lookupCost(root, k)));
    setHud({
      n: size(s.avl),
      avlH: height(s.avl),
      bstH: height(s.bst),
      rotations: s.rotationCount,
      avlWorst: worst(s.avl),
      bstWorst: worst(s.bst),
      remaining: s.queue.length,
    });
  }, []);

  const reset = useCallback(
    (seq: Sequence) => {
      stateRef.current = freshState(seq);
      flashRef.current = 0;
      refreshHud();
    },
    [refreshHud]
  );

  const insertNext = useCallback(() => {
    const s = stateRef.current;
    const key = s.queue.shift();
    if (key === undefined) return false;
    const a = insertAVL(s.avl, key);
    s.avl = a.root;
    s.bst = insertBST(s.bst, key).root;
    s.lastKey = key;
    s.lastRotations = a.rotations;
    s.rotationCount += a.rotations.length;
    s.placed.push(key);
    if (a.rotations.length > 0) flashRef.current = 26;
    return true;
  }, []);

  const drawTree = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      root: Node | null,
      x0: number,
      y0: number,
      w: number,
      h: number,
      title: string,
      subtitle: string,
      accent: string,
      lastKey: number | null,
      rotatedKeys: Set<number>
    ) => {
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = accent;
      ctx.fillText(title, x0, y0 - 15);
      ctx.fillStyle = "rgba(0,255,65,0.35)";
      ctx.fillText(subtitle, x0 + ctx.measureText(title).width + 10, y0 - 15);

      ctx.strokeStyle = "rgba(0,255,65,0.12)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);

      const { nodes, width, depth } = layout(root);
      if (nodes.length === 0) return;

      const pad = 12;
      const stepX = (w - pad * 2) / Math.max(1, width);
      const stepY = (h - pad * 2) / Math.max(1, depth);
      const nx = (x: number) => x0 + pad + (x + 0.5) * stepX;
      const ny = (d: number) => y0 + pad + d * stepY;
      // A degenerate tree is tall and thin, so the radius has to shrink with
      // whichever dimension ran out first.
      const r = Math.max(2.5, Math.min(13, stepX * 0.42, stepY * 0.38));

      ctx.strokeStyle = "rgba(0,255,65,0.28)";
      ctx.lineWidth = 1;
      for (const nd of nodes) {
        if (!nd.parent) continue;
        ctx.beginPath();
        ctx.moveTo(nx(nd.parent.x), ny(nd.parent.depth));
        ctx.lineTo(nx(nd.x), ny(nd.depth));
        ctx.stroke();
      }

      const showKeys = r >= 7;
      for (const nd of nodes) {
        const cx = nx(nd.x);
        const cy = ny(nd.depth);
        const isLast = nd.key === lastKey;
        const rotated = rotatedKeys.has(nd.key);
        ctx.fillStyle = rotated
          ? "rgba(255,190,60,0.9)"
          : isLast
            ? "#eafff0"
            : Math.abs(nd.balance) === 1
              ? "rgba(0,255,65,0.55)"
              : "rgba(0,255,65,0.3)";
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        if (isLast) {
          ctx.strokeStyle = "rgba(255,255,255,0.7)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
          ctx.stroke();
        }
        if (showKeys) {
          ctx.fillStyle = "#04140a";
          ctx.font = `${Math.round(r * 1.05)}px monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(nd.key), cx, cy + 0.5);
          ctx.textAlign = "left";
          ctx.textBaseline = "top";
        }
      }
    },
    []
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: W, height: H } = canvas;
    const s = stateRef.current;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    const pad = 16;
    const gap = 34;
    const paneH = (H - pad * 2 - gap) / 2;
    const paneW = W - pad * 2;
    const rotated = new Set<number>(
      flashRef.current > 0 ? s.lastRotations.flatMap((r) => [r.pivot, r.newRoot]) : []
    );

    const avlH = height(s.avl);
    const bstH = height(s.bst);
    drawTree(
      ctx,
      s.avl,
      pad,
      pad + 16,
      paneW,
      paneH - 16,
      "AVL tree",
      `height ${avlH} · rebalanced ${s.rotationCount}×`,
      "#00ff41",
      s.lastKey,
      rotated
    );
    drawTree(
      ctx,
      s.bst,
      pad,
      pad + paneH + gap,
      paneW,
      paneH - 16,
      "plain BST",
      `height ${bstH} · same keys, same order, no rebalancing`,
      "#ff8a3d",
      s.lastKey,
      new Set()
    );

    if (flashRef.current > 0 && s.lastRotations.length > 0) {
      const r = s.lastRotations[s.lastRotations.length - 1];
      ctx.font = "11px monospace";
      ctx.textAlign = "right";
      ctx.textBaseline = "top";
      ctx.fillStyle = "rgba(255,190,60,0.95)";
      ctx.fillText(
        `${r.kind} rotation — ${r.newRoot} takes over from ${r.pivot}`,
        W - pad,
        pad + 1
      );
      ctx.textAlign = "left";
      flashRef.current--;
    }
  }, [drawTree]);

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
      if (runningRef.current && ++frame % speedRef.current === 0) {
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

  const seq = SEQUENCES.find((s) => s.id === seqId) ?? SEQUENCES[0];

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">avl vs plain bst</span>
        </div>
        <div className="text-xs text-primary/50 tabular-nums flex gap-3 flex-wrap">
          <span>{hud.n} keys</span>
          <span className="text-primary">avl height {hud.avlH}</span>
          <span className="text-[#ff8a3d]">bst height {hud.bstH}</span>
          <span>{hud.rotations} rotations</span>
          {hud.n > 0 && (
            <span title="comparisons for the worst lookup in each tree">
              worst lookup {hud.avlWorst} vs {hud.bstWorst}
            </span>
          )}
        </div>
      </div>

      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-2">
        <span className="text-primary/30 text-xs mr-1">insert order</span>
        {SEQUENCES.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setSeqId(s.id);
              reset(s);
            }}
            title={s.note}
            className={`px-2.5 py-1 text-xs border transition-colors ${
              s.id === seqId
                ? "border-primary bg-primary/15 text-primary"
                : "border-primary/25 text-primary/60 hover:border-primary hover:text-primary"
            }`}
          >
            {s.label}
          </button>
        ))}
        <span className="text-primary/30 text-xs hidden md:inline ml-1">{seq.note}</span>
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
            flashRef.current = 0;
            refreshHud();
            draw();
          }}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ⏭ insert all
        </button>
        <button
          onClick={() => reset(seq)}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ↺ clear
        </button>
        <span className="text-primary/30 text-xs">{hud.remaining} left</span>

        <Slider
          label="pace"
          title="frames between inserts — lower is faster"
          min={2}
          max={60}
          step={1}
          value={speed}
          fmt={(v) => `${v}f`}
          onChange={(v) => {
            setSpeed(v);
            speedRef.current = v;
          }}
        />
      </div>

      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute bottom-1 left-4 right-4 text-xs text-primary/40 pointer-events-none">
          both trees receive the same keys in the same order · amber = the nodes a rotation just
          moved · white = the key that went in last · with sorted input the plain BST is a linked
          list, and a lookup has to walk all of it
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
      <span className="text-primary/60 text-xs w-8 tabular-nums">{fmt(value)}</span>
    </div>
  );
}
