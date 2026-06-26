import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Pause, Play, RotateCcw, Shuffle, SkipForward, Trash2 } from "lucide-react";
import MatrixRain from "@/components/MatrixRain";
import { Button } from "@/components/ui/button";
import {
  GRID_COLUMNS,
  GRID_ROWS,
  PATTERN_LABELS,
  type LifeGrid,
  type PatternName,
  clearGrid,
  createGrid,
  placePattern,
  randomize,
  step,
  toggleCell,
} from "@/features/life/life";

const SPEEDS = [
  { label: "0.5×", ms: 220 },
  { label: "1×", ms: 110 },
  { label: "2×", ms: 55 },
  { label: "4×", ms: 28 },
] as const;

const PATTERN_ORDER: PatternName[] = [
  "glider",
  "lwss",
  "blinker",
  "pulsar",
  "gosper_glider_gun",
];

export default function Life() {
  const [grid, setGrid] = useState<LifeGrid>(() =>
    placePattern(createGrid(), "gosper_glider_gun"),
  );
  const [running, setRunning] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(1);
  const [wrap, setWrap] = useState(true);

  useEffect(() => {
    if (!running) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setGrid((current) => step(current, { wrap }));
    }, SPEEDS[speedIndex].ms);

    return () => window.clearInterval(timerId);
  }, [running, speedIndex, wrap]);

  const handleStep = useCallback(() => {
    setRunning(false);
    setGrid((current) => step(current, { wrap }));
  }, [wrap]);

  const handleToggleCell = useCallback((x: number, y: number) => {
    setRunning(false);
    setGrid((current) => toggleCell(current, x, y));
  }, []);

  const handlePattern = useCallback((name: PatternName) => {
    setRunning(false);
    setGrid((current) => placePattern(createGrid({ columns: current.columns, rows: current.rows }), name));
  }, []);

  const handleRandomize = useCallback(() => {
    setRunning(false);
    setGrid((current) => randomize(current));
  }, []);

  const handleClear = useCallback(() => {
    setRunning(false);
    setGrid((current) => clearGrid(current));
  }, []);

  const cells = grid.cells;
  const gridStyle = useMemo(
    () => ({ gridTemplateColumns: `repeat(${grid.columns}, minmax(0, 1fr))` }),
    [grid.columns],
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <MatrixRain />

      <main className="relative z-10 max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" className="font-mono terminal-border text-primary border-primary" asChild>
            <Link to="/demos">
              <ArrowLeft className="mr-2" />
              Back to demos
            </Link>
          </Button>
          <p className="text-xs font-mono text-primary/80">ianalloway.xyz/life</p>
        </div>

        <section className="terminal-border rounded-xl bg-card/55 backdrop-blur-sm p-5 md:p-8">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="inline-block px-2 py-1 text-xs font-mono text-primary terminal-border mb-3">
                PLAYABLE_DEMO
              </p>
              <h1 className="text-3xl md:text-4xl font-mono font-bold matrix-text text-primary mb-3">
                Game of Life
              </h1>
              <p className="max-w-2xl text-sm md:text-base text-muted-foreground font-mono leading-relaxed">
                Conway&apos;s cellular automaton, running the classic B3/S23 rules. Click cells to
                draw, drop in a seed pattern, then press play and watch the colony evolve. The grid
                wraps at the edges by default, so gliders loop forever.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm font-mono min-w-[220px]">
              <div className="rounded-lg border border-primary/30 bg-background/70 p-3">
                <div className="text-primary/70 text-xs mb-1">GENERATION</div>
                <div className="text-primary text-2xl font-bold" aria-live="off">
                  {grid.generation}
                </div>
              </div>
              <div className="rounded-lg border border-primary/30 bg-background/70 p-3">
                <div className="text-primary/70 text-xs mb-1">POPULATION</div>
                <div className="text-primary text-2xl font-bold" aria-live="off">
                  {grid.population}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-start">
            <div className="rounded-xl border border-primary/30 bg-background/70 p-3 md:p-4">
              <div
                className="grid gap-px rounded-lg bg-primary/15 p-px"
                style={gridStyle}
                role="grid"
                aria-label="Game of Life board"
              >
                {cells.map((alive, index) => {
                  const x = index % grid.columns;
                  const y = Math.floor(index / grid.columns);
                  return (
                    <button
                      key={index}
                      type="button"
                      role="gridcell"
                      aria-label={`Cell ${x + 1}, ${y + 1} ${alive ? "alive" : "dead"}`}
                      aria-pressed={alive}
                      onClick={() => handleToggleCell(x, y)}
                      className={`aspect-square rounded-[1px] transition-colors duration-75 ${
                        alive
                          ? "bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.7)]"
                          : "bg-muted/40 hover:bg-primary/30"
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-primary/30 bg-background/70 p-4">
                <div className="flex flex-wrap gap-3">
                  <Button
                    className="font-mono flex-1 min-w-[120px]"
                    onClick={() => setRunning((value) => !value)}
                  >
                    {running ? (
                      <>
                        <Pause className="mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="mr-2" />
                        Play
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="font-mono terminal-border text-primary border-primary flex-1 min-w-[120px]"
                    onClick={handleStep}
                  >
                    <SkipForward className="mr-2" />
                    Step
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    className="font-mono terminal-border text-primary border-primary flex-1 min-w-[120px]"
                    onClick={handleRandomize}
                  >
                    <Shuffle className="mr-2" />
                    Random
                  </Button>
                  <Button
                    variant="outline"
                    className="font-mono terminal-border text-primary border-primary flex-1 min-w-[120px]"
                    onClick={handleClear}
                  >
                    <Trash2 className="mr-2" />
                    Clear
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-primary/30 bg-background/70 p-4">
                <h2 className="text-sm font-mono text-primary mb-3">SPEED</h2>
                <div className="grid grid-cols-4 gap-2">
                  {SPEEDS.map((speed, index) => (
                    <Button
                      key={speed.label}
                      variant={index === speedIndex ? "default" : "outline"}
                      className={`font-mono px-0 ${
                        index === speedIndex ? "" : "terminal-border text-primary border-primary"
                      }`}
                      onClick={() => setSpeedIndex(index)}
                    >
                      {speed.label}
                    </Button>
                  ))}
                </div>
                <label className="mt-4 flex items-center gap-2 text-xs font-mono text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wrap}
                    onChange={(event) => setWrap(event.target.checked)}
                    className="accent-primary h-4 w-4"
                  />
                  Wrap edges (toroidal grid)
                </label>
              </div>

              <div className="rounded-xl border border-primary/30 bg-background/70 p-4">
                <h2 className="text-sm font-mono text-primary mb-3">PATTERNS</h2>
                <div className="flex flex-col gap-2">
                  {PATTERN_ORDER.map((name) => (
                    <Button
                      key={name}
                      variant="outline"
                      className="font-mono terminal-border text-primary border-primary justify-start"
                      onClick={() => handlePattern(name)}
                    >
                      {PATTERN_LABELS[name]}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-primary/30 bg-background/70 p-4">
                <h2 className="text-sm font-mono text-primary mb-2">THE RULES</h2>
                <ul className="space-y-2 text-xs text-muted-foreground font-mono leading-relaxed">
                  <li>Live cell with 2–3 neighbours survives</li>
                  <li>Dead cell with exactly 3 neighbours is born</li>
                  <li>All other cells die or stay empty</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
