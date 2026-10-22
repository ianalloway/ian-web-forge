import { useMemo } from "react";
import { COIN_FLIP, percent } from "@/features/forecast/model";
import type { Forecasts } from "@/features/forecast/useForecasts";

function verdict(score: number | null, open: number) {
  if (score === null) return "No forecasts resolved yet. Keep reading; the clocks are running.";
  const margin = COIN_FLIP - score;
  const tail = open > 0 ? ` ${open} still open.` : "";
  if (margin > 0.005) return `Beat a coin flip by ${margin.toFixed(3)}.${tail}`;
  if (margin < -0.005) return `Lost to a coin flip by ${(-margin).toFixed(3)}. Noted, and the priors just moved.${tail}`;
  return `Tied with a coin flip.${tail}`;
}

/** The visit, itemised: every forecast, what happened, and what it cost the model. */
export default function Receipt({ forecasts }: { forecasts: Forecasts }) {
  const { items, score, lifetime, history } = forecasts;
  const open = items.filter((item) => item.outcome === null).length;
  const issued = useMemo(() => new Date().toISOString().slice(0, 16).replace("T", " "), []);
  // A barcode whose bar widths are the stated probabilities: the receipt encodes its own forecasts.
  const bars = useMemo(
    () => items.flatMap((item) => [Math.round(item.p * 9) + 1, 2, Math.round((1 - item.p) * 5) + 1, 1]),
    [items],
  );

  return (
    <section className="hx-receipt-section" id="receipt" aria-labelledby="hx-receipt-title">
      <div className="hx-receipt-copy" data-reveal>
        <p className="rd-section-label rd-mono">05 / RECEIPT</p>
        <h2 id="hx-receipt-title">
          Models with receipts.
          <br />
          Here’s yours.
        </h2>
        <p>
          This page made six forecasts about your visit and committed to the probabilities before you moved. A
          forecast you can’t score is just an opinion, so here is the bill.
        </p>
        <p className="hx-receipt-verdict rd-mono" role="status">
          {verdict(score, open)}
        </p>
      </div>

      <div className="hx-receipt rd-mono" data-reveal>
        <div className="hx-receipt-head">
          <strong>ALLOWAY LLC</strong>
          <span>FORECAST DESK · FAIRMONT, WV</span>
          <span>
            {issued} UTC · VISIT #{String(Math.max(1, history.visits)).padStart(4, "0")}
          </span>
        </div>
        <table>
          <thead>
            <tr>
              <th scope="col">P</th>
              <th scope="col">Forecast</th>
              <th scope="col">Result</th>
              <th scope="col">Error²</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className={item.outcome === null ? "is-open" : undefined}>
                <td>{percent(item.p)}</td>
                <th scope="row">{item.short}</th>
                <td>{item.outcome === null ? "open" : item.outcome === 1 ? "yes" : "no"}</td>
                <td>{item.term === null ? "·····" : item.term.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <dl>
          <div className="hx-receipt-total">
            <dt>Brier score</dt>
            <dd>{score === null ? "—" : score.toFixed(3)}</dd>
          </div>
          <div>
            <dt>Coin flip</dt>
            <dd>{COIN_FLIP.toFixed(3)}</dd>
          </div>
          <div>
            <dt>This browser, all time (n={history.scored})</dt>
            <dd>{lifetime === null ? "—" : lifetime.toFixed(3)}</dd>
          </div>
        </dl>
        <div className="hx-barcode" aria-hidden="true">
          {bars.map((bar, i) => (
            <i key={i} style={{ width: `${bar}px`, opacity: i % 2 ? 0 : 1 }} />
          ))}
        </div>
        <p className="hx-receipt-foot">
          Open forecasts are not scored. Stored in this browser only.
          <br />
          Thank you for being data.
        </p>
      </div>
    </section>
  );
}
