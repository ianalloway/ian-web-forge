export interface HarmonoParams {
  fx: number; // x frequency
  fy: number; // y frequency
  detune: number; // small offset added to fx — makes the figure precess
  phase: number; // phase offset on x, radians
  damping: number; // exponential decay rate; 0 = pure lissajous
}

export const DEFAULT_HARMONO: HarmonoParams = {
  fx: 3,
  fy: 2,
  detune: 0.004,
  phase: Math.PI / 2,
  damping: 0.0006,
};

export interface CurvePoint {
  x: number; // in [-1, 1]
  y: number;
}

/** Parametric harmonograph point at time t (t in radians-ish units). */
export function pointAt(t: number, p: HarmonoParams): CurvePoint {
  const decay = Math.exp(-p.damping * t);
  return {
    x: Math.sin((p.fx + p.detune) * t + p.phase) * decay,
    y: Math.sin(p.fy * t) * decay,
  };
}

/** Figure is effectively finished when the decay envelope is tiny. */
export function isFinished(t: number, p: HarmonoParams): boolean {
  if (p.damping <= 0) return t > 400; // pure lissajous closes; stop after plenty of cycles
  return Math.exp(-p.damping * t) < 0.01;
}

export interface Preset {
  label: string;
  params: HarmonoParams;
}

export const PRESETS: Preset[] = [
  { label: "3:2", params: { fx: 3, fy: 2, detune: 0.004, phase: Math.PI / 2, damping: 0.0006 } },
  { label: "5:4", params: { fx: 5, fy: 4, detune: 0.003, phase: Math.PI / 2, damping: 0.0005 } },
  { label: "7:5", params: { fx: 7, fy: 5, detune: 0.002, phase: Math.PI / 3, damping: 0.0004 } },
  { label: "1:1 ring", params: { fx: 1, fy: 1, detune: 0.008, phase: Math.PI / 2, damping: 0.0008 } },
  { label: "8:3", params: { fx: 8, fy: 3, detune: 0.0015, phase: 0, damping: 0.0004 } },
];

export function randomParams(): HarmonoParams {
  const ratios = [
    [2, 1], [3, 2], [4, 3], [5, 3], [5, 4], [7, 4], [7, 5], [8, 5], [9, 7],
  ];
  const [a, b] = ratios[Math.floor(Math.random() * ratios.length)];
  const flip = Math.random() < 0.5;
  return {
    fx: flip ? b : a,
    fy: flip ? a : b,
    detune: 0.001 + Math.random() * 0.008,
    phase: Math.random() * Math.PI,
    damping: 0.0002 + Math.random() * 0.001,
  };
}
