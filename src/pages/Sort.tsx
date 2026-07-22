import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  AlgoId,
  ALGORITHMS,
  Frame,
  makeSorter,
  randomArray,
} from "../features/sorting/algorithms";

const ALGO_KEYS = Object.keys(ALGORITHMS) as AlgoId[];
const BAR_COUNT = 60;

type Status = "idle" | "running" | "paused" | "done";

export default function Sort() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sorterRef = useRef<Generator<Frame> | null>(null);
  const frameRef = useRef<Frame | null>(null);
  const baseArrayRef = useRef<number[]>(randomArray(BAR_COUNT));
  const statusRef = useRef<Status>("idle");
  const speedRef = useRef(60);

  const [algo, setAlgo] = useState<AlgoId>("quick");
  const [status, setStatus] = useState<Status>("idle");
  const [speed, setSpeed] = useState(60);
  const [steps, setSteps] = useState(0);

  const setStatusBoth = useCallback((s: Status) => {
    statusRef.current = s;
    setStatus(s);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: W, height: H } = canvas;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    const f = frameRef.current ?? {
      array: baseArrayRef.current,
      comparing: [],
      swapping: [],
      sorted: [],
    };
    const n = f.array.length;
    const gap = 2;
    const barW = (W - gap * (n + 1)) / n;
    const sortedSet = new Set(f.sorted);

    for (let i = 0; i < n; i++) {
      const h = (f.array[i] / 100) * (H - 20);
      const x = gap + i * (barW + gap);
      const y = H - h;

      if (f.swapping.includes(i)) {
        ctx.fillStyle = "#ff6b35";
      } else if (f.comparing.includes(i)) {
        ctx.fillStyle = "#ffe066";
      } else if (sortedSet.has(i)) {
        ctx.fillStyle = "#00ff41";
      } else {
        ctx.fillStyle = "rgba(0, 255, 65, 0.35)";
      }
      ctx.fillRect(x, y, barW, h);
    }
  }, []);

  const reset = useCallback((newArray: boolean) => {
    if (newArray) baseArrayRef.current = randomArray(BAR_COUNT);
    sorterRef.current = null;
    frameRef.current = null;
    setStatusBoth("idle");
    setSteps(0);
    draw();
  }, [draw, setStatusBoth]);

  // Stepping loop — interval reads refs so speed/status changes apply live
  useEffect(() => {
    let stepCount = 0;
    const id = setInterval(() => {
      if (statusRef.current !== "running") return;
      const sorter = sorterRef.current;
      if (!sorter) return;

      // Steps per tick scales with speed slider (1..8 per 16ms tick)
      const perTick = Math.max(1, Math.round(speedRef.current / 15));
      let result: IteratorResult<Frame> | null = null;
      for (let i = 0; i < perTick; i++) {
        result = sorter.next();
        if (result.done) break;
        frameRef.current = result.value;
        stepCount++;
      }
      setSteps(stepCount);
      if (result?.done) {
        setStatusBoth("done");
      }
      draw();
    }, 16);
    return () => clearInterval(id);
  }, [draw, setStatusBoth]);

  // Canvas sizing + initial draw
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
    return () => window.removeEventListener("resize", resize);
  }, [draw]);

  const handlePlay = () => {
    if (status === "running") {
      setStatusBoth("paused");
      return;
    }
    if (!sorterRef.current || status === "done") {
      sorterRef.current = makeSorter(algo, baseArrayRef.current);
      frameRef.current = null;
      setSteps(0);
    }
    setStatusBoth("running");
  };

  const handleAlgo = (id: AlgoId) => {
    setAlgo(id);
    sorterRef.current = null;
    frameRef.current = null;
    setStatusBoth("idle");
    setSteps(0);
    draw();
  };

  const handleSpeed = (v: number) => {
    speedRef.current = v;
    setSpeed(v);
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
          <span className="text-sm">sorting visualizer</span>
        </div>
        <div className="text-xs text-primary/40">
          {ALGORITHMS[algo].complexity} · {steps} steps
          {status === "done" && <span className="text-primary ml-2">✓ sorted</span>}
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <div className="flex gap-1 flex-wrap">
          {ALGO_KEYS.map((id) => (
            <button
              key={id}
              onClick={() => handleAlgo(id)}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                algo === id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/20 text-primary/40 hover:border-primary/50 hover:text-primary/70"
              }`}
            >
              {ALGORITHMS[id].label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">speed</span>
          <input
            type="range"
            min={15}
            max={120}
            step={15}
            value={speed}
            onChange={(e) => handleSpeed(Number(e.target.value))}
            className="w-24 accent-primary"
          />
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={handlePlay}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            {status === "running" ? "⏸ pause" : status === "paused" ? "▶ resume" : "▶ sort"}
          </button>
          <button
            onClick={() => reset(false)}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ↺ reset
          </button>
          <button
            onClick={() => reset(true)}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ⇄ shuffle
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute bottom-3 left-4 text-xs text-primary/30 pointer-events-none flex gap-4">
          <span><span className="text-yellow-300">■</span> comparing</span>
          <span><span className="text-orange-400">■</span> writing</span>
          <span><span className="text-primary">■</span> sorted</span>
        </div>
      </div>
    </div>
  );
}
