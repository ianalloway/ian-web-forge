// The Viterbi algorithm: reading the hidden state out of noisy observations.
//
// A hidden Markov model has two layers. Underneath, a state machine takes one
// step at a time with fixed transition probabilities. On top, each state emits
// an observation through a noisy channel. You see only the observations, and
// you want the state sequence.
//
// The naive answer is to score every possible path and keep the best. With S
// states and T observations that is S^T paths — 3^40 is a trillion times a
// trillion, so it is not an answer at all.
//
// Viterbi gets the exact same path in O(T·S²). The reason it works is the
// Markov property: the best path ending in state s at time t extends exactly
// one of the best paths ending somewhere at time t-1. So you only ever keep S
// candidates, one per state, and a back-pointer saying which predecessor each
// one came from. Nothing is approximated — this is the *exact* maximum
// likelihood path, which is why the tests can check it against brute force.
//
// Everything below works in log space. Multiplying forty probabilities
// together underflows to zero in float64 long before the sequence is
// interesting, and a path that scores 0 is indistinguishable from an
// impossible one. Adding logs has the same argmax and does not underflow.

export interface Hmm {
  states: string[];
  obs: string[]; // observation alphabet
  start: number[]; // P(state at t=0)
  trans: number[][]; // trans[from][to]
  emit: number[][]; // emit[state][observation]
}

const NEG_INF = -Infinity;

/** log, but log(0) is -Infinity rather than a thrown error or NaN. */
export function safeLog(p: number): number {
  return p > 0 ? Math.log(p) : NEG_INF;
}

export interface ViterbiResult {
  /** The most likely state path, as state indices, one per observation. */
  path: number[];
  /** Log probability of that path jointly with the observations. */
  logProb: number;
  /** trellis[t][s] = log prob of the best path reaching state s at time t. */
  trellis: number[][];
  /** back[t][s] = the predecessor state the best path came from, -1 at t=0. */
  back: number[][];
}

/**
 * The exact maximum-likelihood state path for a sequence of observations.
 *
 * Observations are given as indices into `hmm.obs`. An empty sequence has an
 * empty path and log probability 0 — the empty product — which keeps callers
 * from special-casing it.
 */
export function viterbi(hmm: Hmm, observations: number[]): ViterbiResult {
  const S = hmm.states.length;
  const T = observations.length;
  if (T === 0) return { path: [], logProb: 0, trellis: [], back: [] };

  const trellis: number[][] = [];
  const back: number[][] = [];

  const first = new Array<number>(S);
  for (let s = 0; s < S; s++) {
    first[s] = safeLog(hmm.start[s]) + safeLog(hmm.emit[s][observations[0]]);
  }
  trellis.push(first);
  back.push(new Array<number>(S).fill(-1));

  for (let t = 1; t < T; t++) {
    const prev = trellis[t - 1];
    const score = new Array<number>(S).fill(NEG_INF);
    const from = new Array<number>(S).fill(-1);
    for (let s = 0; s < S; s++) {
      const e = safeLog(hmm.emit[s][observations[t]]);
      // The inner loop is the whole algorithm: the best way to be in state s
      // now is the best way to have been anywhere, plus that transition.
      for (let p = 0; p < S; p++) {
        if (prev[p] === NEG_INF) continue;
        const cand = prev[p] + safeLog(hmm.trans[p][s]);
        if (cand > score[s]) {
          score[s] = cand;
          from[s] = p;
        }
      }
      score[s] = score[s] === NEG_INF ? NEG_INF : score[s] + e;
    }
    trellis.push(score);
    back.push(from);
  }

  // Walk the back-pointers from the best final state. Every state may be
  // impossible (an observation no state can emit), in which case there is no
  // path to report rather than a misleadingly confident one.
  const last = trellis[T - 1];
  let best = 0;
  for (let s = 1; s < S; s++) if (last[s] > last[best]) best = s;
  if (last[best] === NEG_INF) {
    return { path: [], logProb: NEG_INF, trellis, back };
  }

  const path = new Array<number>(T);
  path[T - 1] = best;
  for (let t = T - 1; t > 0; t--) path[t - 1] = back[t][path[t]];
  return { path, logProb: last[best], trellis, back };
}

/** Joint log P(states, observations) — the score Viterbi maximises. */
export function pathLogProb(hmm: Hmm, states: number[], observations: number[]): number {
  if (states.length !== observations.length) return NEG_INF;
  if (states.length === 0) return 0;
  let lp = safeLog(hmm.start[states[0]]) + safeLog(hmm.emit[states[0]][observations[0]]);
  for (let t = 1; t < states.length; t++) {
    lp += safeLog(hmm.trans[states[t - 1]][states[t]]);
    lp += safeLog(hmm.emit[states[t]][observations[t]]);
  }
  return lp;
}

