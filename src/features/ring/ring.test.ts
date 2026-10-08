import { describe, expect, it } from "vitest";
import {
  NODE_NAMES,
  addNode,
  clone,
  distribution,
  hash,
  loadImbalance,
  lookup,
  makeKeys,
  naiveLookup,
  naiveRemapFraction,
  newRing,
  remapFraction,
  removeNode,
} from "./ring";

const KEYS = makeKeys(20000);

describe("placement", () => {
  it("sends a key to the first node clockwise from it", () => {
    const ring = newRing(4, ["alpha", "bravo", "charlie"]);
    for (const key of makeKeys(500)) {
      const h = hash(key);
      // Work it out the slow, obvious way and compare.
      const ahead = ring.placements.filter((p) => p.position >= h);
      const expected = (ahead.length > 0 ? ahead[0] : ring.placements[0]).node;
      expect(lookup(ring, key)).toBe(expected);
    }
  });

  it("is deterministic and total", () => {
    const ring = newRing(8, NODE_NAMES.slice(0, 4));
    for (const key of makeKeys(1000)) {
      const node = lookup(ring, key);
      expect(ring.nodes).toContain(node);
      expect(lookup(ring, key)).toBe(node);
    }
  });

  it("has nowhere to send anything when empty", () => {
    expect(lookup(newRing(4), "key-1")).toBeNull();
    expect(naiveLookup([], "key-1")).toBeNull();
  });

  it("ignores a node added twice", () => {
    const ring = newRing(4, ["alpha"]);
    const before = ring.placements.length;
    addNode(ring, "alpha");
    expect(ring.nodes).toEqual(["alpha"]);
    expect(ring.placements.length).toBe(before);
  });
});

describe("the whole point: what moves when the cluster changes", () => {
  it("remaps about 1/n of keys when the nth node joins", () => {
    for (const n of [3, 4, 5, 6]) {
      const before = newRing(200, NODE_NAMES.slice(0, n));
      const after = clone(before);
      addNode(after, NODE_NAMES[n]);

      const moved = remapFraction(before, after, KEYS);
      const ideal = 1 / (n + 1);
      // Within half the ideal share either way: the guarantee is approximate,
      // but it is nothing like the modulus.
      expect(moved).toBeGreaterThan(ideal * 0.5);
      expect(moved).toBeLessThan(ideal * 1.5);
    }
  });

  it("beats hash % n by a wide margin, which is the entire argument", () => {
    const nodes = NODE_NAMES.slice(0, 4);
    const before = newRing(200, nodes);
    const after = clone(before);
    addNode(after, NODE_NAMES[4]);

    const consistent = remapFraction(before, after, KEYS);
    const naive = naiveRemapFraction(nodes, [...nodes, NODE_NAMES[4]], KEYS);

    expect(consistent).toBeLessThan(0.3); // about 1/5
    expect(naive).toBeGreaterThan(0.7); // about 4/5
    expect(naive).toBeGreaterThan(consistent * 3);
  });

  it("moves only the departing node's keys when one leaves", () => {
    const before = newRing(200, NODE_NAMES.slice(0, 5));
    const owned = distribution(before, KEYS).get("charlie")!;
    const after = clone(before);
    removeNode(after, "charlie");

    // Every key that moved must have belonged to the node that left.
    for (const key of KEYS) {
      if (lookup(before, key) !== lookup(after, key)) expect(lookup(before, key)).toBe("charlie");
    }
    expect(remapFraction(before, after, KEYS)).toBeCloseTo(owned / KEYS.length, 10);
  });

  it("puts everything back when a node leaves and rejoins", () => {
    const ring = newRing(100, NODE_NAMES.slice(0, 4));
    const owners = KEYS.map((k) => lookup(ring, k));
    removeNode(ring, "bravo");
    addNode(ring, "bravo");
    expect(KEYS.map((k) => lookup(ring, k))).toEqual(owners);
  });
});

describe("virtual nodes", () => {
  it("evens out the load as replicas increase", () => {
    const nodes = NODE_NAMES.slice(0, 6);
    const coarse = loadImbalance(newRing(1, nodes), KEYS);
    const medium = loadImbalance(newRing(20, nodes), KEYS);
    const fine = loadImbalance(newRing(400, nodes), KEYS);
    expect(medium).toBeLessThan(coarse);
    expect(fine).toBeLessThan(medium);
    // With enough replicas the spread should be a few percent, not tens.
    expect(fine).toBeLessThan(0.12);
  });

  it("gives every node a share of the keys at a sane replica count", () => {
    const ring = newRing(200, NODE_NAMES.slice(0, 5));
    for (const [, count] of distribution(ring, KEYS)) {
      expect(count).toBeGreaterThan(KEYS.length / 5 / 2);
    }
  });

  it("places one point per replica per node", () => {
    const ring = newRing(16, NODE_NAMES.slice(0, 3));
    expect(ring.placements.length).toBe(48);
    // And they stay sorted, which the binary search depends on.
    for (let i = 1; i < ring.placements.length; i++) {
      expect(ring.placements[i].position).toBeGreaterThanOrEqual(ring.placements[i - 1].position);
    }
  });
});
