import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Source,
  WaveParams,
  DEFAULT_WAVE,
  MAX_SOURCES,
  renderWaves,
  defaultSources,
} from "../features/waves/interference";

const SCALE = 3; // render grid is 1/SCALE of display resolution

export default function Waves() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourcesRef = useRef<Source[]>([]);
  const paramsRef = useRef<WaveParams>({ ...DEFAULT_WAVE });
  const pausedRef = useRef(false);
  const dragIdxRef = useRef(-1);

  const [paused, setPaused] = useState(false);
  const [wavelength, setWavelength] = useState(DEFAULT_WAVE.wavelength);
  const [speed, setSpeed] = useState(DEFAULT_WAVE.speed);
  const [attenuate, setAttenuate] = useState(DEFAULT_WAVE.attenuate);
  const [sourceCount, setSourceCount] = useState(2);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let gw = 0, gh = 0;
    let buffer: ImageData | null = null;
    let off: HTMLCanvasElement | null = null;
    let offCtx: CanvasRenderingContext2D | null = null;

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      gw = Math.max(80, Math.floor(rect.width / SCALE));
      gh = Math.max(60, Math.floor(rect.height / SCALE));
      off = document.createElement("canvas");
      off.width = gw;
      off.height = gh;
      offCtx = off.getContext("2d");
      buffer = offCtx!.createImageData(gw, gh);
      if (sourcesRef.current.length === 0) {
        sourcesRef.current = defaultSources(gw, gh);
        setSourceCount(sourcesRef.current.length);
      } else {
        // Keep sources inside the new grid
        sourcesRef.current = sourcesRef.current.map((s) => ({
          ...s,
          x: Math.min(s.x, gw - 2),
          y: Math.min(s.y, gh - 2),
        }));
      }
    };
    resize();
    window.addEventListener("resize", resize);

    let t = 0;
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!buffer || !off || !offCtx) return;
      if (!pausedRef.current) t += paramsRef.current.speed * 8;

      renderWaves(buffer.data, gw, gh, sourcesRef.current, t, paramsRef.current);
      offCtx.putImageData(buffer, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(off, 0, 0, gw, gh, 0, 0, canvas.width, canvas.height);

      // Source markers
      for (const s of sourcesRef.current) {
        const sx = (s.x / gw) * canvas.width;
        const sy = (s.y / gh) * canvas.height;
        ctx.beginPath();
        ctx.arc(sx, sy, 7, 0, Math.PI * 2);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const gridPos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const gw = Math.max(80, Math.floor(rect.width / SCALE));
    const gh = Math.max(60, Math.floor(rect.height / SCALE));
    return {
      x: ((e.clientX - rect.left) / rect.width) * gw,
      y: ((e.clientY - rect.top) / rect.height) * gh,
      gw,
      gh,
    };
  };

  const onMouseDown = (e: React.MouseEvent) => {
    const { x, y } = gridPos(e);
    const grabR2 = 5 * 5;
    const idx = sourcesRef.current.findIndex(
      (s) => (s.x - x) ** 2 + (s.y - y) ** 2 < grabR2
    );
    if (idx >= 0) {
      dragIdxRef.current = idx;
    } else if (sourcesRef.current.length < MAX_SOURCES) {
      sourcesRef.current = [...sourcesRef.current, { x, y, phase: 0 }];
      setSourceCount(sourcesRef.current.length);
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (dragIdxRef.current < 0 || e.buttons !== 1) return;
    const { x, y } = gridPos(e);
    const next = [...sourcesRef.current];
    next[dragIdxRef.current] = { ...next[dragIdxRef.current], x, y };
    sourcesRef.current = next;
  };

  const onMouseUp = () => { dragIdxRef.current = -1; };

  const onDoubleClick = (e: React.MouseEvent) => {
    const { x, y } = gridPos(e);
    const grabR2 = 5 * 5;
    const idx = sourcesRef.current.findIndex(
      (s) => (s.x - x) ** 2 + (s.y - y) ** 2 < grabR2
    );
    if (idx >= 0 && sourcesRef.current.length > 1) {
      sourcesRef.current = sourcesRef.current.filter((_, i) => i !== idx);
      setSourceCount(sourcesRef.current.length);
    }
  };

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">wave interference</span>
        </div>
        <div className="text-xs text-primary/40">
          {sourceCount}/{MAX_SOURCES} sources
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">wavelength</span>
          <input
            type="range"
            min={10}
            max={60}
            step={2}
            value={wavelength}
            onChange={(e) => {
              const v = Number(e.target.value);
              setWavelength(v);
              paramsRef.current = { ...paramsRef.current, wavelength: v };
            }}
            className="w-24 accent-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">speed</span>
          <input
            type="range"
            min={0}
            max={0.5}
            step={0.02}
            value={speed}
            onChange={(e) => {
              const v = Number(e.target.value);
              setSpeed(v);
              paramsRef.current = { ...paramsRef.current, speed: v };
            }}
            className="w-24 accent-primary"
          />
        </div>

        <button
          onClick={() => {
            const v = !attenuate;
            setAttenuate(v);
            paramsRef.current = { ...paramsRef.current, attenuate: v };
          }}
          className={`px-2 py-0.5 text-xs border transition-colors ${
            attenuate
              ? "border-primary bg-primary/10 text-primary"
              : "border-primary/20 text-primary/40 hover:border-primary/50"
          }`}
        >
          falloff {attenuate ? "on" : "off"}
        </button>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => { pausedRef.current = !paused; setPaused(!paused); }}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            {paused ? "▶ resume" : "⏸ pause"}
          </button>
          <button
            onClick={() => {
              sourcesRef.current = [];
              setSourceCount(0);
            }}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ✕ clear
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas
          ref={canvasRef}
          className="block w-full h-full cursor-crosshair"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onDoubleClick={onDoubleClick}
        />
        <div className="absolute bottom-3 left-4 text-xs text-primary/30 pointer-events-none">
          click to add a source · drag to move · double-click to remove
        </div>
      </div>
    </div>
  );
}
