/**
 * A replicated text buffer with no coordination at all.
 *
 * Raft gets agreement by electing a leader and making everyone follow its log.
 * A CRDT takes the opposite route: design the data so that *any* order of
 * merges lands in the same place, and you never need to agree on an order.
 *
 * This is an RGA (Replicated Growable Array). Every character gets a unique
 * id and remembers which character it was typed after, so the document is
 * really a tree flattened into a sequence. Deletes leave tombstones, because
 * a character that is gone is still something later inserts can point at.
 *
 * The properties that make it work — commutativity, associativity,
 * idempotence of merge — are exported below and exercised in rga.test.ts.
 */

export interface Id {
  /** Which replica minted this id. */
  replica: number;
  /** That replica's local counter, monotonically increasing. */
  counter: number;
}

export interface Elem {
  id: Id;
  char: string;
  /** The element this was typed after; null means the very start. */
  after: Id | null;
  deleted: boolean;
}

export type Op =
  | { kind: "insert"; id: Id; char: string; after: Id | null }
  | { kind: "delete"; id: Id; target: Id };

export const idEq = (a: Id | null, b: Id | null): boolean =>
  a === null || b === null ? a === b : a.replica === b.replica && a.counter === b.counter;

export const idKey = (id: Id): string => `${id.replica}:${id.counter}`;

/**
 * A total order on ids. Later counters win; the replica number breaks ties so
 * that two replicas typing concurrently still agree on who goes first.
 */
export function compareId(a: Id, b: Id): number {
  if (a.counter !== b.counter) return a.counter - b.counter;
  return a.replica - b.replica;
}

export class Replica {
  readonly id: number;
  /** Document order, tombstones included. */
  elems: Elem[] = [];
  /** Every op this replica has integrated, for merging into another. */
  ops: Op[] = [];
  private seen = new Set<string>();
  private counter = 0;
  /** Ops that arrived before the element they refer to; retried on each merge. */
  private pending: Op[] = [];

  constructor(id: number) {
    this.id = id;
  }

  private mint(): Id {
    return { replica: this.id, counter: ++this.counter };
  }

  private indexOf(id: Id): number {
    return this.elems.findIndex((e) => idEq(e.id, id));
  }

  /** The visible text, tombstones skipped. */
  text(): string {
    let s = "";
    for (const e of this.elems) if (!e.deleted) s += e.char;
    return s;
  }

  /** Visible characters only, as elements — the view a cursor indexes into. */
  visible(): Elem[] {
    return this.elems.filter((e) => !e.deleted);
  }

  /**
   * Integrate one op. Returns false if it cannot be applied yet because the
   * element it references has not arrived; such ops are parked and retried.
   */
  apply(op: Op): boolean {
    const key = idKey(op.id);
    // Idempotence: re-delivering an op must change nothing at all.
    if (this.seen.has(key)) return true;

    if (op.kind === "insert") {
      let i: number;
      if (op.after === null) {
        i = 0;
      } else {
        const at = this.indexOf(op.after);
        if (at < 0) {
          this.park(op);
          return false;
        }
        i = at + 1;
      }
      // Concurrent inserts at the same spot: the higher id sorts first, so
      // skip past anything already there that outranks this one. Every
      // replica applies the same rule, so they all land on the same order.
      while (i < this.elems.length && compareId(this.elems[i].id, op.id) > 0) i++;
      this.elems.splice(i, 0, {
        id: op.id,
        char: op.char,
        after: op.after,
        deleted: false,
      });
    } else {
      const at = this.indexOf(op.target);
      if (at < 0) {
        this.park(op);
        return false;
      }
      // Deleting twice is the same as deleting once.
      this.elems[at].deleted = true;
    }

    this.seen.add(key);
    this.ops.push(op);
    // Keep the local counter ahead of anything seen, so new ids stay unique
    // and causally later ops really do carry larger counters.
    if (op.id.counter > this.counter) this.counter = op.id.counter;
    this.drainPending();
    return true;
  }

