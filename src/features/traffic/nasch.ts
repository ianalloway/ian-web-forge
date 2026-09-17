// The Nagel-Schreckenberg traffic model on a ring road.
//
// Four rules, applied to every car simultaneously each tick:
//
//   1. accelerate   v ← min(v + 1, vmax)
//   2. brake        v ← min(v, gap)          (gap = empty cells ahead)
//   3. dawdle       with probability p, v ← max(v − 1, 0)
//   4. move         x ← x + v
//
// Rules 1, 2 and 4 alone give perfectly smooth flow at any density. Rule 3 —
// one moment of inattention — is what makes traffic jams appear out of nothing
// and then crawl *backwards* against the direction of travel. That is the whole
// point: the jam has no cause, no accident, no bottleneck. It is a phase of the
// traffic itself.

export interface Road {
  length: number; // cells around the ring
  n: number; // number of cars
  pos: Int32Array; // cell index of each car, in cyclic order
  vel: Int32Array; // current speed, in cells per tick
}

export interface Params {
  vmax: number; // top speed in cells/tick
  dawdle: number; // probability of a random slowdown
}

export const DEFAULT_PARAMS: Params = { vmax: 5, dawdle: 0.25 };

// Cars are placed as evenly as the ring allows and start at top speed, so any
// jam you see afterwards was manufactured entirely by rule 3.
export function newRoad(length: number, carCount: number, vmax: number): Road {
  const n = Math.max(1, Math.min(carCount, length));
  const pos = new Int32Array(n);
  const vel = new Int32Array(n);
  for (let i = 0; i < n; i++) {
    pos[i] = Math.floor((i * length) / n);
    vel[i] = vmax;
  }
  return { length, n, pos, vel };
}

export function density(road: Road): number {
  return road.n / road.length;
}

// Empty cells between a car and the one in front of it. Cars never overtake, so
// the cyclic order of the array is permanent and the leader of car i is always
// car (i+1) % n.
function gapAhead(road: Road, i: number): number {
  if (road.n === 1) return road.length - 1;
  const ahead = road.pos[(i + 1) % road.n];
  const raw = ahead - road.pos[i];
  return (raw + road.length) % road.length - 1;
}

export interface StepStats {
  meanSpeed: number; // cells per tick
  flow: number; // cars past a fixed point per tick (density × mean speed)
  stopped: number; // fraction of cars at a dead stop
}

export function step(road: Road, params: Params): StepStats {
  const { n } = road;
  // Speeds are chosen from the current configuration for every car before any
  // car moves — a synchronous update, not a sequential one.
  const next = new Int32Array(n);
  for (let i = 0; i < n; i++) {
    let v = Math.min(road.vel[i] + 1, params.vmax); // 1. accelerate
    v = Math.min(v, gapAhead(road, i)); // 2. brake
    if (v > 0 && Math.random() < params.dawdle) v--; // 3. dawdle
    next[i] = v;
  }

  let sum = 0;
  let stopped = 0;
  for (let i = 0; i < n; i++) {
    road.vel[i] = next[i];
    road.pos[i] = (road.pos[i] + next[i]) % road.length; // 4. move
    sum += next[i];
    if (next[i] === 0) stopped++;
  }

  const meanSpeed = n === 0 ? 0 : sum / n;
  return { meanSpeed, flow: meanSpeed * density(road), stopped: n === 0 ? 0 : stopped / n };
}

// A snapshot of the road for drawing: -1 where empty, otherwise the car's speed.
export function occupancy(road: Road, out?: Int8Array): Int8Array {
  const cells = out && out.length === road.length ? out : new Int8Array(road.length);
  cells.fill(-1);
  for (let i = 0; i < road.n; i++) cells[road.pos[i]] = road.vel[i];
  return cells;
}

// Tap the brakes on one car — the single perturbation that seeds a phantom jam.
export function brakeOne(road: Road): number {
  if (road.n === 0) return -1;
  const i = (Math.random() * road.n) | 0;
  road.vel[i] = 0;
  return i;
}

// Rebuild the ring at a new car count, preserving the road length.
export function resize(road: Road, carCount: number, vmax: number): Road {
  return newRoad(road.length, carCount, vmax);
}

// ── Fundamental diagram ─────────────────────────────────────────────────────
//
// Flow against density is the classic signature of the model: flow climbs with
// density up to a critical point (roads work best when busy), then collapses as
// jams take over. Samples are binned so a long run converges instead of drawing
// a cloud.

export interface Diagram {
  bins: number;
  sum: Float64Array; // total flow seen in each density bin
  count: Float64Array; // samples in each bin
}

export function newDiagram(bins = 50): Diagram {
  return { bins, sum: new Float64Array(bins), count: new Float64Array(bins) };
}

export function record(d: Diagram, densityValue: number, flow: number): void {
  const i = Math.min(d.bins - 1, Math.max(0, Math.floor(densityValue * d.bins)));
  d.sum[i] += flow;
  d.count[i] += 1;
}

export function diagramPoints(d: Diagram): { density: number; flow: number }[] {
  const pts: { density: number; flow: number }[] = [];
  for (let i = 0; i < d.bins; i++) {
    if (d.count[i] === 0) continue;
    pts.push({ density: (i + 0.5) / d.bins, flow: d.sum[i] / d.count[i] });
  }
  return pts;
}

// ── Presets ─────────────────────────────────────────────────────────────────

export interface Preset {
  id: string;
  label: string;
  note: string;
  cars: number; // out of ROAD_LENGTH cells
  vmax: number;
  dawdle: number;
}

export const ROAD_LENGTH = 300;

export const PRESETS: Preset[] = [
  {
    id: "free",
    label: "free flow",
    note: "sparse traffic — dawdling costs nothing, nobody is ever blocked",
    cars: 24,
    vmax: 5,
    dawdle: 0.25,
  },
  {
    id: "critical",
    label: "critical",
    note: "the busiest a road can be before it breaks — maximum flow, minimum slack",
    cars: 60,
    vmax: 5,
    dawdle: 0.25,
  },
  {
    id: "jam",
    label: "stop-and-go",
    note: "past the critical density: jams nucleate from nothing and drift backwards",
    cars: 105,
    vmax: 5,
    dawdle: 0.3,
  },
  {
    id: "gridlock",
    label: "gridlock",
    note: "so dense the whole ring is one crawling queue",
    cars: 190,
    vmax: 5,
    dawdle: 0.2,
  },
];
