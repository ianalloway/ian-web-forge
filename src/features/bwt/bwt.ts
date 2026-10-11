// The Burrows-Wheeler transform: sorting a string into something compressible.
//
// BWT compresses nothing by itself. It is a permutation — same characters, same
// count, different order — and it is perfectly reversible. What it does is move
// the characters into runs.
//
// Take every rotation of the text, sort them, and read off the last column.
// Sorting the rotations groups together every position whose FOLLOWING text
// looks alike, and the last column holds the character that came just before
// each of those contexts. In English, the contexts beginning "he " are preceded
// overwhelmingly by t, so the last column collects a run of t's. Repetition
// that was scattered through the text arrives sorted into blocks.
//
// Then run-length and entropy coding have something to bite on. That is bzip2:
// BWT, then move-to-front, then Huffman. The surprising part is the inverse —
// the last column alone is enough to rebuild the original, because the first
// column is just the last column sorted, and that pairing names every
// character's successor.

export const SENTINEL = "\u0003"; // sorts before any printable character

export interface Rotation {
  text: string;
  index: number; // where this rotation started in the original
}

// All rotations, sorted. This is the conceptual definition; it is O(n² log n)
// and only ever used on the short strings the page displays.
export function rotations(text: string): Rotation[] {
  const withSentinel = text + SENTINEL;
  const out: Rotation[] = [];
  for (let i = 0; i < withSentinel.length; i++) {
    out.push({ text: withSentinel.slice(i) + withSentinel.slice(0, i), index: i });
  }
  return out;
}

export function sortedRotations(text: string): Rotation[] {
  return rotations(text).sort((a, b) => (a.text < b.text ? -1 : a.text > b.text ? 1 : 0));
}

export function transform(text: string): string {
  if (text.length === 0) return SENTINEL;
  return sortedRotations(text)
    .map((r) => r.text[r.text.length - 1])
    .join("");
}

// The inverse, without reconstructing the matrix. The first column is the last
// column sorted; walking the pairing between them in rank order replays the
// original text backwards from the sentinel.
export function inverse(last: string): string {
  const n = last.length;
  if (n === 0) return "";

  // How many of this character appear before position i — its rank.
  const counts = new Map<string, number>();
  const ranks = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    const ch = last[i];
    const seen = counts.get(ch) ?? 0;
    ranks[i] = seen;
    counts.set(ch, seen + 1);
  }

  // Where each character's block starts in the sorted first column.
  const chars = [...counts.keys()].sort();
  const starts = new Map<string, number>();
  let total = 0;
  for (const ch of chars) {
    starts.set(ch, total);
    total += counts.get(ch)!;
  }

  // LF-mapping: from row i, the next row is where last[i] sits in column one.
  // Starting from the row whose last character is the sentinel — the row that
  // holds the original string — each step walks one character backwards. It
  // takes n steps, not n-1: the sentinel itself is the first character emitted
  // and ends up at the tail after the reverse, where it is dropped.
  let row = last.indexOf(SENTINEL);
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const ch = last[row];
    out.push(ch);
    row = starts.get(ch)! + ranks[row];
  }
  out.reverse();
  return out.join("").replace(SENTINEL, "");
}

// ── What it buys: runs ──────────────────────────────────────────────────────

// Maximal runs of a repeated character. Fewer runs over the same length means
// longer runs, which is exactly what the next stage wants.
export function runCount(text: string): number {
  if (text.length === 0) return 0;
  let runs = 1;
  for (let i = 1; i < text.length; i++) if (text[i] !== text[i - 1]) runs++;
  return runs;
}

export function longestRun(text: string): number {
  if (text.length === 0) return 0;
  let best = 1;
  let current = 1;
  for (let i = 1; i < text.length; i++) {
    current = text[i] === text[i - 1] ? current + 1 : 1;
    if (current > best) best = current;
  }
  return best;
}

// ── Move-to-front: turning runs into zeros ─────────────────────────────────
//
// Keep an alphabet in a list. Emit each character's current position, then move
// it to the front. A run of the same character emits one position and then a
// string of zeros, so BWT's blocks become long stretches of zero — which is
// what the entropy coder actually profits from.

export function moveToFront(text: string, alphabet?: string[]): number[] {
  const table = alphabet ? alphabet.slice() : [...new Set(text)].sort();
  const out: number[] = [];
  for (const ch of text) {
    const index = table.indexOf(ch);
    out.push(index);
    table.splice(index, 1);
    table.unshift(ch);
  }
  return out;
}

export function inverseMoveToFront(codes: number[], alphabet: string[]): string {
  const table = alphabet.slice();
  let out = "";
  for (const code of codes) {
    const ch = table[code];
    out += ch;
    table.splice(code, 1);
    table.unshift(ch);
  }
  return out;
}

export function alphabetOf(text: string): string[] {
  return [...new Set(text)].sort();
}

export function zeroFraction(codes: number[]): number {
  if (codes.length === 0) return 0;
  return codes.filter((c) => c === 0).length / codes.length;
}

export function meanCode(codes: number[]): number {
  if (codes.length === 0) return 0;
  return codes.reduce((a, b) => a + b, 0) / codes.length;
}

// ── Samples ────────────────────────────────────────────────────────────────

export interface Sample {
  id: string;
  label: string;
  note: string;
  text: string;
}

export const SAMPLES: Sample[] = [
  {
    id: "banana",
    label: "banana",
    note: "the textbook example — six characters, and the a's and n's land together",
    text: "banana",
  },
  {
    id: "english",
    label: "english",
    note: "repeated words put their preceding letters into the same block",
    text: "the cat sat on the mat the cat ate the rat",
  },
  {
    id: "repeat",
    label: "repetition",
    note: "a phrase three times over — the transform collects each context's predecessor",
    text: "abracadabra abracadabra abracadabra",
  },
  {
    id: "dna",
    label: "dna",
    note: "four symbols with repeated motifs, which is where real BWT indexes are used",
    text: "ACGTACGTTTGACCATGGACGTACGTTTGACCATGG",
  },
  {
    id: "random",
    label: "no structure",
    note: "nothing repeats, so there is nothing to gather — BWT cannot invent structure",
    text: "qpzmwoxkneibrvtycfugjhdlsa",
  },
];
