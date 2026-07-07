import { useCallback, useEffect, useReducer, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Navigation, Pause, Play, Shuffle, Trash2 } from "lucide-react";
import MatrixRain from "@/components/MatrixRain";
import { Button } from "@/components/ui/button";
import {
  COLS,
  ROWS,
  generateAstarSteps,
  generateBfsSteps,
  key,
  type PathfindStep,
} from "@/features/pathfind/grid";

type AlgoId = "bfs" | "astar";
type Speed = "slow" | "medium" | "fast";
type Status = "idle" | "playing" | "done";

const ALGO_LABELS: Record<AlgoId, string> = { bfs: "BFS", astar: "A★" };
const ALGO_IDS: AlgoId[] = ["bfs", "astar"];

const SPEED_CONFIG: Record<Speed, { interval: number; stepsPerTick: number }> = {
  slow: { interval: 80, stepsPerTick: 1 },
  medium: { interval: 20, stepsPerTick: 1 },
  fast: { interval: 16, stepsPerTick: 6 },
};

const DEFAULT_START = key(Math.floor(ROWS / 2), 2);
const DEFAULT_END = key(Math.floor(ROWS / 2), COLS - 3);

interface State {
  walls: Set<string>;
  start: string;
  end: string;
  algo: AlgoId;
  steps: PathfindStep[];
  stepIdx: number;
  status: Status;
  speed: Speed;
}

type Action =
  | { type: "addWall"; pos: string }
  | { type: "removeWall"; pos: string }
  | { type: "setWalls"; walls: Set<string> }
  | { type: "setAlgo"; algo: AlgoId }
  | { type: "setSpeed"; speed: Speed }
  | { type: "play" }
  | { type: "pause" }
  | { type: "tick" }
  | { type: "reset" };

function initState(): State {
  return {
    walls: new Set<string>(),
    start: DEFAULT_START,
    end: DEFAULT_END,
    algo: "bfs",
    steps: [],
    stepIdx: 0,
    status: "idle",
    speed: "medium",
  };
}

function buildSteps(state: Pick<State, "walls" | "start" | "end" | "algo">): PathfindStep[] {
  return state.algo === "bfs"
    ? generateBfsSteps(state.walls, state.start, state.end)
    : generateAstarSteps(state.walls, state.start, state.end);
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "addWall": {
      if (action.pos === state.start || action.pos === state.end) return state;
      if (state.walls.has(action.pos)) return state;
      const walls = new Set(state.walls);
      walls.add(action.pos);
      return { ...state, walls, steps: [], stepIdx: 0, status: "idle" };
    }
    case "removeWall": {
      if (!state.walls.has(action.pos)) return state;
      const walls = new Set(state.walls);
      walls.delete(action.pos);
      return { ...state, walls, steps: [], stepIdx: 0, status: "idle" };
    }
    case "setWalls":
      return { ...state, walls: action.walls, steps: [], stepIdx: 0, status: "idle" };
    case "setAlgo":
      return { ...state, algo: action.algo, steps: [], stepIdx: 0, status: "idle" };
    case "setSpeed":
      return { ...state, speed: action.speed };
    case "play": {
      if (state.status === "done") return state;
      const steps = state.steps.length > 0 ? state.steps : buildSteps(state);
      return { ...state, steps, status: "playing" };
    }
    case "pause":
      return { ...state, status: "idle" };
    case "tick": {
      const { stepsPerTick } = SPEED_CONFIG[state.speed];
      const next = Math.min(state.stepIdx + stepsPerTick, state.steps.length - 1);
      const step = state.steps[next];
      if (step?.done || next >= state.steps.length - 1) {
        return { ...state, stepIdx: next, status: "done" };
      }
      return { ...state, stepIdx: next };
    }
    case "reset":
      return { ...state, steps: [], stepIdx: 0, status: "idle" };
    default:
      return state;
  }
}

