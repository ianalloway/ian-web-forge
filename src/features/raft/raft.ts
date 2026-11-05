/**
 * A deterministic Raft cluster, small enough to watch and strict enough to
 * test. Logical time advances one tick at a time; every message spends a few
 * ticks on the wire, so elections, split votes and stale leaders all happen
 * for the reasons they happen in a real cluster.
 *
 * Implements the parts of Raft that carry the safety argument: term-scoped
 * voting with the up-to-date-log restriction, AppendEntries consistency
 * checks with conflict truncation, and commit-by-majority restricted to the
 * leader's own term. Not implemented: log compaction, membership changes,
 * persistent storage across restarts beyond term/vote/log.
 */

export type Role = "follower" | "candidate" | "leader";

export interface Entry {
  term: number;
  cmd: string;
}

export type MsgKind = "vote-req" | "vote-reply" | "append" | "append-reply";

export interface Message {
  id: number;
  kind: MsgKind;
  from: number;
  to: number;
  term: number;
  sentAt: number;
  arriveAt: number;
  /** vote-req: the candidate's last log slot, used for the election restriction. */
  lastLogIndex?: number;
  lastLogTerm?: number;
  /** vote-reply */
  granted?: boolean;
  /** append-reply */
  success?: boolean;
  /** append-reply: highest index the follower now agrees on. */
  matchIndex?: number;
  /** append */
  prevLogIndex?: number;
  prevLogTerm?: number;
  entries?: Entry[];
  leaderCommit?: number;
}

export interface RaftNode {
  id: number;
  role: Role;
  alive: boolean;
  currentTerm: number;
  votedFor: number | null;
  /** 1-based; slot 0 is a term-0 sentinel so prevLogIndex 0 means "empty". */
  log: Entry[];
  commitIndex: number;
  lastApplied: number;
  applied: string[];
  votesFrom: Set<number>;
  nextIndex: number[];
  matchIndex: number[];
  electionDeadline: number;
  heartbeatDeadline: number;
}

export interface Params {
  size: number;
  electionMin: number;
  electionMax: number;
  heartbeat: number;
  latencyMin: number;
  latencyMax: number;
  dropRate: number;
}

export const DEFAULT_PARAMS: Params = {
  size: 5,
  electionMin: 60,
  electionMax: 120,
  heartbeat: 20,
  latencyMin: 3,
  latencyMax: 9,
  dropRate: 0,
};

export interface ClusterEvent {
  at: number;
  text: string;
}

