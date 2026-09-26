// M/M/c queues: why the line explodes before the servers are full.
//
// Customers arrive at random (Poisson, rate λ) and take a random time to serve
// (exponential, rate μ), across c identical servers. The load is ρ = λ/(cμ).
// The alarming part is what happens between ρ = 0.9 and ρ = 1: the queue does
// not grow proportionally, it grows like 1/(1−ρ). Going from 90% to 95% busy
// doubles the wait. From 95% to 98% doubles it again.
//
// Nothing breaks at ρ = 1 — there is no crash, no error. The queue simply never
// stops growing, because on average work arrives at least as fast as it can be
// finished, and a burst that puts you behind is never made up.
//
// The simulation is event-driven: the clock jumps from one arrival or departure
// to the next, so the averages it reports are exact continuous-time averages
// rather than samples on a grid.

export interface Customer {
  id: number;
  arrived: number;
  startedService: number; // -1 while still waiting
}

export interface Stats {
  arrived: number;
  served: number;
  sumWait: number; // time spent queueing, excluding service
  sumSystem: number; // queueing plus service
  queueTimeIntegral: number; // ∫ (queue length) dt — Little's law, directly
  systemTimeIntegral: number; // ∫ (customers in system) dt
  busyTimeIntegral: number; // ∫ (busy servers) dt
  waitedAtAll: number; // customers who found every server busy
  maxQueue: number;
}

export interface Sim {
  t: number;
  lambda: number;
  mu: number;
  servers: number;
  // The line is a growable array with a head index rather than a shifted
  // array: at high load it can hold thousands, and Array.shift() on every
  // departure would make the whole simulation quadratic.
  waiting: Customer[];
  head: number;
  inService: (Customer | null)[];
  serviceEnd: number[]; // Infinity where the server is idle
  nextArrival: number;
  nextId: number;
  stats: Stats;
  history: number[]; // customers in system, sampled for the chart
  recentWaits: number[];
}

function expo(rate: number): number {
  let u = 0;
  while (u === 0) u = Math.random();
  return -Math.log(u) / rate;
}

export function newSim(lambda: number, mu: number, servers: number): Sim {
  return {
    t: 0,
    lambda,
    mu,
    servers,
    waiting: [],
    head: 0,
    inService: new Array(servers).fill(null),
    serviceEnd: new Array(servers).fill(Infinity),
    nextArrival: expo(lambda),
    nextId: 1,
    stats: {
      arrived: 0,
      served: 0,
      sumWait: 0,
      sumSystem: 0,
      queueTimeIntegral: 0,
      systemTimeIntegral: 0,
      busyTimeIntegral: 0,
      waitedAtAll: 0,
      maxQueue: 0,
    },
    history: [],
    recentWaits: [],
  };
}

export function queueLength(sim: Sim): number {
  return sim.waiting.length - sim.head;
}

// The i-th most recently arrived customer still waiting, for drawing.
export function waitingFromBack(sim: Sim, i: number): Customer | undefined {
  const idx = sim.waiting.length - 1 - i;
  return idx >= sim.head ? sim.waiting[idx] : undefined;
}

export function inSystem(sim: Sim): number {
  return queueLength(sim) + sim.inService.filter((c) => c !== null).length;
}

export function busyServers(sim: Sim): number {
  return sim.inService.filter((c) => c !== null).length;
}

function freeServer(sim: Sim): number {
  return sim.inService.findIndex((c) => c === null);
}

// Accumulate the time-integrals over an interval in which nothing changed.
function accrue(sim: Sim, dt: number): void {
  if (dt <= 0) return;
  sim.stats.queueTimeIntegral += queueLength(sim) * dt;
  sim.stats.systemTimeIntegral += inSystem(sim) * dt;
  sim.stats.busyTimeIntegral += busyServers(sim) * dt;
}

function startService(sim: Sim, server: number, customer: Customer): void {
  customer.startedService = sim.t;
  sim.inService[server] = customer;
  sim.serviceEnd[server] = sim.t + expo(sim.mu);
  const wait = sim.t - customer.arrived;
  sim.stats.sumWait += wait;
  if (wait > 1e-9) sim.stats.waitedAtAll++;
  sim.recentWaits.push(wait);
  if (sim.recentWaits.length > 400) sim.recentWaits.shift();
}