export default function Pathfind() {
  const [state, dispatch] = useReducer(reducer, undefined, initState);
  const { walls, start, end, algo, steps, stepIdx, status, speed } = state;

  const isDrawingRef = useRef(false);
  const drawModeRef = useRef<"paint" | "erase">("paint");
  const wallsRef = useRef(walls);
  useEffect(() => { wallsRef.current = walls; }, [walls]);

  useEffect(() => {
    if (status !== "playing") return;
    const { interval } = SPEED_CONFIG[speed];
    const id = setInterval(() => dispatch({ type: "tick" }), interval);
    return () => clearInterval(id);
  }, [status, speed]);

  useEffect(() => {
    const up = () => { isDrawingRef.current = false; };
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, []);

  const handleCellDown = useCallback((pos: string) => {
    if (pos === start || pos === end) return;
    isDrawingRef.current = true;
    drawModeRef.current = wallsRef.current.has(pos) ? "erase" : "paint";
    if (drawModeRef.current === "paint") dispatch({ type: "addWall", pos });
    else dispatch({ type: "removeWall", pos });
  }, [start, end]);

  const handleCellEnter = useCallback((pos: string) => {
    if (!isDrawingRef.current) return;
    if (pos === start || pos === end) return;
    if (drawModeRef.current === "paint") dispatch({ type: "addWall", pos });
    else dispatch({ type: "removeWall", pos });
  }, [start, end]);

  const handleRandomize = useCallback(() => {
    const newWalls = new Set<string>();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const k = key(r, c);
        if (k !== start && k !== end && Math.random() < 0.28) {
          newWalls.add(k);
        }
      }
    }
    dispatch({ type: "setWalls", walls: newWalls });
  }, [start, end]);

  const currentStep = steps[stepIdx];
  const visitedSet = currentStep ? new Set(currentStep.visited) : new Set<string>();
  const frontierSet = currentStep ? new Set(currentStep.frontier) : new Set<string>();
  const pathSet = currentStep ? new Set(currentStep.path) : new Set<string>();

  const statusLabel = (() => {
    if (status === "done") return currentStep?.found ? "path found!" : "no path";
    if (status === "playing") return "searching…";
    if (stepIdx > 0) return "paused";
    return "press play";
  })();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <MatrixRain />

      <main className="relative z-10 max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="outline"
            className="font-mono terminal-border text-primary border-primary"
            asChild
          >
            <Link to="/playground">
              <ArrowLeft className="mr-2" />
              Playground
            </Link>
          </Button>
          <p className="text-xs font-mono text-primary/80">ianalloway.xyz/pathfind</p>
        </div>

        <header className="mb-6">
          <p className="inline-block px-2 py-1 text-xs font-mono text-primary terminal-border mb-3">
            SIM
          </p>
          <h1 className="text-3xl md:text-4xl font-mono font-bold matrix-text text-primary mb-2">
            Pathfinding
          </h1>
          <p className="text-sm text-muted-foreground font-mono">
            Draw walls by clicking and dragging, then watch BFS or A&#x2605; find the shortest path.
          </p>
        </header>

        {/* Algorithm picker */}
        <div className="flex flex-wrap gap-2 mb-4">
          {ALGO_IDS.map((id) => (
            <button
              key={id}
              onClick={() => dispatch({ type: "setAlgo", algo: id })}
              className={`px-3 py-1 text-xs font-mono border rounded transition-colors ${
                algo === id
                  ? "border-primary text-primary bg-primary/10"
                  : "border-primary/30 text-primary/60 hover:border-primary/60 hover:text-primary/80"
              }`}
            >
              {ALGO_LABELS[id]}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <button
            onClick={handleRandomize}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-primary/40 text-primary/80 rounded hover:border-primary hover:text-primary transition-colors"
          >
            <Shuffle size={12} />
            randomize
          </button>
          <button
            onClick={() => dispatch({ type: "setWalls", walls: new Set() })}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-primary/40 text-primary/80 rounded hover:border-primary hover:text-primary transition-colors"
          >
            <Trash2 size={12} />
            clear
          </button>

          {status === "playing" ? (
            <button
              onClick={() => dispatch({ type: "pause" })}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-primary text-primary rounded hover:bg-primary/10 transition-colors"
            >
              <Pause size={12} />
              pause
            </button>
          ) : (
            <button
              onClick={() => dispatch({ type: status === "done" ? "reset" : "play" })}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-primary text-primary rounded hover:bg-primary/10 transition-colors"
            >
              <Play size={12} />
              {status === "done" ? "reset" : "play"}
            </button>
          )}

          <div className="flex items-center gap-1 ml-auto">
            {(["slow", "medium", "fast"] as Speed[]).map((s) => (
              <button
                key={s}
                onClick={() => dispatch({ type: "setSpeed", speed: s })}
                className={`px-2.5 py-1 text-xs font-mono border rounded transition-colors ${
                  speed === s
                    ? "border-primary text-primary bg-primary/10"
                    : "border-primary/30 text-primary/50 hover:text-primary/80 hover:border-primary/50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div
          className="rounded-xl border border-primary/30 bg-card/40 backdrop-blur-sm p-2 select-none overflow-hidden"
          onMouseLeave={() => { isDrawingRef.current = false; }}
        >
          <div
            className="grid gap-px w-full"
            style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: ROWS * COLS }, (_, i) => {
              const r = Math.floor(i / COLS);
              const c = i % COLS;
              const pos = key(r, c);
              const isStart = pos === start;
              const isEnd = pos === end;
              const isWall = walls.has(pos);
              const isPath = pathSet.has(pos) && !isStart && !isEnd;
              const isFrontier = !isPath && frontierSet.has(pos) && !isStart && !isEnd;
              const isVisited = !isPath && !isFrontier && visitedSet.has(pos) && !isStart && !isEnd;

              let bg = "bg-card/20";
              if (isWall) bg = "bg-primary";
              else if (isStart) bg = "bg-emerald-500";
              else if (isEnd) bg = "bg-red-500";
              else if (isPath) bg = "bg-yellow-400";
              else if (isFrontier) bg = "bg-primary/50";
              else if (isVisited) bg = "bg-primary/20";

              return (
                <div
                  key={pos}
                  className={`aspect-square ${bg} cursor-crosshair`}
                  onMouseDown={(e) => { e.preventDefault(); handleCellDown(pos); }}
                  onMouseEnter={() => handleCellEnter(pos)}
                />
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-3 flex items-center justify-between text-xs font-mono text-muted-foreground">
          <span>
            step <span className="text-primary">{stepIdx}</span>
            {steps.length > 0 && <> / {steps.length - 1}</>}
          </span>
          <span className="flex items-center gap-1.5">
            <Navigation size={11} className="text-primary/60" />
            <span className={status === "done" && currentStep?.found ? "text-primary" : ""}>
              {statusLabel}
            </span>
          </span>
        </div>

        <p className="mt-6 text-xs font-mono text-muted-foreground text-center">
          click &amp; drag to draw walls &middot;{" "}
          <span className="text-emerald-500/80">&#x25A0;</span> start &middot;{" "}
          <span className="text-red-400/80">&#x25A0;</span> end &middot;{" "}
          <span className="text-yellow-400/80">&#x25A0;</span> path
        </p>
      </main>
    </div>
  );
}
