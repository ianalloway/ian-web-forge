export interface PiEstimate {
  total: number;
  inside: number;
}

export function estimate(state: PiEstimate): number {
  return state.total === 0 ? 0 : (4 * state.inside) / state.total;
}

export interface Sample {
  x: number; // in [0, 1)
  y: number;
  inside: boolean;
}

/** Draw n uniform samples over the unit square, testing against the quarter circle. */
export function sampleBatch(n: number): Sample[] {
  const out: Sample[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const x = Math.random();
    const y = Math.random();
    out[i] = { x, y, inside: x * x + y * y <= 1 };
  }
  return out;
}

export function applyBatch(state: PiEstimate, batch: Sample[]): PiEstimate {
  let inside = state.inside;
  for (const s of batch) if (s.inside) inside++;
  return { total: state.total + batch.length, inside };
}

export interface ErrorPoint {
  total: number;
  absError: number;
}

/**
 * Record convergence samples on a roughly geometric schedule so the
 * log-log error chart stays small no matter how long the run goes.
 */
export function shouldRecord(total: number, lastRecorded: number): boolean {
  if (lastRecorded === 0) return total > 0;
  return total >= lastRecorded * 1.15;
}

export function absError(state: PiEstimate): number {
  return Math.abs(estimate(state) - Math.PI);
}
