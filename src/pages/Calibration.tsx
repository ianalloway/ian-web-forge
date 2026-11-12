import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fitCanvas } from "../lib/canvas";
import {
  Sample,
  accuracy,
  brier,
  ece,
  fitTemperature,
  logLoss,
  makeDataset,
  makeRng,
  mce,
  reliability,
  sigmoid,
} from "../features/calibration/calibration";

const N = 1500;
const SPREAD = 1.6;
const BINS = 12;
const POS = "#00ff41";
const NEG = "#00cfff";
const GAP = "#ffe066";

export default function Calibration() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const [seed, setSeed] = useState(1);
  const [samples, setSamples] = useState<Sample[]>(() => makeDataset(N, SPREAD, makeRng(1)));
  const [confidence, setConfidence] = useState(1.8);
  const [bias, setBias] = useState(0);
  const [calibrated, setCalibrated] = useState(false);

  const model = useMemo(() => {
    const ys = samples.map((s) => s.y);
    const logits = samples.map((s) => confidence * s.z + bias);
    const T = calibrated ? fitTemperature(logits, ys) : 1;
    const preds = logits.map((l) => sigmoid(l / T));
    const bins = reliability(preds, ys, BINS);
    return {
      preds,
      ys,
      bins,
      T,
      ece: ece(bins, samples.length),
      mce: mce(bins),
      brier: brier(preds, ys),
      logloss: logLoss(preds, ys),
      acc: accuracy(preds, ys),
    };
  }, [samples, confidence, bias, calibrated]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w: W, h: H } = sizeRef.current;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
    ctx.font = "11px monospace";

    const leftW = Math.floor(W * 0.52);

    // ── Reliability diagram (left square) ───────────────────────────────────
    const pad = 38;
    const size = Math.min(leftW - pad - 16, H - pad - 34);
    const gx0 = pad;
    const gy1 = pad + size;
    const mx = (v: number) => gx0 + v * size;
    const my = (v: number) => gy1 - v * size;

    ctx.strokeStyle = "rgba(0,255,65,0.18)";
    ctx.lineWidth = 1;
    ctx.strokeRect(gx0 + 0.5, pad + 0.5, size, size);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath();
    ctx.moveTo(mx(0), my(0));
    ctx.lineTo(mx(1), my(1));
    ctx.stroke();
    ctx.setLineDash([]);

    const pts = model.bins.filter((b) => b.count > 0);
    // gap bars to the diagonal
    for (const b of pts) {
      ctx.strokeStyle = GAP + "99";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(mx(b.meanPred), my(b.obsFreq));
      ctx.lineTo(mx(b.meanPred), my(b.meanPred));
      ctx.stroke();
    }
    // calibration curve
    ctx.strokeStyle = POS;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    pts.forEach((b, i) => (i === 0 ? ctx.moveTo(mx(b.meanPred), my(b.obsFreq)) : ctx.lineTo(mx(b.meanPred), my(b.obsFreq))));
    ctx.stroke();
    const maxCount = Math.max(1, ...pts.map((b) => b.count));
    for (const b of pts) {
      ctx.fillStyle = POS;
      ctx.beginPath();
      ctx.arc(mx(b.meanPred), my(b.obsFreq), 2.5 + 4 * Math.sqrt(b.count / maxCount), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(0,255,65,0.6)";
    ctx.fillText("reliability — on the diagonal = calibrated", gx0, pad - 10);
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillText("predicted →", mx(1) - 70, gy1 + 18);
    ctx.save();
    ctx.translate(gx0 - 16, my(0));
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("observed →", 0, 0);
    ctx.restore();
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fillText("over-confident below · under-confident above", gx0, gy1 + 32);

    // ── Confidence histogram (right top) ────────────────────────────────────
    const rx0 = leftW + 20;
    const rx1 = W - 18;
    const hTop = 34;
    const hBot = Math.floor(H * 0.46);
    ctx.fillStyle = "rgba(0,255,65,0.55)";
    ctx.fillText("confidence histogram", rx0, hTop - 8);
    const bw = (rx1 - rx0) / BINS;
    const hMax = Math.max(1, ...model.bins.map((b) => b.count));
    ctx.strokeStyle = "rgba(0,255,65,0.15)";
    ctx.beginPath();
    ctx.moveTo(rx0, hBot + 0.5);
    ctx.lineTo(rx1, hBot + 0.5);
    ctx.stroke();
    model.bins.forEach((b, i) => {
      const x = rx0 + i * bw;
      const hh = (b.count / hMax) * (hBot - hTop);
      const posH = b.count ? (b.pos / b.count) * hh : 0;
      ctx.fillStyle = NEG + "66";
      ctx.fillRect(x, hBot - hh, bw - 1, hh - posH);
      ctx.fillStyle = POS + "cc";
      ctx.fillRect(x, hBot - posH, bw - 1, posH);
    });
    ctx.fillStyle = POS;
    ctx.fillText("● positive", rx0, hBot + 18);
    ctx.fillStyle = NEG;
    ctx.fillText("● negative", rx0 + 76, hBot + 18);

    // ── Metrics (right bottom) ──────────────────────────────────────────────
    const metrics: [string, string][] = [
      ["ECE (calibration error)", model.ece.toFixed(3)],
      ["MCE (worst bin)", model.mce.toFixed(3)],
      ["Brier score", model.brier.toFixed(3)],
      ["log loss", model.logloss.toFixed(3)],
      ["accuracy", (model.acc * 100).toFixed(1) + "%"],
    ];
    const my0 = hBot + 48;
    metrics.forEach(([k, v], i) => {
      const y = my0 + i * 22;
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.fillText(k, rx0, y);
      ctx.fillStyle = POS;
      ctx.fillText(v, rx0 + 180, y);
    });
    if (calibrated) {
      ctx.fillStyle = GAP;
      ctx.fillText(`temperature-scaled · T* = ${model.T.toFixed(2)}`, rx0, my0 + metrics.length * 22 + 4);
    }
  }, [model, calibrated]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      const { width, height } = fitCanvas(canvas, rect.width, rect.height);
      sizeRef.current = { w: width, h: height };
      draw();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [draw]);

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/lab" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← lab
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">calibration — reliability diagram</span>
        </div>
        <div className="text-xs text-primary/50 tabular-nums flex gap-4">
          <span>ECE {model.ece.toFixed(3)}</span>
          <span>Brier {model.brier.toFixed(3)}</span>
        </div>
      </div>

      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-x-5 gap-y-2">
        <Slider
          label="confidence"
          title="scales the logits: >1 overconfident, <1 underconfident"
          min={0.3}
          max={3}
          step={0.1}
          value={confidence}
          fmt={(v) => `${v.toFixed(1)}×`}
          onChange={(v) => {
            setConfidence(v);
            setCalibrated(false);
          }}
        />
        <Slider
          label="bias"
          title="shifts every prediction toward one class"
          min={-2}
          max={2}
          step={0.1}
          value={bias}
          fmt={(v) => v.toFixed(1)}
          onChange={(v) => {
            setBias(v);
            setCalibrated(false);
          }}
        />
        <button
          onClick={() => setCalibrated((c) => !c)}
          title="fit one temperature T to the logits and divide by it"
          className={`px-3 py-1 text-xs border transition-colors ${
            calibrated
              ? "border-primary bg-primary/15 text-primary"
              : "border-primary/30 text-primary/70 hover:border-primary hover:text-primary"
          }`}
        >
          ⚖ temperature-scale
        </button>
        <button
          onClick={() => {
            const ns = seed + 1;
            setSeed(ns);
            setSamples(makeDataset(N, SPREAD, makeRng(ns * 2654435761)));
            setCalibrated(false);
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
          aria-label="Reliability diagram and confidence histogram showing how well predicted probabilities match observed frequencies, with optional temperature scaling."
          className="block w-full h-full"
        />
        <div className="absolute bottom-2 right-4 text-xs text-primary/30 pointer-events-none max-w-sm text-right">
          make the model over- or under-confident, then temperature-scale it back onto the diagonal
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
      <span className="text-primary/60 text-xs w-9 tabular-nums">{fmt(value)}</span>
    </div>
  );
}
