import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Site,
  randomSites,
  delaunay,
} from "../features/voronoi/geometry";

const CELL_RES = 4; // px per Voronoi sample block

type Mode = "cells" | "delaunay" | "both";

export default function Voronoi() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sitesRef = useRef<Site[]>([]);
  const modeRef = useRef<Mode>("both");
  const dragRef = useRef(-1);

  const [mode, setMode] = useState<Mode>("both");
  const [count, setCount] = useState(0);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: W, height: H } = canvas;
    const sites = sitesRef.current;
    const m = modeRef.current;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    // Voronoi cells: nearest-site fill over sample blocks
    if ((m === "cells" || m === "both") && sites.length > 0) {
      for (let y = 0; y < H; y += CELL_RES) {
        for (let x = 0; x < W; x += CELL_RES) {
          let best = 0;
          let bestD = Infinity;
          for (let i = 0; i < sites.length; i++) {
            const dx = sites[i].x - x;
            const dy = sites[i].y - y;
            const d = dx * dx + dy * dy;
            if (d < bestD) { bestD = d; best = i; }
          }
          const lightness = m === "both" ? 18 : 32;
          ctx.fillStyle = `hsl(${sites[best].hue}, 70%, ${lightness}%)`;
          ctx.fillRect(x, y, CELL_RES, CELL_RES);
        }
      }
      // Cell borders pop with a subtle grid of site-colored edges via stroke pass skipped for perf
    }

    // Delaunay triangulation (dual)
    if ((m === "delaunay" || m === "both") && sites.length >= 3) {
      const tris = delaunay(sites);
      ctx.strokeStyle = m === "both" ? "rgba(0,255,65,0.5)" : "#00ff41";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const t of tris) {
        const a = sites[t.a], b = sites[t.b], c = sites[t.c];
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.lineTo(c.x, c.y);
        ctx.lineTo(a.x, a.y);
      }
      ctx.stroke();
    }

    // Sites
    for (const s of sites) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    setCount(sites.length);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      if (sitesRef.current.length === 0) {
        sitesRef.current = randomSites(12, canvas.width, canvas.height);
      }
      render();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [render]);

  const pos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onMouseDown = (e: React.MouseEvent) => {
    const { x, y } = pos(e);
    const idx = sitesRef.current.findIndex(
      (s) => (s.x - x) ** 2 + (s.y - y) ** 2 < 12 * 12
    );
    if (idx >= 0) {
      dragRef.current = idx;
    } else {
      sitesRef.current = [
        ...sitesRef.current,
        { x, y, hue: Math.floor(Math.random() * 360) },
      ];
      render();
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (dragRef.current < 0 || e.buttons !== 1) return;
    const { x, y } = pos(e);
    const next = [...sitesRef.current];
    next[dragRef.current] = { ...next[dragRef.current], x, y };
    sitesRef.current = next;
    render();
  };

  const onMouseUp = () => { dragRef.current = -1; };

  const onDoubleClick = (e: React.MouseEvent) => {
    const { x, y } = pos(e);
    const idx = sitesRef.current.findIndex(
      (s) => (s.x - x) ** 2 + (s.y - y) ** 2 < 12 * 12
    );
    if (idx >= 0) {
      sitesRef.current = sitesRef.current.filter((_, i) => i !== idx);
      render();
    }
  };

  const setModeAll = (m: Mode) => { modeRef.current = m; setMode(m); render(); };

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">voronoi + delaunay</span>
        </div>
        <div className="text-xs text-primary/40 tabular-nums">{count} sites</div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {(["cells", "delaunay", "both"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setModeAll(m)}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                mode === m
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/20 text-primary/40 hover:border-primary/50 hover:text-primary/70"
              }`}
            >
              {m === "cells" ? "Voronoi cells" : m === "delaunay" ? "Delaunay" : "Both"}
            </button>
          ))}
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => {
              const canvas = canvasRef.current;
              if (!canvas) return;
              sitesRef.current = randomSites(12, canvas.width, canvas.height);
              render();
            }}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ⚄ scatter
          </button>
          <button
            onClick={() => { sitesRef.current = []; render(); }}
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
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onDoubleClick={onDoubleClick}
        />
        <div className="absolute bottom-3 left-4 text-xs text-primary/30 pointer-events-none">
          click to add a site · drag to move · double-click to remove · Delaunay is the dual of the Voronoi diagram
        </div>
      </div>
    </div>
  );
}
