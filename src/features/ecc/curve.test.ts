import { describe, expect, it } from "vitest";
import {
  type Curve,
  type Point,
  PRESETS,
  SECP256K1,
  SECP256K1_G,
  SECP256K1_N,
  add,
  addReal,
  allPoints,
  curveOrder,
  discriminant,
  eq,
  hasseInterval,
  inv,
  isOnCurve,
  isSingular,
  ladderSteps,
  mod,
  mul,
  negate,
  pointOrder,
  subgroup,
} from "./curve";

const SMALL: Curve = { a: 2n, b: 3n, p: 97n };

describe("field arithmetic", () => {
  it("keeps mod non-negative", () => {
    expect(mod(-1n, 7n)).toBe(6n);
    expect(mod(-8n, 7n)).toBe(6n);
    expect(mod(15n, 7n)).toBe(1n);
    expect(mod(0n, 7n)).toBe(0n);
  });

  it("inverts every non-zero element of a prime field", () => {
    for (const p of [7n, 97n, 211n]) {
      for (let x = 1n; x < p; x++) {
        const y = inv(x, p);
        expect(mod(x * y, p), `${x} mod ${p}`).toBe(1n);
        // The inverse is a canonical residue, not merely congruent to one.
        // Callers here always re-reduce, but `inv` is exported and documented
        // to return a value in [0, p), so pin that rather than assume it.
        expect(y >= 0n && y < p, `inv(${x}, ${p}) = ${y} out of range`).toBe(true);
      }
    }
  });

  it("refuses to invert zero", () => {
    expect(() => inv(0n, 97n)).toThrow();
    expect(() => inv(97n, 97n)).toThrow();
  });

  it("flags singular curves", () => {
    // y² = x³ has a cusp; y² = x³ - 3x + 2 has a node. Both have 4a³+27b² = 0.
    expect(isSingular({ a: 0n, b: 0n, p: 97n })).toBe(true);
    expect(discriminant({ a: -3n, b: 2n, p: 97n })).toBe(0n);
    expect(isSingular({ a: -3n, b: 2n, p: 97n })).toBe(true);
    for (const preset of PRESETS) {
      expect(isSingular(preset.curve), preset.name).toBe(false);
    }
  });
});

