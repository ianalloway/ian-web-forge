import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  DevigMethod,
  DevigResult,
  OddsFormat,
  edgeVersusFair,
  formatAmerican,
  fromImplied,
  toImplied,
  devig,
} from "../features/vig/vig";

type OutcomeDraft = { label: string; raw: string };

const METHODS: { id: DevigMethod; label: string; blurb: string }[] = [
  { id: "multiplicative", label: "multiplicative", blurb: "πᵢ / Σπ — proportional" },
  { id: "additive", label: "additive", blurb: "peel equal absolute juice" },
  { id: "power", label: "power", blurb: "πᵢᵏ with Σ πᵢᵏ = 1" },
  { id: "shin", label: "shin", blurb: "Shin (1993) insider model" },
];

const FORMATS: { id: OddsFormat; label: string }[] = [
  { id: "american", label: "american" },
  { id: "decimal", label: "decimal" },
  { id: "probability", label: "implied %" },
];

const PRESETS: {
  label: string;
  format: OddsFormat;
  outcomes: OutcomeDraft[];
}[] = [
  {
    label: "−110/−110",
    format: "american",
    outcomes: [
      { label: "side a", raw: "-110" },
      { label: "side b", raw: "-110" },
    ],
  },
  {
    label: "−150/+130",
    format: "american",
    outcomes: [
      { label: "fav", raw: "-150" },
      { label: "dog", raw: "+130" },
    ],
  },
  {
    label: "1X2 soccer",
    format: "decimal",
    outcomes: [
      { label: "home", raw: "1.80" },
      { label: "draw", raw: "3.60" },
      { label: "away", raw: "4.50" },
    ],
  },
  {
    label: "three-way ML",
    format: "american",
    outcomes: [
      { label: "home", raw: "-120" },
      { label: "draw", raw: "+260" },
      { label: "away", raw: "+320" },
    ],
  },
];

function parseOdds(raw: string, format: OddsFormat): number | null {
  const cleaned = raw.trim().replace(/,/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === "+" || cleaned === ".") return null;
  const n = Number(cleaned.replace(/^\+/, ""));
  if (!Number.isFinite(n)) return null;
  try {
    toImplied(n, format);
    return n;
  } catch {
    return null;
  }
}

function pct(p: number, digits = 2): string {
  return `${(p * 100).toFixed(digits)}%`;
}

const OUTCOME_COLORS = ["#00ff41", "#5ad4ff", "#ffd166", "#ff6a6a", "#c792ea", "#7fdbca"];

