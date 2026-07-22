export interface Rocket {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetY: number;
  hue: number;
}

export interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 1 -> 0
  decay: number;
  hue: number;
  glitter: boolean;
}

export const GRAVITY = 0.045;
export const SPARK_DRAG = 0.985;

export type BurstShape = "sphere" | "ring" | "willow";

export function launchRocket(x: number, startY: number, targetY: number): Rocket {
  return {
    x,
    y: startY,
    vx: (Math.random() - 0.5) * 0.6,
    vy: -(6.5 + Math.random() * 2.5),
    targetY,
    hue: Math.floor(Math.random() * 360),
  };
}

export function stepRocket(r: Rocket): void {
  r.x += r.vx;
  r.y += r.vy;
  r.vy += GRAVITY * 0.6; // rockets decelerate on the way up
}

export function rocketExploded(r: Rocket): boolean {
  return r.vy >= -0.5 || r.y <= r.targetY;
}

export function burst(x: number, y: number, hue: number, shape: BurstShape): Spark[] {
  const sparks: Spark[] = [];

  if (shape === "sphere") {
    const n = 70 + Math.floor(Math.random() * 40);
    for (let i = 0; i < n; i++) {
      // Uniform disk speed distribution gives a filled sphere look
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.pow(Math.random(), 0.5) * (2.6 + Math.random() * 1.2);
      sparks.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.008 + Math.random() * 0.012,
        hue: hue + Math.floor((Math.random() - 0.5) * 30),
        glitter: Math.random() < 0.25,
      });
    }
  } else if (shape === "ring") {
    const n = 60;
    const speed = 3.2 + Math.random() * 0.8;
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2;
      sparks.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.009 + Math.random() * 0.006,
        hue,
        glitter: false,
      });
    }
  } else {
    // willow: slow sparks with long life that droop under gravity
    const n = 50 + Math.floor(Math.random() * 20);
    for (let i = 0; i < n; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 1.6;
      sparks.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.5,
        life: 1,
        decay: 0.004 + Math.random() * 0.004,
        hue: 45 + Math.floor(Math.random() * 15), // golden
        glitter: Math.random() < 0.5,
      });
    }
  }
  return sparks;
}

export function stepSpark(s: Spark): void {
  s.x += s.vx;
  s.y += s.vy;
  s.vx *= SPARK_DRAG;
  s.vy = s.vy * SPARK_DRAG + GRAVITY;
  s.life -= s.decay;
}

export function randomShape(): BurstShape {
  const r = Math.random();
  if (r < 0.55) return "sphere";
  if (r < 0.8) return "ring";
  return "willow";
}
