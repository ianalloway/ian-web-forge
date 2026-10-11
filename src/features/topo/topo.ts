// Topological sort: what can start now, and what the schedule really costs.
//
// A build is a directed graph of tasks: an edge means "this must finish before
// that starts". Two questions matter. What order is legal — and, if you had
// unlimited machines, how long would the whole thing take?
//
// Kahn's algorithm answers the first by repeatedly taking every task whose
// dependencies are all done. Taking them in waves rather than one at a time
// answers the second for free: each wave can run in parallel, so the number of
// waves is the depth of the graph, and the longest chain of dependencies — the
// critical path — is the floor on the build time no amount of hardware can get
// under.
//
// The algorithm also detects the one thing that makes a build impossible. If
// tasks remain but nothing has zero remaining dependencies, every survivor is
// waiting on another survivor: a cycle. Kahn finds it without a separate pass.

export interface Task {
  id: string;
  duration: number; // seconds
  deps: string[]; // tasks that must finish first
}

export interface Graph {
  tasks: Task[];
  byId: Map<string, Task>;
  dependents: Map<string, string[]>; // reverse edges
}

export function buildGraph(tasks: Task[]): Graph {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const dependents = new Map<string, string[]>(tasks.map((t) => [t.id, []]));
  for (const task of tasks) {
    for (const dep of task.deps) {
      // An edge to a task that does not exist is a broken build file, not a
      // cycle, so it is reported rather than silently dropped.
      if (!byId.has(dep)) continue;
      dependents.get(dep)!.push(task.id);
    }
  }
  return { tasks, byId, dependents };
}

export function missingDependencies(graph: Graph): string[] {
  const missing: string[] = [];
  for (const task of graph.tasks) {
    for (const dep of task.deps) if (!graph.byId.has(dep)) missing.push(`${task.id} → ${dep}`);
  }
  return missing;
}

export function inDegrees(graph: Graph): Map<string, number> {
  const degrees = new Map<string, number>();
  for (const task of graph.tasks) {
    degrees.set(task.id, task.deps.filter((d) => graph.byId.has(d)).length);
  }
  return degrees;
}

export interface Wave {
  index: number;
  tasks: string[]; // everything that can run at the same time
  startsAt: number; // seconds into the build
  endsAt: number;
}

export interface Schedule {
  waves: Wave[];
  order: string[]; // a valid topological order, waves flattened
  cyclic: boolean;
  stuck: string[]; // the tasks inside the cycle, when there is one
  criticalPath: string[];
  criticalLength: number; // seconds with unlimited parallelism
  serialLength: number; // seconds if everything ran one at a time
}

// Kahn's algorithm, taking a whole wave at a time.
export function schedule(graph: Graph): Schedule {
  const degrees = inDegrees(graph);
  const waves: Wave[] = [];
  const order: string[] = [];

  // The earliest each task can start, which is when its slowest dependency ends.
  const finish = new Map<string, number>();
  const previous = new Map<string, string | null>();

  let remaining = graph.tasks.length;
  let ready = graph.tasks.filter((t) => degrees.get(t.id) === 0).map((t) => t.id);

  while (ready.length > 0) {
    const wave: string[] = [...ready].sort();
    const next: string[] = [];
    let waveStart = Infinity;
    let waveEnd = 0;

    for (const id of wave) {
      const task = graph.byId.get(id)!;
      let startsAt = 0;
      let from: string | null = null;
      for (const dep of task.deps) {
        const depEnd = finish.get(dep);
        if (depEnd !== undefined && depEnd > startsAt) {
          startsAt = depEnd;
          from = dep;
        }
      }
      finish.set(id, startsAt + task.duration);
      previous.set(id, from);
      waveStart = Math.min(waveStart, startsAt);
      waveEnd = Math.max(waveEnd, startsAt + task.duration);
      order.push(id);
      remaining--;

      for (const dependent of graph.dependents.get(id) ?? []) {
        const left = (degrees.get(dependent) ?? 0) - 1;
        degrees.set(dependent, left);
        if (left === 0) next.push(dependent);
      }
    }

    waves.push({
      index: waves.length,
      tasks: wave,
      startsAt: waveStart === Infinity ? 0 : waveStart,
      endsAt: waveEnd,
    });
    ready = next;
  }

  // Anything left over is waiting on something that is also left over.
  const cyclic = remaining > 0;
  const stuck = cyclic ? graph.tasks.filter((t) => !finish.has(t.id)).map((t) => t.id) : [];

  let criticalLength = 0;
  let last: string | null = null;
  for (const [id, end] of finish) {
    if (end > criticalLength) {
      criticalLength = end;
      last = id;
    }
  }

  const criticalPath: string[] = [];
  let cursor = last;
  while (cursor) {
    criticalPath.unshift(cursor);
    cursor = previous.get(cursor) ?? null;
  }

  const serialLength = graph.tasks.reduce((sum, t) => sum + t.duration, 0);
  return { waves, order, cyclic, stuck, criticalPath, criticalLength, serialLength };
}

