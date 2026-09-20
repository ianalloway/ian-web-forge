import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  TOPOLOGIES,
  Graph,
  Surfer,
  buildGraph,
  newSurfer,
  powerStep,
  ranking,
  surf,
  surferError,
  uniformRanks,
} from "../features/pagerank/rank";

const FRAMES_PER_ITERATION = 10; // slow enough to watch rank flow along the links
const CONVERGED = 1e-9;
const HISTORY = 90;

export default function PageRank() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const graphRef = useRef<Graph>(buildGraph(24, TOPOLOGIES[0].id, 7));
  const ranksRef = useRef<Float64Array>(uniformRanks(24));
  const surferRef = useRef<Surfer>(newSurfer(24));
  const dampingRef = useRef(0.85);
  const runningRef = useRef(true);
  const surferOnRef = useRef(true);
  const iterRef = useRef(0);
  const deltaRef = useRef(1);
  const historyRef = useRef<number[]>([]);
  const trailRef = useRef<number[]>([]);

  const [topologyId, setTopologyId] = useState(TOPOLOGIES[0].id);
  const [nodes, setNodes] = useState(24);
  const [damping, setDamping] = useState(0.85);
  const [seed, setSeed] = useState(7);
  const [running, setRunning] = useState(true);
  const [surferOn, setSurferOn] = useState(true);
  const [hud, setHud] = useState({ iter: 0, delta: 1, top: 0, topShare: 0, surferSteps: 0, surferErr: 1 });

  const rebuild = useCallback((n: number, topology: string, s: number) => {
    const g = buildGraph(n, topology, s);
    graphRef.current = g;
    ranksRef.current = uniformRanks(g.n);
    surferRef.current = newSurfer(g.n);
    iterRef.current = 0;
    deltaRef.current = 1;
    historyRef.current = [];
    trailRef.current = [];
    setHud({ iter: 0, delta: 1, top: 0, topShare: 0, surferSteps: 0, surferErr: 1 });
  }, []);

  const iterate = useCallback(() => {
    const { ranks, delta } = powerStep(graphRef.current, ranksRef.current, dampingRef.current);
    ranksRef.current = ranks;
    deltaRef.current = delta;
    iterRef.current++;
    historyRef.current.push(delta);
    if (historyRef.current.length > HISTORY) historyRef.current.shift();
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: W, height: H } = canvas;
    const g = graphRef.current;
    const ranks = ranksRef.current;
    const surfer = surferRef.current;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    const pad = 26;
    const size = Math.min(W - pad * 2, H - pad * 2);
    const ox = (W - size) / 2;
    const oy = (H - size) / 2;
    const px = (i: number) => ox + g.pos[i][0] * size;
    const py = (i: number) => oy + g.pos[i][1] * size;

    let maxRank = 1e-9;
    for (let i = 0; i < g.n; i++) if (ranks[i] > maxRank) maxRank = ranks[i];
    const radius = (i: number) => 3 + Math.sqrt(ranks[i] / maxRank) * Math.max(9, size * 0.035);

    // Edges, with a small arrowhead pulled back to the node's rim.
    for (let i = 0; i < g.n; i++) {
      for (const j of g.out[i]) {
        const x1 = px(i);
        const y1 = py(i);
        const x2 = px(j);
        const y2 = py(j);
        const dx = x2 - x1;
        const dy = y2 - y1;
        const d = Math.hypot(dx, dy) || 1;
        const rj = radius(j) + 2.5;
        const ex = x2 - (dx / d) * rj;
        const ey = y2 - (dy / d) * rj;
        const live = surferOnRef.current && surfer.at === i;
        ctx.strokeStyle = live ? "rgba(0,207,255,0.5)" : "rgba(0,255,65,0.16)";
        ctx.lineWidth = live ? 1.4 : 1;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        const a = Math.atan2(dy, dx);
        ctx.fillStyle = live ? "rgba(0,207,255,0.6)" : "rgba(0,255,65,0.28)";
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - 6 * Math.cos(a - 0.35), ey - 6 * Math.sin(a - 0.35));
        ctx.lineTo(ex - 6 * Math.cos(a + 0.35), ey - 6 * Math.sin(a + 0.35));
        ctx.closePath();
        ctx.fill();
      }
    }

    // Nodes, sized by rank. A page with no outgoing links is ringed: it is where
    // rank would pool if teleportation did not exist.
    const order = ranking(ranks);
    const best = order[0];
    for (let i = 0; i < g.n; i++) {
      const r = radius(i);
      const t = ranks[i] / maxRank;
      ctx.fillStyle = `rgba(0,255,65,${0.2 + 0.6 * t})`;
      ctx.beginPath();
      ctx.arc(px(i), py(i), r, 0, Math.PI * 2);
      ctx.fill();
      if (g.out[i].length === 0) {
        ctx.strokeStyle = "rgba(255,190,60,0.8)";
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(px(i), py(i), r + 3, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (i === best) {
        ctx.strokeStyle = "rgba(255,255,255,0.65)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(px(i), py(i), r + 5.5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // The surfer, with a short trail of where it has just been.
    if (surferOnRef.current) {
      const trail = trailRef.current;
      trail.forEach((idx, k) => {
        const a = (k + 1) / trail.length;
        ctx.fillStyle = `rgba(0,207,255,${0.05 + 0.25 * a})`;
        ctx.beginPath();
        ctx.arc(px(idx), py(idx), 3, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = surfer.teleported ? "#ffbe3c" : "#eafff0";
      ctx.beginPath();
      ctx.arc(px(surfer.at), py(surfer.at), 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    // Standings: computed rank against the surfer's measured visit frequency.
    const panelW = Math.min(196, W * 0.3);
    if (panelW > 120) {
      const rows = Math.min(6, g.n);
      const rowH = 15;
      const panelH = rows * rowH + 26;
      ctx.fillStyle = "rgba(0,0,0,0.78)";
      ctx.fillRect(8, 8, panelW, panelH);
      ctx.strokeStyle = "rgba(0,255,65,0.2)";
      ctx.lineWidth = 1;
      ctx.strokeRect(8.5, 8.5, panelW - 1, panelH - 1);
      ctx.fillStyle = "rgba(0,255,65,0.45)";
      ctx.fillText("rank · surfer visits", 14, 14);
      for (let r = 0; r < rows; r++) {
        const i = order[r];
        const y = 28 + r * rowH;
        const barW = panelW - 74;
        ctx.fillStyle = "rgba(0,255,65,0.55)";
        ctx.fillText(`#${i}`, 14, y + 2);
        ctx.fillStyle = "rgba(0,255,65,0.18)";
        ctx.fillRect(44, y, barW, 5);
        ctx.fillStyle = "#00ff41";
        ctx.fillRect(44, y, barW * (ranks[i] / maxRank), 5);
        if (surferOnRef.current) {
          ctx.fillStyle = "rgba(0,207,255,0.85)";
          ctx.fillRect(44, y + 6, barW * Math.min(1, surfer.visits[i] / surfer.steps / maxRank), 3);
        }
        ctx.fillStyle = "rgba(0,255,65,0.5)";
        ctx.fillText(`${(ranks[i] * 100).toFixed(1)}%`, 44 + barW + 6, y + 1);
      }
    }

    // Convergence: the L1 change per sweep, on a log scale.
    const chartW = Math.min(190, W * 0.28);
    const chartH = 64;
    if (chartW > 120 && H > 260) {
      const cx0 = W - chartW - 8;
      const cy0 = 8;
      ctx.fillStyle = "rgba(0,0,0,0.78)";
      ctx.fillRect(cx0, cy0, chartW, chartH);
      ctx.strokeStyle = "rgba(0,255,65,0.2)";
      ctx.strokeRect(cx0 + 0.5, cy0 + 0.5, chartW - 1, chartH - 1);
      ctx.fillStyle = "rgba(0,255,65,0.45)";
      ctx.fillText("change per sweep (log)", cx0 + 6, cy0 + 5);
      const hist = historyRef.current;
      if (hist.length > 1) {
        const plotX = cx0 + 6;
        const plotY = cy0 + 20;
        const plotW = chartW - 12;
        const plotH = chartH - 28;
        const lo = -12;
        const hi = 0.3;
        ctx.strokeStyle = "#00cfff";
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        hist.forEach((d, i) => {
          const lx = plotX + (i / (hist.length - 1)) * plotW;
          const l = Math.log10(Math.max(d, 1e-13));
          const ly = plotY + plotH - ((l - lo) / (hi - lo)) * plotH;
          if (i === 0) ctx.moveTo(lx, ly);
          else ctx.lineTo(lx, Math.max(plotY, Math.min(plotY + plotH, ly)));
        });
        ctx.stroke();
      }
    }
    ctx.textBaseline = "middle";
  }, []);

  const refreshHud = useCallback(() => {
    const ranks = ranksRef.current;
    const top = ranking(ranks)[0];
    setHud({
      iter: iterRef.current,
      delta: deltaRef.current,
      top,
      topShare: ranks[top],
      surferSteps: surferRef.current.steps,
      surferErr: surferError(surferRef.current, ranks),
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
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let frame = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (runningRef.current) {
        // Power iteration stops once it has converged; the surfer never does,
        // it just keeps refining its estimate of the same numbers.
        if (++frame % FRAMES_PER_ITERATION === 0 && deltaRef.current > CONVERGED) iterate();
        if (surferOnRef.current) {
          for (let i = 0; i < 3; i++) {
            surf(graphRef.current, surferRef.current, dampingRef.current);
            const trail = trailRef.current;
            trail.push(surferRef.current.at);
            if (trail.length > 10) trail.shift();
          }
        }
      }
      draw();
      if (frame % 12 === 0) refreshHud();
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [draw, iterate, refreshHud]);

  const topology = TOPOLOGIES.find((t) => t.id === topologyId) ?? TOPOLOGIES[0];
  const converged = hud.delta <= CONVERGED;

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">pagerank</span>
        </div>
        <div className="text-xs text-primary/50 tabular-nums flex gap-3 flex-wrap">
          <span>sweep {hud.iter}</span>
          <span className={converged ? "text-primary" : "text-primary/40"}>
            {converged ? "◆ converged" : `Δ ${hud.delta.toExponential(1)}`}
          </span>
          <span>top #{hud.top} at {(hud.topShare * 100).toFixed(1)}%</span>
          {surferOn && (
            <span className="text-[#00cfff]">
              surfer {(hud.surferSteps / 1000).toFixed(1)}k, off by {(hud.surferErr * 100).toFixed(1)}%
            </span>
          )}
        </div>
      </div>

      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-2">
        <span className="text-primary/30 text-xs mr-1">graph</span>
        {TOPOLOGIES.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTopologyId(t.id);
              rebuild(nodes, t.id, seed);
            }}
            title={t.note}
            className={`px-2.5 py-1 text-xs border transition-colors ${
              t.id === topologyId
                ? "border-primary bg-primary/15 text-primary"
                : "border-primary/25 text-primary/60 hover:border-primary hover:text-primary"
            }`}
          >
            {t.label}
          </button>
        ))}
        <span className="text-primary/30 text-xs hidden md:inline ml-1">{topology.note}</span>
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
            iterate();
            draw();
            refreshHud();
          }}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ⇥ one sweep
        </button>
        <button
          onClick={() => {
            const next = (seed * 16807 + 17) % 2147483647;
            setSeed(next);
            rebuild(nodes, topologyId, next);
          }}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ⟳ new graph
        </button>
        <button
          onClick={() => rebuild(nodes, topologyId, seed)}
          title="back to a uniform guess, same graph"
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ↺ reset ranks
        </button>
        <button
          onClick={() => {
            surferOnRef.current = !surferOn;
            setSurferOn(!surferOn);
          }}
          className={`px-3 py-1 text-xs border transition-colors ${
            surferOn
              ? "border-primary bg-primary/15 text-primary"
              : "border-primary/30 hover:border-primary text-primary/70 hover:text-primary"
          }`}
        >
          {surferOn ? "◼ hide surfer" : "◇ show surfer"}
        </button>

        <Slider
          label="d"
          title="damping — the chance the surfer follows a link instead of teleporting"
          min={0.05}
          max={0.99}
          step={0.01}
          value={damping}
          fmt={(v) => v.toFixed(2)}
          onChange={(v) => {
            setDamping(v);
            dampingRef.current = v;
            deltaRef.current = 1; // a new d means a new fixed point to find
          }}
        />
        <Slider
          label="pages"
          title="number of pages in the graph"
          min={8}
          max={60}
          step={1}
          value={nodes}
          fmt={(v) => `${v}`}
          onChange={(v) => {
            setNodes(v);
            rebuild(v, topologyId, seed);
          }}
        />
      </div>

      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute bottom-1 left-4 right-4 text-xs text-primary/40 pointer-events-none">
          node size = rank · amber ring = a dead end that links nowhere · the cyan surfer walks at
          random and its visit counts drift onto the same answer the algebra computes
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
