import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  PolyId,
  POLYS,
  View,
  DEFAULT_VIEW,
  renderNewton,
  zoomAt,
} from "../features/newton/fractal";

const RES = 2; // render buffer is 1/RES of display for speed

export default function Newton() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef<View>({ ...DEFAULT_VIEW });
  const polyRef = useRef<PolyId>("cube");

  const [poly, setPoly] = useState<PolyId>("cube");
  const [zoomLabel, setZoomLabel] = useState(1);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const gw = Math.max(100, Math.floor(canvas.width / RES));
    const gh = Math.max(80, Math.floor(canvas.height / RES));
    const off = document.createElement("canvas");
    off.width = gw;
    off.height = gh;
    const octx = off.getContext("2d")!;
    const img = octx.createImageData(gw, gh);
    renderNewton(img.data, gw, gh, POLYS[polyRef.current], viewRef.current);
    octx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(off, 0, 0, gw, gh, 0, 0, canvas.width, canvas.height);
    setZoomLabel(DEFAULT_VIEW.scale / viewRef.current.scale);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      render();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [render]);

  const onWheel = (e: React.WheelEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const factor = e.deltaY > 0 ? 1.2 : 1 / 1.2;
    viewRef.current = zoomAt(viewRef.current, px, py, canvas.width, canvas.height, factor);
    render();
  };

  const onClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    viewRef.current = zoomAt(
      viewRef.current,
      e.clientX - rect.left,
      e.clientY - rect.top,
      canvas.width,
      canvas.height,
      1 / 2
    );
    render();
  };

  const applyPoly = (p: PolyId) => {
    polyRef.current = p;
    setPoly(p);
    viewRef.current = { ...DEFAULT_VIEW };
    render();
  };

  const reset = () => {
    viewRef.current = { ...DEFAULT_VIEW };
    render();
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
          <span className="text-sm">newton fractal</span>
        </div>
        <div className="text-xs text-primary/40 tabular-nums">
          {POLYS[poly].label} · {zoomLabel >= 1 ? `${zoomLabel.toFixed(1)}×` : `${zoomLabel.toFixed(2)}×`}
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {(Object.keys(POLYS) as PolyId[]).map((p) => (
            <button
              key={p}
              onClick={() => applyPoly(p)}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                poly === p
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/20 text-primary/40 hover:border-primary/50 hover:text-primary/70"
              }`}
            >
              {POLYS[p].label}
            </button>
          ))}
        </div>

        <button
          onClick={reset}
          className="ml-auto px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
        >
          ↺ reset view
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas
          ref={canvasRef}
          className="block w-full h-full cursor-zoom-in"
          onWheel={onWheel}
          onClick={onClick}
        />
        <div className="absolute bottom-3 left-4 text-xs text-primary/40 pointer-events-none max-w-lg">
          each pixel is colored by which root Newton's method lands on — scroll or click to zoom into the fractal boundary between basins
        </div>
      </div>
    </div>
  );
}
