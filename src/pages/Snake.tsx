import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Dir,
  GameState,
  newGame,
  tick,
  tickInterval,
  loadHiScore,
  saveHiScore,
} from "../features/snake/game";

const COLS = 28;
const ROWS = 20;
const CELL = 22;

const KEY_DIRS: Record<string, Dir> = {
  ArrowUp: "up", KeyW: "up",
  ArrowDown: "down", KeyS: "down",
  ArrowLeft: "left", KeyA: "left",
  ArrowRight: "right", KeyD: "right",
};

type Phase = "ready" | "playing" | "over";

export default function Snake() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(newGame(COLS, ROWS));
  const dirQueueRef = useRef<Dir[]>([]);
  const phaseRef = useRef<Phase>("ready");

  const [phase, setPhase] = useState<Phase>("ready");
  const [score, setScore] = useState(0);
  const [hiScore, setHiScore] = useState(() => loadHiScore());

  const setPhaseBoth = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = stateRef.current;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle grid
    ctx.strokeStyle = "rgba(0,255,65,0.06)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL, 0);
      ctx.lineTo(x * CELL, ROWS * CELL);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL);
      ctx.lineTo(COLS * CELL, y * CELL);
      ctx.stroke();
    }

    // Food
    if (s.food >= 0) {
      const fx = (s.food % COLS) * CELL;
      const fy = Math.floor(s.food / COLS) * CELL;
      ctx.fillStyle = "#ff4da6";
      ctx.beginPath();
      ctx.arc(fx + CELL / 2, fy + CELL / 2, CELL / 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Snake — head brightest, body fades toward tail
    s.snake.forEach((cell, i) => {
      const x = (cell % COLS) * CELL;
      const y = Math.floor(cell / COLS) * CELL;
      const t = i / Math.max(1, s.snake.length - 1);
      const alpha = 1 - t * 0.6;
      ctx.fillStyle = i === 0 ? "#00ff41" : `rgba(0,255,65,${alpha.toFixed(2)})`;
      ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
    });
  }, []);

  // Game loop — self-adjusting timeout so speed follows the score
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const loop = () => {
      if (phaseRef.current === "playing") {
        const queued = dirQueueRef.current.shift();
        const next = tick(stateRef.current, queued ?? stateRef.current.dir);
        stateRef.current = next;
        setScore(next.score);
        if (next.over) {
          setPhaseBoth("over");
          setHiScore((prev) => {
            const best = Math.max(prev, next.score);
            if (best > prev) saveHiScore(best);
            return best;
          });
        }
        draw();
      }
      timer = setTimeout(loop, tickInterval(stateRef.current.score));
    };
    timer = setTimeout(loop, tickInterval(0));
    draw();
    return () => clearTimeout(timer);
  }, [draw, setPhaseBoth]);

  const start = useCallback(() => {
    stateRef.current = newGame(COLS, ROWS);
    dirQueueRef.current = [];
    setScore(0);
    setPhaseBoth("playing");
  }, [setPhaseBoth]);

  // Keyboard input
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const dir = KEY_DIRS[e.code];
      if (dir) {
        e.preventDefault();
        if (phaseRef.current === "playing") {
          const q = dirQueueRef.current;
          const last = q.length > 0 ? q[q.length - 1] : stateRef.current.dir;
          if (dir !== last && q.length < 3) q.push(dir);
        }
        return;
      }
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        if (phaseRef.current !== "playing") start();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [start]);

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">snake</span>
        </div>
        <div className="text-xs text-primary/60">
          score {score} <span className="text-primary/30 ml-2">best {hiScore}</span>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={COLS * CELL}
            height={ROWS * CELL}
            className="border border-primary/20 max-w-full h-auto"
          />
          {phase !== "playing" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70">
              {phase === "over" && (
                <>
                  <div className="text-2xl text-primary">game over</div>
                  <div className="text-sm text-primary/50">
                    score {score}{score >= hiScore && score > 0 ? " — new best!" : ""}
                  </div>
                </>
              )}
              {phase === "ready" && (
                <div className="text-xl text-primary/80">snake</div>
              )}
              <button
                onClick={start}
                className="px-4 py-2 text-sm border border-primary/40 hover:border-primary text-primary/80 hover:text-primary transition-colors"
              >
                {phase === "over" ? "↺ play again" : "▶ start"}
              </button>
              <div className="text-xs text-primary/30">
                arrows / WASD to steer · space to start
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
