import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw } from "lucide-react";
import MatrixRain from "@/components/MatrixRain";
import { Button } from "@/components/ui/button";
import {
  SIZE,
  type Direction,
  type GameState,
  applyMove,
  continuePlaying,
  createGame,
} from "@/features/g2048/game";

const BEST_KEY = "ianalloway:2048:best";

const KEY_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  a: "left",
  s: "down",
  d: "right",
  W: "up",
  A: "left",
  S: "down",
  D: "right",
};

/** Tile styles keyed by value — brighter, more glow as values climb. */
function tileClass(value: number): string {
  if (value === 0) {
    return "bg-primary/5 text-transparent";
  }
  if (value <= 4) {
    return "bg-primary/15 text-primary";
  }
  if (value <= 16) {
    return "bg-primary/25 text-primary";
  }
  if (value <= 64) {
    return "bg-primary/40 text-background";
  }
  if (value <= 256) {
    return "bg-primary/60 text-background";
  }
  if (value < 2048) {
    return "bg-primary/80 text-background shadow-[0_0_12px_hsl(var(--primary)/0.5)]";
  }
  return "bg-primary text-background shadow-[0_0_18px_hsl(var(--primary)/0.8)]";
}

function tileFontClass(value: number): string {
  if (value >= 1024) {
    return "text-xl md:text-3xl";
  }
  if (value >= 128) {
    return "text-2xl md:text-4xl";
  }
  return "text-3xl md:text-5xl";
}

export default function Game2048() {
  const [game, setGame] = useState<GameState>(() => createGame());
  const [best, setBest] = useState(() => {
    const stored = Number(window.localStorage.getItem(BEST_KEY) ?? "0");
    return Number.isFinite(stored) ? stored : 0;
  });

  // Adjust the derived best score during render when the current score
  // overtakes it (React's documented "adjusting state on change" pattern).
  if (game.score > best) {
    setBest(game.score);
  }

  // Persist the best score to localStorage — an external-system sync.
  useEffect(() => {
    window.localStorage.setItem(BEST_KEY, String(best));
  }, [best]);

  const handleDirection = useCallback((direction: Direction) => {
    setGame((current) => applyMove(current, direction));
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const direction = KEY_TO_DIRECTION[event.key];
      if (!direction) {
        return;
      }
      event.preventDefault();
      handleDirection(direction);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleDirection]);

  // Touch swipe handling.
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = useCallback((event: React.TouchEvent) => {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }, []);
  const onTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      const start = touchStart.current;
      if (!start) {
        return;
      }
      const touch = event.changedTouches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      if (Math.max(absX, absY) < 24) {
        return;
      }
      if (absX > absY) {
        handleDirection(dx > 0 ? "right" : "left");
      } else {
        handleDirection(dy > 0 ? "down" : "up");
      }
      touchStart.current = null;
    },
    [handleDirection],
  );

  const statusLabel =
    game.status === "won" ? "You hit 2048!" : game.status === "lost" ? "Game over" : "Playing";

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <MatrixRain />

      <main className="relative z-10 max-w-2xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" className="font-mono terminal-border text-primary border-primary" asChild>
            <Link to="/demos">
              <ArrowLeft className="mr-2" />
              Back to demos
            </Link>
          </Button>
          <p className="text-xs font-mono text-primary/80">ianalloway.xyz/2048</p>
        </div>

        <section className="terminal-border rounded-xl bg-card/55 backdrop-blur-sm p-5 md:p-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="inline-block px-2 py-1 text-xs font-mono text-primary terminal-border mb-3">
                PLAYABLE_DEMO
              </p>
              <h1 className="text-3xl md:text-4xl font-mono font-bold matrix-text text-primary mb-3">
                2048
              </h1>
              <p className="max-w-md text-sm text-muted-foreground font-mono leading-relaxed">
                Merge matching tiles to reach 2048. Arrow keys or WASD on desktop, swipe on mobile.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm font-mono min-w-[200px]">
              <div className="rounded-lg border border-primary/30 bg-background/70 p-3">
                <div className="text-primary/70 text-xs mb-1">SCORE</div>
                <div className="text-primary text-2xl font-bold" aria-live="polite">
                  {game.score}
                </div>
              </div>
              <div className="rounded-lg border border-primary/30 bg-background/70 p-3">
                <div className="text-primary/70 text-xs mb-1">BEST</div>
                <div className="text-primary text-2xl font-bold">{best}</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div
              className="grid gap-2 rounded-xl border border-primary/30 bg-background/70 p-2 md:p-3 touch-none select-none"
              style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
              role="grid"
              aria-label="2048 board"
            >
              {game.board.map((value, index) => (
                <div
                  key={index}
                  role="gridcell"
                  className={`aspect-square rounded-md flex items-center justify-center font-mono font-bold tabular-nums transition-colors ${tileClass(value)} ${tileFontClass(value)}`}
                >
                  {value === 0 ? "" : value}
                </div>
              ))}
            </div>

            {(game.status === "won" || game.status === "lost") && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-xl bg-background/85 backdrop-blur-sm">
                <p className="text-3xl font-mono font-bold matrix-text text-primary">{statusLabel}</p>
                <div className="flex gap-3">
                  {game.status === "won" && (
                    <Button
                      className="font-mono"
                      onClick={() => setGame((current) => continuePlaying(current))}
                    >
                      Keep going
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="font-mono terminal-border text-primary border-primary"
                    onClick={() => setGame(createGame())}
                  >
                    <RotateCcw className="mr-2" />
                    New game
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <Button
              variant="outline"
              className="font-mono terminal-border text-primary border-primary"
              onClick={() => setGame(createGame())}
            >
              <RotateCcw className="mr-2" />
              New game
            </Button>
            <p className="text-xs font-mono text-muted-foreground" aria-live="polite">
              status: <span className="text-primary">{statusLabel}</span>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
