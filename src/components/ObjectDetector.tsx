import { useEffect, useRef, useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

interface Detection {
  bbox: [number, number, number, number]; // [x, y, width, height]
  class: string;
  score: number;
}

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
];

function colorForClass(cls: string): string {
  let hash = 0;
  for (let i = 0; i < cls.length; i++) hash = cls.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function ObjectDetector() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading-model' | 'requesting-camera' | 'running' | 'error'>('idle');
  const [error, setError] = useState('');
  const [detections, setDetections] = useState<Detection[]>([]);
  const [fps, setFps] = useState(0);

  // Load the model once on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatus('loading-model');
      try {
        await tf.ready();
        const m = await cocoSsd.load({ base: 'mobilenet_v2' });
        if (!cancelled) {
          setModel(m);
          setStatus('idle');
        }
      } catch (e) {
        if (!cancelled) {
          setError('Failed to load model: ' + (e as Error).message);
          setStatus('error');
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const drawDetections = useCallback((dets: Detection[], canvas: HTMLCanvasElement, video: HTMLVideoElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const det of dets) {
      const [x, y, w, h] = det.bbox;
      const color = colorForClass(det.class);
      const label = `${det.class} ${Math.round(det.score * 100)}%`;

      // Box
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);

      // Label background
      ctx.font = 'bold 14px Inter, sans-serif';
      const textW = ctx.measureText(label).width;
      ctx.fillStyle = color;
      ctx.fillRect(x, y - 22, textW + 8, 22);

      // Label text
      ctx.fillStyle = '#000';
      ctx.fillText(label, x + 4, y - 6);
    }
  }, []);

  const startDetection = useCallback(async () => {
    if (!model) return;
    setStatus('requesting-camera');
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      setStatus('running');

      let lastTime = performance.now();
      let frames = 0;

      const loop = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          const dets = (await model.detect(video)) as Detection[];
          setDetections(dets);
          drawDetections(dets, canvasRef.current, video);
          frames++;
          const now = performance.now();
          if (now - lastTime >= 1000) {
            setFps(Math.round((frames * 1000) / (now - lastTime)));
            frames = 0;
            lastTime = now;
          }
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch (e) {
      setError('Camera error: ' + (e as Error).message);
      setStatus('error');
    }
  }, [model, drawDetections]);

  const stopDetection = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    setDetections([]);
    setFps(0);
    setStatus('idle');
  }, []);

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  const isRunning = status === 'running';
  const isLoading = status === 'loading-model' || status === 'requesting-camera';

  return (
    <div className="flex flex-col gap-6">
      {/* Video + Canvas overlay */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl">
        <video
          ref={videoRef}
          className="w-full block"
          muted
          playsInline
          style={{ display: isRunning ? 'block' : 'none' }}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ display: isRunning ? 'block' : 'none' }}
        />
        {!isRunning && (
          <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
            {status === 'loading-model' ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-cyan-400">Loading COCO-SSD model…</span>
              </div>
            ) : (
              <span className="text-gray-600">Camera feed will appear here</span>
            )}
          </div>
        )}
        {isRunning && (
          <div className="absolute top-3 right-3 bg-black/60 text-xs text-green-400 px-2 py-1 rounded-full font-mono">
            {fps} fps
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-3 justify-center">
        {!isRunning ? (
          <button
            onClick={startDetection}
            disabled={isLoading || !model}
            className="px-6 py-2.5 rounded-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold transition-colors text-sm"
          >
            {isLoading ? 'Starting…' : model ? 'Start Camera' : 'Loading model…'}
          </button>
        ) : (
          <button
            onClick={stopDetection}
            className="px-6 py-2.5 rounded-full bg-red-500 hover:bg-red-400 text-white font-semibold transition-colors text-sm"
          >
            Stop
          </button>
        )}
      </div>

      {error && (
        <p className="text-red-400 text-sm text-center bg-red-400/10 rounded-xl px-4 py-2">{error}</p>
      )}

      {/* Detection list */}
      {isRunning && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {detections.length === 0 ? (
            <p className="col-span-full text-center text-gray-600 text-sm py-4">No objects detected yet…</p>
          ) : (
            detections.map((d, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2 text-sm"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: colorForClass(d.class) }}
                />
                <span className="text-white font-medium truncate">{d.class}</span>
                <span className="ml-auto text-gray-400 text-xs font-mono">{Math.round(d.score * 100)}%</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
