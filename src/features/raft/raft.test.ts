import { describe, expect, it } from "vitest";
import {
  Cluster,
  appliedPrefixes,
  checkAll,
  electionSafety,
  logMatching,
  makeRng,
} from "./raft";

/** Run until a predicate holds, or give up after `limit` ticks. */
function runUntil(c: Cluster, limit: number, ok: () => boolean): boolean {
  for (let i = 0; i < limit; i++) {
    if (ok()) return true;
    c.tick();
  }
  return ok();
}

/**
 * Fault injection that keeps the cluster *recoverable*: at most two nodes down
 * at once, only ever one or two isolated by a split, and every split healed on
 * a timer. A permanently wedged cluster elects nobody and commits nothing,
 * which would make the safety assertions pass by having nothing to check — so
 * the harness below reports what it exercised and the tests assert on it.
 */
function chaos(c: Cluster, ticks: number, seed: number, opts: { minority?: boolean } = {}) {
  const rng = makeRng(seed * 7919 + 13);
  let healAt = -1;
  for (let t = 0; t < ticks; t++) {
    c.tick();
    if (t === healAt) {
      c.setPartition(null);
      healAt = -1;
    }
    const r = rng();
    if (r < 0.002) {
      if (c.nodes.filter((n) => !n.alive).length < 2) {
        c.crash(Math.floor(rng() * c.nodes.length));
      }
    } else if (r < 0.01) {
      const dead = c.nodes.filter((n) => !n.alive);
      if (dead.length) c.revive(dead[Math.floor(rng() * dead.length)].id);
    } else if (r < 0.013 && c.partition === null) {
      const side = new Set<number>();
      // Isolating 1-2 of 5 leaves a majority; 3 of 5 strands the other side.
      const k = opts.minority ? 3 : 1 + Math.floor(rng() * 2);
      while (side.size < k) side.add(Math.floor(rng() * c.nodes.length));
      c.setPartition(side);
      healAt = t + 80 + Math.floor(rng() * 160);
    } else if (r < 0.04) {
      c.submit();
    }
  }
  c.setPartition(null);
  for (const n of c.nodes) c.revive(n.id);
  c.run(600);
}

const distinctLeaderTerms = (c: Cluster) => c.leadersByTerm.size;
const maxCommit = (c: Cluster) => Math.max(...c.nodes.map((n) => n.commitIndex));

describe("Raft liveness", () => {
  it("elects a leader on a healthy cluster, and then stops holding elections", () => {
    const c = new Cluster({}, 7);
    expect(runUntil(c, 1000, () => c.leader() !== null)).toBe(true);
    const settled = c.leader()!;
    expect(settled.currentTerm).toBeGreaterThan(0);
    // A stable leader must keep its followers quiet: no term churn, no gaps.
    c.run(3000);
    expect(c.leader()?.id).toBe(settled.id);
    expect(Math.max(...c.nodes.map((n) => n.currentTerm))).toBe(settled.currentTerm);
  });

  it("elects a leader from every seed, so this is not one lucky schedule", () => {
    const times: number[] = [];
    for (let seed = 1; seed <= 40; seed++) {
      const c = new Cluster({}, seed);
      let first = -1;
      for (let t = 0; t < 2000 && first < 0; t++) {
        c.tick();
        if (c.leader()) first = t;
      }
      expect(first, `seed ${seed} never elected a leader`).toBeGreaterThan(0);
      times.push(first);
    }
    // One election round is ~60-120 ticks; allow a split vote or two, but a
    // median in the hundreds would mean chronic split votes.
    times.sort((a, b) => a - b);
    expect(times[20]).toBeLessThan(250);
  });

  it("commits a submitted command on a majority", () => {
    const c = new Cluster({}, 3);
    runUntil(c, 1000, () => c.leader() !== null);
    const idx = c.submit("set x=1");
    expect(idx).not.toBeNull();
    expect(runUntil(c, 1000, () => c.nodes.filter((n) => n.commitIndex >= idx!).length >= 3)).toBe(
      true,
    );
    for (const n of c.nodes) {
      if (n.commitIndex >= idx!) expect(n.log[idx!].cmd).toBe("set x=1");
    }
  });

  it("applies commands in the same order everywhere", () => {
    const c = new Cluster({}, 11);
    runUntil(c, 500, () => c.leader() !== null);
    const want = Array.from({ length: 8 }, (_, i) => `cmd${i}`);
    for (const cmd of want) {
      c.submit(cmd);
      c.run(40);
    }
    c.run(400);
    const full = c.nodes.filter((n) => n.applied.length === want.length);
    expect(full.length).toBeGreaterThanOrEqual(3);
    for (const n of full) expect(n.applied).toEqual(want);
  });

  it("elects a new leader after the old one crashes", () => {
    const c = new Cluster({}, 5);
    runUntil(c, 500, () => c.leader() !== null);
    const old = c.leader()!;
    const oldTerm = old.currentTerm;
    c.crash(old.id);
    expect(
      runUntil(c, 2000, () => {
        const l = c.leader();
        return l !== null && l.id !== old.id;
      }),
    ).toBe(true);
    expect(c.leader()!.currentTerm).toBeGreaterThan(oldTerm);
  });
});

