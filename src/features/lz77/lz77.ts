// LZ77: compression by pointing backwards.
//
// Slide a window over the text. At each position, look for the longest run of
// characters ahead that already appeared inside the window, and if one is long
// enough, emit a pointer — "go back `offset`, copy `length`" — instead of the
// characters themselves. Otherwise emit the character as a literal.
//
// That is the whole algorithm, and it is half of what a .zip file is: LZ77
// removes repetition, then Huffman coding (see /huffman) shortens whatever is
// left. Together they are DEFLATE.
//
// One detail does more work than it looks: a match is allowed to run past the
// current position and copy characters that the match itself is producing. That
// is how "go back 1, copy 40" encodes a run of 41 identical bytes, and it makes
// run-length encoding a special case of LZ77 rather than a separate idea.

export const MIN_MATCH = 3; // below this a literal is cheaper than a pointer

export type Token =
  | { kind: "literal"; ch: string; at: number }
  | { kind: "match"; offset: number; length: number; at: number };

export interface Match {
  offset: number;
  length: number;
}

// The longest match for the text at `pos`, searched over the preceding
// `windowSize` characters. Ties are broken toward the smallest offset, which
// costs fewer bits to encode.
export function findMatch(
  text: string,
  pos: number,
  windowSize: number,
  maxMatch: number
): Match | null {
  const start = Math.max(0, pos - windowSize);
  let best: Match | null = null;
  for (let candidate = pos - 1; candidate >= start; candidate--) {
    let length = 0;
    // The comparison may read past `pos` — deliberately. The decoder copies one
    // character at a time and will have written those bytes by the time it
    // needs them.
    while (
      length < maxMatch &&
      pos + length < text.length &&
      text[candidate + length] === text[pos + length]
    ) {
      length++;
    }
    if (length >= MIN_MATCH && (!best || length > best.length)) {
      best = { offset: pos - candidate, length };
      if (length === maxMatch) break; // cannot do better
    }
  }
  return best;
}

export function encode(text: string, windowSize: number, maxMatch: number): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  while (pos < text.length) {
    const match = findMatch(text, pos, windowSize, maxMatch);
    if (match) {
      tokens.push({ kind: "match", offset: match.offset, length: match.length, at: pos });
      pos += match.length;
    } else {
      tokens.push({ kind: "literal", ch: text[pos], at: pos });
      pos++;
    }
  }
  return tokens;
}

export function decode(tokens: Token[]): string {
  let out = "";
  for (const token of tokens) {
    if (token.kind === "literal") {
      out += token.ch;
    } else {
      // Copied one character at a time, so an overlapping match extends itself.
      const start = out.length - token.offset;
      for (let i = 0; i < token.length; i++) out += out[start + i];
    }
  }
  return out;
}

// ── Cost ────────────────────────────────────────────────────────────────────

// A deliberately simple bit model: one flag bit, then either a byte or an
// (offset, length) pair sized to the window. Real DEFLATE entropy-codes these
// fields, so this over-states the compressed size — but it moves the right way
// for the right reasons, which is what the page is for.
export function tokenBits(token: Token, windowSize: number, maxMatch: number): number {
  if (token.kind === "literal") return 1 + 8;
  const offsetBits = Math.ceil(Math.log2(Math.max(2, windowSize)));
  const lengthBits = Math.ceil(Math.log2(Math.max(2, maxMatch - MIN_MATCH + 1)));
  return 1 + offsetBits + lengthBits;
}

export interface Summary {
  tokens: number;
  literals: number;
  matches: number;
  originalBits: number;
  encodedBits: number;
  ratio: number; // encoded / original; below 1 is a saving
  longestMatch: number;
  coveredByMatches: number; // characters emitted by pointers rather than literals
}

export function summarise(
  text: string,
  tokens: Token[],
  windowSize: number,
  maxMatch: number
): Summary {
  let encodedBits = 0;
  let literals = 0;
  let matches = 0;
  let longestMatch = 0;
  let covered = 0;
  for (const token of tokens) {
    encodedBits += tokenBits(token, windowSize, maxMatch);
    if (token.kind === "literal") {
      literals++;
    } else {
      matches++;
      covered += token.length;
      if (token.length > longestMatch) longestMatch = token.length;
    }
  }
  const originalBits = text.length * 8;
  return {
    tokens: tokens.length,
    literals,
    matches,
    originalBits,
    encodedBits,
    ratio: originalBits === 0 ? 1 : encodedBits / originalBits,
    longestMatch,
    coveredByMatches: covered,
  };
}

// ── Step-wise encoder, for watching it work ─────────────────────────────────

export interface Encoder {
  text: string;
  pos: number;
  windowSize: number;
  maxMatch: number;
  tokens: Token[];
  lastToken: Token | null;
}

export function newEncoder(text: string, windowSize: number, maxMatch: number): Encoder {
  return { text, pos: 0, windowSize, maxMatch, tokens: [], lastToken: null };
}

export function encodeStep(enc: Encoder): boolean {
  if (enc.pos >= enc.text.length) return false;
  const match = findMatch(enc.text, enc.pos, enc.windowSize, enc.maxMatch);
  const token: Token = match
    ? { kind: "match", offset: match.offset, length: match.length, at: enc.pos }
    : { kind: "literal", ch: enc.text[enc.pos], at: enc.pos };
  enc.tokens.push(token);
  enc.lastToken = token;
  enc.pos += match ? match.length : 1;
  return true;
}

export function isDone(enc: Encoder): boolean {
  return enc.pos >= enc.text.length;
}

// ── Sample texts ────────────────────────────────────────────────────────────

export interface Sample {
  id: string;
  label: string;
  note: string;
  text: string;
}

export const SAMPLES: Sample[] = [
  {
    id: "prose",
    label: "prose",
    note: "ordinary English — short, frequent matches on common words and endings",
    text:
      "the quick brown fox jumps over the lazy dog. the quick brown cat sleeps " +
      "under the lazy dog. the lazy dog never notices the fox, the cat, or the " +
      "quick brown anything at all.",
  },
  {
    id: "repeat",
    label: "repetition",
    note: "a phrase repeated — the second copy costs one pointer, whatever its length",
    text:
      "all work and no play makes jack a dull boy. " +
      "all work and no play makes jack a dull boy. " +
      "all work and no play makes jack a dull boy. " +
      "all work and no play makes jack a dull boy.",
  },
  {
    id: "run",
    label: "long run",
    note: "one character repeated: watch a single overlapping match swallow the whole run",
    text: "start" + "=".repeat(90) + "end" + "-".repeat(60) + "stop",
  },
  {
    id: "json",
    label: "json",
    note: "structured data — the keys and punctuation repeat far more than the values",
    text:
      '{"team":"home","score":2,"shots":14},{"team":"away","score":1,"shots":9},' +
      '{"team":"home","score":0,"shots":11},{"team":"away","score":3,"shots":16}',
  },
  {
    id: "dna",
    label: "dna",
    note: "a four-letter alphabet — 8 bits a character is wasteful before any matching",
    text:
      "ACGTACGTTTGACCATGGACGTACGTTTGACCATGGTTACGGCATTACGGCATACGTACGT" +
      "TTGACCATGGTTACGGCATCCGTAAGGCTACGTACGTTTGACCATGG",
  },
];
