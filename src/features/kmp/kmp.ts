// Knuth-Morris-Pratt: never look at the same character twice.
//
// Naive search, on a mismatch, slides the pattern forward by one and starts
// over from the beginning — re-reading text it has already seen. On text like
// "aaaaaaaaab" searched for "aaaab" that is quadratic.
//
// KMP notices that a partial match is itself information. If the first j
// characters matched, then the text just before the mismatch IS those j
// characters, so the only shifts worth trying are the ones where a proper
// prefix of the pattern lines up with a suffix of what already matched. The
// failure function precomputes exactly that, in one pass over the pattern:
//
//   failure[j] = length of the longest proper prefix of pattern[0..j]
//                that is also a suffix of it
//
// On a mismatch the pattern jumps to failure[j-1] instead of restarting, and
// the text pointer never moves backwards. That is the whole trick, and it makes
// the search O(n + m) with no backtracking at all.

export type Algorithm = "naive" | "kmp";

// One pass, using the failure function to extend itself — the same idea the
// search uses, applied to the pattern against itself.
export function buildFailure(pattern: string): number[] {
  const failure = new Array(pattern.length).fill(0);
  let len = 0;
  for (let i = 1; i < pattern.length; i++) {
    while (len > 0 && pattern[i] !== pattern[len]) len = failure[len - 1];
    if (pattern[i] === pattern[len]) len++;
    failure[i] = len;
  }
  return failure;
}

export interface Compare {
  textIndex: number;
  patternIndex: number;
  equal: boolean;
}

export interface SearchState {
  text: string;
  pattern: string;
  algorithm: Algorithm;
  failure: number[];
  offset: number; // where the pattern currently sits against the text
  matched: number; // characters matched so far at this offset
  comparisons: number;
  matches: number[]; // start indices of full matches found
  lastCompare: Compare | null;
  lastJump: { from: number; to: number; kind: "slide" | "failure" | "match" } | null;
  done: boolean;
}

export function newSearch(text: string, pattern: string, algorithm: Algorithm): SearchState {
  return {
    text,
    pattern,
    algorithm,
    failure: buildFailure(pattern),
    offset: 0,
    matched: 0,
    comparisons: 0,
    matches: [],
    lastCompare: null,
    lastJump: null,
    done: pattern.length === 0 || pattern.length > text.length,
  };
}

// One character comparison per call, so the page can show the algorithm
// thinking rather than just its answer.
export function step(s: SearchState): boolean {
  if (s.done) return false;

  const textIndex = s.offset + s.matched;
  if (textIndex >= s.text.length) {
    s.done = true;
    return false;
  }

  const equal = s.text[textIndex] === s.pattern[s.matched];
  s.comparisons++;
  s.lastCompare = { textIndex, patternIndex: s.matched, equal };
  s.lastJump = null;

  if (equal) {
    s.matched++;
    if (s.matched === s.pattern.length) {
      s.matches.push(s.offset);
      const from = s.offset;
      if (s.algorithm === "naive") {
        s.offset += 1;
        s.matched = 0;
      } else {
        // After a full match, the failure function says how much of the
        // pattern is already lined up for the next one — overlapping matches
        // are found without re-reading anything.
        const keep = s.failure[s.pattern.length - 1];
        s.offset = s.offset + s.pattern.length - keep;
        s.matched = keep;
      }
      s.lastJump = { from, to: s.offset, kind: "match" };
      if (s.offset + s.pattern.length > s.text.length) s.done = true;
    }
    return true;
  }

  const from = s.offset;
  if (s.algorithm === "naive" || s.matched === 0) {
    // Naive always restarts one character along, and so does KMP when nothing
    // had matched yet — there is no prefix to reuse.
    s.offset += 1;
    s.matched = 0;
    s.lastJump = { from, to: s.offset, kind: "slide" };
  } else {
    const keep = s.failure[s.matched - 1];
    s.offset = s.offset + s.matched - keep;
    s.matched = keep;
    s.lastJump = { from, to: s.offset, kind: "failure" };
  }

  if (s.offset + s.pattern.length > s.text.length) s.done = true;
  return true;
}

export interface Result {
  matches: number[];
  comparisons: number;
}

export function runToEnd(text: string, pattern: string, algorithm: Algorithm): Result {
  const s = newSearch(text, pattern, algorithm);
  let guard = 0;
  while (!s.done) {
    step(s);
    if (++guard > 50_000_000) throw new Error("search did not terminate");
  }
  return { matches: s.matches, comparisons: s.comparisons };
}

// ── Sample haystacks ────────────────────────────────────────────────────────

export interface Sample {
  id: string;
  label: string;
  note: string;
  text: string;
  pattern: string;
}

export const SAMPLES: Sample[] = [
  {
    id: "prose",
    label: "prose",
    note: "ordinary text — both algorithms do about the same work here",
    text: "the rain in spain falls mainly on the plain, and the plain is in spain",
    pattern: "plain",
  },
  {
    id: "adversarial",
    label: "worst case",
    note: "the case naive search was built to fail: long runs that almost match",
    text: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab",
    pattern: "aaaaaaaab",
  },
  {
    id: "overlap",
    label: "overlapping",
    note: "matches that share characters — the failure function finds them without rereading",
    text: "abababababababababababababababab",
    pattern: "ababab",
  },
  {
    id: "dna",
    label: "dna",
    note: "a four-letter alphabet, so partial matches happen constantly",
    text: "ACGTACGTTTGACCATGGACGTACGTTTGACCATGGTTACGGCATTACGGCATACGTACGTTTGACC",
    pattern: "ACGTTTGACC",
  },
  {
    id: "period",
    label: "periodic",
    note: "a pattern that is its own prefix repeated — the failure function is at its most useful",
    text: "abcabcabcabcabdabcabcabcabcabcabcabd",
    pattern: "abcabcabd",
  },
];
