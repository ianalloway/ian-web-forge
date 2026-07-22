import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Board,
  Dir,
  newBoard,
  move,
  spawnTile,
  canMove,
  hasWon,
  loadBest,
  saveBest,
  tileClasses,
} from "../features/game2048/engine";

const KEY_DIRS: Record<string, Dir> = {
  ArrowLeft: "left", KeyA: "left",
  ArrowRight: "right", KeyD: "right",
  ArrowUp: "up", KeyW: "up",
  ArrowDown: "down", KeyS: "down",
};

export default function Game2048() {
  const [board, setBoard] = useState<Board>(() => newBoard());
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => loadBest());
  const [over, setOver] = useState(false);
  const [won, setWon] = useState(false);
  const wonAcknowledged = useRef(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const restart = useCallback(() => {
    setBoard(newBoard());
    setScore(0);
    setOver(false);
    setWon(false);
    wonAcknowledged.current = false;
  }, []);

  const doMove = useCallback((dir: Dir) => {
    setBoard((prev) => {
      const res = move(prev, dir);
      if (!res.moved) return prev;
      const next = spawnTile(res.board);
      setScore((s) => {
        const ns = s + res.gained;
        setBest((b) => {
          const nb = Math.max(b, ns);
          if (nb > b) saveBest(nb);
          return nb;
        });
        return ns;
      });
      if (hasWon(next) && !wonAcknowledged.current) setWon(true);
      if (!canMove(next)) setOver(true);
      return next;
    });
  }, []);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const dir = KEY_DIRS[e.code];
      if (dir) {
        e.preventDefault();
        if (!over) doMove(dir);
        return;
      }
      if ((e.code === "Space" || e.code === "Enter") && over) {
        e.preventDefault();
        restart();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doMove, over, restart]);

  // Touch swipe
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    const dir: Dir = Math.abs(dx) > Math.abs(dy)
      ? (dx > 0 ? "right" : "left")
      : (dy > 0 ? "down" : "up");
    if (!over) doMove(dir);
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
          <span className="text-sm">2048</span>
        </div>
        <div className="text-xs text-primary/60">
          score {score.toLocaleString()}
          <span className="text-primary/30 ml-2">best {best.toLocaleString()}</span>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative select-none" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <div className="grid grid-cols-4 gap-2 p-2 border border-primary/20 bg-primary/[0.03]">
            {board.map((v, i) => (
              <div
                key={i}
                className={`w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center text-lg sm:text-xl font-bold transition-colors duration-100 ${tileClasses(v)}`}
              >
                {v || "."}
              </div>
            ))}
          </div>

          {(over || won) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/75">
              <div className="text-2xl text-primary">{won && !over ? "2048!" : "game over"}</div>
              <div className="text-sm text-primary/50">score {score.toLocaleString()}</div>
              <div className="flex gap-3">
                {won && !over && (
                  <button
                    onClick={() => { setWon(false); wonAcknowledged.current = true; }}
                    className="px-4 py-2 text-sm border border-primary/40 hover:border-primary text-primary/80 hover:text-primary transition-colors"
                  >
                    → keep going
                  </button>
                )}
                <button
                  onClick={restart}
                  className="px-4 py-2 text-sm border border-primary/40 hover:border-primary text-primary/80 hover:text-primary transition-colors"
                >
                  ↺ new game
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-primary/10 px-4 py-2 text-xs text-primary/30 text-center">
        arrows / WASD to slide · swipe on mobile · merge to 2048
      </div>
    </div>
  );
}
