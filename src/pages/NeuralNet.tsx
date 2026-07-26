import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { DatasetKind, MLP, Sample, makeDataset } from "../features/neuralnet/net";

const DOMAIN = 1.15; // plot spans [-DOMAIN, DOMAIN]
const RW = 84; // boundary heatmap resolution
const RH = 60;
const BATCH = 32;

const DATASETS: { kind: DatasetKind; label: string }[] = [
  { kind: "blobs", label: "blobs" },
  { kind: "circles", label: "circles" },
  { kind: "xor", label: "xor" },
  { kind: "spiral", label: "spiral" },
];

export default function NeuralNet() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<ImageData | null>(null);
  const netRef = useRef<MLP | null>(null);
  const dataRef = useRef<Sample[]>([]);
  const datasetRef = useRef<DatasetKind>("blobs");
  const lrRef = useRef(0.5);
  const epochsPerFrameRef = useRef(3);
  const runningRef = useRef(true);
  const epochRef = useRef(0);

  const [dataset, setDataset] = useState<DatasetKind>("blobs");
  const [lr, setLr] = useState(0.5);
  const [running, setRunning] = useState(true);
  const [epoch, setEpoch] = useState(0);
  const [loss, setLoss] = useState(0);
  const [acc, setAcc] = useState(0);

  // Ref-only (re)initialization — safe to call synchronously inside the effect.
  const initModel = useCallback(() => {
    dataRef.current = makeDataset(datasetRef.current, 420);
    netRef.current = new MLP([2, 8, 8, 1]);
    epochRef.current = 0;
  }, []);

  const rebuild = useCallback(() => {
    initModel();
    setEpoch(0);
    setLoss(0);
    setAcc(0);
  }, [initModel]);

  const trainOneEpoch = useCallback((): number => {
    const net = netRef.current!;
    const data = dataRef.current;
    // Fisher-Yates shuffle for stochastic batches.
    for (let i = data.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [data[i], data[j]] = [data[j], data[i]];
    }
    let total = 0;
    let nb = 0;
    for (let i = 0; i < data.length; i += BATCH) {
      total += net.trainBatch(data.slice(i, i + BATCH), lrRef.current);
      nb++;
    }
    epochRef.current++;
    return total / nb;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;

    const off = document.createElement("canvas");
    off.width = RW;
    off.height = RH;
    offRef.current = off;
    const offCtx = off.getContext("2d");
    if (!offCtx) return;
    imgRef.current = offCtx.createImageData(RW, RH);

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resize();
    window.addEventListener("resize", resize);
    initModel();

    let raf = 0;
    let frame = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const net = netRef.current;
      const img = imgRef.current;
      if (!net || !img) return;

      if (runningRef.current) {
        let last = 0;
        for (let k = 0; k < epochsPerFrameRef.current; k++) last = trainOneEpoch();
        setLoss(last);
        setEpoch(epochRef.current);
      }

      // Decision-boundary heatmap.
      const data = img.data;
      for (let py = 0; py < RH; py++) {
        const wy = DOMAIN - (py / (RH - 1)) * 2 * DOMAIN;
        for (let px = 0; px < RW; px++) {
          const wx = -DOMAIN + (px / (RW - 1)) * 2 * DOMAIN;
          const p = net.predict(wx, wy);
          const o = (py * RW + px) * 4;
          data[o] = Math.round(150 * (1 - p));
          data[o + 1] = Math.round(55 + 165 * p);
          data[o + 2] = Math.round(70 * (1 - p) + 30 * p);
          data[o + 3] = 255;
        }
      }
      offCtx.putImageData(img, 0, 0);
      const W = canvas.width;
      const H = canvas.height;
      ctx.drawImage(off, 0, 0, RW, RH, 0, 0, W, H);

      // Data points.
      const sx = (x: number) => ((x + DOMAIN) / (2 * DOMAIN)) * W;
      const sy = (y: number) => ((DOMAIN - y) / (2 * DOMAIN)) * H;
      for (const s of dataRef.current) {
        ctx.beginPath();
        ctx.arc(sx(s.x), sy(s.y), 3, 0, Math.PI * 2);
        ctx.fillStyle = s.label === 1 ? "#c9ffd6" : "#3a1030";
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = s.label === 1 ? "#0a3b17" : "#ff5aa0";
        ctx.stroke();
      }

      if ((frame++ & 15) === 0 && netRef.current) setAcc(netRef.current.accuracy(dataRef.current));
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [initModel, trainOneEpoch]);

  const chooseDataset = (kind: DatasetKind) => {
    setDataset(kind);
    datasetRef.current = kind;
    rebuild();
  };

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">neural net — decision boundary</span>
        </div>
        <div className="text-xs text-primary/40 tabular-nums">
          epoch {epoch} · loss {loss.toFixed(3)} · acc {(acc * 100).toFixed(1)}%
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-primary/40 text-xs mr-1">data</span>
          {DATASETS.map((d) => (
            <button
              key={d.kind}
              onClick={() => chooseDataset(d.kind)}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                dataset === d.kind
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/20 text-primary/50 hover:border-primary/50"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">learn rate</span>
          <input
            type="range"
            min={0.05}
            max={1.5}
            step={0.05}
            value={lr}
            onChange={(e) => {
              const v = Number(e.target.value);
              setLr(v);
              lrRef.current = v;
            }}
            className="w-24 accent-primary"
          />
          <span className="text-primary/60 text-xs w-8 tabular-nums">{lr.toFixed(2)}</span>
        </div>

        <div className="flex gap-2 ml-auto">
          <span className="text-primary/30 text-xs self-center hidden md:inline">net 2·8·8·1</span>
          <button
            onClick={() => {
              runningRef.current = !running;
              setRunning(!running);
            }}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            {running ? "⏸ pause" : "▶ train"}
          </button>
          <button
            onClick={() => rebuild()}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ↺ reset
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute bottom-3 left-4 text-xs text-primary/40 pointer-events-none max-w-xl">
          a 2·8·8·1 network learns by backpropagation. the background is what it predicts everywhere;
          watch the boundary bend to fit the dots as gradient descent lowers the loss.
        </div>
      </div>
    </div>
  );
}