describe("Raft safety under faults", () => {
  it("churns through many leader terms without ever seating two in one term", () => {
    let terms = 0;
    let commits = 0;
    for (let seed = 1; seed <= 25; seed++) {
      const c = new Cluster({}, seed);
      chaos(c, 4000, seed);
      expect(electionSafety(c), `seed ${seed}`).toBeNull();
      expect(logMatching(c), `seed ${seed}`).toBeNull();
      expect(appliedPrefixes(c), `seed ${seed}`).toBeNull();
      // Non-vacuity: this seed has to have actually run a cluster.
      expect(distinctLeaderTerms(c), `seed ${seed} seated no leader`).toBeGreaterThan(0);
      expect(maxCommit(c), `seed ${seed} committed nothing`).toBeGreaterThan(0);
      terms += distinctLeaderTerms(c);
      commits += maxCommit(c);
    }
    // Across the sweep, leadership must have genuinely moved around and real
    // entries must have committed — otherwise the invariants above are empty.
    expect(terms, `only ${terms} leader terms across 25 seeds`).toBeGreaterThan(100);
    expect(commits, `only ${commits} committed entries across 25 seeds`).toBeGreaterThan(400);
  });

  it("holds every invariant when minority partitions strand whole sides", () => {
    let terms = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const c = new Cluster({}, seed);
      chaos(c, 3000, seed, { minority: true });
      expect(checkAll(c), `seed ${seed}`).toBeNull();
      terms += distinctLeaderTerms(c);
    }
    expect(terms).toBeGreaterThan(60);
  });

  it("holds every invariant with a lossy network", () => {
    let terms = 0;
    for (let seed = 1; seed <= 15; seed++) {
      const c = new Cluster({ dropRate: 0.25 }, seed);
      for (let t = 0; t < 3000; t++) {
        c.tick();
        if (t % 97 === 0) c.submit();
      }
      expect(checkAll(c), `seed ${seed}`).toBeNull();
      expect(distinctLeaderTerms(c), `seed ${seed}`).toBeGreaterThan(0);
      terms += distinctLeaderTerms(c);
    }
    expect(terms).toBeGreaterThan(15);
  });

  it("keeps a minority partition from electing a leader", () => {
    const c = new Cluster({}, 9);
    runUntil(c, 500, () => c.leader() !== null);
    // Isolate two of five. They can campaign but can never reach three votes.
    c.setPartition(new Set([3, 4]));
    c.run(1500);
    for (const id of [3, 4]) {
      expect(c.nodes[id].role, `n${id} must not lead a minority`).not.toBe("leader");
    }
    // They did try, and burned terms doing it — so this is a real attempt.
    expect(c.nodes[3].currentTerm).toBeGreaterThan(1);
    expect(c.nodes.filter((n) => [0, 1, 2].includes(n.id) && n.role === "leader").length).toBe(1);
    expect(electionSafety(c)).toBeNull();
  });

  it("stops committing when the leader loses its majority, and resumes on heal", () => {
    const c = new Cluster({}, 13);
    runUntil(c, 500, () => c.leader() !== null);
    const leader = c.leader()!;
    const others = c.nodes.filter((n) => n.id !== leader.id).map((n) => n.id);
    // Strand the leader with one follower: a 2/5 side cannot commit.
    c.setPartition(new Set([leader.id, others[0]]));
    c.run(200);
    const before = leader.commitIndex;
    for (let i = 0; i < 5; i++) {
      c.submit(`stranded${i}`, leader.id);
      c.run(60);
    }
    // It accepted the writes but could not commit a single one.
    expect(leader.log.length).toBeGreaterThan(before + 5);
    expect(leader.commitIndex).toBe(before);

    c.setPartition(null);
    expect(runUntil(c, 2000, () => c.leader() !== null)).toBe(true);
    const idx = c.submit("after-heal");
    expect(idx).not.toBeNull();
    expect(runUntil(c, 2000, () => c.nodes.filter((n) => n.commitIndex >= idx!).length >= 3)).toBe(
      true,
    );
    expect(checkAll(c)).toBeNull();
  });

  it("overwrites a stale leader's uncommitted tail once it rejoins", () => {
    const c = new Cluster({}, 21);
    runUntil(c, 500, () => c.leader() !== null);
    const stale = c.leader()!;
    c.setPartition(new Set([stale.id])); // alone: it can append but never commit
    c.run(50);
    const committedBefore = stale.commitIndex;

    // Orphans: accepted by a leader that no longer commands a majority.
    const orphans = ["orphan0", "orphan1", "orphan2", "orphan3"];
    for (const cmd of orphans) {
      expect(c.submit(cmd, stale.id), `stale leader must accept ${cmd}`).not.toBeNull();
      c.run(30);
    }
    expect(stale.log.length - 1 - committedBefore).toBe(orphans.length);
    expect(stale.commitIndex).toBe(committedBefore);

    // The other four elect someone and commit real entries at those indices.
    expect(
      runUntil(c, 2000, () => c.nodes.some((n) => n.id !== stale.id && n.role === "leader")),
    ).toBe(true);
    const fresh = c.nodes.find((n) => n.id !== stale.id && n.role === "leader")!;
    const real = ["real0", "real1", "real2"];
    for (const cmd of real) {
      expect(c.submit(cmd, fresh.id), `fresh leader must accept ${cmd}`).not.toBeNull();
      c.run(80);
    }
    // Those genuinely committed on the majority side, unlike the orphans.
    expect(fresh.commitIndex).toBeGreaterThanOrEqual(real.length);

    c.setPartition(null);
    c.run(2000);

    // The stale node must abandon its orphaned tail and adopt the real log.
    expect(stale.role).not.toBe("leader");
    expect(stale.currentTerm).toBeGreaterThanOrEqual(fresh.currentTerm);
    for (const cmd of orphans) {
      expect(stale.log.some((e) => e.cmd === cmd), `${cmd} must be gone from n${stale.id}`).toBe(
        false,
      );
    }
    for (const cmd of real) {
      expect(stale.log.some((e) => e.cmd === cmd), `${cmd} must be on n${stale.id}`).toBe(true);
    }
    expect(stale.log.length).toBe(fresh.log.length);
    for (let i = 1; i < stale.log.length; i++) {
      expect(stale.log[i].term, `index ${i}`).toBe(fresh.log[i].term);
      expect(stale.log[i].cmd, `index ${i}`).toBe(fresh.log[i].cmd);
    }
    expect(checkAll(c)).toBeNull();
  });

  it("never rewrites a committed slot, on any node, at any point in history", () => {
    let checked = 0;
    let maxPrefix = 0;
    for (let seed = 30; seed < 42; seed++) {
      const c = new Cluster({}, seed);
      const rng = makeRng(seed);
      // The authoritative history: the first value seen committed at a slot.
      // Nothing may ever disagree with it, on any node, ever again.
      const committed = new Map<number, string>();
      let healAt = -1;
      const audit = (t: number) => {
        for (const n of c.nodes) {
          for (let i = 1; i <= n.commitIndex; i++) {
            const key = `${n.log[i].term}:${n.log[i].cmd}`;
            const seen = committed.get(i);
            if (seen === undefined) committed.set(i, key);
            else expect(key, `n${n.id} slot ${i} (seed ${seed}, t ${t})`).toBe(seen);
            checked++;
          }
          // Committed entries must still be there at all.
          expect(n.log.length - 1, `n${n.id} truncated below commitIndex`).toBeGreaterThanOrEqual(
            n.commitIndex,
          );
          // And the applied prefix must line up with the committed log.
          for (let i = 1; i <= n.lastApplied; i++) {
            expect(n.applied[i - 1], `n${n.id} applied slot ${i}`).toBe(n.log[i].cmd);
            checked++;
          }
        }
      };
      for (let t = 0; t < 3000; t++) {
        c.tick();
        if (t === healAt) c.setPartition(null);
        if (t % 53 === 0) c.submit();
        if (t % 700 === 0 && t > 0) {
          c.setPartition(new Set([Math.floor(rng() * 5), Math.floor(rng() * 5)]));
          healAt = t + 150;
        }
        if (t === 1800) c.crash(2);
        if (t === 2100) c.revive(2);
        // Full-prefix audit periodically, plus one on the final state.
        if (t % 20 === 0) audit(t);
      }
      audit(3000);
      expect(checkAll(c), `seed ${seed}`).toBeNull();
      expect(maxCommit(c), `seed ${seed}`).toBeGreaterThan(0);
      maxPrefix = Math.max(maxPrefix, committed.size);
    }
    // The audit has to have actually inspected a deep committed history.
    expect(checked).toBeGreaterThan(100000);
    expect(maxPrefix).toBeGreaterThan(20);
  });
});

