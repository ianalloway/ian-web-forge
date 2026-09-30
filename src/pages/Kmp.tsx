import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { SAMPLES, Sample, SearchState, newSearch, step } from "../features/kmp/kmp";

interface Pair {
  naive: SearchState;
  kmp: SearchState;
}

function freshPair(sample: Sample): Pair {
  return {
    naive: newSearch(sample.text, sample.pattern, "naive"),
    kmp: newSearch(sample.text, sample.pattern, "kmp"),
  };
}

export default function Kmp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pairRef = useRef<Pair>(freshPair(SAMPLES[1]));
  const runningRef = useRef(true);
  const paceRef = useRef(6);

  const [sampleId, setSampleId] = useState(SAMPLES[1].id);
  const [running, setRunning] = useState(true);
  const [pace, setPace] = useState(6);
  const [hud, setHud] = useState({ naive: 0, kmp: 0, naiveDone: false, kmpDone: false, matches: 0 });

  const refreshHud = useCallback(() => {
    const { naive, kmp } = pairRef.current;
    setHud({
      naive: naive.comparisons,
      kmp: kmp.comparisons,
      naiveDone: naive.done,
      kmpDone: kmp.done,
      matches: Math.max(naive.matches.length, kmp.matches.length),
    });
  }, []);

  const reset = useCallback(
    (sample: Sample) => {
      pairRef.current = freshPair(sample);
      refreshHud();
    },
    [refreshHud]
  );

  const advance = useCallback(() => {
    const { naive, kmp } = pairRef.current;
    // Both run at the same rate, one character comparison each, so the gap on
    // screen is the algorithms' real difference in work.
    if (!naive.done) step(naive);
    if (!kmp.done) step(kmp);
  }, []);

  const drawRun = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      s: SearchState,
      x0: number,
      y0: number,
      width: number,
      cellW: number,
      cellH: number,
      title: string,
      accent: string,
      showFailure: boolean
    ) => {
      const cols = Math.floor(width / cellW);
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = accent;
      ctx.fillText(title, x0, y0);
      ctx.fillStyle = "rgba(0,255,65,0.4)";
      ctx.fillText(
        `${s.comparisons} comparisons${s.done ? " · finished" : ""}`,
        x0 + ctx.measureText(title).width + 12,
        y0
      );

      // When the search finishes, the pattern's resting position is past the
      // end of the text, so it is drawn at its last legal alignment instead of
      // off-screen.
      const drawOffset = Math.min(s.offset, Math.max(0, s.text.length - s.pattern.length));
      const textY = y0 + 20;
      ctx.font = `${Math.round(cellH * 0.62)}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // The haystack. Characters already passed are dim; matched ones green.
      for (let i = 0; i < s.text.length && i < cols; i++) {
        const x = x0 + i * cellW;
        const inWindow = i >= drawOffset && i < drawOffset + s.pattern.length;
        const matchedHere = i >= drawOffset && i < drawOffset + s.matched;
        const isCompare = s.lastCompare?.textIndex === i;
        const inFound = s.matches.some((m) => i >= m && i < m + s.pattern.length);

        if (inFound) {
          ctx.fillStyle = "rgba(0,255,65,0.22)";
          ctx.fillRect(x, textY, cellW, cellH);
        } else if (inWindow) {
          ctx.fillStyle = "rgba(0,255,65,0.07)";
          ctx.fillRect(x, textY, cellW, cellH);
        }
        if (isCompare) {
          ctx.fillStyle = s.lastCompare!.equal ? "rgba(0,255,65,0.55)" : "rgba(255,70,70,0.6)";
          ctx.fillRect(x, textY, cellW, cellH);
        }
        ctx.fillStyle = isCompare
          ? "#04140a"
          : matchedHere
            ? "#eafff0"
            : i < s.offset
              ? "rgba(0,255,65,0.3)"
              : "rgba(0,255,65,0.75)";
        ctx.fillText(s.text[i], x + cellW / 2, textY + cellH / 2);
      }

      // The needle, drawn where it currently sits.
      const patY = textY + cellH + 3;
      for (let j = 0; j < s.pattern.length; j++) {
        const i = drawOffset + j;
        if (i >= cols) break;
        const x = x0 + i * cellW;
        const isCompare = s.lastCompare?.patternIndex === j;
        const matched = j < s.matched;
        ctx.fillStyle = isCompare
          ? s.lastCompare!.equal
            ? "rgba(0,255,65,0.55)"
            : "rgba(255,70,70,0.6)"
          : matched
            ? "rgba(0,255,65,0.3)"
            : "rgba(0,255,65,0.12)";
        ctx.fillRect(x, patY, cellW, cellH);
        ctx.fillStyle = isCompare ? "#04140a" : matched ? "#eafff0" : "rgba(0,255,65,0.8)";
        ctx.fillText(s.pattern[j], x + cellW / 2, patY + cellH / 2);
      }

      // KMP's precomputed table, and what it is about to do with it.
      if (showFailure) {
        const failY = patY + cellH + 6;
        ctx.font = "9px monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillStyle = "rgba(0,255,65,0.35)";
        ctx.fillText("failure", x0, failY + 1);
        ctx.textAlign = "center";
        for (let j = 0; j < s.pattern.length; j++) {
          const i = drawOffset + j;
          if (i >= cols) break;
          const x = x0 + i * cellW;
          const active = s.lastJump?.kind === "failure" && j === s.matched;
          ctx.fillStyle = active ? "#ffbe3c" : "rgba(0,255,65,0.45)";
          ctx.fillText(String(s.failure[j]), x + cellW / 2, failY + 1);
        }
        ctx.textAlign = "left";
      }

      // Why the pattern moved where it moved.
      if (s.lastJump) {
        const shift = s.lastJump.to - s.lastJump.from;
        const label =
          s.lastJump.kind === "failure"
            ? `partial match — failure table shifts ${shift}, nothing reread`
            : s.lastJump.kind === "match"
              ? `match found — shift ${shift}`
              : `mismatch — slide 1`;
        ctx.font = "10px monospace";
        ctx.textAlign = "right";
        ctx.textBaseline = "top";
        ctx.fillStyle = s.lastJump.kind === "failure" ? "rgba(255,190,60,0.9)" : "rgba(0,255,65,0.45)";
        ctx.fillText(label, x0 + width, y0);
        ctx.textAlign = "left";
      }
    },
    []
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: W, height: H } = canvas;
    const { naive, kmp } = pairRef.current;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    const pad = 18;
    const width = W - pad * 2;
    // One row of text, so the cell width follows the haystack length.
    const cellW = Math.max(7, Math.min(22, Math.floor(width / Math.max(1, naive.text.length))));
    const cellH = Math.round(cellW * 1.4);

    drawRun(ctx, naive, pad, pad, width, cellW, cellH, "naive", "#ff8a3d", false);
    drawRun(ctx, kmp, pad, pad + cellH * 2 + 66, width, cellW, cellH, "KMP", "#00ff41", true);

    // The running total, as a pair of bars — the whole argument for KMP.
    const barTop = pad + cellH * 4 + 150;
    if (barTop < H - 40) {
      const worst = Math.max(naive.comparisons, kmp.comparisons, 1);
      const barW = width - 120;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const rows: [string, number, string][] = [
        ["naive", naive.comparisons, "#ff8a3d"],
        ["KMP", kmp.comparisons, "#00ff41"],
      ];
      rows.forEach(([label, value, colour], i) => {
        const y = barTop + i * 22;
        ctx.fillStyle = "rgba(0,255,65,0.45)";
        ctx.fillText(label, pad, y);
        ctx.fillStyle = "rgba(0,255,65,0.12)";
        ctx.fillRect(pad + 46, y - 6, barW, 12);
        ctx.fillStyle = colour;
        ctx.fillRect(pad + 46, y - 6, barW * (value / worst), 12);
        ctx.fillStyle = "rgba(230,255,235,0.8)";
        ctx.fillText(String(value), pad + 52 + barW, y);
      });
    }
  }, [drawRun]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      draw();
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let frame = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (runningRef.current && ++frame % paceRef.current === 0) {
        advance();
        refreshHud();
      }
      draw();
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [advance, draw, refreshHud]);

  const sample = SAMPLES.find((s) => s.id === sampleId) ?? SAMPLES[1];
  const ratio = hud.kmp > 0 ? hud.naive / hud.kmp : 1;

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">kmp string search</span>
        </div>
        <div className="text-xs text-primary/50 tabular-nums flex gap-3 flex-wrap">
          <span className="text-[#ff8a3d]">naive {hud.naive}</span>
          <span className="text-primary">kmp {hud.kmp}</span>
          {ratio > 1.05 && <span>{ratio.toFixed(1)}× fewer</span>}
          <span>{hud.matches} matches</span>
          {hud.naiveDone && hud.kmpDone && <span className="text-primary">◆ both finished</span>}
        </div>
      </div>

      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-2">
        <span className="text-primary/30 text-xs mr-1">haystack</span>
        {SAMPLES.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setSampleId(s.id);
              reset(s);
            }}
            title={s.note}
            className={`px-2.5 py-1 text-xs border transition-colors ${
              s.id === sampleId
                ? "border-primary bg-primary/15 text-primary"
                : "border-primary/25 text-primary/60 hover:border-primary hover:text-primary"
            }`}
          >
            {s.label}
          </button>
        ))}
        <span className="text-primary/30 text-xs hidden lg:inline ml-1">{sample.note}</span>
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
            advance();
            refreshHud();
            draw();
          }}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ⇥ one comparison
        </button>
        <button
          onClick={() => {
            const { naive, kmp } = pairRef.current;
            let guard = 0;
            while ((!naive.done || !kmp.done) && guard++ < 2_000_000) advance();
            refreshHud();
            draw();
          }}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ⏭ run to end
        </button>
        <button
          onClick={() => reset(sample)}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ↺ restart
        </button>
        <span className="text-primary/30 text-xs">
          pattern <span className="text-primary/70">{sample.pattern}</span>
        </span>

        <Slider
          label="pace"
          title="frames between comparisons — lower is faster"
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
          both search the same text at the same rate · red = a mismatch · on a mismatch naive slides
          one character and rereads, while KMP consults its failure table and never looks at a text
          character twice
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
  step: stepSize,
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
        step={stepSize}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-20 accent-primary"
      />
      <span className="text-primary/60 text-xs w-9 tabular-nums">{fmt(value)}</span>
    </div>
  );
}
