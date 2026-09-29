import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Link } from "react-router-dom";
import { computeScoreline, ScorelineResult } from "../features/scoreline/scoreline";

const PRESETS: { label: string; home: number; away: number }[] = [
  { label: "tight", home: 1.1, away: 1.0 },
  { label: "home fav", home: 1.8, away: 0.9 },
  { label: "away fav", home: 0.9, away: 1.7 },
  { label: "open", home: 2.2, away: 2.0 },
];

function pct(p: number): string {
  return `${(p * 100).toFixed(1)}%`;
}

export default function Scoreline() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lambdaHome, setLambdaHome] = useState(1.45);
  const [lambdaAway, setLambdaAway] = useState(1.15);
  const [maxGoals, setMaxGoals] = useState(6);
  const [hover, setHover] = useState<{ home: number; away: number } | null>(null);

  const result: ScorelineResult = useMemo(
    () => computeScoreline({ lambdaHome, lambdaAway, maxGoals }),
    [lambdaHome, lambdaAway, maxGoals]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const W = rect.width;
      const H = rect.height;
      ctx.fillStyle = "#050805";
      ctx.fillRect(0, 0, W, H);

      const n = result.maxGoals + 1;
      const padL = 44;
      const padB = 36;
      const padT = 16;
      const padR = 16;
      const gridW = W - padL - padR;
      const gridH = H - padT - padB;
      const cell = Math.min(gridW / n, gridH / n);
      const ox = padL + (gridW - cell * n) / 2;
      const oy = padT + (gridH - cell * n) / 2;

      let peak = 0;
      for (let i = 0; i < result.probs.length; i++) {
        if (result.probs[i] > peak) peak = result.probs[i];
      }
      if (peak <= 0) peak = 1;

      // Cells: away goals on X (left→right), home goals on Y (bottom→top).
      for (let h = 0; h < n; h++) {
        for (let a = 0; a < n; a++) {
          const p = result.probs[h * n + a];
          const t = Math.sqrt(p / peak); // sqrt stretch so mid-prob cells stay visible
          const x = ox + a * cell;
          const y = oy + (n - 1 - h) * cell;

          const isMode =
            h === result.mostLikely.home && a === result.mostLikely.away;
          const isHover = hover?.home === h && hover?.away === a;

          if (isMode) {
            ctx.fillStyle = `rgba(200,255,210,${0.35 + 0.55 * t})`;
          } else {
            ctx.fillStyle = `rgba(0,255,65,${0.06 + 0.72 * t})`;
          }
          ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);

          if (isHover || isMode) {
            ctx.strokeStyle = isMode ? "#c9ffd6" : "rgba(0,255,65,0.85)";
            ctx.lineWidth = isMode ? 2 : 1;
            ctx.strokeRect(x + 1.5, y + 1.5, cell - 3, cell - 3);
          }

          if (cell >= 36) {
            ctx.fillStyle = t > 0.55 ? "#031006" : "rgba(0,255,65,0.75)";
            ctx.font = `${Math.min(12, cell * 0.28)}px monospace`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(`${(p * 100).toFixed(1)}%`, x + cell / 2, y + cell / 2);
          } else if (cell >= 24 && isMode) {
            ctx.fillStyle = "#031006";
            ctx.font = "10px monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("★", x + cell / 2, y + cell / 2);
          }
        }
      }

      // Axis ticks
      ctx.fillStyle = "rgba(0,255,65,0.45)";
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      for (let a = 0; a < n; a++) {
        ctx.fillText(String(a), ox + a * cell + cell / 2, oy + n * cell + 8);
      }
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      for (let h = 0; h < n; h++) {
        ctx.fillText(String(h), ox - 8, oy + (n - 1 - h) * cell + cell / 2);
      }
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = "rgba(0,255,65,0.3)";
      ctx.fillText("away goals →", ox + (n * cell) / 2, oy + n * cell + 22);
      ctx.save();
      ctx.translate(14, oy + (n * cell) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textBaseline = "middle";
      ctx.fillText("home goals →", 0, 0);
      ctx.restore();
    };

    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [result, hover]);

  const onPointer = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    const n = result.maxGoals + 1;
    const padL = 44;
    const padB = 36;
    const padT = 16;
    const padR = 16;
    const gridW = W - padL - padR;
    const gridH = H - padT - padB;
    const cell = Math.min(gridW / n, gridH / n);
    const ox = padL + (gridW - cell * n) / 2;
    const oy = padT + (gridH - cell * n) / 2;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const a = Math.floor((x - ox) / cell);
    const h = n - 1 - Math.floor((y - oy) / cell);
    if (a < 0 || a >= n || h < 0 || h >= n) {
      setHover(null);
      return;
    }
    setHover({ home: h, away: a });
  };

  const hoverP =
    hover == null
      ? null
      : result.probs[hover.home * (result.maxGoals + 1) + hover.away];

  const mode = result.mostLikely;

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">poisson scoreline heatmap</span>
          <span className="text-primary/20 hidden sm:inline">|</span>
          <Link
            to="/kelly"
            className="text-primary/40 hover:text-primary text-xs hidden sm:inline transition-colors"
          >
            sports math hub
          </Link>
          <span className="text-primary/20 hidden sm:inline">|</span>
          <Link
            to="/vig"
            className="text-primary/40 hover:text-primary text-xs hidden sm:inline transition-colors"
          >
            no-vig
          </Link>
        </div>
        <div className="text-xs text-primary/40 tabular-nums">
          mode {mode.home}–{mode.away} · {pct(mode.probability)} · grid covers{" "}
          {(result.covered * 100).toFixed(1)}%
        </div>
      </div>

      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">λ home</span>
          <input
            type="range"
            min={0.2}
            max={3.5}
            step={0.05}
            value={lambdaHome}
            onChange={(e) => setLambdaHome(Number(e.target.value))}
            className="w-28 accent-primary"
          />
          <span className="text-primary/60 text-xs w-8 tabular-nums">{lambdaHome.toFixed(2)}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">λ away</span>
          <input
            type="range"
            min={0.2}
            max={3.5}
            step={0.05}
            value={lambdaAway}
            onChange={(e) => setLambdaAway(Number(e.target.value))}
            className="w-28 accent-primary"
          />
          <span className="text-primary/60 text-xs w-8 tabular-nums">{lambdaAway.toFixed(2)}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">max goals</span>
          <input
            type="range"
            min={4}
            max={8}
            step={1}
            value={maxGoals}
            onChange={(e) => setMaxGoals(Number(e.target.value))}
            className="w-20 accent-primary"
          />
          <span className="text-primary/60 text-xs w-4 tabular-nums">{maxGoals}</span>
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                setLambdaHome(p.home);
                setLambdaAway(p.away);
              }}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                lambdaHome === p.home && lambdaAway === p.away
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/20 text-primary/50 hover:border-primary/50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap gap-x-6 gap-y-1 text-xs tabular-nums">
        <span className="text-primary/40">
          home win <span className="text-primary/90">{pct(result.homeWin)}</span>
        </span>
        <span className="text-primary/40">
          draw <span className="text-primary/90">{pct(result.draw)}</span>
        </span>
        <span className="text-primary/40">
          away win <span className="text-primary/90">{pct(result.awayWin)}</span>
        </span>
        <span className="text-primary/40">
          over 2.5 <span className="text-primary/90">{pct(result.over25)}</span>
        </span>
        <span className="text-primary/40">
          under 2.5 <span className="text-primary/90">{pct(result.under25)}</span>
        </span>
        <span className="text-primary/40">
          E[total] <span className="text-primary/90">{result.expectedTotal.toFixed(2)}</span>
        </span>
        {hover && hoverP != null && (
          <span className="text-primary/40">
            hover{" "}
            <span className="text-primary/90">
              {hover.home}–{hover.away} {pct(hoverP)}
            </span>
          </span>
        )}
      </div>

      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas
          ref={canvasRef}
          className="block w-full h-full cursor-crosshair"
          onPointerMove={onPointer}
          onPointerLeave={() => setHover(null)}
        />
        <div className="absolute bottom-3 left-4 right-4 text-xs text-primary/40 pointer-events-none max-w-2xl">
          Independent Poisson goals: P(i,j) = Pois(i|λ_h)·Pois(j|λ_a). Bright cell = mode.
          Markets renormalized over the truncated grid — not Bridson sampling (
          <Link to="/poisson" className="pointer-events-auto text-primary/60 hover:text-primary underline">
            /poisson
          </Link>
          ).
        </div>
      </div>
    </div>
  );
}
