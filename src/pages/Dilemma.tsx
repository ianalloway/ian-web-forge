import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  STRATEGIES,
  Tournament,
  evolve,
  populationPayoff,
  runTournament,
  uniformShares,
} from "../features/dilemma/tournament";

const COLORS = [
  "#00ff41", // tit for tat
  "#9bff6a", // tit for two tats
  "#00cfff", // generous tft
  "#b08cff", // grudger
  "#ffd166", // pavlov
  "#5fe8c0", // always cooperate
  "#ff8a3d", // prober
  "#ff5d8f", // suspicious tft
  "#8892a6", // random
  "#ff3b3b", // always defect
];

const FRAMES_PER_GEN = 4;
const MAX_GENS = 600;

export default function Dilemma() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rounds, setRounds] = useState(120);
  const [noise, setNoise] = useState(0);
  const [seed, setSeed] = useState(1337);
  const [running, setRunning] = useState(true);
  const [generation, setGeneration] = useState(0);
  const [shares, setShares] = useState<number[]>(() => uniformShares(STRATEGIES.length));

  const tournament: Tournament = useMemo(
    () => runTournament(STRATEGIES, rounds, noise, seed),
    [rounds, noise, seed]
  );

  const sharesRef = useRef(shares);
  const historyRef = useRef<number[][]>([uniformShares(STRATEGIES.length)]);
  const runningRef = useRef(running);
  const matrixRef = useRef(tournament.matrix);

  const resetPopulation = useCallback(() => {
    const start = uniformShares(STRATEGIES.length);
    sharesRef.current = start;
    historyRef.current = [start];
    setShares(start);
    setGeneration(0);
  }, []);

  useEffect(() => {
    matrixRef.current = tournament.matrix;
  }, [tournament]);

  // A different tournament is a different world, so every control that changes
  // one also restarts the population inside it.
  const retune = useCallback(
    (apply: () => void) => {
      apply();
      resetPopulation();
    },
    [resetPopulation]
  );

  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: W, height: H } = canvas;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    const padL = 34;
    const padR = 10;
    const padT = 10;
    const padB = 20;
    const plotW = Math.max(10, W - padL - padR);
    const plotH = Math.max(10, H - padT - padB);
    const history = historyRef.current;

    ctx.strokeStyle = "rgba(0,255,65,0.12)";
    ctx.lineWidth = 1;
    ctx.font = "9px monospace";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let i = 0; i <= 4; i++) {
      const y = padT + (i / 4) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();
      ctx.fillStyle = "rgba(0,255,65,0.35)";
      ctx.fillText(`${100 - i * 25}%`, padL - 6, y);
    }

    const n = Math.max(2, history.length);
    const px = (i: number) => padL + (i / (n - 1)) * plotW;

    // Stacked area: the whole column is the population, each band a strategy.
    const cumulative = new Array(history.length).fill(0);
    for (let s = 0; s < STRATEGIES.length; s++) {
      ctx.beginPath();
      // upper edge, left to right
      for (let i = 0; i < history.length; i++) {
        const top = cumulative[i] + history[i][s];
        const y = padT + (1 - top) * plotH;
        if (i === 0) ctx.moveTo(px(i), y);
        else ctx.lineTo(px(i), y);
      }
      // lower edge, back again
      for (let i = history.length - 1; i >= 0; i--) {
        const y = padT + (1 - cumulative[i]) * plotH;
        ctx.lineTo(px(i), y);
      }
      ctx.closePath();
      ctx.fillStyle = COLORS[s];
      ctx.globalAlpha = 0.82;
      ctx.fill();
      ctx.globalAlpha = 1;
      for (let i = 0; i < history.length; i++) cumulative[i] += history[i][s];
    }

    // Label every band still holding a meaningful slice at the right edge.
    const latest = history[history.length - 1];
    let acc = 0;
    ctx.textAlign = "left";
    ctx.font = "10px monospace";
    for (let s = 0; s < STRATEGIES.length; s++) {
      const share = latest[s];
      const mid = acc + share / 2;
      acc += share;
      if (share < 0.07) continue;
      const y = padT + (1 - mid) * plotH;
      ctx.fillStyle = "rgba(0,0,0,0.65)";
      const text = STRATEGIES[s].label;
      const w = ctx.measureText(text).width;
      ctx.fillRect(padL + plotW - w - 12, y - 7, w + 8, 14);
      ctx.fillStyle = COLORS[s];
      ctx.fillText(text, padL + plotW - w - 8, y);
    }

    ctx.strokeStyle = "rgba(0,255,65,0.2)";
    ctx.strokeRect(padL + 0.5, padT + 0.5, plotW - 1, plotH - 1);
    ctx.fillStyle = "rgba(0,255,65,0.35)";
    ctx.font = "9px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`generation → ${history.length - 1}`, padL + 4, padT + plotH + 5);
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
      if (runningRef.current && ++frame % FRAMES_PER_GEN === 0) {
        const history = historyRef.current;
        if (history.length < MAX_GENS) {
          const next = evolve(sharesRef.current, matrixRef.current);
          sharesRef.current = next;
          history.push(next);
          setShares(next);
          setGeneration(history.length - 1);
        }
      }
      draw();
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [draw]);

  const welfare = populationPayoff(shares, tournament.matrix);
  const survivors = shares.filter((s) => s > 0).length;
  const cooperating = shares.reduce(
    (sum, share, i) => sum + share * (STRATEGIES[i].nice ? 1 : 0),
    0
  );

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">prisoner&apos;s dilemma</span>
        </div>
        <div className="text-xs text-primary/50 tabular-nums flex gap-3 flex-wrap">
          <span>gen {generation}</span>
          <span>{survivors} alive</span>
          <span>nice {Math.round(cooperating * 100)}%</span>
          <span className="text-[#00cfff]">welfare {welfare.toFixed(2)}/round</span>
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          onClick={() => setRunning((r) => !r)}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          {running ? "⏸ pause" : "▶ evolve"}
        </button>
        <button
          onClick={resetPopulation}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ↺ reset population
        </button>
        <button
          onClick={() => retune(() => setSeed((s) => (s * 16807 + 11) % 2147483647))}
          title="replay the whole tournament with different coin flips"
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ⟳ reseed
        </button>

        <Slider
          label="rounds"
          title="rounds per match — the shadow of the future"
          min={1}
          max={300}
          step={1}
          value={rounds}
          fmt={(v) => `${v}`}
          onChange={(v) => retune(() => setRounds(v))}
        />
        <Slider
          label="noise"
          title="chance a move comes out as its opposite — a trembling hand"
          min={0}
          max={0.25}
          step={0.01}
          value={noise}
          fmt={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => retune(() => setNoise(v))}
        />
      </div>

      {/* Evolution + leaderboard */}
      <div className="grid lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="relative h-[300px] md:h-[400px] border-b lg:border-b-0 lg:border-r border-primary/10">
          <canvas ref={canvasRef} className="block w-full h-full" />
          <div className="absolute bottom-1 left-10 right-3 text-[10px] text-primary/40 pointer-events-none">
            each band is a strategy&apos;s share of the population, reproducing in proportion to what
            it scores against everyone else
          </div>
        </div>

        <aside className="p-3 text-xs">
          <div className="text-primary/40 mb-2">
            round-robin standings — mean points per round, {rounds} rounds a match
          </div>
          <ol className="space-y-1">
            {tournament.order.map((i, rank) => (
              <li key={STRATEGIES[i].id} title={STRATEGIES[i].note} className="flex items-center gap-2">
                <span className="text-primary/30 w-4 tabular-nums">{rank + 1}</span>
                <span className="w-2 h-2 shrink-0" style={{ background: COLORS[i] }} />
                <span className="flex-1 truncate" style={{ color: shares[i] > 0 ? undefined : "rgba(120,160,130,0.45)" }}>
                  {STRATEGIES[i].label}
                  {STRATEGIES[i].nice && <span className="text-primary/30"> ·nice</span>}
                </span>
                <span className="tabular-nums text-primary/60 w-10 text-right">
                  {tournament.totals[i].toFixed(2)}
                </span>
                <span className="w-16 h-2 bg-primary/10 relative shrink-0" title="share of the population">
                  <span
                    className="absolute left-0 top-0 h-full"
                    style={{ width: `${Math.max(0, shares[i]) * 100}%`, background: COLORS[i] }}
                  />
                </span>
              </li>
            ))}
          </ol>
          <p className="text-primary/35 mt-3 leading-relaxed">
            Defection wins any single round and loses the long game: the strategies that finish on top
            are the ones that never betray first but always answer betrayal. Push noise up and the
            unforgiving ones tear themselves apart on misunderstandings.
          </p>
        </aside>
      </div>

      {/* Payoff matrix */}
      <div className="border-t border-primary/10 p-3 overflow-x-auto">
        <div className="text-primary/40 text-xs mb-2">
          head to head — row&apos;s mean points per round against column (green = doing well, red =
          being taken)
        </div>
        <table className="text-[10px] tabular-nums border-collapse">
          <thead>
            <tr>
              <th className="text-left font-normal text-primary/40 pr-2">row vs col</th>
              {STRATEGIES.map((s, j) => (
                <th
                  key={s.id}
                  title={s.label}
                  className="font-normal text-primary/40 px-1 whitespace-nowrap"
                  style={{ color: COLORS[j] }}
                >
                  {abbreviate(s.label)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {STRATEGIES.map((s, i) => (
              <tr key={s.id}>
                <td className="pr-2 whitespace-nowrap" style={{ color: COLORS[i] }}>
                  {s.label}
                </td>
                {STRATEGIES.map((o, j) => {
                  const v = tournament.matrix[i][j];
                  return (
                    <td
                      key={o.id}
                      title={`${s.label} vs ${o.label}: ${v.toFixed(2)} per round, cooperating ${Math.round(
                        tournament.coop[i][j] * 100
                      )}% of the time`}
                      className="text-center px-1 py-0.5"
                      style={{ background: cellShade(v), color: "rgba(230,255,235,0.85)" }}
                    >
                      {v.toFixed(1)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Mutual cooperation pays 3; anything below that is being exploited or stuck in
// mutual punishment, so 3 is the hinge between the green and red shades.
function cellShade(v: number): string {
  if (v >= 3) return `rgba(0,255,65,${0.08 + 0.32 * Math.min(1, (v - 3) / 2)})`;
  return `rgba(255,70,70,${0.06 + 0.34 * Math.min(1, (3 - v) / 3)})`;
}

function abbreviate(label: string): string {
  return label
    .split(" ")
    .map((w) => w.slice(0, 3))
    .join("·");
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
      <span className="text-primary/60 text-xs w-8 tabular-nums">{fmt(value)}</span>
    </div>
  );
}