  private park(op: Op) {
    if (!this.pending.some((p) => idEq(p.id, op.id))) this.pending.push(op);
  }

  private drainPending() {
    let progress = true;
    while (progress) {
      progress = false;
      for (let i = 0; i < this.pending.length; i++) {
        const op = this.pending[i];
        const ready =
          op.kind === "insert"
            ? op.after === null || this.indexOf(op.after) >= 0
            : this.indexOf(op.target) >= 0;
        if (!ready) continue;
        this.pending.splice(i, 1);
        this.apply(op);
        progress = true;
        break;
      }
    }
  }

  /** Local edit: insert `char` at visible position `pos`. */
  insertAt(pos: number, char: string): Op {
    const vis = this.visible();
    const after = pos <= 0 ? null : (vis[Math.min(pos, vis.length) - 1]?.id ?? null);
    const op: Op = { kind: "insert", id: this.mint(), char, after };
    this.apply(op);
    return op;
  }

  /** Local edit: delete the character at visible position `pos`. */
  deleteAt(pos: number): Op | null {
    const vis = this.visible();
    const target = vis[pos];
    if (!target) return null;
    const op: Op = { kind: "delete", id: this.mint(), target: target.id };
    this.apply(op);
    return op;
  }

  /** Type a whole string at a visible position. */
  insertText(pos: number, text: string): Op[] {
    const out: Op[] = [];
    for (let i = 0; i < text.length; i++) out.push(this.insertAt(pos + i, text[i]));
    return out;
  }

  /** Pull in everything `other` knows that this replica has not seen. */
  mergeFrom(other: Replica): number {
    let applied = 0;
    for (const op of other.ops) {
      if (this.seen.has(idKey(op.id))) continue;
      this.apply(op);
      applied++;
    }
    return applied;
  }

  /** Ops `other` has not seen — what a one-way sync would carry. */
  opsMissingFrom(other: Replica): Op[] {
    return this.ops.filter((op) => !other.seen.has(idKey(op.id)));
  }

  has(op: Op): boolean {
    return this.seen.has(idKey(op.id));
  }

  get pendingCount(): number {
    return this.pending.length;
  }

  clone(): Replica {
    const r = new Replica(this.id);
    r.elems = this.elems.map((e) => ({ ...e }));
    r.ops = [...this.ops];
    r.seen = new Set(this.seen);
    r.counter = this.counter;
    r.pending = [...this.pending];
    return r;
  }
}

/* ------------------------------ convergence ------------------------------ */

/**
 * Strong eventual consistency: replicas that have seen the same set of ops
 * must show the same document. Returns a description of the first
 * disagreement, or null.
 */
export function converged(replicas: Replica[]): string | null {
  if (replicas.length < 2) return null;
  const want = replicas[0].text();
  for (let i = 1; i < replicas.length; i++) {
    const got = replicas[i].text();
    if (got !== want) {
      return `r${replicas[0].id} reads "${want}" but r${replicas[i].id} reads "${got}"`;
    }
  }
  // The visible text matching is the user-facing claim, but the element
  // sequence must match too, or the next concurrent edit will diverge.
  const spine = (r: Replica) => r.elems.map((e) => `${idKey(e.id)}${e.deleted ? "-" : "+"}`).join(",");
  const wantSpine = spine(replicas[0]);
  for (let i = 1; i < replicas.length; i++) {
    if (spine(replicas[i]) !== wantSpine) {
      return `r${replicas[0].id} and r${replicas[i].id} agree on text but not on element order`;
    }
  }
  return null;
}

/** Deliver every op everywhere, in the given order, until all are in sync. */
export function syncAll(replicas: Replica[]) {
  // Two passes: the second lets parked ops land once their origins arrive.
  for (let pass = 0; pass < 2; pass++) {
    for (const a of replicas) {
      for (const b of replicas) {
        if (a !== b) a.mergeFrom(b);
      }
    }
  }
}
