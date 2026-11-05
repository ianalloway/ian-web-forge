import { describe, expect, it } from "vitest";
import { type Op, Replica, converged, idKey, syncAll } from "./rga";

/** mulberry32 — a seeded RNG, so every case below replays identically. */
function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Shuffle a copy, deterministically. */
function shuffled<T>(xs: T[], rng: () => number): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

describe("a single replica behaves like a plain string", () => {
  it("matches JS string edits over thousands of random operations", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const rng = makeRng(seed);
      const r = new Replica(0);
      let plain = "";
      const alphabet = "abcdefghij";
      for (let step = 0; step < 300; step++) {
        if (plain.length === 0 || rng() < 0.65) {
          const pos = Math.floor(rng() * (plain.length + 1));
          const ch = alphabet[Math.floor(rng() * alphabet.length)];
          r.insertAt(pos, ch);
          plain = plain.slice(0, pos) + ch + plain.slice(pos);
        } else {
          const pos = Math.floor(rng() * plain.length);
          r.deleteAt(pos);
          plain = plain.slice(0, pos) + plain.slice(pos + 1);
        }
        expect(r.text(), `seed ${seed} step ${step}`).toBe(plain);
      }
      expect(plain.length).toBeGreaterThan(50);
    }
  });

  it("inserts text at a position", () => {
    const r = new Replica(0);
    r.insertText(0, "hello world");
    expect(r.text()).toBe("hello world");
    r.insertText(5, " there");
    expect(r.text()).toBe("hello there world");
    for (let i = 0; i < 6; i++) r.deleteAt(5);
    expect(r.text()).toBe("hello world");
  });
});

