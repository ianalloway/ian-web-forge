import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FACES,
  MOVES,
  Move,
  State,
  applyMove,
  isSolved,
  scramble,
  solve,
  solvedState,
} from "../features/cube/cube";

// Sticker colors, keyed by the face a sticker started on.
const COLORS = ["#eaffea", "#ff6a3d", "#00d84a", "#5ad0ff", "#ffd23d", "#a06bff"];

// Where each face sits in the unfolded net, in 2×2 blocks.
const NET: Record<string, [number, number]> = {
  U: [2, 0],
  L: [0, 2],
  F: [2, 2],
  R: [4, 2],
  B: [6, 2],
  D: [2, 4],
};

export default function Cube() {
  const [state, setState] = useState<State>(() => solvedState());
  const [queue, setQueue] = useState<Move[]>([]);
  const [solution, setSolution] = useState<Move[] | null>(null);
  const [thinking, setThinking] = useState(false);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const timerRef = useRef<number | null>(null);
  const speedRef = useRef(360);
  const [speed, setSpeed] = useState(360);

  // Drain the move queue one turn at a time so the solve is watchable.
  useEffect(() => {
    if (queue.length === 0) return;
    timerRef.current = window.setTimeout(() => {
      const [next, ...rest] = queue;
      setState((s) => applyMove(s, next));
      setLastMove(next);
      setQueue(rest);
    }, speedRef.current);
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [queue]);

  const doScramble = useCallback(() => {
    const { moves } = scramble(11);
    setState(solvedState());
    setSolution(null);
    setLastMove(null);
    setQueue(moves);
  }, []);

  const doSolve = useCallback(() => {
    if (queue.length > 0) return;
    setThinking(true);
    // Defer so the "solving…" label paints before the search blocks.
    window.setTimeout(() => {
      const sol = solve(state);
      setSolution(sol);
      setThinking(false);
      if (sol) setQueue(sol);
    }, 20);
  }, [state, queue.length]);

  const reset = () => {
    setQueue([]);
    setState(solvedState());
    setSolution(null);
    setLastMove(null);
  };

  const turn = (m: Move) => {
    if (queue.length > 0) return;
    setState((s) => applyMove(s, m));
    setLastMove(m);
    setSolution(null);
  };

  const solved = isSolved(state);

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">pocket cube solver</span>
        </div>
        <div className="text-xs text-primary/40 tabular-nums">
          {thinking
            ? "searching…"
            : solved
              ? "solved"
              : solution
                ? `${solution.length}-move optimal solution`
                : "scrambled"}
          {lastMove ? ` · last ${lastMove}` : ""}
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-1">
          <span className="text-primary/40 text-xs mr-1">turn</span>
          {MOVES.map((m) => (
            <button
              key={m}
              onClick={() => turn(m)}
              disabled={queue.length > 0}
              className="px-1.5 py-0.5 text-xs border border-primary/20 text-primary/60 hover:border-primary hover:text-primary disabled:opacity-30 transition-colors"
            >
              {m}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">speed</span>
          <input
            type="range"
            min={80}
            max={800}
            step={20}
            value={speed}
            onChange={(e) => {
              const v = Number(e.target.value);
              setSpeed(v);
              speedRef.current = v;
            }}
            className="w-20 accent-primary"
          />
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={doScramble}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ⚄ scramble
          </button>
          <button
            onClick={doSolve}
            disabled={thinking || queue.length > 0 || solved}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary disabled:opacity-30 transition-colors"
          >
            ✦ solve
          </button>
          <button
            onClick={reset}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ↺ reset
          </button>
        </div>
      </div>

      {/* Net + solution */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-4 min-h-0">
        <div
          className="grid gap-[2px]"
          style={{
            gridTemplateColumns: "repeat(8, 1fr)",
            gridTemplateRows: "repeat(6, 1fr)",
            width: "min(88vw, 46vh * 8 / 6)",
            aspectRatio: "8 / 6",
          }}
        >
          {state instanceof Uint8Array &&
            Array.from({ length: 24 }, (_, i) => {
              const faceIdx = Math.floor(i / 4);
              const within = i % 4;
              const face = FACES[faceIdx];
              const [bx, by] = NET[face];
              const col = bx + (within % 2) + 1;
              const row = by + Math.floor(within / 2) + 1;
              return (
                <div
                  key={i}
                  style={{
                    gridColumn: col,
                    gridRow: row,
                    background: COLORS[state[i]],
                    borderRadius: 2,
                    transition: "background 160ms ease",
                  }}
                />
              );
            })}
        </div>

        {/* Solution ribbon */}
        <div className="w-full max-w-3xl">
          {solution && solution.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-center">
              {solution.map((m, i) => {
                const done = solution.length - queue.length > i;
                return (
                  <span
                    key={i}
                    className={`px-2 py-0.5 text-xs border tabular-nums transition-colors ${
                      done
                        ? "border-primary/60 bg-primary/15 text-primary"
                        : "border-primary/15 text-primary/40"
                    }`}
                  >
                    {m}
                  </span>
                );
              })}
            </div>
          )}
          {solution && solution.length === 0 && (
            <p className="text-center text-xs text-primary/50">already solved — nothing to do.</p>
          )}
        </div>
      </div>

      <div className="px-4 pb-4 text-xs text-primary/40 max-w-2xl">
        the search runs from the scramble and from the solved state at once, meeting in the middle —
        so the answer it finds is the shortest one that exists. a 2×2 never needs more than 11 turns,
        no matter how badly you mix it.
      </div>
    </div>
  );
}