// Independently: is this ordering actually legal? Every dependency must appear
// before the task that needs it.
export function isValidOrder(graph: Graph, order: string[]): boolean {
  const position = new Map(order.map((id, i) => [id, i]));
  if (position.size !== order.length) return false;
  for (const task of graph.tasks) {
    const self = position.get(task.id);
    if (self === undefined) return false;
    for (const dep of task.deps) {
      if (!graph.byId.has(dep)) continue;
      const at = position.get(dep);
      if (at === undefined || at > self) return false;
    }
  }
  return true;
}

// The longest path, computed by plain recursion with memoisation, as a check on
// the scheduler's own figure.
export function longestPath(graph: Graph): number {
  const memo = new Map<string, number>();
  const visiting = new Set<string>();

  const walk = (id: string): number => {
    if (memo.has(id)) return memo.get(id)!;
    if (visiting.has(id)) return 0; // a cycle has no finite longest path
    visiting.add(id);
    const task = graph.byId.get(id)!;
    let best = 0;
    for (const dep of task.deps) {
      if (!graph.byId.has(dep)) continue;
      best = Math.max(best, walk(dep));
    }
    visiting.delete(id);
    const total = best + task.duration;
    memo.set(id, total);
    return total;
  };

  let longest = 0;
  for (const task of graph.tasks) longest = Math.max(longest, walk(task.id));
  return longest;
}

// ── Build graphs ───────────────────────────────────────────────────────────

export interface Preset {
  id: string;
  label: string;
  note: string;
  tasks: Task[];
}

export const PRESETS: Preset[] = [
  {
    id: "web",
    label: "web build",
    note: "a typical front-end pipeline — wide in the middle, so most of it parallelises",
    tasks: [
      { id: "install", duration: 30, deps: [] },
      { id: "codegen", duration: 6, deps: ["install"] },
      { id: "lint", duration: 12, deps: ["install"] },
      { id: "typecheck", duration: 18, deps: ["codegen"] },
      { id: "unit", duration: 22, deps: ["codegen"] },
      { id: "bundle", duration: 25, deps: ["typecheck"] },
      { id: "css", duration: 8, deps: ["install"] },
      { id: "assets", duration: 14, deps: ["install"] },
      { id: "e2e", duration: 40, deps: ["bundle", "css", "assets"] },
      { id: "deploy", duration: 10, deps: ["e2e", "lint", "unit"] },
    ],
  },
  {
    id: "chain",
    label: "one long chain",
    note: "every task waits on the last — the critical path is the whole build, and machines do not help",
    tasks: Array.from({ length: 9 }, (_, i) => ({
      id: `step-${i + 1}`,
      duration: 10 + (i % 3) * 5,
      deps: i === 0 ? [] : [`step-${i}`],
    })),
  },
  {
    id: "fan",
    label: "fan out",
    note: "one slow setup, then everything at once — depth two, however many tasks there are",
    tasks: [
      { id: "setup", duration: 20, deps: [] },
      ...Array.from({ length: 8 }, (_, i) => ({
        id: `job-${i + 1}`,
        duration: 8 + ((i * 7) % 20),
        deps: ["setup"],
      })),
      { id: "collect", duration: 6, deps: Array.from({ length: 8 }, (_, i) => `job-${i + 1}`) },
    ],
  },
  {
    id: "cycle",
    label: "circular",
    note: "three tasks each waiting on the next — no order exists, and Kahn says so rather than looping",
    tasks: [
      { id: "prepare", duration: 10, deps: [] },
      { id: "alpha", duration: 8, deps: ["prepare", "gamma"] },
      { id: "beta", duration: 8, deps: ["alpha"] },
      { id: "gamma", duration: 8, deps: ["beta"] },
      { id: "report", duration: 5, deps: ["prepare"] },
    ],
  },
];
