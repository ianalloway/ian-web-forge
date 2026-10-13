import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FORECASTS,
  STORAGE_KEY,
  brier,
  brierTerm,
  emptyHistory,
  parseHistory,
  posterior,
  record,
  type ForecastId,
  type ForecastSpec,
  type History,
} from "./model";

export type LiveForecast = ForecastSpec & {
  /** Probability committed to at page load. */
  p: number;
  /** Prior mean, before this browser's history. */
  prior: number;
  seen: number;
  outcome: 0 | 1 | null;
  term: number | null;
};

function load(): History {
  try {
    return parseHistory(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return emptyHistory();
  }
}

function save(history: History) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // Private mode or blocked storage: the visit still scores, it just isn't remembered.
  }
}

export function useForecasts() {
  // Probabilities are fixed at load: a forecast that moved after seeing the outcome would be cheating.
  const [committed] = useState(() => {
    const history = load();
    return FORECASTS.map((spec) => {
      const counts = history.counts[spec.id];
      return { ...spec, p: posterior(spec, counts), prior: posterior(spec), seen: counts.yes + counts.no };
    });
  });
  const [outcomes, setOutcomes] = useState<Partial<Record<ForecastId, 0 | 1>>>({});
  const [history, setHistory] = useState<History>(load);
  const [latest, setLatest] = useState<ForecastId | null>(null);
  const resolved = useRef(new Set<ForecastId>());

  const resolve = useCallback(
    (id: ForecastId, outcome: 0 | 1) => {
      if (resolved.current.has(id)) return;
      const first = resolved.current.size === 0;
      resolved.current.add(id);
      const p = committed.find((forecast) => forecast.id === id)!.p;
      const next = record(load(), id, p, outcome, first);
      save(next);
      setHistory(next);
      setOutcomes((current) => ({ ...current, [id]: outcome }));
      setLatest(id);
    },
    [committed],
  );

  /** Call when the visitor does the thing a forecast is about. */
  const mark = useCallback((id: ForecastId) => resolve(id, 1), [resolve]);

  useEffect(() => {
    const timers = committed.map((forecast) =>
      window.setTimeout(() => resolve(forecast.id, forecast.onTimeout), forecast.horizon * 1000),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [committed, resolve]);

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing stored, nothing to clear.
    }
    setHistory(emptyHistory());
  }, []);

  const items: LiveForecast[] = useMemo(
    () =>
      committed.map((forecast) => {
        const outcome = outcomes[forecast.id] ?? null;
        return { ...forecast, outcome, term: outcome === null ? null : brierTerm(forecast.p, outcome) };
      }),
    [committed, outcomes],
  );

  const score = useMemo(() => brier(items.flatMap((item) => (item.term === null ? [] : [item.term]))), [items]);
  const lifetime = history.scored > 0 ? history.sumSq / history.scored : null;

  return { items, mark, score, lifetime, history, reset, latest };
}

export type Forecasts = ReturnType<typeof useForecasts>;
