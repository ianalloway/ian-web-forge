import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  DISTRIBUTIONS,
  Node,
  Point,
  Rect,
  WORLD,
  WORLD_BOUNDS,
  build,
  bruteForceNearest,
  countNodes,
  depthOf,
  makeRng,
  movePoints,
  newNode,
  nearest,
  queryRange,
} from "../features/quadtree/quadtree";

export default function Quadtree() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<Point[]>(DISTRIBUTIONS[0].place(900, makeRng(9)));
  // Seeded empty and built in the mount effect: reading pointsRef during
  // render would be reading a ref mid-render.
  const treeRef = useRef<Node>(newNode(WORLD_BOUNDS));
  const queryRef = useRef<Rect>({ x: WORLD * 0.5, y: WORLD * 0.5, hw: 110, hh: 110 });
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const runningRef = useRef(true);
  const capacityRef = useRef(4);
  const showTreeRef = useRef(true);
  const orbitRef = useRef(0);

  const [distId, setDistId] = useState(DISTRIBUTIONS[0].id);
  const [count, setCount] = useState(900);
  const [capacity, setCapacity] = useState(4);
  const [querySize, setQuerySize] = useState(110);
  const [running, setRunning] = useState(true);
  const [showTree, setShowTree] = useState(true);
  const [hud, setHud] = useState({ nodes: 0, depth: 0, found: 0, checks: 0, brute: 0, rejected: 0 });

  const rebuildPoints = useCallback((id: string, n: number) => {
    const dist = DISTRIBUTIONS.find((d) => d.id === id) ?? DISTRIBUTIONS[0];
    pointsRef.current = dist.place(n, makeRng(9));
    treeRef.current = build(pointsRef.current, WORLD_BOUNDS, capacityRef.current);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: W, height: H } = canvas;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    const pad = 16;
    const size = Math.max(60, Math.min(W - pad * 2, H - pad * 2));
    const ox = (W - size) / 2;
    const oy = (H - size) / 2;
    const s = (v: number) => (v / WORLD) * size;
    const sx = (v: number) => ox + s(v);
    const sy = (v: number) => oy + s(v);

    const tree = treeRef.current;
    const range = queryRef.current;
    const result = queryRange(tree, range);
    const found = new Set(result.found);

    // The subdivision itself: deeper nodes are drawn brighter, so the tree's
    // shape shows where the points actually are.
    if (showTreeRef.current) {
      const maxDepth = Math.max(1, depthOf(tree));
      const drawNode = (node: Node) => {
        const t = node.depth / maxDepth;
        ctx.strokeStyle = `rgba(0,255,65,${0.06 + 0.22 * t})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(
          sx(node.bounds.x - node.bounds.hw),
          sy(node.bounds.y - node.bounds.hh),
          s(node.bounds.hw * 2),
          s(node.bounds.hh * 2)
        );
        if (node.divided) {
          drawNode(node.nw!);
          drawNode(node.ne!);
          drawNode(node.sw!);
          drawNode(node.se!);
        }
      };
      drawNode(tree);
    }

    // The leaves the query actually opened. Shading every visited node would
    // include the root and its children, which are always visited, and make the
    // query look as though it touched half the world.
    for (const node of result.nodesVisited) {
      if (node.divided) continue;
      ctx.fillStyle = "rgba(0,207,255,0.16)";
      ctx.fillRect(
        sx(node.bounds.x - node.bounds.hw),
        sy(node.bounds.y - node.bounds.hh),
        s(node.bounds.hw * 2),
        s(node.bounds.hh * 2)
      );
    }

    for (const p of pointsRef.current) {
      const hit = found.has(p);
      ctx.fillStyle = hit ? "#00cfff" : "rgba(0,255,65,0.45)";
      ctx.fillRect(sx(p.x) - (hit ? 1.6 : 1), sy(p.y) - (hit ? 1.6 : 1), hit ? 3.2 : 2, hit ? 3.2 : 2);
    }

    ctx.strokeStyle = "#00cfff";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(sx(range.x - range.hw), sy(range.y - range.hh), s(range.hw * 2), s(range.hh * 2));

    // Nearest neighbour to the query centre, with the same pruning idea.
    const near = nearest(tree, range.x, range.y);
    if (near.point) {
      ctx.strokeStyle = "rgba(255,190,60,0.7)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx(range.x), sy(range.y));
      ctx.lineTo(sx(near.point.x), sy(near.point.y));
      ctx.stroke();
      ctx.fillStyle = "#ffbe3c";
      ctx.beginPath();
      ctx.arc(sx(near.point.x), sy(near.point.y), 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Counters: what the query cost, against what brute force would have cost.
    const brute = pointsRef.current.length;
    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const lines = [
      `points examined by the tree: ${result.checks}`,
      `points brute force would examine: ${brute}`,
      `subtrees dismissed untouched: ${result.nodesRejected}`,
      `nearest neighbour checks: ${near.checks} of ${brute}`,
    ];
    lines.forEach((line, i) => {
      ctx.fillStyle = i === 0 ? "#00cfff" : i === 1 ? "rgba(255,120,120,0.8)" : "rgba(0,255,65,0.45)";
      ctx.fillText(line, pad, pad + i * 14);
    });
    ctx.textBaseline = "middle";

    return { result, brute, near };
  }, []);

  const refreshHud = useCallback(() => {
    const tree = treeRef.current;
    const result = queryRange(tree, queryRef.current);
    setHud({
      nodes: countNodes(tree),
      depth: depthOf(tree),
      found: result.found.length,
      checks: result.checks,
      brute: pointsRef.current.length,
      rejected: result.nodesRejected,
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
    treeRef.current = build(pointsRef.current, WORLD_BOUNDS, capacityRef.current);
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const size = Math.max(60, Math.min(rect.width - 32, rect.height - 32));
      const ox = (rect.width - size) / 2;
      const oy = (rect.height - size) / 2;
      const x = ((e.clientX - rect.left - ox) / size) * WORLD;
      const y = ((e.clientY - rect.top - oy) / size) * WORLD;
      pointerRef.current = x >= 0 && x <= WORLD && y >= 0 && y <= WORLD ? { x, y } : null;
    };
    const onLeave = () => {
      pointerRef.current = null;
    };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);

    let raf = 0;
    let frame = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (runningRef.current) {
        movePoints(pointsRef.current);
        // The tree is rebuilt from scratch every frame: for a few thousand
        // moving points that is cheaper and simpler than updating it in place.
        treeRef.current = build(pointsRef.current, WORLD_BOUNDS, capacityRef.current);
      }
      // The query follows the cursor, and drifts on its own when the cursor is
      // elsewhere so the page is never static.
      const pointer = pointerRef.current;
      if (pointer) {
        queryRef.current = { ...queryRef.current, x: pointer.x, y: pointer.y };
      } else {
        orbitRef.current += 0.006;
        queryRef.current = {
          ...queryRef.current,
          x: WORLD / 2 + Math.cos(orbitRef.current) * WORLD * 0.28,
          y: WORLD / 2 + Math.sin(orbitRef.current * 1.3) * WORLD * 0.28,
        };
      }
      draw();
      if (++frame % 10 === 0) refreshHud();
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, [draw, refreshHud]);

  const dist = DISTRIBUTIONS.find((d) => d.id === distId) ?? DISTRIBUTIONS[0];
  const speedup = hud.checks > 0 ? hud.brute / hud.checks : 0;

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">quadtree</span>
        </div>
        <div className="text-xs text-primary/50 tabular-nums flex gap-3 flex-wrap">
          <span>{hud.brute} points</span>
          <span>{hud.nodes} nodes, depth {hud.depth}</span>
          <span className="text-[#00cfff]">{hud.found} in range</span>
          <span>{hud.checks} checks vs {hud.brute}</span>
          {speedup > 1 && <span className="text-primary">{speedup.toFixed(0)}× fewer</span>}
        </div>
      </div>

      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-2">
        <span className="text-primary/30 text-xs mr-1">points</span>
        {DISTRIBUTIONS.map((d) => (
          <button
            key={d.id}
            onClick={() => {
              setDistId(d.id);
              rebuildPoints(d.id, count);
            }}
            title={d.note}
            className={`px-2.5 py-1 text-xs border transition-colors ${
              d.id === distId
                ? "border-primary bg-primary/15 text-primary"
                : "border-primary/25 text-primary/60 hover:border-primary hover:text-primary"
            }`}
          >
            {d.label}
          </button>
        ))}
        <span className="text-primary/30 text-xs hidden lg:inline ml-1">{dist.note}</span>
      </div>

      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          onClick={() => {
            runningRef.current = !running;
            setRunning(!running);
          }}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          {running ? "⏸ freeze" : "▶ move"}
        </button>
        <button
          onClick={() => {
            showTreeRef.current = !showTree;
            setShowTree(!showTree);
          }}
          className={`px-3 py-1 text-xs border transition-colors ${
            showTree
              ? "border-primary bg-primary/15 text-primary"
              : "border-primary/30 hover:border-primary text-primary/70 hover:text-primary"
          }`}
        >
          {showTree ? "◼ hide tree" : "◇ show tree"}
        </button>
        <button
          onClick={() => rebuildPoints(distId, count)}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ↺ rescatter
        </button>

        <Slider
          label="points"
          title="how many points are in the world"
          min={100}
          max={4000}
          step={100}
          value={count}
          fmt={(v) => `${v}`}
          onChange={(v) => {
            setCount(v);
            rebuildPoints(distId, v);
          }}
        />
        <Slider
          label="capacity"
          title="points a node holds before it splits — higher means a shallower tree and more checks"
          min={1}
          max={16}
          step={1}
          value={capacity}
          fmt={(v) => `${v}`}
          onChange={(v) => {
            setCapacity(v);
            capacityRef.current = v;
            treeRef.current = build(pointsRef.current, WORLD_BOUNDS, v);
          }}
        />
        <Slider
          label="query"
          title="size of the search box"
          min={20}
          max={320}
          step={5}
          value={querySize}
          fmt={(v) => `${v}`}
          onChange={(v) => {
            setQuerySize(v);
            queryRef.current = { ...queryRef.current, hw: v, hh: v };
          }}
        />
      </div>

      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full cursor-crosshair" />
        <div className="absolute bottom-1 left-4 right-4 text-xs text-primary/40 pointer-events-none">
          move the cursor to steer the search box · cyan = points the query returned, amber = the
          nearest neighbour · a square that does not overlap the box is dismissed whole, along with
          everything inside it
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
      <span className="text-primary/60 text-xs w-9 tabular-nums">{fmt(value)}</span>
    </div>
  );
}
