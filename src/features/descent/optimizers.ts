export type SurfaceId = "bowl" | "twopits" | "ripple";

export interface Surface {
  label: string;
  f: (x: number, y: number) => number; // loss, roughly [0,1] range over [-1,1]^2
  grad: (x: number, y: number) => [number, number];
}

const gauss = (x: number, y: number, cx: number, cy: number, s: number) =>
  Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * s * s));

// Analytic gradient of a gaussian pit/bump with amplitude a
const gaussGrad = (
  x: number, y: number, cx: number, cy: number, s: number, a: number
): [number, number] => {
  const g = a * gauss(x, y, cx, cy, s);
  return [(-(x - cx) / (s * s)) * g, (-(y - cy) / (s * s)) * g];
};

export const SURFACES: Record<SurfaceId, Surface> = {
  bowl: {
    label: "Tilted bowl",
    f: (x, y) => 0.5 * (x * x + 1.8 * y * y) + 0.15 * x,
    grad: (x, y) => [x + 0.15, 1.8 * y],
  },
  twopits: {
    label: "Two pits",
    f: (x, y) =>
      0.25 * (x * x + y * y) -
      0.55 * gauss(x, y, -0.45, -0.1, 0.28) -
      0.9 * gauss(x, y, 0.5, 0.25, 0.22),
    grad: (x, y) => {
      const [g1x, g1y] = gaussGrad(x, y, -0.45, -0.1, 0.28, -0.55);
      const [g2x, g2y] = gaussGrad(x, y, 0.5, 0.25, 0.22, -0.9);
      return [0.5 * x + g1x + g2x, 0.5 * y + g1y + g2y];
    },
  },
  ripple: {
    label: "Ripples",
    f: (x, y) =>
      0.4 * (x * x + y * y) + 0.08 * Math.sin(9 * x) + 0.08 * Math.sin(9 * y),
    grad: (x, y) => [
      0.8 * x + 0.72 * Math.cos(9 * x),
      0.8 * y + 0.72 * Math.cos(9 * y),
    ],
  },
};

export type OptimizerId = "sgd" | "momentum" | "adam";

export interface OptState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mx: number;
  my: number; // Adam first moment
  sx: number;
  sy: number; // Adam second moment
  t: number;
  trail: { x: number; y: number }[];
  done: boolean;
}

export const OPTIMIZERS: Record<OptimizerId, { label: string; color: string }> = {
  sgd: { label: "SGD", color: "#00cfff" },
  momentum: { label: "Momentum", color: "#ffe066" },
  adam: { label: "Adam", color: "#ff4da6" },
};

export function newOpt(x: number, y: number): OptState {
  return { x, y, vx: 0, vy: 0, mx: 0, my: 0, sx: 0, sy: 0, t: 0, trail: [{ x, y }], done: false };
}

const BETA1 = 0.9, BETA2 = 0.999, EPS = 1e-8;
const MU = 0.9; // momentum coefficient
const TRAIL_MAX = 900;

export function stepOpt(
  o: OptState,
  id: OptimizerId,
  surface: Surface,
  lr: number
): void {
  if (o.done) return;
  const [gx, gy] = surface.grad(o.x, o.y);

  if (id === "sgd") {
    o.x -= lr * gx;
    o.y -= lr * gy;
  } else if (id === "momentum") {
    o.vx = MU * o.vx - lr * gx;
    o.vy = MU * o.vy - lr * gy;
    o.x += o.vx;
    o.y += o.vy;
  } else {
    o.t++;
    o.mx = BETA1 * o.mx + (1 - BETA1) * gx;
    o.my = BETA1 * o.my + (1 - BETA1) * gy;
    o.sx = BETA2 * o.sx + (1 - BETA2) * gx * gx;
    o.sy = BETA2 * o.sy + (1 - BETA2) * gy * gy;
    const mxh = o.mx / (1 - Math.pow(BETA1, o.t));
    const myh = o.my / (1 - Math.pow(BETA1, o.t));
    const sxh = o.sx / (1 - Math.pow(BETA2, o.t));
    const syh = o.sy / (1 - Math.pow(BETA2, o.t));
    // Adam works on a different lr scale; boost so races are fair to watch
    const alr = lr * 3;
    o.x -= (alr * mxh) / (Math.sqrt(sxh) + EPS);
    o.y -= (alr * myh) / (Math.sqrt(syh) + EPS);
  }

  // Clamp to the domain
  o.x = Math.max(-1, Math.min(1, o.x));
  o.y = Math.max(-1, Math.min(1, o.y));

  o.trail.push({ x: o.x, y: o.y });
  if (o.trail.length > TRAIL_MAX) o.trail.shift();

  // Converged when the gradient is tiny
  if (gx * gx + gy * gy < 1e-8) o.done = true;
}
