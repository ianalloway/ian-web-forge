import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Cloth } from "../features/cloth/verlet";

type Mode = "drag" | "cut";

export default function ClothPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const clothRef = useRef<Cloth | null>(null);
  const modeRef = useRef<Mode>("drag");
  const gravityRef = useRef(0.32);
  const tearRef = useRef(3.2);
  const dragRef = useRef(-1); // index of the grabbed point
  const pointerRef = useRef({ x: 0, y: 0, down: false });

  const [mode, setMode] = useState<Mode>("drag");
  const [gravity, setGravity] = useState(0.32);
  const [tear, setTear] = useState(3.2);
  const [intact, setIntact] = useState(0);

  const build = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0) return;
    const spacing = Math.max(12, Math.min(22, canvas.width / 46));
    const cols = Math.max(10, Math.floor((canvas.width * 0.7) / spacing));
    const rows = Math.max(8, Math.floor((canvas.height * 0.6) / spacing));
    const c = new Cloth({
      cols,
      rows,
      spacing,
      originX: (canvas.width - (cols - 1) * spacing) / 2,
      originY: canvas.height * 0.12,
      pinEvery: Math.max(2, Math.round(cols / 7)),
    });
    c.gravity = gravityRef.current;
    c.tearRatio = tearRef.current;
    clothRef.current = c;
    dragRef.current = -1;
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
      build();
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let frame = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const c = clothRef.current;
      if (!c) return;
      const W = canvas.width;
      const H = canvas.height;
      const ptr = pointerRef.current;

      // Pointer interaction.
      if (ptr.down) {
        if (modeRef.current === "cut") {
          c.cut(ptr.x, ptr.y, 16);
        } else if (dragRef.current >= 0) {
          const p = c.points[dragRef.current];
          if (!p.pinned) {
            p.x = ptr.x;
            p.y = ptr.y;
            p.px = ptr.x;
            p.py = ptr.y;
          }
        }
      }

      c.gravity = gravityRef.current;
      c.tearRatio = tearRef.current;
      c.step(W, H);

      // Draw.
      ctx.fillStyle = "#050805";
      ctx.fillRect(0, 0, W, H);
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(0,220,80,0.62)";
      ctx.beginPath();
      for (const l of c.links) {
        if (l.torn) continue;
        const a = c.points[l.a];
        const b = c.points[l.b];
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
      }
      ctx.stroke();

      // Pins.
      ctx.fillStyle = "#c9ffd6";
      for (const p of c.points) {
        if (!p.pinned) continue;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Cursor ring in cut mode.
      if (modeRef.current === "cut" && ptr.down) {
        ctx.strokeStyle = "rgba(255,90,90,0.8)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(ptr.x, ptr.y, 16, 0, Math.PI * 2);
        ctx.stroke();
      }

      if ((frame++ & 7) === 0) setIntact(c.intactLinks);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [build]);

  const pointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = pointerPos(e);
    pointerRef.current = { x, y, down: true };
    e.currentTarget.setPointerCapture(e.pointerId);
    if (modeRef.current === "drag" && clothRef.current) {
      dragRef.current = clothRef.current.nearest(x, y, 28);
    }
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = pointerPos(e);
    pointerRef.current.x = x;
    pointerRef.current.y = y;
  };

  const onUp = () => {
    pointerRef.current.down = false;
    dragRef.current = -1;
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
          <span className="text-sm">verlet cloth</span>
        </div>
        <div className="text-xs text-primary/40 tabular-nums">{intact.toLocaleString()} threads intact</div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-primary/40 text-xs mr-1">tool</span>
          {(["drag", "cut"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                modeRef.current = m;
              }}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                mode === m
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/20 text-primary/50 hover:border-primary/50"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">gravity</span>
          <input
            type="range"
            min={0}
            max={1.2}
            step={0.02}
            value={gravity}
            onChange={(e) => {
              const v = Number(e.target.value);
              setGravity(v);
              gravityRef.current = v;
            }}
            className="w-24 accent-primary"
          />
          <span className="text-primary/60 text-xs w-8 tabular-nums">{gravity.toFixed(2)}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">tear at</span>
          <input
            type="range"
            min={1.5}
            max={8}
            step={0.1}
            value={tear}
            onChange={(e) => {
              const v = Number(e.target.value);
              setTear(v);
              tearRef.current = v;
            }}
            className="w-24 accent-primary"
          />
          <span className="text-primary/60 text-xs w-8 tabular-nums">{tear.toFixed(1)}×</span>
        </div>

        <button
          onClick={build}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors ml-auto"
        >
          ↺ reset cloth
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas
          ref={canvasRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          className={`block w-full h-full touch-none ${mode === "cut" ? "cursor-crosshair" : "cursor-grab"}`}
        />
        <div className="absolute bottom-3 left-4 text-xs text-primary/40 pointer-events-none max-w-xl">
          no velocities stored — each point just remembers where it was, and the threads are pulled
          back to length a few times a frame. drag it around, or switch to cut and tear it apart.
        </div>
      </div>
    </div>
  );
}
