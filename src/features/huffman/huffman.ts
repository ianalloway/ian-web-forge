// Huffman coding: build the optimal prefix-free binary code for a string by
// repeatedly merging the two lowest-frequency symbols, then read codes off the
// resulting tree.

export interface HNode {
  char: string | null; // leaf symbol, or null for an internal node
  freq: number;
  left: HNode | null;
  right: HNode | null;
}

/** Character frequencies, preserving first-appearance order for stable ties. */
export function frequencies(text: string): Map<string, number> {
  const f = new Map<string, number>();
  for (const ch of text) f.set(ch, (f.get(ch) ?? 0) + 1);
  return f;
}

/**
 * Build the Huffman tree. Returns null for empty input. Ties are broken by
 * insertion order so the tree is deterministic for a given frequency map.
 */
export function buildTree(freqs: Map<string, number>): HNode | null {
  const nodes: HNode[] = [];
  for (const [char, freq] of freqs) nodes.push({ char, freq, left: null, right: null });
  if (nodes.length === 0) return null;
  if (nodes.length === 1) {
    // Single distinct symbol: wrap it so it still gets a 1-bit code.
    return { char: null, freq: nodes[0].freq, left: nodes[0], right: null };
  }
  // Simple O(n²) selection is plenty for text alphabets.
  const pool = nodes.slice();
  while (pool.length > 1) {
    let i0 = 0;
    let i1 = 1;
    if (pool[i1].freq < pool[i0].freq) [i0, i1] = [i1, i0];
    for (let k = 2; k < pool.length; k++) {
      if (pool[k].freq < pool[i0].freq) {
        i1 = i0;
        i0 = k;
      } else if (pool[k].freq < pool[i1].freq) {
        i1 = k;
      }
    }
    const a = pool[i0];
    const b = pool[i1];
    const merged: HNode = { char: null, freq: a.freq + b.freq, left: a, right: b };
    // Remove the two picked (higher index first) and append the merge.
    const hi = Math.max(i0, i1);
    const lo = Math.min(i0, i1);
    pool.splice(hi, 1);
    pool.splice(lo, 1);
    pool.push(merged);
  }
  return pool[0];
}

/** Map each symbol to its 0/1 code string. */
export function buildCodes(tree: HNode | null): Map<string, string> {
  const codes = new Map<string, string>();
  if (!tree) return codes;
  const walk = (node: HNode, prefix: string) => {
    if (node.char !== null) {
      codes.set(node.char, prefix === "" ? "0" : prefix);
      return;
    }
    if (node.left) walk(node.left, prefix + "0");
    if (node.right) walk(node.right, prefix + "1");
  };
  walk(tree, "");
  return codes;
}

export function encode(text: string, codes: Map<string, string>): string {
  let bits = "";
  for (const ch of text) bits += codes.get(ch) ?? "";
  return bits;
}

export function decode(bits: string, tree: HNode | null): string {
  if (!tree) return "";
  // A single-leaf tree (one distinct symbol) has codes all "0".
  if (tree.char !== null) return tree.char.repeat(bits.length);
  let out = "";
  let node = tree;
  for (const b of bits) {
    const nextNode = b === "0" ? node.left : node.right;
    if (!nextNode) break;
    node = nextNode;
    if (node.char !== null) {
      out += node.char;
      node = tree;
    }
  }
  return out;
}

export interface HuffmanStats {
  tree: HNode | null;
  codes: Map<string, string>;
  freqs: Map<string, number>;
  originalBits: number; // at a fixed 8 bits/char
  encodedBits: number;
  ratio: number; // encoded / original, in (0, 1]
  avgBitsPerChar: number;
}

export function analyze(text: string): HuffmanStats {
  const freqs = frequencies(text);
  const tree = buildTree(freqs);
  const codes = buildCodes(tree);
  let encodedBits = 0;
  for (const [ch, f] of freqs) encodedBits += f * (codes.get(ch)?.length ?? 0);
  const chars = [...text].length;
  const originalBits = chars * 8;
  return {
    tree,
    codes,
    freqs,
    originalBits,
    encodedBits,
    ratio: originalBits === 0 ? 1 : encodedBits / originalBits,
    avgBitsPerChar: chars === 0 ? 0 : encodedBits / chars,
  };
}