/** mulberry32 — small, fast, and identical across runs for a given seed. */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Cluster {
  now = 0;
  nodes: RaftNode[] = [];
  wire: Message[] = [];
  events: ClusterEvent[] = [];
  params: Params;
  /**
   * null means one connected network. Otherwise the set holds one side of a
   * two-way split: two nodes can talk only if they are on the same side.
   */
  partition: Set<number> | null = null;
  /** Every (term, leader) pair ever observed — the election-safety ledger. */
  leadersByTerm = new Map<number, Set<number>>();
  private rng: () => number;
  private nextMsgId = 1;
  private nextCmd = 1;

  constructor(params: Partial<Params> = {}, seed = 1) {
    this.params = { ...DEFAULT_PARAMS, ...params };
    this.rng = makeRng(seed);
    for (let i = 0; i < this.params.size; i++) {
      this.nodes.push({
        id: i,
        role: "follower",
        alive: true,
        currentTerm: 0,
        votedFor: null,
        log: [{ term: 0, cmd: "" }],
        commitIndex: 0,
        lastApplied: 0,
        applied: [],
        votesFrom: new Set(),
        nextIndex: new Array(this.params.size).fill(1),
        matchIndex: new Array(this.params.size).fill(0),
        electionDeadline: this.nextElectionDeadline(),
        heartbeatDeadline: 0,
      });
    }
  }

  private nextElectionDeadline(): number {
    const { electionMin, electionMax } = this.params;
    return this.now + electionMin + Math.floor(this.rng() * (electionMax - electionMin));
  }

  private majority(): number {
    return Math.floor(this.params.size / 2) + 1;
  }

  /** Can these two nodes exchange messages right now? */
  connected(a: number, b: number): boolean {
    if (this.partition === null) return true;
    return this.partition.has(a) === this.partition.has(b);
  }

  private note(text: string) {
    this.events.push({ at: this.now, text });
    if (this.events.length > 200) this.events.shift();
  }

  private lastLogIndex(n: RaftNode): number {
    return n.log.length - 1;
  }

  private lastLogTerm(n: RaftNode): number {
    return n.log[n.log.length - 1].term;
  }

  private send(m: Omit<Message, "id" | "sentAt" | "arriveAt">) {
    const { latencyMin, latencyMax } = this.params;
    const latency = latencyMin + Math.floor(this.rng() * (latencyMax - latencyMin + 1));
    this.wire.push({
      ...m,
      id: this.nextMsgId++,
      sentAt: this.now,
      arriveAt: this.now + latency,
    });
  }

  /** Step down to follower in a newer term. */
  private stepDown(n: RaftNode, term: number) {
    if (term > n.currentTerm) {
      n.currentTerm = term;
      n.votedFor = null;
    }
    if (n.role !== "follower") {
      this.note(`n${n.id} steps down to follower (term ${term})`);
      n.role = "follower";
    }
    n.votesFrom.clear();
    n.electionDeadline = this.nextElectionDeadline();
  }

  private becomeCandidate(n: RaftNode) {
    n.currentTerm++;
    n.role = "candidate";
    n.votedFor = n.id;
    n.votesFrom = new Set([n.id]);
    n.electionDeadline = this.nextElectionDeadline();
    this.note(`n${n.id} starts election for term ${n.currentTerm}`);
    for (const peer of this.nodes) {
      if (peer.id === n.id) continue;
      this.send({
        kind: "vote-req",
        from: n.id,
        to: peer.id,
        term: n.currentTerm,
        lastLogIndex: this.lastLogIndex(n),
        lastLogTerm: this.lastLogTerm(n),
      });
    }
    // A single-node cluster wins its own election immediately.
    if (n.votesFrom.size >= this.majority()) this.becomeLeader(n);
  }

  private becomeLeader(n: RaftNode) {
    n.role = "leader";
    n.votesFrom.clear();
    const last = this.lastLogIndex(n);
    n.nextIndex = new Array(this.params.size).fill(last + 1);
    n.matchIndex = new Array(this.params.size).fill(0);
    n.matchIndex[n.id] = last;
    n.heartbeatDeadline = this.now; // heartbeat at once, to assert authority
    this.note(`n${n.id} becomes leader of term ${n.currentTerm}`);
    let set = this.leadersByTerm.get(n.currentTerm);
    if (!set) {
      set = new Set();
      this.leadersByTerm.set(n.currentTerm, set);
    }
    set.add(n.id);
  }

  private sendAppend(leader: RaftNode, to: number) {
    const next = leader.nextIndex[to];
    const prevLogIndex = next - 1;
    this.send({
      kind: "append",
      from: leader.id,
      to,
      term: leader.currentTerm,
      prevLogIndex,
      prevLogTerm: leader.log[prevLogIndex]?.term ?? 0,
      entries: leader.log.slice(next),
      leaderCommit: leader.commitIndex,
    });
  }

  /** Apply everything committed but not yet applied. */
  private applyCommitted(n: RaftNode) {
    while (n.lastApplied < n.commitIndex) {
      n.lastApplied++;
      n.applied.push(n.log[n.lastApplied].cmd);
    }
  }

  private handleVoteReq(n: RaftNode, m: Message) {
    if (m.term > n.currentTerm) this.stepDown(n, m.term);
    let granted = false;
    if (m.term === n.currentTerm && (n.votedFor === null || n.votedFor === m.from)) {
      // The election restriction: only vote for a log at least as up to date.
      const myTerm = this.lastLogTerm(n);
      const myIndex = this.lastLogIndex(n);
      const theirTerm = m.lastLogTerm ?? 0;
      const theirIndex = m.lastLogIndex ?? 0;
      if (theirTerm > myTerm || (theirTerm === myTerm && theirIndex >= myIndex)) {
        granted = true;
        n.votedFor = m.from;
        n.electionDeadline = this.nextElectionDeadline();
      }
    }
    this.send({
      kind: "vote-reply",
      from: n.id,
      to: m.from,
      term: n.currentTerm,
      granted,
    });
  }

  private handleVoteReply(n: RaftNode, m: Message) {
    if (m.term > n.currentTerm) {
      this.stepDown(n, m.term);
      return;
    }
    if (n.role !== "candidate" || m.term !== n.currentTerm) return;
    if (!m.granted) return;
    n.votesFrom.add(m.from);
    if (n.votesFrom.size >= this.majority()) this.becomeLeader(n);
  }

  private handleAppend(n: RaftNode, m: Message) {
    if (m.term < n.currentTerm) {
      this.send({
        kind: "append-reply",
        from: n.id,
        to: m.from,
        term: n.currentTerm,
        success: false,
        matchIndex: 0,
      });
      return;
    }
    // A current-or-newer leader exists: become/stay a follower and reset the
    // clock. m.term >= currentTerm here, so stepDown adopts it.
    this.stepDown(n, m.term);

    const prevLogIndex = m.prevLogIndex ?? 0;
    const prevLogTerm = m.prevLogTerm ?? 0;
    const have = n.log[prevLogIndex];
    if (!have || have.term !== prevLogTerm) {
      this.send({
        kind: "append-reply",
        from: n.id,
        to: m.from,
        term: n.currentTerm,
        success: false,
        matchIndex: 0,
      });
      return;
    }

    // Truncate on the first conflicting entry, then append the rest.
    const entries = m.entries ?? [];
    for (let i = 0; i < entries.length; i++) {
      const idx = prevLogIndex + 1 + i;
      if (n.log[idx] && n.log[idx].term !== entries[i].term) {
        n.log.length = idx;
      }
      if (!n.log[idx]) n.log[idx] = entries[i];
    }
    const lastNew = prevLogIndex + entries.length;

    const leaderCommit = m.leaderCommit ?? 0;
    if (leaderCommit > n.commitIndex) {
      n.commitIndex = Math.min(leaderCommit, lastNew);
      this.applyCommitted(n);
    }

    this.send({
      kind: "append-reply",
      from: n.id,
      to: m.from,
      term: n.currentTerm,
      success: true,
      matchIndex: lastNew,
    });
  }

  private handleAppendReply(n: RaftNode, m: Message) {
    if (m.term > n.currentTerm) {
      this.stepDown(n, m.term);
      return;
    }
    if (n.role !== "leader" || m.term !== n.currentTerm) return;
    if (m.success) {
      const match = m.matchIndex ?? 0;
      if (match > n.matchIndex[m.from]) n.matchIndex[m.from] = match;
      n.nextIndex[m.from] = n.matchIndex[m.from] + 1;
      this.advanceCommit(n);
    } else if (n.nextIndex[m.from] > 1) {
      n.nextIndex[m.from]--;
    }
  }

  /**
   * Commit the highest index replicated on a majority — but only entries from
   * the current term. Committing an older-term entry on a bare majority count
   * is exactly the hole that lets a committed entry be overwritten later.
   */
  private advanceCommit(leader: RaftNode) {
    leader.matchIndex[leader.id] = this.lastLogIndex(leader);
    for (let n = this.lastLogIndex(leader); n > leader.commitIndex; n--) {
      if (leader.log[n].term !== leader.currentTerm) continue;
      let count = 0;
      for (const m of leader.matchIndex) if (m >= n) count++;
      if (count >= this.majority()) {
        leader.commitIndex = n;
        this.applyCommitted(leader);
        this.note(`entry ${n} committed on a majority`);
        break;
      }
    }
  }

  /**
   * Append a client command to a leader and return its index.
   *
   * With no `leaderId`, the command goes to whichever node currently claims
   * leadership — during a split that may well be a stale leader, which is the
   * realistic client's problem. Pass `leaderId` to address one specific node.
   */
  submit(cmd?: string, leaderId?: number): number | null {
    const leader =
      leaderId === undefined
        ? this.nodes.find((n) => n.alive && n.role === "leader")
        : this.nodes[leaderId]?.alive && this.nodes[leaderId].role === "leader"
          ? this.nodes[leaderId]
          : undefined;
    if (!leader) return null;
    const text = cmd ?? `set x=${this.nextCmd++}`;
    leader.log.push({ term: leader.currentTerm, cmd: text });
    const idx = this.lastLogIndex(leader);
    leader.matchIndex[leader.id] = idx;
    this.note(`n${leader.id} accepts "${text}" at index ${idx}`);
    return idx;
  }

  crash(id: number) {
    const n = this.nodes[id];
    if (!n.alive) return;
    n.alive = false;
    n.role = "follower";
    n.votesFrom.clear();
    this.note(`n${id} crashes`);
  }

  revive(id: number) {
    const n = this.nodes[id];
    if (n.alive) return;
    n.alive = true;
    n.role = "follower";
    n.electionDeadline = this.nextElectionDeadline();
    this.note(`n${id} restarts`);
  }

  setPartition(side: Set<number> | null) {
    this.partition = side === null || side.size === 0 ? null : side;
    this.note(
      this.partition
        ? `network splits: {${[...this.partition].map((i) => `n${i}`).join(",")}} | rest`
        : "network heals",
    );
  }

  leader(): RaftNode | null {
    return this.nodes.find((n) => n.alive && n.role === "leader") ?? null;
  }

  tick() {
    this.now++;

    // 1. Deliver anything whose flight time has elapsed.
    const stillFlying: Message[] = [];
    const arrived: Message[] = [];
    for (const m of this.wire) {
      if (m.arriveAt > this.now) {
        stillFlying.push(m);
        continue;
      }
      const to = this.nodes[m.to];
      if (!to.alive || !this.connected(m.from, m.to)) continue; // dropped
      if (this.params.dropRate > 0 && this.rng() < this.params.dropRate) continue;
      arrived.push(m);
    }
    this.wire = stillFlying;
    for (const m of arrived) {
      const n = this.nodes[m.to];
      if (!n.alive) continue;
      if (m.kind === "vote-req") this.handleVoteReq(n, m);
      else if (m.kind === "vote-reply") this.handleVoteReply(n, m);
      else if (m.kind === "append") this.handleAppend(n, m);
      else this.handleAppendReply(n, m);
    }

    // 2. Timers.
    for (const n of this.nodes) {
      if (!n.alive) continue;
      if (n.role === "leader") {
        if (this.now >= n.heartbeatDeadline) {
          n.heartbeatDeadline = this.now + this.params.heartbeat;
          for (const peer of this.nodes) {
            if (peer.id !== n.id) this.sendAppend(n, peer.id);
          }
          this.advanceCommit(n);
        }
      } else if (this.now >= n.electionDeadline) {
        this.becomeCandidate(n);
      }
    }
  }

  /** Run `n` ticks. */
  run(n: number) {
    for (let i = 0; i < n; i++) this.tick();
  }
}

