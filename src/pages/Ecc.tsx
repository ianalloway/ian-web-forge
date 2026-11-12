import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fitCanvas } from "../lib/canvas";
import {
  type Curve,
  type Point,
  PRESETS,
  SECP256K1,
  SECP256K1_G,
  SECP256K1_N,
  addReal,
  allPoints,
  eq,
  hasseInterval,
  ladderSteps,
  mul,
  pointOrder,
  realHasPoint,
  subgroup,
} from "../features/ecc/curve";

type Mode = "geometry" | "field";

/** Short hex for a big number, head…tail. */
function hex(n: bigint, keep = 8): string {
  const h = n.toString(16).padStart(64, "0");
  return `${h.slice(0, keep)}…${h.slice(-keep)}`;
}

/** Smallest x where y² = x³ + ax + b has a real solution. */
function realDomainStart(a: number, b: number): number {
  for (let x = -6; x < 6; x += 0.001) {
    if (realHasPoint(a, b, x)) return x;
  }
  return 0;
}

export default function Ecc() {
  const [mode, setMode] = useState<Mode>("geometry");

  /* ----------------------------- geometry state ---------------------------- */
  const [ra, setRa] = useState(-1);
  const [rb, setRb] = useState(3);
  const [xp, setXp] = useState(-1.1);
  const [xq, setXq] = useState(1.8);

  /* ------------------------------- field state ----------------------------- */
  const [presetIdx, setPresetIdx] = useState(0);
  const [genIdx, setGenIdx] = useState(0);
  const [k, setK] = useState(1);
  const [alice, setAlice] = useState(7);
  const [bob, setBob] = useState(11);

  const geomCanvas = useRef<HTMLCanvasElement>(null);
  const fieldCanvas = useRef<HTMLCanvasElement>(null);

  /* ------------------------------ geometry math ---------------------------- */
  const geom = useMemo(() => {
    const start = realDomainStart(ra, rb);
    const clamp = (x: number) => Math.max(start + 0.02, Math.min(4.2, x));
    const px = clamp(xp);
    const qx = clamp(xq);
    const py = Math.sqrt(Math.max(0, px ** 3 + ra * px + rb));
    const qy = Math.sqrt(Math.max(0, qx ** 3 + ra * qx + rb));
    const P = { x: px, y: py };
    const Q = { x: qx, y: qy };
    const R = addReal(ra, P, Q);
    const singular = Math.abs(4 * ra ** 3 + 27 * rb ** 2) < 1e-9;
    return { P, Q, R, start, singular };
  }, [ra, rb, xp, xq]);

  /* -------------------------------- field math ----------------------------- */
  const field = useMemo(() => {
    const curve: Curve = PRESETS[presetIdx].curve;
    const pts = allPoints(curve);
    const order = pts.length + 1;
    const hasse = hasseInterval(curve.p);
    // Sample some points, then show the biggest subgroups first: a generator
    // of order 2 is a legitimate point but a dull walk, and on a curve like
    // y² = x³ - x it would otherwise be the one you land on by default.
    const sampled = pts.filter((_, i) => i % Math.max(1, Math.floor(pts.length / 24)) === 0);
    const candidates = sampled
      .map((P) => ({ P, ord: pointOrder(curve, P) }))
      .sort((l, r) => r.ord - l.ord)
      .map((c) => c.P);
    const G: Point = candidates[genIdx % candidates.length] ?? pts[0] ?? null;
    const sub = G ? subgroup(curve, G) : [];
    const n = sub.length + 1;
    const kG = G ? mul(curve, BigInt(k % n), G) : null;
    return { curve, pts, order, hasse, candidates, G, sub, n, kG };
  }, [presetIdx, genIdx, k]);

  /* --------------------------------- ECDH ---------------------------------- */
  const dh = useMemo(() => {
    const { curve, G, n } = field;
    if (!G) return null;
    const a = BigInt(((alice % n) + n) % n);
    const b = BigInt(((bob % n) + n) % n);
    const A = mul(curve, a, G);
    const B = mul(curve, b, G);
    const sA = mul(curve, a, B);
    const sB = mul(curve, b, A);
    return { a, b, A, B, sA, sB, agree: eq(sA, sB) };
  }, [field, alice, bob]);

  /* ------------------------------- secp256k1 ------------------------------- */
  const real = useMemo(() => {
    const k256 = BigInt(alice) * 1000000007n + 12345n;
    const P = mul(SECP256K1, k256, SECP256K1_G);
    const steps = ladderSteps(k256);
    const naive = ladderSteps(SECP256K1_N);
    return { k256, P, steps, naive };
  }, [alice]);

  /* ------------------------------ geometry draw ---------------------------- */
  useEffect(() => {
    const canvas = geomCanvas.current;
    if (!canvas || mode !== "geometry") return;

    const draw = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      const { ctx, width: W, height: H } = fitCanvas(canvas, rect.width, rect.height);
      if (!ctx) return;
      ctx.fillStyle = "#050805";
      ctx.fillRect(0, 0, W, H);

      const xMin = -3;
      const xMax = 5;
      const yMax = 6;
      const sx = (x: number) => ((x - xMin) / (xMax - xMin)) * W;
      const sy = (y: number) => H / 2 - (y / yMax) * (H / 2);

      // Axes.
      ctx.strokeStyle = "rgba(0,255,65,0.12)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, sy(0));
      ctx.lineTo(W, sy(0));
      ctx.moveTo(sx(0), 0);
      ctx.lineTo(sx(0), H);
      ctx.stroke();

      // The curve, both branches.
      ctx.strokeStyle = "rgba(0,255,65,0.85)";
      ctx.lineWidth = 1.6;
      for (const sign of [1, -1]) {
        ctx.beginPath();
        let started = false;
        for (let px = 0; px <= W; px++) {
          const x = xMin + (px / W) * (xMax - xMin);
          const rhs = x ** 3 + ra * x + rb;
          if (rhs < 0) {
            started = false;
            continue;
          }
          const y = sign * Math.sqrt(rhs);
          if (!started) {
            ctx.moveTo(px, sy(y));
            started = true;
          } else {
            ctx.lineTo(px, sy(y));
          }
        }
        ctx.stroke();
      }

      const { P, Q, R } = geom;
      const dot = (x: number, y: number, color: string, label: string, r = 4) => {
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(sx(x), sy(y), r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = color;
        ctx.font = "600 12px ui-monospace, monospace";
        ctx.textAlign = "center";
        ctx.fillText(label, sx(x), sy(y) - 10);
      };

      if (R) {
        // The chord (or tangent) through P and Q, extended across the view.
        const sameX = Math.abs(P.x - Q.x) < 1e-12;
        const lambda = sameX
          ? (3 * P.x * P.x + ra) / (2 * P.y)
          : (Q.y - P.y) / (Q.x - P.x);
        ctx.strokeStyle = "rgba(255,210,74,0.5)";
        ctx.setLineDash([4, 3]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx(xMin), sy(P.y + lambda * (xMin - P.x)));
        ctx.lineTo(sx(xMax), sy(P.y + lambda * (xMax - P.x)));
        ctx.stroke();

        // The reflection: third intersection down to P+Q.
        ctx.strokeStyle = "rgba(255,210,74,0.75)";
        ctx.beginPath();
        ctx.moveTo(sx(R.x), sy(-R.y));
        ctx.lineTo(sx(R.x), sy(R.y));
        ctx.stroke();
        ctx.setLineDash([]);

        dot(R.x, -R.y, "rgba(255,210,74,0.6)", "3rd", 3);
        dot(R.x, R.y, "#ffd24a", "P+Q");
      }
      ctx.setLineDash([]);
      dot(P.x, P.y, "#00ff41", "P");
      if (Math.abs(P.x - Q.x) > 1e-9) dot(Q.x, Q.y, "#7ad7ff", "Q");
    };

    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [mode, ra, rb, geom]);

  /* -------------------------------- field draw ----------------------------- */
  useEffect(() => {
    const canvas = fieldCanvas.current;
    if (!canvas || mode !== "field") return;

    const draw = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      const { ctx, width: W, height: H } = fitCanvas(canvas, rect.width, rect.height);
      if (!ctx) return;
      ctx.fillStyle = "#050805";
      ctx.fillRect(0, 0, W, H);

      const p = Number(field.curve.p);
      const pad = 16;
      const size = Math.min(W, H) - pad * 2;
      const ox = (W - size) / 2;
      const oy = (H - size) / 2;
      const sx = (x: number) => ox + (x / (p - 1)) * size;
      const sy = (y: number) => oy + size - (y / (p - 1)) * size;

      // Frame.
      ctx.strokeStyle = "rgba(0,255,65,0.12)";
      ctx.lineWidth = 1;
      ctx.strokeRect(ox, oy, size, size);

      // Every point on the curve.
      ctx.fillStyle = "rgba(0,255,65,0.22)";
      for (const pt of field.pts) {
        ctx.fillRect(sx(Number(pt.x)) - 1, sy(Number(pt.y)) - 1, 2.5, 2.5);
      }

      // The subgroup generated by G, coloured by how far along the walk it is.
      field.sub.forEach((pt, i) => {
        if (!pt) return;
        const t = i / Math.max(1, field.sub.length - 1);
        ctx.fillStyle = `hsl(${110 + t * 120} 90% ${45 + t * 20}% / 0.85)`;
        ctx.beginPath();
        ctx.arc(sx(Number(pt.x)), sy(Number(pt.y)), 2.4, 0, Math.PI * 2);
        ctx.fill();
      });

      // G and kG.
      const ring = (pt: Point, color: string, label: string) => {
        if (!pt) return;
        const x = sx(Number(pt.x));
        const y = sy(Number(pt.y));
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.font = "600 11px ui-monospace, monospace";
        ctx.textAlign = "center";
        ctx.fillText(label, x, y - 11);
      };
      ring(field.G, "#00ff41", "G");
      if (field.kG && !eq(field.kG, field.G)) ring(field.kG, "#ffd24a", `${k % field.n}G`);
    };

    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [mode, field, k]);

  const preset = PRESETS[presetIdx];

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/lab" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← lab
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">elliptic curves</span>
        </div>
        <div className="text-xs text-primary/40 tabular-nums">
          {mode === "geometry"
            ? `y² = x³ ${ra < 0 ? "−" : "+"} ${Math.abs(ra)}x ${rb < 0 ? "−" : "+"} ${Math.abs(rb)}`
            : `${field.order} points · G has order ${field.n}`}
        </div>
      </div>

      {/* Mode */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-2">
        {(["geometry", "field"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 py-1 text-xs border transition-colors ${
              mode === m
                ? "border-primary bg-primary/10 text-primary"
                : "border-primary/20 text-primary/50 hover:border-primary/50"
            }`}
          >
            {m === "geometry" ? "over the reals" : "over a prime field"}
          </button>
        ))}
        <span className="text-[11px] text-primary/35 ml-2">
          {mode === "geometry"
            ? "the group law is a picture: a line through two points meets the curve once more"
            : "same algebra, no picture left — and that is where the hardness lives"}
        </span>
      </div>

      {mode === "geometry" ? (
        <>
          <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-x-5 gap-y-2">
            <Slider label="a" value={ra} min={-4} max={3} step={0.1} onChange={setRa} />
            <Slider label="b" value={rb} min={-2} max={6} step={0.1} onChange={setRb} />
            <Slider label="P.x" value={xp} min={-3} max={4} step={0.02} onChange={setXp} />
            <Slider label="Q.x" value={xq} min={-3} max={4} step={0.02} onChange={setXq} />
            {geom.singular && (
              <span className="text-[11px]" style={{ color: "#ff6a6a" }}>
                4a³+27b² = 0 — singular, the group law breaks here
              </span>
            )}
          </div>
          <div className="relative overflow-hidden" style={{ height: "clamp(260px, 44vh, 460px)" }}>
            <canvas
              ref={geomCanvas}
              className="block w-full h-full"
              role="img"
              aria-label="An elliptic curve over the real numbers with two points P and Q, the chord drawn through them, the third place that line crosses the curve, and its reflection over the x-axis giving the sum P plus Q."
            />
          </div>
          <div className="px-4 py-3 text-xs text-primary/45 max-w-3xl leading-relaxed">
            to add P and Q, draw the line through them. a cubic meets a line three times, so there
            is exactly one more crossing — reflect it over the x-axis and that is P+Q. when P and Q
            coincide the line is the tangent, which is how doubling works. the reflection is what
            makes the identity behave: P and −P sit on a vertical line that never finds a third
            crossing, so their sum is the point at infinity.
          </div>
        </>
      ) : (
        <>
          <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-primary/40 text-xs mr-1">curve</span>
              {PRESETS.map((p, i) => (
                <button
                  key={p.name}
                  onClick={() => {
                    setPresetIdx(i);
                    setGenIdx(0);
                    setK(1);
                  }}
                  className={`px-2 py-0.5 text-[11px] border transition-colors ${
                    presetIdx === i
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-primary/20 text-primary/50 hover:border-primary/50"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setGenIdx((g) => g + 1);
                setK(1);
              }}
              className="px-2 py-0.5 text-[11px] border border-primary/30 hover:border-primary text-primary/70 transition-colors"
            >
              ↻ another generator
            </button>
            <Slider label="k" value={k} min={0} max={Math.max(1, field.n)} step={1} onChange={setK} />
          </div>

          <div className="grid md:grid-cols-[1fr_auto] gap-4 px-4 py-3">
            <div className="relative overflow-hidden border border-primary/10" style={{ height: "clamp(260px, 44vh, 420px)" }}>
              <canvas
                ref={fieldCanvas}
                className="block w-full h-full"
                role="img"
                aria-label="Every point of an elliptic curve over a prime field, plotted as a scatter of dots, with the cyclic subgroup generated by the chosen point G highlighted in walk order and the current multiple of G ringed."
              />
            </div>
            <div className="text-xs space-y-3 md:w-72">
              <div>
                <div className="text-primary/50 uppercase tracking-wide text-[11px] mb-1">
                  this curve
                </div>
                <p className="text-primary/40 text-[11px] mb-1">{preset.blurb}</p>
                <div className="text-primary/60 tabular-nums space-y-0.5">
                  <div>#E = {field.order} points (infinity included)</div>
                  <div className="text-primary/35">
                    Hasse says {field.hasse.low}–{field.hasse.high} ✓
                  </div>
                  <div>G = ({String(field.G?.x)}, {String(field.G?.y)})</div>
                  <div>order of G = {field.n}</div>
                  <div className="text-primary/35">
                    {field.order % field.n === 0 ? "divides #E ✓ (Lagrange)" : ""}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-primary/50 uppercase tracking-wide text-[11px] mb-1">
                  {k % field.n}·G
                </div>
                <div className="text-primary/70 tabular-nums">
                  {field.kG ? `(${field.kG.x}, ${field.kG.y})` : "point at infinity"}
                </div>
                <p className="text-primary/30 text-[11px] mt-1">
                  walking k forward lands anywhere in the subgroup with no pattern you can read
                  off — going backwards from the point to k is the discrete log problem.
                </p>
              </div>
            </div>
          </div>

          {/* ECDH */}
          {dh && (
            <div className="border-t border-primary/10 px-4 py-3">
              <div className="text-primary/50 uppercase tracking-wide text-[11px] mb-2">
                key agreement, on this curve
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-2">
                <Slider label="alice's secret a" value={alice} min={1} max={Math.max(2, field.n - 1)} step={1} onChange={setAlice} />
                <Slider label="bob's secret b" value={bob} min={1} max={Math.max(2, field.n - 1)} step={1} onChange={setBob} />
              </div>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-xs tabular-nums max-w-3xl">
                <div className="text-primary/60">
                  A = {String(dh.a)}·G = {fmtPoint(dh.A)}
                </div>
                <div className="text-primary/60">
                  B = {String(dh.b)}·G = {fmtPoint(dh.B)}
                </div>
                <div style={{ color: "#ffd24a" }}>a·B = {fmtPoint(dh.sA)}</div>
                <div style={{ color: "#ffd24a" }}>b·A = {fmtPoint(dh.sB)}</div>
              </div>
              <p className="text-[11px] mt-2" style={{ color: dh.agree ? "#00ff41" : "#ff6a6a" }}>
                {dh.agree
                  ? "✓ both sides computed the same point, having sent only A and B in the clear"
                  : "✗ the two secrets disagree"}
              </p>
            </div>
          )}

          {/* secp256k1 */}
          <div className="border-t border-primary/10 px-4 py-3">
            <div className="text-primary/50 uppercase tracking-wide text-[11px] mb-2">
              the same code, at real size (secp256k1)
            </div>
            <div className="text-xs text-primary/60 tabular-nums space-y-0.5 max-w-3xl">
              <div>p = 2²⁵⁶ − 2³² − 977</div>
              <div>G.x = {hex(SECP256K1_G!.x)}</div>
              <div>
                k = {String(real.k256)} → k·G.x = {real.P ? hex(real.P.x) : "∞"}
              </div>
              <div className="text-primary/40">
                that took {real.steps.doublings} doublings and {real.steps.additions} additions
              </div>
            </div>
            <p className="text-[11px] text-primary/35 mt-2 max-w-3xl">
              the group here has about 2²⁵⁶ elements, and a 256-bit scalar costs{" "}
              {real.naive.doublings} doublings to multiply — the whole scheme is that gap between
              walking forward and searching backwards. the arithmetic is the same function you just
              watched on a 97-point curve.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function fmtPoint(P: Point): string {
  return P === null ? "∞" : `(${P.x}, ${P.y})`;
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center gap-2">
      <span className="text-primary/40 text-xs">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-24 accent-primary"
      />
      <span className="text-primary/60 text-xs w-10 tabular-nums">
        {Number.isInteger(step) ? value : value.toFixed(1)}
      </span>
    </label>
  );
}