// Run the simulation forward by `dt` of simulated time, processing every event
// in between in chronological order.
export function advance(sim: Sim, dt: number): void {
  const target = sim.t + dt;
  for (;;) {
    let nextEnd = Infinity;
    let endServer = -1;
    for (let s = 0; s < sim.servers; s++) {
      if (sim.serviceEnd[s] < nextEnd) {
        nextEnd = sim.serviceEnd[s];
        endServer = s;
      }
    }
    const next = Math.min(sim.nextArrival, nextEnd);
    if (next > target) break;

    accrue(sim, next - sim.t);
    sim.t = next;

    if (sim.nextArrival <= nextEnd) {
      // An arrival: serve it now if a server is free, otherwise it queues.
      const customer: Customer = { id: sim.nextId++, arrived: sim.t, startedService: -1 };
      sim.stats.arrived++;
      const server = freeServer(sim);
      if (server >= 0) startService(sim, server, customer);
      else {
        sim.waiting.push(customer);
        if (queueLength(sim) > sim.stats.maxQueue) sim.stats.maxQueue = queueLength(sim);
      }
      sim.nextArrival = sim.t + expo(sim.lambda);
    } else {
      // A departure: the server takes the next customer in line, if any.
      const done = sim.inService[endServer];
      if (done) {
        sim.stats.served++;
        sim.stats.sumSystem += sim.t - done.arrived;
      }
      sim.inService[endServer] = null;
      sim.serviceEnd[endServer] = Infinity;
      if (sim.head < sim.waiting.length) {
        const nextCustomer = sim.waiting[sim.head++];
        // Drop the consumed prefix occasionally so the array cannot grow forever.
        if (sim.head > 4096 && sim.head * 2 > sim.waiting.length) {
          sim.waiting = sim.waiting.slice(sim.head);
          sim.head = 0;
        }
        startService(sim, endServer, nextCustomer);
      }
    }
  }

  accrue(sim, target - sim.t);
  sim.t = target;
  sim.history.push(inSystem(sim));
  if (sim.history.length > 600) sim.history.shift();
}

// ── Measured averages ───────────────────────────────────────────────────────

export interface Measured {
  Lq: number; // mean queue length
  L: number; // mean number in the system
  Wq: number; // mean wait before service
  W: number; // mean time in the system
  utilisation: number; // fraction of server capacity in use
}

export function measured(sim: Sim): Measured {
  const t = Math.max(1e-9, sim.t);
  const startedService = sim.stats.served + busyServers(sim);
  return {
    Lq: sim.stats.queueTimeIntegral / t,
    L: sim.stats.systemTimeIntegral / t,
    Wq: startedService === 0 ? 0 : sim.stats.sumWait / startedService,
    W: sim.stats.served === 0 ? 0 : sim.stats.sumSystem / sim.stats.served,
    utilisation: sim.stats.busyTimeIntegral / t / sim.servers,
  };
}

// ── Theory ──────────────────────────────────────────────────────────────────

export interface Theory {
  rho: number;
  Lq: number;
  L: number;
  Wq: number;
  W: number;
  pWait: number; // Erlang C: the chance an arrival finds every server busy
}

// Erlang C. At ρ ≥ 1 there is no steady state at all — the honest answer is
// that these quantities are infinite, so this returns null and the page says so
// rather than printing a number.
export function theory(lambda: number, mu: number, servers: number): Theory | null {
  const rho = lambda / (servers * mu);
  if (rho >= 1) return null;
  const a = lambda / mu; // offered load in Erlangs

  let sum = 0;
  let term = 1; // aⁿ/n!, built up iteratively
  for (let n = 0; n < servers; n++) {
    if (n > 0) term *= a / n;
    sum += term;
  }
  const last = (term * a) / servers; // a^c/c!
  const p0 = 1 / (sum + last / (1 - rho));
  const pWait = (last / (1 - rho)) * p0;

  const Lq = (pWait * rho) / (1 - rho);
  const Wq = Lq / lambda;
  const W = Wq + 1 / mu;
  const L = lambda * W;
  return { rho, Lq, L, Wq, W, pWait };
}

// ── Presets ─────────────────────────────────────────────────────────────────

export interface Preset {
  id: string;
  label: string;
  note: string;
  lambda: number;
  mu: number;
  servers: number;
}

export const PRESETS: Preset[] = [
  {
    id: "quiet",
    label: "quiet",
    note: "half loaded — arrivals mostly walk straight up to a free server",
    lambda: 0.5,
    mu: 1,
    servers: 1,
  },
  {
    id: "busy",
    label: "busy",
    note: "90% loaded: still stable, but the average wait is already nine services long",
    lambda: 0.9,
    mu: 1,
    servers: 1,
  },
  {
    id: "brink",
    label: "the brink",
    note: "97% loaded — the same system, thirty times the wait",
    lambda: 0.97,
    mu: 1,
    servers: 1,
  },
  {
    id: "pooled",
    label: "pooled",
    note: "three servers sharing one line at the same 90% load — pooling beats speed",
    lambda: 2.7,
    mu: 1,
    servers: 3,
  },
  {
    id: "overloaded",
    label: "overloaded",
    note: "more work arriving than can ever be finished: no steady state, the line just grows",
    lambda: 1.15,
    mu: 1,
    servers: 1,
  },
];
