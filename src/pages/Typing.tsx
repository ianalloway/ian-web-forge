import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw, Shuffle } from "lucide-react";
import MatrixRain from "@/components/MatrixRain";
import { Button } from "@/components/ui/button";
import {
  type CharState,
  charStates,
  computeStats,
  pickPrompt,
} from "@/features/typing/typing";

const CHAR_CLASS: Record<CharState, string> = {
  pending: "text-muted-foreground/60",
  correct: "text-primary",
  incorrect: "text-destructive underline decoration-destructive/70",
  current: "text-primary bg-primary/25 rounded-[2px]",
};

export default function Typing() {
  const [target, setTarget] = useState(() => pickPrompt());
  const [typed, setTyped] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  // Tick ~5x/sec while typing so the live WPM and timer update.
  useEffect(() => {
    if (startedAt === null || finishedAt !== null) {
      return undefined;
    }
    const id = window.setInterval(() => setNowMs(Date.now()), 200);
    return () => window.clearInterval(id);
  }, [startedAt, finishedAt]);

  const reset = useCallback((nextTarget?: string) => {
    setTarget((current) => nextTarget ?? current);
    setTyped("");
    setStartedAt(null);
    setFinishedAt(null);
    setNowMs(0);
    inputRef.current?.focus();
  }, []);

  const handleChange = useCallback(
    (value: string) => {
      if (finishedAt !== null) {
        return;
      }

      const stamp = Date.now();
      if (startedAt === null && value.length > 0) {
        setStartedAt(stamp);
        setNowMs(stamp);
      }

      const clamped = value.slice(0, target.length);
      setTyped(clamped);

      if (clamped.length >= target.length) {
        setFinishedAt(stamp);
      }
    },
    [finishedAt, startedAt, target.length],
  );

  const elapsedMs = useMemo(() => {
    if (startedAt === null) {
      return 0;
    }
    return Math.max(0, (finishedAt ?? nowMs) - startedAt);
  }, [startedAt, finishedAt, nowMs]);

  const stats = useMemo(() => computeStats(target, typed, elapsedMs), [target, typed, elapsedMs]);
  const states = useMemo(() => charStates(target, typed), [target, typed]);

  const seconds = (elapsedMs / 1000).toFixed(1);
  const accuracyPct = Math.round(stats.accuracy * 100);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <MatrixRain />

      <main className="relative z-10 max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" className="font-mono terminal-border text-primary border-primary" asChild>
            <Link to="/demos">
              <ArrowLeft className="mr-2" />
              Back to demos
            </Link>
          </Button>
          <p className="text-xs font-mono text-primary/80">ianalloway.xyz/wpm</p>
        </div>

        <section className="terminal-border rounded-xl bg-card/55 backdrop-blur-sm p-5 md:p-8">
          <div className="mb-6">
            <p className="inline-block px-2 py-1 text-xs font-mono text-primary terminal-border mb-3">
              PLAYABLE_DEMO
            </p>
            <h1 className="text-3xl md:text-4xl font-mono font-bold matrix-text text-primary mb-3">
              Typing Speed Test
            </h1>
            <p className="max-w-2xl text-sm md:text-base text-muted-foreground font-mono leading-relaxed">
              Type the line below. The timer starts on your first keystroke and stops at the last
              character. Net WPM counts only correctly-typed characters.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 font-mono">
            <Stat label="NET WPM" value={`${stats.netWpm}`} highlight />
            <Stat label="GROSS WPM" value={`${stats.grossWpm}`} />
            <Stat label="ACCURACY" value={`${accuracyPct}%`} />
            <Stat label="TIME" value={`${seconds}s`} />
          </div>

          <button
            type="button"
            onClick={() => inputRef.current?.focus()}
            aria-label="Focus typing input"
            className="block w-full text-left rounded-xl border border-primary/30 bg-background/70 p-5 md:p-6 font-mono text-lg md:text-xl leading-relaxed tracking-wide"
          >
            {Array.from(target).map((char, index) => (
              <span key={index} className={CHAR_CLASS[states[index]]}>
                {char}
              </span>
            ))}
          </button>

          {/* Off-screen capture input keeps mobile keyboards working. */}
          <input
            ref={inputRef}
            value={typed}
            onChange={(event) => handleChange(event.target.value)}
            autoFocus
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Typing test input"
            className="sr-only"
          />

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              className="font-mono"
              onClick={() => reset()}
            >
              <RotateCcw className="mr-2" />
              Restart
            </Button>
            <Button
              variant="outline"
              className="font-mono terminal-border text-primary border-primary"
              onClick={() => reset(pickPrompt(Math.random, target))}
            >
              <Shuffle className="mr-2" />
              New line
            </Button>
            {stats.complete && (
              <span className="font-mono text-sm text-primary" aria-live="polite">
                Done — {stats.netWpm} WPM at {accuracyPct}% accuracy in {seconds}s
              </span>
            )}
          </div>

          <p className="mt-5 text-xs font-mono text-muted-foreground">
            {stats.incorrectChars > 0
              ? `${stats.incorrectChars} character${stats.incorrectChars === 1 ? "" : "s"} off so far.`
              : "Clean so far — keep going."}
          </p>
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg border border-primary/30 bg-background/70 p-3">
      <div className="text-primary/70 text-xs mb-1">{label}</div>
      <div className={`text-2xl font-bold ${highlight ? "text-primary matrix-text" : "text-primary"}`} aria-live="off">
        {value}
      </div>
    </div>
  );
}
