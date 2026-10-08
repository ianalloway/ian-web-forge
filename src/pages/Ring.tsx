import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  NODE_NAMES,
  RING_SIZE,
  Ring as HashRing,
  addNode,
  clone,
  distribution,
  hash,
  loadImbalance,
  lookup,
  makeKeys,
  naiveRemapFraction,
  newRing,
  remapFraction,
  removeNode,
} from "../features/ring/ring";

const COLOURS = ["#00ff41", "#00cfff", "#ffbe3c", "#ff5d8f", "#b08cff", "#5fe8c0", "#ff8a3d", "#9bff6a"];

interface LastChange {
  kind: "added" | "removed";
  node: string;
  consistent: number;
  naive: number;
}

export default function Ring() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ringRef = useRef<HashRing>(newRing(120, NODE_NAMES.slice(0, 4)));
  const keysRef = useRef<string[]>(makeKeys(2000));
  const movedRef = useRef<Set<string>>(new Set());
  const flashRef = useRef(0);

  const [replicas, setReplicas] = useState(120);
  const [keyCount, setKeyCount] = useState(2000);
  const [nodeCount, setNodeCount] = useState(4);
  const [lastChange, setLastChange] = useState<LastChange | null>(null);
  const [hud, setHud] = useState({ imbalance: 0, spread: "" });

  const refreshHud = useCallback(() => {
    const ring = ringRef.current;
    const keys = keysRef.current;
    const counts = [...distribution(ring, keys).values()];
    const lo = Math.min(...counts);
    const hi = Math.max(...counts);
    setHud({
      imbalance: loadImbalance(ring, keys),
      spread: counts.length ? `${lo}–${hi}` : "",
    });
  }, []);

  const rebuild = useCallback(
    (nodes: number, reps: number, keys: number) => {
      ringRef.current = newRing(reps, NODE_NAMES.slice(0, nodes));
      keysRef.current = makeKeys(keys);
      movedRef.current = new Set();
      setLastChange(null);
      refreshHud();
    },
    [refreshHud]
  );

  // The measurement the page exists for: change the cluster, then count what
  // actually moved, both ways.
  const changeCluster = useCallback(
    (kind: "added" | "removed") => {
      const before = ringRef.current;
      const keys = keysRef.current;
      if (kind === "added" && before.nodes.length >= NODE_NAMES.length) return;
      if (kind === "removed" && before.nodes.length <= 1) return;

      const node = kind === "added" ? NODE_NAMES[before.nodes.length] : before.nodes[before.nodes.length - 1];
      const after = clone(before);
      if (kind === "added") addNode(after, node);
      else removeNode(after, node);

      const beforeNodes = before.nodes.slice();
      const afterNodes = after.nodes.slice();
      const moved = new Set<string>();
      for (const key of keys) if (lookup(before, key) !== lookup(after, key)) moved.add(key);

      ringRef.current = after;
      movedRef.current = moved;
      flashRef.current = 140;
      setNodeCount(after.nodes.length);
      setLastChange({
        kind,
        node,
        consistent: remapFraction(before, after, keys),
        naive: naiveRemapFraction(beforeNodes, afterNodes, keys),
      });
      refreshHud();
    },
    [refreshHud]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: W, height: H } = canvas;
    const ring = ringRef.current;
    const keys = keysRef.current;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    const panelW = Math.min(250, W * 0.26);
    const cx = (W - panelW) / 2;
    const cy = H / 2;
    const radius = Math.max(60, Math.min((W - panelW) * 0.36, H * 0.38));
    const angle = (position: number) => (position / RING_SIZE) * Math.PI * 2 - Math.PI / 2;
    const colourOf = (node: string) => COLOURS[ring.nodes.indexOf(node) % COLOURS.length];

    // The arcs: each placement owns the stretch of circle behind it, so the
    // ring reads as the ownership map it is.
    if (ring.placements.length > 0) {
      for (let i = 0; i < ring.placements.length; i++) {
        const start = ring.placements[(i - 1 + ring.placements.length) % ring.placements.length].position;
        const end = ring.placements[i].position;
        const a0 = angle(start);
        const a1 = angle(end);
        ctx.strokeStyle = colourOf(ring.placements[i].node);
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, a0, a1, false);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // Keys, at their hash angle, just inside the ring.
    const moved = movedRef.current;
    for (const key of keys) {
      const a = angle(hash(key));
      const owner = lookup(ring, key);
      const justMoved = flashRef.current > 0 && moved.has(key);
      const r = radius - 20 - (justMoved ? 6 : 0);
      ctx.fillStyle = justMoved ? "#ffffff" : owner ? colourOf(owner) : "rgba(0,255,65,0.3)";
      ctx.globalAlpha = justMoved ? 0.95 : 0.4;
      const size = justMoved ? 2.6 : 1.4;
      ctx.fillRect(cx + Math.cos(a) * r - size / 2, cy + Math.sin(a) * r - size / 2, size, size);
    }
    ctx.globalAlpha = 1;
    if (flashRef.current > 0) flashRef.current--;

    // Node placements as ticks outside the ring.
    for (const placement of ring.placements) {
      const a = angle(placement.position);
      ctx.strokeStyle = colourOf(placement.node);
      ctx.globalAlpha = ring.replicas > 40 ? 0.35 : 0.9;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (radius + 5), cy + Math.sin(a) * (radius + 5));
      ctx.lineTo(cx + Math.cos(a) * (radius + 14), cy + Math.sin(a) * (radius + 14));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(0,255,65,0.35)";
    ctx.fillText(`${keys.length} keys`, cx, cy - 8);
    ctx.fillText(`${ring.nodes.length} servers × ${ring.replicas} points`, cx, cy + 8);

    // ── the panel: who holds what, and what the last change cost ───────────
    const px = W - panelW + 6;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const counts = distribution(ring, keys);
    ctx.fillStyle = "rgba(0,255,65,0.4)";
    ctx.fillText("share of keys", px, 16);
    let y = 32;
    const barW = panelW - 90;
    const maxCount = Math.max(...counts.values(), 1);
    for (const node of ring.nodes) {
      const count = counts.get(node) ?? 0;
      ctx.fillStyle = colourOf(node);
      ctx.fillText(node.slice(0, 7), px, y + 1);
      ctx.fillStyle = "rgba(0,255,65,0.12)";
      ctx.fillRect(px + 52, y, barW, 7);
      ctx.fillStyle = colourOf(node);
      ctx.fillRect(px + 52, y, barW * (count / maxCount), 7);
      ctx.fillStyle = "rgba(0,255,65,0.45)";
      ctx.fillText(`${((count / keys.length) * 100).toFixed(1)}%`, px + 56 + barW, y + 1);
      y += 15;
    }

    if (lastChange) {
      y += 14;
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.fillText(`${lastChange.kind} ${lastChange.node}`, px, y);
      y += 16;
      const rows: [string, number, string][] = [
        ["this ring", lastChange.consistent, "#00ff41"],
        ["hash % n", lastChange.naive, "#ff5555"],
      ];
      for (const [label, value, colour] of rows) {
        ctx.fillStyle = "rgba(0,255,65,0.4)";
        ctx.fillText(label, px, y + 1);
        ctx.fillStyle = "rgba(0,255,65,0.12)";
        ctx.fillRect(px + 60, y, barW - 8, 9);
        ctx.fillStyle = colour;
        ctx.fillRect(px + 60, y, (barW - 8) * value, 9);
        ctx.fillStyle = colour;
        ctx.fillText(`${(value * 100).toFixed(0)}%`, px + 56 + barW, y + 1);
        y += 16;
      }
      ctx.fillStyle = "rgba(0,255,65,0.35)";
      ctx.fillText("of keys moved server", px, y + 2);
    }
    ctx.textBaseline = "middle";
  }, [lastChange]);

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
    const loop = () => {
      raf = requestAnimationFrame(loop);
      draw();
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [draw]);

  useEffect(() => {
    refreshHud();
  }, [refreshHud]);

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">consistent hashing</span>
        </div>
        <div className="text-xs text-primary/50 tabular-nums flex gap-3 flex-wrap">
          <span>{nodeCount} servers</span>
          <span>{keyCount.toLocaleString()} keys</span>
          <span>spread {hud.spread}</span>
          <span className={hud.imbalance < 0.15 ? "text-primary" : "text-[#ffbe3c]"}>
            imbalance {(hud.imbalance * 100).toFixed(1)}%
          </span>
          {lastChange && (
            <span>
              <span className="text-primary">{(lastChange.consistent * 100).toFixed(0)}%</span>
              <span className="text-primary/40"> moved vs </span>
              <span className="text-red-400">{(lastChange.naive * 100).toFixed(0)}%</span>
            </span>
          )}
        </div>
      </div>

      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          onClick={() => changeCluster("added")}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          + add a server
        </button>
        <button
          onClick={() => changeCluster("removed")}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          − remove a server
        </button>
        <button
          onClick={() => rebuild(nodeCount, replicas, keyCount)}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ↺ reset
        </button>

        <Slider
          label="replicas"
          title="virtual nodes per server — more points means a more even split"
          min={1}
          max={400}
          step={1}
          value={replicas}
          fmt={(v) => `${v}`}
          onChange={(v) => {
            setReplicas(v);
            rebuild(nodeCount, v, keyCount);
          }}
        />
        <Slider
          label="keys"
          title="how many keys are spread over the ring"
          min={200}
          max={6000}
          step={100}
          value={keyCount}
          fmt={(v) => `${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
          onChange={(v) => {
            setKeyCount(v);
            rebuild(nodeCount, replicas, v);
          }}
        />
      </div>

      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute bottom-1 left-4 right-4 text-xs text-primary/40 pointer-events-none">
          each key belongs to the first server clockwise from it · add a server and only the keys
          that turn white move — one arc per virtual node, so at 120 replicas that is 120 slivers
          spread around the ring rather than one block · drop replicas to 1 to see the single arc,
          and the lopsided split that makes virtual nodes necessary
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
      <span className="text-primary/60 text-xs w-10 tabular-nums">{fmt(value)}</span>
    </div>
  );
}