describe("Raft determinism", () => {
  it("replays identically for the same seed", () => {
    const trace = (seed: number) => {
      const c = new Cluster({}, seed);
      const out: string[] = [];
      for (let t = 0; t < 600; t++) {
        c.tick();
        if (t % 71 === 0) c.submit();
        const l = c.leader();
        out.push(`${l ? l.id : "-"}:${l ? l.currentTerm : 0}:${c.nodes[0].commitIndex}`);
      }
      return out.join("|");
    };
    expect(trace(99)).toBe(trace(99));
    expect(trace(99)).not.toBe(trace(100));
  });
});

describe("the invariant checks themselves", () => {
  it("reports a planted two-leader term", () => {
    const c = new Cluster({}, 1);
    c.leadersByTerm.set(4, new Set([1, 3]));
    expect(electionSafety(c)).toMatch(/term 4 had 2 leaders/);
  });

  it("reports a planted divergent log", () => {
    const c = new Cluster({}, 1);
    c.nodes[0].log = [{ term: 0, cmd: "" }, { term: 1, cmd: "a" }, { term: 2, cmd: "x" }];
    c.nodes[1].log = [{ term: 0, cmd: "" }, { term: 1, cmd: "b" }, { term: 2, cmd: "x" }];
    expect(logMatching(c)).toMatch(/differ at 1/);
  });

  it("reports planted divergent applied histories", () => {
    const c = new Cluster({}, 1);
    c.nodes[0].applied = ["a", "b"];
    c.nodes[1].applied = ["a", "c"];
    expect(appliedPrefixes(c)).toMatch(/slot 1/);
  });

  it("passes a clean cluster, so the checks are not simply always failing", () => {
    const c = new Cluster({}, 2);
    c.run(2000);
    expect(checkAll(c)).toBeNull();
  });
});
