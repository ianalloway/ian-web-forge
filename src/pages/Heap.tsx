import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  HeapStep,
  extractAnim,
  heapify,
  heapifyAnim,
  heapsortAnim,
  insertAnim,
  isHeap,
  left,
  randomValues,
  right,
} from "../features/heap/heap";

const MAX = 31; // keeps the tree to five readable levels
const TICK_MS = 55;

export default function Heap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heapRef = useRef<number[]>([]);
  const animRef = useRef<Generator<HeapStep, unknown> | null>(null);
  const stepRef = useRef<HeapStep>({ active: [], compare: [], sorted: 0 });
  const minRef = useRef(false);
  const runningRef = useRef(false);
  const speedRef = useRef(2);

  const [min, setMin] = useState(false);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [size, setSize] = useState(0);
  const [status, setStatus] = useState("heap");

  const sync = useCallback(() => {
    const arr = heapRef.current;
    setSize(arr.length);
    if (animRef.current !== null) setStatus("working");
    else if (arr.length === 0) setStatus("empty");
    else setStatus(isHeap(arr, minRef.current) ? "heap" : "sorted");
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: W, height: H } = canvas;
    const arr = heapRef.current;
    const n = arr.length;
    const { active, compare, sorted } = stepRef.current;
    const isActive = (i: number) => active.includes(i);
    const isCompare = (i: number) => compare.includes(i);
    const isSorted = (i: number) => i >= n - sorted;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    // ── Tree ───────────────────────────────────────────────────────────────
    const depth = (i: number) => Math.floor(Math.log2(i + 1));
    const maxD = n ? depth(n - 1) : 0;
    const top = 44;
    const treeH = H - 150;
    const levelH = maxD > 0 ? Math.min(90, treeH / maxD) : 0;
    const nodeX = (i: number) => {
      const d = depth(i);
      const countAtLevel = 2 ** d;
      const pos = i - (2 ** d - 1);
      return ((pos + 0.5) / countAtLevel) * (W - 48) + 24;
    };
    const nodeY = (i: number) => top + depth(i) * levelH;
    const radius = Math.max(9, Math.min(20, (W - 48) / (2 ** maxD) / 2.4));

    // edges
    ctx.strokeStyle = "rgba(0,255,65,0.18)";
    ctx.lineWidth = 1;
    for (let i = 0; i < n; i++) {
      for (const c of [left(i), right(i)]) {
        if (c < n) {
          ctx.beginPath();
          ctx.moveTo(nodeX(i), nodeY(i));
          ctx.lineTo(nodeX(c), nodeY(c));
          ctx.stroke();
        }
      }
    }
    // nodes
    ctx.font = `${Math.round(radius * 0.9)}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 0; i < n; i++) {
      const x = nodeX(i);
      const y = nodeY(i);
      let fill = "rgba(0,255,65,0.14)";
      let stroke = "rgba(0,255,65,0.5)";
      let text = "#9effb8";
      if (isSorted(i)) {
        fill = "rgba(255,255,255,0.04)";
        stroke = "rgba(255,255,255,0.18)";
        text = "rgba(255,255,255,0.3)";
      }
      if (isCompare(i)) {
        stroke = "#ffe066";
      }
      if (isActive(i)) {
        fill = "#00ff41";
        stroke = "#00ff41";
        text = "#02150a";
      }
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.lineWidth = isActive(i) || isCompare(i) ? 2.5 : 1;
      ctx.strokeStyle = stroke;
      ctx.stroke();
      ctx.fillStyle = text;
      ctx.fillText(String(arr[i]), x, y + 1);
    }

    // ── Array view ─────────────────────────────────────────────────────────
    const cell = Math.min(34, (W - 48) / Math.max(1, n));
    const ax0 = 24;
    const ay = H - 76;
    ctx.textBaseline = "middle";
    for (let i = 0; i < n; i++) {
      const x = ax0 + i * cell;
      let fill = "rgba(0,255,65,0.08)";
      let text = "#9effb8";
      if (isSorted(i)) {
        fill = "rgba(255,255,255,0.03)";
        text = "rgba(255,255,255,0.3)";
      }
      if (isCompare(i)) fill = "rgba(255,224,102,0.18)";
      if (isActive(i)) {
        fill = "#00ff41";
        text = "#02150a";
      }
      ctx.fillStyle = fill;
      ctx.fillRect(x, ay, cell - 1.5, cell - 1.5);
      ctx.strokeStyle = "rgba(0,255,65,0.2)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, ay + 0.5, cell - 1.5, cell - 1.5);
      ctx.fillStyle = text;
      ctx.font = `${Math.round(cell * 0.4)}px monospace`;
      ctx.fillText(String(arr[i]), x + (cell - 1.5) / 2, ay + (cell - 1.5) / 2);
      if (cell > 22) {
        ctx.fillStyle = "rgba(255,255,255,0.22)";
        ctx.font = "9px monospace";
        ctx.fillText(String(i), x + (cell - 1.5) / 2, ay + cell + 7);
      }
    }
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "11px monospace";
    ctx.fillText("array — parent(i) = ⌊(i−1)/2⌋, children 2i+1 and 2i+2", ax0, ay - 12);
  }, []);

  const start = useCallback(
    (g: Generator<HeapStep, unknown>) => {
      animRef.current = g;
      runningRef.current = true;
      setRunning(true);
      setStatus("working");
    },
    []
  );

  // animation loop: advance the active generator `speed` steps per tick
  useEffect(() => {
    const id = setInterval(() => {
      const g = animRef.current;
      if (!g || !runningRef.current) return;
      for (let k = 0; k < speedRef.current; k++) {
        const r = g.next();
        if (r.done) {
          animRef.current = null;
          runningRef.current = false;
          setRunning(false);
          sync();
          break;
        }
        stepRef.current = r.value;
      }
      draw();
    }, TICK_MS);
    return () => clearInterval(id);
  }, [draw, sync]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      if (heapRef.current.length === 0) {
        heapRef.current = randomValues(14);
        heapify(heapRef.current, minRef.current);
      }
      sync();
      draw();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [draw, sync]);

  const idle = () => animRef.current === null;

  const doInsert = () => {
    if (!idle() || heapRef.current.length >= MAX) return;
    stepRef.current = { active: [], compare: [], sorted: 0 };
    start(insertAnim(heapRef.current, 1 + Math.floor(Math.random() * 98), minRef.current));
  };
  const doExtract = () => {
    if (!idle() || heapRef.current.length === 0) return;
    stepRef.current = { active: [], compare: [], sorted: 0 };
    start(extractAnim(heapRef.current, minRef.current));
  };
  const doBuild = () => {
    if (!idle()) return;
    heapRef.current = randomValues(18 + Math.floor(Math.random() * 8));
    stepRef.current = { active: [], compare: [], sorted: 0 };
    start(heapifyAnim(heapRef.current, minRef.current));
    sync();
  };
  const doSort = () => {
    if (!idle() || heapRef.current.length === 0) return;
    stepRef.current = { active: [], compare: [], sorted: 0 };
    start(heapsortAnim(heapRef.current, minRef.current));
  };
  const toggleMin = () => {
    if (!idle()) return;
    const nv = !minRef.current;
    minRef.current = nv;
    setMin(nv);
    heapify(heapRef.current, nv);
    stepRef.current = { active: [], compare: [], sorted: 0 };
    sync();
    draw();
  };

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/lab" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← lab
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">binary heap — {min ? "min" : "max"}</span>
        </div>
        <div className="text-xs text-primary/40 flex gap-4 tabular-nums">
          <span>{size} nodes</span>
          <span className={status === "heap" ? "text-primary" : "text-primary/40"}>
            {status === "heap" ? "✓ heap" : status === "working" ? "working…" : status === "sorted" ? "sorted" : "empty"}
          </span>
        </div>
      </div>

      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-3">
        <button
          onClick={toggleMin}
          title="switch heap order (re-heapifies)"
          className="px-2.5 py-1 text-xs border border-primary/40 text-primary hover:bg-primary/10 transition-colors"
        >
          {min ? "min-heap" : "max-heap"}
        </button>
        <div className="flex gap-2">
          <button onClick={doInsert} className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors">
            + insert
          </button>
          <button onClick={doExtract} className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors">
            ⤒ extract top
          </button>
          <button onClick={doBuild} className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors">
            ⚄ build (heapify)
          </button>
          <button onClick={doSort} className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors">
            ↡ heapsort
          </button>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => {
              runningRef.current = !running;
              setRunning(!running);
            }}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            {running ? "⏸ pause" : "▶ resume"}
          </button>
          <span className="text-primary/40 text-xs">speed</span>
          <input
            type="range"
            min={1}
            max={12}
            value={speed}
            onChange={(e) => {
              const v = Number(e.target.value);
              setSpeed(v);
              speedRef.current = v;
            }}
            className="w-20 accent-primary"
          />
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute bottom-2 right-4 text-xs text-primary/30 pointer-events-none max-w-md text-right">
          green = moving · amber = comparing · every parent beats its children · heapsort peels the root to the tail
        </div>
      </div>
    </div>
  );
}
