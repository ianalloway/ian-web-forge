import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BloomFilter, optimalK } from "../features/bloom/bloom";

const M = 512; // bits
const SEED_WORDS = ["apple", "banana", "cherry", "durian", "elderberry", "fig", "grape"];

interface Probe {
  term: string;
  hits: { index: number; set: boolean }[];
  verdict: "added" | "probably" | "definitely-not";
}

export default function Bloom() {
  const [k, setK] = useState(4);
  const [added, setAdded] = useState<string[]>([]);
  const [term, setTerm] = useState("");
  const [probe, setProbe] = useState<Probe | null>(null);
  const [audit, setAudit] = useState<{ tested: number; falsePositives: number } | null>(null);

  // The filter is fully determined by (k, added), so derive it rather than
  // holding mutable state — changing k rehashes the same words from scratch.
  const bf = useMemo(() => {
    const next = new BloomFilter(M, k);
    for (const w of added) next.add(w);
    return next;
  }, [k, added]);

  const addTerm = (raw: string) => {
    const w = raw.trim();
    if (!w || added.includes(w)) return;
    setAdded((prev) => [...prev, w]);
    setTerm("");
    setProbe(null);
    setAudit(null);
  };

  const checkTerm = (raw: string) => {
    const w = raw.trim();
    if (!w) return;
    const hits = bf.probe(w);
    const all = hits.every((h) => h.set);
    setProbe({
      term: w,
      hits,
      verdict: added.includes(w) ? "added" : all ? "probably" : "definitely-not",
    });
  };

  /** Sweep many never-added terms to measure the real false-positive rate. */
  const runAudit = () => {
    let fp = 0;
    const tested = 5000;
    for (let i = 0; i < tested; i++) {
      const w = `__audit_${i}`;
      if (!added.includes(w) && bf.has(w)) fp++;
    }
    setAudit({ tested, falsePositives: fp });
  };

  const reset = () => {
    setAdded([]);
    setProbe(null);
    setAudit(null);
  };

  const highlighted = new Set(probe?.hits.map((h) => h.index) ?? []);
  const suggestedK = optimalK(M, Math.max(1, added.length));

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">bloom filter</span>
        </div>
        <div className="text-xs text-primary/40 tabular-nums">
          {added.length} items · {bf.bitsSet}/{M} bits · predicted FPR{" "}
          {(bf.theoreticalFpr() * 100).toFixed(2)}%
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <input
            value={term}
            spellCheck={false}
            placeholder="a word…"
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addTerm(term);
            }}
            className="bg-black/40 border border-primary/20 focus:border-primary/60 outline-none text-primary/90 text-sm px-2 py-0.5 w-36 font-mono"
          />
          <button
            onClick={() => addTerm(term)}
            className="px-2 py-0.5 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            add
          </button>
          <button
            onClick={() => checkTerm(term)}
            className="px-2 py-0.5 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            check
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">k</span>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={k}
            onChange={(e) => {
              setK(Number(e.target.value));
              setProbe(null);
              setAudit(null);
            }}
            className="w-24 accent-primary"
          />
          <span className="text-primary/60 text-xs w-16 tabular-nums">
            {k}
            {added.length > 0 && suggestedK !== k ? ` (best ${suggestedK})` : ""}
          </span>
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => SEED_WORDS.forEach((w) => !added.includes(w) && setAdded((p) => [...p, w]))}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            + sample words
          </button>
          <button
            onClick={runAudit}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ⚖ measure FPR
          </button>
          <button
            onClick={reset}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ↺ clear
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Bit array */}
        <section>
          <h2 className="text-primary/50 text-xs uppercase tracking-wide mb-2">
            the bit array — that is the entire data structure
          </h2>
          <div
            className="grid gap-[2px]"
            style={{ gridTemplateColumns: "repeat(64, minmax(0, 1fr))", maxWidth: 720 }}
          >
            {Array.from({ length: M }, (_, i) => {
              const set = bf.bits[i] === 1;
              const lit = highlighted.has(i);
              return (
                <div
                  key={i}
                  title={`bit ${i}`}
                  style={{
                    aspectRatio: "1",
                    borderRadius: 1,
                    background: lit
                      ? set
                        ? "#c9ffd6"
                        : "#ff6a6a"
                      : set
                        ? "rgba(0,255,65,0.75)"
                        : "rgba(0,255,65,0.07)",
                  }}
                />
              );
            })}
          </div>
        </section>

        {/* Probe result */}
        {probe && (
          <section>
            <h2 className="text-primary/50 text-xs uppercase tracking-wide mb-1">
              checking “{probe.term}”
            </h2>
            <p className="text-sm mb-1">
              {probe.verdict === "definitely-not" ? (
                <span style={{ color: "#ff6a6a" }}>definitely not in the set</span>
              ) : probe.verdict === "added" ? (
                <span style={{ color: "#00ff41" }}>present — and it really was added</span>
              ) : (
                <span style={{ color: "#ffd23d" }}>
                  reported present, but it was never added — a false positive
                </span>
              )}
            </p>
            <p className="text-xs text-primary/50 tabular-nums">
              bits {probe.hits.map((h) => h.index).join(", ")} —{" "}
              {probe.hits.filter((h) => h.set).length}/{probe.hits.length} were already set
              {probe.verdict === "definitely-not" && " · one clear bit is proof of absence"}
            </p>
          </section>
        )}

        {/* Audit */}
        {audit && (
          <section>
            <h2 className="text-primary/50 text-xs uppercase tracking-wide mb-1">measured</h2>
            <p className="text-xs text-primary/70 tabular-nums">
              {audit.falsePositives} false positives out of {audit.tested.toLocaleString()} words
              never added ={" "}
              <span className="text-primary">
                {((audit.falsePositives / audit.tested) * 100).toFixed(2)}%
              </span>
              <span className="text-primary/40">
                {" "}
                · formula predicts {(bf.theoreticalFpr() * 100).toFixed(2)}%
              </span>
            </p>
          </section>
        )}

        {/* Members */}
        <section>
          <h2 className="text-primary/50 text-xs uppercase tracking-wide mb-2">
            actually added ({added.length})
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {added.map((w) => (
              <button
                key={w}
                onClick={() => checkTerm(w)}
                className="px-2 py-0.5 text-xs border border-primary/20 text-primary/60 hover:border-primary hover:text-primary transition-colors"
              >
                {w}
              </button>
            ))}
            {added.length === 0 && (
              <span className="text-xs text-primary/35">nothing yet — add a word above.</span>
            )}
          </div>
        </section>
      </div>

      <div className="px-4 pb-4 text-xs text-primary/40 max-w-2xl">
        adding a word sets k bits; checking one reads the same k. a single clear bit proves the word
        was never added, so there are never false negatives — but enough other words can set all k
        by accident, and then the filter lies in the one direction it is allowed to.
      </div>
    </div>
  );
}
