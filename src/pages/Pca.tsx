import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fitCanvas } from "../lib/canvas";
import {
  DatasetId,
  DATASETS,
  Pt,
  makeDataset,
  pca,
  project,
} from "../features/pca/pca";

const DATASET_KEYS = Object.keys(DATASETS) as DatasetId[];
const PC1 = "#00ff41";
const PC2 = "#00cfff";

export default function Pca() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const pointsRef = useRef<Pt[]>([]);
  const [dataset, setDataset] = useState<DatasetId>("tilted");
  const [projecting, setProjecting] = useState(false);
  const [stats, setStats] = useState({ varExp: 0, count: 0 });

  const arrow = (ctx: CanvasRenderingContext2D, cx: number, cy: number, vx: number, vy: number, len: number, color: string) => {
    const tx = cx + vx * len;
    const ty = cy + vy * len;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    const a = Math.atan2(vy, vx);
    const h = 8;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx - h * Math.cos(a - 0.4), ty - h * Math.sin(a - 0.4));
    ctx.lineTo(tx - h * Math.cos(a + 0.4), ty - h * Math.sin(a + 0.4));
    ctx.closePath();
    ctx.fill();
  };

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w: W, h: H } = sizeRef.current;
    const points = pointsRef.current;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    if (points.length >= 2) {
      const r = pca(points);
      const c = r.mean;
      const s1 = Math.sqrt(Math.max(r.l1, 0));
      const s2 = Math.sqrt(Math.max(r.l2, 0));

      // 2σ covariance ellipse
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(r.angle);
      ctx.beginPath();
      ctx.ellipse(0, 0, s1 * 2, s2 * 2, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0,255,65,0.18)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // PC1 line across the cloud
      ctx.strokeStyle = "rgba(0,255,65,0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(c.x - r.v1[0] * s1 * 3.2, c.y - r.v1[1] * s1 * 3.2);
      ctx.lineTo(c.x + r.v1[0] * s1 * 3.2, c.y + r.v1[1] * s1 * 3.2);
      ctx.stroke();

      // projection of each point onto PC1
      if (projecting) {
        const t = project(points, c, r.v1);
        points.forEach((p, i) => {
          const px = c.x + r.v1[0] * t[i];
          const py = c.y + r.v1[1] * t[i];
          ctx.strokeStyle = "rgba(255,255,255,0.1)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(px, py);
          ctx.stroke();
          ctx.fillStyle = "rgba(0,255,65,0.8)";
          ctx.beginPath();
          ctx.arc(px, py, 2.4, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // points
      for (const p of points) {
        ctx.fillStyle = projecting ? "rgba(255,255,255,0.3)" : "rgba(230,255,235,0.75)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // principal axes (scaled by 2σ) + centroid
      arrow(ctx, c.x, c.y, r.v1[0], r.v1[1], s1 * 2, PC1);
      arrow(ctx, c.x, c.y, r.v2[0], r.v2[1], s2 * 2, PC2);
      ctx.fillStyle = PC1;
      ctx.font = "11px monospace";
      ctx.fillText(`PC1 ${(r.varExplained * 100).toFixed(0)}%`, c.x + r.v1[0] * s1 * 2 + 6, c.y + r.v1[1] * s1 * 2);
      ctx.fillStyle = PC2;
      ctx.fillText(`PC2 ${((1 - r.varExplained) * 100).toFixed(0)}%`, c.x + r.v2[0] * s2 * 2 + 6, c.y + r.v2[1] * s2 * 2);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(c.x - 5, c.y);
      ctx.lineTo(c.x + 5, c.y);
      ctx.moveTo(c.x, c.y - 5);
      ctx.lineTo(c.x, c.y + 5);
      ctx.stroke();

      // variance-explained bar
      const bw = 160;
      const bx = 16;
      const by = H - 24;
      ctx.fillStyle = PC1;
      ctx.fillRect(bx, by, bw * r.varExplained, 8);
      ctx.fillStyle = PC2;
      ctx.fillRect(bx + bw * r.varExplained, by, bw * (1 - r.varExplained), 8);
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "10px monospace";
      ctx.fillText("variance explained", bx, by - 6);

      setStats({ varExp: r.varExplained, count: points.length });
    } else {
      setStats({ varExp: 0, count: points.length });
    }
  }, [projecting]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      const { width, height } = fitCanvas(canvas, rect.width, rect.height);
      sizeRef.current = { w: width, h: height };
      if (pointsRef.current.length === 0) {
        pointsRef.current = makeDataset("tilted", width, height);
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
    redraw();
  };

  const loadDataset = (id: DatasetId) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDataset(id);
    pointsRef.current = makeDataset(id, sizeRef.current.w, sizeRef.current.h);
    redraw();
  };

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/lab" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← lab
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">principal components</span>
        </div>
        <div className="text-xs text-primary/40 flex gap-4 tabular-nums">
          <span>{stats.count} pts</span>
          <span>PC1 keeps {(stats.varExp * 100).toFixed(1)}%</span>
        </div>
      </div>

      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <div className="flex gap-1 flex-wrap">
          {DATASET_KEYS.map((id) => (
            <button
              key={id}
              onClick={() => loadDataset(id)}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                id === dataset
                  ? "border-primary/60 text-primary"
                  : "border-primary/20 text-primary/40 hover:border-primary/50 hover:text-primary/70"
              }`}
            >
              {DATASETS[id]}
            </button>
          ))}
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => setProjecting((p) => !p)}
            className={`px-3 py-1 text-xs border transition-colors ${
              projecting
                ? "border-primary bg-primary/15 text-primary"
                : "border-primary/30 text-primary/70 hover:border-primary hover:text-primary"
            }`}
          >
            → project onto PC1
          </button>
          <button
            onClick={() => { pointsRef.current = []; redraw(); }}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ✕ clear
          </button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Scatter of 2D points with the principal-component axes and the projection of the data onto the first component; click to add points."
          className="block w-full h-full cursor-crosshair"
          onClick={onClick}
        />
        <div className="absolute bottom-3 right-4 text-xs text-primary/30 pointer-events-none max-w-md text-right">
          green = PC1 (max variance), cyan = PC2 ⟂ · click to add points · project to see the 1-D reduction
        </div>
      </div>
    </div>
  );
}
