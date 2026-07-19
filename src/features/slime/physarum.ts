export interface SlimeParams {
  sensorAngle: number; // radians offset of left/right sensors
  sensorDist: number; // px ahead
  turnSpeed: number; // radians per step
  moveSpeed: number; // px per step
  evaporate: number; // multiplier per frame (e.g. 0.96)
  deposit: number; // pheromone added per agent per step
}

export const DEFAULT_SLIME: SlimeParams = {
  sensorAngle: 0.5,
  sensorDist: 12,
  turnSpeed: 0.35,
  moveSpeed: 1.4,
  evaporate: 0.955,
  deposit: 24,
};

export interface SlimeWorld {
  w: number;
  h: number;
  trail: Float32Array; // pheromone field, one value per pixel
  ax: Float32Array; // agent positions/headings
  ay: Float32Array;
  ah: Float32Array;
  count: number;
}

export function makeWorld(w: number, h: number, count: number): SlimeWorld {
  const ax = new Float32Array(count);
  const ay = new Float32Array(count);
  const ah = new Float32Array(count);
  // Spawn in a centered disk pointing outward — blooms into a ring first
  const cx = w / 2, cy = h / 2;
  const R = Math.min(w, h) * 0.2;
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * R;
    ax[i] = cx + Math.cos(a) * r;
    ay[i] = cy + Math.sin(a) * r;
    ah[i] = a;
  }
  return { w, h, trail: new Float32Array(w * h), ax, ay, ah, count };
}

function sample(world: SlimeWorld, x: number, y: number): number {
  const { w, h, trail } = world;
  const xi = x | 0;
  const yi = y | 0;
  if (xi < 0 || yi < 0 || xi >= w || yi >= h) return -1; // walls repel
  return trail[yi * w + xi];
}

/** One simulation step: sense, turn, move, deposit, then evaporate+blur. */
export function stepSlime(world: SlimeWorld, p: SlimeParams): void {
  const { w, h, trail, ax, ay, ah, count } = world;

  for (let i = 0; i < count; i++) {
    const heading = ah[i];
    const x = ax[i], y = ay[i];

    const f = sample(world, x + Math.cos(heading) * p.sensorDist, y + Math.sin(heading) * p.sensorDist);
    const l = sample(world, x + Math.cos(heading - p.sensorAngle) * p.sensorDist, y + Math.sin(heading - p.sensorAngle) * p.sensorDist);
    const r = sample(world, x + Math.cos(heading + p.sensorAngle) * p.sensorDist, y + Math.sin(heading + p.sensorAngle) * p.sensorDist);

    if (f >= l && f >= r) {
      // keep heading
    } else if (l > r) {
      ah[i] -= p.turnSpeed;
    } else if (r > l) {
      ah[i] += p.turnSpeed;
    } else {
      ah[i] += (Math.random() - 0.5) * p.turnSpeed * 2;
    }

    let nx = x + Math.cos(ah[i]) * p.moveSpeed;
    let ny = y + Math.sin(ah[i]) * p.moveSpeed;

    // Bounce off walls with a random new heading
    if (nx < 1 || nx >= w - 1 || ny < 1 || ny >= h - 1) {
      ah[i] = Math.random() * Math.PI * 2;
      nx = Math.max(1, Math.min(w - 2, nx));
      ny = Math.max(1, Math.min(h - 2, ny));
    }
    ax[i] = nx;
    ay[i] = ny;

    const idx = (ny | 0) * w + (nx | 0);
    trail[idx] = Math.min(255, trail[idx] + p.deposit);
  }

  // Evaporate + cheap 1D-ish blur (left+right+self average) per row
  const evap = p.evaporate;
  for (let yi = 0; yi < h; yi++) {
    const row = yi * w;
    let prev = trail[row];
    for (let xi = 1; xi < w - 1; xi++) {
      const idx = row + xi;
      const cur = trail[idx];
      const blurred = (prev + cur + trail[idx + 1]) / 3;
      prev = cur;
      trail[idx] = blurred * evap;
    }
  }
}
