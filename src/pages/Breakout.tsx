import { useCallback, useEffect, useReducer, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Heart } from "lucide-react";
import MatrixRain from "@/components/MatrixRain";
import { Button } from "@/components/ui/button";
import {
  BALL_R,
  BRICK_H,
  BRICK_W,
  CANVAS_H,
  CANVAS_W,
  PADDLE_H,
  PADDLE_W,
  PADDLE_Y,
  ROW_COLORS,
  createPhysics,
  resetBall,
  step,
  type Physics,
} from "@/features/breakout/game";

type Status = "idle" | "playing" | "paused" | "over" | "won";

interface Display {
  score: number;
  lives: number;
  status: Status;
}

type Action =
  | { type: "start" }
  | { type: "score"; pts: number }
  | { type: "loseLife" }
  | { type: "win" }
  | { type: "togglePause" }
  | { type: "newGame" };

const INIT: Display = { score: 0, lives: 3, status: "idle" };

function reducer(state: Display, action: Action): Display {
  switch (action.type) {
    case "start":
      return state.status === "idle" ? { ...state, status: "playing" } : state;
    case "score":
      return { ...state, score: state.score + action.pts };
    case "loseLife":
      if (state.lives <= 1) return { ...state, lives: 0, status: "over" };
      return { ...state, lives: state.lives - 1, status: "idle" };
    case "win":
      return { ...state, status: "won" };
    case "togglePause":
      if (state.status === "playing") return { ...state, status: "paused" };
      if (state.status === "paused") return { ...state, status: "playing" };
      return state;
    case "newGame":
      return INIT;
    default:
      return state;
  }
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  physics: Physics,
  display: Display,
) {
  const { ball, paddleX, bricks } = physics;

  ctx.fillStyle = "#0d0d0d";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  for (const brick of bricks) {
    if (!brick.alive) continue;
    ctx.fillStyle = ROW_COLORS[brick.row];
    ctx.fillRect(brick.x, brick.y, BRICK_W, BRICK_H);
  }

  ctx.fillStyle = "#00ff41";
  ctx.fillRect(paddleX - PADDLE_W / 2, PADDLE_Y, PADDLE_W, PADDLE_H);

  if (display.status !== "over" && display.status !== "won") {
    ctx.fillStyle = "#00ff41";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.textAlign = "center";

  if (display.status === "idle") {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = "#00ff41";
    ctx.font = "bold 28px monospace";
    ctx.fillText(
      display.lives < 3 ? "BALL LOST" : "BREAKOUT",
      CANVAS_W / 2,
      CANVAS_H / 2 - 20,
    );
    ctx.font = "15px monospace";
    ctx.fillStyle = "#00cc33";
    ctx.fillText("click or press Space to launch", CANVAS_W / 2, CANVAS_H / 2 + 18);
  } else if (display.status === "paused") {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = "#00ff41";
    ctx.font = "bold 28px monospace";
    ctx.fillText("PAUSED", CANVAS_W / 2, CANVAS_H / 2 - 10);
    ctx.font = "15px monospace";
    ctx.fillStyle = "#00cc33";
    ctx.fillText("press Space to resume", CANVAS_W / 2, CANVAS_H / 2 + 26);
  } else if (display.status === "over") {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = "#ef4444";
    ctx.font = "bold 34px monospace";
    ctx.fillText("GAME OVER", CANVAS_W / 2, CANVAS_H / 2 - 24);
    ctx.fillStyle = "#00ff41";
    ctx.font = "16px monospace";
    ctx.fillText(`score: ${display.score}`, CANVAS_W / 2, CANVAS_H / 2 + 16);
    ctx.fillStyle = "#00cc33";
    ctx.font = "14px monospace";
    ctx.fillText("Space or click to try again", CANVAS_W / 2, CANVAS_H / 2 + 48);
  } else if (display.status === "won") {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = "#00ff41";
    ctx.font = "bold 34px monospace";
    ctx.fillText("YOU WIN!", CANVAS_W / 2, CANVAS_H / 2 - 24);
    ctx.fillStyle = "#eab308";
    ctx.font = "16px monospace";
    ctx.fillText(`score: ${display.score}`, CANVAS_W / 2, CANVAS_H / 2 + 16);
    ctx.fillStyle = "#00cc33";
    ctx.font = "14px monospace";
    ctx.fillText("Space or click to play again", CANVAS_W / 2, CANVAS_H / 2 + 48);
  }
}

export default function Breakout() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const physicsRef = useRef<Physics>(createPhysics());
  const paddleXRef = useRef(CANVAS_W / 2);
  const lastTimeRef = useRef<number | null>(null);

  const [display, dispatch] = useReducer(reducer, INIT);
  const displayRef = useRef(display);
  useEffect(() => {
    displayRef.current = display;
  }, [display]);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "A" || tag === "BUTTON" || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const { status } = displayRef.current;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (status === "idle") {
          dispatch({ type: "start" });
        } else if (status === "playing" || status === "paused") {
          dispatch({ type: "togglePause" });
        } else if (status === "over" || status === "won") {
          physicsRef.current = createPhysics();
          paddleXRef.current = CANVAS_W / 2;
          dispatch({ type: "newGame" });
        }
      }
      if (e.key === "ArrowLeft" || e.key === "a") {
        paddleXRef.current = Math.max(PADDLE_W / 2, paddleXRef.current - 20);
      }
      if (e.key === "ArrowRight" || e.key === "d") {
        paddleXRef.current = Math.min(
          CANVAS_W - PADDLE_W / 2,
          paddleXRef.current + 20,
        );
      }
    },
    [],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      paddleXRef.current = (e.clientX - rect.left) * scaleX;
    },
    [],
  );

  const handleCanvasClick = useCallback(() => {
    const { status } = displayRef.current;
    if (status === "idle") {
      dispatch({ type: "start" });
    } else if (status === "over" || status === "won") {
      physicsRef.current = createPhysics();
      paddleXRef.current = CANVAS_W / 2;
      dispatch({ type: "newGame" });
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId: number;

    function loop(ts: number) {
      rafId = requestAnimationFrame(loop);

      const dt =
        lastTimeRef.current != null ? (ts - lastTimeRef.current) / 1000 : 0;
      lastTimeRef.current = ts;

      const { status } = displayRef.current;

      if (status === "playing") {
        const result = step(physicsRef.current, paddleXRef.current, dt);
        physicsRef.current = result.physics;

        if (result.scored > 0) {
          dispatch({ type: "score", pts: result.scored });
        }
        if (result.won) {
          dispatch({ type: "win" });
        } else if (result.lifeLost) {
          const lives = displayRef.current.lives;
          dispatch({ type: "loseLife" });
          if (lives > 1) {
            physicsRef.current = resetBall(result.physics);
          }
        }
      }

      drawScene(ctx, physicsRef.current, displayRef.current);
    }

    rafId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId);
      lastTimeRef.current = null;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <MatrixRain />

      <main className="relative z-10 max-w-3xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="outline"
            className="font-mono terminal-border text-primary border-primary"
            asChild
          >
            <Link to="/playground">
              <ArrowLeft className="mr-2" />
              Playground
            </Link>
          </Button>
          <p className="text-xs font-mono text-primary/80">
            ianalloway.xyz/breakout
          </p>
        </div>

        <header className="mb-6">
          <p className="inline-block px-2 py-1 text-xs font-mono text-primary terminal-border mb-3">
            GAME
          </p>
          <h1 className="text-3xl md:text-4xl font-mono font-bold matrix-text text-primary mb-2">
            Breakout
          </h1>
          <p className="text-sm text-muted-foreground font-mono">
            Move the paddle with your mouse or arrow keys. Don't let the ball
            drop — destroy every brick to win.
          </p>
        </header>

        <div className="flex items-center justify-between mb-3 font-mono text-sm text-primary">
          <span>score: {display.score}</span>
          <div className="flex gap-1 items-center">
            {Array.from({ length: Math.max(0, display.lives) }).map((_, i) => (
              <Heart key={i} size={14} className="fill-primary text-primary" />
            ))}
          </div>
        </div>

        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="w-full rounded-xl border border-primary/30 cursor-none touch-none"
          onPointerMove={handlePointerMove}
          onClick={handleCanvasClick}
        />

        <p className="mt-4 text-xs font-mono text-muted-foreground text-center">
          mouse or arrow keys to move · Space to pause · click to launch
        </p>
      </main>
    </div>
  );
}
