import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  StrategyId,
  STRATEGIES,
  Agent,
  newAgent,
  pull,
  regret,
  randomRates,
} from "../features/bandit/bandit";

const K = 6; // number of arms
const STRATEGY_KEYS = Object.keys(STRATEGIES) as StrategyId[];
const PULLS_PER_FRAME = 12;
const MAX_PULLS = 4000;

export default function Bandit() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const agentsRef = useRef<Agent[]>(STRATEGY_KEYS.map((s) => newAgent(s, K)));
  const historyRef = useRef<Record<StrategyId, number[]>>(
    Object.fromEntries(STRATEGY_KEYS.map((s) => [s, [0]])) as Record<StrategyId, number[]>
  );
  const runningRef = useRef(true);

  const [running, setRunning] = useState(true);
  const [pulls, setPulls] = useState(0);
  const [rates, setRates] = useState<number[]>(() => randomRates(K));
  const [stats, setStats] = useState<Record<StrategyId, number>>(
    Object.fromEntries(STRATEGY_KEYS.map((s) => [s, 0])) as Record<StrategyId, number>
  );

  // Mirror rates into a ref so the interval reads the latest without re-subscribing
  const ratesRef = useRef<number[]>(rates);
  useEffect(() => { ratesRef.current = rates; }, [rates]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: W, height: H } = canvas;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    // Regret-over-time chart (lower is better)
    const hist = historyRef.current;
    let maxR = 1;
    for (const s of STRATEGY_KEYS) {
      const h = hist[s];
      if (h.length && h[h.length - 1] > maxR) maxR = h[h.length - 1];
    }
    const pad = 34;
    const chartW = W - pad * 2;
    const chartH = H - pad * 2;
    const len = hist[STRATEGY_KEYS[0]].length;
    const px = (i: number) => pad + (len <= 1 ? 0 : (i / (len - 1)) * chartW);
    const py = (v: number) => pad + chartH - (v / maxR) * chartH;

    // Axes
    ctx.strokeStyle = "rgba(0,255,65,0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, pad);
    ctx.lineTo(pad, pad + chartH);
    ctx.lineTo(pad + chartW, pad + chartH);
    ctx.stroke();
    ctx.fillStyle = "rgba(0,255,65,0.4)";
    ctx.font = "10px monospace";
    ctx.fillText("cumulative regret", pad + 4, pad + 12);
    ctx.fillText(Math.round(maxR).toString(), 4, pad + 10);
    ctx.fillText("0", 20, pad + chartH);

    for (const s of STRATEGY_KEYS) {
      const h = hist[s];
      ctx.strokeStyle = STRATEGIES[s].color;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      h.forEach((v, i) => {
        if (i === 0) ctx.moveTo(px(i), py(v));
        else ctx.lineTo(px(i), py(v));
      });
      ctx.stroke();
    }
  }, []);

  const restart = useCallback((newRates: boolean) => {
    if (newRates) setRates(randomRates(K));
    agentsRef.current = STRATEGY_KEYS.map((s) => newAgent(s, K));
    historyRef.current = Object.fromEntries(
      STRATEGY_KEYS.map((s) => [s, [0]])
    ) as Record<StrategyId, number[]>;
    setPulls(0);
    setStats(Object.fromEntries(STRATEGY_KEYS.map((s) => [s, 0])) as Record<StrategyId, number>);
    draw();
  }, [draw]);

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

    const id = setInterval(() => {
      if (!runningRef.current) return;
      const rates = ratesRef.current;
      const agents = agentsRef.current;
      if (agents[0].totalPulls >= MAX_PULLS) return;

      for (let step = 0; step < PULLS_PER_FRAME; step++) {
        for (const agent of agents) pull(agent, rates);
      }
      const hist = historyRef.current;
      const newStats = {} as Record<StrategyId, number>;
      for (const agent of agents) {
        const reg = regret(agent, rates);
        hist[agent.strategy].push(reg);
        if (hist[agent.strategy].length > 800) hist[agent.strategy].shift();
        newStats[agent.strategy] = reg;
      }
      setPulls(agents[0].totalPulls);
      setStats(newStats);
      draw();
    }, 40);

    return () => {
      clearInterval(id);
      window.removeEventListener("resize", resize);
    };
  }, [draw]);

  let best = 0;
  for (let i = 1; i < rates.length; i++) if (rates[i] > rates[best]) best = i;

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">multi-armed bandit</span>
        </div>
        <div className="text-xs text-primary/40 tabular-nums">{pulls.toLocaleString()} pulls / arm-set</div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <div className="flex gap-3 flex-wrap text-xs tabular-nums">
          {STRATEGY_KEYS.map((s) => (
            <span key={s} style={{ color: STRATEGIES[s].color }} title={STRATEGIES[s].note}>
              ● {STRATEGIES[s].label} <span className="text-primary/40">regret {Math.round(stats[s])}</span>
            </span>
          ))}
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => { runningRef.current = !running; setRunning(!running); }}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            {running ? "⏸ pause" : "▶ resume"}
          </button>
          <button
            onClick={() => restart(false)}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ↺ replay
          </button>
          <button
            onClick={() => restart(true)}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ⚄ new arms
          </button>
        </div>
      </div>

      {/* Arm true-rate strip */}
      <div className="border-b border-primary/10 px-4 py-2 flex items-center gap-2 flex-wrap">
        <span className="text-xs text-primary/30 mr-1">true win rates</span>
        {rates.map((r, i) => (
          <span
            key={i}
            className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs border tabular-nums ${
              i === best ? "border-primary text-primary" : "border-primary/20 text-primary/40"
            }`}
          >
            arm {i}: {(r * 100).toFixed(0)}%{i === best && " ★"}
          </span>
        ))}
      </div>

      {/* Chart */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute bottom-3 left-4 text-xs text-primary/30 pointer-events-none max-w-xl">
          lower regret = smarter exploration. greedy locks onto a wrong arm; Thompson and UCB
          keep the flattest curves — the core tradeoff behind A/B testing and ad allocation.
        </div>
      </div>
    </div>
  );
}
