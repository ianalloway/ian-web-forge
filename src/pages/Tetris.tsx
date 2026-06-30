import { useEffect, useReducer } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Pause, Play, RotateCcw } from "lucide-react";
import MatrixRain from "@/components/MatrixRain";
import { Button } from "@/components/ui/button";
import {
  COLS,
  ROWS,
  SHAPES,
  PIECE_COLORS,
  type GameState,
  type PieceType,
  createGame,
  cellsOf,
  ghostPiece,
  gravityMs,
  moveLeft,
  moveRight,
  rotateCW,
  softDrop,
  hardDrop,
  holdPiece,
  tick,
  togglePause,
} from "@/features/tetris/game";

type Action =
  | { type: "left" }
  | { type: "right" }
  | { type: "rotateCW" }
  | { type: "softDrop" }
  | { type: "hardDrop" }
  | { type: "hold" }
  | { type: "tick" }
  | { type: "pause" }
  | { type: "newGame" };

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "left":      return moveLeft(state);
    case "right":     return moveRight(state);
    case "rotateCW":  return rotateCW(state);
    case "softDrop":  return softDrop(state, Math.random);
    case "hardDrop":  return hardDrop(state, Math.random);
    case "hold":      return holdPiece(state, Math.random);
    case "tick":      return tick(state, Math.random);
    case "pause":     return togglePause(state);
    case "newGame":   return createGame(Math.random);
    default:          return state;
  }
}

function PieceMini({ type }: { type: PieceType | null }) {
  const cells = type ? SHAPES[type][0] : [];
  return (
    <div className="grid grid-cols-4 gap-[1px] bg-primary/10 p-[3px] rounded w-fit">
      {Array.from({ length: 16 }, (_, i) => {
        const r = Math.floor(i / 4);
        const c = i % 4;
        const filled = type !== null && cells.some(([dr, dc]) => dr === r && dc === c);
        return (
          <div
            key={i}
            className={`w-4 h-4 rounded-[1px] ${filled && type ? PIECE_COLORS[type] : "bg-background/40"}`}
          />
        );
      })}
    </div>
  );
}

