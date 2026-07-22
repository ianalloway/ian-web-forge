import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Agent,
  Counts,
  SirParams,
  DEFAULT_SIR,
  S, I,
  makePopulation,
  stepSir,
} from "../features/epidemic/sir";

const POP = 260;
const CHART_H = 90;

const COLORS = { s: "#00cfff", i: "#ff4da6", r: "#00ff41" };

export default function Epidemic() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const agentsRef = useRef<Agent[]>([]);
  const paramsRef = useRef<SirParams>({ ...DEFAULT_SIR });
  const historyRef = useRef<Counts[]>([]);
  const tickRef = useRef(0);
  const overRef = useRef(false);

  const [transmission, setTransmission] = useState(DEFAULT_SIR.transmission);
  const [distancing, setDistancing] = useState(0);
  const [counts, setCounts] = useState<Counts>({ s: POP - 3, i: 3, r: 0 });
  const [over, setOver] = useState(false);
  const [peakI, setPeakI] = useState(3);

  const restart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const arenaH = canvas.height - CHART_H;
    agentsRef.current = makePopulation(
      POP,
      canvas.width,
      arenaH,
      paramsRef.current.distancing
    );
    historyRef.current = [];
    tickRef.current = 0;
    overRef.current = false;
    setOver(false);
    setPeakI(3);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      restart();
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const { width: W, height: H } = canvas;
      const arenaH = H - CHART_H;

      if (!overRef.current) {
        tickRef.current++;
        const c = stepSir(agentsRef.current, W, arenaH, paramsRef.current, tickRef.current);
        if (tickRef.current % 4 === 0) {
          historyRef.current.push(c);
          if (historyRef.current.length > 2000) historyRef.current.shift();
        }
        if (tickRef.current % 10 === 0) {
          setCounts(c);
          setPeakI((prev) => Math.max(prev, c.i));
        }
        if (c.i === 0 && tickRef.current > 10) {
          overRef.current = true;
          setOver(true);
          setCounts(c);
        }
      }

      // Arena
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      for (const a of agentsRef.current) {
        ctx.fillStyle = a.state === S ? COLORS.s : a.state === I ? COLORS.i : COLORS.r;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.state === I ? 3.5 : 2.5, 0, Math.PI * 2);
        ctx.fill();
        if (!a.mobile) {
          ctx.strokeStyle = "rgba(255,255,255,0.25)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(a.x, a.y, 5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Divider
      ctx.strokeStyle = "rgba(0,255,65,0.2)";
      ctx.beginPath();
      ctx.moveTo(0, arenaH + 0.5);
      ctx.lineTo(W, arenaH + 0.5);
      ctx.stroke();

      // Stacked area chart of history
      const hist = historyRef.current;
      if (hist.length > 1) {
        const px = (idx: number) => (idx / Math.max(1, hist.length - 1)) * W;
        // draw stacked: I at bottom, then S, then R on top? Classic is stacked S/I/R.
        for (let x = 0; x < hist.length - 1; x++) {
          const c = hist[x];
          const total = c.s + c.i + c.r;
          const x0 = px(x);
          const x1 = px(x + 1);
          const wSlice = Math.max(1, x1 - x0);
          const hI = (c.i / total) * CHART_H;
          const hS = (c.s / total) * CHART_H;
          // infected at the bottom of the chart band
          ctx.fillStyle = COLORS.i;
          ctx.fillRect(x0, H - hI, wSlice, hI);
          ctx.fillStyle = "rgba(0,207,255,0.35)";
          ctx.fillRect(x0, H - hI - hS, wSlice, hS);
          ctx.fillStyle = "rgba(0,255,65,0.35)";
          ctx.fillRect(x0, arenaH, wSlice, CHART_H - hI - hS);
        }
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [restart]);

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">epidemic (SIR)</span>
        </div>
        <div className="text-xs tabular-nums flex gap-3">
          <span style={{ color: COLORS.s }}>S {counts.s}</span>
          <span style={{ color: COLORS.i }}>I {counts.i}</span>
          <span style={{ color: COLORS.r }}>R {counts.r}</span>
          {over && <span className="text-primary/60">· outbreak over — {counts.s} never infected</span>}
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">transmission</span>
          <input
            type="range"
            min={0.01}
            max={0.2}
            step={0.01}
            value={transmission}
            onChange={(e) => {
              const v = Number(e.target.value);
              setTransmission(v);
              paramsRef.current = { ...paramsRef.current, transmission: v };
            }}
            className="w-28 accent-primary"
          />
          <span className="text-primary/60 text-xs w-8">{transmission.toFixed(2)}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">distancing</span>
          <input
            type="range"
            min={0}
            max={0.9}
            step={0.1}
            value={distancing}
            onChange={(e) => {
              const v = Number(e.target.value);
              setDistancing(v);
              paramsRef.current = { ...paramsRef.current, distancing: v };
            }}
            className="w-28 accent-primary"
          />
          <span className="text-primary/60 text-xs w-10">{Math.round(distancing * 100)}%</span>
          <span className="text-primary/30 text-xs hidden md:inline">(applies on restart)</span>
        </div>

        <button
          onClick={restart}
          className="ml-auto px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ⚄ restart outbreak
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute bottom-1 left-4 text-xs text-primary/40 pointer-events-none">
          peak infected {peakI} · white rings = distanced (immobile) · flatten the curve with the distancing slider
        </div>
      </div>
    </div>
  );
}
