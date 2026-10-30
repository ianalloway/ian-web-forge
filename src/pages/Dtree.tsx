import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  DatasetId,
  DATASETS,
  LabeledPt,
  Tree,
  CLASS_COLORS,
  accuracy,
  build,
  leafCount,
  leafRegions,
  makeDataset,
  makeRng,
  treeDepth,
} from "../features/dtree/dtree";

const DATASET_KEYS = Object.keys(DATASETS) as DatasetId[];
const GROW_MS = 420;
const MIN_LEAF = 2;

export default function Dtree() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<LabeledPt[]>([]);
  const treeRef = useRef<Tree | null>(null);
  const runningRef = useRef(false);
  const depthRef = useRef(6); // target max depth (slider)
  const shownRef = useRef(6); // currently displayed depth (animates when growing)
  const classesRef = useRef(2);
  const datasetRef = useRef<DatasetId>("xor");
  const seedRef = useRef(1);
  const paintRef = useRef(0);

  const [depth, setDepth] = useState(6);
  const [dataset, setDataset] = useState<DatasetId>("xor");
  const [running, setRunning] = useState(false);
  const [paint, setPaint] = useState(0);
  const [stats, setStats] = useState({ depth: 0, leaves: 0, acc: 1, pts: 0 });

  const rebuild = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const points = pointsRef.current;
    const tree = build(points, {
      maxDepth: shownRef.current,
      minLeaf: MIN_LEAF,
      numClasses: classesRef.current,
    });
    treeRef.current = tree;
    setStats({
      depth: treeDepth(tree),
      leaves: leafCount(tree),
      acc: accuracy(tree, points),
      pts: points.length,
    });
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: W, height: H } = canvas;
    const points = pointsRef.current;
    const tree = treeRef.current;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    // Decision regions: one filled rectangle per leaf — the staircase boundary.
    if (tree) {
      for (const r of leafRegions(tree, 0, 0, W, H)) {
        const color = CLASS_COLORS[r.label % CLASS_COLORS.length];
        const purity = r.n ? Math.max(...r.counts) / r.n : 0;
        const alpha = (0.08 + 0.16 * purity).toFixed(3);
        ctx.fillStyle = color + Math.round(Number(alpha) * 255).toString(16).padStart(2, "0");
        ctx.fillRect(r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0);
        ctx.strokeStyle = "rgba(0,0,0,0.5)";
        ctx.lineWidth = 1;
        ctx.strokeRect(r.x0 + 0.5, r.y0 + 0.5, r.x1 - r.x0 - 1, r.y1 - r.y0 - 1);
      }
    }

    // Training points, coloured by true class.
    for (const p of points) {
      ctx.fillStyle = CLASS_COLORS[p.label % CLASS_COLORS.length];
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.6)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }, []);

  const apply = useCallback(() => {
    rebuild();
    redraw();
  }, [rebuild, redraw]);

  // Grow animation: step the displayed depth up to the target.
  useEffect(() => {
    const id = setInterval(() => {
      if (!runningRef.current) return;
      if (shownRef.current >= depthRef.current) {
        runningRef.current = false;
        setRunning(false);
        return;
      }
      shownRef.current++;
      apply();
    }, GROW_MS);
    return () => clearInterval(id);
  }, [apply]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      if (pointsRef.current.length === 0) {
        pointsRef.current = makeDataset(datasetRef.current, canvas.width, canvas.height, makeRng(seedRef.current));
      }
      apply();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [apply]);

  const loadDataset = (id: DatasetId, newSeed: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (newSeed) seedRef.current++;
    datasetRef.current = id;
    setDataset(id);
    classesRef.current = DATASETS[id].classes;
    pointsRef.current = makeDataset(id, canvas.width, canvas.height, makeRng(seedRef.current));
    runningRef.current = false;
    setRunning(false);
    shownRef.current = depthRef.current;
    apply();
  };

  const handleDepth = (v: number) => {
    depthRef.current = v;
    shownRef.current = v;
    setDepth(v);
    runningRef.current = false;
    setRunning(false);
    apply();
  };

  const grow = () => {
    if (running) {
      runningRef.current = false;
      setRunning(false);
      return;
    }
    shownRef.current = 1;
    runningRef.current = true;
    setRunning(true);
    apply();
  };

  const onClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    pointsRef.current.push({ x: e.clientX - rect.left, y: e.clientY - rect.top, label: paintRef.current });
    runningRef.current = false;
    setRunning(false);
    shownRef.current = depthRef.current;
    apply();
  };

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/lab" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← lab
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">decision tree (CART)</span>
        </div>
        <div className="text-xs text-primary/40 flex gap-4 tabular-nums">
          <span>{stats.pts} pts</span>
          <span>depth {stats.depth}</span>
          <span>{stats.leaves} leaves</span>
          <span className={stats.acc === 1 ? "text-primary" : ""}>train acc {(stats.acc * 100).toFixed(1)}%</span>
        </div>
      </div>

      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2" title="maximum tree depth (overfits as it grows)">
          <span className="text-primary/40 text-xs">max depth</span>
          <input
            type="range"
            min={1}
            max={12}
            value={depth}
            onChange={(e) => handleDepth(Number(e.target.value))}
            className="w-28 accent-primary"
          />
          <span className="text-primary/60 text-xs w-4">{depth}</span>
        </div>

        <div className="flex gap-1 flex-wrap">
          {DATASET_KEYS.map((id) => (
            <button
              key={id}
              onClick={() => loadDataset(id, id === dataset)}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                id === dataset
                  ? "border-primary/60 text-primary"
                  : "border-primary/20 text-primary/40 hover:border-primary/50 hover:text-primary/70"
              }`}
            >
              {DATASETS[id].label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1" title="class painted when you click the canvas">
          <span className="text-primary/40 text-xs mr-1">paint</span>
          {[0, 1].map((c) => (
            <button
              key={c}
              onClick={() => {
                paintRef.current = c;
                setPaint(c);
              }}
              className={`w-5 h-5 border transition-all ${paint === c ? "border-primary scale-110" : "border-primary/20"}`}
              style={{ background: CLASS_COLORS[c] + (paint === c ? "ff" : "88") }}
              aria-label={`paint class ${c}`}
            />
          ))}
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={grow}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            {running ? "⏸ pause" : "▶ grow"}
          </button>
          <button
            onClick={() => loadDataset(datasetRef.current, true)}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ⚄ resample
          </button>
          <button
            onClick={() => {
              pointsRef.current = [];
              runningRef.current = false;
              setRunning(false);
              shownRef.current = depthRef.current;
              apply();
            }}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ✕ clear
          </button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full cursor-crosshair" onClick={onClick} />
        <div className="absolute bottom-3 right-4 text-xs text-primary/30 pointer-events-none max-w-md text-right">
          axis-aligned splits → a staircase boundary · crank depth to watch it overfit · click to add points of the painted class
        </div>
      </div>
    </div>
  );
}
