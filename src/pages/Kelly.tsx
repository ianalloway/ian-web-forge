import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Terminal,
  ArrowLeft,
  Calculator,
  TrendingUp,
  Info,
  GitBranch as Github,
  DollarSign,
  Percent,
} from 'lucide-react';
import MatrixRain from '@/components/MatrixRain';
import { kelly } from '@/lib/kelly';

/**
 * Standalone Kelly Criterion calculator route at /kelly.
 *
 * Math runs through the vendored kelly-js helper at @/lib/kelly so the page
 * stays consistent with the /demos calculator (no new runtime dependency).
 *
 * The Kelly Criterion: f* = (bp - q) / b
 *   b = net decimal odds (decimal - 1)
 *   p = win probability
 *   q = 1 - p
 *
 * Inputs here use DECIMAL odds directly (the task asked for decimal odds),
 * so we convert to American odds once before handing off to the helper.
 */

const KELLY_REPO = 'https://github.com/ianalloway/kelly-js';

/** Convert decimal odds to American for the shared kelly() helper. */
function decimalToAmerican(decimal: number): number {
  if (!Number.isFinite(decimal) || decimal <= 1) {
    throw new RangeError('decimal odds must be greater than 1');
  }
  if (decimal >= 2) return Math.round((decimal - 1) * 100);
  return -Math.round(100 / (decimal - 1));
}

/** Fractional Kelly presets surfaced by the slider. */
const FRACTIONS = [
  { label: 'Quarter Kelly', value: 0.25 },
  { label: 'Half Kelly', value: 0.5 },
  { label: 'Full Kelly', value: 1 },
] as const;

const EXPLANATION = [
  {
    title: 'What it solves',
    body: 'The Kelly Criterion gives the bet size that maximizes the long-run growth rate of your bankroll for a repeatable +EV edge. Bet more and volatility drags you under; bet less and you leave growth on the table.',
  },
  {
    title: 'The formula',
    body: 'f* = (bp − q) / b, where b is the net decimal odds (odds − 1), p is your win probability, and q is 1 − p. The result f* is the fraction of your bankroll to stake.',
  },
  {
    title: 'Why half / quarter Kelly',
    body: 'Full Kelly is mathematically optimal in the limit but punishing when your edge is estimated with error. Half Kelly keeps ~75% of the growth rate for ~50% of the variance; quarter Kelly is the common defensive default for noisy models.',
  },
  {
    title: 'When it says bet nothing',
    body: 'If f* comes out ≤ 0, the bet has no edge at the offered price — Kelly says risk $0. A negative fraction is never a short; it just means pass.',
  },
];

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: 'good' | 'bad';
}) {
  const color =
    accent === 'good' ? 'text-green-400' : accent === 'bad' ? 'text-red-400' : 'text-primary';
  return (
    <div className="rounded border border-primary/20 bg-background/60 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
        {label}
      </div>
      <div className={`text-lg font-bold font-mono ${color}`}>{value}</div>
    </div>
  );
}

