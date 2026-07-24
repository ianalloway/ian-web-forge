import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Ising, TC } from "../features/ising/ising";

const N = 200; // lattice is N×N

export default function IsingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<ImageData | null>(null);
  const modelRef = useRef<Ising | null>(null);
  const tempRef = useRef(2.4);
  const sweepsRef = useRef(4);
  const runningRef = useRef(true);

  const [temp, setTemp] = useState(2.4);
  const [sweeps, setSweeps] = useState(4);
  const [running, setRunning] = useState(true);
  const [mag, setMag] = useState(0);
  const [energy, setEnergy] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const off = document.createElement("canvas");
    off.width = N;
    off.height = N;
    offRef.current = off;
    const offCtx = off.getContext("2d");
    if (!offCtx) return;
    imgRef.current = offCtx.createImageData(N, N);

    const model = new Ising(N, N);
    model.setTemp(tempRef.current);
    modelRef.current = model;

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      // Keep the lattice square and centered.
      const side = Math.min(rect.width, rect.height);
      canvas.width = rect.width;
      canvas.height = rect.height;
      canvas.dataset.side = String(side);
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let frame = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const m = modelRef.current;
      const img = imgRef.current;
      if (!m || !img) return;

      if (runningRef.current) {
        for (let s = 0; s < sweepsRef.current; s++) m.step(N * N);
      }

      // Paint spins: +1 bright green, -1 near-black.
      const data = img.data;
      const spins = m.spins;
      for (let i = 0; i < spins.length; i++) {
        const o = i * 4;
        if (spins[i] === 1) {
          data[o] = 0;
          data[o + 1] = 255;
          data[o + 2] = 65;
        } else {
          data[o] = 6;
          data[o + 1] = 18;
          data[o + 2] = 10;
        }
        data[o + 3] = 255;
      }
      offCtx.putImageData(img, 0, 0);

      const W = canvas.width;
      const H = canvas.height;
      const side = Math.min(W, H);
      ctx.fillStyle = "#050805";
      ctx.fillRect(0, 0, W, H);
      ctx.drawImage(off, 0, 0, N, N, (W - side) / 2, (H - side) / 2, side, side);

      if ((frame++ & 7) === 0) {
        setMag(m.magnetization());
        setEnergy(m.energy());
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const phase = temp < TC ? "ordered (ferromagnet)" : "disordered (paramagnet)";

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">ising model</span>
        </div>
        <div className="text-xs text-primary/40 tabular-nums">
          T={temp.toFixed(2)} · |m|={Math.abs(mag).toFixed(3)} · E={energy.toFixed(3)}
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">temp</span>
          <input
            type="range"
            min={0.1}
            max={5}
            step={0.05}
            value={temp}
            onChange={(e) => {
              const v = Number(e.target.value);
              setTemp(v);
              tempRef.current = v;
              modelRef.current?.setTemp(v);
            }}
            className="w-40 accent-primary"
          />
          <span className="text-primary/60 text-xs w-8 tabular-nums">{temp.toFixed(2)}</span>
          <span className="text-primary/30 text-xs hidden md:inline">
            {phase} · Tc≈{TC.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">speed</span>
          <input
            type="range"
            min={1}
            max={16}
            step={1}
            value={sweeps}
            onChange={(e) => {
              const v = Number(e.target.value);
              setSweeps(v);
              sweepsRef.current = v;
            }}
            className="w-20 accent-primary"
          />
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => modelRef.current?.randomize()}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ♨ heat (randomize)
          </button>
          <button
            onClick={() => modelRef.current?.align(1)}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ❄ align (cold)
          </button>
          <button
            onClick={() => {
              runningRef.current = !running;
              setRunning(!running);
            }}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            {running ? "⏸ pause" : "▶ run"}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute bottom-3 left-4 text-xs text-primary/40 pointer-events-none max-w-xl">
          each cell is a spin that wants to match its neighbors but is jostled by heat. drag the
          temperature across Tc≈2.27 and watch magnetic order appear or dissolve — a phase transition
          you can feel in the slider.
        </div>
      </div>
    </div>
  );
}
