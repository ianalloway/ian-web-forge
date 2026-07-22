import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  MinesBoard,
  DifficultyId,
  DIFFICULTIES,
  newMinesBoard,
  reveal,
  chord,
  toggleFlag,
  flagsUsed,
  isWon,
  revealMines,
} from "../features/mines/board";

type Phase = "playing" | "won" | "lost";

const NUMBER_COLORS = [
  "",
  "text-cyan-400",
  "text-primary",
  "text-yellow-300",
  "text-orange-400",
  "text-pink-400",
  "text-purple-400",
  "text-red-400",
  "text-white",
];

const DIFF_KEYS = Object.keys(DIFFICULTIES) as DifficultyId[];

export default function Mines() {
  const [difficulty, setDifficulty] = useState<DifficultyId>("easy");
  const [board, setBoard] = useState<MinesBoard>(() => newMinesBoard("easy"));
  const [phase, setPhase] = useState<Phase>("playing");
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);

  // Timer runs while playing and started
  useEffect(() => {
    if (phase !== "playing") return;
    const id = setInterval(() => {
      if (startRef.current !== null) {
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
      }
    }, 500);
    return () => clearInterval(id);
  }, [phase]);

  const restart = useCallback((d: DifficultyId) => {
    setBoard(newMinesBoard(d));
    setPhase("playing");
    setElapsed(0);
    startRef.current = null;
  }, []);

  // Board mutations work on a fresh copy so React re-renders
  const cloneBoard = (b: MinesBoard): MinesBoard => ({
    ...b,
    cells: b.cells.map((c) => ({ ...c })),
  });

  const handleReveal = useCallback((idx: number) => {
    if (phase !== "playing") return;
    if (startRef.current === null) startRef.current = Date.now();
    const next = cloneBoard(board);
    const cell = next.cells[idx];
    const outcome = cell.revealed ? chord(next, idx) : reveal(next, idx);
    if (outcome === "boom") {
      revealMines(next);
      setPhase("lost");
    } else if (isWon(next)) {
      setPhase("won");
    }
    setBoard(next);
  }, [board, phase]);

  const handleFlag = useCallback((e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    if (phase !== "playing") return;
    if (startRef.current === null) startRef.current = Date.now();
    const next = cloneBoard(board);
    toggleFlag(next, idx);
    setBoard(next);
  }, [board, phase]);

  const flags = flagsUsed(board);
  const minesLeft = board.mineCount - flags;

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">minesweeper</span>
        </div>
        <div className="text-xs text-primary/60 flex gap-4 tabular-nums">
          <span>⚑ {minesLeft}</span>
          <span>{elapsed}s</span>
          {phase === "won" && <span className="text-primary">✓ cleared</span>}
          {phase === "lost" && <span className="text-red-400">✗ boom</span>}
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {DIFF_KEYS.map((d) => (
            <button
              key={d}
              onClick={() => { setDifficulty(d); restart(d); }}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                difficulty === d
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/20 text-primary/40 hover:border-primary/50 hover:text-primary/70"
              }`}
            >
              {DIFFICULTIES[d].label}
            </button>
          ))}
        </div>
        <button
          onClick={() => restart(difficulty)}
          className="ml-auto px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ↺ new game
        </button>
      </div>

      {/* Board */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
        <div
          className="grid gap-px bg-primary/10 border border-primary/20 select-none"
          style={{ gridTemplateColumns: `repeat(${board.cols}, minmax(0, 1fr))` }}
        >
          {board.cells.map((cell, idx) => {
            let content: string;
            let classes: string;
            if (cell.revealed) {
              if (cell.mine) {
                content = "✱";
                classes = "bg-red-500/30 text-red-300";
              } else if (cell.adjacent > 0) {
                content = String(cell.adjacent);
                classes = `bg-black ${NUMBER_COLORS[cell.adjacent]}`;
              } else {
                content = "";
                classes = "bg-black";
              }
            } else if (cell.flagged) {
              content = "⚑";
              classes = "bg-primary/15 text-yellow-300";
            } else {
              content = "";
              classes = "bg-primary/10 hover:bg-primary/20 cursor-pointer";
            }
            return (
              <button
                key={idx}
                onClick={() => handleReveal(idx)}
                onContextMenu={(e) => handleFlag(e, idx)}
                disabled={phase !== "playing"}
                aria-label={cell.revealed ? `revealed ${cell.adjacent}` : cell.flagged ? "flagged" : "hidden cell"}
                className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm font-bold transition-colors ${classes}`}
              >
                {content}
              </button>
            );
          })}
        </div>
      </div>

      {/* Overlay actions on end */}
      {phase !== "playing" && (
        <div className="border-t border-primary/10 px-4 py-3 flex items-center justify-center gap-4">
          <span className="text-sm text-primary/60">
            {phase === "won" ? `cleared in ${elapsed}s` : "hit a mine"}
          </span>
          <button
            onClick={() => restart(difficulty)}
            className="px-4 py-1.5 text-sm border border-primary/40 hover:border-primary text-primary/80 hover:text-primary transition-colors"
          >
            ↺ play again
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-primary/10 px-4 py-2 text-xs text-primary/30 text-center">
        click to reveal · right-click to flag · click a satisfied number to chord
      </div>
    </div>
  );
}
