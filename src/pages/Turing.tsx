import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Machine, PROGRAMS, Rule } from "../features/turing/machine";

const VISIBLE = 31; // tape cells shown, head centred

interface View {
  cells: { index: number; symbol: string }[];
  state: string;
  steps: number;
  halted: boolean;
  stuck: boolean;
  output: string;
  lastRule: Rule | null;
}

export default function Turing() {
  const machineRef = useRef<Machine>(new Machine(PROGRAMS[0]));
  const runningRef = useRef(false);
  const speedRef = useRef(120);
  const timerRef = useRef<number | null>(null);

  const [programIdx, setProgramIdx] = useState(0);
  const [input, setInput] = useState(PROGRAMS[0].input);
  const [speed, setSpeed] = useState(120);
  const [running, setRunning] = useState(false);
  const [view, setView] = useState<View>(() => snapshot(new Machine(PROGRAMS[0]), null));

  function snapshot(m: Machine, lastRule: Rule | null): View {
    const half = (VISIBLE - 1) / 2;
    const cells = [];
    for (let i = m.head - half; i <= m.head + half; i++) {
      cells.push({ index: i, symbol: m.read(i) });
    }
    return {
      cells,
      state: m.state,
      steps: m.steps,
      halted: m.halted,
      stuck: m.stuck,
      output: m.output(),
      lastRule,
    };
  }

  const rebuild = useCallback((idx: number, tapeInput: string) => {
    const base = PROGRAMS[idx];
    const m = new Machine({ ...base, input: tapeInput });
    machineRef.current = m;
    runningRef.current = false;
    setRunning(false);
    setView(snapshot(m, null));
  }, []);

  const stepOnce = useCallback(() => {
    const m = machineRef.current;
    const rule = m.step();
    setView(snapshot(m, rule));
    if (m.halted || m.stuck) {
      runningRef.current = false;
      setRunning(false);
    }
    return rule;
  }, []);

  // Drive the machine on a timer while running.
  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const m = machineRef.current;
      if (m.halted || m.stuck) {
        runningRef.current = false;
        setRunning(false);
        return;
      }
      stepOnce();
      timerRef.current = window.setTimeout(tick, speedRef.current);
    };
    timerRef.current = window.setTimeout(tick, speedRef.current);
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [running, stepOnce]);

  const program = PROGRAMS[programIdx];
  const done = view.halted || view.stuck;

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">turing machine</span>
        </div>
        <div className="text-xs text-primary/40 tabular-nums">
          state <span className="text-primary/80">{view.state}</span> · {view.steps} steps
          {view.halted ? " · halted" : view.stuck ? " · stuck (no rule)" : ""}
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-primary/40 text-xs mr-1">program</span>
          {PROGRAMS.map((p, i) => (
            <button
              key={p.name}
              onClick={() => {
                setProgramIdx(i);
                setInput(p.input);
                rebuild(i, p.input);
              }}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                programIdx === i
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/20 text-primary/50 hover:border-primary/50"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">tape</span>
          <input
            value={input}
            spellCheck={false}
            onChange={(e) => {
              setInput(e.target.value);
              rebuild(programIdx, e.target.value);
            }}
            className="bg-black/40 border border-primary/20 focus:border-primary/60 outline-none text-primary/90 text-xs px-2 py-0.5 w-28 font-mono"
          />
        </label>

        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">speed</span>
          <input
            type="range"
            min={16}
            max={500}
            step={8}
            value={520 - speed}
            onChange={(e) => {
              const v = 520 - Number(e.target.value);
              setSpeed(v);
              speedRef.current = v;
            }}
            className="w-20 accent-primary"
          />
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={stepOnce}
            disabled={done || running}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary disabled:opacity-30 transition-colors"
          >
            ⇢ step
          </button>
          <button
            onClick={() => {
              runningRef.current = !running;
              setRunning(!running);
            }}
            disabled={done}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary disabled:opacity-30 transition-colors"
          >
            {running ? "⏸ pause" : "▶ run"}
          </button>
          <button
            onClick={() => rebuild(programIdx, input)}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ↺ reset
          </button>
        </div>
      </div>

      {/* Tape */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-2 py-6 min-h-0">
        <div className="w-full overflow-hidden">
          <div className="flex justify-center gap-[3px]">
            {view.cells.map((c) => {
              const isHead = c.index === view.cells[(VISIBLE - 1) / 2].index;
              const blank = c.symbol === program.blank;
              return (
                <div
                  key={c.index}
                  className="flex flex-col items-center shrink-0"
                  style={{ width: "clamp(15px, 2.5vw, 26px)" }}
                >
                  <div
                    className="w-full flex items-center justify-center border tabular-nums"
                    style={{
                      aspectRatio: "1",
                      fontSize: "clamp(9px, 1.5vw, 14px)",
                      borderColor: isHead ? "#00ff41" : "rgba(0,255,65,0.18)",
                      background: isHead
                        ? "rgba(0,255,65,0.18)"
                        : blank
                          ? "transparent"
                          : "rgba(0,255,65,0.06)",
                      color: blank ? "rgba(0,255,65,0.25)" : "#c9ffd6",
                    }}
                  >
                    {c.symbol}
                  </div>
                  {isHead && <div className="text-primary text-[10px] leading-3">▲</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Last transition */}
        <div className="text-xs text-primary/50 h-4 tabular-nums">
          {view.lastRule
            ? `${view.lastRule.state} reads ${view.lastRule.read} → write ${view.lastRule.write}, move ${view.lastRule.move}, go to ${view.lastRule.next}`
            : done
              ? view.stuck
                ? "no rule matched this state and symbol — the machine is stuck"
                : "reached the halt state"
              : "ready"}
        </div>

        {view.output && (
          <div className="text-xs text-primary/60">
            tape: <span className="text-primary">{view.output}</span>
          </div>
        )}
      </div>

      {/* Rules */}
      <div className="border-t border-primary/10 px-4 py-3 max-h-[34vh] overflow-y-auto">
        <p className="text-xs text-primary/40 mb-2">{program.blurb}</p>
        <div className="flex flex-wrap gap-1.5">
          {program.rules.map((r, i) => {
            const active =
              view.lastRule && view.lastRule.state === r.state && view.lastRule.read === r.read;
            return (
              <span
                key={i}
                className={`px-2 py-0.5 text-[11px] border tabular-nums transition-colors ${
                  active
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-primary/10 text-primary/45"
                }`}
              >
                {r.state},{r.read} → {r.write},{r.move},{r.next}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
