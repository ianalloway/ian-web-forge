export interface Boid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hue: number; // small per-boid tint variation
}

export interface FlockParams {
  cohesion: number; // pull toward local center of mass
  alignment: number; // match neighbors' heading
  separation: number; // avoid crowding
  perception: number; // neighbor radius in px
  maxSpeed: number;
}

export const DEFAULT_PARAMS: FlockParams = {
  cohesion: 0.5,
  alignment: 0.5,
  separation: 0.7,
  perception: 60,
  maxSpeed: 3.2,
};

const SEPARATION_RADIUS = 24;
const MOUSE_FLEE_RADIUS = 90;
const MOUSE_FLEE_FORCE = 0.6;
const EDGE_MARGIN = 40;
const EDGE_TURN = 0.12;

export function makeFlock(n: number, w: number, h: number): Boid[] {
  return Array.from({ length: n }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 1.5;
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      hue: 90 + Math.random() * 60, // green band
    };
  });
}

export function stepFlock(
  boids: Boid[],
  w: number,
  h: number,
  params: FlockParams,
  mouse: { x: number; y: number } | null
): void {
  const { cohesion, alignment, separation, perception, maxSpeed } = params;
  const perception2 = perception * perception;
  const sep2 = SEPARATION_RADIUS * SEPARATION_RADIUS;
  const flee2 = MOUSE_FLEE_RADIUS * MOUSE_FLEE_RADIUS;

  for (let i = 0; i < boids.length; i++) {
    const b = boids[i];
    let cx = 0, cy = 0; // center of mass
    let ax = 0, ay = 0; // average velocity
    let sx = 0, sy = 0; // separation push
    let count = 0;

    for (let j = 0; j < boids.length; j++) {
      if (i === j) continue;
      const o = boids[j];
      const dx = o.x - b.x;
      const dy = o.y - b.y;
      const d2 = dx * dx + dy * dy;
      if (d2 > perception2) continue;
      cx += o.x; cy += o.y;
      ax += o.vx; ay += o.vy;
      count++;
      if (d2 < sep2 && d2 > 0) {
        const inv = 1 / d2;
        sx -= dx * inv;
        sy -= dy * inv;
      }
    }

    if (count > 0) {
      // Cohesion: steer toward center of mass
      b.vx += ((cx / count - b.x) / perception) * 0.1 * cohesion;
      b.vy += ((cy / count - b.y) / perception) * 0.1 * cohesion;
      // Alignment: nudge velocity toward flock average
      b.vx += (ax / count - b.vx) * 0.08 * alignment;
      b.vy += (ay / count - b.vy) * 0.08 * alignment;
    }
    // Separation
    b.vx += sx * 8 * separation;
    b.vy += sy * 8 * separation;

    // Flee the cursor
    if (mouse) {
      const dx = b.x - mouse.x;
      const dy = b.y - mouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < flee2 && d2 > 0) {
        const d = Math.sqrt(d2);
        const f = (1 - d / MOUSE_FLEE_RADIUS) * MOUSE_FLEE_FORCE;
        b.vx += (dx / d) * f;
        b.vy += (dy / d) * f;
      }
    }

    // Soft-turn away from edges
    if (b.x < EDGE_MARGIN) b.vx += EDGE_TURN;
    if (b.x > w - EDGE_MARGIN) b.vx -= EDGE_TURN;
    if (b.y < EDGE_MARGIN) b.vy += EDGE_TURN;
    if (b.y > h - EDGE_MARGIN) b.vy -= EDGE_TURN;

    // Clamp speed (min keeps them gliding, max keeps them stable)
    const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
    if (speed > maxSpeed) {
      b.vx = (b.vx / speed) * maxSpeed;
      b.vy = (b.vy / speed) * maxSpeed;
    } else if (speed < 0.8 && speed > 0) {
      b.vx = (b.vx / speed) * 0.8;
      b.vy = (b.vy / speed) * 0.8;
    }

    b.x += b.vx;
    b.y += b.vy;

    // Hard clamp as a fallback (e.g. after resize)
    b.x = Math.max(0, Math.min(w, b.x));
    b.y = Math.max(0, Math.min(h, b.y));
  }
}
