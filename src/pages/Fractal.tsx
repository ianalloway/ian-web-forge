import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Aperture, ArrowLeft, RotateCcw } from "lucide-react";
import MatrixRain from "@/components/MatrixRain";
import { Button } from "@/components/ui/button";
import {
  CANVAS_H,
  CANVAS_W,
  COLOR_MODES,
  DEFAULT_VIEW,
  pixelToComplex,
  renderMandelbrot,
  zoomToward,
  type ColorMode,
  type ViewState,
} from "@/features/fractal/mandelbrot";

const ITER_OPTIONS = [50, 100, 200, 300];

export default function Fractal() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mutable refs — source of truth for rendering (avoids stale closures)
  const viewRef = useRef<ViewState>(DEFAULT_VIEW);
  const maxIterRef = useRef(100);
  const colorModeRef = useRef<ColorMode>("green");

  // State for UI display only
  const [maxIter, setMaxIter] = useState(100);
  const [colorMode, setColorMode] = useState<ColorMode>("green");
  const [zoomDisplay, setZoomDisplay] = useState(1);
  const [coords, setCoords] = useState<string | null>(null);

  const renderNow = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderMandelbrot(ctx, viewRef.current, maxIterRef.current, colorModeRef.current);
    setZoomDisplay(viewRef.current.zoom / DEFAULT_VIEW.zoom);
  }, []);

  // Initial render
  useEffect(() => { renderNow(); }, [renderNow]);

  // Drag state refs
  const dragRef = useRef<{ px: number; py: number; cx: number; cy: number } | null>(null);
  const hasDraggedRef = useRef(false);

  const getCanvasPx = (e: React.MouseEvent | React.WheelEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    return {
      px: (e.clientX - rect.left) * (CANVAS_W / rect.width),
      py: (e.clientY - rect.top) * (CANVAS_H / rect.height),
    };
  };

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    const { px, py } = getCanvasPx(e, e.currentTarget);
    dragRef.current = { px, py, cx: viewRef.current.cx, cy: viewRef.current.cy };
    hasDraggedRef.current = false;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const { px, py } = getCanvasPx(e, e.currentTarget);
    const [re, im] = pixelToComplex(px, py, viewRef.current);
    setCoords(
      `${re >= 0 ? "+" : ""}${re.toFixed(6)}  ${im >= 0 ? "+" : ""}${im.toFixed(6)}i`
    );

    if (!dragRef.current) return;
    const dx = px - dragRef.current.px;
    const dy = py - dragRef.current.py;
    if (!hasDraggedRef.current && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
      hasDraggedRef.current = true;
    }
    if (hasDraggedRef.current) {
      viewRef.current = {
        ...viewRef.current,
        cx: dragRef.current.cx - dx / viewRef.current.zoom,
        cy: dragRef.current.cy - dy / viewRef.current.zoom,
      };
      renderNow();
    }
  }, [renderNow]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!hasDraggedRef.current) {
      const { px, py } = getCanvasPx(e, e.currentTarget);
      const factor = e.button === 2 ? 0.5 : 2;
      viewRef.current = zoomToward(px, py, factor, viewRef.current);
      renderNow();
    }
    dragRef.current = null;
    hasDraggedRef.current = false;
  }, [renderNow]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { px, py } = getCanvasPx(e, e.currentTarget);
    const factor = e.deltaY < 0 ? 1.4 : 1 / 1.4;
    viewRef.current = zoomToward(px, py, factor, viewRef.current);
    renderNow();
  }, [renderNow]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => e.preventDefault(), []);

  const handleMouseLeave = useCallback(() => {
    dragRef.current = null;
    hasDraggedRef.current = false;
    setCoords(null);
  }, []);

  const handleMaxIter = useCallback((n: number) => {
    maxIterRef.current = n;
    setMaxIter(n);
    renderNow();
  }, [renderNow]);

  const handleColorMode = useCallback((m: ColorMode) => {
    colorModeRef.current = m;
    setColorMode(m);
    renderNow();
  }, [renderNow]);

  const handleReset = useCallback(() => {
    viewRef.current = DEFAULT_VIEW;
    maxIterRef.current = 100;
    colorModeRef.current = "green";
    setMaxIter(100);
    setColorMode("green");
    renderNow();
  }, [renderNow]);

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
          <p className="text-xs font-mono text-primary/80">ianalloway.xyz/fractal</p>
        </div>

        <header className="mb-6">
          <p className="inline-block px-2 py-1 text-xs font-mono text-primary terminal-border mb-3">
            SIM
          </p>
          <h1 className="text-3xl md:text-4xl font-mono font-bold matrix-text text-primary mb-2 flex items-center gap-3">
            <Aperture size={32} className="opacity-80" />
            Fractal Explorer
          </h1>
          <p className="text-sm text-muted-foreground font-mono">
            Mandelbrot set — scroll or click to zoom, drag to pan, right-click to zoom out.
          </p>
        </header>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex items-center gap-1">
            <span className="text-xs font-mono text-primary/60 mr-1">palette</span>
            {COLOR_MODES.map((m) => (
              <button
                key={m}
                onClick={() => handleColorMode(m)}
                className={`px-2 py-1 text-xs font-mono rounded border transition-colors ${
                  m === colorMode
                    ? "border-primary text-primary"
                    : "border-primary/30 text-primary/50 hover:border-primary/60 hover:text-primary/70"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs font-mono text-primary/60 mr-1">iter</span>
            {ITER_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => handleMaxIter(n)}
                className={`px-2 py-1 text-xs font-mono rounded border transition-colors ${
                  n === maxIter
                    ? "border-primary text-primary"
                    : "border-primary/30 text-primary/50 hover:border-primary/60 hover:text-primary/70"
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          <button
            onClick={handleReset}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-primary/40 text-primary/80 rounded hover:border-primary hover:text-primary transition-colors"
          >
            <RotateCcw size={12} />
            reset
          </button>
        </div>

        {/* Status bar */}
        <div className="mb-2 h-5 flex items-center gap-4 text-xs font-mono text-muted-foreground">
          {coords ? (
            <>
              <span className="text-primary/60">{coords}</span>
              <span className="text-primary/40">
                ×{zoomDisplay < 10 ? zoomDisplay.toFixed(1) : Math.round(zoomDisplay).toLocaleString()}
              </span>
            </>
          ) : (
            <span>scroll to zoom · click = zoom in · right-click = zoom out · drag to pan</span>
          )}
        </div>

        {/* Canvas */}
        <div className="rounded-xl border border-primary/40 overflow-hidden">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="w-full block cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onWheel={handleWheel}
            onContextMenu={handleContextMenu}
          />
        </div>

        <div className="mt-5 grid sm:grid-cols-3 gap-3 text-xs font-mono text-muted-foreground">
          <div className="rounded-lg border border-primary/20 bg-card/30 px-3 py-2">
            <span className="text-primary">iteration depth</span>
            <p className="mt-0.5 leading-relaxed">higher iter reveals boundary detail in deep zooms — slower per frame</p>
          </div>
          <div className="rounded-lg border border-primary/20 bg-card/30 px-3 py-2">
            <span className="text-primary">escape speed</span>
            <p className="mt-0.5 leading-relaxed">color encodes how quickly z² + c diverges to ∞ from each point</p>
          </div>
          <div className="rounded-lg border border-primary/20 bg-card/30 px-3 py-2">
            <span className="text-primary">the set</span>
            <p className="mt-0.5 leading-relaxed">dark pixels never escape — infinite self-similar complexity hides at every scale</p>
          </div>
        </div>
      </main>
    </div>
  );
}
