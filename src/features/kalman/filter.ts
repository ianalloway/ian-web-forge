// A 2D constant-velocity Kalman filter tracking a maneuvering target.
//
// The target's true position is never observed. All the filter ever sees is a
// noisy position fix, and from that stream alone it recovers position AND
// velocity — the velocity is never measured, it falls out of the model.
//
//   predict:  x ← F·x            P ← F·P·Fᵀ + Q
//   update:   y ← z − H·x        S ← H·P·Hᵀ + R
//             K ← P·Hᵀ·S⁻¹       x ← x + K·y      P ← (I − K·H)·P
//
// State is [px, py, vx, vy]; the measurement is [px, py]. Q is the discrete
// white-noise-acceleration model: it encodes "the target may accelerate by
// about q units/s² between frames", which is the knob that trades tracking lag
// against noise rejection.

export type Mat = number[][];
export type Vec = number[];

// ── Small dense linear algebra (4×4 at most, clarity over speed) ─────────────

export function identity(n: number): Mat {
  const m: Mat = [];
  for (let i = 0; i < n; i++) {
    m.push(new Array(n).fill(0));
    m[i][i] = 1;
  }
  return m;
}

export function mul(a: Mat, b: Mat): Mat {
  const rows = a.length;
  const inner = b.length;
  const cols = b[0].length;
  const out: Mat = [];
  for (let i = 0; i < rows; i++) {
    const row = new Array(cols).fill(0);
    for (let k = 0; k < inner; k++) {
      const aik = a[i][k];
      if (aik === 0) continue;
      for (let j = 0; j < cols; j++) row[j] += aik * b[k][j];
    }
    out.push(row);
  }
  return out;
}

export function mulVec(a: Mat, v: Vec): Vec {
  return a.map((row) => row.reduce((s, x, j) => s + x * v[j], 0));
}

export function transpose(a: Mat): Mat {
  return a[0].map((_, j) => a.map((row) => row[j]));
}

export function add(a: Mat, b: Mat): Mat {
  return a.map((row, i) => row.map((x, j) => x + b[i][j]));
}

export function sub(a: Mat, b: Mat): Mat {
  return a.map((row, i) => row.map((x, j) => x - b[i][j]));
}

// Closed-form inverse of a 2×2 — the only inverse a 2D measurement needs.
export function inv2(m: Mat): Mat {
  const det = m[0][0] * m[1][1] - m[0][1] * m[1][0];
  const d = Math.abs(det) < 1e-12 ? (det < 0 ? -1e-12 : 1e-12) : det;
  return [
    [m[1][1] / d, -m[0][1] / d],
    [-m[1][0] / d, m[0][0] / d],
  ];
}

// ── Model matrices ───────────────────────────────────────────────────────────

// Measurement matrix: we observe position, never velocity.
export const H: Mat = [
  [1, 0, 0, 0],
  [0, 1, 0, 0],
];

// Constant-velocity transition over a timestep dt.
export function buildF(dt: number): Mat {
  return [
    [1, 0, dt, 0],
    [0, 1, 0, dt],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ];
}

// Discrete white-noise acceleration: an unknown constant acceleration of scale
// q acting over dt, projected onto position and velocity.
export function buildQ(dt: number, q: number): Mat {
  const v = q * q;
  const a = (dt ** 4 / 4) * v;
  const b = (dt ** 3 / 2) * v;
  const c = dt * dt * v;
  return [
    [a, 0, b, 0],
    [0, a, 0, b],
    [b, 0, c, 0],
    [0, b, 0, c],
  ];
}

export interface Estimate {
  x: Vec; // [px, py, vx, vy]
  P: Mat; // 4×4 covariance
}

export function newEstimate(px: number, py: number, spread: number): Estimate {
  const P = identity(4);
  P[0][0] = P[1][1] = spread * spread;
  P[2][2] = P[3][3] = spread * spread;
  return { x: [px, py, 0, 0], P };
}

