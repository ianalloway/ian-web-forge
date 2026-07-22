export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface LorenzParams {
  sigma: number;
  rho: number;
  beta: number;
}

export const DEFAULT_LORENZ: LorenzParams = { sigma: 10, rho: 28, beta: 8 / 3 };

/** Lorenz derivatives. */
function deriv(p: Vec3, c: LorenzParams): Vec3 {
  return {
    x: c.sigma * (p.y - p.x),
    y: p.x * (c.rho - p.z) - p.y,
    z: p.x * p.y - c.beta * p.z,
  };
}

/** One RK4 step of size dt. */
export function stepRK4(p: Vec3, c: LorenzParams, dt: number): Vec3 {
  const k1 = deriv(p, c);
  const k2 = deriv({ x: p.x + k1.x * dt / 2, y: p.y + k1.y * dt / 2, z: p.z + k1.z * dt / 2 }, c);
  const k3 = deriv({ x: p.x + k2.x * dt / 2, y: p.y + k2.y * dt / 2, z: p.z + k2.z * dt / 2 }, c);
  const k4 = deriv({ x: p.x + k3.x * dt, y: p.y + k3.y * dt, z: p.z + k3.z * dt }, c);
  return {
    x: p.x + (dt / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x),
    y: p.y + (dt / 6) * (k1.y + 2 * k2.y + 2 * k3.y + k4.y),
    z: p.z + (dt / 6) * (k1.z + 2 * k2.z + 2 * k3.z + k4.z),
  };
}

/** Rotate a point around the vertical (z) axis then project to 2D. */
export function project(
  p: Vec3,
  angle: number,
  scale: number,
  cx: number,
  cy: number
): { x: number; y: number; depth: number } {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const rx = p.x * cos - p.y * sin;
  const ry = p.x * sin + p.y * cos;
  // Lorenz z is roughly 0..50; center it. Use rx horizontally, z vertically.
  return {
    x: cx + rx * scale,
    y: cy - (p.z - 25) * scale,
    depth: ry, // for depth-based shading
  };
}

export function randomStart(): Vec3 {
  return {
    x: (Math.random() - 0.5) * 2,
    y: (Math.random() - 0.5) * 2,
    z: 20 + Math.random() * 10,
  };
}
