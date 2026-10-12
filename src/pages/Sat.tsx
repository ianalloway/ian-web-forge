import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  PRESETS,
  clauseStatus,
  evaluate,
  formatClause,
  makeRng,
  solve,
  type SolveStep,
} from "../features/sat/dpll";

const AMBER = "#ffbe3c";
const RED = "rgba(255,70,70,0.95)";
const CYAN = "#5cf0e0";

export default function Sat() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [presetId, setPresetId] = useState(PRESETS[1].id);
  const [seed, setSeed] = useState(3);
  const [useUnit, setUseUnit] = useState(true);
  const [usePure, setUsePure] = useState(true);
  const [cursor, setCursor] = useState(0);
  const [running, setRunning] = useState(true);
  const runningRef = useRef(true);
  const cursorRef = useRef(0);
  const paceRef = useRef(8);
  const [pace, setPace] = useState(8);

  const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0];

  const sim = useMemo(() => {
    const formula = preset.build(makeRng(seed));
    const result = solve(formula, {
      useUnitPropagation: useUnit,
      usePureLiterals: usePure,
      maxSteps: 3000,
    });
    // The witness is re-checked here, on the page, rather than taken on trust
    // from the solver that produced it.
    const witnessValid = result.sat && result.assignment !== null
      ? evaluate(formula, result.assignment)
      : null;
    const baseline = solve(formula, {
      useUnitPropagation: false,
      usePureLiterals: false,
      maxSteps: 1,
    });
    return { formula, result, witnessValid, baseline };
  }, [preset, seed, useUnit, usePure]);

  const reset = useCallback(() => {
    cursorRef.current = 0;
    setCursor(0);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: W, height: H } = canvas;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    const { formula, result } = sim;
    const at = Math.min(cursorRef.current, result.steps.length);
    const step: SolveStep | null = at > 0 ? result.steps[at - 1] : null;
    const assignment = step ? step.assignment : new Array(formula.variables).fill(null);

    const pad = 24;
    ctx.font = "10px monospace";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";

    // --- the assignment, one box per variable ------------------------------
    ctx.fillStyle = "rgba(0,255,65,0.4)";
    ctx.fillText("assignment", pad, pad);
    const boxW = Math.min(30, Math.max(14, (W - pad * 2) / Math.max(1, formula.variables) - 3));
    const varY = pad + 12;
    for (let v = 0; v < formula.variables; v++) {
      const perRow = Math.max(1, Math.floor((W - pad * 2) / (boxW + 3)));
      const x = pad + (v % perRow) * (boxW + 3);
      const y = varY + Math.floor(v / perRow) * 24;
      const val = assignment[v];
      ctx.fillStyle =
        val === null ? "rgba(0,255,65,0.07)" : val ? "rgba(0,255,65,0.3)" : "rgba(255,190,60,0.22)";
      ctx.fillRect(x, y, boxW, 18);
      // The variable just touched is outlined, so the step is legible.
      if (step && step.variable === v) {
        ctx.strokeStyle = step.kind === "conflict" ? RED : step.kind === "backtrack" ? RED : AMBER;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, boxW - 1, 17);
      }
      if (boxW > 18) {
        ctx.fillStyle = val === null ? "rgba(0,255,65,0.3)" : val ? "#00ff41" : AMBER;
        ctx.textAlign = "center";
        ctx.fillText(`${v + 1}`, x + boxW / 2, y + 9);
        ctx.textAlign = "left";
      }
    }
    const perRow = Math.max(1, Math.floor((W - pad * 2) / (boxW + 3)));
    const varRows = Math.ceil(formula.variables / perRow);
    const afterVars = varY + varRows * 24 + 10;

    // --- the clauses, coloured by status under the current assignment -------
    // This is where the search becomes intelligible: a clause turning red is
    // the conflict, and a clause with one slot left is the next forced move.
    ctx.fillStyle = "rgba(0,255,65,0.4)";
    ctx.fillText(
      `${formula.clauses.length} clauses — green satisfied, cyan forced (one literal left), red conflict`,
      pad,
      afterVars,
    );
    const clauseTop = afterVars + 14;
    const colW = Math.min(170, Math.max(96, (W - pad * 2) / 6));
    const rowH = 14;
    // Reserve the footer block (tape + counters + the baseline line) plus the
    // two-line page caption below the canvas, then balance the clauses across
    // the columns that fit rather than filling one tall column and leaving
    // the rest of the canvas empty.
    const footerBlock = 150;
    const rowsThatFit = Math.max(1, Math.floor((H - clauseTop - footerBlock) / rowH));
    const cols = Math.max(1, Math.floor((W - pad * 2) / colW));
    const maxRows = Math.max(1, Math.min(rowsThatFit, Math.ceil(formula.clauses.length / cols)));
    const capacity = maxRows * cols;

    for (let i = 0; i < Math.min(formula.clauses.length, capacity); i++) {
      const col = Math.floor(i / maxRows);
      const row = i % maxRows;
      const x = pad + col * colW;
      const y = clauseTop + row * rowH + 6;
      const status = clauseStatus(formula.clauses[i], assignment);
      ctx.fillStyle =
        status === "satisfied"
          ? "rgba(0,255,65,0.75)"
          : status === "conflict"
            ? RED
            : status === "unit"
              ? CYAN
              : "rgba(0,255,65,0.22)";
      if (step && step.clause === i && (step.kind === "conflict" || step.kind === "unit")) {
        ctx.fillStyle = step.kind === "conflict" ? RED : CYAN;
        ctx.fillRect(x - 3, y - 6, colW - 6, rowH - 1);
        ctx.fillStyle = "#000";
      }
      const text = formatClause(formula.clauses[i]);
      ctx.fillText(text.length * 5.6 > colW - 10 ? text.slice(0, Math.floor((colW - 14) / 5.6)) + "…" : text, x, y);
    }
    if (formula.clauses.length > capacity) {
      ctx.fillStyle = "rgba(0,255,65,0.3)";
      ctx.fillText(
        `… ${formula.clauses.length - capacity} more`,
        pad,
        clauseTop + Math.min(maxRows, formula.clauses.length) * rowH + 6,
      );
    }

    // --- the step tape: what kind of move each step was --------------------
    const tapeY = H - 128;
    ctx.fillStyle = "rgba(0,255,65,0.4)";
    ctx.fillText("search", pad, tapeY - 10);
    const tapeW = W - pad * 2;
    const tcell = tapeW / Math.max(1, result.steps.length);
    const kindColor: Record<string, string> = {
      decide: AMBER,
      unit: "#00ff41",
      pure: CYAN,
      conflict: RED,
      backtrack: "rgba(255,120,60,0.9)",
      sat: "#00ff41",
      unsat: RED,
    };
    for (let i = 0; i < result.steps.length; i++) {
      const s = result.steps[i];
      const h = s.kind === "decide" ? 16 : s.kind === "conflict" || s.kind === "backtrack" ? 12 : 7;
      ctx.fillStyle = i < at ? kindColor[s.kind] : "rgba(0,255,65,0.08)";
      ctx.fillRect(pad + i * tcell, tapeY + 16 - h, Math.max(1, tcell - 0.4), h);
    }

    // --- counters ----------------------------------------------------------
    const statsY = H - 94;
    const stats = result.stats;
    const cols2 = [
      { label: "decisions", value: String(stats.decisions), color: AMBER },
      { label: "propagations", value: String(stats.propagations), color: "#00ff41" },
      { label: "pure", value: String(stats.pureLiterals), color: CYAN },
      { label: "conflicts", value: String(stats.conflicts), color: RED },
      { label: "backtracks", value: String(stats.backtracks), color: "rgba(255,120,60,0.9)" },
      { label: "nodes", value: String(stats.nodes), color: "rgba(0,255,65,0.8)" },
      {
        label: "of 2^n",
        value: formula.variables <= 30 ? (2 ** formula.variables).toLocaleString() : "huge",
        color: "rgba(0,255,65,0.45)",
      },
    ];
    const cw = Math.min(110, (W - pad * 2) / cols2.length);
    cols2.forEach((c, i) => {
      ctx.fillStyle = "rgba(0,255,65,0.4)";
      ctx.fillText(c.label, pad + i * cw, statsY);
      ctx.fillStyle = c.color;
      ctx.fillText(c.value, pad + i * cw, statsY + 14);
    });

    // The headline: how much the forced moves saved against plain
    // backtracking on this very formula.
    const saved = sim.baseline.stats.nodes / Math.max(1, stats.nodes);
    ctx.fillStyle = "rgba(0,255,65,0.45)";
    ctx.fillText(
      useUnit || usePure
        ? `plain backtracking on this formula: ${sim.baseline.stats.nodes} nodes — forced moves cut it ${saved.toFixed(1)}×`
        : "forced moves are off: this is plain chronological backtracking",
      pad,
      statsY + 32,
    );
  }, [sim, useUnit, usePure]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      canvas.width = Math.max(320, Math.floor(rect.width));
      canvas.height = Math.max(380, Math.floor(rect.height));
      draw();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [draw]);

  useEffect(() => {
    let raf = 0;
    let frame = 0;
    const tick = () => {
      frame++;
      if (runningRef.current && frame % paceRef.current === 0) {
        if (cursorRef.current < sim.result.steps.length) {
          cursorRef.current++;
          setCursor(cursorRef.current);
        }
      }
      draw();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [draw, sim.result.steps.length]);

  const { result, formula } = sim;
  const done = cursor >= result.steps.length;

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/lab" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← lab
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">dpll sat solver</span>
        </div>
        <div className="text-xs text-primary/50 tabular-nums flex gap-3 flex-wrap">
          <span>
            {formula.variables} vars · {formula.clauses.length} clauses
          </span>
          <span>
            step {Math.min(cursor, result.steps.length)}/{result.steps.length}
            {result.truncated && "+"}
          </span>
          <span className="text-[#ffbe3c]">{result.stats.nodes} nodes</span>
          {done &&
            (result.sat ? (
              <span className="text-primary">
                ◆ SAT{sim.witnessValid ? " · witness verified" : " · witness FAILED"}
              </span>
            ) : (
              <span className="text-red-400">✕ UNSAT — proved, not guessed</span>
            ))}
        </div>
      </div>

      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-2">
        <span className="text-primary/30 text-xs mr-1">formula</span>
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setPresetId(p.id);
              reset();
            }}
            title={p.note}
            className={`px-2.5 py-1 text-xs border transition-colors ${
              p.id === presetId
                ? "border-primary bg-primary/15 text-primary"
                : "border-primary/25 text-primary/60 hover:border-primary hover:text-primary"
            }`}
          >
            {p.label}
          </button>
        ))}
        <span className="text-primary/30 text-xs hidden lg:inline ml-1">{preset.note}</span>
      </div>

      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          onClick={() => {
            runningRef.current = !running;
            setRunning(!running);
          }}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          {running ? "⏸ pause" : "▶ resume"}
        </button>
        <button
          onClick={() => {
            cursorRef.current = Math.min(result.steps.length, cursorRef.current + 1);
            setCursor(cursorRef.current);
            draw();
          }}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ⇥ step
        </button>
        <button
          onClick={() => {
            cursorRef.current = result.steps.length;
            setCursor(result.steps.length);
            draw();
          }}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ⏭ solve
        </button>
        <button
          onClick={() => {
            setSeed((s) => s + 1);
            reset();
          }}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ↻ new formula
        </button>
        <button
          onClick={() => {
            setUseUnit((v) => !v);
            reset();
          }}
          title="a clause with one literal left has only one way to be true — that is an implication, not a guess"
          className={`px-3 py-1 text-xs border transition-colors ${
            useUnit ? "border-primary bg-primary/15 text-primary" : "border-primary/25 text-primary/50"
          }`}
        >
          {useUnit ? "◆ unit propagation" : "◇ unit propagation"}
        </button>
        <button
          onClick={() => {
            setUsePure((v) => !v);
            reset();
          }}
          title="a variable appearing with only one polarity can be set that way with no risk"
          className={`px-3 py-1 text-xs border transition-colors ${
            usePure ? "border-[#5cf0e0]/60 text-[#5cf0e0]" : "border-primary/25 text-primary/50"
          }`}
        >
          {usePure ? "◆ pure literals" : "◇ pure literals"}
        </button>

        <Slider
          label="pace"
          title="frames per search step"
          min={1}
          max={30}
          step={1}
          value={pace}
          fmt={(v) => `${v}f`}
          onChange={(v) => {
            setPace(v);
            paceRef.current = v;
          }}
        />
      </div>

      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute bottom-1 left-4 right-4 text-xs text-primary/40 pointer-events-none">
          amber bars are guesses, green are forced — on structured formulas almost all the work is
          forced, which is why SAT solvers are useful at all · a SAT answer carries a witness you
          can check in one pass, while UNSAT is a claim about all 2^n assignments, so the pigeonhole
          preset is the one a human sees instantly and DPLL has to grind out
        </div>
      </div>
    </div>
  );
}

function Slider({
  label,
  title,
  min,
  max,
  step,
  value,
  fmt,
  onChange,
}: {
  label: string;
  title: string;
  min: number;
  max: number;
  step: number;
  value: number;
  fmt: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2" title={title}>
      <span className="text-primary/40 text-xs">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-20 accent-primary"
      />
      <span className="text-primary/60 text-xs w-9 tabular-nums">{fmt(value)}</span>
    </div>
  );
}
