// Textbook RSA over small primes, for teaching. Everything uses BigInt so the
// modular arithmetic is exact, and the square-and-multiply ladder is exposed
// step by step so the "why is this fast?" part is visible.
//
// NOT cryptographically secure — the primes are tiny, there's no padding, and
// key generation is deterministic-ish. This is a math demonstration.

export interface KeyPair {
  p: bigint;
  q: bigint;
  n: bigint; // modulus p·q
  phi: bigint; // (p−1)(q−1)
  e: bigint; // public exponent
  d: bigint; // private exponent, e·d ≡ 1 (mod φ)
}

export interface LadderStep {
  bit: number; // exponent bit being consumed (LSB first)
  base: bigint; // current base^(2^i) mod n
  acc: bigint; // accumulator after this step
  multiplied: boolean; // was the base folded in?
}

/** Deterministic primality test, fine for the small numbers used here. */
export function isPrime(v: bigint): boolean {
  if (v < 2n) return false;
  if (v % 2n === 0n) return v === 2n;
  for (let i = 3n; i * i <= v; i += 2n) {
    if (v % i === 0n) return false;
  }
  return true;
}

/** All primes in [lo, hi]. */
export function primesBetween(lo: number, hi: number): number[] {
  const out: number[] = [];
  for (let i = Math.max(2, lo); i <= hi; i++) if (isPrime(BigInt(i))) out.push(i);
  return out;
}

export function gcd(a: bigint, b: bigint): bigint {
  while (b !== 0n) {
    const t = a % b;
    a = b;
    b = t;
  }
  return a < 0n ? -a : a;
}

/** Extended Euclid: returns [g, x, y] with a·x + b·y = g = gcd(a,b). */
export function egcd(a: bigint, b: bigint): [bigint, bigint, bigint] {
  if (b === 0n) return [a, 1n, 0n];
  const [g, x, y] = egcd(b, a % b);
  return [g, y, x - (a / b) * y];
}

/** Modular inverse of a mod m, or null when gcd(a,m) ≠ 1. */
export function modInverse(a: bigint, m: bigint): bigint | null {
  const [g, x] = egcd(((a % m) + m) % m, m);
  if (g !== 1n) return null;
  return ((x % m) + m) % m;
}

/** base^exp mod m by square-and-multiply. */
export function modPow(base: bigint, exp: bigint, m: bigint): bigint {
  if (m === 1n) return 0n;
  let result = 1n;
  let b = ((base % m) + m) % m;
  let e = exp;
  while (e > 0n) {
    if (e & 1n) result = (result * b) % m;
    b = (b * b) % m;
    e >>= 1n;
  }
  return result;
}

/** Same as modPow, but records every rung of the ladder. */
export function modPowSteps(base: bigint, exp: bigint, m: bigint): LadderStep[] {
  const steps: LadderStep[] = [];
  if (m === 1n) return steps;
  let result = 1n;
  let b = ((base % m) + m) % m;
  let e = exp;
  while (e > 0n) {
    const bit = Number(e & 1n);
    const multiplied = bit === 1;
    if (multiplied) result = (result * b) % m;
    steps.push({ bit, base: b, acc: result, multiplied });
    b = (b * b) % m;
    e >>= 1n;
  }
  return steps;
}

/** Build a keypair from two primes, choosing the smallest workable e ≥ 3. */
export function makeKeys(p: number, q: number, preferredE = 17): KeyPair | null {
  const bp = BigInt(p);
  const bq = BigInt(q);
  if (!isPrime(bp) || !isPrime(bq) || bp === bq) return null;
  const n = bp * bq;
  const phi = (bp - 1n) * (bq - 1n);
  let e = BigInt(preferredE);
  if (e >= phi || gcd(e, phi) !== 1n) {
    e = 3n;
    while (e < phi && gcd(e, phi) !== 1n) e += 2n;
  }
  if (e >= phi) return null;
  const d = modInverse(e, phi);
  if (d === null) return null;
  return { p: bp, q: bq, n, phi, e, d };
}

export const encrypt = (m: bigint, k: KeyPair): bigint => modPow(m, k.e, k.n);
export const decrypt = (c: bigint, k: KeyPair): bigint => modPow(c, k.d, k.n);

/**
 * Recover the private key by trial-factoring the modulus — the attack that
 * real RSA defeats purely by making n astronomically large. Returns the number
 * of trial divisions alongside the factors.
 */
export function factorModulus(n: bigint): { p: bigint; q: bigint; tries: number } | null {
  let tries = 0;
  for (let i = 2n; i * i <= n; i++) {
    tries++;
    if (n % i === 0n) return { p: i, q: n / i, tries };
  }
  return null;
}
