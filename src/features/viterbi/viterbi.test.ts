import { describe, expect, it } from "vitest";
import {
  MODELS,
  accuracy,
  bruteForce,
  bruteForceLikelihood,
  greedyDecode,
  logLikelihood,
  logSumExp,
  makeRng,
  posteriorDecode,
  posteriors,
  pathLogProb,
  safeLog,
  sample,
  switchCount,
  viterbi,
  type Hmm,
} from "./viterbi";

const DIE = MODELS[0].hmm;
const WEATHER = MODELS[1].hmm;
const NOISY = MODELS[2].hmm;

/** A model is only a model if its rows are distributions. */
function expectNormalised(hmm: Hmm) {
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  expect(sum(hmm.start)).toBeCloseTo(1, 10);
  for (const row of hmm.trans) expect(sum(row)).toBeCloseTo(1, 10);
  for (const row of hmm.emit) expect(sum(row)).toBeCloseTo(1, 10);
}

describe("model definitions", () => {
  it("every preset is a well-formed HMM", () => {
    for (const m of MODELS) {
      expectNormalised(m.hmm);
      expect(m.hmm.trans).toHaveLength(m.hmm.states.length);
      expect(m.hmm.emit).toHaveLength(m.hmm.states.length);
      for (const row of m.hmm.trans) expect(row).toHaveLength(m.hmm.states.length);
      for (const row of m.hmm.emit) expect(row).toHaveLength(m.hmm.obs.length);
    }
  });
});

describe("safeLog", () => {
  it("maps zero to -Infinity instead of NaN", () => {
    expect(safeLog(0)).toBe(-Infinity);
    expect(safeLog(1)).toBe(0);
    expect(safeLog(0.5)).toBeCloseTo(Math.log(0.5), 12);
  });
});

describe("viterbi against brute force", () => {
  // This is the test that matters. Brute force enumerates all S^T paths and
  // scores each one independently of the trellis, so agreement on the score
  // is agreement on the actual maximum, not on a shared bug.
  it("finds the same optimum as exhaustive enumeration, on every model", () => {
    for (const hmm of [DIE, WEATHER, NOISY]) {
      const rng = makeRng(7);
      for (let trial = 0; trial < 40; trial++) {
        const T = 1 + Math.floor(rng() * 8);
        const observations = Array.from({ length: T }, () =>
          Math.floor(rng() * hmm.obs.length),
        );
        const v = viterbi(hmm, observations);
        const b = bruteForce(hmm, observations);
        expect(v.logProb).toBeCloseTo(b.logProb, 10);
        // The argmax can be a tie, so compare scores, not paths — but the
        // returned path must itself achieve the reported score.
        expect(pathLogProb(hmm, v.path, observations)).toBeCloseTo(v.logProb, 10);
      }
    }
  });

  it("never reports a path that scores worse than the greedy one", () => {
    const rng = makeRng(99);
    for (let trial = 0; trial < 60; trial++) {
      const observations = Array.from({ length: 12 }, () => Math.floor(rng() * NOISY.obs.length));
      const v = viterbi(NOISY, observations);
      const g = greedyDecode(NOISY, observations);
      expect(v.logProb).toBeGreaterThanOrEqual(pathLogProb(NOISY, g, observations) - 1e-9);
    }
  });
});

