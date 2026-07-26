// The Collatz (3n+1) map. Starting from n, repeatedly halve if even or take
// 3n+1 if odd; the conjecture says every start eventually reaches 1. These
// sequences, drawn as parity-bent paths sharing their tails, form the
// "Collatz coral".

const SAFETY = 100000; // guard against a hypothetical non-terminating orbit

/** Full trajectory from n down to 1 (inclusive of both ends). */
export function sequence(n: number): number[] {
  const s = [n];
  let x = n;
  let guard = 0;
  while (x !== 1 && guard++ < SAFETY) {
    x = x % 2 === 0 ? x / 2 : 3 * x + 1;
    s.push(x);
  }
  return s;
}

/** Number of steps to reach 1 (the total stopping time). */
export function stoppingTime(n: number): number {
  let x = n;
  let steps = 0;
  while (x !== 1 && steps < SAFETY) {
    x = x % 2 === 0 ? x / 2 : 3 * x + 1;
    steps++;
  }
  return steps;
}

/** Largest value the trajectory reaches. */
export function maxValue(n: number): number {
  let x = n;
  let m = n;
  let guard = 0;
  while (x !== 1 && guard++ < SAFETY) {
    x = x % 2 === 0 ? x / 2 : 3 * x + 1;
    if (x > m) m = x;
  }
  return m;
}
