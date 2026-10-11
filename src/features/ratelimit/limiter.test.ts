import { describe, expect, it } from "vitest";
import {
  ALGORITHMS,
  Algorithm,
  Config,
  PATTERNS,
  allow,
  allowedCount,
  newLimiter,
  run,
  worstWindow,
} from "./limiter";

const CONFIG: Config = { limit: 10, windowMs: 1000 };

describe("every algorithm", () => {
  it.each(ALGORITHMS)("$label lets a quiet client through", (info) => {
    const limiter = newLimiter(info.id, CONFIG, 0);
    // Well under the limit, spread out: nothing should ever be refused.
    for (let i = 0; i < 50; i++) expect(allow(limiter, i * 200)).toBe(true);
  });

  it.each(ALGORITHMS)("$label refuses a flood", (info) => {
    const limiter = newLimiter(info.id, CONFIG, 0);
    let allowed = 0;
    for (let i = 0; i < 100; i++) if (allow(limiter, i)) allowed++;
    // 100 requests in 100ms: at most the limit (the bucket starts full).
    expect(allowed).toBeLessThanOrEqual(CONFIG.limit);
  });

  it.each(ALGORITHMS)("$label settles at its true rate under sustained overload", (info) => {
    const times = PATTERNS.find((p) => p.id === "overload")!.times(20000, CONFIG.windowMs, CONFIG.limit);
    const decisions = run(info.id, CONFIG, times);
    const seconds = 20;
    const rate = allowedCount(decisions) / seconds;
    // Asked for 30/s, allowed 10/s give or take the starting burst.
    expect(rate).toBeGreaterThan(CONFIG.limit * 0.8);
    expect(rate).toBeLessThan(CONFIG.limit * 1.3);
  });
});

describe("the fixed window's blind spot", () => {
  it("lets twice the limit through across a boundary", () => {
    const limiter = newLimiter("fixed", CONFIG, 0);
    // Fill the first window at its very end.
    for (let i = 0; i < CONFIG.limit; i++) expect(allow(limiter, 990 + i * 0.1)).toBe(true);
    // The counter resets at 1000, so the same client gets a whole new allowance
    // milliseconds later — 20 requests inside a ~20ms span.
    for (let i = 0; i < CONFIG.limit; i++) expect(allow(limiter, 1001 + i * 0.1)).toBe(true);
  });

  it("is the only algorithm here that can be tricked that way", () => {
    const times = PATTERNS.find((p) => p.id === "boundary")!.times(10000, CONFIG.windowMs, CONFIG.limit);
    const worst: Record<Algorithm, number> = {
      fixed: worstWindow(run("fixed", CONFIG, times), CONFIG.windowMs),
      log: worstWindow(run("log", CONFIG, times), CONFIG.windowMs),
      counter: worstWindow(run("counter", CONFIG, times), CONFIG.windowMs),
      bucket: worstWindow(run("bucket", CONFIG, times), CONFIG.windowMs),
    };
    // The exact one keeps its promise precisely.
    expect(worst.log).toBeLessThanOrEqual(CONFIG.limit);
    // The sliding counter is close to exact.
    expect(worst.counter).toBeLessThanOrEqual(CONFIG.limit + 1);
    // The fixed window overshoots, which is the point of the comparison.
    expect(worst.fixed).toBeGreaterThan(CONFIG.limit * 1.5);
    expect(worst.fixed).toBeGreaterThan(worst.log);
  });
});

describe("the sliding log is exact", () => {
  it("never exceeds the limit in any window, on any traffic pattern", () => {
    for (const pattern of PATTERNS) {
      const times = pattern.times(15000, CONFIG.windowMs, CONFIG.limit);
      const decisions = run("log", CONFIG, times);
      expect(worstWindow(decisions, CONFIG.windowMs)).toBeLessThanOrEqual(CONFIG.limit);
    }
  });
});

describe("the token bucket", () => {
  it("spends a saved-up burst, then holds the steady rate", () => {
    const limiter = newLimiter("bucket", CONFIG, 0);
    // Starts full, so the first burst is the bucket size.
    let burst = 0;
    for (let i = 0; i < 50; i++) if (allow(limiter, i * 0.1)) burst++;
    expect(burst).toBe(CONFIG.limit);

    // After that it can only go as fast as the refill: 10 per 1000ms = 1 per
    // 100ms, so a request every 100ms should always be granted.
    for (let i = 1; i <= 20; i++) expect(allow(limiter, 100 * i + 100)).toBe(true);
  });

  it("refills no faster than its rate", () => {
    const limiter = newLimiter("bucket", CONFIG, 0);
    for (let i = 0; i < CONFIG.limit; i++) allow(limiter, 0); // drain it
    expect(allow(limiter, 50)).toBe(false); // half a token later
    expect(allow(limiter, 100)).toBe(true); // one token later
  });

  it("never banks more than its capacity", () => {
    const limiter = newLimiter("bucket", CONFIG, 0);
    // An hour of silence must not buy an hour's worth of burst.
    let burst = 0;
    for (let i = 0; i < 500; i++) if (allow(limiter, 3_600_000 + i * 0.1)) burst++;
    expect(burst).toBe(CONFIG.limit);
  });
});

describe("accounting", () => {
  it("counts a window correctly", () => {
    const decisions = [
      { time: 0, allowed: true },
      { time: 100, allowed: true },
      { time: 200, allowed: false },
      { time: 1500, allowed: true },
    ];
    expect(allowedCount(decisions)).toBe(3);
    expect(worstWindow(decisions, 1000)).toBe(2);
    expect(worstWindow(decisions, 2000)).toBe(3);
  });
});
