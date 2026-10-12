import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  MODELS,
  accuracy,
  greedyDecode,
  logLikelihood,
  makeRng,
  pathLogProb,
  posteriorDecode,
  posteriors,
  sample,
  switchCount,
  viterbi,
} from "../features/viterbi/viterbi";

const AMBER = "#ffbe3c";
const CYAN = "#5cf0e0";
const DIM = "rgba(0,255,65,0.35)";

export default function Viterbi() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modelIdx, setModelIdx] = useState(0);
  const [seed, setSeed] = useState(777);
  const [length, setLength] = useState(80);
  const [revealed, setRevealed] = useState(0);
  const [running, setRunning] = useState(true);
  const [showPosterior, setShowPosterior] = useState(true);
  const runningRef = useRef(true);
  const revealedRef = useRef(0);
  const paceRef = useRef(3);
  const [pace, setPace] = useState(3);

  const model = MODELS[modelIdx];

  // Everything on screen comes out of one memo so the numbers in the HUD and
  // the rows in the canvas can never drift apart.
  const run = useMemo(() => {
    const hmm = model.hmm;
    const { states, observations } = sample(hmm, length, makeRng(seed));
    const v = viterbi(hmm, observations);
    const post = posteriorDecode(hmm, observations);
    const greedy = greedyDecode(hmm, observations);
    return {
      hmm,
      states,
      observations,
      viterbiPath: v.path,
      viterbiLogProb: v.logProb,
      posteriorPath: post,
      greedyPath: greedy,
      gamma: posteriors(hmm, observations),
      totalLogL: logLikelihood(hmm, observations),
      posteriorLogProb: pathLogProb(hmm, post, observations),
      greedyLogProb: pathLogProb(hmm, greedy, observations),
      accViterbi: accuracy(states, v.path),
      accPosterior: accuracy(states, post),
      accGreedy: accuracy(states, greedy),
      switchesTruth: switchCount(states),
      switchesViterbi: switchCount(v.path),
      switchesPosterior: switchCount(post),
    };
  }, [model, seed, length]);

  const reset = useCallback(() => {
    revealedRef.current = 0;
    setRevealed(0);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: W, height: H } = canvas;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    const S = run.hmm.states.length;
    const T = run.observations.length;
    const shown = Math.min(revealedRef.current, T);
    const pad = 26;
    const labelW = 78;
    const trackW = W - pad * 2 - labelW;
    const cell = trackW / Math.max(1, T);

    ctx.font = "10px monospace";
    ctx.textBaseline = "middle";

    // Rows: the observations you actually see, then the truth, then what each
    // decoder claims. Stacking them makes the disagreement the visible thing.
    const rows: { label: string; seq: number[] | null; color: string; kind: string }[] = [
      { label: "observed", seq: run.observations, color: DIM, kind: "obs" },
      { label: "truth", seq: run.states, color: "#00ff41", kind: "state" },
      { label: "viterbi", seq: run.viterbiPath, color: AMBER, kind: "state" },
      { label: "posterior", seq: run.posteriorPath, color: CYAN, kind: "state" },
      { label: "greedy", seq: run.greedyPath, color: "rgba(255,255,255,0.45)", kind: "state" },
    ];

    // Lay the page out proportionally rather than at fixed sizes: the five
    // sequence rows take a share of the height, the posterior heat strip takes
    // whatever is left after the stats footer, and on a short viewport both
    // shrink instead of the footer falling off the bottom.
    // The stats footer is anchored to the bottom rather than floated after
    // the content, so it can never print over the page caption below the
    // canvas however tall the heat strip gets. Everything above divides the
    // space that is left.
    const footerH = 170;
    const footY = H - footerH + 18;
    const available = H - pad - 14 - footerH;
    const rowH = Math.max(16, Math.min(32, available * (showPosterior ? 0.13 : 0.16)));
    const rowGap = Math.max(5, rowH * 0.42);
    const rowsBlock = rows.length * (rowH + rowGap);
    const heatH = showPosterior
      ? Math.max(48, Math.min(190, available - rowsBlock - 16))
      : 0;
    const topY = pad + 14;

    rows.forEach((row, i) => {
      const y = topY + i * (rowH + rowGap);
      ctx.fillStyle = "rgba(0,255,65,0.55)";
      ctx.textAlign = "right";
      ctx.fillText(row.label, pad + labelW - 10, y + rowH / 2);
      ctx.textAlign = "left";

      if (!row.seq) return;
      for (let t = 0; t < Math.min(shown, row.seq.length); t++) {
        const x = pad + labelW + t * cell;
        const val = row.seq[t];
        if (row.kind === "obs") {
          // Observations are a symbol, not a state: draw them as a glyph
          // strip so they read as input rather than as another guess.
          ctx.fillStyle = "rgba(0,255,65,0.10)";
          ctx.fillRect(x, y, Math.max(1, cell - 1), rowH);
          if (cell > 7) {
            ctx.fillStyle = DIM;
            ctx.textAlign = "center";
            ctx.fillText(run.hmm.obs[val], x + cell / 2, y + rowH / 2);
            ctx.textAlign = "left";
          }
        } else {
          // State bands: brightness encodes which state, so a constant run
          // reads as one solid block.
          const shade = S === 1 ? 1 : val / (S - 1);
          ctx.globalAlpha = 0.25 + 0.65 * shade;
          ctx.fillStyle = row.color;
          ctx.fillRect(x, y, Math.max(1, cell - 1), rowH);
          ctx.globalAlpha = 1;
          // A wrong position is marked rather than left for the eye to find.
          if (row.label !== "truth" && t < run.states.length && val !== run.states[t]) {
            ctx.fillStyle = "rgba(255,60,60,0.9)";
            ctx.fillRect(x, y + rowH - 3, Math.max(1, cell - 1), 3);
          }
        }
      }
    });

    const afterRows = topY + rows.length * (rowH + rowGap) + 6;

    // The posterior heat strip: P(state | all observations) at each position.
    // This is what posterior decoding takes the argmax of, and the place the
    // model's uncertainty is actually legible.
    if (showPosterior && heatH > 0) {
      ctx.fillStyle = "rgba(0,255,65,0.45)";
      ctx.textAlign = "right";
      ctx.fillText("P(state|obs)", pad + labelW - 10, afterRows + heatH / 2);
      ctx.textAlign = "left";
      const bandH = heatH / S;
      for (let s = 0; s < S; s++) {
        for (let t = 0; t < shown; t++) {
          const p = run.gamma[t]?.[s] ?? 0;
          const x = pad + labelW + t * cell;
          ctx.fillStyle = `rgba(92,240,224,${(0.06 + 0.9 * p).toFixed(3)})`;
          ctx.fillRect(x, afterRows + s * bandH, Math.max(1, cell - 1), bandH - 1);
        }
        ctx.fillStyle = "rgba(0,255,65,0.3)";
        ctx.textAlign = "left";
        if (bandH > 11) {
          ctx.fillText(run.hmm.states[s], pad + labelW + 3, afterRows + s * bandH + bandH / 2);
        }
      }
    }

    // Footer stats. The two columns are the whole point of the page: Viterbi
    // owns the path-probability column, posterior decoding owns accuracy.
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(0,255,65,0.45)";
    ctx.fillText("decoder", pad, footY);
    ctx.fillText("accuracy", pad + 110, footY);
    ctx.fillText("log P(path, obs)", pad + 200, footY);
    ctx.fillText("state switches", pad + 330, footY);

    const lines: { label: string; acc: number | null; lp: number | null; sw: number; color: string }[] = [
      { label: "truth", acc: null, lp: pathLogProb(run.hmm, run.states, run.observations), sw: run.switchesTruth, color: "#00ff41" },
      { label: "viterbi", acc: run.accViterbi, lp: run.viterbiLogProb, sw: run.switchesViterbi, color: AMBER },
      { label: "posterior", acc: run.accPosterior, lp: run.posteriorLogProb, sw: run.switchesPosterior, color: CYAN },
      { label: "greedy", acc: run.accGreedy, lp: run.greedyLogProb, sw: switchCount(run.greedyPath), color: "rgba(255,255,255,0.5)" },
    ];

    const bestAcc = Math.max(run.accViterbi, run.accPosterior, run.accGreedy);
    lines.forEach((l, i) => {
      const y = footY + 16 + i * 15;
      ctx.fillStyle = l.color;
      ctx.fillText(l.label, pad, y);
      if (l.acc !== null) {
        ctx.fillStyle = l.acc === bestAcc ? l.color : "rgba(0,255,65,0.5)";
        ctx.fillText(`${(l.acc * 100).toFixed(1)}%`, pad + 110, y);
      }
      if (l.lp !== null) {
        const isBest = l.label === "viterbi";
        ctx.fillStyle = isBest ? AMBER : "rgba(0,255,65,0.5)";
        ctx.fillText(l.lp === -Infinity ? "impossible" : l.lp.toFixed(2), pad + 200, y);
      }
      ctx.fillStyle = "rgba(0,255,65,0.5)";
      ctx.fillText(String(l.sw), pad + 330, y);
    });

    ctx.fillStyle = "rgba(0,255,65,0.35)";
    ctx.fillText(
      `log P(obs) summed over all ${run.hmm.states.length}^${T} paths = ${run.totalLogL.toFixed(2)}`,
      pad,
      footY + 16 + lines.length * 15 + 6,
    );
  }, [run, showPosterior]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      canvas.width = Math.max(320, Math.floor(rect.width));
      canvas.height = Math.max(260, Math.floor(rect.height));
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
        if (revealedRef.current < run.observations.length) {
          revealedRef.current++;
          setRevealed(revealedRef.current);
        }
      }
      draw();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [draw, run.observations.length]);

  const winner =
    run.accPosterior > run.accViterbi
      ? "posterior decoding is more accurate here"
      : run.accViterbi > run.accPosterior
        ? "viterbi is more accurate here"
        : "both decoders tie on accuracy";

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">viterbi decoder</span>
        </div>
        <div className="text-xs text-primary/50 tabular-nums flex gap-3 flex-wrap">
          <span>
            {run.hmm.states.length} states · {run.observations.length} obs
          </span>
          <span>t {Math.min(revealed, run.observations.length)}</span>
          <span className="text-[#ffbe3c]">viterbi {(run.accViterbi * 100).toFixed(0)}%</span>
          <span className="text-[#5cf0e0]">posterior {(run.accPosterior * 100).toFixed(0)}%</span>
          <span>greedy {(run.accGreedy * 100).toFixed(0)}%</span>
          <span className="text-primary">{winner}</span>
        </div>
      </div>

      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-2">
        <span className="text-primary/30 text-xs mr-1">model</span>
        {MODELS.map((m, i) => (
          <button
            key={m.name}
            onClick={() => {
              setModelIdx(i);
              reset();
            }}
            title={m.blurb}
            className={`px-2.5 py-1 text-xs border transition-colors ${
              i === modelIdx
                ? "border-primary bg-primary/15 text-primary"
                : "border-primary/25 text-primary/60 hover:border-primary hover:text-primary"
            }`}
          >
            {m.name}
          </button>
        ))}
        <span className="text-primary/30 text-xs hidden lg:inline ml-1">{model.blurb}</span>
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
            revealedRef.current = run.observations.length;
            setRevealed(run.observations.length);
            draw();
          }}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ⏭ decode all
        </button>
        <button
          onClick={() => {
            setSeed((s) => s + 1);
            reset();
          }}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ↻ new sequence
        </button>
        <button
          onClick={() => setShowPosterior((v) => !v)}
          className={`px-3 py-1 text-xs border transition-colors ${
            showPosterior
              ? "border-[#5cf0e0]/60 text-[#5cf0e0]"
              : "border-primary/30 text-primary/60 hover:border-primary"
          }`}
        >
          {showPosterior ? "◆ posterior" : "◇ posterior"}
        </button>
        <span
          className="text-primary/30 text-xs"
          title="the truth switches state this often; a decoder that switches far less is paying for path probability with accuracy"
        >
          switches: truth {run.switchesTruth} / viterbi {run.switchesViterbi} / posterior{" "}
          {run.switchesPosterior}
        </span>

        <Slider
          label="length"
          title="observations in the sequence"
          min={20}
          max={200}
          step={10}
          value={length}
          fmt={(v) => `${v}`}
          onChange={(v) => {
            setLength(v);
            reset();
          }}
        />
        <Slider
          label="pace"
          title="frames per observation"
          min={1}
          max={20}
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
          red ticks are wrong positions · viterbi (amber) returns the single most likely path and
          always wins the log P(path) column — but when transitions are stickier than emissions are
          informative it buys that with a near-constant path, and posterior decoding (cyan) is more
          accurate position by position
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