export default function Vig() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [format, setFormat] = useState<OddsFormat>("american");
  const [method, setMethod] = useState<DevigMethod>("multiplicative");
  const [outcomes, setOutcomes] = useState<OutcomeDraft[]>([
    { label: "side a", raw: "-110" },
    { label: "side b", raw: "-110" },
  ]);
  const [selected, setSelected] = useState(0);
  const [myProbRaw, setMyProbRaw] = useState("55");
  const [bankrollRaw, setBankrollRaw] = useState("1000");

  const parsed = useMemo(() => {
    return outcomes.map((o) => ({
      label: o.label,
      odds: parseOdds(o.raw, format),
    }));
  }, [outcomes, format]);

  const result: DevigResult | null = useMemo(() => {
    if (parsed.some((o) => o.odds === null)) return null;
    try {
      return devig(
        parsed.map((o) => ({ label: o.label, odds: o.odds! })),
        format,
        method
      );
    } catch {
      return null;
    }
  }, [parsed, format, method]);

  const myProb = useMemo(() => {
    const n = Number(myProbRaw);
    if (!Number.isFinite(n)) return null;
    if (n > 0 && n < 1) return n;
    if (n > 0 && n < 100) return n / 100;
    return null;
  }, [myProbRaw]);

  const bankroll = useMemo(() => {
    const n = Number(bankrollRaw);
    if (!Number.isFinite(n) || n < 0) return null;
    return n;
  }, [bankrollRaw]);

  const edge = useMemo(() => {
    if (!result || myProb === null) return null;
    const idx = Math.min(selected, result.outcomes.length - 1);
    const o = result.outcomes[idx];
    // Kelly uses the *offered* book price (raw implied → decimal), not the fair price.
    const offeredDecimal = 1 / o.implied;
    try {
      return {
        ...edgeVersusFair(myProb, o.fair, offeredDecimal, bankroll ?? undefined),
        outcome: o,
        offeredDecimal,
      };
    } catch {
      return null;
    }
  }, [result, myProb, selected, bankroll]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const W = rect.width;
      const H = rect.height;
      ctx.fillStyle = "#050805";
      ctx.fillRect(0, 0, W, H);

      const pad = 28;
      if (!result) {
        ctx.fillStyle = "rgba(0,255,65,0.35)";
        ctx.font = "12px monospace";
        ctx.fillText("enter valid odds for every outcome to plot", pad, H / 2);
        return;
      }

      const n = result.outcomes.length;
      const groupW = (W - pad * 2) / n;
      const barW = Math.min(36, groupW * 0.28);
      const gap = 8;
      const maxP = Math.max(
        0.55,
        ...result.outcomes.flatMap((o) => [o.implied, o.fair])
      );
      const chartTop = pad + 8;
      const chartBot = H - pad - 18;
      const chartH = chartBot - chartTop;
      const py = (p: number) => chartBot - (p / maxP) * chartH;

      // Gridlines at 25/50/75%.
      ctx.font = "10px monospace";
      for (const g of [0.25, 0.5, 0.75, 1]) {
        if (g > maxP) continue;
        const y = py(g);
        ctx.strokeStyle = "rgba(0,255,65,0.12)";
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(pad, y);
        ctx.lineTo(W - pad, y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(0,255,65,0.35)";
        ctx.fillText(`${(g * 100).toFixed(0)}%`, 4, y + 3);
      }

      result.outcomes.forEach((o, i) => {
        const cx = pad + groupW * i + groupW / 2;
        const color = OUTCOME_COLORS[i % OUTCOME_COLORS.length];
        const impliedH = chartBot - py(o.implied);
        const fairH = chartBot - py(o.fair);

        // Implied (book) bar.
        ctx.fillStyle = "rgba(0,255,65,0.22)";
        ctx.fillRect(cx - barW - gap / 2, py(o.implied), barW, impliedH);
        ctx.strokeStyle = "rgba(0,255,65,0.55)";
        ctx.strokeRect(cx - barW - gap / 2, py(o.implied), barW, impliedH);

        // Fair bar.
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(cx + gap / 2, py(o.fair), barW, fairH);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = color;
        ctx.strokeRect(cx + gap / 2, py(o.fair), barW, fairH);

        // Selection ring.
        if (i === Math.min(selected, n - 1)) {
          ctx.strokeStyle = "rgba(255,255,255,0.45)";
          ctx.lineWidth = 1.5;
          ctx.strokeRect(cx - barW - gap / 2 - 4, chartTop - 4, barW * 2 + gap + 8, chartH + 8);
          ctx.lineWidth = 1;
        }

        ctx.fillStyle = "rgba(0,255,65,0.7)";
        ctx.font = "11px monospace";
        ctx.textAlign = "center";
        ctx.fillText(o.label, cx, H - 8);
        ctx.fillStyle = "rgba(0,255,65,0.45)";
        ctx.font = "9px monospace";
        ctx.fillText(`${pct(o.implied, 1)}→${pct(o.fair, 1)}`, cx, py(Math.max(o.implied, o.fair)) - 6);
        ctx.textAlign = "left";
      });

      // Legend.
      ctx.font = "10px monospace";
      ctx.fillStyle = "rgba(0,255,65,0.45)";
      ctx.fillRect(W - 150, 12, 10, 10);
      ctx.fillStyle = "rgba(0,255,65,0.7)";
      ctx.fillText("implied (book)", W - 134, 21);
      ctx.fillStyle = "#00ff41";
      ctx.fillRect(W - 150, 28, 10, 10);
      ctx.fillText("fair (de-vig)", W - 134, 37);
    };

    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [result, selected]);

  const updateOutcome = (idx: number, patch: Partial<OutcomeDraft>) => {
    setOutcomes((prev) => prev.map((o, i) => (i === idx ? { ...o, ...patch } : o)));
  };

  const addOutcome = () => {
    setOutcomes((prev) => [
      ...prev,
      { label: `outcome ${prev.length + 1}`, raw: format === "american" ? "+200" : format === "decimal" ? "3.00" : "25" },
    ]);
  };

  const removeOutcome = (idx: number) => {
    setOutcomes((prev) => (prev.length <= 2 ? prev : prev.filter((_, i) => i !== idx)));
    setSelected((s) => Math.max(0, Math.min(s, outcomes.length - 2)));
  };

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    setFormat(p.format);
    setOutcomes(p.outcomes.map((o) => ({ ...o })));
    setSelected(0);
  };

  const convertFormat = (next: OddsFormat) => {
    if (next === format) return;
    setOutcomes((prev) =>
      prev.map((o) => {
        const n = parseOdds(o.raw, format);
        if (n === null) return o;
        try {
          const implied = toImplied(n, format);
          const converted = fromImplied(implied, next);
          if (next === "american") return { ...o, raw: formatAmerican(converted) };
          if (next === "decimal") return { ...o, raw: converted.toFixed(3) };
          return { ...o, raw: (converted * 100).toFixed(2) };
        } catch {
          return o;
        }
      })
    );
    setFormat(next);
  };

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <Link to="/kelly" className="text-primary/50 hover:text-primary text-sm transition-colors">
            kelly
          </Link>
          <span className="text-primary/20">|</span>
          <Link to="/clv" className="text-primary/50 hover:text-primary text-sm transition-colors">
            clv
          </Link>
          <span className="text-primary/20">|</span>
          <Link to="/kellysim" className="text-primary/50 hover:text-primary text-sm transition-colors">
            kellysim
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">no-vig playground</span>
        </div>
        <div className="text-xs text-primary/40 tabular-nums">
          fair odds · overround · quarter kelly
        </div>
      </div>

      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-1.5">
          <span className="text-primary/40 text-xs">format</span>
          {FORMATS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => convertFormat(f.id)}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                format === f.id
                  ? "border-primary text-primary"
                  : "border-primary/20 text-primary/50 hover:border-primary/50 hover:text-primary/80"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-primary/40 text-xs">method</span>
          {METHODS.map((m) => (
            <button
              key={m.id}
              type="button"
              title={m.blurb}
              onClick={() => setMethod(m.id)}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                method === m.id
                  ? "border-primary text-primary"
                  : "border-primary/20 text-primary/50 hover:border-primary/50 hover:text-primary/80"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap ml-auto">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p)}
              className="px-2 py-0.5 text-xs border border-primary/20 text-primary/50 hover:border-primary/50 hover:text-primary/80 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap gap-x-6 gap-y-1 text-xs tabular-nums">
        {result ? (
          <>
            <span className="text-primary/40">
              overround{" "}
              <span className="text-primary/90">{result.overroundPct.toFixed(2)}%</span>
            </span>
            <span className="text-primary/40">
              hold{" "}
              <span className="text-primary/90">{result.holdPct.toFixed(2)}%</span>
            </span>
            <span className="text-primary/40">
              Σ implied{" "}
              <span className="text-primary/90">
                {(result.overround + 1).toFixed(4)}
              </span>
            </span>
            <span className="text-primary/40">
              method{" "}
              <span className="text-primary/90">{result.method}</span>
            </span>
          </>
        ) : (
          <span className="text-primary/40">waiting for a valid two-or-more-way market…</span>
        )}
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] flex-1 min-h-0">
        <div className="border-b lg:border-b-0 lg:border-r border-primary/15 p-4 space-y-3 overflow-auto">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-primary/70">market outcomes</span>
            <button
              type="button"
              onClick={addOutcome}
              disabled={outcomes.length >= 8}
              className="px-2 py-0.5 text-xs border border-primary/30 text-primary/70 hover:border-primary hover:text-primary transition-colors disabled:opacity-30"
            >
              + outcome
            </button>
          </div>

          <div className="space-y-2">
            {outcomes.map((o, idx) => {
              const fair = result?.outcomes[idx];
              const active = idx === selected;
              return (
                <div
                  key={idx}
                  className={`border px-3 py-2 space-y-2 transition-colors ${
                    active ? "border-primary/50 bg-primary/5" : "border-primary/15"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelected(idx)}
                      className="text-[10px] uppercase tracking-wider text-primary/40 hover:text-primary"
                      title="Select for edge / Kelly"
                    >
                      {active ? "● bet" : "○ bet"}
                    </button>
                    <input
                      type="text"
                      value={o.label}
                      onChange={(e) => updateOutcome(idx, { label: e.target.value })}
                      className="w-24 bg-transparent border border-primary/20 px-2 py-0.5 text-xs text-primary focus:outline-none focus:border-primary"
                      aria-label={`Outcome ${idx + 1} label`}
                    />
                    <input
                      type="text"
                      inputMode="decimal"
                      value={o.raw}
                      onChange={(e) => updateOutcome(idx, { raw: e.target.value })}
                      className="w-24 bg-transparent border border-primary/25 px-2 py-0.5 text-xs text-primary tabular-nums focus:outline-none focus:border-primary"
                      aria-label={`Outcome ${idx + 1} odds`}
                    />
                    {outcomes.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOutcome(idx)}
                        className="ml-auto text-primary/30 hover:text-red-400 transition-colors"
                        aria-label={`Remove ${o.label}`}
                      >
                        ×
                      </button>
                    )}
                  </div>
                  {fair && (
                    <div className="text-[11px] text-primary/45 tabular-nums flex flex-wrap gap-x-3 gap-y-1">
                      <span>
                        implied <span className="text-primary/80">{pct(fair.implied)}</span>
                      </span>
                      <span>
                        fair <span className="text-primary/90">{pct(fair.fair)}</span>
                      </span>
                      <span>
                        fair am{" "}
                        <span className="text-primary/90">{formatAmerican(fair.fairAmerican)}</span>
                      </span>
                      <span>
                        fair dec{" "}
                        <span className="text-primary/90">{fair.fairDecimal.toFixed(3)}</span>
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="border border-primary/15 px-3 py-3 space-y-3">
            <div className="text-xs text-primary/70">
              my probability ·{" "}
              <span className="text-primary/40">
                edge vs fair on {result?.outcomes[Math.min(selected, (result?.outcomes.length ?? 1) - 1)]?.label ?? "selected"}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2">
                <span className="text-primary/40 text-xs">my %</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={myProbRaw}
                  onChange={(e) => setMyProbRaw(e.target.value)}
                  className="w-16 bg-transparent border border-primary/25 px-2 py-0.5 text-xs text-primary tabular-nums focus:outline-none focus:border-primary"
                  aria-label="My win probability percent"
                />
              </label>
              <label className="flex items-center gap-2">
                <span className="text-primary/40 text-xs">bankroll</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={bankrollRaw}
                  onChange={(e) => setBankrollRaw(e.target.value)}
                  className="w-20 bg-transparent border border-primary/25 px-2 py-0.5 text-xs text-primary tabular-nums focus:outline-none focus:border-primary"
                  aria-label="Bankroll dollars"
                />
              </label>
            </div>
            {edge ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs tabular-nums">
                <Stat
                  label="edge"
                  value={`${edge.edge >= 0 ? "+" : ""}${(edge.edge * 100).toFixed(2)} pp`}
                  accent={edge.edge > 0 ? "good" : edge.edge < 0 ? "bad" : undefined}
                />
                <Stat label="offered" value={`${edge.offeredDecimal.toFixed(3)} dec`} />
                <Stat
                  label="¼ kelly"
                  value={`${(edge.quarterKelly * 100).toFixed(2)}%`}
                  accent={edge.hasEdge ? "good" : "bad"}
                />
                <Stat
                  label="¼ kelly $"
                  value={
                    edge.quarterKellyDollars == null
                      ? "—"
                      : `$${edge.quarterKellyDollars.toFixed(2)}`
                  }
                  accent={edge.hasEdge ? "good" : undefined}
                />
              </div>
            ) : (
              <div className="text-xs text-primary/40">
                enter a win probability in (0, 100) to size the selected side
              </div>
            )}
          </div>

          <p className="text-[11px] text-primary/35 leading-relaxed">
            hold = 1 − 1/Σπ (bookmaker&apos;s take if the market is efficient). fair odds strip
            that juice via the selected method; multiplicative is the common default.
            quarter-Kelly uses your probability at the <em>offered</em> price — never the fair
            price — so sizing stays honest to what you can actually bet.
          </p>
        </div>

        <div className="relative min-h-[260px] flex flex-col">
          <div className="flex-1 relative overflow-hidden" style={{ minHeight: 240 }}>
            <canvas ref={canvasRef} className="block w-full h-full" />
          </div>
          <div className="border-t border-primary/15 px-4 py-2 text-[11px] text-primary/40 flex flex-wrap gap-x-4 gap-y-1">
            <span>click ○ bet to pick the side for edge / Kelly</span>
            <span>
              related:{" "}
              <Link to="/clv" className="text-primary/70 hover:text-primary">
                /clv
              </Link>
              {" · "}
              <Link to="/kelly" className="text-primary/70 hover:text-primary">
                /kelly
              </Link>
              {" · "}
              <Link to="/kellysim" className="text-primary/70 hover:text-primary">
                /kellysim
              </Link>
              {" · "}
              <Link to="/scoreline" className="text-primary/70 hover:text-primary">
                /scoreline
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "good" | "bad";
}) {
  const color =
    accent === "good" ? "text-green-400" : accent === "bad" ? "text-red-400" : "text-primary/90";
  return (
    <div className="rounded border border-primary/20 bg-background/60 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wider text-primary/40">{label}</div>
      <div className={`text-sm font-bold ${color}`}>{value}</div>
    </div>
  );
}
