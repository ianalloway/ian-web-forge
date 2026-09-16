import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ClvBet,
  ClvVerdict,
  clvPts,
  clvVerdict,
  formatAmerican,
  impliedProb,
  summarizeClv,
} from "../features/clv/clv";

const PRESETS: { label: string; entry: number; close: number }[] = [
  { label: "beat +150→+120", entry: 150, close: 120 },
  { label: "lost −110→−105", entry: -110, close: -105 },
  { label: "push −110→−110", entry: -110, close: -110 },
  { label: "dog crush +250→+180", entry: 250, close: 180 },
];

const SAMPLE_LOG: ClvBet[] = [
  { label: "LAL ML", entryAmerican: -110, closeAmerican: -125 },
  { label: "BOS +4.5", entryAmerican: -105, closeAmerican: -110 },
  { label: "under 224.5", entryAmerican: -110, closeAmerican: -102 },
  { label: "DEN ML", entryAmerican: 140, closeAmerican: 125 },
];

function parseAmerican(raw: string): number | null {
  const cleaned = raw.trim().replace(/^\+/, "");
  if (cleaned === "" || cleaned === "-" || cleaned === "+") return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n === 0) return null;
  return n;
}

function verdictColor(v: ClvVerdict): string {
  switch (v) {
    case "beat":
      return "#00ff41";
    case "lost":
      return "#ff6a6a";
    case "push":
      return "rgba(0,255,65,0.45)";
    default: {
      const _exhaustive: never = v;
      return _exhaustive;
    }
  }
}

