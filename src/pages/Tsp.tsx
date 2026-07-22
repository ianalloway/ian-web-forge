import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  City,
  TspEvent,
  randomCities,
  tourLength,
  solveTsp,
} from "../features/tsp/tour";

const CITY_COUNTS = [20, 40, 80];

type Phase = "idle" | "construct" | "improve" | "done";

export default function Tsp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const citiesRef = useRef<City[]>([]);
  const tourRef = useRef<number[]>([]);
  const solverRef = useRef<Generator<TspEvent> | null>(null);
  const phaseRef = useRef<Phase>("idle");
  const speedRef = useRef(4);

  const [cityCount, setCityCount] = useState(40);
  const [phase, setPhase] = useState<Phase>("idle");
  const [length, setLength] = useState(0);
  const [nnLength, setNnLength] = useState(0);
  const [speed, setSpeed] = useState(4);

  const setPhaseBoth = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cities = citiesRef.current;
    const tour = tourRef.current;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Tour edges
    if (tour.length > 1) {
      const closed = phaseRef.current === "improve" || phaseRef.current === "done";
      ctx.strokeStyle = phaseRef.current === "done" ? "#00ff41" : "rgba(0,255,65,0.6)";
      ctx.lineWidth = phaseRef.current === "done" ? 2 : 1.5;
      ctx.beginPath();
      tour.forEach((cityIdx, i) => {
        const c = cities[cityIdx];
        if (i === 0) ctx.moveTo(c.x, c.y);
        else ctx.lineTo(c.x, c.y);
      });
      if (closed) ctx.closePath();
      ctx.stroke();
    }

    // Cities
    for (const c of cities) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#00cfff";
      ctx.fill();
    }
    // Start city
    if (cities.length > 0 && tour.length > 0) {
      const s = cities[tour[0]];
      ctx.beginPath();
      ctx.arc(s.x, s.y, 6, 0, Math.PI * 2);
      ctx.strokeStyle = "#ffe066";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, []);

  const updateLength = useCallback(() => {
    if (tourRef.current.length > 1) {
      setLength(tourLength(citiesRef.current, tourRef.current));
    } else {
      setLength(0);
    }
  }, []);

  const scatter = useCallback((n: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    citiesRef.current = randomCities(n, canvas.width, canvas.height);
    tourRef.current = [];
    solverRef.current = null;
    setPhaseBoth("idle");
    setLength(0);
    setNnLength(0);
    draw();
  }, [draw, setPhaseBoth]);

  const solve = useCallback(() => {
    if (citiesRef.current.length < 3) return;
    solverRef.current = solveTsp(citiesRef.current);
    tourRef.current = [];
    setNnLength(0);
    setPhaseBoth("construct");
  }, [setPhaseBoth]);

  // Stepping loop
  useEffect(() => {
    const id = setInterval(() => {
      const solver = solverRef.current;
      if (!solver) return;
      const phase = phaseRef.current;
      if (phase !== "construct" && phase !== "improve") return;

      for (let i = 0; i < speedRef.current; i++) {
        const r = solver.next();
        if (r.done) break;
        const ev = r.value;
        if (ev.type === "extend" || ev.type === "swap") {
          tourRef.current = ev.tour;
        } else if (ev.type === "phase") {
          setPhaseBoth(ev.phase);
          if (ev.phase === "improve") {
            // NN construction just finished — record its length
            setNnLength(tourLength(citiesRef.current, tourRef.current));
          }
          if (ev.phase === "done") break;
        }
      }
      updateLength();
      draw();
    }, 30);
    return () => clearInterval(id);
  }, [draw, setPhaseBoth, updateLength]);

  // Init + resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      scatter(40);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [scatter]);

  const onClick = (e: React.MouseEvent) => {
    if (phaseRef.current === "construct" || phaseRef.current === "improve") return;
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    citiesRef.current = [
      ...citiesRef.current,
      { x: e.clientX - rect.left, y: e.clientY - rect.top },
    ];
    tourRef.current = [];
    solverRef.current = null;
    setPhaseBoth("idle");
    setLength(0);
    setNnLength(0);
    draw();
  };

  const improvementPct = nnLength > 0 && length > 0
    ? ((nnLength - length) / nnLength) * 100
    : 0;

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">traveling salesman</span>
        </div>
        <div className="text-xs text-primary/40 flex gap-4 tabular-nums">
          <span>tour {length > 0 ? Math.round(length).toLocaleString() : "—"}</span>
          {phase === "done" && nnLength > 0 && (
            <span className="text-primary">2-opt saved {improvementPct.toFixed(1)}%</span>
          )}
          <span>
            {phase === "construct" && "building greedy tour..."}
            {phase === "improve" && "untangling with 2-opt..."}
            {phase === "done" && "✓ local optimum"}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1">
          <span className="text-primary/40 text-xs mr-1">cities</span>
          {CITY_COUNTS.map((n) => (
            <button
              key={n}
              onClick={() => { setCityCount(n); scatter(n); }}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                cityCount === n
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/20 text-primary/40 hover:border-primary/50 hover:text-primary/70"
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">speed</span>
          <input
            type="range"
            min={1}
            max={20}
            value={speed}
            onChange={(e) => {
              const v = Number(e.target.value);
              speedRef.current = v;
              setSpeed(v);
            }}
            className="w-24 accent-primary"
          />
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={solve}
            disabled={phase === "construct" || phase === "improve"}
            className="px-3 py-1 text-xs border border-primary/50 bg-primary/10 hover:border-primary text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ▶ solve
          </button>
          <button
            onClick={() => scatter(cityCount)}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ⚄ new cities
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas
          ref={canvasRef}
          className="block w-full h-full cursor-crosshair"
          onClick={onClick}
        />
        <div className="absolute bottom-3 left-4 text-xs text-primary/30 pointer-events-none">
          click to add cities · greedy nearest-neighbor first, then 2-opt removes the crossings
        </div>
      </div>
    </div>
  );
}