describe("convergence", () => {
  it("converges after concurrent edits on three replicas", () => {
    const rs = [new Replica(0), new Replica(1), new Replica(2)];
    rs[0].insertText(0, "shared");
    syncAll(rs);
    expect(converged(rs)).toBeNull();

    // All three edit while disconnected.
    rs[0].insertText(0, "A");
    rs[1].insertText(6, "B");
    rs[2].deleteAt(0);
    // They disagree right now — that is the point of the test.
    expect(new Set(rs.map((r) => r.text())).size).toBeGreaterThan(1);

    syncAll(rs);
    expect(converged(rs)).toBeNull();
    // Both inserts survived; the delete took out the original first char.
    const final = rs[0].text();
    expect(final).toContain("A");
    expect(final).toContain("B");
    expect(final).not.toContain("s");
  });

  it("converges under random concurrent edits and random delivery order", () => {
    let divergedBeforeSync = 0;
    let totalOps = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const rng = makeRng(seed * 31 + 7);
      const n = 4;
      const rs = Array.from({ length: n }, (_, i) => new Replica(i));
      rs[0].insertText(0, "seed");
      syncAll(rs);

      // Each replica makes local edits in isolation.
      const pool: Op[] = [];
      for (let round = 0; round < 6; round++) {
        for (const r of rs) {
          const k = 1 + Math.floor(rng() * 3);
          for (let j = 0; j < k; j++) {
            const len = r.text().length;
            if (len === 0 || rng() < 0.7) {
              pool.push(r.insertAt(Math.floor(rng() * (len + 1)), "xyzw"[Math.floor(rng() * 4)]));
            } else {
              const op = r.deleteAt(Math.floor(rng() * len));
              if (op) pool.push(op);
            }
          }
        }
      }
      totalOps += pool.length;
      if (new Set(rs.map((r) => r.text())).size > 1) divergedBeforeSync++;

      // Deliver every op to every replica in a different random order each.
      for (const r of rs) {
        for (const op of shuffled(pool, rng)) r.apply(op);
      }
      syncAll(rs);
      expect(converged(rs), `seed ${seed}`).toBeNull();
      for (const r of rs) expect(r.pendingCount, `seed ${seed} r${r.id}`).toBe(0);
    }
    // Non-vacuity: the replicas really were in conflict before syncing.
    expect(divergedBeforeSync).toBeGreaterThan(50);
    expect(totalOps).toBeGreaterThan(2000);
  });

  it("is commutative: delivery order cannot change the result", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const rng = makeRng(seed * 977);
      const src = [new Replica(0), new Replica(1), new Replica(2)];
      src[0].insertText(0, "base");
      syncAll(src);
      for (let i = 0; i < 18; i++) {
        const r = src[Math.floor(rng() * src.length)];
        const len = r.text().length;
        if (len === 0 || rng() < 0.75) {
          r.insertAt(Math.floor(rng() * (len + 1)), "pqrs"[Math.floor(rng() * 4)]);
        } else {
          r.deleteAt(Math.floor(rng() * len));
        }
      }

      // Every op any replica knows, deduped — including the shared base, whose
      // characters later inserts are anchored to.
      const byId = new Map<string, Op>();
      for (const r of src) for (const op of r.ops) byId.set(idKey(op.id), op);
      const pool = [...byId.values()];
      expect(pool.length).toBeGreaterThan(18);

      // Replay the same ops into fresh replicas in five different orders.
      const results = new Set<string>();
      for (let trial = 0; trial < 5; trial++) {
        const fresh = new Replica(9);
        const order = shuffled(pool, makeRng(seed * 100 + trial));
        // Repeat until everything has been integrated (parked ops included).
        for (let pass = 0; pass < 3; pass++) for (const op of order) fresh.apply(op);
        expect(fresh.pendingCount, `seed ${seed} trial ${trial}`).toBe(0);
        results.add(fresh.text());
      }
      expect(results.size, `seed ${seed} produced ${results.size} different documents`).toBe(1);
    }
  });

  it("is idempotent: redelivering ops changes nothing", () => {
    const rng = makeRng(4242);
    const a = new Replica(0);
    const b = new Replica(1);
    a.insertText(0, "idempotent");
    b.mergeFrom(a);
    a.insertText(3, "X");
    b.insertText(0, "Y");
    const pool = [...a.ops, ...b.ops];

    const once = new Replica(5);
    for (let pass = 0; pass < 3; pass++) for (const op of pool) once.apply(op);
    const snapshot = once.text();
    const elemCount = once.elems.length;

    // Ten more deliveries of everything, shuffled.
    for (let i = 0; i < 10; i++) for (const op of shuffled(pool, rng)) once.apply(op);
    expect(once.text()).toBe(snapshot);
    expect(once.elems.length).toBe(elemCount);
  });

  it("parks ops that arrive before the character they refer to", () => {
    const a = new Replica(0);
    a.insertText(0, "abc");
    const [first, , third] = a.ops;
    const late = new Replica(1);
    // Deliver the third insert first: it points at a character not yet here.
    expect(late.apply(third)).toBe(false);
    expect(late.pendingCount).toBe(1);
    expect(late.text()).toBe("");
    // Now the rest arrives and the parked op lands in the right place.
    for (const op of a.ops) if (op !== third) late.apply(op);
    expect(late.pendingCount).toBe(0);
    expect(late.text()).toBe("abc");
    expect(late.has(first)).toBe(true);
  });
});

