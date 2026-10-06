import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChannelStats,
  CODES,
  CodeSpec,
  Codeword,
  Decoded,
  codeLength,
  covers,
  decode,
  encode,
  flip,
  isParityPosition,
  makeRng,
  newStats,
  overhead,
  randomData,
  transmit,
} from "../features/hamming/hamming";

interface State {
  spec: CodeSpec;
  word: Codeword;
  sent: number[];
  decoded: Decoded;
  flipped: Set<number>;
  stats: ChannelStats;
}

function freshState(spec: CodeSpec, rng: () => number): State {
  const sent = randomData(spec, rng);
  const word = encode(sent, spec);
  return { spec, word, sent, decoded: decode(word), flipped: new Set(), stats: newStats() };
}

export default function Hamming() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rngRef = useRef(makeRng(2026));
  const stateRef = useRef<State>(freshState(CODES[1], makeRng(2026)));
  const autoRef = useRef(false);
  const rateRef = useRef(0.03);
  const layoutRef = useRef<{ x: number; y: number; w: number; h: number }[]>([]);

  const [specId, setSpecId] = useState(CODES[1].id);
  const [auto, setAuto] = useState(false);
  const [rate, setRate] = useState(0.03);
  const [hud, setHud] = useState({
    verdict: "clean" as Decoded["verdict"],
    syndrome: 0,
    corrected: 0,
    stats: newStats(),
  });

  const refreshHud = useCallback(() => {
    const s = stateRef.current;
    setHud({
      verdict: s.decoded.verdict,
      syndrome: s.decoded.syndrome,
      corrected: s.decoded.correctedPosition,
      stats: { ...s.stats },
    });
  }, []);

  const reset = useCallback(
    (spec: CodeSpec) => {
      stateRef.current = freshState(spec, rngRef.current);
      refreshHud();
    },
    [refreshHud]
  );

  const flipAt = useCallback(
    (position: number) => {
      const s = stateRef.current;
      s.word = flip(s.word, position);
      s.decoded = decode(s.word);
      if (s.flipped.has(position)) s.flipped.delete(position);
      else s.flipped.add(position);
      refreshHud();
    },
    [refreshHud]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: W, height: H } = canvas;
    const s = stateRef.current;
    const n = codeLength(s.spec);
    const dataParityBits = s.spec.dataBits + s.spec.parityBits;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    const pad = 22;
    const cellW = Math.min(54, Math.floor((W - pad * 2) / n));
    const cellH = Math.min(48, Math.max(30, cellW));
    const ox = pad;
    const oy = pad + 18;

    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(0,255,65,0.4)";
    ctx.fillText("codeword — click any bit to flip it", ox, pad);

    const layout: { x: number; y: number; w: number; h: number }[] = [];
    layout[0] = { x: 0, y: 0, w: 0, h: 0 };

    for (let pos = 1; pos <= n; pos++) {
      const x = ox + (pos - 1) * cellW;
      const y = oy;
      layout[pos] = { x, y, w: cellW, h: cellH };

      const parity = pos <= dataParityBits && isParityPosition(pos);
      const overall = s.spec.extended && pos === n;
      const broken = s.flipped.has(pos);
      const corrected = s.decoded.correctedPosition === pos;

      ctx.fillStyle = broken
        ? "rgba(255,70,70,0.75)"
        : parity || overall
          ? "rgba(0,207,255,0.22)"
          : "rgba(0,255,65,0.14)";
      ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);

      if (corrected) {
        ctx.strokeStyle = "#ffbe3c";
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, cellW - 2, cellH - 2);
      }

      ctx.fillStyle = broken ? "#2a0000" : "#eafff0";
      ctx.font = `${Math.round(cellH * 0.45)}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(s.word.bits[pos]), x + cellW / 2, y + cellH / 2);

      ctx.font = "9px monospace";
      ctx.textBaseline = "top";
      ctx.fillStyle = parity || overall ? "rgba(0,207,255,0.8)" : "rgba(0,255,65,0.4)";
      ctx.fillText(overall ? "all" : parity ? `p${pos}` : String(pos), x + cellW / 2, y + cellH + 4);
      ctx.textAlign = "left";
    }
    layoutRef.current = layout;

    // ── the parity checks, and which ones are failing ──────────────────────
    let rowY = oy + cellH + 24;
    ctx.font = "10px monospace";
    for (let p = 0; p < s.spec.parityBits; p++) {
      const parityPos = 1 << p;
      const failed = s.decoded.failedChecks.includes(parityPos);
      ctx.fillStyle = failed ? "#ff5555" : "rgba(0,255,65,0.35)";
      ctx.fillText(`check ${parityPos}`, ox, rowY + 2);
      // A dot under every position this check covers: the pattern that makes
      // the syndrome spell out the broken address.
      for (let pos = 1; pos <= dataParityBits; pos++) {
        if (!covers(parityPos, pos)) continue;
        const cell = layout[pos];
        ctx.fillStyle = failed ? "rgba(255,85,85,0.85)" : "rgba(0,255,65,0.35)";
        ctx.fillRect(cell.x + cellW / 2 - 3, rowY + 2, 6, 6);
      }
      ctx.fillStyle = failed ? "#ff5555" : "rgba(0,255,65,0.3)";
      ctx.textAlign = "right";
      ctx.fillText(failed ? "fails" : "ok", ox + (dataParityBits + 1) * cellW + 28, rowY + 2);
      ctx.textAlign = "left";
      rowY += 16;
    }
    if (s.spec.extended) {
      ctx.fillStyle = s.decoded.overallParityFailed ? "#ff5555" : "rgba(0,255,65,0.35)";
      ctx.fillText(
        `overall parity ${s.decoded.overallParityFailed ? "fails — an odd number of errors" : "ok"}`,
        ox,
        rowY + 2
      );
      rowY += 16;
    }

    // ── the syndrome as an address ─────────────────────────────────────────
    rowY += 14;
    const syn = s.decoded.syndrome;
    ctx.font = "11px monospace";
    if (syn > 0) {
      const binary = syn.toString(2).padStart(Math.max(3, s.spec.parityBits), "0");
      ctx.fillStyle = "#ffbe3c";
      ctx.fillText(
        `syndrome ${s.decoded.failedChecks.join(" + ")} = ${syn} = ${binary}₂ — the address of the broken bit`,
        ox,
        rowY
      );
    } else {
      ctx.fillStyle = "rgba(0,255,65,0.45)";
      ctx.fillText("syndrome 0 — every check agrees", ox, rowY);
    }
    rowY += 20;

    const verdictText =
      s.decoded.verdict === "clean"
        ? "clean: the data came through untouched"
        : s.decoded.verdict === "corrected"
          ? `corrected bit ${s.decoded.correctedPosition} — the original data is recovered exactly`
          : "double error detected: this code can see it but cannot locate it, so it refuses to guess";
    ctx.fillStyle =
      s.decoded.verdict === "clean"
        ? "rgba(0,255,65,0.8)"
        : s.decoded.verdict === "corrected"
          ? "#ffbe3c"
          : "#ff5555";
    ctx.fillText(verdictText, ox, rowY);
    rowY += 18;

    const delivered = s.decoded.data.join("");
    const sent = s.sent.join("");
    const wrong = s.decoded.verdict !== "double" && delivered !== sent;
    ctx.font = "10px monospace";
    ctx.fillStyle = wrong ? "#ff5555" : "rgba(0,255,65,0.45)";
    ctx.fillText(
      `sent ${sent} · delivered ${s.decoded.verdict === "double" ? "nothing (retransmit)" : delivered}` +
        (wrong ? "  ← silently wrong, which is what SECDED prevents" : ""),
      ox,
      rowY
    );

    // ── the channel, when it is running ────────────────────────────────────
    if (s.stats.words > 0) {
      const st = s.stats;
      const barY = Math.min(H - 54, rowY + 28);
      const barW = W - pad * 2;
      const segments: [string, number, string][] = [
        ["clean", st.clean, "rgba(0,255,65,0.55)"],
        ["corrected", st.corrected, "#ffbe3c"],
        ["detected", st.detected, "rgba(0,207,255,0.6)"],
      ];
      ctx.fillStyle = "rgba(0,255,65,0.4)";
      ctx.fillText(`${st.words.toLocaleString()} words through a ${(rateRef.current * 100).toFixed(1)}% noisy channel`, ox, barY - 14);
      let cursor = ox;
      for (const [, count, colour] of segments) {
        const w = (count / st.words) * barW;
        ctx.fillStyle = colour;
        ctx.fillRect(cursor, barY, w, 14);
        cursor += w;
      }
      let labelX = ox;
      for (const [label, count, colour] of segments) {
        ctx.fillStyle = colour;
        ctx.fillText(`${label} ${((count / st.words) * 100).toFixed(1)}%`, labelX, barY + 20);
        labelX += 118;
      }
      ctx.fillStyle = st.wrong > 0 ? "#ff5555" : "rgba(0,255,65,0.45)";
      ctx.fillText(`silently wrong ${st.wrong}`, labelX, barY + 20);
    }
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

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const layout = layoutRef.current;
      for (let pos = 1; pos < layout.length; pos++) {
        const cell = layout[pos];
        if (cell && x >= cell.x && x <= cell.x + cell.w && y >= cell.y && y <= cell.y + cell.h) {
          flipAt(pos);
          return;
        }
      }
    };
    canvas.addEventListener("click", onClick);

    let raf = 0;
    let frame = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (autoRef.current && ++frame % 6 === 0) {
        const s = stateRef.current;
        const t = transmit(s.spec, rateRef.current, rngRef.current, s.stats);
        s.sent = t.sent;
        s.word = t.word;
        s.decoded = t.decoded;
        s.flipped = new Set(t.flipped);
        refreshHud();
      }
      draw();
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("click", onClick);
    };
  }, [draw, flipAt, refreshHud]);

  const spec = CODES.find((c) => c.id === specId) ?? CODES[1];

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">hamming codes</span>
        </div>
        <div className="text-xs text-primary/50 tabular-nums flex gap-3 flex-wrap">
          <span>{spec.dataBits} data + {codeLength(spec) - spec.dataBits} parity</span>
          <span>{(overhead(spec) * 100).toFixed(0)}% overhead</span>
          <span>syndrome {hud.syndrome}</span>
          <span
            className={
              hud.verdict === "clean"
                ? "text-primary"
                : hud.verdict === "corrected"
                  ? "text-[#ffbe3c]"
                  : "text-red-400"
            }
          >
            {hud.verdict === "clean" ? "◆ clean" : hud.verdict === "corrected" ? `✎ fixed bit ${hud.corrected}` : "✕ double error"}
          </span>
          {hud.stats.words > 0 && <span>{hud.stats.wrong} silently wrong</span>}
        </div>
      </div>

      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-2">
        <span className="text-primary/30 text-xs mr-1">code</span>
        {CODES.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setSpecId(c.id);
              reset(c);
            }}
            title={c.note}
            className={`px-2.5 py-1 text-xs border transition-colors ${
              c.id === specId
                ? "border-primary bg-primary/15 text-primary"
                : "border-primary/25 text-primary/60 hover:border-primary hover:text-primary"
            }`}
          >
            {c.label}
          </button>
        ))}
        <span className="text-primary/30 text-xs hidden lg:inline ml-1">{spec.note}</span>
      </div>

      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          onClick={() => {
            const next = !auto;
            autoRef.current = next;
            setAuto(next);
          }}
          className={`px-3 py-1 text-xs border transition-colors ${
            auto
              ? "border-primary bg-primary/15 text-primary"
              : "border-primary/30 hover:border-primary text-primary/70 hover:text-primary"
          }`}
        >
          {auto ? "⏸ stop channel" : "▶ run noisy channel"}
        </button>
        <button
          onClick={() => {
            const s = stateRef.current;
            const n = codeLength(s.spec);
            flipAt(1 + Math.floor(rngRef.current() * n));
          }}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ⚡ flip a random bit
        </button>
        <button
          onClick={() => reset(spec)}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ↺ new word
        </button>

        <Slider
          label="noise"
          title="probability each bit flips in transit"
          min={0}
          max={0.15}
          step={0.005}
          value={rate}
          fmt={(v) => `${(v * 100).toFixed(1)}%`}
          onChange={(v) => {
            setRate(v);
            rateRef.current = v;
          }}
        />
      </div>

      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full cursor-pointer" />
        <div className="absolute bottom-1 left-4 right-4 text-xs text-primary/40 pointer-events-none">
          parity bit p covers every position whose index has p&apos;s bit set, so the failing checks
          add up to the address of the broken bit · flip two bits on the plain code and watch it
          confidently fix the wrong one
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
  step: stepSize,
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
        step={stepSize}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-20 accent-primary"
      />
      <span className="text-primary/60 text-xs w-10 tabular-nums">{fmt(value)}</span>
    </div>
  );
}
