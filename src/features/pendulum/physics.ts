export interface PendulumState {
  th1: number; // angle of first arm from vertical (rad)
  th2: number;
  w1: number; // angular velocities
  w2: number;
}

export interface PendulumParams {
  m1: number;
  m2: number;
  l1: number; // arm lengths in px
  l2: number;
  g: number;
  damping: number; // 1 = frictionless
}

export const DEFAULT_PARAMS: PendulumParams = {
  m1: 10,
  m2: 10,
  l1: 120,
  l2: 120,
  g: 900,
  damping: 1,
};

type Deriv = [number, number, number, number];

/** Equations of motion for the ideal double pendulum. */
function derivs(s: PendulumState, p: PendulumParams): Deriv {
  const { th1, th2, w1, w2 } = s;
  const { m1, m2, l1, l2, g } = p;
  const d = th1 - th2;
  const cosD = Math.cos(d);
  const sinD = Math.sin(d);
  const denom = 2 * m1 + m2 - m2 * Math.cos(2 * d);

  const a1 =
    (-g * (2 * m1 + m2) * Math.sin(th1) -
      m2 * g * Math.sin(th1 - 2 * th2) -
      2 * sinD * m2 * (w2 * w2 * l2 + w1 * w1 * l1 * cosD)) /
    (l1 * denom);

  const a2 =
    (2 * sinD *
      (w1 * w1 * l1 * (m1 + m2) +
        g * (m1 + m2) * Math.cos(th1) +
        w2 * w2 * l2 * m2 * cosD)) /
    (l2 * denom);

  return [w1, w2, a1, a2];
}

/** One RK4 step of size dt (seconds). */
export function stepRK4(s: PendulumState, p: PendulumParams, dt: number): PendulumState {
  const add = (a: PendulumState, k: Deriv, h: number): PendulumState => ({
    th1: a.th1 + k[0] * h,
    th2: a.th2 + k[1] * h,
    w1: a.w1 + k[2] * h,
    w2: a.w2 + k[3] * h,
  });

  const k1 = derivs(s, p);
  const k2 = derivs(add(s, k1, dt / 2), p);
  const k3 = derivs(add(s, k2, dt / 2), p);
  const k4 = derivs(add(s, k3, dt), p);

  const next: PendulumState = {
    th1: s.th1 + (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
    th2: s.th2 + (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]),
    w1: (s.w1 + (dt / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2])) * p.damping,
    w2: (s.w2 + (dt / 6) * (k1[3] + 2 * k2[3] + 2 * k3[3] + k4[3])) * p.damping,
  };
  return next;
}

/** Bob positions relative to the pivot. */
export function positions(s: PendulumState, p: PendulumParams) {
  const x1 = p.l1 * Math.sin(s.th1);
  const y1 = p.l1 * Math.cos(s.th1);
  const x2 = x1 + p.l2 * Math.sin(s.th2);
  const y2 = y1 + p.l2 * Math.cos(s.th2);
  return { x1, y1, x2, y2 };
}

/** Angles from a bob position dragged to (x, y) relative to the pivot. */
export function anglesFromDrag(
  x: number,
  y: number,
  which: 1 | 2,
  s: PendulumState,
  p: PendulumParams
): PendulumState {
  if (which === 1) {
    return { th1: Math.atan2(x, y), th2: s.th2, w1: 0, w2: 0 };
  }
  const { x1, y1 } = positions(s, p);
  return { th1: s.th1, th2: Math.atan2(x - x1, y - y1), w1: 0, w2: 0 };
}

export function randomState(): PendulumState {
  return {
    th1: Math.PI / 2 + (Math.random() - 0.5) * 1.5,
    th2: Math.PI / 2 + (Math.random() - 0.5) * 2.5,
    w1: 0,
    w2: 0,
  };
}