describe("viterbi mechanics", () => {
  it("returns one state per observation", () => {
    const observations = [0, 1, 2, 1, 0, 0, 2];
    const v = viterbi(WEATHER, observations);
    expect(v.path).toHaveLength(observations.length);
    expect(v.trellis).toHaveLength(observations.length);
    for (const s of v.path) expect(s).toBeGreaterThanOrEqual(0);
    for (const s of v.path) expect(s).toBeLessThan(WEATHER.states.length);
  });

  it("back-pointers at t=0 point nowhere", () => {
    const v = viterbi(WEATHER, [0, 1, 2]);
    expect(v.back[0]).toEqual([-1, -1]);
  });

  it("handles the empty sequence as the empty product", () => {
    const v = viterbi(WEATHER, []);
    expect(v.path).toEqual([]);
    expect(v.logProb).toBe(0);
  });

  it("reports no path when an observation is impossible for every state", () => {
    // A state that can only emit 'a', shown a 'b': the model is refuted, and
    // the honest answer is no path rather than an arbitrary one.
    const impossible: Hmm = {
      states: ["only-a"],
      obs: ["a", "b"],
      start: [1],
      trans: [[1]],
      emit: [[1, 0]],
    };
    const v = viterbi(impossible, [0, 1, 0]);
    expect(v.logProb).toBe(-Infinity);
    expect(v.path).toEqual([]);
  });

  it("follows a forced chain when only one path has non-zero probability", () => {
    const chain: Hmm = {
      states: ["a", "b", "c"],
      obs: ["x"],
      start: [1, 0, 0],
      trans: [
        [0, 1, 0],
        [0, 0, 1],
        [0, 0, 1],
      ],
      emit: [[1], [1], [1]],
    };
    expect(viterbi(chain, [0, 0, 0, 0]).path).toEqual([0, 1, 2, 2]);
  });
});

describe("decoding quality", () => {
  // Viterbi maximises the probability of the whole path. Posterior decoding
  // maximises expected accuracy at each position. These are different
  // objectives, and each decoder wins on its own and loses on the other's —
  // the first version of this test asserted Viterbi was simply more accurate,
  // which is false and is the reason both decoders are on the page.
  it("viterbi wins on path probability against every other decoder", () => {
    for (const hmm of [DIE, WEATHER, NOISY]) {
      const rng = makeRng(2024);
      for (let i = 0; i < 25; i++) {
        const { observations } = sample(hmm, 60, rng);
        const v = viterbi(hmm, observations);
        const g = pathLogProb(hmm, greedyDecode(hmm, observations), observations);
        const p = pathLogProb(hmm, posteriorDecode(hmm, observations), observations);
        expect(v.logProb).toBeGreaterThanOrEqual(g - 1e-9);
        expect(v.logProb).toBeGreaterThanOrEqual(p - 1e-9);
      }
    }
  });

  it("posterior decoding wins on per-position accuracy, where viterbi does not", () => {
    // Averaged over runs, so this is a claim about the decoders rather than
    // about one seed. On the noisy channel the sticky transitions make the
    // single most likely path a near-constant run: right about the sequence,
    // wrong about most positions in it.
    const runs = 40;
    let vTotal = 0;
    let pTotal = 0;
    for (let i = 0; i < runs; i++) {
      const rng = makeRng(1000 + i);
      const { states, observations } = sample(NOISY, 120, rng);
      vTotal += accuracy(states, viterbi(NOISY, observations).path);
      pTotal += accuracy(states, posteriorDecode(NOISY, observations));
    }
    expect(pTotal / runs).toBeGreaterThan(vTotal / runs);
  });

  it("viterbi switches state less often than the truth when transitions dominate", () => {
    // The mechanism behind the accuracy result, measured directly.
    const rng = makeRng(5);
    const { states, observations } = sample(NOISY, 400, rng);
    const v = viterbi(NOISY, observations);
    expect(switchCount(v.path)).toBeLessThan(switchCount(states));
  });

  it("recovers most of the hidden path on the informative models", () => {
    for (const hmm of [DIE, WEATHER]) {
      let total = 0;
      const runs = 20;
      for (let i = 0; i < runs; i++) {
        const rng = makeRng(50 + i);
        const { states, observations } = sample(hmm, 150, rng);
        total += accuracy(states, viterbi(hmm, observations).path);
      }
      expect(total / runs).toBeGreaterThan(0.7);
    }
  });
});

