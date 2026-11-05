import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Cluster, type ClusterEvent, type Entry, type Role, checkAll } from "../features/raft/raft";

const SIZE = 5;

interface NodeView {
  id: number;
  role: Role;
  alive: boolean;
  term: number;
  commitIndex: number;
  votedFor: number | null;
  votes: number;
  log: Entry[];
}

interface View {
  now: number;
  nodes: NodeView[];
  maxLogLen: number;
  leaderId: number | null;
  isolated: number[];
  events: ClusterEvent[];
  violation: string | null;
  inFlight: number;
}

const ROLE_COLOR: Record<Role, string> = {
  follower: "rgba(0,255,65,0.45)",
  candidate: "#ffd24a",
  leader: "#00ff41",
};

function snapshot(c: Cluster): View {
  const nodes = c.nodes.map((n) => ({
    id: n.id,
    role: n.role,
    alive: n.alive,
    term: n.currentTerm,
    commitIndex: n.commitIndex,
    votedFor: n.votedFor,
    votes: n.votesFrom.size,
    log: n.log,
  }));
  return {
    now: c.now,
    nodes,
    maxLogLen: Math.max(...nodes.map((n) => n.log.length)),
    leaderId: c.leader()?.id ?? null,
    isolated: c.partition ? [...c.partition].sort((a, b) => a - b) : [],
    events: c.events.slice(-9).reverse(),
    violation: checkAll(c),
    inFlight: c.wire.length,
  };
}

/** A term maps to a stable hue so you can see one term's entries at a glance. */
function termColor(term: number, filled: boolean): string {
  const hue = (term * 47 + 110) % 360;
  return filled ? `hsl(${hue} 85% 55%)` : `hsl(${hue} 50% 30%)`;
}

