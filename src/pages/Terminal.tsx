import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import MatrixRain from "@/components/MatrixRain";
import { Button } from "@/components/ui/button";
import {
  PROMPT,
  type OutputLine,
  completeCommand,
  runCommand,
  welcomeLines,
} from "@/features/terminal/commands";

interface Entry {
  /** The echoed input line (undefined for the initial welcome block). */
  input?: string;
  lines: OutputLine[];
}

const TONE_CLASS: Record<NonNullable<OutputLine["tone"]>, string> = {
  default: "text-primary/90",
  accent: "text-primary",
  muted: "text-muted-foreground",
  error: "text-destructive",
  heading: "text-primary font-bold",
};

function LineView({ line }: { line: OutputLine }) {
  const tone = TONE_CLASS[line.tone ?? "default"];
  const content = line.text.length === 0 ? " " : line.text;

  if (line.href) {
    return (
      <a
        href={line.href}
        target="_blank"
        rel="noopener noreferrer"
        className={`block whitespace-pre-wrap break-words underline-offset-2 hover:underline ${tone}`}
      >
        {content}
      </a>
    );
  }

  if (line.to) {
    return (
      <Link to={line.to} className={`block whitespace-pre-wrap break-words underline-offset-2 hover:underline ${tone}`}>
        {content}
      </Link>
    );
  }

  return <div className={`whitespace-pre-wrap break-words ${tone}`}>{content}</div>;
}

export default function Terminal() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<Entry[]>(() => [{ lines: welcomeLines() }]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyCursor, setHistoryCursor] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  const submit = useCallback(
    (raw: string) => {
      const value = raw.trim();
      const result = runCommand(raw);

      if (value.length > 0) {
        setHistory((prev) => [...prev, value]);
      }
      setHistoryCursor(null);
      setInput("");

      if (result.clear) {
        setEntries([]);
      } else {
        setEntries((prev) => [...prev, { input: raw, lines: result.lines }]);
      }

      if (result.navigate) {
        navigate(result.navigate);
      }
      if (result.openUrl) {
        window.open(result.openUrl, "_blank", "noopener,noreferrer");
      }
    },
    [navigate],
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        submit(input);
        return;
      }

      if (event.key === "Tab") {
        event.preventDefault();
        const completion = completeCommand(input);
        if (completion) {
          setInput(completion);
        }
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        if (history.length === 0) {
          return;
        }
        const nextCursor = historyCursor === null ? history.length - 1 : Math.max(0, historyCursor - 1);
        setHistoryCursor(nextCursor);
        setInput(history[nextCursor]);
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (historyCursor === null) {
          return;
        }
        const nextCursor = historyCursor + 1;
        if (nextCursor >= history.length) {
          setHistoryCursor(null);
          setInput("");
        } else {
          setHistoryCursor(nextCursor);
          setInput(history[nextCursor]);
        }
      }
    },
    [history, historyCursor, input, submit],
  );

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
          <p className="text-xs font-mono text-primary/80">ianalloway.xyz/terminal</p>
        </div>

        <section
          className="terminal-border matrix-glow rounded-xl bg-card/70 backdrop-blur-sm overflow-hidden"
          onClick={() => inputRef.current?.focus()}
        >
          <div className="flex items-center gap-2 border-b border-primary/25 bg-background/60 px-4 py-2.5">
            <span className="h-3 w-3 rounded-full bg-primary/30" />
            <span className="h-3 w-3 rounded-full bg-primary/30" />
            <span className="h-3 w-3 rounded-full bg-primary" />
            <span className="ml-2 text-xs font-mono text-primary/70">visitor@ianalloway.xyz — bash</span>
          </div>

          <div
            ref={scrollRef}
            className="h-[60vh] min-h-[360px] overflow-y-auto px-4 py-4 font-mono text-[13px] leading-relaxed"
          >
            {entries.map((entry, entryIndex) => (
              <div key={entryIndex} className="mb-1">
                {entry.input !== undefined && (
                  <div className="flex gap-2 break-all">
                    <span className="text-primary/60 shrink-0">{PROMPT}</span>
                    <span className="text-primary/90">{entry.input}</span>
                  </div>
                )}
                {entry.lines.map((line, lineIndex) => (
                  <LineView key={lineIndex} line={line} />
                ))}
              </div>
            ))}

            <div className="flex gap-2 items-center">
              <label htmlFor="terminal-input" className="text-primary/60 shrink-0">
                {PROMPT}
              </label>
              <input
                id="terminal-input"
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={onKeyDown}
                autoFocus
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                aria-label="Terminal command input"
                className="flex-1 bg-transparent text-primary caret-primary outline-none border-none"
              />
            </div>
          </div>
        </section>

        <p className="mt-4 text-center text-xs font-mono text-muted-foreground">
          Type <span className="text-primary">help</span> · Tab completes · ↑/↓ for history
        </p>
      </main>
    </div>
  );
}
