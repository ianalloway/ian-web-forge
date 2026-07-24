import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  decrypt,
  encrypt,
  factorModulus,
  makeKeys,
  modPowSteps,
  primesBetween,
} from "../features/rsa/rsa";

const PRIMES = primesBetween(11, 400);

export default function Rsa() {
  const [p, setP] = useState(61);
  const [q, setQ] = useState(53);
  const [message, setMessage] = useState(42);
  const [cracked, setCracked] = useState<{ p: string; q: string; tries: number } | null>(null);

  const keys = useMemo(() => makeKeys(p, q, 17), [p, q]);

  const view = useMemo(() => {
    if (!keys) return null;
    const m = BigInt(Math.max(0, Math.min(message, Number(keys.n) - 1)));
    const c = encrypt(m, keys);
    const back = decrypt(c, keys);
    return {
      m,
      c,
      back,
      encSteps: modPowSteps(m, keys.e, keys.n),
      decSteps: modPowSteps(c, keys.d, keys.n),
      ok: back === m,
    };
  }, [keys, message]);

  const maxMessage = keys ? Number(keys.n) - 1 : 0;

  const randomize = () => {
    const a = PRIMES[(Math.random() * PRIMES.length) | 0];
    let b = PRIMES[(Math.random() * PRIMES.length) | 0];
    while (b === a) b = PRIMES[(Math.random() * PRIMES.length) | 0];
    setP(a);
    setQ(b);
    setCracked(null);
  };

  const crack = () => {
    if (!keys) return;
    const f = factorModulus(keys.n);
    setCracked(f ? { p: f.p.toString(), q: f.q.toString(), tries: f.tries } : null);
  };

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">rsa playground</span>
        </div>
        <div className="text-xs text-primary/40 tabular-nums">
          {keys ? `n=${keys.n} · e=${keys.e} · d=${keys.d}` : "pick two distinct primes"}
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">p</span>
          <select
            value={p}
            onChange={(e) => {
              setP(Number(e.target.value));
              setCracked(null);
            }}
            className="bg-black/40 border border-primary/25 text-primary/90 text-xs px-1 py-0.5 outline-none focus:border-primary/60"
          >
            {PRIMES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">q</span>
          <select
            value={q}
            onChange={(e) => {
              setQ(Number(e.target.value));
              setCracked(null);
            }}
            className="bg-black/40 border border-primary/25 text-primary/90 text-xs px-1 py-0.5 outline-none focus:border-primary/60"
          >
            {PRIMES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">message</span>
          <input
            type="range"
            min={0}
            max={Math.max(1, maxMessage)}
            step={1}
            value={Math.min(message, Math.max(1, maxMessage))}
            onChange={(e) => setMessage(Number(e.target.value))}
            className="w-40 accent-primary"
          />
          <span className="text-primary/60 text-xs w-12 tabular-nums">
            {Math.min(message, Math.max(0, maxMessage))}
          </span>
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={randomize}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ⚄ random primes
          </button>
          <button
            onClick={crack}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ⚡ crack it
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 text-sm">
        {!keys || !view ? (
          <p className="text-primary/50">choose two different primes to build a key.</p>
        ) : (
          <div className="space-y-5 max-w-3xl">
            {/* Key */}
            <section>
              <h2 className="text-primary/50 text-xs uppercase tracking-wide mb-1">the key</h2>
              <div className="text-xs leading-relaxed text-primary/80 tabular-nums space-y-0.5">
                <div>
                  n = p·q = {keys.p.toString()}·{keys.q.toString()} ={" "}
                  <span className="text-primary">{keys.n.toString()}</span>{" "}
                  <span className="text-primary/40">← public modulus</span>
                </div>
                <div>
                  φ(n) = (p−1)(q−1) = <span className="text-primary">{keys.phi.toString()}</span>{" "}
                  <span className="text-primary/40">← secret, needs the factors</span>
                </div>
                <div>
                  e = <span className="text-primary">{keys.e.toString()}</span>{" "}
                  <span className="text-primary/40">← public exponent</span>
                </div>
                <div>
                  d = e⁻¹ mod φ = <span className="text-primary">{keys.d.toString()}</span>{" "}
                  <span className="text-primary/40">
                    ← private (check: e·d mod φ = {((keys.e * keys.d) % keys.phi).toString()})
                  </span>
                </div>
              </div>
            </section>

            {/* Round trip */}
            <section>
              <h2 className="text-primary/50 text-xs uppercase tracking-wide mb-1">round trip</h2>
              <div className="text-xs leading-relaxed text-primary/80 tabular-nums space-y-0.5">
                <div>
                  encrypt: {view.m.toString()}^{keys.e.toString()} mod {keys.n.toString()} ={" "}
                  <span className="text-primary">{view.c.toString()}</span>
                </div>
                <div>
                  decrypt: {view.c.toString()}^{keys.d.toString()} mod {keys.n.toString()} ={" "}
                  <span className="text-primary">{view.back.toString()}</span>
                </div>
                <div className={view.ok ? "text-primary/60" : "text-red-400"}>
                  {view.ok ? "✓ recovered the original message" : "✗ mismatch"}
                </div>
              </div>
            </section>

            {/* Ladder */}
            <section>
              <h2 className="text-primary/50 text-xs uppercase tracking-wide mb-1">
                square-and-multiply ({view.encSteps.length} steps instead of {keys.e.toString()}{" "}
                multiplications)
              </h2>
              <div className="overflow-x-auto">
                <table className="text-xs tabular-nums">
                  <thead className="text-primary/40">
                    <tr>
                      <th className="text-left pr-4 font-normal">bit</th>
                      <th className="text-right pr-4 font-normal">base² chain</th>
                      <th className="text-right pr-4 font-normal">accumulator</th>
                      <th className="text-left font-normal">action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {view.encSteps.map((s, i) => (
                      <tr key={i} className="border-t border-primary/5">
                        <td className="pr-4 text-primary/60">{s.bit}</td>
                        <td className="pr-4 text-right text-primary/70">{s.base.toString()}</td>
                        <td className="pr-4 text-right text-primary/90">{s.acc.toString()}</td>
                        <td className="text-primary/40">
                          {s.multiplied ? "multiply in" : "square only"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Attack */}
            <section>
              <h2 className="text-primary/50 text-xs uppercase tracking-wide mb-1">the attack</h2>
              {cracked ? (
                <p className="text-xs text-primary/80 leading-relaxed">
                  factored n = {keys.n.toString()} into{" "}
                  <span className="text-primary">
                    {cracked.p} × {cracked.q}
                  </span>{" "}
                  after {cracked.tries.toLocaleString()} trial divisions — which hands over φ, then d,
                  then every message. real keys use numbers around 2048 bits, where this same loop
                  would outlast the universe.
                </p>
              ) : (
                <p className="text-xs text-primary/50 leading-relaxed">
                  the only secret is that n factors into p and q. hit “crack it” to recover them by
                  brute force — trivial at this size, impossible at 2048 bits.
                </p>
              )}
            </section>

            <p className="text-xs text-primary/30 leading-relaxed">
              textbook RSA for learning only: tiny primes, no padding, no randomness. do not use it
              to protect anything.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
