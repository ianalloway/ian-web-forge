import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { buildTable, traceback, tracebackPath } from "../features/editdistance/levenshtein";

const EXAMPLES: [string, string][] = [
  ["kitten", "sitting"],
  ["saturday", "sunday"],
  ["intention", "execution"],
  ["flaw", "lawn"],
];

const OP_COLOR: Record<string, string> = {
  match: "rgba(0,255,65,0.75)",
  substitute: "#ffd23d",
  insert: "#5ad0ff",
  delete: "#ff6a3d",
};

export default function EditDistance() {
  const [a, setA] = useState("kitten");
  const [b, setB] = useState("sitting");

  // Keep the table small enough to render as a grid.
  const av = a.slice(0, 18);
  const bv = b.slice(0, 18);

  const { table, steps, pathSet } = useMemo(() => {
    const t = buildTable(av, bv);
    const s = traceback(t);
    const set = new Set(tracebackPath(t).map(([i, j]) => `${i},${j}`));
    return { table: t, steps: s, pathSet: set };
  }, [av, bv]);

  const cellAt = (i: number, j: number) => table.cells[i * table.cols + j];

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">edit distance</span>
        </div>
        <div className="text-xs text-primary/40 tabular-nums">
          distance <span className="text-primary">{table.distance}</span> ·{" "}
          {table.rows * table.cols} cells
        </div>
      </div>

      {/* Inputs */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <label className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">from</span>
          <input
            value={a}
            spellCheck={false}
            onChange={(e) => setA(e.target.value)}
            className="bg-black/40 border border-primary/20 focus:border-primary/60 outline-none text-primary/90 text-sm px-2 py-0.5 w-36 font-mono"
          />
        </label>
        <label className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">to</span>
          <input
            value={b}
            spellCheck={false}
            onChange={(e) => setB(e.target.value)}
            className="bg-black/40 border border-primary/20 focus:border-primary/60 outline-none text-primary/90 text-sm px-2 py-0.5 w-36 font-mono"
          />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map(([x, y]) => (
            <button
              key={x}
              onClick={() => {
                setA(x);
                setB(y);
              }}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                a === x && b === y
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/20 text-primary/50 hover:border-primary/50"
              }`}
            >
              {x}→{y}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto px-4 py-4">
        <div className="space-y-6">
          {/* Edit script */}
          <section>
            <h2 className="text-primary/50 text-xs uppercase tracking-wide mb-2">the edit script</h2>
            <div className="flex flex-wrap gap-1">
              {steps.map((s, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 text-xs border"
                  style={{ borderColor: OP_COLOR[s.op], color: OP_COLOR[s.op] }}
                  title={s.op}
                >
                  {s.op === "match"
                    ? s.aChar
                    : s.op === "substitute"
                      ? `${s.aChar}→${s.bChar}`
                      : s.op === "insert"
                        ? `+${s.bChar}`
                        : `−${s.aChar}`}
                </span>
              ))}
              {steps.length === 0 && (
                <span className="text-xs text-primary/40">identical — nothing to do.</span>
              )}
            </div>
            <div className="flex flex-wrap gap-3 mt-2 text-[11px]">
              {(["match", "substitute", "insert", "delete"] as const).map((op) => (
                <span key={op} style={{ color: OP_COLOR[op] }}>
                  ■ {op}
                </span>
              ))}
            </div>
          </section>

          {/* DP table */}
          <section>
            <h2 className="text-primary/50 text-xs uppercase tracking-wide mb-2">
              the table (each cell = cheapest way to reach that prefix pair)
            </h2>
            <div className="overflow-auto">
              <table className="text-xs tabular-nums border-collapse">
                <thead>
                  <tr>
                    <th className="w-7" />
                    <th className="w-7 text-primary/30 font-normal">ε</th>
                    {[...bv].map((c, j) => (
                      <th key={j} className="w-7 text-primary/70 font-normal">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: table.rows }, (_, i) => (
                    <tr key={i}>
                      <th className="text-primary/70 font-normal pr-1">
                        {i === 0 ? <span className="text-primary/30">ε</span> : av[i - 1]}
                      </th>
                      {Array.from({ length: table.cols }, (_, j) => {
                        const onPath = pathSet.has(`${i},${j}`);
                        const isCorner = i === table.rows - 1 && j === table.cols - 1;
                        return (
                          <td
                            key={j}
                            className="text-center border"
                            style={{
                              width: 28,
                              height: 24,
                              borderColor: onPath ? "rgba(0,255,65,0.55)" : "rgba(0,255,65,0.10)",
                              background: isCorner
                                ? "rgba(0,255,65,0.28)"
                                : onPath
                                  ? "rgba(0,255,65,0.13)"
                                  : "transparent",
                              color: onPath ? "#c9ffd6" : "rgba(0,255,65,0.42)",
                              fontWeight: isCorner ? 700 : 400,
                            }}
                          >
                            {cellAt(i, j).cost}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      <div className="px-4 pb-4 text-xs text-primary/40 max-w-2xl">
        every cell asks the same question: is it cheaper to substitute, insert, or delete? each
        answer only needs the three neighbours already computed, so filling the grid once solves a
        problem that would take exponential time to search naively. the highlighted path is the
        cheapest route back.
      </div>
    </div>
  );
}
