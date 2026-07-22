import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  League,
  Team,
  START_ELO,
  newLeague,
  playRound,
  rankAgreement,
  meanAbsError,
} from "../features/elo/league";

const TEAM_COUNT = 8;
const ROUND_MS = 350;
const MAX_ROUNDS = 200;

export default function Elo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const leagueRef = useRef<League>(newLeague(TEAM_COUNT));
  const runningRef = useRef(true);
  const kRef = useRef(24);

  const [running, setRunning] = useState(true);
  const [k, setK] = useState(24);
  const [rounds, setRounds] = useState(0);
  const [agreement, setAgreement] = useState(0);
  const [mae, setMae] = useState(0);
  const [teamsSnap, setTeamsSnap] = useState<Team[]>([]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: W, height: H } = canvas;
    const league = leagueRef.current;
    const hist = league.history;
    const n = hist[0]?.length ?? 1;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    // Y range across all history
    let minY = START_ELO, maxY = START_ELO;
    for (const series of hist) {
      for (const v of series) {
        if (v < minY) minY = v;
        if (v > maxY) maxY = v;
      }
    }
    const pad = 40;
    minY -= pad; maxY += pad;

    const px = (i: number) => (n <= 1 ? 0 : (i / (n - 1)) * (W - 20) + 10);
    const py = (v: number) => H - 14 - ((v - minY) / (maxY - minY)) * (H - 28);

    // Baseline at 1500
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, py(START_ELO));
    ctx.lineTo(W, py(START_ELO));
    ctx.stroke();
    ctx.setLineDash([]);

    // Elo trajectories
    league.teams.forEach((team, ti) => {
      const series = hist[ti];
      ctx.strokeStyle = team.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      series.forEach((v, i) => {
        if (i === 0) ctx.moveTo(px(i), py(v));
        else ctx.lineTo(px(i), py(v));
      });
      ctx.stroke();

      // True-skill target as a dotted stub at the right edge
      const meanTrue =
        league.teams.reduce((s, t) => s + t.trueSkill, 0) / league.teams.length;
      const target = team.trueSkill - meanTrue + START_ELO;
      ctx.strokeStyle = team.color + "66";
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(W - 34, py(target));
      ctx.lineTo(W - 4, py(target));
      ctx.stroke();
      ctx.setLineDash([]);
    });
  }, []);

  const syncStats = useCallback(() => {
    const league = leagueRef.current;
    setRounds(league.history[0].length - 1);
    setAgreement(rankAgreement(league));
    setMae(meanAbsError(league));
    setTeamsSnap(league.teams.map((t) => ({ ...t })));
  }, []);

  const restart = useCallback(() => {
    leagueRef.current = newLeague(TEAM_COUNT);
    syncStats();
    draw();
  }, [draw, syncStats]);

  // Round loop
  useEffect(() => {
    const id = setInterval(() => {
      if (!runningRef.current) return;
      const league = leagueRef.current;
      if (league.history[0].length - 1 >= MAX_ROUNDS) return;
      playRound(league, kRef.current);
      syncStats();
      draw();
    }, ROUND_MS);
    return () => clearInterval(id);
  }, [draw, syncStats]);

  // Canvas sizing
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
    syncStats();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [draw, syncStats]);

  const standings = [...teamsSnap].sort((a, b) => b.elo - a.elo);
  const trueRank = new Map(
    [...teamsSnap].sort((a, b) => b.trueSkill - a.trueSkill).map((t, i) => [t.id, i + 1])
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
          <span className="text-sm">elo simulator</span>
        </div>
        <div className="text-xs text-primary/40 flex gap-4 tabular-nums">
          <span>round {rounds}</span>
          <span>rank agreement {(agreement * 100).toFixed(0)}%</span>
          <span>MAE {mae.toFixed(0)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">K-factor</span>
          <input
            type="range"
            min={4}
            max={64}
            step={4}
            value={k}
            onChange={(e) => {
              const v = Number(e.target.value);
              kRef.current = v;
              setK(v);
            }}
            className="w-28 accent-primary"
          />
          <span className="text-primary/60 text-xs w-6">{k}</span>
          <span className="text-primary/30 text-xs hidden md:inline">
            {k <= 12 ? "slow & steady" : k <= 32 ? "balanced" : "fast & noisy"}
          </span>
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => { runningRef.current = !running; setRunning(!running); }}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            {running ? "⏸ pause" : "▶ resume"}
          </button>
          <button
            onClick={restart}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ⚄ new league
          </button>
        </div>
      </div>

      {/* Chart + standings */}
      <div className="flex-1 flex flex-col lg:flex-row gap-px bg-primary/10" style={{ minHeight: 0 }}>
        <div className="flex-1 bg-background relative min-h-64">
          <canvas ref={canvasRef} className="block w-full h-full absolute inset-0" />
          <div className="absolute bottom-2 left-4 text-xs text-primary/30 pointer-events-none">
            solid lines: elo estimates · dotted stubs: hidden true skill
          </div>
        </div>

        <div className="lg:w-72 bg-background p-4 overflow-auto">
          <div className="text-xs text-primary/40 mb-2">standings (by elo)</div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-primary/30 text-left">
                <th className="pb-1 font-normal">team</th>
                <th className="pb-1 font-normal text-right">elo</th>
                <th className="pb-1 font-normal text-right">w-l</th>
                <th className="pb-1 font-normal text-right">true#</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((t, i) => {
                const tr = trueRank.get(t.id)!;
                const misranked = tr !== i + 1;
                return (
                  <tr key={t.id} className="border-t border-primary/5">
                    <td className="py-1">
                      <span style={{ color: t.color }}>■</span>{" "}
                      <span className="text-primary/80">{t.name}</span>
                    </td>
                    <td className="py-1 text-right tabular-nums text-primary/70">
                      {Math.round(t.elo)}
                    </td>
                    <td className="py-1 text-right tabular-nums text-primary/50">
                      {t.wins}-{t.losses}
                    </td>
                    <td className={`py-1 text-right tabular-nums ${misranked ? "text-yellow-300/80" : "text-primary/40"}`}>
                      {tr}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="text-xs text-primary/30 mt-3 leading-relaxed">
            Teams play round-robin; results are random draws from hidden true
            skill. Watch elo chase the dotted targets — low K converges slowly
            but smoothly, high K reacts fast but never settles.
          </div>
        </div>
      </div>
    </div>
  );
}
