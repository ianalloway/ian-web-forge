import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Passage, getRandomPassage, calcWpm, calcAccuracy } from "../features/typing/passages";

type Status = "idle" | "active" | "finished";

interface CharState {
  char: string;
  state: "pending" | "correct" | "wrong";
}

function buildCharStates(passage: string): CharState[] {
  return passage.split("").map((char) => ({ char, state: "pending" }));
}

export default function Type() {
  const [passage, setPassage] = useState<Passage>(() => getRandomPassage());
  const [chars, setChars] = useState<CharState[]>(() => buildCharStates(passage.text));
  const [cursor, setCursor] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [startTime, setStartTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [totalTyped, setTotalTyped] = useState(0);
  const [correctTyped, setCorrectTyped] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer
  useEffect(() => {
    if (status !== "active") return;
    intervalRef.current = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 100);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status, startTime]);

  const reset = useCallback((newPassage?: Passage) => {
    const p = newPassage ?? getRandomPassage(passage.id);
    setPassage(p);
    setChars(buildCharStates(p.text));
    setCursor(0);
    setStatus("idle");
    setStartTime(0);
    setElapsed(0);
    setTotalTyped(0);
    setCorrectTyped(0);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [passage.id]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (status === "finished") return;

    if (e.key === "Escape") { reset(); return; }
    if (e.key === "Tab") { e.preventDefault(); reset(); return; }

    if (e.key.length !== 1) return; // ignore modifier keys

    e.preventDefault();

    if (status === "idle") {
      setStatus("active");
      const now = Date.now();
      setStartTime(now);
    }

    setTotalTyped((t) => t + 1);

    setChars((prev) => {
      const next = [...prev];
      const expected = next[cursor]?.char;
      if (expected === undefined) return prev;
      next[cursor] = {
        char: expected,
        state: e.key === expected ? "correct" : "wrong",
      };
      return next;
    });

    if (passage.text[cursor] === e.key) {
      setCorrectTyped((c) => c + 1);
    }

    const nextCursor = cursor + 1;
    setCursor(nextCursor);

    if (nextCursor >= passage.text.length) {
      setStatus("finished");
      setElapsed(Date.now() - startTime);
    }
  }, [status, cursor, passage.text, startTime, reset]);

  const wpm = calcWpm(correctTyped, elapsed);
  const accuracy = calcAccuracy(correctTyped, totalTyped);
  const progress = cursor / passage.text.length;

  return (
    <div
      className="min-h-screen bg-background text-primary font-mono flex flex-col"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="text-primary/50 hover:text-primary text-sm transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">typing speed test</span>
        </div>
        {status !== "idle" && (
          <div className="flex items-center gap-4 text-xs text-primary/60">
            <span>{wpm} wpm</span>
            <span>{accuracy}% acc</span>
            <span>{(elapsed / 1000).toFixed(1)}s</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-primary/10">
        <div
          className="h-full bg-primary transition-all duration-75"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 gap-8">

        {status === "finished" ? (
          /* Results */
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="text-primary/40 text-xs tracking-widest uppercase">results</div>
            <div className="grid grid-cols-3 gap-8">
              {[
                { label: "wpm", value: wpm },
                { label: "accuracy", value: `${accuracy}%` },
                { label: "time", value: `${(elapsed / 1000).toFixed(1)}s` },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <div className="text-4xl font-bold text-primary">{value}</div>
                  <div className="text-xs text-primary/40">{label}</div>
                </div>
              ))}
            </div>
            <div className="text-xs text-primary/30 italic max-w-xs">
              &ldquo;{passage.text}&rdquo;
              <span className="block mt-1 text-primary/20">— {passage.source}</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => reset()}
                className="px-4 py-2 text-sm border border-primary/40 hover:border-primary text-primary/70 hover:text-primary transition-colors"
              >
                ↺ new quote
              </button>
              <button
                onClick={() => reset(passage)}
                className="px-4 py-2 text-sm border border-primary/40 hover:border-primary text-primary/70 hover:text-primary transition-colors"
              >
                ↻ retry
              </button>
            </div>
          </div>
        ) : (
          /* Typing area */
          <>
            <div className="max-w-2xl w-full">
              <div className="text-xs text-primary/30 mb-4 text-center">
                {status === "idle" ? "start typing to begin" : "keep going..."}
              </div>
              <p className="text-xl leading-relaxed tracking-wide select-none" aria-hidden>
                {chars.map((c, i) => (
                  <span
                    key={i}
                    className={
                      i === cursor
                        ? "border-b-2 border-primary animate-pulse"
                        : c.state === "correct"
                        ? "text-primary"
                        : c.state === "wrong"
                        ? "text-red-500 bg-red-500/10"
                        : "text-primary/30"
                    }
                  >
                    {c.char}
                  </span>
                ))}
              </p>
            </div>

            <div className="text-xs text-primary/20 text-center">
              <kbd className="border border-primary/20 px-1.5 py-0.5 rounded text-primary/30">Tab</kbd>
              {" "}or{" "}
              <kbd className="border border-primary/20 px-1.5 py-0.5 rounded text-primary/30">Esc</kbd>
              {" "}to reset
            </div>
          </>
        )}
      </div>

      {/* Source */}
      {status !== "finished" && (
        <div className="border-t border-primary/10 px-4 py-2 text-xs text-primary/20 text-center">
          — {passage.source}
        </div>
      )}

      {/* Hidden input captures keystrokes */}
      <input
        ref={inputRef}
        onKeyDown={handleKeyDown}
        className="sr-only"
        autoFocus
        readOnly
        aria-label="typing input"
      />
    </div>
  );
}
