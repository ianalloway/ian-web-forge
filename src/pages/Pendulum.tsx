import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  PendulumState,
  PendulumParams,
  DEFAULT_PARAMS,
  stepRK4,
  positions,
  anglesFromDrag,
  randomState,
} from "../features/pendulum/physics";

const SUBSTEPS = 4;
const DT = 1 / 240; // physics timestep per substep
const TRAIL_MAX = 600;
const BOB_R = 12;

export default function Pendulum() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<PendulumState>(randomState());
  const ghostRef = useRef<PendulumState | null>(null);
  const paramsRef = useRef<PendulumParams>({ ...DEFAULT_PARAMS });
  const trailRef = useRef<{ x: number; y: number }[]>([]);
  const ghostTrailRef = useRef<{ x: number; y: number }[]>([]);
  const pausedRef = useRef(false);
  const dragRef = useRef<null | 1 | 2>(null);

  const [paused, setPaused] = useState(false);
  const [ghostOn, setGhostOn] = useState(false);
  const [damping, setDamping] = useState(false);

  const pivot = useCallback(() => {
    const canvas = canvasRef.current!;
    return { px: canvas.width / 2, py: canvas.height * 0.35 };
  }, []);

  // Sim + render loop
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

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const { px, py } = pivot();
      const p = paramsRef.current;

      if (!pausedRef.current && dragRef.current === null) {
        for (let i = 0; i < SUBSTEPS; i++) {
          stateRef.current = stepRK4(stateRef.current, p, DT);
          if (ghostRef.current) ghostRef.current = stepRK4(ghostRef.current, p, DT);
        }
        const pos = positions(stateRef.current, p);
        trailRef.current.push({ x: px + pos.x2, y: py + pos.y2 });
        if (trailRef.current.length > TRAIL_MAX) trailRef.current.shift();
        if (ghostRef.current) {
          const gpos = positions(ghostRef.current, p);
          ghostTrailRef.current.push({ x: px + gpos.x2, y: py + gpos.y2 });
          if (ghostTrailRef.current.length > TRAIL_MAX) ghostTrailRef.current.shift();
        }
      }

      // Render
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const drawTrail = (trail: { x: number; y: number }[], color: string) => {
        if (trail.length < 2) return;
        for (let i = 1; i < trail.length; i++) {
          const a = i / trail.length;
          ctx.beginPath();
          ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
          ctx.lineTo(trail[i].x, trail[i].y);
          ctx.strokeStyle = color + Math.floor(a * 160).toString(16).padStart(2, "0");
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      };
      drawTrail(trailRef.current, "#00ff41");
      drawTrail(ghostTrailRef.current, "#ff4da6");

      const drawPendulum = (s: PendulumState, armColor: string, bobColor: string) => {
        const pos = positions(s, p);
        const x1 = px + pos.x1, y1 = py + pos.y1;
        const x2 = px + pos.x2, y2 = py + pos.y2;
        ctx.strokeStyle = armColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.fillStyle = bobColor;
        ctx.beginPath();
        ctx.arc(x1, y1, BOB_R * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x2, y2, BOB_R, 0, Math.PI * 2);
        ctx.fill();
      };

      if (ghostRef.current) drawPendulum(ghostRef.current, "rgba(255,77,166,0.5)", "rgba(255,77,166,0.7)");
      drawPendulum(stateRef.current, "rgba(0,255,65,0.7)", "#00ff41");

      // Pivot
      ctx.fillStyle = "rgba(0,255,65,0.5)";
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [pivot]);

  const clearTrails = () => {
    trailRef.current = [];
    ghostTrailRef.current = [];
  };

  const handleRandom = () => {
    stateRef.current = randomState();
    if (ghostRef.current) {
      ghostRef.current = { ...stateRef.current, th2: stateRef.current.th2 + 0.001 };
    }
    clearTrails();
  };

  const handleGhost = () => {
    if (ghostRef.current) {
      ghostRef.current = null;
      ghostTrailRef.current = [];
      setGhostOn(false);
    } else {
      // Ghost starts 0.001 rad off — chaos does the rest
      ghostRef.current = { ...stateRef.current, th2: stateRef.current.th2 + 0.001 };
      ghostTrailRef.current = [];
      setGhostOn(true);
    }
  };

  const handleDamping = () => {
    const next = !damping;
    setDamping(next);
    paramsRef.current = { ...paramsRef.current, damping: next ? 0.9995 : 1 };
  };

  // Dragging bobs
  const eventPos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onMouseDown = (e: React.MouseEvent) => {
    const { px, py } = pivot();
    const { x, y } = eventPos(e);
    const pos = positions(stateRef.current, paramsRef.current);
    const d2bob2 = (x - px - pos.x2) ** 2 + (y - py - pos.y2) ** 2;
    const d2bob1 = (x - px - pos.x1) ** 2 + (y - py - pos.y1) ** 2;
    const grab = (BOB_R * 2.5) ** 2;
    if (d2bob2 < grab) dragRef.current = 2;
    else if (d2bob1 < grab) dragRef.current = 1;
    if (dragRef.current !== null) clearTrails();
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (dragRef.current === null) return;
    const { px, py } = pivot();
    const { x, y } = eventPos(e);
    stateRef.current = anglesFromDrag(x - px, y - py, dragRef.current, stateRef.current, paramsRef.current);
    if (ghostRef.current) {
      ghostRef.current = { ...stateRef.current, th2: stateRef.current.th2 + 0.001 };
      ghostTrailRef.current = [];
    }
  };

  const onMouseUp = () => { dragRef.current = null; };

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">double pendulum</span>
        </div>
        <div className="text-xs text-primary/40 hidden sm:block">
          deterministic chaos, RK4 @ 960 Hz
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-2">
        <button
          onClick={() => { pausedRef.current = !paused; setPaused(!paused); }}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          {paused ? "▶ resume" : "⏸ pause"}
        </button>
        <button
          onClick={handleRandom}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ⚄ random fling
        </button>
        <button
          onClick={handleGhost}
          className={`px-3 py-1 text-xs border transition-colors ${
            ghostOn
              ? "border-pink-400/70 bg-pink-400/10 text-pink-300"
              : "border-primary/30 text-primary/70 hover:border-primary hover:text-primary"
          }`}
        >
          👻 ghost twin {ghostOn ? "on" : "off"}
        </button>
        <button
          onClick={handleDamping}
          className={`px-3 py-1 text-xs border transition-colors ${
            damping
              ? "border-primary bg-primary/10 text-primary"
              : "border-primary/30 text-primary/70 hover:border-primary hover:text-primary"
          }`}
        >
          damping {damping ? "on" : "off"}
        </button>
        <button
          onClick={clearTrails}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ✕ clear trails
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas
          ref={canvasRef}
          className="block w-full h-full cursor-grab active:cursor-grabbing"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        />
        <div className="absolute bottom-3 left-4 text-xs text-primary/30 pointer-events-none">
          drag a bob to reposition · ghost twin starts 0.001 rad apart — watch them diverge
        </div>
      </div>
    </div>
  );
}
