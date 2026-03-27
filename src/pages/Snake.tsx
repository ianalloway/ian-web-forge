import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Pause, Play, RotateCcw } from "lucide-react";
import MatrixRain from "@/components/MatrixRain";
import { Button } from "@/components/ui/button";
import {
  GRID_COLUMNS,
  GRID_ROWS,
  TICK_MS,
  advanceGame,
  createGame,
  restartGame,
  setDirection,
  togglePause,
  type Direction,
  type SnakeGameState,
} from "@/features/snake/game";

const CELL_COUNT = GRID_COLUMNS * GRID_ROWS;

const directionMap: Record<string, Direction> = {
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

const touchControls: Array<{ label: string; direction: Direction; className: string }> = [
  { label: "Up", direction: "up", className: "col-start-2" },
  { label: "Left", direction: "left", className: "col-start-1 row-start-2" },
  { label: "Down", direction: "down", className: "col-start-2 row-start-2" },
  { label: "Right", direction: "right", className: "col-start-3 row-start-2" },
];

function statusLabel(state: SnakeGameState) {
  if (state.status === "paused") {
    return "Paused";
  }

  if (state.status === "game_over") {
    return state.won ? "You win" : "Game over";
  }

  return "Running";
}

export default function Snake() {
  const [game, setGame] = useState<SnakeGameState>(() => createGame());

  useEffect(() => {
    if (game.status !== "running") {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setGame((current) => advanceGame(current));
    }, TICK_MS);

    return () => window.clearInterval(timerId);
  }, [game.status]);

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        setGame((current) => togglePause(current));
        return;
      }

      const nextDirection = directionMap[event.key];
      if (!nextDirection) {
        return;
      }

      event.preventDefault();
      setGame((current) => {
        if (current.status === "game_over") {
          return current;
        }

        return setDirection(current, nextDirection);
      });
    };

    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, []);

  const snakeCells = new Map(
    game.snake.map((segment, index) => [`${segment.x},${segment.y}`, index] as const),
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <MatrixRain />

      <main className="relative z-10 max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" className="font-mono terminal-border text-primary border-primary" asChild>
            <Link to="/toolkit">
              <ArrowLeft className="mr-2" />
              Back to toolkit
            </Link>
          </Button>
          <p className="text-xs font-mono text-primary/80">ianalloway.xyz/snake</p>
        </div>

        <section className="terminal-border rounded-xl bg-card/55 backdrop-blur-sm p-5 md:p-8">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="inline-block px-2 py-1 text-xs font-mono text-primary terminal-border mb-3">
                PLAYABLE_DEMO
              </p>
              <h1 className="text-3xl md:text-4xl font-mono font-bold matrix-text text-primary mb-3">
                Snake
              </h1>
              <p className="max-w-2xl text-sm md:text-base text-muted-foreground font-mono leading-relaxed">
                Classic Snake only: grid movement, food, growth, score, crash state, and restart. Arrow keys
                or WASD to move. Space pauses.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm font-mono min-w-[220px]">
              <div className="rounded-lg border border-primary/30 bg-background/70 p-3">
                <div className="text-primary/70 text-xs mb-1">SCORE</div>
                <div className="text-primary text-2xl font-bold">{game.score}</div>
              </div>
              <div className="rounded-lg border border-primary/30 bg-background/70 p-3">
                <div className="text-primary/70 text-xs mb-1">STATUS</div>
                <div className="text-primary text-base font-bold">{statusLabel(game)}</div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-start">
            <div className="rounded-xl border border-primary/30 bg-background/70 p-3 md:p-4">
              <div
                className="grid gap-[3px] rounded-lg bg-primary/20 p-[3px]"
                style={{ gridTemplateColumns: `repeat(${GRID_COLUMNS}, minmax(0, 1fr))` }}
                role="grid"
                aria-label="Snake board"
              >
                {Array.from({ length: CELL_COUNT }, (_, index) => {
                  const x = index % GRID_COLUMNS;
                  const y = Math.floor(index / GRID_COLUMNS);
                  const key = `${x},${y}`;
                  const snakeIndex = snakeCells.get(key);
                  const isFood = game.food?.x === x && game.food?.y === y;

                  let cellClassName = "bg-muted/70";
                  if (typeof snakeIndex === "number") {
                    cellClassName = snakeIndex === 0 ? "bg-primary" : "bg-primary/75";
                  } else if (isFood) {
                    cellClassName = "bg-destructive";
                  }

                  return (
                    <div
                      key={key}
                      className={`aspect-square rounded-[2px] ${cellClassName}`}
                      aria-hidden="true"
                    />
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-primary/30 bg-background/70 p-4">
                <div className="flex flex-wrap gap-3">
                  <Button
                    className="font-mono flex-1 min-w-[120px]"
                    onClick={() => setGame((current) => togglePause(current))}
                  >
                    {game.status === "paused" ? (
                      <>
                        <Play className="mr-2" />
                        Resume
                      </>
                    ) : (
                      <>
                        <Pause className="mr-2" />
                        Pause
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="font-mono terminal-border text-primary border-primary flex-1 min-w-[120px]"
                    onClick={() => setGame((current) => restartGame(current))}
                  >
                    <RotateCcw className="mr-2" />
                    Restart
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-primary/30 bg-background/70 p-4">
                <h2 className="text-sm font-mono text-primary mb-3">CONTROLS</h2>
                <div className="grid grid-cols-3 gap-2 md:hidden mb-4">
                  {touchControls.map((control) => (
                    <Button
                      key={control.direction}
                      variant="outline"
                      className={`font-mono terminal-border text-primary border-primary ${control.className}`}
                      onClick={() => {
                        setGame((current) =>
                          current.status === "game_over" ? current : setDirection(current, control.direction),
                        );
                      }}
                    >
                      {control.label}
                    </Button>
                  ))}
                </div>
                <ul className="space-y-2 text-xs text-muted-foreground font-mono">
                  <li>Arrow keys or WASD to move</li>
                  <li>Space to pause or resume</li>
                  <li>Restart after any crash</li>
                  <li>Walls and self-collisions end the run</li>
                </ul>
              </div>

              <div className="rounded-xl border border-primary/30 bg-background/70 p-4">
                <h2 className="text-sm font-mono text-primary mb-2">PLAY FROM YOUR SITE</h2>
                <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                  This game now lives inside the main site, so you can link directly to
                  {" "}
                  <span className="text-primary">/snake</span>
                  {" "}
                  without adding a separate deployment.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
