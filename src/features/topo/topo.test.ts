import { describe, expect, it } from "vitest";
import {
  PRESETS,
  Task,
  buildGraph,
  inDegrees,
  isValidOrder,
  longestPath,
  missingDependencies,
  schedule,
} from "./topo";

const acyclic = PRESETS.filter((p) => p.id !== "cycle");

describe("ordering", () => {
  it.each(acyclic)("$label produces an order that respects every dependency", (preset) => {
    const graph = buildGraph(preset.tasks);
    const result = schedule(graph);
    expect(result.cyclic).toBe(false);
    expect(result.order.length).toBe(preset.tasks.length);
    expect(isValidOrder(graph, result.order)).toBe(true);
  });

  it("rejects an order that breaks a dependency", () => {
    const graph = buildGraph(PRESETS[0].tasks);
    const good = schedule(graph).order;
    const bad = [...good].reverse();
    expect(isValidOrder(graph, good)).toBe(true);
    expect(isValidOrder(graph, bad)).toBe(false);
  });

  it("starts with the tasks that depend on nothing", () => {
    for (const preset of acyclic) {
      const graph = buildGraph(preset.tasks);
      const degrees = inDegrees(graph);
      const first = schedule(graph).waves[0].tasks;
      for (const id of first) expect(degrees.get(id)).toBe(0);
    }
  });
});

describe("waves and the critical path", () => {
  it.each(acyclic)("$label finishes exactly at its longest dependency chain", (preset) => {
    const graph = buildGraph(preset.tasks);
    const result = schedule(graph);
    // Computed independently by recursion, as a check on the scheduler.
    expect(result.criticalLength).toBe(longestPath(graph));
  });

  it("names a critical path whose durations add up to the build time", () => {
    for (const preset of acyclic) {
      const graph = buildGraph(preset.tasks);
      const result = schedule(graph);
      const total = result.criticalPath.reduce((sum, id) => sum + graph.byId.get(id)!.duration, 0);
      expect(total).toBe(result.criticalLength);
      // And it must itself be a legal chain of dependencies.
      for (let i = 1; i < result.criticalPath.length; i++) {
        expect(graph.byId.get(result.criticalPath[i])!.deps).toContain(result.criticalPath[i - 1]);
      }
    }
  });

  it("puts every task in exactly one wave, after all of its dependencies", () => {
    for (const preset of acyclic) {
      const graph = buildGraph(preset.tasks);
      const { waves } = schedule(graph);
      const waveOf = new Map<string, number>();
      for (const wave of waves) for (const id of wave.tasks) {
        expect(waveOf.has(id)).toBe(false);
        waveOf.set(id, wave.index);
      }
      expect(waveOf.size).toBe(preset.tasks.length);
      for (const task of preset.tasks) {
        for (const dep of task.deps) {
          expect(waveOf.get(dep)!).toBeLessThan(waveOf.get(task.id)!);
        }
      }
    }
  });

  it("shows parallelism helping a wide graph and not helping a chain", () => {
    const fan = schedule(buildGraph(PRESETS.find((p) => p.id === "fan")!.tasks));
    const chain = schedule(buildGraph(PRESETS.find((p) => p.id === "chain")!.tasks));
    // Fanning out: unlimited machines beat running serially by a wide margin.
    expect(fan.criticalLength).toBeLessThan(fan.serialLength / 2);
    // A pure chain: machines buy nothing at all.
    expect(chain.criticalLength).toBe(chain.serialLength);
  });
});

describe("cycles", () => {
  it("detects the circular preset and names the tasks inside it", () => {
    const graph = buildGraph(PRESETS.find((p) => p.id === "cycle")!.tasks);
    const result = schedule(graph);
    expect(result.cyclic).toBe(true);
    expect(result.stuck.sort()).toEqual(["alpha", "beta", "gamma"]);
    // The tasks outside the cycle still get scheduled.
    expect(result.order).toContain("prepare");
    expect(result.order).toContain("report");
  });

  it("detects a two-task deadlock", () => {
    const tasks: Task[] = [
      { id: "a", duration: 1, deps: ["b"] },
      { id: "b", duration: 1, deps: ["a"] },
    ];
    const result = schedule(buildGraph(tasks));
    expect(result.cyclic).toBe(true);
    expect(result.order).toEqual([]);
  });

  it("detects a task that depends on itself", () => {
    const result = schedule(buildGraph([{ id: "a", duration: 1, deps: ["a"] }]));
    expect(result.cyclic).toBe(true);
    expect(result.stuck).toEqual(["a"]);
  });
});

describe("broken build files", () => {
  it("reports a dependency on a task that does not exist", () => {
    const graph = buildGraph([
      { id: "build", duration: 5, deps: ["install"] },
      { id: "test", duration: 5, deps: ["build"] },
    ]);
    expect(missingDependencies(graph)).toEqual(["build → install"]);
    // It still schedules what it can rather than refusing outright.
    const result = schedule(graph);
    expect(result.cyclic).toBe(false);
    expect(result.order).toEqual(["build", "test"]);
  });

  it("handles an empty graph", () => {
    const result = schedule(buildGraph([]));
    expect(result.order).toEqual([]);
    expect(result.criticalLength).toBe(0);
    expect(result.cyclic).toBe(false);
  });
});
