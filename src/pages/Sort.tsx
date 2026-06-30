import { useEffect, useReducer } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BarChart2, Play, Pause, Shuffle } from "lucide-react";
import MatrixRain from "@/components/MatrixRain";
import { Button } from "@/components/ui/button";
import {
  ALGO_IDS,
  ALGO_LABELS,
  generateSteps,
  type AlgoId,
  type SortStep,
} from "@/features/sort/algorithms";

type Speed = "slow" | "medium" | "fast";

interface State {
  algo: AlgoId;
  baseArr: number[];
  steps: SortStep[];
  stepIdx: number;
  status: "idle" | "playing" | "done";
  speed: Speed;
}

type Action =
  | { type: "setAlgo"; algo: AlgoId }
  | { type: "shuffle"; arr: number[] }
  | { type: "setSpeed"; speed: Speed }
  | { type: "play" }
  | { type: "pause" }
  | { type: "tick" };

const SPEED_CONFIG: Record<Speed, { interval: number; stepsPerTick: number }> =
  {
    slow: { interval: 80, stepsPerTick: 1 },
    medium: { interval: 20, stepsPerTick: 1 },
    fast: { interval: 16, stepsPerTick: 10 },
  };

const DEFAULT_SIZE = 30;
const MAX_VAL = 100;

function makeArr(size: number): number[] {
  return Array.from({ length: size }, (_, i) =>
    Math.round(((i + 1) / size) * MAX_VAL),
  );
}

function shuffled(arr: number[]): number[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

const INITIAL_ARR = shuffled(makeArr(DEFAULT_SIZE));

function initState(): State {
  const baseArr = [...INITIAL_ARR];
  return {
    algo: "bubble",
    baseArr,
    steps: generateSteps(baseArr, "bubble"),
    stepIdx: 0,
    status: "idle",
    speed: "medium",
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "setAlgo": {
      const steps = generateSteps(state.baseArr, action.algo);
      return { ...state, algo: action.algo, steps, stepIdx: 0, status: "idle" };
    }
    case "shuffle": {
      const steps = generateSteps(action.arr, state.algo);
      return {
        ...state,
        baseArr: action.arr,
        steps,
        stepIdx: 0,
        status: "idle",
      };
    }
    case "setSpeed":
      return { ...state, speed: action.speed };
    case "play":
      if (state.status === "done") return state;
      return { ...state, status: "playing" };
    case "pause":
      return { ...state, status: "idle" };
    case "tick": {
      const { stepsPerTick } = SPEED_CONFIG[state.speed];
      const next = Math.min(state.stepIdx + stepsPerTick, state.steps.length - 1);
      const done = next >= state.steps.length - 1;
      return { ...state, stepIdx: next, status: done ? "done" : "playing" };
    }
    default:
      return state;
  }
}

export default function Sort() {
  const [state, dispatch] = useReducer(reducer, undefined, initState);
  const { status, speed, steps, stepIdx, algo } = state;

  useEffect(() => {
    if (status !== "playing") return;
    const { interval } = SPEED_CONFIG[speed];
    const id = setInterval(() => dispatch({ type: "tick" }), interval);
    return () => clearInterval(id);
  }, [status, speed]);

  const currentStep = steps[stepIdx];
  const { arr, hi } = currentStep;
  const maxVal = Math.max(...arr);

  const handleShuffle = () => {
    const base = shuffled(makeArr(DEFAULT_SIZE));
    dispatch({ type: "shuffle", arr: base });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <MatrixRain />

      <main className="relative z-10 max-w-3xl mx-auto px-4 py-8 md:py-12">
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
          <p className="text-xs font-mono text-primary/80">
            ianalloway.xyz/sort
          </p>
        </div>

        <header className="mb-6">
          <p className="inline-block px-2 py-1 text-xs font-mono text-primary terminal-border mb-3">
            SIM
          </p>
          <h1 className="text-3xl md:text-4xl font-mono font-bold matrix-text text-primary mb-2">
            Sort Visualizer
          </h1>
          <p className="text-sm text-muted-foreground font-mono">
            Watch five classic sorting algorithms race through the same shuffled
            array — step by step.
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

        {/* Controls row */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <button
            onClick={handleShuffle}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-primary/40 text-primary/80 rounded hover:border-primary hover:text-primary transition-colors"
          >
            <Shuffle size={12} />
            shuffle
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
              onClick={() => dispatch({ type: "play" })}
              disabled={status === "done"}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-primary text-primary rounded hover:bg-primary/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play size={12} />
              play
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

        {/* Bar chart */}
        <div className="relative rounded-xl border border-primary/30 bg-card/40 backdrop-blur-sm p-4">
          <div
            className="flex items-end gap-px"
            style={{ height: "220px" }}
            aria-label="Sorting visualizer"
          >
            {arr.map((v, i) => {
              const isHi = hi && (hi[0] === i || hi[1] === i);
              return (
                <div
                  key={i}
                  className={`flex-1 ${isHi ? "bg-yellow-400" : "bg-primary"}`}
                  style={{ height: `${(v / maxVal) * 100}%` }}
                />
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-3 flex items-center justify-between text-xs font-mono text-muted-foreground">
          <span>
            step{" "}
            <span className="text-primary">{stepIdx}</span>
            {" / "}
            {steps.length - 1}
          </span>
          <span className="flex items-center gap-1.5">
            <BarChart2 size={11} className="text-primary/60" />
            {status === "done" ? (
              <span className="text-primary">sorted!</span>
            ) : status === "playing" ? (
              <span>running</span>
            ) : stepIdx === 0 ? (
              <span>press play</span>
            ) : (
              <span>paused</span>
            )}
          </span>
        </div>

        <p className="mt-6 text-xs font-mono text-muted-foreground text-center">
          yellow bars = current comparison · shuffle resets · speed adjusts mid-run
        </p>
      </main>
    </div>
  );
}