describe("forward-backward", () => {
  it("matches brute-force summation over every path", () => {
    // Independent check: forward sums over paths recursively, brute force
    // enumerates them. Agreement means the recursion is right.
    for (const hmm of [DIE, WEATHER, NOISY]) {
      const rng = makeRng(31);
      for (let i = 0; i < 20; i++) {
        const T = 1 + Math.floor(rng() * 7);
        const observations = Array.from({ length: T }, () => Math.floor(rng() * hmm.obs.length));
        expect(logLikelihood(hmm, observations)).toBeCloseTo(
          bruteForceLikelihood(hmm, observations),
          10,
        );
      }
    }
  });

  it("the total likelihood is at least the best single path", () => {
    const rng = makeRng(17);
    for (let i = 0; i < 30; i++) {
      const { observations } = sample(WEATHER, 40, rng);
      expect(logLikelihood(WEATHER, observations)).toBeGreaterThanOrEqual(
        viterbi(WEATHER, observations).logProb - 1e-9,
      );
    }
  });

  it("posteriors are distributions at every position", () => {
    for (const hmm of [DIE, WEATHER, NOISY]) {
      const rng = makeRng(8);
      const { observations } = sample(hmm, 80, rng);
      for (const row of posteriors(hmm, observations)) {
        expect(row.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
        for (const p of row) {
          expect(p).toBeGreaterThanOrEqual(0);
          expect(p).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it("is certain about a forced state", () => {
    const forced: Hmm = {
      states: ["a", "b"],
      obs: ["x", "y"],
      start: [0.5, 0.5],
      trans: [
        [0.5, 0.5],
        [0.5, 0.5],
      ],
      emit: [
        [1, 0],
        [0, 1],
      ],
    };
    // Emissions identify the state outright, so the posterior is a point mass.
    const post = posteriors(forced, [0, 1, 0]);
    expect(post[0][0]).toBeCloseTo(1, 10);
    expect(post[1][1]).toBeCloseTo(1, 10);
    expect(post[2][0]).toBeCloseTo(1, 10);
  });

  it("logSumExp handles -Infinity and does not overflow on large terms", () => {
    expect(logSumExp(-Infinity, -Infinity)).toBe(-Infinity);
    expect(logSumExp(-Infinity, -3)).toBe(-3);
    expect(logSumExp(0, 0)).toBeCloseTo(Math.log(2), 12);
    expect(logSumExp(1000, 1000)).toBeCloseTo(1000 + Math.log(2), 9);
  });
});

describe("switchCount", () => {
  it("counts transitions, not positions", () => {
    expect(switchCount([])).toBe(0);
    expect(switchCount([1, 1, 1])).toBe(0);
    expect(switchCount([0, 1, 0, 1])).toBe(3);
  });
});

describe("sampling", () => {
  it("draws states and observations of the requested length, in range", () => {
    const rng = makeRng(3);
    const { states, observations } = sample(DIE, 200, rng);
    expect(states).toHaveLength(200);
    expect(observations).toHaveLength(200);
    for (const s of states) expect(s).toBeLessThan(DIE.states.length);
    for (const o of observations) expect(o).toBeLessThan(DIE.obs.length);
  });

  it("reproduces a run exactly from the same seed", () => {
    const a = sample(DIE, 50, makeRng(42));
    const b = sample(DIE, 50, makeRng(42));
    expect(a).toEqual(b);
  });

  it("recovers the loaded die's bias in the sampled rolls", () => {
    // Checks the sampler against the model rather than against itself: rolls
    // emitted while loaded should show the 6 at roughly its stated 0.5.
    const rng = makeRng(11);
    const { states, observations } = sample(DIE, 20000, rng);
    let loaded = 0;
    let sixes = 0;
    for (let i = 0; i < states.length; i++) {
      if (states[i] === 1) {
        loaded++;
        if (observations[i] === 5) sixes++;
      }
    }
    expect(loaded).toBeGreaterThan(1000);
    expect(sixes / loaded).toBeCloseTo(0.5, 1);
  });
});

describe("accuracy", () => {
  it("is 1 for identical sequences and 0 for mismatched lengths", () => {
    expect(accuracy([0, 1, 1], [0, 1, 1])).toBe(1);
    expect(accuracy([0, 1, 1], [0, 1])).toBe(0);
    expect(accuracy([], [])).toBe(0);
    expect(accuracy([0, 1, 0, 1], [0, 0, 0, 0])).toBeCloseTo(0.5, 12);
  });
});
