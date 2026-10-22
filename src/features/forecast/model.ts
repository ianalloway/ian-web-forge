/**
 * The homepage makes a handful of probabilistic forecasts about the current visit and scores
 * itself with a Brier score. Each forecast is a Beta-Bernoulli model: a hand-set prior, updated by
 * what this browser's earlier visits actually did. Nothing here touches the network.
 */

export type ForecastId = "scroll" | "stay" | "project" | "poke" | "bottom" | "lab";

export type ForecastSpec = {
  id: ForecastId;
  /** The claim, phrased to the visitor. */
  claim: string;
  /** Short receipt-line wording. */
  short: string;
  /** Prior pseudo-counts: `alpha` yes, `beta` no. */
  alpha: number;
  beta: number;
  /** Seconds after which the forecast resolves on its own. */
  horizon: number;
  /** What it resolves to when the horizon passes without the event. */
  onTimeout: 0 | 1;
};

export const FORECASTS: ForecastSpec[] = [
  { id: "scroll", claim: "You’ll scroll past this screen within 20 seconds.", short: "scrolls past hero <20s", alpha: 3.1, beta: 0.9, horizon: 20, onTimeout: 0 },
  { id: "stay", claim: "You’ll still be here in 45 seconds.", short: "still here at 45s", alpha: 2.4, beta: 1.6, horizon: 45, onTimeout: 1 },
  { id: "project", claim: "You’ll point at one of the three projects within a minute.", short: "inspects a project <60s", alpha: 2, beta: 2, horizon: 60, onTimeout: 0 },
  { id: "poke", claim: "You’ll click one of these forecasts to see if it does anything.", short: "pokes a forecast <60s", alpha: 1.4, beta: 2.6, horizon: 60, onTimeout: 0 },
  { id: "bottom", claim: "You’ll reach the end of the page within two minutes.", short: "reaches the end <120s", alpha: 1, beta: 3, horizon: 120, onTimeout: 0 },
  { id: "lab", claim: "You’ll open the lab within two minutes.", short: "opens the lab <120s", alpha: 0.6, beta: 3.4, horizon: 120, onTimeout: 0 },
];

/** Brier score of always answering 50%. The bar a forecaster has to clear. */
export const COIN_FLIP = 0.25;

export type Counts = { yes: number; no: number };

export type History = {
  visits: number;
  counts: Record<ForecastId, Counts>;
  /** Sum of squared errors and number of scored forecasts, across all visits. */
  sumSq: number;
  scored: number;
};

export const STORAGE_KEY = "ia.forecasts.v1";

export function emptyHistory(): History {
  const counts = {} as Record<ForecastId, Counts>;
  for (const spec of FORECASTS) counts[spec.id] = { yes: 0, no: 0 };
  return { visits: 0, counts, sumSq: 0, scored: 0 };
}

const count = (value: unknown) => (typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0);

/** Parses stored history, falling back to a clean slate on anything malformed. */
export function parseHistory(raw: string | null | undefined): History {
  const history = emptyHistory();
  if (!raw) return history;
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object") return history;
    const stored = data as Partial<Record<keyof History, unknown>>;
    history.visits = Math.floor(count(stored.visits));
    history.sumSq = count(stored.sumSq);
    history.scored = Math.floor(count(stored.scored));
    const counts = (stored.counts && typeof stored.counts === "object" ? stored.counts : {}) as Record<string, Partial<Counts> | undefined>;
    for (const spec of FORECASTS) {
      history.counts[spec.id] = { yes: Math.floor(count(counts[spec.id]?.yes)), no: Math.floor(count(counts[spec.id]?.no)) };
    }
  } catch {
    return emptyHistory();
  }
  return history;
}

/** Posterior mean of a Beta(alpha, beta) prior after observing `counts`. */
export function posterior(spec: Pick<ForecastSpec, "alpha" | "beta">, counts: Counts = { yes: 0, no: 0 }): number {
  return (spec.alpha + counts.yes) / (spec.alpha + spec.beta + counts.yes + counts.no);
}

export const brierTerm = (p: number, outcome: 0 | 1) => (p - outcome) ** 2;

/** Mean squared error of the stated probabilities; `null` until something has resolved. */
export function brier(terms: number[]): number | null {
  if (terms.length === 0) return null;
  return terms.reduce((sum, term) => sum + term, 0) / terms.length;
}

/** Returns a new history with one resolved forecast folded in. */
export function record(history: History, id: ForecastId, p: number, outcome: 0 | 1, firstOfVisit: boolean): History {
  const previous = history.counts[id];
  return {
    visits: history.visits + (firstOfVisit ? 1 : 0),
    counts: { ...history.counts, [id]: { yes: previous.yes + outcome, no: previous.no + (1 - outcome) } },
    sumSq: history.sumSq + brierTerm(p, outcome),
    scored: history.scored + 1,
  };
}

export const percent = (p: number) => `${Math.min(99, Math.max(1, Math.round(p * 100)))}%`;