/**
 * The same answer by enumerating every path. Exponential, and only here so the
 * tests have something independent to compare Viterbi against.
 */
export function bruteForce(hmm: Hmm, observations: number[]): { path: number[]; logProb: number } {
  const S = hmm.states.length;
  const T = observations.length;
  if (T === 0) return { path: [], logProb: 0 };
  let bestPath: number[] = [];
  let bestLp = NEG_INF;
  const current = new Array<number>(T).fill(0);
  const recurse = (t: number) => {
    if (t === T) {
      const lp = pathLogProb(hmm, current, observations);
      if (lp > bestLp) {
        bestLp = lp;
        bestPath = current.slice();
      }
      return;
    }
    for (let s = 0; s < S; s++) {
      current[t] = s;
      recurse(t + 1);
    }
  };
  recurse(0);
  return { path: bestPath, logProb: bestLp };
}

/**
 * The "greedy" decoder people reach for first: at each step pick the state
 * that best explains this one observation, ignoring the transitions. It is on
 * the page because it looks reasonable and is measurably worse.
 */
export function greedyDecode(hmm: Hmm, observations: number[]): number[] {
  const S = hmm.states.length;
  return observations.map((o) => {
    let best = 0;
    for (let s = 1; s < S; s++) if (hmm.emit[s][o] > hmm.emit[best][o]) best = s;
    return best;
  });
}

/** Sample a state path and matching observations from the model. */
export function sample(
  hmm: Hmm,
  length: number,
  rand: () => number,
): { states: number[]; observations: number[] } {
  const pick = (weights: number[]) => {
    const r = rand();
    let acc = 0;
    for (let i = 0; i < weights.length; i++) {
      acc += weights[i];
      if (r < acc) return i;
    }
    return weights.length - 1;
  };
  const states: number[] = [];
  const observations: number[] = [];
  for (let t = 0; t < length; t++) {
    const s = t === 0 ? pick(hmm.start) : pick(hmm.trans[states[t - 1]]);
    states.push(s);
    observations.push(pick(hmm.emit[s]));
  }
  return { states, observations };
}

/** Fraction of positions where two state sequences agree. */
export function accuracy(truth: number[], guess: number[]): number {
  if (truth.length === 0 || guess.length !== truth.length) return 0;
  let hits = 0;
  for (let i = 0; i < truth.length; i++) if (truth[i] === guess[i]) hits++;
  return hits / truth.length;
}

// Three models, each a different reason the hidden layer is hard to see.
//
// The loaded die is the textbook case: a fair and a loaded die, switched
// occasionally, and you see only the rolls. Weather is the gentlest — states
// are sticky and emissions are informative. The noisy channel is the hardest:
// the emission distributions overlap so much that no single observation says
// much, and essentially all of the information is in the transitions, which is
// exactly where greedy decoding throws it away.

export const MODELS: { name: string; blurb: string; hmm: Hmm; length: number }[] = [
  {
    name: "loaded die",
    blurb: "a fair die swapped for a loaded one now and then — find the swaps",
    length: 60,
    hmm: {
      states: ["fair", "loaded"],
      obs: ["1", "2", "3", "4", "5", "6"],
      start: [0.8, 0.2],
      trans: [
        [0.95, 0.05],
        [0.1, 0.9],
      ],
      emit: [
        [1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6],
        [0.06, 0.06, 0.06, 0.06, 0.26, 0.5],
      ],
    },
  },
  {
    name: "weather",
    blurb: "sticky states, informative emissions — the easy case",
    length: 60,
    hmm: {
      states: ["sun", "rain"],
      obs: ["dry", "damp", "soggy"],
      start: [0.6, 0.4],
      trans: [
        [0.85, 0.15],
        [0.25, 0.75],
      ],
      emit: [
        [0.7, 0.25, 0.05],
        [0.1, 0.3, 0.6],
      ],
    },
  },
  {
    name: "noisy channel",
    blurb: "emissions barely differ, so all the signal is in the transitions",
    length: 60,
    hmm: {
      states: ["low", "mid", "high"],
      obs: ["a", "b", "c"],
      start: [0.34, 0.33, 0.33],
      trans: [
        [0.9, 0.08, 0.02],
        [0.05, 0.9, 0.05],
        [0.02, 0.08, 0.9],
      ],
      emit: [
        [0.4, 0.35, 0.25],
        [0.33, 0.34, 0.33],
        [0.25, 0.35, 0.4],
      ],
    },
  },
];

