export interface Chain {
  order: number;
  transitions: Map<string, string[]>; // state -> possible next words (with multiplicity)
  starters: string[]; // states that begin sentences
  wordCount: number;
  stateCount: number;
}

const SEP = "\u0001"; // joins words into state keys; never appears in text

function tokenize(corpus: string): string[] {
  return corpus
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter((w) => w.length > 0);
}

export function buildChain(corpus: string, order: number): Chain | null {
  const words = tokenize(corpus);
  if (words.length < order + 2) return null;

  const transitions = new Map<string, string[]>();
  const starters: string[] = [];

  for (let i = 0; i + order < words.length; i++) {
    const state = words.slice(i, i + order).join(SEP);
    const next = words[i + order];
    const list = transitions.get(state);
    if (list) list.push(next);
    else transitions.set(state, [next]);

    // A state starts a sentence if the previous word ended one (or it's the corpus start)
    const prev = i === 0 ? "" : words[i - 1];
    if (i === 0 || /[.!?]$/.test(prev)) starters.push(state);
  }

  return {
    order,
    transitions,
    starters: starters.length > 0 ? starters : [words.slice(0, order).join(SEP)],
    wordCount: words.length,
    stateCount: transitions.size,
  };
}

export interface GenerateOptions {
  maxWords: number;
  stopAtSentenceEnd: boolean;
}

export function generate(chain: Chain, opts: GenerateOptions): string {
  const { transitions, starters, order } = chain;
  const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  let state = pick(starters);
  const out = state.split(SEP);

  while (out.length < opts.maxWords) {
    const candidates = transitions.get(state);
    if (!candidates || candidates.length === 0) break; // dead end
    const next = pick(candidates);
    out.push(next);
    // Stop gracefully at a sentence boundary once we're past half the budget
    if (opts.stopAtSentenceEnd && /[.!?]$/.test(next) && out.length > opts.maxWords / 2) {
      break;
    }
    state = out.slice(out.length - order).join(SEP);
  }

  return out.join(" ");
}

/** How predictable the chain is: average branching factor per state. */
export function branchingFactor(chain: Chain): number {
  if (chain.stateCount === 0) return 0;
  let total = 0;
  for (const nexts of chain.transitions.values()) {
    total += new Set(nexts).size;
  }
  return total / chain.stateCount;
}

export const SAMPLE_CORPUS = `The market opens and the numbers begin to move. Every model is wrong but some models are useful. The data does not care about your feelings and the data does not care about your priors. A good bet is not a bet that wins. A good bet is a bet with positive expected value. The edge is small and the variance is large. Bankroll management is the difference between a bad month and a blown account. The Kelly criterion tells you how much to bet when you know your edge. You never know your edge. You estimate your edge and you shade it down. The line moves because someone knows something or because someone is wrong with confidence. Follow the closing line. The closing line is the wisdom of the crowd with money on it. Beat the close and the profits will follow. Trust the process and audit the process. The process is only as good as the data that feeds it.`;
