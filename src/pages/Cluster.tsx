import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Pt,
  KMeansState,
  CLUSTER_COLORS,
  ScatterId,
  SCATTERS,
  initCentroids,
  assign,
  step,
  makeScatter,
} from "../features/cluster/kmeans";

const SCATTER_KEYS = Object.keys(SCATTERS) as ScatterId[];
const STEP_MS = 550; // pause between auto-run iterations so moves are visible

export default function Cluster() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<Pt[]>([]);
  const stateRef = useRef<KMeansState | null>(null);
  const runningRef = useRef(false);
  const kRef = useRef(3);

  const [k, setK] = useState(3);
  const [running, setRunning] = useState(false);
  const [iteration, setIteration] = useState(0);
  const [inertia, setInertia] = useState<number | null>(null);
  const [converged, setConverged] = useState(false);
  const [pointCount, setPointCount] = useState(0);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: W, height: H } = canvas;
    const points = pointsRef.current;
    const st = stateRef.current;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    // Points colored by assignment (dim white before clustering starts)
    points.forEach((p, i) => {
      const a = st ? st.assignments[i] : -1;
      ctx.fillStyle = a >= 0 ? CLUSTER_COLORS[a % CLUSTER_COLORS.length] + "cc" : "rgba(255,255,255,0.35)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Centroids as X markers with halo
    if (st) {
      st.centroids.forEach((c, i) => {
        const color = CLUSTER_COLORS[i % CLUSTER_COLORS.length];
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        const r = 9;
        ctx.beginPath();
        ctx.moveTo(c.x - r, c.y - r);
        ctx.lineTo(c.x + r, c.y + r);
        ctx.moveTo(c.x + r, c.y - r);
        ctx.lineTo(c.x - r, c.y + r);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(c.x, c.y, 14, 0, Math.PI * 2);
        ctx.strokeStyle = color + "44";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    }

    setPointCount(points.length);
  }, []);

  const syncState = useCallback(() => {
    const st = stateRef.current;
    setIteration(st?.iteration ?? 0);
    setInertia(st?.inertia ?? null);
    setConverged(st?.converged ?? false);
  }, []);

  const reset = useCallback(() => {
    stateRef.current = null;
    runningRef.current = false;
    setRunning(false);
    syncState();
    redraw();
  }, [redraw, syncState]);

  const seed = useCallback(() => {
    const points = pointsRef.current;
    if (points.length < kRef.current) return false;
    const centroids = initCentroids(points, kRef.current);
    stateRef.current = {
      centroids,
      assignments: assign(points, centroids),
      iteration: 0,
      converged: false,
      inertia: 0,
    };
    syncState();
    redraw();
    return true;
  }, [redraw, syncState]);

  const doStep = useCallback(() => {
    if (!stateRef.current) {
      if (!seed()) return;
      return; // first press just seeds; next presses iterate
    }
    stateRef.current = step(pointsRef.current, stateRef.current);
    syncState();
    redraw();
  }, [seed, redraw, syncState]);

  // Auto-run loop
  useEffect(() => {
    const id = setInterval(() => {
      if (!runningRef.current) return;
      if (!stateRef.current) {
        if (!seed()) {
          runningRef.current = false;
          setRunning(false);
        }
        return;
      }
      stateRef.current = step(pointsRef.current, stateRef.current);
      syncState();
      redraw();
      if (stateRef.current.converged) {
        runningRef.current = false;
        setRunning(false);
      }
    }, STEP_MS);
    return () => clearInterval(id);
  }, [seed, redraw, syncState]);

  // Canvas init
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      if (pointsRef.current.length === 0) {
        pointsRef.current = makeScatter("blobs", canvas.width, canvas.height);
      }
      redraw();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [redraw]);

  const onClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    pointsRef.current.push({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    // Adding data invalidates the current clustering
    reset();
  };

  const handleScatter = (id: ScatterId) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    pointsRef.current = makeScatter(id, canvas.width, canvas.height);
    reset();
  };

  const handleK = (v: number) => {
    kRef.current = v;
    setK(v);
    reset();
  };

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">k-means playground</span>
        </div>
        <div className="text-xs text-primary/40 flex gap-4">
          <span>{pointCount} pts</span>
          <span>iter {iteration}</span>
          {inertia !== null && iteration > 0 && <span>inertia {Math.round(inertia).toLocaleString()}</span>}
          {converged && <span className="text-primary">✓ converged</span>}
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">k</span>
          <input
            type="range"
            min={2}
            max={8}
            value={k}
            onChange={(e) => handleK(Number(e.target.value))}
            className="w-24 accent-primary"
          />
          <span className="text-primary/60 text-xs w-4">{k}</span>
        </div>

        <div className="flex gap-1 flex-wrap">
          {SCATTER_KEYS.map((id) => (
            <button
              key={id}
              onClick={() => handleScatter(id)}
              className="px-2 py-0.5 text-xs border border-primary/20 text-primary/40 hover:border-primary/50 hover:text-primary/70 transition-colors"
            >
              {SCATTERS[id]}
            </button>
          ))}
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => {
              runningRef.current = !running;
              setRunning(!running);
            }}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            {running ? "⏸ pause" : "▶ run"}
          </button>
          <button
            onClick={doStep}
            disabled={running}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ⏭ step
          </button>
          <button
            onClick={() => { seed(); }}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ⚄ reseed
          </button>
          <button
            onClick={() => { pointsRef.current = []; reset(); }}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ✕ clear
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas
          ref={canvasRef}
          className="block w-full h-full cursor-crosshair"
          onClick={onClick}
        />
        <div className="absolute bottom-3 left-4 text-xs text-primary/30 pointer-events-none">
          click to add points · ✕ marks are centroids (k-means++ seeded) · try the ring — k-means can&apos;t separate it
        </div>
      </div>
    </div>
  );
}
