import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fitCanvas } from "../lib/canvas";
import {
  RocPoint,
  PrPoint,
  Sample,
  accuracy,
  auc,
  averagePrecision,
  bestF1Threshold,
  confusionAt,
  fallout,
  f1,
  makeRng,
  precision,
  prCurve,
  recall,
  rocCurve,
  sampleScores,
} from "../features/roc/roc";

const NEG = "#00cfff"; // negatives (cyan)
const POS = "#ff4da6"; // positives (pink)
const CURVE = "#00ff41"; // summary curves (matrix green)
const THRESH = "#ffe066"; // threshold line (amber)
const N = 500;
const SIGMA = 1;

export default function Roc() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const samplesRef = useRef<Sample[]>([]);
  const rocRef = useRef<RocPoint[]>([]);
  const prRef = useRef<PrPoint[]>([]);
  const seedRef = useRef(1);
  const geomRef = useRef({ distX0: 0, distX1: 0, distTop: 0, distBot: 0 }); // for click-to-set
  const rangeRef = useRef({ min: -4, max: 7 });
  const thresholdRef = useRef(1);

  const [separation, setSeparation] = useState(2.2);
  const [prevalence, setPrevalence] = useState(0.4);
  const [threshold, setThresholdState] = useState(1);
  const [range, setRange] = useState({ min: -4, max: 7 });
  const [aucv, setAucv] = useState(0);
  const [apv, setApv] = useState(0);

  const setThreshold = useCallback((t: number) => {
    thresholdRef.current = t;
    setThresholdState(t);
  }, []);

  const resample = useCallback(
    (sep: number, prev: number, newSeed: boolean) => {
      if (newSeed) seedRef.current++;
      const samples = sampleScores(
        { n: N, prior: prev, separation: sep, sigma: SIGMA },
        makeRng(seedRef.current * 7919 + 1)
      );
      samplesRef.current = samples;
      rocRef.current = rocCurve(samples);
      prRef.current = prCurve(samples);
      setAucv(auc(rocRef.current));
      setApv(averagePrecision(samples));
      let lo = Infinity;
      let hi = -Infinity;
      for (const s of samples) {
        if (s.score < lo) lo = s.score;
        if (s.score > hi) hi = s.score;
      }
      const pad = (hi - lo) * 0.04 + 0.2;
      rangeRef.current = { min: lo - pad, max: hi + pad };
      setRange(rangeRef.current);
      // keep the threshold meaningful: default to the F1-optimal cut on a reseed
      setThreshold(Math.max(rangeRef.current.min, Math.min(rangeRef.current.max, bestF1Threshold(samples))));
    },
    [setThreshold]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w: W, h: H } = sizeRef.current;
    const samples = samplesRef.current;
    const thr = thresholdRef.current;
    const { min: sMin, max: sMax } = rangeRef.current;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
    ctx.font = "11px monospace";
    ctx.textBaseline = "alphabetic";

    const leftW = Math.floor(W * 0.46);
    // divider
    ctx.strokeStyle = "rgba(0,255,65,0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leftW + 0.5, 0);
    ctx.lineTo(leftW + 0.5, H);
    ctx.moveTo(leftW, Math.floor(H / 2) + 0.5);
    ctx.lineTo(W, Math.floor(H / 2) + 0.5);
    ctx.stroke();

    const cur = confusionAt(samples, thr);
    const curFpr = fallout(cur);
    const curTpr = recall(cur);
    const curPrec = precision(cur);

    // ── Left top: score distributions ──────────────────────────────────────
    const padL = 42;
    const padR = 16;
    const distTop = 28;
    const distBot = Math.floor(H * 0.52);
    const plotX0 = padL;
    const plotX1 = leftW - padR;
    const sx = (v: number) => plotX0 + ((v - sMin) / (sMax - sMin || 1)) * (plotX1 - plotX0);
    geomRef.current = { distX0: plotX0, distX1: plotX1, distTop, distBot };

    const BINS = 40;
    const neg = new Array(BINS).fill(0);
    const pos = new Array(BINS).fill(0);
    for (const s of samples) {
      let b = Math.floor(((s.score - sMin) / (sMax - sMin || 1)) * BINS);
      b = Math.max(0, Math.min(BINS - 1, b));
      (s.label === 1 ? pos : neg)[b]++;
    }
    const maxBin = Math.max(1, ...neg, ...pos);
    const bw = (plotX1 - plotX0) / BINS;
    const barH = (c: number) => (c / maxBin) * (distBot - distTop - 10);

    // shade predicted-positive region (right of threshold)
    const tx = Math.max(plotX0, Math.min(plotX1, sx(thr)));
    ctx.fillStyle = "rgba(0,255,65,0.05)";
    ctx.fillRect(tx, distTop, plotX1 - tx, distBot - distTop);

    for (let b = 0; b < BINS; b++) {
      const x = plotX0 + b * bw;
      if (neg[b] > 0) {
        ctx.fillStyle = NEG + "99";
        const hh = barH(neg[b]);
        ctx.fillRect(x, distBot - hh, bw - 0.6, hh);
      }
      if (pos[b] > 0) {
        ctx.fillStyle = POS + "99";
        const hh = barH(pos[b]);
        ctx.fillRect(x, distBot - hh, bw - 0.6, hh);
      }
    }
    // baseline + threshold line
    ctx.strokeStyle = "rgba(0,255,65,0.2)";
    ctx.beginPath();
    ctx.moveTo(plotX0, distBot + 0.5);
    ctx.lineTo(plotX1, distBot + 0.5);
    ctx.stroke();
    ctx.strokeStyle = THRESH;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(tx, distTop - 6);
    ctx.lineTo(tx, distBot);
    ctx.stroke();
    ctx.fillStyle = THRESH;
    ctx.fillText("thr", tx - 9, distTop - 9);

    ctx.fillStyle = NEG;
    ctx.fillText("● negatives", plotX0, distTop - 10);
    ctx.fillStyle = POS;
    ctx.fillText("● positives", plotX0 + 86, distTop - 10);
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillText("score →  (predict positive ≥ thr)", plotX0, distBot + 16);

    // ── Left bottom: confusion matrix + metrics ─────────────────────────────
    const cmTop = distBot + 34;
    const cell = Math.min(52, Math.floor((leftW - padL - padR - 60) / 2));
    const cmX = padL + 52;
    const cmY = cmTop + 14;
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fillText("predicted", cmX + cell - 14, cmTop - 2);
    ctx.save();
    ctx.translate(padL + 6, cmY + cell);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("actual", 8, 0);
    ctx.restore();
    const cells: { r: number; c: number; label: string; val: number; color: string }[] = [
      { r: 0, c: 0, label: "TP", val: cur.tp, color: CURVE },
      { r: 0, c: 1, label: "FN", val: cur.fn, color: "#ff6b35" },
      { r: 1, c: 0, label: "FP", val: cur.fp, color: "#ff6b35" },
      { r: 1, c: 1, label: "TN", val: cur.tn, color: NEG },
    ];
    ctx.textAlign = "center";
    for (const cc of cells) {
      const x = cmX + cc.c * cell;
      const y = cmY + cc.r * cell;
      ctx.strokeStyle = "rgba(0,255,65,0.2)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, cell, cell);
      ctx.fillStyle = cc.color + "22";
      ctx.fillRect(x + 1, y + 1, cell - 1, cell - 1);
      ctx.fillStyle = cc.color;
      ctx.fillText(cc.label, x + cell / 2, y + 18);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fillText(String(cc.val), x + cell / 2, y + cell - 12);
    }
    ctx.textAlign = "left";
    const mX = cmX + cell * 2 + 24;
    const metrics: [string, number][] = [
      ["precision", curPrec],
      ["recall (TPR)", curTpr],
      ["FPR", curFpr],
      ["F1", f1(cur)],
      ["accuracy", accuracy(cur)],
    ];
    metrics.forEach(([k, v], i) => {
      const y = cmY + 6 + i * 18;
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.fillText(k, mX, y);
      ctx.fillStyle = CURVE;
      ctx.fillText(v.toFixed(3), mX + 96, y);
    });

    // ── Right: ROC (top) and PR (bottom) ────────────────────────────────────
    const drawCurvePanel = (
      y0: number,
      y1: number,
      title: string,
      xlab: string,
      ylab: string,
      pts: { px: number; py: number }[],
      refLine: (map: (vx: number, vy: number) => [number, number]) => void,
      point: [number, number]
    ) => {
      const p = 30;
      const gx0 = leftW + p + 14;
      const gx1 = W - 16;
      const gy1 = y1 - p;
      const gy0 = y0 + 26;
      const size = Math.min(gx1 - gx0, gy1 - gy0);
      const bx1 = gx0 + size;
      const by0 = gy1 - size;
      const map = (vx: number, vy: number): [number, number] => [gx0 + vx * size, gy1 - vy * size];

      // frame
      ctx.strokeStyle = "rgba(0,255,65,0.18)";
      ctx.lineWidth = 1;
      ctx.strokeRect(gx0 + 0.5, by0 + 0.5, size, size);
      // reference line
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      refLine(map);
      ctx.setLineDash([]);

      // shade under curve
      if (pts.length > 1) {
        ctx.beginPath();
        ctx.moveTo(pts[0].px, gy1);
        for (const q of pts) ctx.lineTo(q.px, q.py);
        ctx.lineTo(pts[pts.length - 1].px, gy1);
        ctx.closePath();
        ctx.fillStyle = "rgba(0,255,65,0.08)";
        ctx.fill();
        ctx.beginPath();
        pts.forEach((q, i) => (i === 0 ? ctx.moveTo(q.px, q.py) : ctx.lineTo(q.px, q.py)));
        ctx.strokeStyle = CURVE;
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }
      // current operating point
      ctx.fillStyle = THRESH;
      ctx.beginPath();
      ctx.arc(point[0], point[1], 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(0,255,65,0.65)";
      ctx.fillText(title, gx0, y0 + 16);
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.fillText(xlab, bx1 - ctx.measureText(xlab).width, gy1 + 18);
      ctx.save();
      ctx.translate(gx0 - 16, by0 + 4);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(ylab, -size, 0);
      ctx.restore();
    };

    const half = Math.floor(H / 2);
    // ROC
    {
      const p = 30;
      const gx0 = leftW + p + 14;
      const size = Math.min(W - 16 - gx0, half - p - (0 + 26));
      const gy1 = half - p;
      const map = (vx: number, vy: number): [number, number] => [gx0 + vx * size, gy1 - vy * size];
      const pts = rocRef.current.map((r) => ({ px: map(r.fpr, r.tpr)[0], py: map(r.fpr, r.tpr)[1] }));
      drawCurvePanel(
        0,
        half,
        `ROC · AUC ${aucv.toFixed(3)}`,
        "FPR",
        "TPR",
        pts,
        (m) => {
          ctx.beginPath();
          const a = m(0, 0);
          const b = m(1, 1);
          ctx.moveTo(a[0], a[1]);
          ctx.lineTo(b[0], b[1]);
          ctx.stroke();
        },
        map(curFpr, curTpr)
      );
    }
    // PR
    {
      const p = 30;
      const gx0 = leftW + p + 14;
      const size = Math.min(W - 16 - gx0, H - p - (half + 26));
      const gy1 = H - p;
      const map = (vx: number, vy: number): [number, number] => [gx0 + vx * size, gy1 - vy * size];
      const pts = prRef.current.map((r) => ({ px: map(r.recall, r.precision)[0], py: map(r.recall, r.precision)[1] }));
      const base = samples.length ? samples.reduce((n, s) => n + s.label, 0) / samples.length : 0;
      drawCurvePanel(
        half,
        H,
        `PR · AP ${apv.toFixed(3)}`,
        "recall",
        "precision",
        pts,
        (m) => {
          ctx.beginPath();
          const a = m(0, base);
          const b = m(1, base);
          ctx.moveTo(a[0], a[1]);
          ctx.lineTo(b[0], b[1]);
          ctx.stroke();
        },
        map(curTpr, curPrec)
      );
    }
  }, [aucv, apv]);

  // init + resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      const { width, height } = fitCanvas(canvas, rect.width, rect.height);
      sizeRef.current = { w: width, h: height };
      draw();
    };
    if (samplesRef.current.length === 0) resample(separation, prevalence, false);
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draw, resample]);

  useEffect(() => {
    draw();
  }, [draw, threshold]);

  const handleCanvasPointer = (e: React.PointerEvent) => {
    if (e.buttons === 0 && e.type === "pointermove") return;
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const g = geomRef.current;
    if (x < g.distX0 - 10 || x > g.distX1 + 10 || y < g.distTop - 10 || y > g.distBot + 10) return;
    const { min, max } = rangeRef.current;
    const v = min + ((x - g.distX0) / (g.distX1 - g.distX0 || 1)) * (max - min);
    setThreshold(Math.max(min, Math.min(max, v)));
  };

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/lab" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← lab
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">ROC &amp; PR explorer</span>
        </div>
        <div className="text-xs text-primary/50 tabular-nums flex gap-4">
          <span>AUC {aucv.toFixed(3)}</span>
          <span>AP {apv.toFixed(3)}</span>
        </div>
      </div>

      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-x-5 gap-y-2">
        <Slider
          label="separation"
          title="distance between the class means, in σ"
          min={0}
          max={4}
          step={0.1}
          value={separation}
          fmt={(v) => `${v.toFixed(1)}σ`}
          onChange={(v) => {
            setSeparation(v);
            resample(v, prevalence, false);
            draw();
          }}
        />
        <Slider
          label="prevalence"
          title="fraction of samples that are positive"
          min={0.1}
          max={0.9}
          step={0.05}
          value={prevalence}
          fmt={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => {
            setPrevalence(v);
            resample(separation, v, false);
            draw();
          }}
        />
        <Slider
          label="threshold"
          title="classify positive at or above this score"
          min={range.min}
          max={range.max}
          step={0.02}
          value={threshold}
          fmt={(v) => v.toFixed(2)}
          onChange={(v) => {
            setThreshold(v);
            draw();
          }}
        />
        <button
          onClick={() => {
            resample(separation, prevalence, true);
            draw();
          }}
          className="ml-auto px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ⚄ resample
        </button>
      </div>

      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="ROC and precision–recall curves with a draggable decision threshold sweeping across overlapping positive and negative score distributions."
          className="block w-full h-full cursor-crosshair"
          onPointerDown={handleCanvasPointer}
          onPointerMove={handleCanvasPointer}
        />
        <div className="absolute bottom-3 left-4 text-xs text-primary/30 pointer-events-none max-w-[42%]">
          drag on the distribution to move the threshold · AUC is threshold-free; the dot is where you are now
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
        className="w-24 accent-primary"
      />
      <span className="text-primary/60 text-xs w-10 tabular-nums">{fmt(value)}</span>
    </div>
  );
}
