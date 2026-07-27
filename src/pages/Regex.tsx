import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { literalsOf, parse, run, toDFA, toNFA } from "../features/regex/engine";

const EXAMPLES = [
  { pattern: "(a|b)*abb", input: "ababb" },
  { pattern: "ab*c", input: "abbbc" },
  { pattern: "(ab|cd)*e", input: "abcde" },
  { pattern: "a.c", input: "axc" },
  { pattern: "x(y|z)*w", input: "xyzyw" },
];

export default function Regex() {
  const [pattern, setPattern] = useState("(a|b)*abb");
  const [input, setInput] = useState("ababb");

  const compiled = useMemo(() => {
    try {
      const tree = parse(pattern);
      const nfa = toNFA(tree);
      const alphabet = [...new Set([...literalsOf(tree), ...input])];
      const dfa = toDFA(nfa, alphabet);
      const result = run(dfa, input);
      return { tree, nfa, dfa, result, alphabet, error: null as string | null };
    } catch (e) {
      return {
        tree: null,
        nfa: null,
        dfa: null,
        result: null,
        alphabet: [],
        error: e instanceof Error ? e.message : "invalid pattern",
      };
    }
  }, [pattern, input]);

  const { dfa, nfa, result, error } = compiled;
  // Which DFA state we sit in after each consumed character.
  const path: (number | null)[] = [];
  if (result && dfa) {
    let s: number | null = dfa.start;
    path.push(s);
    for (const step of result.steps) {
      s = step.to;
      path.push(s);
    }
  }

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">regex engine</span>
        </div>
        <div className="text-xs text-primary/40 tabular-nums">
          {error
            ? "parse error"
            : `${nfa?.edges.length ?? 0} NFA states → ${dfa?.members.length ?? 0} DFA states`}
        </div>
      </div>

      {/* Inputs */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <label className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">pattern</span>
          <input
            value={pattern}
            spellCheck={false}
            onChange={(e) => setPattern(e.target.value)}
            className="bg-black/40 border border-primary/20 focus:border-primary/60 outline-none text-primary/90 text-sm px-2 py-0.5 w-48 font-mono"
          />
        </label>
        <label className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">input</span>
          <input
            value={input}
            spellCheck={false}
            onChange={(e) => setInput(e.target.value)}
            className="bg-black/40 border border-primary/20 focus:border-primary/60 outline-none text-primary/90 text-sm px-2 py-0.5 w-40 font-mono"
          />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.pattern}
              onClick={() => {
                setPattern(ex.pattern);
                setInput(ex.input);
              }}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                pattern === ex.pattern
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/20 text-primary/50 hover:border-primary/50"
              }`}
            >
              {ex.pattern}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {error ? (
          <p className="text-red-400 text-sm">{error}</p>
        ) : (
          <div className="space-y-6 max-w-4xl">
            {/* Verdict + walk */}
            <section>
              <div className="flex items-baseline gap-3 mb-2">
                <h2 className="text-primary/50 text-xs uppercase tracking-wide">the walk</h2>
                <span
                  className="text-xs"
                  style={{ color: result?.accepted ? "#00ff41" : "#ff6a6a" }}
                >
                  {result?.accepted ? "match" : "no match"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1 text-xs tabular-nums">
                <span className="px-2 py-1 border border-primary/40 text-primary">
                  q{dfa?.start}
                </span>
                {result?.steps.map((s, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <span className="text-primary/40">
                      —{s.ch === " " ? "␣" : s.ch}→
                    </span>
                    <span
                      className="px-2 py-1 border"
                      style={
                        s.to === null
                          ? { borderColor: "#ff6a6a", color: "#ff6a6a" }
                          : dfa?.accepting.has(s.to)
                            ? { borderColor: "#00ff41", background: "rgba(0,255,65,0.15)", color: "#c9ffd6" }
                            : { borderColor: "rgba(0,255,65,0.3)", color: "rgba(0,255,65,0.75)" }
                      }
                    >
                      {s.to === null ? "✗" : `q${s.to}`}
                    </span>
                  </span>
                ))}
              </div>
              <p className="text-xs text-primary/35 mt-2">
                double-bordered states accept. one transition per character, never any
                backtracking — that is why this runs in linear time.
              </p>
            </section>

            {/* DFA table */}
            <section>
              <h2 className="text-primary/50 text-xs uppercase tracking-wide mb-2">
                the DFA (each row is a set of NFA states)
              </h2>
              <div className="overflow-x-auto">
                <table className="text-xs tabular-nums">
                  <thead className="text-primary/40">
                    <tr>
                      <th className="text-left pr-4 font-normal">state</th>
                      <th className="text-left pr-4 font-normal">NFA states</th>
                      {compiled.alphabet.map((a) => (
                        <th key={a} className="text-left pr-4 font-normal">
                          {a === " " ? "␣" : a}
                        </th>
                      ))}
                      <th className="text-left font-normal">.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dfa?.members.map((members, i) => {
                      const onPath = path.includes(i);
                      return (
                        <tr
                          key={i}
                          className="border-t border-primary/5"
                          style={onPath ? { background: "rgba(0,255,65,0.06)" } : undefined}
                        >
                          <td className="pr-4 py-0.5">
                            <span
                              style={{
                                color: dfa.accepting.has(i) ? "#00ff41" : "rgba(0,255,65,0.7)",
                                fontWeight: dfa.accepting.has(i) ? 700 : 400,
                              }}
                            >
                              q{i}
                              {dfa.accepting.has(i) ? " ✓" : ""}
                            </span>
                          </td>
                          <td className="pr-4 py-0.5 text-primary/35">{`{${members.join(",")}}`}</td>
                          {compiled.alphabet.map((a) => (
                            <td key={a} className="pr-4 py-0.5 text-primary/70">
                              {dfa.transitions[i]?.get(a) !== undefined
                                ? `q${dfa.transitions[i].get(a)}`
                                : "—"}
                            </td>
                          ))}
                          <td className="py-0.5 text-primary/70">
                            {dfa.anyTransition[i] !== undefined ? `q${dfa.anyTransition[i]}` : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>

      <div className="px-4 pb-4 text-xs text-primary/40 max-w-2xl">
        the pattern becomes a syntax tree, the tree becomes an NFA by Thompson's construction, and
        the NFA becomes a DFA by tracking which <em>sets</em> of NFA states you could be in at once.
        supports literals, <code>|</code>, <code>*</code>, <code>+</code>, <code>?</code>,{" "}
        <code>.</code>, and groups.
      </div>
    </div>
  );
}
