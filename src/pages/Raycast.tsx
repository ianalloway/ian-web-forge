import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Grid, castRay, collides, generateMaze } from "../features/raycast/dda";

const MAP_W = 31;
const MAP_H = 21;
const COLUMN = 2; // pixels per cast ray — wider is faster
const MOVE_SPEED = 2.6; // cells per second
const TURN_SPEED = 2.4; // radians per second

// Base tints per wall material.
const MATERIAL: [number, number, number][] = [
  [0, 0, 0],
  [0, 230, 80],
  [0, 180, 120],
  [70, 220, 160],
];

export default function Raycast() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<Grid | null>(null);
  const posRef = useRef({ x: 1.5, y: 1.5, angle: 0 });
  const keysRef = useRef(new Set<string>());
  const fovRef = useRef(1.15);
  const lastRef = useRef(0);

  const [fov, setFov] = useState(1.15);
  const [fps, setFps] = useState(0);

  const regenerate = useCallback(() => {
    gridRef.current = generateMaze(MAP_W, MAP_H);
    posRef.current = { x: 1.5, y: 1.5, angle: 0 };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (!gridRef.current) regenerate();

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resize();
    window.addEventListener("resize", resize);

    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) {
        e.preventDefault();
        keysRef.current.add(k);
      }
    };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    let raf = 0;
    let frames = 0;
    let fpsClock = performance.now();

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const g = gridRef.current;
      if (!g) return;
      const dt = Math.min(0.05, lastRef.current ? (now - lastRef.current) / 1000 : 0.016);
      lastRef.current = now;

      // Movement.
      const keys = keysRef.current;
      const p = posRef.current;
      if (keys.has("arrowleft") || keys.has("a")) p.angle -= TURN_SPEED * dt;
      if (keys.has("arrowright") || keys.has("d")) p.angle += TURN_SPEED * dt;
      const forward = (keys.has("w") || keys.has("arrowup") ? 1 : 0) - (keys.has("s") || keys.has("arrowdown") ? 1 : 0);
      if (forward !== 0) {
        const step = forward * MOVE_SPEED * dt;
        const nx = p.x + Math.cos(p.angle) * step;
        const ny = p.y + Math.sin(p.angle) * step;
        // Resolve each axis separately so you slide along walls instead of sticking.
        if (!collides(g, nx, p.y)) p.x = nx;
        if (!collides(g, p.x, ny)) p.y = ny;
      }

      const W = canvas.width;
      const H = canvas.height;
      const horizon = H / 2;

      // Ceiling and floor.
      const ceil = ctx.createLinearGradient(0, 0, 0, horizon);
      ceil.addColorStop(0, "#02040a");
      ceil.addColorStop(1, "#061410");
      ctx.fillStyle = ceil;
      ctx.fillRect(0, 0, W, horizon);
      const floor = ctx.createLinearGradient(0, horizon, 0, H);
      floor.addColorStop(0, "#061410");
      floor.addColorStop(1, "#020604");
      ctx.fillStyle = floor;
      ctx.fillRect(0, horizon, W, H - horizon);

      // Cast one ray per column.
      const half = fovRef.current / 2;
      const cols = Math.ceil(W / COLUMN);
      for (let c = 0; c < cols; c++) {
        const screenX = c * COLUMN;
        // Even angular spacing across the field of view.
        const rayAngle = p.angle - half + (c / (cols - 1)) * fovRef.current;
        const dx = Math.cos(rayAngle);
        const dy = Math.sin(rayAngle);
        const hit = castRay(g, p.x, p.y, dx, dy, 40);
        if (hit.material === 0) continue;

        // Correct for the off-axis angle so straight walls render flat.
        const perp = hit.distance * Math.cos(rayAngle - p.angle);
        const height = Math.min(H * 4, H / Math.max(0.0001, perp));
        const top = horizon - height / 2;

        const base = MATERIAL[hit.material] ?? MATERIAL[1];
        // Darken with distance, and shade one wall orientation for depth cues.
        const fade = 1 / (1 + perp * perp * 0.045);
        const shade = (hit.side === 1 ? 0.62 : 1) * fade;
        // A subtle vertical seam at cell edges reads as brickwork.
        const edge = hit.wallX < 0.04 || hit.wallX > 0.96 ? 0.7 : 1;
        const k = shade * edge;
        ctx.fillStyle = `rgb(${Math.round(base[0] * k)},${Math.round(base[1] * k)},${Math.round(base[2] * k)})`;
        ctx.fillRect(screenX, top, COLUMN + 1, height);
      }

      // Minimap.
      const scale = Math.max(2, Math.min(5, W / 260));
      const mw = MAP_W * scale;
      const mh = MAP_H * scale;
      const mx = W - mw - 10;
      const my = 10;
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(mx - 2, my - 2, mw + 4, mh + 4);
      for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
          if (g.cells[y * MAP_W + x] > 0) {
            ctx.fillStyle = "rgba(0,255,65,0.32)";
            ctx.fillRect(mx + x * scale, my + y * scale, scale, scale);
          }
        }
      }
      ctx.fillStyle = "#c9ffd6";
      ctx.beginPath();
      ctx.arc(mx + p.x * scale, my + p.y * scale, Math.max(1.5, scale * 0.4), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(200,255,214,0.8)";
      ctx.beginPath();
      ctx.moveTo(mx + p.x * scale, my + p.y * scale);
      ctx.lineTo(mx + (p.x + Math.cos(p.angle) * 2) * scale, my + (p.y + Math.sin(p.angle) * 2) * scale);
      ctx.stroke();

      frames++;
      if (now - fpsClock > 500) {
        setFps(Math.round((frames * 1000) / (now - fpsClock)));
        frames = 0;
        fpsClock = now;
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [regenerate]);

  // Touch / click steering for devices without a keyboard.
  const nudge = (key: string, on: boolean) => {
    if (on) keysRef.current.add(key);
    else keysRef.current.delete(key);
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
          <span className="text-sm">raycaster</span>
        </div>
        <div className="text-xs text-primary/40 tabular-nums">
          DDA · {fps} fps · fov {Math.round((fov * 180) / Math.PI)}°
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <span className="text-primary/30 text-xs hidden md:inline">WASD or arrows to move</span>

        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">fov</span>
          <input
            type="range"
            min={0.6}
            max={2}
            step={0.05}
            value={fov}
            onChange={(e) => {
              const v = Number(e.target.value);
              setFov(v);
              fovRef.current = v;
            }}
            className="w-28 accent-primary"
          />
        </div>

        {/* On-screen pad for touch */}
        <div className="flex gap-1 md:hidden">
          {[
            ["a", "↶"],
            ["w", "↑"],
            ["s", "↓"],
            ["d", "↷"],
          ].map(([k, label]) => (
            <button
              key={k}
              onPointerDown={() => nudge(k, true)}
              onPointerUp={() => nudge(k, false)}
              onPointerLeave={() => nudge(k, false)}
              className="px-3 py-1 text-xs border border-primary/30 text-primary/70 touch-none select-none"
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={regenerate}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors ml-auto"
        >
          ⟳ new maze
        </button>
      </div>

      {/* Viewport */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute bottom-3 left-4 text-xs text-primary/40 pointer-events-none max-w-xl">
          no 3D geometry here — one ray per screen column, walked cell by cell through a flat grid.
          how far it travels before hitting a wall becomes the height of that column, and that alone
          is enough to look like a corridor.
        </div>
      </div>
    </div>
  );
}
