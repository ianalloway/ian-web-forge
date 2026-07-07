export const CANVAS_W = 800;
export const CANVAS_H = 480;

const SEP_R = 28;
const ALI_R = 55;
const COH_R = 90;
const SEP_W = 1.6;
const ALI_W = 1.0;
const COH_W = 0.08;
const MAX_SPEED = 130;
const MIN_SPEED = 40;
const MAX_FORCE = 90;
const MARGIN = 50;
const EDGE_FORCE = 260;

export interface Boid {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function createBoids(n: number): Boid[] {
  const boids: Boid[] = [];
  for (let i = 0; i < n; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED) * 0.5;
    boids.push({
      x: MARGIN + Math.random() * (CANVAS_W - MARGIN * 2),
      y: MARGIN + Math.random() * (CANVAS_H - MARGIN * 2),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
    });
  }
  return boids;
}

export function stepBoids(boids: Boid[], dt: number): void {
  const n = boids.length;
  const cdt = Math.min(dt, 0.05);
  const fx = new Float32Array(n);
  const fy = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    const b = boids[i];
    let sx = 0, sy = 0;
    let avx = 0, avy = 0, an = 0;
    let cx = 0, cy = 0, cn = 0;

    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const o = boids[j];
      const dx = o.x - b.x;
      const dy = o.y - b.y;
      const d2 = dx * dx + dy * dy;

      if (d2 < SEP_R * SEP_R) {
        const d = Math.sqrt(d2) || 0.01;
        sx -= (dx / d) * SEP_W;
        sy -= (dy / d) * SEP_W;
      }
      if (d2 < ALI_R * ALI_R) {
        avx += o.vx; avy += o.vy; an++;
      }
      if (d2 < COH_R * COH_R) {
        cx += o.x; cy += o.y; cn++;
      }
    }

    fx[i] = sx;
    fy[i] = sy;
    if (an > 0) { fx[i] += (avx / an - b.vx) * ALI_W; fy[i] += (avy / an - b.vy) * ALI_W; }
    if (cn > 0) { fx[i] += (cx / cn - b.x) * COH_W; fy[i] += (cy / cn - b.y) * COH_W; }

    // Edge avoidance
    if (b.x < MARGIN) fx[i] += EDGE_FORCE * (MARGIN - b.x) / MARGIN;
    else if (b.x > CANVAS_W - MARGIN) fx[i] -= EDGE_FORCE * (b.x - (CANVAS_W - MARGIN)) / MARGIN;
    if (b.y < MARGIN) fy[i] += EDGE_FORCE * (MARGIN - b.y) / MARGIN;
    else if (b.y > CANVAS_H - MARGIN) fy[i] -= EDGE_FORCE * (b.y - (CANVAS_H - MARGIN)) / MARGIN;

    // Clamp force magnitude
    const fmag = Math.sqrt(fx[i] * fx[i] + fy[i] * fy[i]);
    if (fmag > MAX_FORCE) {
      fx[i] = (fx[i] / fmag) * MAX_FORCE;
      fy[i] = (fy[i] / fmag) * MAX_FORCE;
    }
  }

  for (let i = 0; i < n; i++) {
    const b = boids[i];
    b.vx += fx[i] * cdt;
    b.vy += fy[i] * cdt;

    const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
    if (speed > MAX_SPEED) {
      b.vx = (b.vx / speed) * MAX_SPEED;
      b.vy = (b.vy / speed) * MAX_SPEED;
    } else if (speed < MIN_SPEED) {
      const s = speed || 1;
      b.vx = (b.vx / s) * MIN_SPEED;
      b.vy = (b.vy / s) * MIN_SPEED;
    }

    b.x += b.vx * cdt;
    b.y += b.vy * cdt;
    b.x = Math.max(1, Math.min(CANVAS_W - 1, b.x));
    b.y = Math.max(1, Math.min(CANVAS_H - 1, b.y));
  }
}

export function drawBoids(ctx: CanvasRenderingContext2D, boids: Boid[]): void {
  ctx.fillStyle = "#0d0d0d";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const SIZE = 7;
  for (const b of boids) {
    const angle = Math.atan2(b.vy, b.vx);
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(angle);
    ctx.fillStyle = "#00ff41";
    ctx.beginPath();
    ctx.moveTo(SIZE, 0);
    ctx.lineTo(-SIZE * 0.55, SIZE * 0.38);
    ctx.lineTo(-SIZE * 0.55, -SIZE * 0.38);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
