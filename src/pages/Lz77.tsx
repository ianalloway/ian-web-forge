import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  MIN_MATCH,
  SAMPLES,
  Encoder,
  Token,
  encodeStep,
  isDone,
  newEncoder,
  summarise,
} from "../features/lz77/lz77";

// The character grid is sized to the canvas: a short sample gets big legible
// type, a long one shrinks to fit rather than overflowing.
function gridMetrics(width: number, height: number, length: number) {
  const pad = 18;
  const avail = width - pad * 2;
  const budget = height * 0.52; // vertical share the text block may take
  let best = { cols: 24, cellW: 8, cellH: 11, rows: Math.ceil(length / 24) };
  for (let cols = 16; cols <= 110; cols++) {
    const cellW = Math.floor(avail / cols);
    if (cellW < 7) break;
    const cellH = Math.round(cellW * 1.32);
    const rows = Math.ceil(Math.max(1, length) / cols);
    if (rows * cellH <= budget && cellW > best.cellW) best = { cols, cellW, cellH, rows };
  }
  return best;
}

export default function Lz77() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const encRef = useRef<Encoder>(newEncoder(SAMPLES[1].text, 64, 24));
  const runningRef = useRef(true);
  const paceRef = useRef(6); // frames between tokens
  const flashRef = useRef(0);

  const [sampleId, setSampleId] = useState(SAMPLES[1].id);
  const [windowSize, setWindowSize] = useState(64);
  const [maxMatch, setMaxMatch] = useState(24);
  const [running, setRunning] = useState(true);
  const [pace, setPace] = useState(6);
  const [hud, setHud] = useState({ pos: 0, tokens: 0, matches: 0, ratio: 1, done: false, longest: 0 });

  const refreshHud = useCallback(() => {
    const enc = encRef.current;
    const encoded = enc.text.slice(0, enc.pos);
    const sum = summarise(encoded, enc.tokens, enc.windowSize, enc.maxMatch);
    setHud({
      pos: enc.pos,
      tokens: sum.tokens,
      matches: sum.matches,
      ratio: sum.ratio,
      done: isDone(enc),
      longest: sum.longestMatch,
    });
  }, []);

  const reset = useCallback(
    (text: string, w: number, m: number) => {
      encRef.current = newEncoder(text, w, m);
      flashRef.current = 0;
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
    const enc = encRef.current;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    const pad = 18;
    const { cols: gridW, cellW: CELL_W, cellH: CELL_H, rows } = gridMetrics(W, H, enc.text.length);
    const ox = pad;
    const oy = pad + 16;

    const windowStart = Math.max(0, enc.pos - enc.windowSize);
    const lookaheadEnd = Math.min(enc.text.length, enc.pos + enc.maxMatch);
    const last = enc.lastToken;
    const matchStart = last && last.kind === "match" ? last.at - last.offset : -1;
    const matchEnd = last && last.kind === "match" ? matchStart + last.length : -1;

    ctx.font = `${CELL_H - 5}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "rgba(0,255,65,0.4)";
    ctx.textAlign = "left";
    ctx.font = "10px monospace";
    ctx.fillText(
      "dim = already encoded · bright = the search window · amber = the lookahead being matched",
      ox,
      pad - 2
    );
    ctx.font = `${CELL_H - 5}px monospace`;
    ctx.textAlign = "center";

    const textH = rows * CELL_H;

    for (let i = 0; i < enc.text.length; i++) {
      const col = i % gridW;
      const row = Math.floor(i / gridW);
      const x = ox + col * CELL_W;
      const y = oy + row * CELL_H;

      const inWindow = i >= windowStart && i < enc.pos;
      const inLookahead = i >= enc.pos && i < lookaheadEnd;
      const inMatchSource = flashRef.current > 0 && i >= matchStart && i < matchEnd;
      const isCursor = i === enc.pos;

      if (inMatchSource) {
        ctx.fillStyle = "rgba(255,190,60,0.3)";
        ctx.fillRect(x, y, CELL_W, CELL_H);
      } else if (inWindow) {
        ctx.fillStyle = "rgba(0,255,65,0.09)";
        ctx.fillRect(x, y, CELL_W, CELL_H);
      }
      if (isCursor) {
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.fillRect(x, y, 1.5, CELL_H);
      }

      const ch = enc.text[i];
      ctx.fillStyle = inMatchSource
        ? "#ffbe3c"
        : inLookahead
          ? "rgba(255,190,60,0.85)"
          : inWindow
            ? "rgba(0,255,65,0.9)"
            : i < enc.pos
              ? "rgba(0,255,65,0.32)"
              : "rgba(0,255,65,0.3)";
      ctx.fillText(ch === " " ? "·" : ch, x + CELL_W / 2, y + CELL_H / 2);
    }

    // An arrow from the match source back to where it is being copied: the
    // pointer that the encoder emits instead of the characters.
    if (flashRef.current > 0 && last && last.kind === "match") {
      const from = matchStart;
      const to = last.at;
      const fx = ox + (from % gridW) * CELL_W + CELL_W / 2;
      const fy = oy + Math.floor(from / gridW) * CELL_H + CELL_H;
      const tx = ox + (to % gridW) * CELL_W + CELL_W / 2;
      const ty = oy + Math.floor(to / gridW) * CELL_H + CELL_H;
      ctx.strokeStyle = "rgba(255,190,60,0.8)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      const lift = Math.min(26, 8 + Math.abs(tx - fx) * 0.12);
      ctx.bezierCurveTo(fx, fy + lift, tx, ty + lift, tx, ty);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,190,60,0.95)";
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`back ${last.offset}, copy ${last.length}`, Math.min(tx + 6, W - 140), ty + 12);
      flashRef.current--;
    }

    // ── the token stream ───────────────────────────────────────────────────
    const streamTop = oy + textH + 24;
    if (streamTop < H - 30) {
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.font = "10px monospace";
      ctx.fillStyle = "rgba(0,255,65,0.4)";
      ctx.fillText("output tokens — a literal costs 9 bits, a pointer costs one flag plus its offset and length", ox, streamTop - 13);

      const chipH = 15;
      const maxRows = Math.max(1, Math.floor((H - streamTop - 22) / (chipH + 3)));
      let x = ox;
      let y = streamTop;
      const recent = enc.tokens.slice(-220);
      for (const token of recent) {
        const label = tokenLabel(token);
        const w = label.length * 6 + 8;
        if (x + w > W - pad) {
          x = ox;
          y += chipH + 3;
          if (y > streamTop + maxRows * (chipH + 3)) break;
        }
        ctx.fillStyle = token.kind === "match" ? "rgba(255,190,60,0.22)" : "rgba(0,255,65,0.14)";
        ctx.fillRect(x, y, w, chipH);
        ctx.fillStyle = token.kind === "match" ? "#ffbe3c" : "rgba(0,255,65,0.85)";
        ctx.fillText(label, x + 4, y + 3);
        x += w + 3;
      }
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

    let raf = 0;
    let frame = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (runningRef.current && ++frame % paceRef.current === 0) {
        const enc = encRef.current;
        if (encodeStep(enc)) {
          if (enc.lastToken?.kind === "match") flashRef.current = paceRef.current + 6;
          refreshHud();
        }
      }
      draw();
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [draw, refreshHud]);

  const sample = SAMPLES.find((s) => s.id === sampleId) ?? SAMPLES[1];

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">lz77</span>
        </div>
        <div className="text-xs text-primary/50 tabular-nums flex gap-3 flex-wrap">
          <span>{hud.pos}/{sample.text.length} chars</span>
          <span>{hud.tokens} tokens</span>
          <span className="text-[#ffbe3c]">{hud.matches} pointers</span>
          {hud.longest > 0 && <span>longest {hud.longest}</span>}
          <span className={hud.ratio < 1 ? "text-primary" : "text-red-400"}>
            {(hud.ratio * 100).toFixed(0)}% of original
          </span>
          {hud.done && <span className="text-primary">◆ done</span>}
        </div>
      </div>

      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-2">
        <span className="text-primary/30 text-xs mr-1">input</span>
        {SAMPLES.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setSampleId(s.id);
              reset(s.text, windowSize, maxMatch);
            }}
            title={s.note}
            className={`px-2.5 py-1 text-xs border transition-colors ${
              s.id === sampleId
                ? "border-primary bg-primary/15 text-primary"
                : "border-primary/25 text-primary/60 hover:border-primary hover:text-primary"
            }`}
          >
            {s.label}
          </button>
        ))}
        <span className="text-primary/30 text-xs hidden lg:inline ml-1">{sample.note}</span>
      </div>

      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          onClick={() => {
            runningRef.current = !running;
            setRunning(!running);
          }}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          {running ? "⏸ pause" : "▶ resume"}
        </button>
        <button
          onClick={() => {
            encodeStep(encRef.current);
            if (encRef.current.lastToken?.kind === "match") flashRef.current = 30;
            refreshHud();
            draw();
          }}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ⇥ one token
        </button>
        <button
          onClick={() => {
            const enc = encRef.current;
            while (encodeStep(enc));
            flashRef.current = 0;
            refreshHud();
            draw();
          }}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ⏭ encode all
        </button>
        <button
          onClick={() => reset(sample.text, windowSize, maxMatch)}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ↺ restart
        </button>

        <Slider
          label="window"
          title="how far back a pointer may reach — wider finds more matches but costs more bits each"
          min={8}
          max={512}
          step={8}
          value={windowSize}
          fmt={(v) => `${v}`}
          onChange={(v) => {
            setWindowSize(v);
            reset(sample.text, v, maxMatch);
          }}
        />
        <Slider
          label="max"
          title="longest run a single pointer may copy"
          min={MIN_MATCH + 1}
          max={64}
          step={1}
          value={maxMatch}
          fmt={(v) => `${v}`}
          onChange={(v) => {
            setMaxMatch(v);
            reset(sample.text, windowSize, v);
          }}
        />
        <Slider
          label="pace"
          title="frames between tokens — lower is faster"
          min={1}
          max={40}
          step={1}
          value={pace}
          fmt={(v) => `${v}f`}
          onChange={(v) => {
            setPace(v);
            paceRef.current = v;
          }}
        />
      </div>

      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute bottom-1 left-4 right-4 text-xs text-primary/40 pointer-events-none">
          a match may run past the cursor and copy what it is still producing, which is how one
          pointer swallows a long run · LZ77 removes the repetition, Huffman shortens what is left,
          and together they are DEFLATE
        </div>
      </div>
    </div>
  );
}

function tokenLabel(token: Token): string {
  if (token.kind === "literal") return token.ch === " " ? "'·'" : `'${token.ch}'`;
  return `(${token.offset},${token.length})`;
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
      <span className="text-primary/60 text-xs w-9 tabular-nums">{fmt(value)}</span>
    </div>
  );
}
