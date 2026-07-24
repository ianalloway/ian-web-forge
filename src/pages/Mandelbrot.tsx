import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  HOME,
  View,
  color,
  escape,
  iterationsFor,
  pixelToComplex,
} from "../features/mandelbrot/mandelbrot";

// Render at a fraction of device resolution for speed, then upscale.
const SS = 0.6;

export default function Mandelbrot() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef<View>({ ...HOME });
  const imgRef = useRef<ImageData | null>(null);
  const rowRef = useRef(0); // next scanline to compute (progressive)
  const rwRef = useRef(0); // render buffer width
  const rhRef = useRef(0); // render buffer height
  const phaseRef = useRef(0);
  const offRef = useRef<HTMLCanvasElement | null>(null);

  const [zoom, setZoom] = useState(1);
  const [rendering, setRendering] = useState(true);

  // Restart the progressive render from the top scanline.
  const restart = useCallback(() => {
    rowRef.current = 0;
    setRendering(true);
    setZoom(HOME.scale / viewRef.current.scale);
  }, []);

  const zoomAt = useCallback(
    (px: number, py: number, factor: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const v = viewRef.current;
      // Keep the point under the cursor fixed while scaling.
      const target = pixelToComplex(px, py, canvas.width, canvas.height, v);
      const ns = v.scale * factor;
      viewRef.current = {
        scale: ns,
        cx: target.x - (px - canvas.width / 2) * ns,
        cy: target.y - (py - canvas.height / 2) * ns,
      };
      restart();
    },
    [restart]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;

    const off = document.createElement("canvas");
    offRef.current = off;
    const offCtx = off.getContext("2d");
    if (!offCtx) return;

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      const rw = Math.max(2, Math.round(rect.width * SS));
      const rh = Math.max(2, Math.round(rect.height * SS));
      rwRef.current = rw;
      rhRef.current = rh;
      off.width = rw;
      off.height = rh;
      imgRef.current = offCtx.createImageData(rw, rh);
      restart();
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const img = imgRef.current;
      if (!img) return;
      const rw = rwRef.current;
      const rh = rhRef.current;
      const v = viewRef.current;
      const maxIter = iterationsFor(v.scale);
      const phase = phaseRef.current;
      const data = img.data;

      // The render buffer maps onto the full canvas, so scale complex coords
      // by the ratio between display pixels and buffer pixels.
      const step = v.scale / SS;
      const halfW = rw / 2;
      const halfH = rh / 2;

      // Compute a batch of scanlines per frame to stay responsive.
      if (rowRef.current < rh) {
        const budget = Math.min(rh - rowRef.current, Math.max(2, Math.round(rh / 24)));
        for (let n = 0; n < budget; n++) {
          const py = rowRef.current;
          const y = v.cy + (py - halfH) * step;
          let o = py * rw * 4;
          for (let px = 0; px < rw; px++) {
            const x = v.cx + (px - halfW) * step;
            const m = escape(x, y, maxIter);
            const [r, g, b] = color(m, maxIter, phase);
            data[o] = r;
            data[o + 1] = g;
            data[o + 2] = b;
            data[o + 3] = 255;
            o += 4;
          }
          rowRef.current++;
        }
        if (rowRef.current >= rh) setRendering(false);
      }

      const offCanvas = offRef.current!;
      offCtx.putImageData(img, 0, 0);
      ctx.drawImage(offCanvas, 0, 0, rw, rh, 0, 0, canvas.width, canvas.height);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [restart]);

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    // Left click zooms in, shift/right zooms out.
    const factor = e.shiftKey ? 1 / 0.5 : 0.5;
    zoomAt(px, py, factor);
  };

  const reset = () => {
    viewRef.current = { ...HOME };
    restart();
  };

  const cyclePalette = () => {
    phaseRef.current = (phaseRef.current + 0.13) % 1;
    // Re-render with the new phase.
    rowRef.current = 0;
    setRendering(true);
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
          <span className="text-sm">mandelbrot set</span>
        </div>
        <div className="text-xs text-primary/40 tabular-nums">
          {zoom >= 1000 ? `${(zoom / 1000).toFixed(1)}k×` : `${zoom.toFixed(1)}×`} zoom
          {rendering ? " · rendering…" : ""}
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <span className="text-primary/30 text-xs hidden md:inline">
          click to zoom in · shift-click to zoom out
        </span>
        <div className="flex gap-2 ml-auto">
          <button
            onClick={cyclePalette}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ◈ palette
          </button>
          <button
            onClick={reset}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ↺ reset view
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas
          ref={canvasRef}
          onClick={onClick}
          onContextMenu={(e) => {
            e.preventDefault();
            const rect = e.currentTarget.getBoundingClientRect();
            zoomAt(e.clientX - rect.left, e.clientY - rect.top, 1 / 0.5);
          }}
          className="block w-full h-full cursor-crosshair"
        />
        <div className="absolute bottom-3 left-4 text-xs text-primary/40 pointer-events-none max-w-xl">
          z ↦ z² + c, iterated. black points never escape to infinity; the color of every other
          point is how fast it flees — and the boundary between them is infinitely intricate.
        </div>
      </div>
    </div>
  );
}
