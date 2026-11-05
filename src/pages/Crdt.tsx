import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Replica, converged, syncAll } from "../features/crdt/rga";

const COUNT = 3;
const SEED = "the quick brown fox";

/** One colour per replica, so you can see who typed what. */
const HUE = [135, 190, 45];
const color = (replica: number, alpha = 1) =>
  `hsl(${HUE[replica % HUE.length]} 90% 62% / ${alpha})`;

interface RepView {
  id: number;
  online: boolean;
  text: string;
  unsynced: number;
  pending: number;
}

interface SpineCell {
  key: string;
  char: string;
  deleted: boolean;
  replica: number;
}

interface View {
  reps: RepView[];
  spine: SpineCell[];
  divergence: string | null;
  tombstones: number;
}

/**
 * Turn "the text was this, now it is that" into CRDT operations, by keeping
 * the common prefix and suffix and rewriting only the middle.
 */
function applyEdit(r: Replica, next: string) {
  const old = r.text();
  let p = 0;
  while (p < old.length && p < next.length && old[p] === next[p]) p++;
  let s = 0;
  while (
    s < old.length - p &&
    s < next.length - p &&
    old[old.length - 1 - s] === next[next.length - 1 - s]
  ) {
    s++;
  }
  for (let i = old.length - s - 1; i >= p; i--) r.deleteAt(i);
  const added = next.slice(p, next.length - s);
  if (added) r.insertText(p, added);
}

function snapshot(reps: Replica[], online: boolean[]): View {
  const spineSource = reps[0];
  return {
    reps: reps.map((r, i) => ({
      id: r.id,
      online: online[i],
      text: r.text(),
      unsynced: r.ops.filter((op) => reps.some((o) => o !== r && !o.has(op))).length,
      pending: r.pendingCount,
    })),
    spine: spineSource.elems.map((e) => ({
      key: `${e.id.replica}:${e.id.counter}`,
      char: e.char,
      deleted: e.deleted,
      replica: e.id.replica,
    })),
    divergence: converged(reps),
    tombstones: spineSource.elems.filter((e) => e.deleted).length,
  };
}

