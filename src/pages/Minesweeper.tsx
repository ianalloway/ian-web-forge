import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Bomb, Flag, RotateCcw } from "lucide-react";
import MatrixRain from "@/components/MatrixRain";
import { Button } from "@/components/ui/button";
import {
  DIFFICULTIES,
  type Board,
  type Difficulty,
  createGame,
  minesRemaining,
  reveal,
  toggleFlag,
} from "@/features/minesweeper/game";

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  expert: "Expert",
};

const DIFFICULTY_ORDER: Difficulty[] = ["beginner", "intermediate", "expert"];

// Distinct, readable colors for the adjacency numbers.
const NUMBER_COLORS = [
  "",
  "text-sky-400",
  "text-primary",
  "text-amber-400",
  "text-orange-400",
  "text-red-400",
  "text-pink-400",
  "text-purple-300",
  "text-muted-foreground",
];

export default function Minesweeper() {
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [board, setBoard] = useState<Board>(() => createGame("beginner"));
  const [flagMode, setFlagMode] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(0);

  // Live timer while a game is in progress.
  useEffect(() => {
    if (startedAt === null || finishedAt !== null) {
      return undefined;
    }
    const id = window.setInterval(() => setNowMs(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [startedAt, finishedAt]);

  const newGame = useCallback((next: Difficulty) => {
    setDifficulty(next);
    setBoard(createGame(next));
    setStartedAt(null);
    setFinishedAt(null);
    setNowMs(0);
  }, []);

  const doReveal = useCallback(
    (index: number) => {
      if (board.status === "won" || board.status === "lost") {
        return;
      }
      const next = reveal(board, index);
      if (board.status === "ready" && next.status !== "ready") {
        const stamp = Date.now();
        setStartedAt(stamp);
        setNowMs(stamp);
      }
      if (next.status === "won" || next.status === "lost") {
        setFinishedAt(Date.now());
      }
      setBoard(next);
    },
    [board],
  );

  const doFlag = useCallback(
    (index: number) => {
      setBoard(toggleFlag(board, index));
    },
    [board],
  );

  const handleCell = useCallback(
    (index: number) => {
      if (flagMode) {
        doFlag(index);
      } else {
        doReveal(index);
      }
    },
    [flagMode, doFlag, doReveal],
  );

  const elapsed = useMemo(() => {
    if (startedAt === null) {
      return 0;
    }
    return Math.max(0, (finishedAt ?? nowMs) - startedAt);
  }, [startedAt, finishedAt, nowMs]);

  const seconds = Math.floor(elapsed / 1000);
  const remaining = minesRemaining(board);
  const statusLabel =
    board.status === "won"
      ? "Cleared!"
      : board.status === "lost"
        ? "Boom"
        : board.status === "playing"
          ? "Playing"
          : "Ready";

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <MatrixRain />

      <main className="relative z-10 max-w-3xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" className="font-mono terminal-border text-primary border-primary" asChild>
            <Link to="/demos">
              <ArrowLeft className="mr-2" />
              Back to demos
            </Link>
          </Button>
          <p className="text-xs font-mono text-primary/80">ianalloway.xyz/minesweeper</p>
        </div>

        <section className="terminal-border rounded-xl bg-card/55 backdrop-blur-sm p-5 md:p-8">
          <div className="mb-6">
            <p className="inline-block px-2 py-1 text-xs font-mono text-primary terminal-border mb-3">
              PLAYABLE_DEMO
            </p>
            <h1 className="text-3xl md:text-4xl font-mono font-bold matrix-text text-primary mb-3">
              Minesweeper
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground font-mono leading-relaxed">
              Clear the board without hitting a mine. The first click is always safe. Click to
              reveal; right-click (or flag mode) to mark a mine.
            </p>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            {DIFFICULTY_ORDER.map((level) => (
              <Button
                key={level}
                variant={level === difficulty ? "default" : "outline"}
                className={`font-mono ${level === difficulty ? "" : "terminal-border text-primary border-primary"}`}
                onClick={() => newGame(level)}
              >
                {DIFFICULTY_LABELS[level]}
                <span className="ml-2 opacity-70 text-xs">
                  {DIFFICULTIES[level].cols}×{DIFFICULTIES[level].rows}
                </span>
              </Button>
            ))}
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 font-mono">
            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-primary/30 bg-background/70 px-3 py-2 flex items-center gap-2">
                <Bomb size={14} className="text-primary" />
                <span className="text-primary text-lg font-bold tabular-nums" aria-live="polite">
                  {remaining}
                </span>
              </div>
              <div className="rounded-lg border border-primary/30 bg-background/70 px-3 py-2">
                <span className="text-primary text-lg font-bold tabular-nums">{seconds}s</span>
              </div>
              <span className="text-sm text-primary">{statusLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={flagMode ? "default" : "outline"}
                className={`font-mono ${flagMode ? "" : "terminal-border text-primary border-primary"}`}
                onClick={() => setFlagMode((value) => !value)}
                aria-pressed={flagMode}
              >
                <Flag className="mr-2" />
                {flagMode ? "Flag mode: on" : "Flag mode"}
              </Button>
              <Button
                variant="outline"
                className="font-mono terminal-border text-primary border-primary"
                onClick={() => newGame(difficulty)}
              >
                <RotateCcw className="mr-2" />
                Reset
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div
              className="inline-grid gap-[2px] rounded-lg bg-primary/15 p-[2px] mx-auto"
              style={{ gridTemplateColumns: `repeat(${board.cols}, minmax(0, 1fr))` }}
              role="grid"
              aria-label="Minesweeper board"
            >
              {board.cells.map((cell, index) => {
                const base =
                  "w-7 h-7 md:w-8 md:h-8 flex items-center justify-center font-mono text-sm font-bold select-none";
                if (cell.revealed) {
                  if (cell.mine) {
                    return (
                      <div key={index} role="gridcell" className={`${base} bg-destructive/80 text-background rounded-[2px]`}>
                        <Bomb size={14} />
                      </div>
                    );
                  }
                  return (
                    <div
                      key={index}
                      role="gridcell"
                      className={`${base} bg-background/80 rounded-[2px] ${NUMBER_COLORS[cell.adjacent]}`}
                    >
                      {cell.adjacent > 0 ? cell.adjacent : ""}
                    </div>
                  );
                }
                return (
                  <button
                    key={index}
                    type="button"
                    role="gridcell"
                    aria-label={`Cell ${(index % board.cols) + 1}, ${Math.floor(index / board.cols) + 1}`}
                    className={`${base} rounded-[2px] bg-primary/25 hover:bg-primary/40 transition-colors`}
                    onClick={() => handleCell(index)}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      doFlag(index);
                    }}
                  >
                    {cell.flagged ? <Flag size={13} className="text-primary" /> : ""}
                  </button>
                );
              })}
            </div>
          </div>

          {(board.status === "won" || board.status === "lost") && (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="font-mono text-lg font-bold matrix-text text-primary">
                {board.status === "won"
                  ? `Cleared in ${seconds}s!`
                  : "You hit a mine."}
              </span>
              <Button className="font-mono" onClick={() => newGame(difficulty)}>
                <RotateCcw className="mr-2" />
                Play again
              </Button>
            </div>
          )}

          <p className="mt-5 text-xs font-mono text-muted-foreground">
            Tip: on mobile, toggle <span className="text-primary">Flag mode</span> to place flags by tapping.
          </p>
        </section>
      </main>
    </div>
  );
}