export default function Tetris() {
  const [state, dispatch] = useReducer(reducer, undefined, () => createGame(Math.random));

  // Gravity tick — dispatch is stable so it's safe to call inside the interval.
  useEffect(() => {
    if (state.status !== "playing") return undefined;
    const id = setInterval(() => dispatch({ type: "tick" }), gravityMs(state.level));
    return () => clearInterval(id);
  }, [state.status, state.level]);

  // Keyboard controls.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      switch (e.code) {
        case "ArrowLeft":  dispatch({ type: "left" }); break;
        case "ArrowRight": dispatch({ type: "right" }); break;
        case "ArrowDown":  e.preventDefault(); dispatch({ type: "softDrop" }); break;
        case "ArrowUp":
        case "KeyX":       dispatch({ type: "rotateCW" }); break;
        case "Space":      e.preventDefault(); dispatch({ type: "hardDrop" }); break;
        case "KeyC":       dispatch({ type: "hold" }); break;
        case "KeyP":
        case "Escape":     dispatch({ type: "pause" }); break;
        case "KeyR":       dispatch({ type: "newGame" }); break;
        default: break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const ghost = ghostPiece(state);
  const ghostSet = new Set(
    cellsOf(ghost)
      .filter(([r]) => r >= 0)
      .map(([r, c]) => r * COLS + c),
  );
  const currentSet = new Set(
    cellsOf(state.current)
      .filter(([r]) => r >= 0)
      .map(([r, c]) => r * COLS + c),
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <MatrixRain />

      <main className="relative z-10 max-w-3xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" className="font-mono terminal-border text-primary border-primary" asChild>
            <Link to="/playground">
              <ArrowLeft className="mr-2" />
              Back to playground
            </Link>
          </Button>
          <p className="text-xs font-mono text-primary/80">ianalloway.xyz/tetris</p>
        </div>

        <section className="terminal-border rounded-xl bg-card/55 backdrop-blur-sm p-5 md:p-8">
          <div className="mb-5">
            <p className="inline-block px-2 py-1 text-xs font-mono text-primary terminal-border mb-3">
              PLAYABLE_DEMO
            </p>
            <h1 className="text-3xl md:text-4xl font-mono font-bold matrix-text text-primary mb-2">
              Tetris
            </h1>
            <p className="text-sm text-muted-foreground font-mono">
              Rotate and place tetrominoes to clear lines. Hard drop with Space, hold a piece with C.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 justify-center items-start">
            {/* Left sidebar: hold + stats */}
            <div className="flex flex-col gap-4 min-w-[88px]">
              <div>
                <p className="text-[10px] font-mono text-primary/70 uppercase tracking-wider mb-1">Hold</p>
                <PieceMini type={state.held} />
                {!state.canHold && (
                  <p className="text-[10px] font-mono text-muted-foreground mt-1">used</p>
                )}
              </div>
              <div className="space-y-2">
                {([["Score", state.score], ["Lines", state.lines], ["Level", state.level]] as const).map(
                  ([label, val]) => (
                    <div key={label} className="rounded border border-primary/20 bg-background/60 px-3 py-2">
                      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{label}</div>
                      <div className="font-mono font-bold text-primary tabular-nums">{val}</div>
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Board */}
            <div className="relative">
              <div
                className="inline-grid gap-[1px] rounded-lg bg-primary/15 p-[1px]"
                style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
                role="grid"
                aria-label="Tetris board"
              >
                {Array.from({ length: ROWS * COLS }, (_, idx) => {
                  const isCurrent = currentSet.has(idx);
                  const isGhost = !isCurrent && ghostSet.has(idx);
                  const locked = state.board[idx];

                  let cls = "w-6 h-6 md:w-7 md:h-7 rounded-[1px] ";
                  if (isCurrent) {
                    cls += PIECE_COLORS[state.current.type];
                  } else if (locked) {
                    cls += PIECE_COLORS[locked];
                  } else if (isGhost) {
                    cls += "bg-primary/10 border border-primary/25";
                  } else {
                    cls += "bg-background/40";
                  }

                  return <div key={idx} role="gridcell" className={cls} />;
                })}
              </div>

              {state.status !== "playing" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 rounded-lg gap-4">
                  {state.status === "paused" ? (
                    <>
                      <p className="font-mono text-xl font-bold text-primary">Paused</p>
                      <Button className="font-mono" onClick={() => dispatch({ type: "pause" })}>
                        <Play className="mr-2" size={16} />
                        Resume
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="font-mono text-xl font-bold text-primary">Game Over</p>
                      <p className="font-mono text-sm text-muted-foreground">Score: {state.score}</p>
                      <Button className="font-mono" onClick={() => dispatch({ type: "newGame" })}>
                        <RotateCcw className="mr-2" size={16} />
                        Play again
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Right sidebar: next + buttons */}
            <div className="flex flex-col gap-4 min-w-[88px]">
              <div>
                <p className="text-[10px] font-mono text-primary/70 uppercase tracking-wider mb-1">Next</p>
                <PieceMini type={state.next} />
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant={state.status === "paused" ? "default" : "outline"}
                  size="sm"
                  className="font-mono terminal-border text-primary border-primary text-xs"
                  onClick={() => dispatch({ type: "pause" })}
                  disabled={state.status === "over"}
                >
                  {state.status === "paused"
                    ? <><Play size={13} className="mr-1" />Resume</>
                    : <><Pause size={13} className="mr-1" />Pause</>}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="font-mono terminal-border text-primary border-primary text-xs"
                  onClick={() => dispatch({ type: "newGame" })}
                >
                  <RotateCcw size={13} className="mr-1" />
                  New
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile controls */}
          <div className="mt-5 flex flex-col items-center gap-2 md:hidden">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="font-mono terminal-border text-primary border-primary w-14"
                onClick={() => dispatch({ type: "hold" })}>C</Button>
              <Button size="sm" variant="outline" className="font-mono terminal-border text-primary border-primary w-14"
                onClick={() => dispatch({ type: "rotateCW" })}>↑ Rot</Button>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="font-mono terminal-border text-primary border-primary w-14"
                onClick={() => dispatch({ type: "left" })}>←</Button>
              <Button size="sm" variant="outline" className="font-mono terminal-border text-primary border-primary w-14"
                onClick={() => dispatch({ type: "softDrop" })}>↓</Button>
              <Button size="sm" variant="outline" className="font-mono terminal-border text-primary border-primary w-14"
                onClick={() => dispatch({ type: "right" })}>→</Button>
            </div>
            <Button className="font-mono w-48" onClick={() => dispatch({ type: "hardDrop" })}>
              Space — Hard Drop
            </Button>
          </div>

          <p className="mt-4 text-xs font-mono text-muted-foreground leading-relaxed">
            ← → move &nbsp;·&nbsp; ↑ / X rotate &nbsp;·&nbsp; ↓ soft drop &nbsp;·&nbsp; Space hard drop &nbsp;·&nbsp; C hold &nbsp;·&nbsp; P pause &nbsp;·&nbsp; R restart
          </p>
        </section>
      </main>
    </div>
  );
}
