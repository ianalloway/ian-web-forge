import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { SimResult, kellyFraction, makeRng, simulate } from "../features/kellysim/kellysim";

const FRACTIONS: { label: string; value: number }[] = [
  { label: "¼ kelly", value: 0.25 },
  { label: "½ kelly", value: 0.5 },
  { label: "full", value: 1 },
  { label: "2× (overbet)", value: 2 },
];

const PATHS = 220;

export default function KellySim() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [winProb, setWinProb] = useState(0.55);
  const [odds, setOdds] = useState(2);
  const [fraction, setFraction] = useState(0.5);
  const [bets, setBets] = useState(300);
  const [seed, setSeed] = useState(1);

  const result: SimResult = useMemo(() => {
    // Deterministic per (inputs, seed) so the chart is stable across repaints.
    return simulate(
      { winProb, decimalOdds: odds, fraction, bets, paths: PATHS, ruinThreshold: 0.25 },
      makeRng(seed)
    );
  }, [winProb, odds, fraction, bets, seed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      const W = canvas.width;
      const H = canvas.height;
      ctx.fillStyle = "#050805";
      ctx.fillRect(0, 0, W, H);

      const { curves, bets: n, paths } = result;
      const stride = n + 1;
      // Log scale: bankroll multiples span many orders of magnitude.
      let lo = Infinity;
      let hi = -Infinity;
      for (let i = 0; i < curves.length; i++) {
        const v = Math.log10(Math.max(curves[i], 1e-6));
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
      if (!isFinite(lo) || !isFinite(hi) || hi - lo < 0.5) {
        lo = -1;
        hi = 1;
      }
      const pad = 26;
      const px = (i: number) => pad + (i / n) * (W - 2 * pad);
      const py = (v: number) => H - pad - ((Math.log10(Math.max(v, 1e-6)) - lo) / (hi - lo)) * (H - 2 * pad);

      // Break-even gridline at 1×.
      ctx.strokeStyle = "rgba(0,255,65,0.22)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pad, py(1));
      ctx.lineTo(W - pad, py(1));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(0,255,65,0.4)";
      ctx.font = "10px monospace";
      ctx.fillText("1× (break even)", pad + 4, py(1) - 4);

      // Individual paths, faint.
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(0,220,80,0.12)";
      for (let p = 0; p < paths; p++) {
        const base = p * stride;
        ctx.beginPath();
        ctx.moveTo(px(0), py(curves[base]));
        for (let i = 1; i <= n; i++) ctx.lineTo(px(i), py(curves[base + i]));
        ctx.stroke();
      }

      // Median path across time.
      const col = new Float64Array(paths);
      ctx.strokeStyle = "#c9ffd6";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        for (let p = 0; p < paths; p++) col[p] = curves[p * stride + i];
        const s = col.slice().sort();
        const med = s[(paths / 2) | 0];
        if (i === 0) ctx.moveTo(px(i), py(med));
        else ctx.lineTo(px(i), py(med));
      }
      ctx.stroke();
    };

    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [result]);

  const kf = kellyFraction(winProb, odds);
  const edge = (winProb * odds - 1) * 100;
  const fmt = (v: number) =>
    v >= 1000 ? v.toExponential(1) : v >= 10 ? v.toFixed(0) : v.toFixed(2);

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">kelly bankroll simulator</span>
        </div>
        <div className="text-xs text-primary/40 tabular-nums">
          f*={(kf * 100).toFixed(1)}% · staking {(result.stake * 100).toFixed(1)}% · edge{" "}
          {edge.toFixed(1)}%
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">win prob</span>
          <input
            type="range"
            min={0.35}
            max={0.75}
            step={0.01}
            value={winProb}
            onChange={(e) => setWinProb(Number(e.target.value))}
            className="w-24 accent-primary"
          />
          <span className="text-primary/60 text-xs w-8 tabular-nums">{(winProb * 100) | 0}%</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">odds</span>
          <input
            type="range"
            min={1.2}
            max={4}
            step={0.1}
            value={odds}
            onChange={(e) => setOdds(Number(e.target.value))}
            className="w-24 accent-primary"
          />
          <span className="text-primary/60 text-xs w-8 tabular-nums">{odds.toFixed(1)}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">bets</span>
          <input
            type="range"
            min={50}
            max={800}
            step={25}
            value={bets}
            onChange={(e) => setBets(Number(e.target.value))}
            className="w-20 accent-primary"
          />
          <span className="text-primary/60 text-xs w-8 tabular-nums">{bets}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {FRACTIONS.map((f) => (
            <button
              key={f.label}
              onClick={() => setFraction(f.value)}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                fraction === f.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/20 text-primary/50 hover:border-primary/50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setSeed((s) => s + 1)}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors ml-auto"
        >
          ⚄ resample
        </button>
      </div>

      {/* Stats */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap gap-x-6 gap-y-1 text-xs tabular-nums">
        <span className="text-primary/40">
          median <span className="text-primary/90">{fmt(result.median)}×</span>
        </span>
        <span className="text-primary/40">
          mean <span className="text-primary/90">{fmt(result.mean)}×</span>
        </span>
        <span className="text-primary/40">
          5th pct <span className="text-primary/90">{fmt(result.p5)}×</span>
        </span>
        <span className="text-primary/40">
          95th pct <span className="text-primary/90">{fmt(result.p95)}×</span>
        </span>
        <span className="text-primary/40">
          below ¼ bankroll{" "}
          <span style={{ color: result.ruinRate > 0.1 ? "#ff6a6a" : undefined }}>
            {(result.ruinRate * 100).toFixed(1)}%
          </span>
        </span>
        <span className="text-primary/40">
          worst drawdown <span className="text-primary/90">{(result.maxDrawdown * 100).toFixed(0)}%</span>
        </span>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute bottom-3 left-4 text-xs text-primary/40 pointer-events-none max-w-xl">
          {PATHS} bankrolls betting the same edge, log scale, bright line = median. full kelly grows
          fastest in theory and still routinely halves your money; overbet it and the median collapses
          even though the mean looks fine.
        </div>
      </div>
    </div>
  );
}