const Kelly = () => {
  const [winProb, setWinProb] = useState(55);
  const [decimalOdds, setDecimalOdds] = useState(1.91);
  const [bankroll, setBankroll] = useState(1000);
  const [fractionMode, setFractionMode] = useState<number>(0.5);

  // ESM import of the shared kelly-js helper (co-located in @/lib/kelly).

  const result = useMemo(() => {
    try {
      if (!Number.isFinite(decimalOdds) || decimalOdds <= 1) return null;
      if (winProb <= 0 || winProb >= 100) return null;
      const american = decimalToAmerican(decimalOdds);
      const r = kelly(winProb / 100, american);
      const fraction = Math.min(1, Math.max(0, r.fraction)) * fractionMode;
      const stake = Math.max(0, Math.round(bankroll * fraction * 100) / 100);
      const evPer100 = r.ev * 100;
      return { r, fraction, stake, evPer100 };
    } catch {
      return null;
    }
  }, [winProb, decimalOdds, bankroll, fractionMode]);

  const hasEdge = !!result && result.r.hasEdge;
  const impliedProb = useMemo(() => {
    if (!Number.isFinite(decimalOdds) || decimalOdds <= 1) return null;
    return 1 / decimalOdds;
  }, [decimalOdds]);

  return (
    <div className="min-h-screen bg-background relative">
      <MatrixRain />

      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-primary/30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <a
            href="/"
            className="text-primary font-bold text-sm font-mono matrix-text flex items-center gap-2"
          >
            <Terminal size={16} />
            IAN.SYS
          </a>
          <div className="flex flex-wrap gap-2 text-xs font-mono justify-end">
            <a href="#calc" className="text-primary/80 hover:text-primary px-2 py-0.5 terminal-border rounded">
              Calculator
            </a>
            <a href="#explain" className="text-primary/80 hover:text-primary px-2 py-0.5 terminal-border rounded">
              How it works
            </a>
            <a
              href={KELLY_REPO}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/80 hover:text-primary px-2 py-0.5 terminal-border rounded"
            >
              [kelly-js]
            </a>
            <Link to="/" className="text-primary/80 hover:text-primary px-2 py-0.5 terminal-border rounded">
              [HOME]
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-4xl mx-auto px-4 pt-24 pb-20">
        <header className="mb-10">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-primary/70 hover:text-primary mb-4"
          >
            <ArrowLeft size={14} /> back to home
          </Link>
          <p className="text-primary text-xs font-mono mb-2 terminal-border inline-block px-2 py-1">
            KELLY_CRITERION
          </p>
          <h1 className="text-3xl md:text-4xl font-bold matrix-text font-mono text-primary mb-3 flex items-center gap-3">
            <Calculator size={28} className="text-primary" />
            Optimal bet sizing
          </h1>
          <p className="text-muted-foreground font-mono text-sm max-w-2xl">
            The Kelly Criterion tells you what fraction of your bankroll to risk on a repeatable edge.
            Enter your model&apos;s win probability, the decimal odds on offer, and your bankroll — the
            calculator sizes the stake. Powered by{' '}
            <a
              href={KELLY_REPO}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              kelly-js
            </a>
            .
          </p>
        </header>

        <section id="calc" className="mb-14 scroll-mt-24">
          <div className="rounded-md border border-primary/30 bg-card/60 p-5 md:p-7 backdrop-blur-sm">
            <div className="grid md:grid-cols-2 gap-7">
              {/* Inputs */}
              <div className="space-y-5">
                <label className="block">
                  <span className="text-xs font-mono text-primary/80 flex items-center gap-1.5">
                    <Percent size={12} /> Win probability (%)
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={winProb}
                    onChange={(e) => setWinProb(Number(e.target.value) || 0)}
                    className="mt-1.5 w-full rounded border border-primary/30 bg-background/80 px-3 py-2 font-mono text-sm text-primary focus:outline-none focus:border-primary"
                  />
                  {impliedProb !== null && (
                    <span className="text-[11px] text-muted-foreground font-mono">
                      market implies {(impliedProb * 100).toFixed(1)}% · your edge{' '}
                      <span className={winProb / 100 > impliedProb ? 'text-green-400' : 'text-red-400'}>
                        {(winProb - impliedProb * 100 >= 0 ? '+' : '') +
                          (winProb - impliedProb * 100).toFixed(1)}{' '}
                        pts
                      </span>
                    </span>
                  )}
                </label>

                <label className="block">
                  <span className="text-xs font-mono text-primary/80">Decimal odds</span>
                  <input
                    type="number"
                    min={1.01}
                    step={0.01}
                    value={decimalOdds}
                    onChange={(e) => setDecimalOdds(Number(e.target.value) || 0)}
                    className="mt-1.5 w-full rounded border border-primary/30 bg-background/80 px-3 py-2 font-mono text-sm text-primary focus:outline-none focus:border-primary"
                  />
                  <span className="text-[11px] text-muted-foreground font-mono">
                    e.g. 1.91 (≈ American −110), 2.50, 3.00
                  </span>
                </label>

                <label className="block">
                  <span className="text-xs font-mono text-primary/80 flex items-center gap-1.5">
                    <DollarSign size={12} /> Current bankroll ($)
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={bankroll}
                    onChange={(e) => setBankroll(Math.max(0, Number(e.target.value) || 0))}
                    className="mt-1.5 w-full rounded border border-primary/30 bg-background/80 px-3 py-2 font-mono text-sm text-primary focus:outline-none focus:border-primary"
                  />
                </label>

                <div className="pt-1">
                  <div className="text-xs font-mono text-primary/80 mb-2">Kelly fraction</div>
                  <div className="flex flex-wrap gap-2">
                    {FRACTIONS.map((f) => {
                      const active = fractionMode === f.value;
                      return (
                        <button
                          key={f.value}
                          type="button"
                          onClick={() => setFractionMode(f.value)}
                          className={`px-3 py-1.5 rounded font-mono text-xs border transition-colors ${
                            active
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'border-primary/30 text-primary/80 hover:bg-primary/10'
                          }`}
                        >
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={fractionMode}
                    onChange={(e) => setFractionMode(Number(e.target.value))}
                    className="w-full accent-green-500 mt-3"
                    aria-label="Kelly fraction multiplier"
                  />
                  <div className="text-[11px] text-muted-foreground font-mono">
                    multiplier × full Kelly: {fractionMode.toFixed(2)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setFractionMode((m) => m)}
                  className="w-full rounded border border-primary/40 bg-primary/10 px-4 py-2.5 font-mono text-sm text-primary hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
                >
                  <Calculator size={15} /> Recalculate
                </button>
                <p className="text-[11px] text-muted-foreground font-mono -mt-2">
                  Values recompute live as you type — the button is a visual anchor.
                </p>
              </div>

              {/* Results */}
              <div className="space-y-4">
                <div className="text-xs font-mono text-primary/70 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp size={12} /> Output
                </div>

                {!result ? (
                  <div className="rounded border border-red-400/40 bg-red-400/5 px-4 py-3 text-xs font-mono text-red-400">
                    Enter valid inputs: win probability between 0 and 100, decimal odds &gt; 1.
                  </div>
                ) : (
                  <>
                    <div className="rounded border border-primary/30 bg-background/60 px-4 py-4">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-1">
                        Recommended stake · {FRACTIONS.find((f) => f.value === fractionMode)?.label ?? `${fractionMode.toFixed(2)}×`}
                      </div>
                      <div className="text-3xl font-bold font-mono text-primary">
                        ${result.stake.toFixed(2)}
                      </div>
                      <div className="text-xs font-mono text-muted-foreground mt-1">
                        {result.fraction > 0
                          ? `${(result.fraction * 100).toFixed(2)}% of bankroll`
                          : hasEdge
                            ? 'fraction rounds to $0 at this bankroll'
                            : 'no edge — Kelly says bet $0'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Stat
                        label="Full Kelly %"
                        value={`${(result.r.fraction * 100).toFixed(2)}%`}
                        accent={hasEdge ? 'good' : 'bad'}
                      />
                      <Stat
                        label="Full Kelly $"
                        value={`$${result.r.dollars(bankroll).toFixed(2)}`}
                      />
                      <Stat
                        label="Half Kelly $"
                        value={`$${(result.r.dollars(bankroll) / 2).toFixed(2)}`}
                      />
                      <Stat
                        label="Quarter Kelly $"
                        value={`$${(result.r.dollars(bankroll) / 4).toFixed(2)}`}
                      />
                      <Stat
                        label="EV per $100"
                        value={`$${result.evPer100.toFixed(2)}`}
                        accent={result.evPer100 >= 0 ? 'good' : 'bad'}
                      />
                      <Stat
                        label="Edge"
                        value={`${result.r.edge >= 0 ? '+' : ''}${(result.r.edge * 100).toFixed(1)} pts`}
                        accent={hasEdge ? 'good' : 'bad'}
                      />
                    </div>

                    {!hasEdge && (
                      <div className="rounded border border-red-400/40 bg-red-400/5 px-4 py-3 text-xs font-mono text-red-400">
                        No edge at this price. The offered odds imply a higher win probability than your
                        model — Kelly recommends passing.
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        <section id="explain" className="mb-14 scroll-mt-24">
          <h2 className="text-xl font-bold matrix-text font-mono text-primary mb-4 flex items-center gap-2">
            <Info size={18} /> How it works
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {EXPLANATION.map((item) => (
              <div
                key={item.title}
                className="rounded-md border border-primary/20 bg-card/40 backdrop-blur-sm p-5"
              >
                <h3 className="text-primary font-mono text-sm font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground font-mono text-xs leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="text-center text-xs font-mono text-muted-foreground space-y-2">
          <a
            href={KELLY_REPO}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-primary/70 hover:text-primary"
          >
            <Github size={12} /> ianalloway/kelly-js
          </a>
          <div>
            <Link to="/" className="text-primary/70 hover:text-primary">
              ← back to home
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Kelly;