describe("the group law", () => {
  it("every sum of on-curve points is on the curve", () => {
    const pts: Point[] = [null, ...allPoints(SMALL)];
    let checked = 0;
    for (const P of pts) {
      for (const Q of pts) {
        const R = add(SMALL, P, Q);
        expect(isOnCurve(SMALL, R)).toBe(true);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(2000);
  });

  it("has infinity as its identity", () => {
    for (const P of [null, ...allPoints(SMALL)]) {
      expect(eq(add(SMALL, P, null), P)).toBe(true);
      expect(eq(add(SMALL, null, P), P)).toBe(true);
    }
  });

  it("gives every point an inverse", () => {
    for (const P of allPoints(SMALL)) {
      expect(add(SMALL, P, negate(SMALL, P))).toBeNull();
    }
  });

  it("is commutative", () => {
    const pts: Point[] = [null, ...allPoints(SMALL)];
    for (const P of pts) {
      for (const Q of pts) {
        expect(eq(add(SMALL, P, Q), add(SMALL, Q, P))).toBe(true);
      }
    }
  });

  it("is associative — the axiom that is not obvious from the picture", () => {
    // Exhaustive over a curve small enough to afford the cube.
    const tiny: Curve = { a: 2n, b: 3n, p: 23n };
    const pts: Point[] = [null, ...allPoints(tiny)];
    expect(pts.length).toBeGreaterThan(20);
    let checked = 0;
    for (const P of pts) {
      for (const Q of pts) {
        const PQ = add(tiny, P, Q);
        for (const R of pts) {
          const left = add(tiny, PQ, R);
          const right = add(tiny, P, add(tiny, Q, R));
          expect(eq(left, right), `(${fmt(P)}+${fmt(Q)})+${fmt(R)}`).toBe(true);
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(10000);
  });

  it("doubles a point of order two to infinity", () => {
    // y² = x³ - x has roots at x = 0, 1, -1; each gives y = 0, so 2P = O.
    const c: Curve = { a: -1n, b: 0n, p: 191n };
    const twoTorsion = allPoints(c).filter((P) => P.y === 0n);
    expect(twoTorsion).toHaveLength(3);
    for (const P of twoTorsion) {
      expect(add(c, P, P)).toBeNull();
      expect(pointOrder(c, P)).toBe(2);
    }
  });
});

describe("scalar multiplication", () => {
  it("agrees with repeated addition", () => {
    for (const preset of PRESETS.slice(0, 2)) {
      const c = preset.curve;
      const G = allPoints(c)[3];
      let running: Point = null;
      for (let k = 0n; k <= 60n; k++) {
        expect(eq(mul(c, k, G), running), `${preset.name} k=${k}`).toBe(true);
        running = add(c, running, G);
      }
    }
  });

  it("handles zero and negative scalars", () => {
    const G = allPoints(SMALL)[5];
    expect(mul(SMALL, 0n, G)).toBeNull();
    expect(mul(SMALL, 1n, G)).toEqual(G);
    for (let k = 1n; k <= 20n; k++) {
      expect(eq(mul(SMALL, -k, G), negate(SMALL, mul(SMALL, k, G)))).toBe(true);
      expect(add(SMALL, mul(SMALL, k, G), mul(SMALL, -k, G))).toBeNull();
    }
  });

  it("wraps at the point's order", () => {
    const G = allPoints(SMALL)[5];
    const n = BigInt(pointOrder(SMALL, G));
    expect(mul(SMALL, n, G)).toBeNull();
    for (let k = 0n; k < 5n; k++) {
      expect(eq(mul(SMALL, k, G), mul(SMALL, k + n, G))).toBe(true);
    }
  });

  it("counts ladder steps the way double-and-add runs", () => {
    expect(ladderSteps(1n)).toEqual({ doublings: 1, additions: 1 });
    expect(ladderSteps(8n)).toEqual({ doublings: 4, additions: 1 });
    expect(ladderSteps(255n)).toEqual({ doublings: 8, additions: 8 });
    expect(ladderSteps(0n)).toEqual({ doublings: 0, additions: 0 });
    // A 256-bit scalar costs ~256 doublings, not 2^256 additions. That gap is
    // the entire reason the scheme is usable.
    expect(ladderSteps(SECP256K1_N).doublings).toBe(256);
  });
});

describe("subgroup structure", () => {
  it("obeys Lagrange: every point's order divides the curve's", () => {
    for (const preset of PRESETS) {
      const c = preset.curve;
      const N = curveOrder(c);
      for (const P of allPoints(c)) {
        const n = pointOrder(c, P);
        expect(N % n, `${preset.name}: order ${n} must divide ${N}`).toBe(0);
      }
    }
  });

  it("enumerates a generator's subgroup in order, ending at infinity", () => {
    const c = SMALL;
    const G = allPoints(c)[5];
    const sub = subgroup(c, G);
    expect(sub).toHaveLength(pointOrder(c, G) - 1);
    for (let i = 0; i < sub.length; i++) {
      expect(eq(sub[i], mul(c, BigInt(i + 1), G)), `step ${i + 1}`).toBe(true);
    }
    expect(mul(c, BigInt(sub.length + 1), G)).toBeNull();
  });

  it("satisfies Hasse's theorem on every preset", () => {
    for (const preset of PRESETS) {
      const N = curveOrder(preset.curve);
      const { low, high } = hasseInterval(preset.curve.p);
      expect(N, `${preset.name}: ${N} outside [${low}, ${high}]`).toBeGreaterThanOrEqual(low);
      expect(N).toBeLessThanOrEqual(high);
    }
  });

  it("counts 97's curve exactly", () => {
    // y² = x³ + 2x + 3 over F_97 — a textbook curve with 100 points.
    expect(curveOrder(SMALL)).toBe(100);
  });

  it("backs every claim each preset's blurb makes on screen", () => {
    const structure = (c: Curve) => {
      const pts = allPoints(c);
      const orders = pts.map((P) => pointOrder(c, P));
      return {
        N: pts.length + 1,
        maxOrder: Math.max(...orders),
        twoTorsion: pts.filter((P) => P.y === 0n).length,
      };
    };
    const isPrime = (n: number) => {
      if (n < 2) return false;
      for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
      return true;
    };

    // "100 points, but no generator reaches them all — the largest order is 50"
    const a = structure(PRESETS[0].curve);
    expect(a.N).toBe(100);
    expect(a.maxOrder).toBe(50);
    expect(a.maxOrder).toBeLessThan(a.N); // genuinely non-cyclic

    // "bitcoin's shape (a=0, b=7), and 199 points — prime, so every point generates"
    expect(PRESETS[1].curve.a).toBe(0n);
    expect(PRESETS[1].curve.b).toBe(7n);
    const b = structure(PRESETS[1].curve);
    expect(b.N).toBe(199);
    expect(isPrime(b.N)).toBe(true);
    for (const P of allPoints(PRESETS[1].curve)) {
      expect(pointOrder(PRESETS[1].curve, P)).toBe(199); // every point generates
    }

    // "three points of order two — every root of x³ - x is one"
    expect(structure(PRESETS[2].curve).twoTorsion).toBe(3);

    // "cyclic, but 148 = 2²·37 — the small cofactor real curves avoid"
    const d = structure(PRESETS[3].curve);
    expect(d.N).toBe(148);
    expect(d.maxOrder).toBe(148); // cyclic: some point reaches everything
    expect(isPrime(d.N)).toBe(false);
    expect(2 * 2 * 37).toBe(148);
  });
});

describe("secp256k1, against the published constants", () => {
  it("puts the standard generator on the curve", () => {
    expect(isOnCurve(SECP256K1, SECP256K1_G)).toBe(true);
    expect(isSingular(SECP256K1)).toBe(false);
  });

  it("doubles G to the published 2G", () => {
    const twoG = mul(SECP256K1, 2n, SECP256K1_G);
    expect(twoG).not.toBeNull();
    expect(twoG!.x.toString(16)).toBe(
      "c6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee5",
    );
    expect(twoG!.y.toString(16)).toBe(
      "1ae168fea63dc339a3c58419466ceaeef7f632653266d0e1236431a950cfe52a",
    );
  });

  it("matches the published 3G", () => {
    const threeG = mul(SECP256K1, 3n, SECP256K1_G);
    expect(threeG!.x.toString(16)).toBe(
      "f9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce036f9",
    );
    expect(threeG!.y.toString(16)).toBe(
      "388f7b0f632de8140fe337e62a37f3566500a99934c2231b6cb9fd7584b8e672",
    );
  });

  it("returns to infinity at the published group order n", () => {
    expect(mul(SECP256K1, SECP256K1_N, SECP256K1_G)).toBeNull();
    // …and only there: n-1 and n+1 are not infinity.
    expect(mul(SECP256K1, SECP256K1_N - 1n, SECP256K1_G)).not.toBeNull();
    expect(mul(SECP256K1, SECP256K1_N + 1n, SECP256K1_G)).toEqual(SECP256K1_G);
    // (n-1)G is -G, so they sum to infinity.
    expect(
      add(SECP256K1, mul(SECP256K1, SECP256K1_N - 1n, SECP256K1_G), SECP256K1_G),
    ).toBeNull();
  });

  it("keeps every intermediate multiple on the curve", () => {
    let P: Point = null;
    for (let k = 1n; k <= 40n; k++) {
      P = add(SECP256K1, P, SECP256K1_G);
      expect(isOnCurve(SECP256K1, P), `${k}G`).toBe(true);
      expect(eq(P, mul(SECP256K1, k, SECP256K1_G)), `${k}G`).toBe(true);
    }
  });
});

describe("Diffie-Hellman", () => {
  it("lands both parties on the same secret, on every preset", () => {
    for (const preset of PRESETS) {
      const c = preset.curve;
      const G = allPoints(c).find((P) => pointOrder(c, P) > 4)!;
      for (const [a, b] of [
        [3n, 7n],
        [11n, 5n],
        [23n, 19n],
      ]) {
        const alicePub = mul(c, a, G);
        const bobPub = mul(c, b, G);
        const aliceSecret = mul(c, a, bobPub);
        const bobSecret = mul(c, b, alicePub);
        expect(eq(aliceSecret, bobSecret), `${preset.name} a=${a} b=${b}`).toBe(true);
        expect(eq(aliceSecret, mul(c, a * b, G))).toBe(true);
      }
    }
  });

  it("works at full secp256k1 size", () => {
    const a = 0x1e99423a4ed27608a15a2616a2b0e9e52ced330ac530edcc32c8ffc6a526aeddn;
    const b = 0x7e3a1f2c9b4d8e6a5f0c3b27d194e8a6f52c0b3d7e91a4f68c25d0b3e7a194f6n;
    const A = mul(SECP256K1, a, SECP256K1_G);
    const B = mul(SECP256K1, b, SECP256K1_G);
    const s1 = mul(SECP256K1, a, B);
    const s2 = mul(SECP256K1, b, A);
    expect(eq(s1, s2)).toBe(true);
    expect(isOnCurve(SECP256K1, s1)).toBe(true);
    expect(eq(s1, mul(SECP256K1, a * b, SECP256K1_G))).toBe(true);
    // The shared secret is not either public key, nor G.
    expect(eq(s1, A)).toBe(false);
    expect(eq(s1, B)).toBe(false);
  });
});

describe("over the reals", () => {
  it("keeps the sum on the curve", () => {
    const a = -1;
    const b = 3;
    const onCurve = (P: { x: number; y: number }) =>
      Math.abs(P.y * P.y - (P.x * P.x * P.x + a * P.x + b)) < 1e-6;
    // Points generated from x values where the curve is real.
    const xs = [-1.2, -0.5, 0.3, 1.1, 2.0, 3.4];
    const pts = xs.map((x) => ({ x, y: Math.sqrt(x * x * x + a * x + b) }));
    for (const P of pts) expect(onCurve(P)).toBe(true);
    for (const P of pts) {
      for (const Q of pts) {
        const R = addReal(a, P, Q);
        if (R === null) continue;
        expect(onCurve(R), `${P.x} + ${Q.x}`).toBe(true);
      }
    }
  });

  it("returns null for a vertical chord", () => {
    const P = { x: 2, y: 3 };
    expect(addReal(-1, P, { x: 2, y: -3 })).toBeNull();
  });

  it("is commutative over the reals too", () => {
    const a = -1;
    const P = { x: 2.0, y: Math.sqrt(8 - 2 + 3) };
    const Q = { x: 3.4, y: Math.sqrt(3.4 ** 3 - 3.4 + 3) };
    const R1 = addReal(a, P, Q)!;
    const R2 = addReal(a, Q, P)!;
    expect(R1.x).toBeCloseTo(R2.x, 9);
    expect(R1.y).toBeCloseTo(R2.y, 9);
  });
});

function fmt(P: Point): string {
  return P === null ? "O" : `(${P.x},${P.y})`;
}
