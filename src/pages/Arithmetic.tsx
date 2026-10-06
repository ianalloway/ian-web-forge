import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Encoded,
  Model,
  SAMPLES,
  Sample,
  buildModel,
  decode,
  encode,
  entropyBits,
  huffmanBits,
  indexOf,
  probability,
} from "../features/arithmetic/arithmetic";

interface Run {
  sample: Sample;
  model: Model;
  encoded: Encoded;
  step: number; // how many symbols have been consumed
  decoded: string | null;
}

function freshRun(sample: Sample): Run {
  const model = buildModel(sample.text);
  return { sample, model, encoded: encode(sample.text, model), step: 0, decoded: null };
}

export default function Arithmetic() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runRef = useRef<Run>(freshRun(SAMPLES[0]));
  const runningRef = useRef(true);
  const paceRef = useRef(22);

  const [sampleId, setSampleId] = useState(SAMPLES[0].id);
  const [running, setRunning] = useState(true);
  const [pace, setPace] = useState(22);
  const [hud, setHud] = useState({ step: 0, total: 0, bits: 0, entropy: 0, huffman: 0, spent: 0 });

  const refreshHud = useCallback(() => {
    const run = runRef.current;
    const spent = run.step === 0 ? 0 : run.encoded.steps[run.step - 1].widthBits;
    setHud({
      step: run.step,
      total: run.sample.text.length,
      bits: run.encoded.bits,
      entropy: entropyBits(run.sample.text, run.model),
      huffman: huffmanBits(run.sample.text, run.model),
      spent,
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
    if (run.step >= run.sample.text.length) return false;
    run.step++;
    if (run.step === run.sample.text.length) {
      // Decoding at the end is the proof that the single number is enough.
      run.decoded = decode(run.encoded.code, run.encoded.bits, run.model, run.sample.text.length);
    }
    return true;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: W, height: H } = canvas;
    const run = runRef.current;
    const { model, sample, encoded, step } = run;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    const pad = 20;
    const barX = pad;
    const barW = W - pad * 2;

    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    // ── the message, with the consumed prefix lit ──────────────────────────
    ctx.fillStyle = "rgba(0,255,65,0.4)";
    ctx.fillText("message", barX, pad - 12);
    const cellW = Math.max(7, Math.min(18, Math.floor(barW / sample.text.length)));
    ctx.font = `${Math.round(cellW * 1.05)}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 0; i < sample.text.length; i++) {
      const x = barX + i * cellW;
      const consumed = i < step;
      if (i === step) {
        ctx.fillStyle = "rgba(255,190,60,0.35)";
        ctx.fillRect(x, pad + 2, cellW, cellW * 1.4);
      }
      ctx.fillStyle = consumed ? "rgba(0,255,65,0.85)" : i === step ? "#ffbe3c" : "rgba(0,255,65,0.28)";
      ctx.fillText(sample.text[i], x + cellW / 2, pad + 2 + cellW * 0.7);
    }

    // ── the interval, zoomed to the current step ───────────────────────────
    // Each frame redraws [low, high) from the previous step as the full width,
    // sliced by symbol probability — which is exactly what the coder does.
    const zoomY = pad + cellW * 1.4 + 26;
    const zoomH = Math.min(150, Math.max(90, H * 0.26));
    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(0,255,65,0.4)";
    ctx.fillText(
      step === 0
        ? "the interval [0,1), sliced by symbol probability — the next symbol picks a slice"
        : `the interval after ${step} symbol${step === 1 ? "" : "s"}, zoomed back to full width and re-sliced`,
      barX,
      zoomY - 13
    );

    let cursor = 0;
    const nextSymbol = step < sample.text.length ? sample.text[step] : null;
    for (let i = 0; i < model.symbols.length; i++) {
      const p = probability(model, i);
      const x = barX + cursor * barW;
      const w = p * barW;
      const chosen = nextSymbol !== null && i === indexOf(model, nextSymbol);
      ctx.fillStyle = chosen ? "rgba(255,190,60,0.5)" : `rgba(0,255,65,${0.1 + 0.2 * (i % 2)})`;
      ctx.fillRect(x, zoomY, w, zoomH);
      ctx.strokeStyle = "rgba(0,0,0,0.55)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x, zoomY, w, zoomH);
      if (w > 16) {
        ctx.fillStyle = chosen ? "#04140a" : "rgba(230,255,235,0.75)";
        ctx.font = "11px monospace";
        ctx.textAlign = "center";
        ctx.fillText(model.symbols[i].ch, x + w / 2, zoomY + zoomH / 2 - 12);
        ctx.font = "9px monospace";
        ctx.fillText(`${(p * 100).toFixed(0)}%`, x + w / 2, zoomY + zoomH / 2 + 2);
        ctx.textAlign = "left";
      }
      cursor += p;
    }

    // ── how narrow it has become, and what that costs ──────────────────────
    const chartY = zoomY + zoomH + 34;
    const chartH = Math.max(70, H - chartY - 76);
    ctx.font = "10px monospace";
    ctx.fillStyle = "rgba(0,255,65,0.4)";
    ctx.fillText("bits spent — the width of the interval, in logarithms", barX, chartY - 13);
    ctx.strokeStyle = "rgba(0,255,65,0.18)";
    ctx.lineWidth = 1;
    ctx.strokeRect(barX + 0.5, chartY + 0.5, barW - 1, chartH - 1);

    const maxBits = Math.max(encoded.bits, entropyBits(sample.text, model), huffmanBits(sample.text, model), 1);
    const px = (i: number) => barX + (i / Math.max(1, sample.text.length)) * barW;
    const py = (b: number) => chartY + chartH - (b / maxBits) * chartH;

    // Huffman's staircase: whole bits per symbol, so it can only step.
    const huffPerSymbol = huffmanBits(sample.text, model) / sample.text.length;
    ctx.strokeStyle = "rgba(255,120,120,0.55)";
    ctx.beginPath();
    ctx.moveTo(px(0), py(0));
    for (let i = 1; i <= sample.text.length; i++) ctx.lineTo(px(i), py(huffPerSymbol * i));
    ctx.stroke();

    ctx.strokeStyle = "#00ff41";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(px(0), py(0));
    for (let i = 0; i < step; i++) ctx.lineTo(px(i + 1), py(encoded.steps[i].widthBits));
    ctx.stroke();

    ctx.fillStyle = "rgba(255,120,120,0.75)";
    ctx.fillText(`huffman ${huffmanBits(sample.text, model)} bits`, barX + barW - 128, chartY + 6);
    ctx.fillStyle = "#00ff41";
    ctx.fillText(`arithmetic ${encoded.bits} bits`, barX + barW - 128, chartY + 20);

    // ── the transmitted number ─────────────────────────────────────────────
    const codeY = chartY + chartH + 14;
    ctx.fillStyle = "rgba(0,255,65,0.4)";
    const asFraction = Number(encoded.code) / 2 ** Math.min(encoded.bits, 52);
    ctx.fillText(
      `the whole message is this one number: ${encoded.bits <= 52 ? asFraction.toFixed(Math.min(16, encoded.bits)) : "0." + encoded.code.toString(2).slice(0, 48) + "… (binary)"}`,
      barX,
      codeY
    );
    if (run.decoded !== null) {
      const ok = run.decoded === sample.text;
      ctx.fillStyle = ok ? "#00ff41" : "#ff5555";
      ctx.fillText(
        ok
          ? `decoded back to "${run.decoded}" — exactly the message, from the number alone`
          : "decode mismatch",
        barX,
        codeY + 15
      );
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
  const saving = hud.huffman > 0 ? (1 - hud.bits / hud.huffman) * 100 : 0;

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">arithmetic coding</span>
        </div>
        <div className="text-xs text-primary/50 tabular-nums flex gap-3 flex-wrap">
          <span>{hud.step}/{hud.total} symbols</span>
          <span>{hud.spent.toFixed(2)} bits spent</span>
          <span className="text-primary">arithmetic {hud.bits}</span>
          <span className="text-[#ff7878]">huffman {hud.huffman}</span>
          <span className="text-[#ffbe3c]">entropy {hud.entropy.toFixed(1)}</span>
          {saving > 1 && <span className="text-primary">{saving.toFixed(0)}% smaller</span>}
        </div>
      </div>

      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-2">
        <span className="text-primary/30 text-xs mr-1">message</span>
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
          ⇥ one symbol
        </button>
        <button
          onClick={() => {
            while (advance());
            refreshHud();
            draw();
          }}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ⏭ encode all
        </button>
        <button
          onClick={() => reset(sample)}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ↺ restart
        </button>

        <Slider
          label="pace"
          title="frames between symbols — lower is faster"
          min={3}
          max={60}
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
          each symbol claims a slice of the interval in proportion to its probability · a symbol with
          probability 0.9 costs 0.15 bits here, where Huffman must spend a whole one · the red line is
          what Huffman would have spent
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
