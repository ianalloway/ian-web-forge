export type AgentState = 0 | 1 | 2; // 0=S, 1=I, 2=R
export const S = 0, I = 1, R = 2;

export interface Agent {
  x: number;
  y: number;
  vx: number;
  vy: number;
  state: AgentState;
  infectedAt: number; // tick when infected
  mobile: boolean; // false = social distancing
}

export interface SirParams {
  transmission: number; // infection probability per contact per tick
  radius: number; // contact radius (px)
  recoveryTicks: number;
  distancing: number; // fraction of agents that don't move
}

export const DEFAULT_SIR: SirParams = {
  transmission: 0.06,
  radius: 12,
  recoveryTicks: 600,
  distancing: 0,
};

export interface Counts {
  s: number;
  i: number;
  r: number;
}

export function makePopulation(
  n: number,
  w: number,
  h: number,
  distancing: number,
  initialInfected = 3
): Agent[] {
  const agents: Agent[] = Array.from({ length: n }, (_, idx) => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.6 + Math.random() * 0.6;
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      state: idx < initialInfected ? I : S,
      infectedAt: idx < initialInfected ? 0 : -1,
      mobile: Math.random() >= distancing,
    } as Agent;
  });
  return agents;
}

/** One tick: move, bounce, infect within radius, recover. Mutates agents. */
export function stepSir(
  agents: Agent[],
  w: number,
  h: number,
  params: SirParams,
  tick: number
): Counts {
  const { transmission, radius, recoveryTicks } = params;
  const r2 = radius * radius;

  // Move
  for (const a of agents) {
    if (!a.mobile) continue;
    a.x += a.vx;
    a.y += a.vy;
    if (a.x < 0 || a.x > w) { a.vx *= -1; a.x = Math.max(0, Math.min(w, a.x)); }
    if (a.y < 0 || a.y > h) { a.vy *= -1; a.y = Math.max(0, Math.min(h, a.y)); }
  }

  // Spatial hash for contact checks
  const cell = Math.max(8, radius);
  const cols = Math.max(1, Math.ceil(w / cell));
  const buckets = new Map<number, number[]>();
  agents.forEach((a, i) => {
    if (a.state !== I) return;
    const key = Math.floor(a.x / cell) + Math.floor(a.y / cell) * cols;
    const b = buckets.get(key);
    if (b) b.push(i);
    else buckets.set(key, [i]);
  });

  // Infect susceptibles near infected
  for (const a of agents) {
    if (a.state !== S) continue;
    const cx = Math.floor(a.x / cell);
    const cy = Math.floor(a.y / cell);
    let infectedNearby = false;
    outer: for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const b = buckets.get(cx + dx + (cy + dy) * cols);
        if (!b) continue;
        for (const idx of b) {
          const o = agents[idx];
          const ddx = o.x - a.x;
          const ddy = o.y - a.y;
          if (ddx * ddx + ddy * ddy < r2) { infectedNearby = true; break outer; }
        }
      }
    }
    if (infectedNearby && Math.random() < transmission) {
      a.state = I;
      a.infectedAt = tick;
    }
  }

  // Recover
  let s = 0, i = 0, r = 0;
  for (const a of agents) {
    if (a.state === I && tick - a.infectedAt >= recoveryTicks) {
      a.state = R;
    }
    if (a.state === S) s++;
    else if (a.state === I) i++;
    else r++;
  }
  return { s, i, r };
}
