import { useEffect, useState } from "react";
import { COIN_FLIP, percent, type ForecastId } from "@/features/forecast/model";
import type { Forecasts, LiveForecast } from "@/features/forecast/useForecasts";

const VERB: Record<0 | 1, string> = { 1: "Happened", 0: "Didn’t" };

function Row({ item, open, onToggle }: { item: LiveForecast; open: boolean; onToggle: () => void }) {
  const state = item.outcome === null ? "pending" : item.outcome === 1 ? "yes" : "no";
  return (
    <li className={`hx-forecast is-${state}`}>
      <button type="button" onClick={onToggle} aria-expanded={open}>
        <span className="hx-forecast-p rd-mono">{percent(item.p)}</span>
        <span className="hx-forecast-claim">{item.claim}</span>
        <span className="hx-forecast-state rd-mono">
          {item.outcome === null ? (
            <>
              <i className="hx-forecast-clock" style={{ animationDuration: `${item.horizon}s` }} aria-hidden="true" />
              Open
            </>
          ) : (
            <>
              {VERB[item.outcome]} · {item.term!.toFixed(3)}
            </>
          )}
        </span>
      </button>
      {open && (
        <p className="hx-forecast-math rd-mono">
          prior {percent(item.prior)} = Beta({item.alpha}, {item.beta}) ·{" "}
          {item.seen === 0 ? "no earlier visits from this browser" : `updated on ${item.seen} earlier ${item.seen === 1 ? "outcome" : "outcomes"} here`}
          {item.outcome !== null && ` · error (${item.p.toFixed(2)} − ${item.outcome})² = ${item.term!.toFixed(3)}`}
        </p>
      )}
    </li>
  );
}

/** The hero panel: the page's forecasts about this visit, resolving live. */
export default function ForecastLedger({ forecasts }: { forecasts: Forecasts }) {
  const { items, mark, score, lifetime, history, reset } = forecasts;
  const [open, setOpen] = useState<ForecastId | null>(null);
  const settled = items.filter((item) => item.outcome !== null).length;

  return (
    <aside className="hx-ledger" aria-labelledby="hx-ledger-title">
      <header>
        <p className="rd-mono" id="hx-ledger-title">
          Forecasts about this visit
        </p>
        <p className="rd-mono hx-ledger-count">
          {settled}/{items.length} resolved
        </p>
      </header>
      <p className="hx-ledger-intro">
        Before you did anything, this page committed to six predictions about you. It grades itself as you go.
      </p>
      <ol>
        {items.map((item) => (
          <Row
            key={item.id}
            item={item}
            open={open === item.id}
            onToggle={() => {
              mark("poke");
              setOpen((current) => (current === item.id ? null : item.id));
            }}
          />
        ))}
      </ol>
      <footer className="rd-mono">
        <div>
          <span>Brier, this visit</span>
          <strong className={score !== null && score < COIN_FLIP ? "is-good" : undefined}>{score === null ? "—" : score.toFixed(3)}</strong>
        </div>
        <div>
          <span>Coin flip</span>
          <strong>{COIN_FLIP.toFixed(3)}</strong>
        </div>
        <div>
          <span>This browser, all time</span>
          <strong>{lifetime === null ? "—" : lifetime.toFixed(3)}</strong>
        </div>
      </footer>
      <p className="hx-ledger-note rd-mono">
        Lower is better. Priors are hand-set and update only from your own visits, kept in this browser’s storage
        {history.scored > 0 && (
          <>
            {" "}
            (<button type="button" onClick={reset}>forget me</button>)
          </>
        )}
        . Nothing is sent anywhere.
      </p>
    </aside>
  );
}

/** A small fixed readout that follows the visitor down the page and announces each resolution. */
export function ForecastDock({ forecasts, hidden }: { forecasts: Forecasts; hidden: boolean }) {
  const { items, score, latest } = forecasts;
  // The newest resolution is announced for a few seconds, then cleared.
  const [expired, setExpired] = useState<ForecastId | null>(null);
  const flash = latest && latest !== expired ? items.find((item) => item.id === latest) ?? null : null;
  const settled = items.filter((item) => item.outcome !== null).length;

  useEffect(() => {
    if (!latest) return;
    const timer = window.setTimeout(() => setExpired(latest), 4200);
    return () => window.clearTimeout(timer);
  }, [latest]);

  return (
    <a className={`hx-dock rd-mono${hidden ? " is-hidden" : ""}`} href="#receipt" tabIndex={hidden ? -1 : 0}>
      <span className="hx-dock-line">
        Forecasts {settled}/{items.length}
        <i aria-hidden="true" />
        Brier {score === null ? "—" : score.toFixed(3)}
      </span>
      <span className="hx-dock-flash" role="status">
        {flash && flash.outcome !== null && (
          <>
            {flash.outcome === 1 ? "✓" : "✗"} {percent(flash.p)} · {flash.short}
          </>
        )}
      </span>
    </a>
  );
}
