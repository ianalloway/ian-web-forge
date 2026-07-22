import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  MicAnalyser,
  startMic,
  stopMic,
  heatColor,
  peakHz,
} from "../features/spectrum/analyser";

type Status = "idle" | "running" | "error";

export default function Spectrum() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const micRef = useRef<MicAnalyser | null>(null);
  const rafRef = useRef(0);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [peak, setPeak] = useState(0);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (micRef.current) {
      stopMic(micRef.current);
      micRef.current = null;
    }
    setStatus("idle");
    setPeak(0);
  }, []);

  useEffect(() => () => stop(), [stop]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const mic = micRef.current;
    if (!canvas || !mic) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: W, height: H } = canvas;

    const specH = Math.floor(H * 0.68); // scrolling spectrogram
    const barTop = specH + 8;
    const barH = H - barTop;

    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      mic.analyser.getByteFrequencyData(mic.freq);
      const bins = mic.freq.length;

      // Scroll spectrogram left by 1px, draw newest column at right
      ctx.drawImage(canvas, 0, 0, W, specH, -1, 0, W, specH);
      const col = W - 1;
      for (let y = 0; y < specH; y++) {
        // Map y (top = high freq) to a log-ish bin for musical spacing
        const frac = 1 - y / specH;
        const bin = Math.min(bins - 1, Math.floor(Math.pow(frac, 2) * bins));
        const [r, g, b] = heatColor(mic.freq[bin]);
        ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
        ctx.fillRect(col, y, 1, 1);
      }

      // Live bar spectrum along the bottom
      ctx.fillStyle = "#000";
      ctx.fillRect(0, barTop, W, barH);
      const barCount = 96;
      const bw = W / barCount;
      for (let i = 0; i < barCount; i++) {
        const frac = i / barCount;
        const bin = Math.min(bins - 1, Math.floor(Math.pow(frac, 2) * bins));
        const v = mic.freq[bin] / 255;
        const h = v * barH;
        ctx.fillStyle = `hsl(${140 - v * 90}, 100%, ${40 + v * 25}%)`;
        ctx.fillRect(i * bw, barTop + barH - h, bw - 1, h);
      }

      // Divider
      ctx.strokeStyle = "rgba(0,255,65,0.2)";
      ctx.beginPath();
      ctx.moveTo(0, specH + 4);
      ctx.lineTo(W, specH + 4);
      ctx.stroke();

      const hz = peakHz(mic.freq, mic.ctx.sampleRate, bins);
      setPeak(hz);
    };
    loop();
  }, []);

  const start = async () => {
    setError("");
    try {
      const mic = await startMic();
      micRef.current = mic;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      setStatus("running");
      draw();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not access the microphone.");
      setStatus("error");
    }
  };

  // Size the canvas to its container
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      const ctx = canvas.getContext("2d");
      if (ctx) { ctx.fillStyle = "#000"; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">spectrogram</span>
        </div>
        <div className="text-xs text-primary/40 tabular-nums">
          {status === "running" && peak > 0 && `peak ~${Math.round(peak)} Hz`}
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex items-center gap-3">
        {status !== "running" ? (
          <button
            onClick={start}
            className="px-3 py-1 text-xs border border-primary/50 bg-primary/10 hover:border-primary text-primary transition-colors"
          >
            🎙 start microphone
          </button>
        ) : (
          <button
            onClick={stop}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ⏹ stop
          </button>
        )}
        <span className="text-xs text-primary/30">
          {status === "idle" && "grant mic access — whistle or hum to see the harmonics"}
          {status === "running" && "spectrogram scrolls left · bars show the live spectrum"}
          {status === "error" && <span className="text-red-400">{error}</span>}
        </span>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        {status !== "running" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-primary/20 text-sm">microphone idle</span>
          </div>
        )}
        <div className="absolute bottom-1 left-4 text-xs text-primary/30 pointer-events-none">
          audio never leaves your device — the FFT runs entirely in the browser
        </div>
      </div>
    </div>
  );
}