/* ---------- invariant checks, shared by the page and the tests ---------- */

/** Raft's Election Safety: at most one leader per term, ever. */
export function electionSafety(c: Cluster): string | null {
  for (const [term, ids] of c.leadersByTerm) {
    if (ids.size > 1) {
      return `term ${term} had ${ids.size} leaders: ${[...ids].map((i) => `n${i}`).join(", ")}`;
    }
  }
  return null;
}

/**
 * Log Matching: if two logs hold the same term at the same index, every
 * preceding entry is identical too.
 */
export function logMatching(c: Cluster): string | null {
  const ns = c.nodes;
  for (let a = 0; a < ns.length; a++) {
    for (let b = a + 1; b < ns.length; b++) {
      const la = ns[a].log;
      const lb = ns[b].log;
      const upto = Math.min(la.length, lb.length) - 1;
      for (let i = upto; i >= 1; i--) {
        if (la[i].term !== lb[i].term) continue;
        for (let j = 1; j <= i; j++) {
          if (la[j].term !== lb[j].term || la[j].cmd !== lb[j].cmd) {
            return `n${a} and n${b} agree at index ${i} but differ at ${j}`;
          }
        }
        break;
      }
    }
  }
  return null;
}

/**
 * State Machine Safety, as observed: every pair of applied sequences is a
 * prefix of the other, so no two nodes ever applied different commands at the
 * same slot.
 */
export function appliedPrefixes(c: Cluster): string | null {
  const ns = c.nodes;
  for (let a = 0; a < ns.length; a++) {
    for (let b = a + 1; b < ns.length; b++) {
      const xa = ns[a].applied;
      const xb = ns[b].applied;
      const upto = Math.min(xa.length, xb.length);
      for (let i = 0; i < upto; i++) {
        if (xa[i] !== xb[i]) {
          return `n${a} applied "${xa[i]}" at slot ${i} but n${b} applied "${xb[i]}"`;
        }
      }
    }
  }
  return null;
}

export function checkAll(c: Cluster): string | null {
  return electionSafety(c) ?? logMatching(c) ?? appliedPrefixes(c);
}