/** A small deterministic PRNG so a seed reproduces a run exactly. */
export function makeRng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Forward-backward, and the decoder that is actually best per position.
//
// Viterbi returns the single most likely *path*. It is easy to assume that
// makes it the most accurate decoder position by position, and that is simply
// false — they optimise different things. When the transitions are much
// stickier than the emissions are informative, the most likely path is a long
// constant run, because every switch costs more log-probability than the
// emissions can pay back. That path can be right about the sequence as a whole
// and wrong about most of the positions in it.
//
// The decoder that maximises expected per-position accuracy is posterior
// decoding: compute P(state at t | all observations) with forward-backward,
// then take the argmax at each t independently. Its one wart is that the
// result is a sequence of individually-best states, not a path — it can even
// emit a transition the model gives zero probability. Both are on the page
// precisely because the comparison is the interesting part.

/** log(exp(a) + exp(b)), without overflowing or losing the small term. */
export function logSumExp(a: number, b: number): number {
  if (a === NEG_INF) return b;
  if (b === NEG_INF) return a;
  const hi = Math.max(a, b);
  return hi + Math.log(Math.exp(a - hi) + Math.exp(b - hi));
}

/** alpha[t][s] = log P(observations up to t, state at t = s). */
export function forward(hmm: Hmm, observations: number[]): number[][] {
  const S = hmm.states.length;
  const T = observations.length;
  const alpha: number[][] = [];
  if (T === 0) return alpha;
  const first = new Array<number>(S);
  for (let s = 0; s < S; s++) {
    first[s] = safeLog(hmm.start[s]) + safeLog(hmm.emit[s][observations[0]]);
  }
  alpha.push(first);
  for (let t = 1; t < T; t++) {
    const prev = alpha[t - 1];
    const row = new Array<number>(S).fill(NEG_INF);
    for (let s = 0; s < S; s++) {
      let acc = NEG_INF;
      for (let p = 0; p < S; p++) acc = logSumExp(acc, prev[p] + safeLog(hmm.trans[p][s]));
      row[s] = acc === NEG_INF ? NEG_INF : acc + safeLog(hmm.emit[s][observations[t]]);
    }
    alpha.push(row);
  }
  return alpha;
}

/** beta[t][s] = log P(observations after t | state at t = s). */
export function backward(hmm: Hmm, observations: number[]): number[][] {
  const S = hmm.states.length;
  const T = observations.length;
  if (T === 0) return [];
  const beta: number[][] = Array.from({ length: T }, () => new Array<number>(S).fill(NEG_INF));
  beta[T - 1].fill(0); // nothing left to explain
  for (let t = T - 2; t >= 0; t--) {
    for (let s = 0; s < S; s++) {
      let acc = NEG_INF;
      for (let n = 0; n < S; n++) {
        const term =
          safeLog(hmm.trans[s][n]) + safeLog(hmm.emit[n][observations[t + 1]]) + beta[t + 1][n];
        acc = logSumExp(acc, term);
      }
      beta[t][s] = acc;
    }
  }
  return beta;
}

/** log P(observations) — summed over every path, not maximised over them. */
export function logLikelihood(hmm: Hmm, observations: number[]): number {
  const alpha = forward(hmm, observations);
  if (alpha.length === 0) return 0;
  return alpha[alpha.length - 1].reduce((acc, x) => logSumExp(acc, x), NEG_INF);
}

/** The same total by enumerating paths. Exponential; for tests only. */
export function bruteForceLikelihood(hmm: Hmm, observations: number[]): number {
  const S = hmm.states.length;
  const T = observations.length;
  if (T === 0) return 0;
  let total = NEG_INF;
  const current = new Array<number>(T).fill(0);
  const recurse = (t: number) => {
    if (t === T) {
      total = logSumExp(total, pathLogProb(hmm, current, observations));
      return;
    }
    for (let s = 0; s < S; s++) {
      current[t] = s;
      recurse(t + 1);
    }
  };
  recurse(0);
  return total;
}

/** posterior[t][s] = P(state at t = s | all observations). Rows sum to 1. */
export function posteriors(hmm: Hmm, observations: number[]): number[][] {
  const alpha = forward(hmm, observations);
  const beta = backward(hmm, observations);
  const total = logLikelihood(hmm, observations);
  if (alpha.length === 0 || total === NEG_INF) return alpha.map((row) => row.map(() => 0));
  return alpha.map((row, t) => row.map((a, s) => Math.exp(a + beta[t][s] - total)));
}

/** Per-position argmax of the posterior: the Bayes-optimal accuracy decoder. */
export function posteriorDecode(hmm: Hmm, observations: number[]): number[] {
  return posteriors(hmm, observations).map((row) => {
    let best = 0;
    for (let s = 1; s < row.length; s++) if (row[s] > row[best]) best = s;
    return best;
  });
}

/** How many times a state sequence changes state — the page shows this because
 *  it is where Viterbi and posterior decoding visibly disagree. */
export function switchCount(states: number[]): number {
  let n = 0;
  for (let i = 1; i < states.length; i++) if (states[i] !== states[i - 1]) n++;
  return n;
}
