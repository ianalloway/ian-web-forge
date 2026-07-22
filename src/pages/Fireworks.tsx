import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Rocket,
  Spark,
  launchRocket,
  stepRocket,
  rocketExploded,
  burst,
  stepSpark,
  randomShape,
} from "../features/fireworks/particles";

const MAX_SPARKS = 4000;

export default function Fireworks() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rocketsRef = useRef<Rocket[]>([]);
  const sparksRef = useRef<Spark[]>([]);
  const autoRef = useRef(true);
  const [auto, setAuto] = useState(true);
  const [sparkCount, setSparkCount] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let frame = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      frame++;
      const { width: W, height: H } = canvas;

      // Auto-show: random launches
      if (autoRef.current && frame % 45 === 0 && Math.random() < 0.9) {
        rocketsRef.current.push(
          launchRocket(
            W * (0.15 + Math.random() * 0.7),
            H,
            H * (0.15 + Math.random() * 0.3)
          )
        );
      }

      // Fade for trails
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(0,0,0,0.16)";
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";

      // Rockets
      const stillFlying: Rocket[] = [];
      for (const r of rocketsRef.current) {
        stepRocket(r);
        if (rocketExploded(r)) {
          const shape = randomShape();
          const newSparks = burst(r.x, r.y, r.hue, shape);
          const room = MAX_SPARKS - sparksRef.current.length;
          sparksRef.current.push(...newSparks.slice(0, Math.max(0, room)));
        } else {
          stillFlying.push(r);
          ctx.fillStyle = `hsla(${r.hue}, 100%, 70%, 0.9)`;
          ctx.fillRect(r.x - 1, r.y - 1, 2.5, 4);
        }
      }
      rocketsRef.current = stillFlying;

      // Sparks
      const alive: Spark[] = [];
      for (const s of sparksRef.current) {
        stepSpark(s);
        if (s.life <= 0 || s.y > H + 10) continue;
        alive.push(s);
        const flicker = s.glitter && Math.random() < 0.35 ? 0.2 : 1;
        const alpha = Math.max(0, s.life) * flicker;
        ctx.fillStyle = `hsla(${s.hue}, 100%, ${55 + s.life * 20}%, ${alpha.toFixed(2)})`;
        const size = 1 + s.life * 1.6;
        ctx.fillRect(s.x - size / 2, s.y - size / 2, size, size);
      }
      sparksRef.current = alive;

      if (frame % 15 === 0) setSparkCount(alive.length);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      ctx.globalCompositeOperation = "source-over";
    };
  }, []);

  const onClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    rocketsRef.current.push(launchRocket(x, canvas.height, Math.max(40, y)));
  };

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">fireworks</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-primary/40 tabular-nums">{sparkCount} sparks</span>
          <button
            onClick={() => {
              autoRef.current = !auto;
              setAuto(!auto);
            }}
            className={`px-2 py-0.5 text-xs border transition-colors ${
              auto
                ? "border-primary bg-primary/10 text-primary"
                : "border-primary/20 text-primary/40 hover:border-primary/50"
            }`}
          >
            auto show {auto ? "on" : "off"}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas
          ref={canvasRef}
          className="block w-full h-full cursor-pointer"
          onClick={onClick}
        />
        <div className="absolute bottom-3 left-4 text-xs text-primary/30 pointer-events-none">
          click anywhere to launch a rocket to that height
        </div>
      </div>
    </div>
  );
}