export default function Clv() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [entryRaw, setEntryRaw] = useState("-110");
  const [closeRaw, setCloseRaw] = useState("-125");
  const [log, setLog] = useState<ClvBet[]>(SAMPLE_LOG);
  const [draftLabel, setDraftLabel] = useState("");

  const entry = parseAmerican(entryRaw);
  const close = parseAmerican(closeRaw);

  const live = useMemo(() => {
    if (entry === null || close === null) return null;
    try {
      const pts = clvPts(entry, close);
      return {
        pts,
        verdict: clvVerdict(pts),
        entryImplied: impliedProb(entry),
        closeImplied: impliedProb(close),
      };
    } catch {
      return null;
    }
  }, [entry, close]);

  const summary = useMemo(() => summarizeClv(log), [log]);

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

      const pad = 36;
      const midY = H / 2;

      // Zero line (no movement).
      ctx.strokeStyle = "rgba(0,255,65,0.2)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pad, midY);
      ctx.lineTo(W - pad, midY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(0,255,65,0.35)";
      ctx.font = "10px monospace";
      ctx.fillText("0 pts (push)", pad + 4, midY - 6);

      if (!live) {
        ctx.fillStyle = "rgba(0,255,65,0.35)";
        ctx.font = "12px monospace";
        ctx.fillText("enter valid american odds to plot open → close", pad, midY + 24);
        return;
      }

      // Map CLV magnitude onto the vertical axis; keep a sensible floor so small
      // moves are still readable.
      const amp = Math.max(3, Math.abs(live.pts) * 1.35, 2);
      const py = (pts: number) => midY - (pts / amp) * (H / 2 - pad);
      const x0 = pad + 28;
      const x1 = W - pad - 28;

      // Soft band between open and close.
      ctx.fillStyle =
        live.pts >= 0 ? "rgba(0,255,65,0.08)" : "rgba(255,106,106,0.08)";
      ctx.beginPath();
      ctx.moveTo(x0, midY);
      ctx.lineTo(x0, py(0));
      ctx.lineTo(x1, py(live.pts));
      ctx.lineTo(x1, midY);
      ctx.closePath();
      ctx.fill();

      // Open → close polyline (ease with a couple of mid samples for a sparkline feel).
      const samples = 24;
      ctx.strokeStyle = verdictColor(live.verdict);
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        // Smoothstep so the move eases toward the close.
        const s = t * t * (3 - 2 * t);
        const pts = live.pts * s;
        const x = x0 + (x1 - x0) * t;
        const y = py(pts);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Endpoints.
      const drawDot = (x: number, y: number, label: string, sub: string) => {
        ctx.fillStyle = "#00ff41";
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(0,255,65,0.85)";
        ctx.font = "11px monospace";
        ctx.fillText(label, x - 10, y - 12);
        ctx.fillStyle = "rgba(0,255,65,0.45)";
        ctx.font = "10px monospace";
        ctx.fillText(sub, x - 10, y + 18);
      };

      drawDot(x0, py(0), "open", formatAmerican(entry!));
      drawDot(x1, py(live.pts), "close", formatAmerican(close!));

      // CLV callout near the close.
      ctx.fillStyle = verdictColor(live.verdict);
      ctx.font = "bold 13px monospace";
      const sign = live.pts > 0 ? "+" : "";
      ctx.fillText(`${sign}${live.pts.toFixed(2)} pts`, x1 - 70, py(live.pts) - 28);
    };

    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [live, entry, close]);

  const addToLog = () => {
    if (entry === null || close === null) return;
    setLog((prev) => [
      {
        label: draftLabel.trim() || `bet ${prev.length + 1}`,
        entryAmerican: entry,
        closeAmerican: close,
      },
      ...prev,
    ]);
    setDraftLabel("");
  };

  const removeAt = (idx: number) => {
    setLog((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateBet = (idx: number, patch: Partial<ClvBet>) => {
    setLog((prev) => prev.map((b, i) => (i === idx ? { ...b, ...patch } : b)));
  };

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <Link to="/kelly" className="text-primary/50 hover:text-primary text-sm transition-colors">
            kelly
          </Link>
          <span className="text-primary/20">|</span>
          <Link to="/kellysim" className="text-primary/50 hover:text-primary text-sm transition-colors">
            kellysim
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">clv playground</span>
        </div>
        <div className="text-xs text-primary/40 tabular-nums">
          beat the close · probability points
        </div>
      </div>

      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <label className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">entry</span>
          <input
            type="text"
            inputMode="numeric"
            value={entryRaw}
            onChange={(e) => setEntryRaw(e.target.value)}
            className="w-20 bg-transparent border border-primary/25 px-2 py-0.5 text-xs text-primary tabular-nums focus:outline-none focus:border-primary"
            aria-label="Entry American odds"
          />
        </label>

        <label className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">close</span>
          <input
            type="text"
            inputMode="numeric"
            value={closeRaw}
            onChange={(e) => setCloseRaw(e.target.value)}
            className="w-20 bg-transparent border border-primary/25 px-2 py-0.5 text-xs text-primary tabular-nums focus:outline-none focus:border-primary"
            aria-label="Closing American odds"
          />
        </label>

        <div className="flex items-center gap-1.5 flex-wrap">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setEntryRaw(String(p.entry));
                setCloseRaw(String(p.close));
              }}
              className="px-2 py-0.5 text-xs border border-primary/20 text-primary/50 hover:border-primary/50 hover:text-primary/80 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <input
            type="text"
            value={draftLabel}
            onChange={(e) => setDraftLabel(e.target.value)}
            placeholder="label"
            className="w-24 bg-transparent border border-primary/25 px-2 py-0.5 text-xs text-primary focus:outline-none focus:border-primary"
            aria-label="Bet label"
          />
          <button
            type="button"
            onClick={addToLog}
            disabled={!live}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors disabled:opacity-30"
          >
            + log bet
          </button>
        </div>
      </div>

      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap gap-x-6 gap-y-1 text-xs tabular-nums">
        {live ? (
          <>
            <span className="text-primary/40">
              clv{" "}
              <span style={{ color: verdictColor(live.verdict) }}>
                {live.pts > 0 ? "+" : ""}
                {live.pts.toFixed(2)} pts
              </span>
            </span>
            <span className="text-primary/40">
              verdict{" "}
              <span style={{ color: verdictColor(live.verdict) }}>{live.verdict}</span>
            </span>
            <span className="text-primary/40">
              entry implied{" "}
              <span className="text-primary/90">{(live.entryImplied * 100).toFixed(2)}%</span>
            </span>
            <span className="text-primary/40">
              close implied{" "}
              <span className="text-primary/90">{(live.closeImplied * 100).toFixed(2)}%</span>
            </span>
            <span className="text-primary/40">
              Δ{" "}
              <span className="text-primary/90">
                {((live.closeImplied - live.entryImplied) * 100).toFixed(2)} pp
              </span>
            </span>
          </>
        ) : (
          <span className="text-primary/40">waiting for valid american odds (nonzero)…</span>
        )}
      </div>

      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 220 }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute bottom-3 left-4 text-xs text-primary/40 pointer-events-none max-w-xl">
          clv pts = (implied(close) − implied(entry)) × 100. positive means the close shortened —
          you beat the market&apos;s last number.
        </div>
      </div>

      <div className="border-t border-primary/20 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span className="text-xs text-primary/70">bet log</span>
          <div className="text-xs text-primary/40 tabular-nums flex flex-wrap gap-x-4 gap-y-1">
            <span>
              n <span className="text-primary/80">{summary.n}</span>
            </span>
            <span>
              mean clv{" "}
              <span className="text-primary/80">
                {summary.meanClv > 0 ? "+" : ""}
                {summary.meanClv.toFixed(2)} pts
              </span>
            </span>
            <span>
              beat rate{" "}
              <span className="text-primary/80">{(summary.beatRate * 100).toFixed(0)}%</span>
            </span>
            <button
              type="button"
              onClick={() => setLog([])}
              className="text-primary/40 hover:text-primary/80 transition-colors"
            >
              clear
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-48 overflow-y-auto border border-primary/15">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-background">
              <tr className="border-b border-primary/20 text-primary/50">
                <th className="px-2 py-1.5 font-normal">label</th>
                <th className="px-2 py-1.5 font-normal">entry</th>
                <th className="px-2 py-1.5 font-normal">close</th>
                <th className="px-2 py-1.5 font-normal">clv</th>
                <th className="px-2 py-1.5 font-normal"> </th>
              </tr>
            </thead>
            <tbody>
              {log.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-2 py-3 text-primary/35">
                    empty — log the live line or edit rows below
                  </td>
                </tr>
              ) : (
                log.map((bet, idx) => {
                  let pts: number | null;
                  let verdict: ClvVerdict | null;
                  try {
                    pts = clvPts(bet.entryAmerican, bet.closeAmerican);
                    verdict = clvVerdict(pts);
                  } catch {
                    pts = null;
                    verdict = null;
                  }
                  return (
                    <tr key={idx} className="border-b border-primary/10 last:border-0">
                      <td className="px-2 py-1">
                        <input
                          type="text"
                          value={bet.label ?? ""}
                          onChange={(e) => updateBet(idx, { label: e.target.value })}
                          className="w-28 bg-transparent border border-transparent hover:border-primary/20 focus:border-primary/40 px-1 py-0.5 text-primary focus:outline-none"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={String(bet.entryAmerican)}
                          onChange={(e) => {
                            const n = parseAmerican(e.target.value);
                            if (n !== null) updateBet(idx, { entryAmerican: n });
                          }}
                          className="w-16 bg-transparent border border-transparent hover:border-primary/20 focus:border-primary/40 px-1 py-0.5 text-primary tabular-nums focus:outline-none"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={String(bet.closeAmerican)}
                          onChange={(e) => {
                            const n = parseAmerican(e.target.value);
                            if (n !== null) updateBet(idx, { closeAmerican: n });
                          }}
                          className="w-16 bg-transparent border border-transparent hover:border-primary/20 focus:border-primary/40 px-1 py-0.5 text-primary tabular-nums focus:outline-none"
                        />
                      </td>
                      <td className="px-2 py-1 tabular-nums">
                        {pts === null || verdict === null ? (
                          <span className="text-primary/30">—</span>
                        ) : (
                          <span style={{ color: verdictColor(verdict) }}>
                            {pts > 0 ? "+" : ""}
                            {pts.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-1 text-right">
                        <button
                          type="button"
                          onClick={() => removeAt(idx)}
                          className="text-primary/30 hover:text-red-400 transition-colors"
                          aria-label={`Remove ${bet.label ?? `bet ${idx + 1}`}`}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