export function predict(e: Estimate, dt: number, q: number): Estimate {
  const F = buildF(dt);
  return {
    x: mulVec(F, e.x),
    P: add(mul(mul(F, e.P), transpose(F)), buildQ(dt, q)),
  };
}

export interface UpdateResult {
  estimate: Estimate;
  innovation: [number, number]; // measurement minus prediction
  gain: number; // K[0][0] — how much the filter trusts this fix
}

export function update(e: Estimate, z: [number, number], r: number): UpdateResult {
  const Ht = transpose(H);
  const PHt = mul(e.P, Ht);
  const S = add(mul(H, PHt), [
    [r * r, 0],
    [0, r * r],
  ]);
  const K = mul(PHt, inv2(S));
  const yx = z[0] - e.x[0];
  const yy = z[1] - e.x[1];
  const x = e.x.map((xi, i) => xi + K[i][0] * yx + K[i][1] * yy);
  const P = mul(sub(identity(4), mul(K, H)), e.P);
  return { estimate: { x, P }, innovation: [yx, yy], gain: K[0][0] };
}

// The positional uncertainty ellipse: eigen-decomposition of the top-left 2×2
// block of P, returned as semi-axes (in units of one sigma) and a tilt.
export function uncertaintyEllipse(P: Mat): { major: number; minor: number; angle: number } {
  const a = P[0][0];
  const b = P[0][1];
  const c = P[1][1];
  const half = (a + c) / 2;
  const diff = Math.sqrt(((a - c) / 2) ** 2 + b * b);
  const l1 = Math.max(half + diff, 1e-9);
  const l2 = Math.max(half - diff, 1e-9);
  const angle = Math.abs(b) < 1e-12 ? (a >= c ? 0 : Math.PI / 2) : Math.atan2(l1 - a, b);
  return { major: Math.sqrt(l1), minor: Math.sqrt(l2), angle };
}

// ── The target being tracked ────────────────────────────────────────────────

export const WORLD = 100; // square world, in arbitrary units

export interface Scenario {
  id: string;
  label: string;
  note: string;
  speed: number; // units per second
  turn: (t: number) => number; // commanded turn rate, radians per second
}

export const SCENARIOS: Scenario[] = [
  {
    id: "cruise",
    label: "cruise",
    note: "lazy turns — easy tracking, the filter barely lags",
    speed: 14,
    turn: (t) => 0.3 * Math.sin(t * 0.23),
  },
  {
    id: "weave",
    label: "weave",
    note: "steady slalom — a constant-velocity model is always a step behind",
    speed: 15,
    turn: (t) => 0.9 * Math.sin(t * 0.8),
  },
  {
    id: "orbit",
    label: "orbit",
    note: "a sustained turn — watch the estimate ride the inside of the arc",
    speed: 16,
    turn: () => 0.55,
  },
  {
    id: "jink",
    label: "jink",
    note: "sudden hard breaks — the case that punishes too little process noise",
    speed: 18,
    turn: (t) => (Math.sin(t * 0.55) > 0.55 ? 1.6 : Math.sin(t * 0.9) < -0.8 ? -1.6 : 0.05),
  },
];

export interface Target {
  x: number;
  y: number;
  vx: number;
  vy: number;
  heading: number;
  t: number;
}

export function newTarget(scenario: Scenario): Target {
  const heading = Math.PI / 5;
  return {
    x: WORLD * 0.38,
    y: WORLD * 0.56,
    vx: Math.cos(heading) * scenario.speed,
    vy: Math.sin(heading) * scenario.speed,
    heading,
    t: 0,
  };
}

