export interface Body {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  radius: number;
  color: string;
  trail: { x: number; y: number }[];
}

const G = 500;
const TRAIL_LEN = 80;
const MERGE_FACTOR = 0.85;
const SOFTENING = 10;

let nextId = 1;

export function makeBody(
  x: number,
  y: number,
  vx: number,
  vy: number,
  mass: number,
  color?: string
): Body {
  const radius = Math.cbrt(mass) * 1.4;
  return {
    id: nextId++,
    x,
    y,
    vx,
    vy,
    mass,
    radius,
    color: color ?? randomColor(),
    trail: [],
  };
}

function randomColor(): string {
  const palette = ["#00ff41", "#00cfff", "#ff6b35", "#ffe066", "#b97eff", "#ff4da6"];
  return palette[Math.floor(Math.random() * palette.length)];
}

function accel(bodies: Body[]): { ax: number; ay: number }[] {
  const n = bodies.length;
  const acc = Array.from({ length: n }, () => ({ ax: 0, ay: 0 }));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = bodies[j].x - bodies[i].x;
      const dy = bodies[j].y - bodies[i].y;
      const dist2 = dx * dx + dy * dy + SOFTENING * SOFTENING;
      const dist = Math.sqrt(dist2);
      const f = G / dist2;
      const fx = f * dx / dist;
      const fy = f * dy / dist;
      acc[i].ax += fx * bodies[j].mass;
      acc[i].ay += fy * bodies[j].mass;
      acc[j].ax -= fx * bodies[i].mass;
      acc[j].ay -= fy * bodies[i].mass;
    }
  }
  return acc;
}

export function stepLeapfrog(bodies: Body[], dt: number): Body[] {
  if (bodies.length === 0) return bodies;

  // Leapfrog kick-drift-kick
  const a0 = accel(bodies);
  const drifted = bodies.map((b, i) => ({
    ...b,
    x: b.x + (b.vx + 0.5 * a0[i].ax * dt) * dt,
    y: b.y + (b.vy + 0.5 * a0[i].ay * dt) * dt,
    vx: b.vx + 0.5 * a0[i].ax * dt,
    vy: b.vy + 0.5 * a0[i].ay * dt,
  }));
  const a1 = accel(drifted);
  let updated: Body[] = drifted.map((b, i) => {
    const trail = [...b.trail, { x: b.x, y: b.y }];
    if (trail.length > TRAIL_LEN) trail.shift();
    return {
      ...b,
      vx: b.vx + 0.5 * a1[i].ax * dt,
      vy: b.vy + 0.5 * a1[i].ay * dt,
      trail,
    };
  });

  // Merge on collision
  updated = mergeCollisions(updated);
  return updated;
}

function mergeCollisions(bodies: Body[]): Body[] {
  const merged = new Set<number>();
  const out: Body[] = [];
  for (let i = 0; i < bodies.length; i++) {
    if (merged.has(bodies[i].id)) continue;
    let b = bodies[i];
    for (let j = i + 1; j < bodies.length; j++) {
      if (merged.has(bodies[j].id)) continue;
      const dx = b.x - bodies[j].x;
      const dy = b.y - bodies[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < (b.radius + bodies[j].radius) * MERGE_FACTOR) {
        const totalMass = b.mass + bodies[j].mass;
        b = {
          ...b,
          x: (b.x * b.mass + bodies[j].x * bodies[j].mass) / totalMass,
          y: (b.y * b.mass + bodies[j].y * bodies[j].mass) / totalMass,
          vx: (b.vx * b.mass + bodies[j].vx * bodies[j].mass) / totalMass,
          vy: (b.vy * b.mass + bodies[j].vy * bodies[j].mass) / totalMass,
          mass: totalMass,
          radius: Math.cbrt(totalMass) * 1.4,
          color: b.mass >= bodies[j].mass ? b.color : bodies[j].color,
        };
        merged.add(bodies[j].id);
      }
    }
    out.push(b);
  }
  return out;
}

export type Preset = "binary" | "solar" | "random" | "figure8";

export function loadPreset(preset: Preset, w: number, h: number): Body[] {
  nextId = 1;
  const cx = w / 2;
  const cy = h / 2;

  if (preset === "binary") {
    const v = 70;
    return [
      makeBody(cx - 80, cy, 0, -v, 300, "#00ff41"),
      makeBody(cx + 80, cy, 0, v, 300, "#00cfff"),
    ];
  }

  if (preset === "solar") {
    const sun = makeBody(cx, cy, 0, 0, 3000, "#ffe066");
    const planets = [
      { r: 100, m: 10, c: "#00cfff" },
      { r: 160, m: 25, c: "#ff6b35" },
      { r: 220, m: 15, c: "#00ff41" },
      { r: 300, m: 60, c: "#b97eff" },
    ].map(({ r, m, c }) => {
      const v = Math.sqrt((G * sun.mass) / r);
      return makeBody(cx + r, cy, 0, v, m, c);
    });
    return [sun, ...planets];
  }

  if (preset === "figure8") {
    // Chenciner-Montgomery figure-8 (approximate)
    const v0 = 93;
    const scale = Math.min(w, h) * 0.18;
    return [
      makeBody(cx - scale * 0.97, cy, v0 * 0.93, v0 * 0.86, 200, "#00ff41"),
      makeBody(cx + scale * 0.97, cy, v0 * 0.93, v0 * 0.86, 200, "#00cfff"),
      makeBody(cx, cy, -v0 * 1.86, -v0 * 1.72, 200, "#ff6b35"),
    ];
  }

  // random
  const bodies: Body[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const r = 80 + Math.random() * 100;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    const speed = 20 + Math.random() * 50;
    const vAngle = angle + Math.PI / 2;
    bodies.push(makeBody(x, y, Math.cos(vAngle) * speed, Math.sin(vAngle) * speed, 50 + Math.random() * 150));
  }
  return bodies;
}
