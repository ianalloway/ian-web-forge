import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Pause, Play, PlusCircle, RotateCcw, Wind } from "lucide-react";
import MatrixRain from "@/components/MatrixRain";
import { Button } from "@/components/ui/button";
import {
  CANVAS_H,
  CANVAS_W,
  createBoids,
  drawBoids,
  stepBoids,
  type Boid,
} from "@/features/boids/sim";

const INITIAL_COUNT = 120;

export default function Boids() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boidsRef = useRef<Boid[]>(createBoids(INITIAL_COUNT));
  const runningRef = useRef(true);
  const lastTimeRef = useRef<number | null>(null);

  const [running, setRunning] = useState(true);
  const [count, setCount] = useState(INITIAL_COUNT);

  // rAF loop — runs once, reads runningRef to pause without restarting loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId: number;

    function loop(ts: number) {
      rafId = requestAnimationFrame(loop);
      const dt = lastTimeRef.current != null ? (ts - lastTimeRef.current) / 1000 : 0;
      lastTimeRef.current = ts;

      if (runningRef.current) {
        stepBoids(boidsRef.current, dt);
      }
      drawBoids(ctx!, boidsRef.current);
    }

    rafId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId);
      lastTimeRef.current = null;
    };
  }, []);

  const toggleRunning = useCallback(() => {
    runningRef.current = !runningRef.current;
    setRunning(runningRef.current);
  }, []);

  const handleReset = useCallback(() => {
    boidsRef.current = createBoids(INITIAL_COUNT);
    setCount(INITIAL_COUNT);
    runningRef.current = true;
    setRunning(true);
  }, []);

  const handleAdd = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const newBoids = createBoids(20);
    boidsRef.current = [...boidsRef.current, ...newBoids];
    setCount((c) => c + 20);
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;
    const angle = Math.random() * Math.PI * 2;
    const speed = 60 + Math.random() * 40;
    const newBoids: Boid[] = Array.from({ length: 8 }, () => ({
      x: cx + (Math.random() - 0.5) * 30,
      y: cy + (Math.random() - 0.5) * 30,
      vx: Math.cos(angle + (Math.random() - 0.5)) * speed,
      vy: Math.sin(angle + (Math.random() - 0.5)) * speed,
    }));
    boidsRef.current = [...boidsRef.current, ...newBoids];
    setCount((c) => c + 8);
  }, []);

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
          <p className="text-xs font-mono text-primary/80">ianalloway.xyz/boids</p>
        </div>

        <header className="mb-6">
          <p className="inline-block px-2 py-1 text-xs font-mono text-primary terminal-border mb-3">
            SIM
          </p>
          <h1 className="text-3xl md:text-4xl font-mono font-bold matrix-text text-primary mb-2">
            Boids
          </h1>
          <p className="text-sm text-muted-foreground font-mono">
            Emergent flocking from three simple rules: separation, alignment, and cohesion.
            Click the canvas to spawn more boids.
          </p>
        </header>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <button
            onClick={toggleRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-primary text-primary rounded hover:bg-primary/10 transition-colors"
          >
            {running ? <><Pause size={12} /> pause</> : <><Play size={12} /> play</>}
          </button>
          <button
            onClick={handleAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-primary/40 text-primary/80 rounded hover:border-primary hover:text-primary transition-colors"
          >
            <PlusCircle size={12} />
            +20
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-primary/40 text-primary/80 rounded hover:border-primary hover:text-primary transition-colors"
          >
            <RotateCcw size={12} />
            reset
          </button>
          <span className="ml-auto text-xs font-mono text-muted-foreground flex items-center gap-1.5">
            <Wind size={11} className="text-primary/60" />
            {count} boids
          </span>
        </div>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="w-full rounded-xl border border-primary/30 cursor-crosshair touch-none"
          onClick={handleCanvasClick}
        />

        {/* Legend */}
        <div className="mt-5 grid sm:grid-cols-3 gap-3 text-xs font-mono text-muted-foreground">
          <div className="rounded-lg border border-primary/20 bg-card/30 px-3 py-2">
            <span className="text-primary">separation</span>
            <p className="mt-0.5 leading-relaxed">steer away from neighbours that are too close</p>
          </div>
          <div className="rounded-lg border border-primary/20 bg-card/30 px-3 py-2">
            <span className="text-primary">alignment</span>
            <p className="mt-0.5 leading-relaxed">steer toward the average heading of nearby boids</p>
          </div>
          <div className="rounded-lg border border-primary/20 bg-card/30 px-3 py-2">
            <span className="text-primary">cohesion</span>
            <p className="mt-0.5 leading-relaxed">steer toward the average position of nearby boids</p>
          </div>
        </div>

        <p className="mt-4 text-xs font-mono text-muted-foreground text-center">
          click canvas to spawn · +20 to add a burst · no rules changed — just numbers
        </p>
      </main>
    </div>
  );
}