function wrapAngle(a: number): number {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

// How hard the target may bank to stay on screen, in radians per second. It is
// deliberately gentler than any scenario's own turn rate: if the containment
// banked harder than the maneuver being demonstrated, every scenario would
// secretly become a hard-maneuver scenario.
// Containment turns the target back on an arc of a fixed radius, whatever its
// speed, so no scenario is secretly a harder maneuver than the one it advertises.
const CONTAIN_RADIUS = 0.26; // soft boundary, as a fraction of the world
const CONTAIN_ARC = 2.0; // turn-back arc radius, relative to the soft boundary

// Advance the true target. Past a soft radius its commanded turn is blended into
// a turn back toward the middle, which keeps every scenario on screen without
// teleporting (a jump would be a model violation the filter could never be
// expected to handle). The blend replaces the command rather than adding to it,
// so a scenario that turns hard cannot out-steer its own containment.
export function stepTarget(target: Target, scenario: Scenario, dt: number): Target {
  const t = target.t + dt;
  let turn = scenario.turn(t);

  const c = WORLD / 2;
  const fromCenter = Math.hypot(target.x - c, target.y - c);
  const over = fromCenter / (WORLD * CONTAIN_RADIUS) - 1;
  if (over > 0) {
    const toCenter = Math.atan2(c - target.y, c - target.x);
    const err = wrapAngle(toCenter - target.heading);
    const rate = (CONTAIN_ARC * scenario.speed) / (WORLD * CONTAIN_RADIUS);
    const contain = Math.sign(err) * Math.min(rate, Math.abs(err) * 1.5);
    const blend = Math.min(1, over * 6);
    turn = turn * (1 - blend) + contain * blend;
  }

  let heading = target.heading + turn * dt;
  heading = wrapAngle(heading);

  const vx = Math.cos(heading) * scenario.speed;
  const vy = Math.sin(heading) * scenario.speed;
  return { x: target.x + vx * dt, y: target.y + vy * dt, vx, vy, heading, t };
}

// Box-Muller, so the sensor noise really is Gaussian — the assumption the
// filter's optimality rests on.
export function gauss(): number {
  let u = 0;
  while (u === 0) u = Math.random();
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export interface Sensor {
  sigma: number; // measurement standard deviation, in world units
  dropout: number; // probability a frame returns no fix at all
}

export function measure(target: Target, sensor: Sensor): [number, number] | null {
  if (Math.random() < sensor.dropout) return null;
  return [target.x + gauss() * sensor.sigma, target.y + gauss() * sensor.sigma];
}

// ── Running error accounting ────────────────────────────────────────────────

export interface Errors {
  n: number;
  sumSqMeasure: number; // only counts frames that produced a fix
  nMeasure: number;
  sumSqEstimate: number;
  dropped: number;
}

export function newErrors(): Errors {
  return { n: 0, sumSqMeasure: 0, nMeasure: 0, sumSqEstimate: 0, dropped: 0 };
}

export function rmse(sumSq: number, n: number): number {
  return n === 0 ? 0 : Math.sqrt(sumSq / n);
}

export interface Frame {
  truth: Target;
  measurement: [number, number] | null;
  estimate: Estimate;
  estimateError: number;
  measureError: number | null;
}

// One full cycle: move the truth, take a (possibly missing) fix, predict, and
// correct. With no fix the filter simply coasts on the prediction and its
// covariance grows — the clearest demonstration of what the model buys you.
export function stepFilter(
  truth: Target,
  estimate: Estimate,
  scenario: Scenario,
  sensor: Sensor,
  q: number,
  dt: number,
  errors: Errors
): Frame {
  const nextTruth = stepTarget(truth, scenario, dt);
  const z = measure(nextTruth, sensor);

  let next = predict(estimate, dt, q);
  if (z) next = update(next, z, sensor.sigma).estimate;

  const estimateError = Math.hypot(next.x[0] - nextTruth.x, next.x[1] - nextTruth.y);
  const measureError = z ? Math.hypot(z[0] - nextTruth.x, z[1] - nextTruth.y) : null;

  errors.n++;
  errors.sumSqEstimate += estimateError * estimateError;
  if (measureError == null) {
    errors.dropped++;
  } else {
    errors.nMeasure++;
    errors.sumSqMeasure += measureError * measureError;
  }

  return { truth: nextTruth, measurement: z, estimate: next, estimateError, measureError };
}
