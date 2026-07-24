import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { HNode, analyze } from "../features/huffman/huffman";

const SAMPLE = "the quick brown fox jumps over the lazy dog";

/** Printable label for a character (spaces / control chars made visible). */
function label(ch: string): string {
  if (ch === " ") return "␣";
  if (ch === "\n") return "⏎";
  if (ch === "\t") return "⇥";
  return ch;
}

export default function Huffman() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [text, setText] = useState(SAMPLE);
  const stats = useMemo(() => analyze(text), [text]);

  // Code table rows sorted by frequency (desc).
  const rows = useMemo(() => {
    return [...stats.freqs.entries()]
      .map(([ch, freq]) => ({ ch, freq, code: stats.codes.get(ch) ?? "" }))
      .sort((a, b) => b.freq - a.freq || a.ch.localeCompare(b.ch));
  }, [stats]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      ctx.fillStyle = "#050805";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const tree = stats.tree;
      if (!tree) return;

      // Assign leaf x by in-order index and node depth.
      const pos = new Map<HNode, { x: number; depth: number }>();
      let leafX = 0;
      let maxDepth = 0;
      const layout = (node: HNode, depth: number): number => {
        maxDepth = Math.max(maxDepth, depth);
        const isLeaf = node.char !== null || (!node.left && !node.right);
        if (isLeaf) {
          const x = leafX++;
          pos.set(node, { x, depth });
          return x;
        }
        const xs: number[] = [];
        if (node.left) xs.push(layout(node.left, depth + 1));
        if (node.right) xs.push(layout(node.right, depth + 1));
        const x = xs.reduce((a, b) => a + b, 0) / xs.length;
        pos.set(node, { x, depth });
        return x;
      };
      layout(tree, 0);
      const leaves = Math.max(1, leafX);

      const mx = 26;
      const my = 26;
      const W = canvas.width;
      const H = canvas.height;
      const px = (x: number) => (leaves === 1 ? W / 2 : mx + (x / (leaves - 1)) * (W - 2 * mx));
      const py = (d: number) => (maxDepth === 0 ? H / 2 : my + (d / maxDepth) * (H - 2 * my));

      // Edges + 0/1 labels.
      ctx.strokeStyle = "rgba(0,255,65,0.35)";
      ctx.lineWidth = 1;
      ctx.font = "10px monospace";
      const drawEdges = (node: HNode) => {
        const p = pos.get(node)!;
        const x0 = px(p.x);
        const y0 = py(p.depth);
        const branch = (child: HNode | null, bit: string) => {
          if (!child) return;
          const c = pos.get(child)!;
          const x1 = px(c.x);
          const y1 = py(c.depth);
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();
          ctx.fillStyle = "rgba(0,255,65,0.5)";
          ctx.fillText(bit, (x0 + x1) / 2 + 3, (y0 + y1) / 2);
          drawEdges(child);
        };
        branch(node.left, "0");
        branch(node.right, "1");
      };
      drawEdges(tree);

      // Nodes.
      ctx.textAlign = "center";
      for (const [node, p] of pos) {
        const x = px(p.x);
        const y = py(p.depth);
        if (node.char !== null) {
          ctx.beginPath();
          ctx.arc(x, y, 9, 0, Math.PI * 2);
          ctx.fillStyle = "#0a2a12";
          ctx.fill();
          ctx.strokeStyle = "#00ff41";
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.fillStyle = "#c9ffd6";
          ctx.font = "11px monospace";
          ctx.fillText(label(node.char), x, y + 4);
        } else {
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fillStyle = "#00ff41";
          ctx.fill();
        }
      }
      ctx.textAlign = "start";
    };

    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [stats]);

  const savings = stats.originalBits === 0 ? 0 : (1 - stats.ratio) * 100;

  return (
    <div className="min-h-screen bg-background text-primary font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-primary/50 hover:text-primary text-sm transition-colors">
            ← home
          </Link>
          <span className="text-primary/20">|</span>
          <span className="text-sm">huffman coding</span>
        </div>
        <div className="text-xs text-primary/40 tabular-nums">
          {stats.encodedBits}b vs {stats.originalBits}b · {savings.toFixed(0)}% smaller ·{" "}
          {stats.avgBitsPerChar.toFixed(2)} bits/char
        </div>
      </div>

      {/* Input */}
      <div className="border-b border-primary/10 px-4 py-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          spellCheck={false}
          placeholder="type or paste text to compress…"
          className="w-full bg-black/40 border border-primary/20 focus:border-primary/60 outline-none text-primary/90 text-sm p-2 resize-none font-mono"
        />
      </div>

      {/* Body: code table + tree */}
      <div className="flex-1 flex min-h-0">
        <div className="w-52 border-r border-primary/10 overflow-y-auto shrink-0">
          <table className="w-full text-xs tabular-nums">
            <thead className="text-primary/40 sticky top-0 bg-background">
              <tr>
                <th className="text-left px-3 py-1 font-normal">ch</th>
                <th className="text-right px-1 py-1 font-normal">freq</th>
                <th className="text-right px-3 py-1 font-normal">code</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.ch} className="border-t border-primary/5">
                  <td className="px-3 py-0.5 text-primary/80">{label(r.ch)}</td>
                  <td className="px-1 py-0.5 text-right text-primary/50">{r.freq}</td>
                  <td className="px-3 py-0.5 text-right text-primary/90">{r.code}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
          <canvas ref={canvasRef} className="block w-full h-full" />
          <div className="absolute bottom-3 left-4 text-xs text-primary/40 pointer-events-none max-w-md">
            merge the two rarest symbols, repeat: common letters end up near the root with short codes,
            rare ones sink deep. left edge = 0, right = 1, and no code is a prefix of another.
          </div>
        </div>
      </div>
    </div>
  );
}
