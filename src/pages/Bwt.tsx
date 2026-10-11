import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  SAMPLES,
  SENTINEL,
  Sample,
  alphabetOf,
  inverse,
  longestRun,
  meanCode,
  moveToFront,
  runCount,
  sortedRotations,
  transform,
  zeroFraction,
} from "../features/bwt/bwt";

interface Run {
  sample: Sample;
  rows: { text: string; index: number }[];
  last: string;
  revealed: number; // how many sorted rows are shown
  recovered: string | null;
}

function freshRun(sample: Sample): Run {
  return {
    sample,
    rows: sortedRotations(sample.text),
    last: transform(sample.text),
    revealed: 0,
    recovered: null,
  };
}

const show = (s: string) => s.replace(new RegExp(SENTINEL, "g"), "¤").replace(/ /g, "·");

export default function Bwt() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runRef = useRef<Run>(freshRun(SAMPLES[0]));
  const runningRef = useRef(true);
  const paceRef = useRef(12);

  const [sampleId, setSampleId] = useState(SAMPLES[0].id);
  const [running, setRunning] = useState(true);
  const [pace, setPace] = useState(12);
  const [hud, setHud] = useState({
    runsBefore: 0,
    runsAfter: 0,
    longestBefore: 0,
    longestAfter: 0,
    zerosBefore: 0,
    zerosAfter: 0,
    recovered: false,
  });

  const refreshHud = useCallback(() => {
    const { sample, last, recovered } = runRef.current;
    const plainCodes = moveToFront(sample.text);
    const bwtCodes = moveToFront(last);
    setHud({
      runsBefore: runCount(sample.text),
      runsAfter: runCount(last),
      longestBefore: longestRun(sample.text),
      longestAfter: longestRun(last),
      zerosBefore: zeroFraction(plainCodes),
      zerosAfter: zeroFraction(bwtCodes),
      recovered: recovered === sample.text,
    });
  }, []);

  const reset = useCallback(
    (sample: Sample) => {
      runRef.current = freshRun(sample);
      refreshHud();
    },
    [refreshHud]
  );

  const advance = useCallback(() => {
    const run = runRef.current;
    if (run.revealed >= run.rows.length) {
      if (run.recovered === null) {
        // Only claim the transform is reversible after actually reversing it.
        run.recovered = inverse(run.last);
        return true;
      }
      return false;
    }
    run.revealed++;
    return true;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: W, height: H } = canvas;
    const run = runRef.current;
    const { sample, rows, last, revealed } = run;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    const pad = 20;
    const n = rows.length;
    const rowH = Math.max(11, Math.min(22, (H - pad * 2 - 96) / Math.max(1, n)));
    const charW = Math.max(7, Math.min(16, (W * 0.52) / Math.max(1, n)));

    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(0,255,65,0.4)";
    ctx.fillText(
      `every rotation of the text, sorted — the last column is the transform (¤ is the end marker)`,
      pad,
      pad - 10
    );

    const top = pad + 8;
    ctx.font = `${Math.round(charW * 1.05)}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < n; i++) {
      const y = top + i * rowH;
      const visible = i < revealed;
      const text = show(rows[i].text);
      for (let c = 0; c < text.length; c++) {
        const x = pad + c * charW;
        const isLast = c === text.length - 1;
        if (isLast && visible) {
          ctx.fillStyle = "rgba(0,207,255,0.18)";
          ctx.fillRect(x - charW / 2 + 1, y, charW - 2, rowH - 1);
        }
        ctx.fillStyle = !visible
          ? "rgba(0,255,65,0.08)"
          : isLast
            ? "#00cfff"
            : c === 0
              ? "rgba(0,255,65,0.75)"
              : "rgba(0,255,65,0.3)";
        ctx.fillText(text[c], x + charW / 2, y + rowH / 2);
      }
    }

    // ── what the transform bought ─────────────────────────────────────────
    const panelX = pad + (n + 2) * charW + 30;
    const panelW = W - panelX - pad;
    if (panelW > 180) {
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.font = "10px monospace";
      let y = top;

      ctx.fillStyle = "rgba(0,255,65,0.4)";
      ctx.fillText("original", panelX, y);
      y += 14;
      ctx.fillStyle = "rgba(0,255,65,0.75)";
      ctx.fillText(show(sample.text).slice(0, Math.floor(panelW / 6)), panelX, y);
      y += 24;

      ctx.fillStyle = "rgba(0,255,65,0.4)";
      ctx.fillText("transformed", panelX, y);
      y += 14;
      // Colour each run so the blocking is visible rather than asserted.
      const shown = show(last).slice(0, Math.floor(panelW / 6));
      let cursor = panelX;
      for (let i = 0; i < shown.length; i++) {
        const runStart = i === 0 || shown[i] !== shown[i - 1];
        ctx.fillStyle = runStart ? "#00cfff" : "rgba(0,207,255,0.55)";
        ctx.fillText(shown[i], cursor, y);
        cursor += 6;
      }
      y += 26;

      const stats: [string, string, string][] = [
        ["runs of a repeated char", String(runCount(sample.text)), String(runCount(last))],
        ["longest run", String(longestRun(sample.text)), String(longestRun(last))],
        [
          "zeros after move-to-front",
          `${(zeroFraction(moveToFront(sample.text)) * 100).toFixed(0)}%`,
          `${(zeroFraction(moveToFront(last)) * 100).toFixed(0)}%`,
        ],
        [
          "mean move-to-front code",
          meanCode(moveToFront(sample.text)).toFixed(2),
          meanCode(moveToFront(last)).toFixed(2),
        ],
      ];
      ctx.fillStyle = "rgba(0,255,65,0.35)";
      ctx.fillText("before", panelX + panelW - 110, y);
      ctx.fillText("after", panelX + panelW - 50, y);
      y += 14;
      for (const [label, before, after] of stats) {
        ctx.fillStyle = "rgba(0,255,65,0.4)";
        ctx.fillText(label, panelX, y);
        ctx.fillStyle = "rgba(0,255,65,0.55)";
        ctx.fillText(before, panelX + panelW - 110, y);
        ctx.fillStyle = "#00cfff";
        ctx.fillText(after, panelX + panelW - 50, y);
        y += 15;
      }

      if (run.recovered !== null) {
        y += 12;
        const ok = run.recovered === sample.text;
        ctx.fillStyle = ok ? "#00ff41" : "#ff5555";
        ctx.fillText(
          ok
            ? "inverted back to the original exactly — nothing was lost"
            : "inverse mismatch",
          panelX,
          y
        );
        y += 14;
        ctx.fillStyle = "rgba(0,255,65,0.45)";
        ctx.fillText(show(run.recovered).slice(0, Math.floor(panelW / 6)), panelX, y);
      }
    }
    ctx.textBaseline = "middle";
  }, []);

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
        if (advance()) refreshHud();
      }
      draw();
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [advance, draw, refreshHud]);

  const sample = SAMPLES.find((s) => s.id === sampleId) ?? SAMPLES[0];
  const gathered = hud.runsBefore > 0 ? 1 - hud.runsAfter / hud.runsBefore : 0;

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">burrows-wheeler</span>
        </div>
        <div className="text-xs text-primary/50 tabular-nums flex gap-3 flex-wrap">
          <span>runs {hud.runsBefore} → <span className="text-[#00cfff]">{hud.runsAfter}</span></span>
          <span>longest {hud.longestBefore} → <span className="text-[#00cfff]">{hud.longestAfter}</span></span>
          <span>
            zeros {(hud.zerosBefore * 100).toFixed(0)}% →{" "}
            <span className="text-[#00cfff]">{(hud.zerosAfter * 100).toFixed(0)}%</span>
          </span>
          {gathered > 0.02 && <span className="text-primary">{(gathered * 100).toFixed(0)}% fewer runs</span>}
          {hud.recovered && <span className="text-primary">◆ inverts exactly</span>}
        </div>
      </div>

      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-2">
        <span className="text-primary/30 text-xs mr-1">text</span>
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
          ⇥ one rotation
        </button>
        <button
          onClick={() => {
            while (advance());
            refreshHud();
            draw();
          }}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ⏭ transform and invert
        </button>
        <button
          onClick={() => reset(sample)}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ↺ restart
        </button>

        <Slider
          label="pace"
          title="frames between rotations"
          min={2}
          max={40}
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
          sorting the rotations groups every position whose following text looks alike, and the last
          column holds what came just before each · BWT compresses nothing by itself, it just makes
          the runs that huffman and run-length coding feed on
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
