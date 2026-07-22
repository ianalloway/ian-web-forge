/** Classic 2D Perlin gradient noise with a seedable permutation table. */
export class Perlin {
  private perm: Uint8Array;

  constructor(seed = 1) {
    // xorshift32 PRNG for a reproducible shuffle
    let s = seed >>> 0 || 1;
    const rand = () => {
      s ^= s << 13; s >>>= 0;
      s ^= s >> 17;
      s ^= s << 5; s >>>= 0;
      return s / 0xffffffff;
    };
    const p = Array.from({ length: 256 }, (_, i) => i);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    this.perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
  }

  private static fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private static grad(hash: number, x: number, y: number): number {
    switch (hash & 3) {
      case 0: return x + y;
      case 1: return -x + y;
      case 2: return x - y;
      default: return -x - y;
    }
  }

  /** Noise in [-1, 1]. */
  noise(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = Perlin.fade(xf);
    const v = Perlin.fade(yf);
    const p = this.perm;

    const aa = p[p[X] + Y];
    const ab = p[p[X] + Y + 1];
    const ba = p[p[X + 1] + Y];
    const bb = p[p[X + 1] + Y + 1];

    const x1 = Perlin.grad(aa, xf, yf) + u * (Perlin.grad(ba, xf - 1, yf) - Perlin.grad(aa, xf, yf));
    const x2 =
      Perlin.grad(ab, xf, yf - 1) +
      u * (Perlin.grad(bb, xf - 1, yf - 1) - Perlin.grad(ab, xf, yf - 1));
    return x1 + v * (x2 - x1);
  }
}

export interface Particle {
  x: number;
  y: number;
  px: number; // previous position for line segments
  py: number;
}

export function makeParticles(n: number, w: number, h: number): Particle[] {
  return Array.from({ length: n }, () => {
    const x = Math.random() * w;
    const y = Math.random() * h;
    return { x, y, px: x, py: y };
  });
}

export interface FlowParams {
  scale: number; // noise field zoom (smaller = smoother flow)
  speed: number; // particle advection speed
  drift: number; // how fast the field evolves over time
  curl: number; // multiplier mapping noise to angle range
}

export const DEFAULT_FLOW: FlowParams = {
  scale: 0.0035,
  speed: 1.6,
  drift: 0.00012,
  curl: 2.5,
};

export function stepParticles(
  particles: Particle[],
  noise: Perlin,
  t: number,
  w: number,
  h: number,
  params: FlowParams
): void {
  const { scale, speed, drift, curl } = params;
  const z = t * drift;
  for (const p of particles) {
    // Sample the field on an evolving diagonal slice for cheap time variation
    const n = noise.noise(p.x * scale + z * 40, p.y * scale - z * 40);
    const angle = n * Math.PI * curl;
    p.px = p.x;
    p.py = p.y;
    p.x += Math.cos(angle) * speed;
    p.y += Math.sin(angle) * speed;

    // Respawn when out of bounds — keeps density uniform
    if (p.x < 0 || p.x >= w || p.y < 0 || p.y >= h) {
      p.x = Math.random() * w;
      p.y = Math.random() * h;
      p.px = p.x;
      p.py = p.y;
    }
  }
}
