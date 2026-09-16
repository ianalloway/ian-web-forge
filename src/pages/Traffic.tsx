import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Diagram,
  PRESETS,
  Params,
  ROAD_LENGTH,
  Road,
  brakeOne,
  density,
  diagramPoints,
  newDiagram,
  newRoad,
  occupancy,
  record,
  step,
} from "../features/traffic/nasch";

const INITIAL = PRESETS[1]; // just past the critical density — jams appear unprompted
const ROWS = 420; // ticks of history in the space-time diagram
const ROAD_STRIP = 46; // height of the live road strip
const SETTLE = 50; // ticks to ignore after a density change
const SWEEP_DWELL = 190; // ticks spent at each density while sweeping

// Stopped is red, top speed is matrix green — the space-time diagram then reads
// as green flow torn by red jam stripes.
function speedColor(v: number, vmax: number): [number, number, number] {
  const t = vmax === 0 ? 1 : Math.min(1, v / vmax);
  return [Math.round(255 * (1 - t)), Math.round(60 + 195 * t), Math.round(60 + 5 * t)];
}

export default function Traffic() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const roadRef = useRef<Road>(newRoad(ROAD_LENGTH, INITIAL.cars, INITIAL.vmax));
  const paramsRef = useRef<Params>({ vmax: INITIAL.vmax, dawdle: INITIAL.dawdle });
  const diagramRef = useRef<Diagram>(newDiagram());
  const historyRef = useRef<Int8Array[]>([]);
  const cellsRef = useRef<Int8Array>(new Int8Array(ROAD_LENGTH));
  const stripRef = useRef<HTMLCanvasElement | null>(null);
  const runningRef = useRef(true);
  const rateRef = useRef(2);
  const sweepRef = useRef(false);
  const settleRef = useRef(0);
  const emaRef = useRef({ speed: 0, flow: 0, stopped: 0 });

  const [presetId, setPresetId] = useState(INITIAL.id);
  const [running, setRunning] = useState(true);
  const [cars, setCars] = useState(INITIAL.cars);
  const [vmax, setVmax] = useState(INITIAL.vmax);
  const [dawdle, setDawdle] = useState(INITIAL.dawdle);
  const [rate, setRate] = useState(2);
  const [sweep, setSweep] = useState(false);
  const [hud, setHud] = useState({ density: 0, speed: 0, flow: 0, stopped: 0, ticks: 0 });
  const ticksRef = useRef(0);

  const setCarCount = useCallback((n: number) => {
    roadRef.current = newRoad(ROAD_LENGTH, n, paramsRef.current.vmax);
    settleRef.current = 0;
    setCars(n);
  }, []);

  const loadPreset = useCallback(
    (id: string) => {
      const p = PRESETS.find((x) => x.id === id) ?? PRESETS[0];
      paramsRef.current = { vmax: p.vmax, dawdle: p.dawdle };
      roadRef.current = newRoad(ROAD_LENGTH, p.cars, p.vmax);
      historyRef.current = [];
      settleRef.current = 0;
      ticksRef.current = 0;
      emaRef.current = { speed: 0, flow: 0, stopped: 0 };
      setPresetId(id);
      setCars(p.cars);
      setVmax(p.vmax);
      setDawdle(p.dawdle);
    },
    []
  );

  const advance = useCallback(() => {
    const road = roadRef.current;
    const stats = step(road, paramsRef.current);
    ticksRef.current++;

    const snapshot = occupancy(road, new Int8Array(road.length));
    const history = historyRef.current;
    history.push(snapshot);
    if (history.length > ROWS) history.shift();

    const ema = emaRef.current;
    const a = 0.04;
    ema.speed += (stats.meanSpeed - ema.speed) * a;
    ema.flow += (stats.flow - ema.flow) * a;
    ema.stopped += (stats.stopped - ema.stopped) * a;

    settleRef.current++;
    if (settleRef.current > SETTLE) record(diagramRef.current, density(road), stats.flow);

    if (sweepRef.current && settleRef.current > SWEEP_DWELL) {
      const next = road.n >= 240 ? 6 : road.n + 7;
      roadRef.current = newRoad(ROAD_LENGTH, next, paramsRef.current.vmax);
      settleRef.current = 0;
      setCars(next);
    }
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: W, height: H } = canvas;
    const road = roadRef.current;
    const { vmax: vm } = paramsRef.current;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    const pad = 16;
    const roadW = W - pad * 2;
    const cellW = roadW / road.length;

    // ── live road strip ──────────────────────────────────────────────────────
    const cells = occupancy(road, cellsRef.current);
    const stripY = pad;
    ctx.fillStyle = "rgba(0,255,65,0.05)";
    ctx.fillRect(pad, stripY, roadW, ROAD_STRIP);
    ctx.strokeStyle = "rgba(0,255,65,0.18)";
    ctx.lineWidth = 1;
    ctx.strokeRect(pad + 0.5, stripY + 0.5, roadW - 1, ROAD_STRIP - 1);
    // lane divider
    ctx.setLineDash([6, 8]);
    ctx.strokeStyle = "rgba(0,255,65,0.12)";
    ctx.beginPath();
    ctx.moveTo(pad, stripY + ROAD_STRIP / 2);
    ctx.lineTo(pad + roadW, stripY + ROAD_STRIP / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    const carW = Math.max(1.5, cellW * 0.9);
    for (let i = 0; i < cells.length; i++) {
      const v = cells[i];
      if (v < 0) continue;
      const [r, g, b] = speedColor(v, vm);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(pad + i * cellW, stripY + ROAD_STRIP * 0.28, carW, ROAD_STRIP * 0.44);
    }
    ctx.fillStyle = "rgba(0,255,65,0.35)";
    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText("the road right now — traffic flows left to right, the ring wraps around", pad, stripY - 3);

    // ── space-time diagram ───────────────────────────────────────────────────
    const stY = stripY + ROAD_STRIP + 22;
    const stH = Math.max(40, H - stY - pad);
    const history = historyRef.current;

    ctx.fillStyle = "rgba(0,255,65,0.35)";
    ctx.fillText("space-time — each row is one tick, time runs downward", pad, stY - 4);

    if (history.length > 0) {
      let strip = stripRef.current;
      if (!strip) {
        strip = document.createElement("canvas");
        stripRef.current = strip;
      }
      if (strip.width !== road.length || strip.height !== ROWS) {
        strip.width = road.length;
        strip.height = ROWS;
      }
      const sctx = strip.getContext("2d");
      if (sctx) {
        const img = sctx.createImageData(road.length, ROWS);
        const data = img.data;
        // Newest row sits at the bottom; older rows fade upward.
        const offset = ROWS - history.length;
        for (let row = 0; row < history.length; row++) {
          const src = history[row];
          const y = offset + row;
          for (let x = 0; x < road.length; x++) {
            const p = (y * road.length + x) * 4;
            const v = src[x];
            if (v < 0) {
              data[p] = 0;
              data[p + 1] = 12;
              data[p + 2] = 4;
              data[p + 3] = 255;
            } else {
              const [r, g, b] = speedColor(v, vm);
              data[p] = r;
              data[p + 1] = g;
              data[p + 2] = b;
              data[p + 3] = 255;
            }
          }
        }
        sctx.putImageData(img, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(strip, pad, stY, roadW, stH);
        ctx.imageSmoothingEnabled = true;
      }
    }
    ctx.strokeStyle = "rgba(0,255,65,0.18)";
    ctx.strokeRect(pad + 0.5, stY + 0.5, roadW - 1, stH - 1);

    // ── fundamental diagram inset ────────────────────────────────────────────
    const pts = diagramPoints(diagramRef.current);
    const fdW = Math.min(210, W * 0.32);
    const fdH = Math.min(120, stH * 0.45);
    if (fdW > 90 && fdH > 60) {
      const fx = pad + roadW - fdW - 10;
      const fy = stY + 10;
      ctx.fillStyle = "rgba(0,0,0,0.82)";
      ctx.fillRect(fx, fy, fdW, fdH);
      ctx.strokeStyle = "rgba(0,255,65,0.25)";
      ctx.lineWidth = 1;
      ctx.strokeRect(fx + 0.5, fy + 0.5, fdW - 1, fdH - 1);
      ctx.fillStyle = "rgba(0,255,65,0.45)";
      ctx.font = "9px monospace";
      ctx.textBaseline = "top";
      ctx.fillText("flow vs density", fx + 5, fy + 4);

      const plotX = fx + 8;
      const plotY = fy + 18;
      const plotW = fdW - 16;
      const plotH = fdH - 28;
      let maxFlow = 0.05;
      for (const p of pts) if (p.flow > maxFlow) maxFlow = p.flow;
      ctx.strokeStyle = "rgba(0,255,65,0.15)";
      ctx.beginPath();
      ctx.moveTo(plotX, plotY);
      ctx.lineTo(plotX, plotY + plotH);
      ctx.lineTo(plotX + plotW, plotY + plotH);
      ctx.stroke();

      for (const p of pts) {
        const px = plotX + p.density * plotW;
        const py = plotY + plotH - (p.flow / maxFlow) * plotH;
        ctx.fillStyle = "rgba(0,207,255,0.75)";
        ctx.fillRect(px - 1, py - 1, 2.2, 2.2);
      }
      // where the road is running right now
      const dNow = density(road);
      const nowX = plotX + dNow * plotW;
      ctx.strokeStyle = "rgba(0,255,65,0.5)";
      ctx.beginPath();
      ctx.moveTo(nowX, plotY);
      ctx.lineTo(nowX, plotY + plotH);
      ctx.stroke();
      ctx.fillStyle = "rgba(0,255,65,0.35)";
      ctx.fillText(
        pts.length < 4 ? "sweep density to fill" : `peak ${maxFlow.toFixed(2)}`,
        plotX,
        plotY + plotH + 3
      );
    }
    ctx.textBaseline = "middle";
  }, []);

  const refreshHud = useCallback(() => {
    const ema = emaRef.current;
    setHud({
      density: density(roadRef.current),
      speed: ema.speed,
      flow: ema.flow,
      stopped: ema.stopped,
      ticks: ticksRef.current,
    });
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
      if (runningRef.current) for (let i = 0; i < rateRef.current; i++) advance();
      draw();
      if (++frame % 8 === 0) refreshHud();
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [advance, draw, refreshHud]);

  const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0];

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">phantom traffic jams</span>
        </div>
        <div className="text-xs text-primary/50 tabular-nums flex gap-3 flex-wrap">
          <span>tick {hud.ticks.toLocaleString()}</span>
          <span>density {(hud.density * 100).toFixed(0)}%</span>
          <span>speed {hud.speed.toFixed(2)}</span>
          <span className="text-[#00cfff]">flow {hud.flow.toFixed(3)}</span>
          <span className={hud.stopped > 0.1 ? "text-red-400" : "text-primary/40"}>
            {(hud.stopped * 100).toFixed(0)}% stopped
          </span>
        </div>
      </div>

      {/* Presets */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-2">
        <span className="text-primary/30 text-xs mr-1">regime</span>
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => loadPreset(p.id)}
            title={p.note}
            className={`px-2.5 py-1 text-xs border transition-colors ${
              p.id === presetId
                ? "border-primary bg-primary/15 text-primary"
                : "border-primary/25 text-primary/60 hover:border-primary hover:text-primary"
            }`}
          >
            {p.label}
          </button>
        ))}
        <span className="text-primary/30 text-xs hidden md:inline ml-1">{preset.note}</span>
      </div>

      {/* Controls */}
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
            brakeOne(roadRef.current);
            advance();
            draw();
          }}
          title="set one car's speed to zero for a single tick"
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ⨯ tap the brakes
        </button>
        <button
          onClick={() => {
            sweepRef.current = !sweep;
            setSweep(!sweep);
          }}
          title="walk the density upward to trace the fundamental diagram"
          className={`px-3 py-1 text-xs border transition-colors ${
            sweep
              ? "border-primary bg-primary/15 text-primary"
              : "border-primary/30 hover:border-primary text-primary/70 hover:text-primary"
          }`}
        >
          {sweep ? "◼ stop sweep" : "◆ sweep density"}
        </button>
        <button
          onClick={() => {
            diagramRef.current = newDiagram();
            historyRef.current = [];
            ticksRef.current = 0;
            setCarCount(cars);
          }}
          className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ↺ reset
        </button>

        <Slider
          label="cars"
          title={`cars on a ${ROAD_LENGTH}-cell ring`}
          min={4}
          max={250}
          step={1}
          value={cars}
          fmt={(v) => `${v}`}
          onChange={setCarCount}
        />
        <Slider
          label="vmax"
          title="top speed in cells per tick"
          min={1}
          max={9}
          step={1}
          value={vmax}
          fmt={(v) => `${v}`}
          onChange={(v) => {
            setVmax(v);
            paramsRef.current = { ...paramsRef.current, vmax: v };
          }}
        />
        <Slider
          label="p"
          title="dawdle probability — the rule that creates jams from nothing"
          min={0}
          max={0.6}
          step={0.01}
          value={dawdle}
          fmt={(v) => v.toFixed(2)}
          onChange={(v) => {
            setDawdle(v);
            paramsRef.current = { ...paramsRef.current, dawdle: v };
          }}
        />
        <Slider
          label="rate"
          title="ticks per animation frame"
          min={1}
          max={6}
          step={1}
          value={rate}
          fmt={(v) => `${v}×`}
          onChange={(v) => {
            setRate(v);
            rateRef.current = v;
          }}
        />
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute bottom-2 left-4 right-4 text-xs text-primary/40 pointer-events-none">
          red = stopped, green = top speed · the red stripes lean backwards: jams travel against the
          traffic · set p to 0 and every jam dissolves
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
      <span className="text-primary/60 text-xs w-8 tabular-nums">{fmt(value)}</span>
    </div>
  );
}
