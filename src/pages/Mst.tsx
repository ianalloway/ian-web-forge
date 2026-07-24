import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Edge, Pt, kruskalMST, primMST } from "../features/mst/mst";

type Algo = "prim" | "kruskal";

export default function Mst() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ptsRef = useRef<Pt[]>([]); // normalized [0,1]
  const primRef = useRef<Edge[]>([]);
  const kruskalRef = useRef<Edge[]>([]);
  const weightRef = useRef(0);
  const algoRef = useRef<Algo>("prim");
  const tRef = useRef(0);
  const speedRef = useRef(0.6);
  const runningRef = useRef(true);

  const [algo, setAlgo] = useState<Algo>("prim");
  const [nodes, setNodes] = useState(80);
  const [placed, setPlaced] = useState(0);

  const activeEdges = useCallback(() => (algoRef.current === "prim" ? primRef.current : kruskalRef.current), []);

  const regenerate = useCallback((n: number) => {
    const pts: Pt[] = Array.from({ length: n }, () => ({
      x: 0.03 + Math.random() * 0.94,
      y: 0.03 + Math.random() * 0.94,
    }));
    ptsRef.current = pts;
    const p = primMST(pts);
    const k = kruskalMST(pts);
    primRef.current = p.edges;
    kruskalRef.current = k.edges;
    weightRef.current = p.totalWeight; // same for both
    tRef.current = 0;
    setPlaced(0);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resize();
    window.addEventListener("resize", resize);
    if (ptsRef.current.length === 0) regenerate(nodes);

    let raf = 0;
    let frame = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const W = canvas.width;
      const H = canvas.height;
      const pts = ptsRef.current;
      const edges = activeEdges();

      if (runningRef.current && tRef.current < edges.length) {
        tRef.current = Math.min(edges.length, tRef.current + speedRef.current);
      }

      // Centered square keeps the geometry undistorted.
      const S = Math.min(W, H) * 0.92;
      const ox = (W - S) / 2;
      const oy = (H - S) / 2;
      const sx = (p: Pt) => ox + p.x * S;
      const sy = (p: Pt) => oy + p.y * S;

      ctx.fillStyle = "#050805";
      ctx.fillRect(0, 0, W, H);

      const shown = Math.floor(tRef.current);
      // Edges placed so far.
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = "rgba(0,220,80,0.75)";
      ctx.beginPath();
      for (let i = 0; i < shown && i < edges.length; i++) {
        const [a, b] = edges[i];
        ctx.moveTo(sx(pts[a]), sy(pts[a]));
        ctx.lineTo(sx(pts[b]), sy(pts[b]));
      }
      ctx.stroke();
      // Most recent edge highlighted.
      if (shown > 0 && shown <= edges.length) {
        const [a, b] = edges[shown - 1];
        ctx.strokeStyle = "#c9ffd6";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx(pts[a]), sy(pts[a]));
        ctx.lineTo(sx(pts[b]), sy(pts[b]));
        ctx.stroke();
      }

      // Nodes.
      ctx.fillStyle = "#00ff41";
      for (const p of pts) {
        ctx.beginPath();
        ctx.arc(sx(p), sy(p), 2.4, 0, Math.PI * 2);
        ctx.fill();
      }

      if ((frame++ & 3) === 0) setPlaced(shown);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [activeEdges, regenerate, nodes]);

  const total = Math.max(0, nodes - 1);

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">minimum spanning tree</span>
        </div>
        <div className="text-xs text-primary/40 tabular-nums">
          {algo} · {placed}/{total} edges
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-primary/40 text-xs mr-1">algorithm</span>
          {(["prim", "kruskal"] as Algo[]).map((a) => (
            <button
              key={a}
              onClick={() => {
                setAlgo(a);
                algoRef.current = a;
                tRef.current = 0;
                setPlaced(0);
              }}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                algo === a
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/20 text-primary/50 hover:border-primary/50"
              }`}
            >
              {a}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-primary/40 text-xs mr-1">nodes</span>
          {[30, 60, 100, 160].map((n) => (
            <button
              key={n}
              onClick={() => {
                setNodes(n);
                regenerate(n);
              }}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                nodes === n
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/20 text-primary/50 hover:border-primary/50"
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">speed</span>
          <input
            type="range"
            min={0.1}
            max={4}
            step={0.1}
            defaultValue={0.6}
            onChange={(e) => {
              speedRef.current = Number(e.target.value);
            }}
            className="w-20 accent-primary"
          />
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => {
              tRef.current = 0;
              setPlaced(0);
            }}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ↺ replay
          </button>
          <button
            onClick={() => regenerate(nodes)}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ⟳ new points
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute bottom-3 left-4 text-xs text-primary/40 pointer-events-none max-w-xl">
          the cheapest web of edges connecting every point with no cycles. prim grows one tree from a
          seed; kruskal glues the globally-shortest edges across a scattered forest — different paths to
          the exact same tree.
        </div>
      </div>
    </div>
  );
}