export default function Crdt() {
  const repsRef = useRef<Replica[] | null>(null);
  const onlineRef = useRef<boolean[]>(new Array(COUNT).fill(true));
  const [view, setView] = useState<View | null>(null);
  const [showSpine, setShowSpine] = useState(true);

  const refresh = useCallback(() => {
    const reps = repsRef.current;
    if (reps) setView(snapshot(reps, onlineRef.current));
  }, []);

  const build = useCallback(() => {
    const reps = Array.from({ length: COUNT }, (_, i) => new Replica(i));
    reps[0].insertText(0, SEED);
    syncAll(reps);
    repsRef.current = reps;
    onlineRef.current = new Array(COUNT).fill(true);
  }, []);

  useEffect(() => {
    build();
    refresh();
    // Online replicas gossip continuously, the way a real client would.
    const timer = window.setInterval(() => {
      const reps = repsRef.current;
      if (!reps) return;
      const live = reps.filter((_, i) => onlineRef.current[i]);
      if (live.length > 1) {
        let moved = 0;
        for (const a of live) for (const b of live) if (a !== b) moved += a.mergeFrom(b);
        if (moved > 0) refresh();
      }
    }, 500);
    return () => window.clearInterval(timer);
  }, [build, refresh]);

  const onEdit = (i: number, next: string) => {
    const reps = repsRef.current;
    if (!reps) return;
    applyEdit(reps[i], next);
    refresh();
  };

  const toggleOnline = (i: number) => {
    onlineRef.current[i] = !onlineRef.current[i];
    refresh();
  };

  const syncNow = () => {
    const reps = repsRef.current;
    if (!reps) return;
    syncAll(reps);
    onlineRef.current = new Array(COUNT).fill(true);
    refresh();
  };

  const reset = () => {
    build();
    refresh();
  };

  const offlineCount = view ? view.reps.filter((r) => !r.online).length : 0;

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/lab" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← lab
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">crdt — editing without agreement</span>
        </div>
        <div className="text-xs tabular-nums">
          {view?.divergence ? (
            <span style={{ color: "#ffd24a" }}>diverged — {offlineCount} offline</span>
          ) : (
            <span className="text-primary/60">converged · all {COUNT} replicas identical</span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-primary/40 text-xs">
          type in any box — take replicas offline first to force a conflict
        </span>
        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => setShowSpine((s) => !s)}
            className={`px-2 py-1 text-xs border transition-colors ${
              showSpine
                ? "border-primary bg-primary/10 text-primary"
                : "border-primary/20 text-primary/50 hover:border-primary/50"
            }`}
          >
            tombstones {showSpine ? "shown" : "hidden"}
          </button>
          <button
            onClick={syncNow}
            className="px-3 py-1 text-xs border border-primary/40 bg-primary/10 hover:border-primary text-primary transition-colors"
          >
            ⇄ reconnect all
          </button>
          <button
            onClick={reset}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ↺ reset
          </button>
        </div>
      </div>

      {/* Replicas */}
      <div className="px-4 py-4 grid gap-3 md:grid-cols-3">
        {view?.reps.map((r, i) => (
          <div
            key={r.id}
            className="border p-3 flex flex-col gap-2"
            style={{
              borderColor: r.online ? color(r.id, 0.4) : "rgba(255,210,74,0.45)",
              background: r.online ? "transparent" : "rgba(255,210,74,0.04)",
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs" style={{ color: color(r.id) }}>
                replica {r.id}
              </span>
              <button
                onClick={() => toggleOnline(i)}
                className={`px-2 py-0.5 text-[11px] border transition-colors ${
                  r.online
                    ? "border-primary/25 text-primary/60 hover:border-primary/60"
                    : "border-yellow-400/60 bg-yellow-400/15 text-yellow-200"
                }`}
              >
                {r.online ? "● online" : "○ offline"}
              </button>
            </div>
            <textarea
              value={r.text}
              spellCheck={false}
              rows={4}
              onChange={(e) => onEdit(i, e.target.value)}
              className="bg-black/40 border border-primary/15 focus:border-primary/60 outline-none text-primary/90 text-sm px-2 py-1.5 font-mono resize-none"
            />
            <div className="text-[11px] text-primary/35 tabular-nums">
              {r.text.length} chars ·{" "}
              {r.unsynced > 0 ? (
                <span style={{ color: "#ffd24a" }}>{r.unsynced} op(s) not yet everywhere</span>
              ) : (
                "in sync"
              )}
              {r.pending > 0 ? ` · ${r.pending} waiting on causality` : ""}
            </div>
          </div>
        ))}
      </div>

      {/* The spine */}
      {showSpine && view && (
        <div className="px-4 pb-4">
          <div className="flex items-baseline gap-3 mb-2 flex-wrap">
            <h2 className="text-primary/50 text-xs uppercase tracking-wide">
              what replica 0 actually stores
            </h2>
            <span className="text-[11px] text-primary/35">
              every character keeps its own id and its author&apos;s colour · struck-through ones
              are tombstones — deleted, but still here so later edits keep their anchor ·{" "}
              {view.tombstones} of {view.spine.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-[2px]">
            {view.spine.map((c) => (
              <span
                key={c.key}
                title={`id ${c.key}${c.deleted ? " · deleted" : ""}`}
                className="w-5 h-6 flex items-center justify-center text-xs border"
                style={{
                  borderColor: color(c.replica, c.deleted ? 0.2 : 0.5),
                  background: c.deleted ? "transparent" : color(c.replica, 0.12),
                  color: c.deleted ? color(c.replica, 0.35) : color(c.replica),
                  textDecoration: c.deleted ? "line-through" : "none",
                }}
              >
                {c.char === " " ? "␣" : c.char}
              </span>
            ))}
            {view.spine.length === 0 && (
              <span className="text-primary/30 text-xs">empty document</span>
            )}
          </div>
        </div>
      )}

      {/* Explanation */}
      <div className="border-t border-primary/10 px-4 py-3 grid gap-4 md:grid-cols-2">
        <div>
          <h2 className="text-primary/50 text-xs uppercase tracking-wide mb-2">
            the guarantee, checked live
          </h2>
          {view?.divergence ? (
            <p className="text-xs" style={{ color: "#ffd24a" }}>
              ⧗ {view.divergence}
            </p>
          ) : (
            <ul className="text-xs text-primary/60 space-y-1">
              <li>✓ every replica shows the same text</li>
              <li>✓ and stores the same character order underneath</li>
            </ul>
          )}
          <p className="text-[11px] text-primary/30 mt-2">
            divergence here is not a bug — it is just replicas that have not talked yet. the claim
            is that they converge <em>whenever</em> they do, in any order, with no leader and no
            votes. take two offline, type over each other, and reconnect.
          </p>
        </div>
        <div className="text-xs text-primary/45 leading-relaxed">
          <Link to="/raft" className="text-primary/70 hover:text-primary underline">
            raft
          </Link>{" "}
          solves this by electing a leader and making everyone replay its log — one order, agreed by
          majority vote. a CRDT refuses the question. each character carries a unique id and a
          pointer to the character it followed, and concurrent inserts at the same spot are ordered
          by id, so every replica independently computes the same sequence. the cost is tombstones:
          deleted characters stay, because a late edit may still be anchored to one.
        </div>
      </div>
    </div>
  );
}