export default function Raft() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const clusterRef = useRef<Cluster | null>(null);
  const runningRef = useRef(true);
  const speedRef = useRef(1);
  const accRef = useRef(0);
  const dirtyRef = useRef(true);

  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [view, setView] = useState<View | null>(null);

  const mark = useCallback(() => {
    dirtyRef.current = true;
  }, []);

  const reset = useCallback(() => {
    clusterRef.current = new Cluster({ size: SIZE }, (Math.random() * 1e9) | 0);
    accRef.current = 0;
    mark();
  }, [mark]);

  const toggleCrash = useCallback(
    (id: number) => {
      const c = clusterRef.current;
      if (!c) return;
      if (c.nodes[id].alive) c.crash(id);
      else c.revive(id);
      mark();
    },
    [mark],
  );

  const toggleIsolate = useCallback(
    (id: number) => {
      const c = clusterRef.current;
      if (!c) return;
      const next = new Set(c.partition ?? []);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      c.setPartition(next.size === 0 || next.size === SIZE ? null : next);
      mark();
    },
    [mark],
  );

  const submit = useCallback(() => {
    clusterRef.current?.submit();
    mark();
  }, [mark]);

  const stepOnce = useCallback(() => {
    clusterRef.current?.tick();
    mark();
  }, [mark]);

  useEffect(() => {
    // Ref-only construction, so the mount effect sets no state synchronously.
    clusterRef.current = new Cluster({ size: SIZE }, (Math.random() * 1e9) | 0);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d") ?? null;

    const resize = () => {
      if (!canvas) return;
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let frame = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const c = clusterRef.current;
      if (!c) return;

      if (runningRef.current) {
        accRef.current += speedRef.current;
        while (accRef.current >= 1) {
          accRef.current -= 1;
          c.tick();
        }
        dirtyRef.current = true;
      }

      // Draw every frame so messages glide even while the DOM lags behind.
      if (canvas && ctx) draw(ctx, canvas.width, canvas.height, c);

      if (dirtyRef.current && (frame++ & 3) === 0) {
        dirtyRef.current = false;
        setView(snapshot(c));
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const committedCount = view ? Math.max(...view.nodes.map((n) => n.commitIndex)) : 0;
  const maxTerm = view ? Math.max(...view.nodes.map((n) => n.term)) : 0;

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/lab" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← lab
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">raft consensus</span>
        </div>
        <div className="text-xs text-primary/40 tabular-nums">
          term {maxTerm} ·{" "}
          {view?.leaderId !== null && view?.leaderId !== undefined
            ? `leader n${view.leaderId}`
            : "no leader"}{" "}
          · {committedCount} committed · {view?.inFlight ?? 0} in flight
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="text-primary/40 text-xs">speed</span>
          <input
            type="range"
            min={0.25}
            max={6}
            step={0.25}
            value={speed}
            onChange={(e) => {
              const v = Number(e.target.value);
              setSpeed(v);
              speedRef.current = v;
            }}
            className="w-24 accent-primary"
          />
          <span className="text-primary/60 text-xs w-10 tabular-nums">{speed}×</span>
        </div>

        <button
          onClick={submit}
          className="px-3 py-1 text-xs border border-primary/40 hover:border-primary bg-primary/10 text-primary transition-colors"
        >
          + submit command
        </button>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={stepOnce}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ⇢ tick
          </button>
          <button
            onClick={() => {
              runningRef.current = !running;
              setRunning(!running);
            }}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            {running ? "⏸ pause" : "▶ run"}
          </button>
          <button
            onClick={reset}
            className="px-3 py-1 text-xs border border-primary/30 hover:border-primary text-primary/70 hover:text-primary transition-colors"
          >
            ↺ reset
          </button>
        </div>
      </div>

      {/* Fault injection */}
      <div className="border-b border-primary/10 px-4 py-2 flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-primary/40 text-xs">faults</span>
        {view?.nodes.map((n) => {
          const isolated = view.isolated.includes(n.id);
          return (
            <span key={n.id} className="flex items-center gap-1">
              <span
                className="text-xs tabular-nums w-6"
                style={{ color: n.alive ? ROLE_COLOR[n.role] : "rgba(255,90,90,0.8)" }}
              >
                n{n.id}
              </span>
              <button
                onClick={() => toggleCrash(n.id)}
                title={n.alive ? "crash this node" : "restart this node"}
                className={`px-1.5 py-0.5 text-[11px] border transition-colors ${
                  n.alive
                    ? "border-primary/20 text-primary/50 hover:border-primary/60"
                    : "border-red-400/60 bg-red-500/20 text-red-300"
                }`}
              >
                {n.alive ? "⏻ kill" : "⏻ down"}
              </button>
              <button
                onClick={() => toggleIsolate(n.id)}
                title="move this node to the other side of a network split"
                className={`px-1.5 py-0.5 text-[11px] border transition-colors ${
                  isolated
                    ? "border-yellow-400/70 bg-yellow-400/15 text-yellow-200"
                    : "border-primary/20 text-primary/50 hover:border-primary/60"
                }`}
              >
                ⇹ split
              </button>
            </span>
          );
        })}
        {view && view.isolated.length > 0 && (
          <button
            onClick={() => {
              clusterRef.current?.setPartition(null);
              mark();
            }}
            className="px-2 py-0.5 text-[11px] border border-primary/30 hover:border-primary text-primary/70 transition-colors"
          >
            heal network
          </button>
        )}
      </div>

      {/* Canvas */}
      <div className="relative overflow-hidden" style={{ height: "clamp(220px, 34vh, 360px)" }}>
        <canvas ref={canvasRef} className="block w-full h-full" />
        <div className="absolute bottom-2 left-4 text-[11px] text-primary/35 pointer-events-none max-w-md">
          green = leader, amber = candidate, dim = follower. dots are messages in flight; dashed red
          links are cut by the split.
        </div>
      </div>

      {/* Logs */}
      <div className="border-t border-primary/10 px-4 py-3 overflow-x-auto">
        <div className="flex items-baseline gap-3 mb-2">
          <h2 className="text-primary/50 text-xs uppercase tracking-wide">the replicated logs</h2>
          <span className="text-[11px] text-primary/35">
            filled = committed, hollow = accepted but not yet safe · colour = the term that wrote it
          </span>
        </div>
        <div className="space-y-1">
          {view?.nodes.map((n) => (
            <div key={n.id} className="flex items-center gap-2">
              <span
                className="text-xs tabular-nums w-20 shrink-0"
                style={{ color: n.alive ? ROLE_COLOR[n.role] : "rgba(255,90,90,0.75)" }}
              >
                n{n.id} t{n.term}
                {n.role === "leader" ? " ★" : n.role === "candidate" ? " ?" : ""}
              </span>
              <div className="flex gap-[2px]">
                {Array.from({ length: Math.max(1, view.maxLogLen - 1) }, (_, k) => {
                  const idx = k + 1;
                  const e = n.log[idx];
                  if (!e) {
                    return (
                      <span
                        key={idx}
                        className="w-5 h-5 border border-primary/10"
                        style={{ opacity: 0.35 }}
                      />
                    );
                  }
                  const filled = idx <= n.commitIndex;
                  return (
                    <span
                      key={idx}
                      title={`index ${idx} · term ${e.term} · ${e.cmd}${filled ? " · committed" : " · uncommitted"}`}
                      className="w-5 h-5 flex items-center justify-center text-[10px] tabular-nums border"
                      style={{
                        borderColor: termColor(e.term, true),
                        background: filled ? termColor(e.term, false) : "transparent",
                        color: filled ? "#eaffea" : termColor(e.term, true),
                      }}
                    >
                      {e.term}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invariants + event feed */}
      <div className="border-t border-primary/10 px-4 py-3 grid gap-4 md:grid-cols-2">
        <div>
          <h2 className="text-primary/50 text-xs uppercase tracking-wide mb-2">
            safety invariants, checked live
          </h2>
          {view?.violation ? (
            <p className="text-xs" style={{ color: "#ff6a6a" }}>
              ✗ {view.violation}
            </p>
          ) : (
            <ul className="text-xs text-primary/60 space-y-1">
              <li>✓ election safety — at most one leader per term</li>
              <li>✓ log matching — equal term at an index implies equal history</li>
              <li>✓ state machine safety — no two nodes applied different commands</li>
            </ul>
          )}
          <p className="text-[11px] text-primary/30 mt-2">
            these are the real Raft invariants, recomputed from the live cluster every few frames.
            kill nodes and cut the network as hard as you like — progress stops without a majority,
            but none of the three will break.
          </p>
        </div>
        <div>
          <h2 className="text-primary/50 text-xs uppercase tracking-wide mb-2">log</h2>
          <div className="text-[11px] text-primary/50 space-y-0.5 tabular-nums">
            {view?.events.map((e, i) => (
              <div key={`${e.at}-${i}`}>
                <span className="text-primary/25">{e.at}</span> {e.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 text-xs text-primary/40 max-w-3xl">
        every node keeps its own log and its own idea of the current term. a node that stops hearing
        from a leader campaigns for the next term; a candidate that collects a majority of votes
        becomes leader, and only then may it append. an entry is <em>committed</em> only once it sits
        on a majority <em>and</em> was written in the current leader&apos;s own term — the extra
        condition that stops a later leader from quietly replacing it.
      </div>
    </div>
  );
}

/* ---------------------------------- canvas --------------------------------- */

function draw(ctx: CanvasRenderingContext2D, W: number, H: number, c: Cluster) {
  ctx.fillStyle = "#050805";
  ctx.fillRect(0, 0, W, H);

  const cx = W / 2;
  const cy = H / 2;
  const radius = Math.min(W, H) * 0.33;
  const n = c.nodes.length;
  const pos = c.nodes.map((_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return [cx + Math.cos(a) * radius, cy + Math.sin(a) * radius] as const;
  });

  // Links, with cut ones dashed red.
  for (let a = 0; a < n; a++) {
    for (let b = a + 1; b < n; b++) {
      const cut = !c.connected(a, b);
      ctx.beginPath();
      ctx.setLineDash(cut ? [4, 4] : []);
      ctx.strokeStyle = cut ? "rgba(255,80,80,0.5)" : "rgba(0,255,65,0.1)";
      ctx.lineWidth = 1;
      ctx.moveTo(pos[a][0], pos[a][1]);
      ctx.lineTo(pos[b][0], pos[b][1]);
      ctx.stroke();
    }
  }
  ctx.setLineDash([]);

  // Messages in flight.
  for (const m of c.wire) {
    const span = m.arriveAt - m.sentAt;
    const t = span <= 0 ? 1 : Math.min(1, Math.max(0, (c.now - m.sentAt) / span));
    const [x0, y0] = pos[m.from];
    const [x1, y1] = pos[m.to];
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t;
    const vote = m.kind === "vote-req" || m.kind === "vote-reply";
    const reply = m.kind === "vote-reply" || m.kind === "append-reply";
    ctx.beginPath();
    ctx.fillStyle = vote ? "#ffd24a" : "#00ff41";
    ctx.globalAlpha = reply ? 0.45 : 0.95;
    ctx.arc(x, y, reply ? 2 : 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Nodes.
  for (const node of c.nodes) {
    const [x, y] = pos[node.id];
    const r = Math.max(16, Math.min(26, radius * 0.26));
    const color = node.alive ? ROLE_COLOR[node.role] : "rgba(255,90,90,0.65)";

    if (node.role === "leader" && node.alive) {
      ctx.beginPath();
      ctx.fillStyle = "rgba(0,255,65,0.10)";
      ctx.arc(x, y, r + 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.fillStyle = node.alive ? "rgba(0,20,6,0.9)" : "rgba(30,6,6,0.9)";
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = node.role === "leader" ? 2.5 : 1.5;
    ctx.strokeStyle = color;
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.font = "600 12px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(node.alive ? `n${node.id}` : "✕", x, y - 4);
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillStyle = "rgba(0,255,65,0.45)";
    ctx.fillText(`t${node.currentTerm}`, x, y + 8);

    if (node.alive) {
      ctx.fillStyle = "rgba(0,255,65,0.35)";
      ctx.font = "9px ui-monospace, monospace";
      const label =
        node.role === "candidate"
          ? `${node.votesFrom.size} votes`
          : node.role === "leader"
            ? `commit ${node.commitIndex}`
            : `log ${node.log.length - 1}`;
      ctx.fillText(label, x, y + r + 10);
    }
  }
}
