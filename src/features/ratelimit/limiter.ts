// Rate limiting: four algorithms that all claim "N requests per minute".
//
// They do not mean the same thing, and the differences show up exactly when it
// matters — under a burst.
//
//   fixed window      count requests per calendar window, reset at the boundary.
//                     Trivial, and wrong in a specific way: a client can send N
//                     at the end of one window and N at the start of the next,
//                     landing 2N inside a single window's span.
//   sliding log       keep the timestamp of every request and count the ones
//                     inside the trailing window. Exact, and the only one here
//                     that can never be tricked — at the cost of storing a
//                     timestamp per request.
//   sliding counter   interpolate between the previous window's count and this
//                     one. Nearly as good as the log for a fraction of the
//                     memory, which is why it is what most gateways run.
//   token bucket      tokens refill at a steady rate up to a cap; each request
//                     spends one. Allows a deliberate burst up to the cap while
//                     holding the long-run rate to the refill rate — usually
//                     what you actually want.
//
// Every limiter here takes an explicit `now`, so the tests drive time rather
// than waiting for it.

export type Algorithm = "fixed" | "log" | "counter" | "bucket";

export interface AlgorithmInfo {
  id: Algorithm;
  label: string;
  note: string;
}

export const ALGORITHMS: AlgorithmInfo[] = [
  {
    id: "fixed",
    label: "fixed window",
    note: "simplest, and lets a client land twice the limit across a window boundary",
  },
  {
    id: "log",
    label: "sliding log",
    note: "exact and untrickable, but stores a timestamp for every request",
  },
  {
    id: "counter",
    label: "sliding counter",
    note: "interpolates across the boundary — almost exact, for two numbers of memory",
  },
  {
    id: "bucket",
    label: "token bucket",
    note: "a deliberate burst up to the bucket size, then the steady refill rate",
  },
];

export interface Config {
  limit: number; // requests allowed per window
  windowMs: number;
}

export interface Limiter {
  algorithm: Algorithm;
  config: Config;
  // fixed / counter
  windowStart: number;
  count: number;
  previousCount: number;
  // log
  stamps: number[];
  // bucket
  tokens: number;
  lastRefill: number;
}

export function newLimiter(algorithm: Algorithm, config: Config, now = 0): Limiter {
  return {
    algorithm,
    config,
    windowStart: now,
    count: 0,
    previousCount: 0,
    stamps: [],
    tokens: config.limit,
    lastRefill: now,
  };
}

export function allow(limiter: Limiter, now: number): boolean {
  const { limit, windowMs } = limiter.config;

  switch (limiter.algorithm) {
    case "fixed": {
      // Everything resets at the boundary, which is the whole problem.
      if (now - limiter.windowStart >= windowMs) {
        limiter.windowStart = now - ((now - limiter.windowStart) % windowMs);
        limiter.previousCount = limiter.count;
        limiter.count = 0;
      }
      if (limiter.count < limit) {
        limiter.count++;
        return true;
      }
      return false;
    }

    case "log": {
      // Drop anything that has fallen out of the trailing window, then count.
      const cutoff = now - windowMs;
      while (limiter.stamps.length > 0 && limiter.stamps[0] <= cutoff) limiter.stamps.shift();
      if (limiter.stamps.length < limit) {
        limiter.stamps.push(now);
        return true;
      }
      return false;
    }

    case "counter": {
      const elapsed = now - limiter.windowStart;
      if (elapsed >= windowMs) {
        const windowsPassed = Math.floor(elapsed / windowMs);
        limiter.previousCount = windowsPassed === 1 ? limiter.count : 0;
        limiter.count = 0;
        limiter.windowStart += windowsPassed * windowMs;
      }
      // Weight the previous window by how much of it is still inside the
      // trailing window.
      const intoWindow = (now - limiter.windowStart) / windowMs;
      const estimate = limiter.previousCount * (1 - intoWindow) + limiter.count;
      if (estimate < limit) {
        limiter.count++;
        return true;
      }
      return false;
    }

    case "bucket": {
      const refillRate = limit / windowMs; // tokens per millisecond
      limiter.tokens = Math.min(limit, limiter.tokens + (now - limiter.lastRefill) * refillRate);
      limiter.lastRefill = now;
      if (limiter.tokens >= 1) {
        limiter.tokens -= 1;
        return true;
      }
      return false;
    }
  }
}

// ── Traffic ────────────────────────────────────────────────────────────────

export interface Pattern {
  id: string;
  label: string;
  note: string;
  // Request times in ms over the given span.
  times: (spanMs: number, windowMs: number, limit: number) => number[];
}

export const PATTERNS: Pattern[] = [
  {
    id: "steady",
    label: "steady",
    note: "an even trickle just under the limit — every algorithm agrees here",
    times: (span, windowMs, limit) => {
      const gap = windowMs / (limit * 0.9);
      const out: number[] = [];
      for (let t = 0; t < span; t += gap) out.push(t);
      return out;
    },
  },
  {
    id: "boundary",
    label: "boundary burst",
    note: "a full allowance just before each boundary and again just after — the fixed window's blind spot",
    times: (span, windowMs, limit) => {
      const out: number[] = [];
      for (let w = windowMs; w < span; w += windowMs) {
        for (let i = 0; i < limit; i++) out.push(w - windowMs * 0.02 + i * 0.4);
        for (let i = 0; i < limit; i++) out.push(w + windowMs * 0.01 + i * 0.4);
      }
      return out.filter((t) => t >= 0 && t < span).sort((a, b) => a - b);
    },
  },
  {
    id: "spike",
    label: "one big spike",
    note: "quiet, then everything at once — the bucket spends its savings, the others refuse",
    times: (span, windowMs, limit) => {
      const out: number[] = [];
      const at = span * 0.45;
      for (let i = 0; i < limit * 3; i++) out.push(at + i * 0.5);
      return out.filter((t) => t < span);
    },
  },
  {
    id: "overload",
    label: "sustained overload",
    note: "three times the limit, forever — every algorithm must settle at its true rate",
    times: (span, windowMs, limit) => {
      const gap = windowMs / (limit * 3);
      const out: number[] = [];
      for (let t = 0; t < span; t += gap) out.push(t);
      return out;
    },
  },
];

export interface Decision {
  time: number;
  allowed: boolean;
}

export function run(algorithm: Algorithm, config: Config, times: number[]): Decision[] {
  const limiter = newLimiter(algorithm, config, 0);
  return times.map((time) => ({ time, allowed: allow(limiter, time) }));
}

// The most requests any algorithm let through in ANY window of this length —
// the number that says whether a limiter kept its promise.
export function worstWindow(decisions: Decision[], windowMs: number): number {
  const allowed = decisions.filter((d) => d.allowed).map((d) => d.time);
  let worst = 0;
  for (let i = 0; i < allowed.length; i++) {
    let count = 0;
    for (let j = i; j < allowed.length && allowed[j] < allowed[i] + windowMs; j++) count++;
    if (count > worst) worst = count;
  }
  return worst;
}

export function allowedCount(decisions: Decision[]): number {
  return decisions.filter((d) => d.allowed).length;
}
