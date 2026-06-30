import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw } from "lucide-react";
import MatrixRain from "@/components/MatrixRain";
import { Button } from "@/components/ui/button";
import {
  WORD_LENGTH,
  MAX_GUESSES,
  type LetterState,
  type GameState,
  createGame,
  addLetter,
  removeLetter,
  submitGuess,
  allRows,
} from "@/features/wordle/game";

const STATE_CLASSES: Record<LetterState, string> = {
  correct: "bg-green-600 border-green-600 text-white",
  present: "bg-yellow-500 border-yellow-500 text-white",
  absent:  "bg-muted/60 border-muted/60 text-muted-foreground",
  empty:   "bg-transparent border-primary/30 text-primary",
};

const KEY_STATE_CLASSES: Record<LetterState, string> = {
  correct: "bg-green-600 text-white border-green-600",
  present: "bg-yellow-500 text-white border-yellow-500",
  absent:  "bg-muted/60 text-muted-foreground border-muted/60",
  empty:   "bg-card/60 text-primary border-primary/30",
};

const KEYBOARD_ROWS = [
  ["q","w","e","r","t","y","u","i","o","p"],
  ["a","s","d","f","g","h","j","k","l"],
  ["Enter","z","x","c","v","b","n","m","⌫"],
];

function LetterCell({ letter, state, current }: { letter: string; state: LetterState | null; current?: boolean }) {
  const base = "w-12 h-12 md:w-14 md:h-14 flex items-center justify-center font-mono font-bold text-lg md:text-xl border-2 rounded uppercase select-none transition-colors";
  const stateClass = state ? STATE_CLASSES[state] : STATE_CLASSES.empty;
  const cursorClass = current ? "border-primary/70" : "";
  return (
    <div className={`${base} ${stateClass} ${cursorClass}`}>
      {letter.trim()}
    </div>
  );
}

export default function Wordle() {
  const [state, setState] = useState<GameState>(() => createGame(Math.random));

  const handleKey = useCallback((key: string) => {
    if (key === "Enter") {
      setState((s) => submitGuess(s));
    } else if (key === "Backspace" || key === "⌫") {
      setState((s) => removeLetter(s));
    } else if (/^[a-zA-Z]$/.test(key)) {
      setState((s) => addLetter(s, key));
    }
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      handleKey(e.key);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleKey]);

  const rows = allRows(state);
  const currentRowIdx = state.guesses.length;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <MatrixRain />

      <main className="relative z-10 max-w-lg mx-auto px-4 py-8 md:py-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" className="font-mono terminal-border text-primary border-primary" asChild>
            <Link to="/playground">
              <ArrowLeft className="mr-2" />
              Back to playground
            </Link>
          </Button>
          <p className="text-xs font-mono text-primary/80">ianalloway.xyz/wordle</p>
        </div>

        <section className="terminal-border rounded-xl bg-card/55 backdrop-blur-sm p-5 md:p-8">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="inline-block px-2 py-1 text-xs font-mono text-primary terminal-border mb-3">
                PLAYABLE_DEMO
              </p>
              <h1 className="text-3xl md:text-4xl font-mono font-bold matrix-text text-primary mb-2">
                Wordle
              </h1>
              <p className="text-sm text-muted-foreground font-mono">
                6 tries to guess the hidden 5-letter tech word.
                <span className="text-green-500"> Green</span> = right position,
                <span className="text-yellow-500"> yellow</span> = wrong position.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 font-mono terminal-border text-primary border-primary"
              onClick={() => setState(createGame(Math.random))}
            >
              <RotateCcw size={14} className="mr-1" />
              New
            </Button>
          </div>

          {/* Letter grid */}
          <div className="flex flex-col items-center gap-1.5 mb-5">
            {rows.map((row, ri) => (
              <div key={ri} className="flex gap-1.5">
                {Array.from({ length: WORD_LENGTH }, (_, ci) => (
                  <LetterCell
                    key={ci}
                    letter={row.word[ci] ?? " "}
                    state={row.states ? row.states[ci] : null}
                    current={ri === currentRowIdx && row.states === null}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Result banner */}
          {state.status !== "playing" && (
            <div className={`text-center mb-4 font-mono font-bold text-lg ${state.status === "won" ? "text-green-400" : "text-red-400"}`}>
              {state.status === "won"
                ? `Solved in ${state.guesses.length}/${MAX_GUESSES}!`
                : `The word was: ${state.target.toUpperCase()}`}
            </div>
          )}

          {/* On-screen keyboard */}
          <div className="flex flex-col items-center gap-1.5">
            {KEYBOARD_ROWS.map((row, ri) => (
              <div key={ri} className="flex gap-1">
                {row.map((key) => {
                  const isWide = key === "Enter" || key === "⌫";
                  const kstate = state.keyboard[key] ?? "empty";
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleKey(key === "⌫" ? "Backspace" : key)}
                      className={`${isWide ? "px-3 text-xs" : "w-8 md:w-9"} h-12 md:h-13 rounded border font-mono font-bold text-sm flex items-center justify-center transition-colors ${KEY_STATE_CLASSES[isWide ? "empty" : kstate as LetterState]}`}
                    >
                      {key.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs font-mono text-muted-foreground text-center">
            Words are from a tech & programming vocabulary.
          </p>
        </section>
      </main>
    </div>
  );
}