describe("the cases that make CRDTs tricky", () => {
  it("keeps both characters when two replicas insert at the same spot", () => {
    const a = new Replica(0);
    const b = new Replica(1);
    a.insertText(0, "ac");
    b.mergeFrom(a);
    // Both type a different character into the same gap, concurrently.
    a.insertAt(1, "X");
    b.insertAt(1, "Y");
    syncAll([a, b]);
    expect(converged([a, b])).toBeNull();
    // Neither write is lost — this is the property a last-writer-wins field
    // would fail. Both land between "a" and "c", in a deterministic order.
    expect(a.text()).toMatch(/^a(XY|YX)c$/);
    expect(a.text()).toHaveLength(4);
  });

  it("breaks ties the same way on every replica, whoever merges first", () => {
    // Build the same concurrent pair twice, merging in opposite directions.
    const build = (mergeAIntoBFirst: boolean) => {
      const a = new Replica(0);
      const b = new Replica(1);
      a.insertText(0, "..");
      b.mergeFrom(a);
      a.insertAt(1, "A");
      b.insertAt(1, "B");
      if (mergeAIntoBFirst) {
        b.mergeFrom(a);
        a.mergeFrom(b);
      } else {
        a.mergeFrom(b);
        b.mergeFrom(a);
      }
      expect(converged([a, b])).toBeNull();
      return a.text();
    };
    expect(build(true)).toBe(build(false));
  });

  it("still places an insert that was typed after a concurrently deleted character", () => {
    const a = new Replica(0);
    const b = new Replica(1);
    a.insertText(0, "abc");
    b.mergeFrom(a);
    // a deletes "b"; b concurrently types "Z" right after "b".
    a.deleteAt(1);
    b.insertAt(2, "Z");
    syncAll([a, b]);
    expect(converged([a, b])).toBeNull();
    // The tombstone is what lets Z keep its anchor rather than being dropped.
    expect(a.text()).toBe("aZc");
  });

  it("converges when a replica deletes everything while another appends", () => {
    const a = new Replica(0);
    const b = new Replica(1);
    a.insertText(0, "wipe me");
    b.mergeFrom(a);
    while (a.text().length > 0) a.deleteAt(0);
    b.insertText(b.text().length, "!!!");
    syncAll([a, b]);
    expect(converged([a, b])).toBeNull();
    expect(a.text()).toBe("!!!");
  });

  it("survives a three-way split that heals in stages", () => {
    const rs = [new Replica(0), new Replica(1), new Replica(2)];
    rs[0].insertText(0, "start");
    syncAll(rs);
    rs[0].insertText(5, "-zero");
    rs[1].insertText(0, "one-");
    rs[2].deleteAt(2);
    // Heal 0 and 1 only.
    rs[0].mergeFrom(rs[1]);
    rs[1].mergeFrom(rs[0]);
    expect(converged([rs[0], rs[1]])).toBeNull();
    expect(converged(rs)).not.toBeNull(); // r2 is still out of date
    // Now bring in r2.
    syncAll(rs);
    expect(converged(rs)).toBeNull();
    expect(rs[0].text()).toBe("one-strt-zero");
  });
});

describe("the convergence check itself", () => {
  it("reports replicas that read differently", () => {
    const a = new Replica(0);
    const b = new Replica(1);
    a.insertText(0, "x");
    expect(converged([a, b])).toMatch(/reads "x" but r1 reads ""/);
  });

  it("reports replicas that agree on text but not on element order", () => {
    const a = new Replica(0);
    const b = new Replica(1);
    a.insertText(0, "ab");
    b.mergeFrom(a);
    expect(converged([a, b])).toBeNull();
    // Reorder b's spine behind its own back: same text, different ids.
    b.elems = [...b.elems].reverse();
    b.elems = b.elems.map((e) => ({ ...e }));
    const textSame = a.text() !== b.text();
    expect(textSame).toBe(true); // reversing two chars changes the text
    // Use a one-character doc so the text matches but the ids differ.
    const c = new Replica(2);
    const d = new Replica(3);
    c.insertText(0, "zz");
    d.insertText(0, "zz");
    expect(c.text()).toBe(d.text());
    expect(converged([c, d])).toMatch(/not on element order/);
  });

  it("passes for a single replica and for genuinely synced ones", () => {
    expect(converged([new Replica(0)])).toBeNull();
    const rs = [new Replica(0), new Replica(1)];
    rs[0].insertText(0, "same");
    syncAll(rs);
    expect(converged(rs)).toBeNull();
    expect(rs.map((r) => r.ops.map((o) => idKey(o.id)).join()).join("|")).toContain("0:1");
  });
});
