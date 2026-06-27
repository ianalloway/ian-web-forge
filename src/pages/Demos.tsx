import { useMemo, useState } from 'react';
import { Terminal, ExternalLink, Github, Calculator, LineChart, Cpu, Trophy, Coins, Gamepad2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import MatrixRain from '@/components/MatrixRain';
import { kelly, convertOdds, arbitrage } from '@/lib/kelly';

/** Live product demos for the flagship repos.
 *  kelly-js math runs IN THIS PAGE (vendored helper, no install-time GitHub dependency).
 *  nba-ratings + sports-betting-ml are live Streamlit apps (real backends).
 *  ai-advantage is the production site. */

const STREAMLIT_ML = 'https://ian-sports-betting-ml.streamlit.app';
const STREAMLIT_EDGE = 'https://nba-edge-demo.streamlit.app';

function SectionShell({
  id,
  icon: Icon,
  title,
  repo,
  blurb,
  children,
}: {
  id: string;
  icon: typeof Calculator;
  title: string;
  repo: string;
  blurb: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-14 scroll-mt-24">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={18} className="text-primary" />
        <h2 className="text-xl md:text-2xl font-bold font-mono text-primary matrix-text">{title}</h2>
      </div>
      <p className="text-muted-foreground text-sm mb-1">{blurb}</p>
      <a
        href={`https://github.com/${repo}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs font-mono text-primary/70 hover:text-primary mb-4"
      >
        <Github size={12} /> {repo}
      </a>
      <div className="rounded-md border border-primary/30 bg-card/60 p-4 md:p-6 backdrop-blur-sm">{children}</div>
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: 'good' | 'bad' }) {
  const color =
    accent === 'good' ? 'text-green-400' : accent === 'bad' ? 'text-red-400' : 'text-primary';
  return (
    <div className="rounded border border-primary/20 bg-background/60 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">{label}</div>
      <div className={`text-lg font-bold font-mono ${color}`}>{value}</div>
    </div>
  );
}

function KellyCalculator() {
  const [winProb, setWinProb] = useState(58);
  const [odds, setOdds] = useState(-110);
  const [bankroll, setBankroll] = useState(1000);

  const result = useMemo(() => kelly(winProb / 100, odds), [winProb, odds]);
  const conv = useMemo(() => convertOdds(odds), [odds]);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-5">
        <label className="block">
          <span className="text-xs font-mono text-primary/80">
            Your model&apos;s win probability: <b>{winProb}%</b>
          </span>
          <input
            type="range"
            min={35}
            max={80}
            value={winProb}
            onChange={(e) => setWinProb(Number(e.target.value))}
            className="w-full accent-green-500"
          />
        </label>
        <label className="block">
          <span className="text-xs font-mono text-primary/80">American odds offered</span>
          <input
            type="number"
            step={5}
            value={odds}
            onChange={(e) => setOdds(Number(e.target.value) || -110)}
            className="mt-1 w-full rounded border border-primary/30 bg-background/80 px-3 py-2 font-mono text-sm text-primary"
          />
          <span className="text-[11px] text-muted-foreground font-mono">
            = {conv.decimal.toFixed(2)} decimal · market implies {(conv.impliedProbability * 100).toFixed(1)}%
          </span>
        </label>
        <label className="block">
          <span className="text-xs font-mono text-primary/80">Bankroll ($)</span>
          <input
            type="number"
            step={100}
            min={0}
            value={bankroll}
            onChange={(e) => setBankroll(Math.max(0, Number(e.target.value) || 0))}
            className="mt-1 w-full rounded border border-primary/30 bg-background/80 px-3 py-2 font-mono text-sm text-primary"
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3 content-start">
        <Stat
          label="Edge"
          value={`${result.edge >= 0 ? '+' : ''}${(result.edge * 100).toFixed(1)} pts`}
          accent={result.hasEdge ? 'good' : 'bad'}
        />
        <Stat label="EV per $100" value={`$${(result.ev * 100).toFixed(2)}`} accent={result.ev >= 0 ? 'good' : 'bad'} />
        <Stat label="Full Kelly" value={`${(result.fraction * 100).toFixed(1)}%`} />
        <Stat label="Half Kelly" value={`${(result.halfKelly * 100).toFixed(1)}%`} />
        <div className="col-span-2 rounded border border-primary/20 bg-background/60 px-3 py-2">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
            Recommended stake (half-Kelly)
          </div>
          <div className="text-2xl font-bold font-mono text-primary">
            ${result.halfDollars(bankroll).toFixed(2)}
          </div>
          {!result.hasEdge && (
            <div className="text-xs font-mono text-red-400 mt-1">
              No edge at this price — Kelly says bet $0.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ArbChecker() {
  const [oddsA, setOddsA] = useState(110);
  const [oddsB, setOddsB] = useState(-105);
  const arb = useMemo(() => arbitrage(oddsA, oddsB, 100), [oddsA, oddsB]);

  return (
    <div className="mt-6 pt-5 border-t border-primary/20">
      <div className="text-xs font-mono text-primary/80 mb-3">
        Bonus: two-book arbitrage checker (same market, best price each side)
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
        <label className="block">
          <span className="text-[11px] font-mono text-muted-foreground">Book 1 — side A</span>
          <input
            type="number"
            step={5}
            value={oddsA}
            onChange={(e) => setOddsA(Number(e.target.value) || 100)}
            className="mt-1 w-full rounded border border-primary/30 bg-background/80 px-3 py-2 font-mono text-sm text-primary"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-mono text-muted-foreground">Book 2 — side B</span>
          <input
            type="number"
            step={5}
            value={oddsB}
            onChange={(e) => setOddsB(Number(e.target.value) || -100)}
            className="mt-1 w-full rounded border border-primary/30 bg-background/80 px-3 py-2 font-mono text-sm text-primary"
          />
        </label>
        <Stat
          label="Overround"
          value={`${(arb.overround * 100).toFixed(1)}%`}
          accent={arb.hasArb ? 'good' : undefined}
        />
        <Stat
          label={arb.hasArb ? 'Guaranteed profit / $100' : 'Arb?'}
          value={arb.hasArb ? `$${arb.profitPct.toFixed(2)}` : 'none'}
          accent={arb.hasArb ? 'good' : 'bad'}
        />
      </div>
      {arb.hasArb && (
        <div className="text-xs font-mono text-green-400 mt-2">
          Stake ${arb.stakeA.toFixed(2)} on A and ${arb.stakeB.toFixed(2)} on B per $100 total.
        </div>
      )}
    </div>
  );
}

function StreamlitEmbed({ src, title }: { src: string; title: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div>
      {!loaded ? (
        <button
          onClick={() => setLoaded(true)}
          className="w-full rounded border border-dashed border-primary/40 bg-background/40 py-10 text-center font-mono text-sm text-primary hover:bg-primary/10"
        >
          ▶ Load live app ({title})
          <div className="text-[11px] text-muted-foreground mt-1">
            Runs on Streamlit Community Cloud — free tier may take ~30s to wake up.
          </div>
        </button>
      ) : (
        <iframe
          src={`${src}/?embed=true`}
          title={title}
          className="w-full rounded border border-primary/30 bg-white"
          style={{ height: 640 }}
          loading="lazy"
        />
      )}
      <div className="mt-2 text-right">
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-mono text-primary/70 hover:text-primary"
        >
          Open full app <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}

const Demos = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <MatrixRain />

      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-primary/30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <a href="/" className="text-primary font-bold text-sm font-mono matrix-text flex items-center gap-2">
            <Terminal size={16} />
            IAN.SYS
          </a>
          <div className="flex flex-wrap gap-2 text-xs font-mono justify-end">
            <a href="#kelly" className="text-primary/80 hover:text-primary px-2 py-0.5 terminal-border rounded">
              kelly-js
            </a>
            <a href="#solvent" className="text-primary/80 hover:text-primary px-2 py-0.5 terminal-border rounded">
              solvent
            </a>
            <a href="#nba-edge" className="text-primary/80 hover:text-primary px-2 py-0.5 terminal-border rounded">
              nba-edge
            </a>
            <a href="#ml" className="text-primary/80 hover:text-primary px-2 py-0.5 terminal-border rounded">
              ML
            </a>
            <a href="#product" className="text-primary/80 hover:text-primary px-2 py-0.5 terminal-border rounded">
              Product
            </a>
            <a href="#playground" className="text-primary/80 hover:text-primary px-2 py-0.5 terminal-border rounded">
              Play
            </a>
            <a href="/bots" className="text-primary/80 hover:text-primary px-2 py-0.5 terminal-border rounded">
              [BOTS]
            </a>
            <a href="/toolkit" className="text-primary/80 hover:text-primary px-2 py-0.5 terminal-border rounded">
              [TOOLKIT]
            </a>
            <a href="/" className="text-primary/80 hover:text-primary px-2 py-0.5 terminal-border rounded">
              [HOME]
            </a>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-4 pt-24 pb-20">
        <header className="mb-12 text-center">
          <p className="text-primary text-xs font-mono mb-2 terminal-border inline-block px-2 py-1">
            LIVE_DEMOS
          </p>
          <h1 className="text-3xl md:text-4xl font-bold matrix-text font-mono text-primary mb-3">
            Working product demos
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
            Every demo on this page runs the actual code from the repo it links to — the npm package
            executes in your browser, the Python apps run on live backends.
          </p>
        </header>

        <SectionShell
          id="kelly"
          icon={Calculator}
          title="kelly-js — bet sizing engine"
          repo="ianalloway/kelly-js"
          blurb="TypeScript Kelly criterion library. This calculator imports the real package and runs it in your browser."
        >
          <KellyCalculator />
          <ArbChecker />
        </SectionShell>

        <SectionShell
          id="solvent"
          icon={Coins}
          title="solvent-agent — self-funding business agent"
          repo="ianalloway/solvent-agent"
          blurb="Hermes Hackathon project (NVIDIA × Stripe × Nous): earns via Stripe Payment Links, verifies Checkout Sessions before fulfilment, fulfils on Nemotron, pays vendors through Issuing guardrails, and books P&L to SQLite."
        >
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat label="Margin" value="94%" accent="good" />
              <Stat label="Revenue / run" value="$223" accent="good" />
              <Stat label="Jobs declined" value="1" accent="bad" />
              <Stat label="Treasury" value="$310" />
            </div>

            <ul className="grid md:grid-cols-2 gap-2 text-xs font-mono text-muted-foreground">
              <li className="rounded border border-primary/15 bg-background/40 px-3 py-2">
                <span className="text-primary">Onboarding</span> — first-run wizard picks model + interaction mode
              </li>
              <li className="rounded border border-primary/15 bg-background/40 px-3 py-2">
                <span className="text-primary">Payment verify</span> — polls Checkout Session until paid before compute
              </li>
              <li className="rounded border border-primary/15 bg-background/40 px-3 py-2">
                <span className="text-primary">Audit trail</span> — records PaymentIntent + Session IDs, not just plink_
              </li>
              <li className="rounded border border-primary/15 bg-background/40 px-3 py-2">
                <span className="text-primary">Issuing spend</span> — capped virtual cards per vendor (test mode)
              </li>
              <li className="rounded border border-primary/15 bg-background/40 px-3 py-2 md:col-span-2">
                <span className="text-primary">Live dashboard</span> — chat panel (type or mic via Web Speech API) + SSE treasury updates at{' '}
                <code className="text-primary/90">http://127.0.0.1:8787/</code>
              </li>
            </ul>

            <div className="rounded border border-primary/25 bg-background/50 p-4 space-y-2">
              <p className="text-xs font-mono text-primary font-bold uppercase tracking-wider">
                Try the interactive dashboard locally
              </p>
              <pre className="overflow-x-auto text-[11px] font-mono text-primary/90 leading-relaxed">
{`pip install -r requirements.txt -r requirements-serve.txt
python3 -m solvent serve --port 8787
python3 -m solvent worker   # optional second terminal
open http://127.0.0.1:8787/`}
              </pre>
              <p className="text-[11px] font-mono text-muted-foreground">
                Chat routes through the Nemotron agent loop; treasury and job cards refresh live via Server-Sent Events.
              </p>
            </div>

            <div className="relative rounded border border-primary/20 bg-background/40 overflow-hidden">
              <video
                src="/demos/solvent/solvent_demo.mp4"
                controls
                autoPlay
                muted
                loop
                className="w-full rounded"
                style={{ maxHeight: '420px' }}
              />
            </div>

            <a
              href="/demos/solvent/solvent_dashboard_actual.png"
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded border border-primary/20 overflow-hidden hover:border-primary/40 transition-colors"
            >
              <img
                src="/demos/solvent/solvent_dashboard_actual.png"
                alt="SOLVENT treasury dashboard — revenue, spend, job cards, transaction log"
                className="w-full"
                loading="lazy"
              />
            </a>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-1">
              <code className="text-[11px] font-mono text-primary/80 bg-background/60 border border-primary/20 rounded px-3 py-2">
                git clone github.com/ianalloway/solvent-agent && python3 run_demo.py
              </code>
              <div className="flex flex-wrap gap-2 shrink-0">
                <a
                  href="https://github.com/ianalloway/solvent-agent"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded border border-primary/40 bg-background/50 px-3 py-1.5 font-mono text-xs text-primary hover:bg-primary/10"
                >
                  <Github size={12} /> Repository
                </a>
                <a
                  href="/demos/solvent/solvent_dashboard_actual.png"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded border border-primary/40 bg-background/50 px-3 py-1.5 font-mono text-xs text-primary hover:bg-primary/10"
                >
                  Full screenshot <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        </SectionShell>

        <SectionShell
          id="nba-edge"
          icon={LineChart}
          title="nba-edge — Elo ratings & win probability"
          repo="ianalloway/nba-ratings"
          blurb="Python package for power ratings, win probability, and Kelly sizing. Live Streamlit app imports the package directly."
        >
          <StreamlitEmbed src={STREAMLIT_EDGE} title="nba-edge demo" />
        </SectionShell>

        <SectionShell
          id="ml"
          icon={Cpu}
          title="sports-betting-ml — model pipeline"
          repo="ianalloway/sports-betting-ml"
          blurb="XGBoost game predictions with leak-free walk-forward evaluation, edge detection and Kelly stakes. Live app, demo odds data."
        >
          <StreamlitEmbed src={STREAMLIT_ML} title="sports-betting-ml app" />
        </SectionShell>

        <SectionShell
          id="product"
          icon={Trophy}
          title="AI Advantage — production app"
          repo="ianalloway/ai-advantage"
          blurb="The full product: ML predictions, live odds, value-bet detection and Kelly sizing, deployed and running."
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground font-mono">
              aiadvantagesports.com is the real deployed platform built on the three libraries above.
            </p>
            <a
              href="https://aiadvantagesports.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded border border-primary/50 bg-primary/10 px-4 py-2 font-mono text-sm text-primary hover:bg-primary/20 whitespace-nowrap"
            >
              Open live site <ExternalLink size={14} />
            </a>
          </div>
        </SectionShell>

        <section id="playground" className="mb-14 scroll-mt-24">
          <div className="flex items-center gap-2 mb-1">
            <Gamepad2 size={18} className="text-primary" />
            <h2 className="text-xl md:text-2xl font-bold font-mono text-primary matrix-text">
              Playground — browser toys
            </h2>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            Self-contained interactive bits that run entirely client-side. No backend, just code in
            your browser.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link
              to="/terminal"
              className="rounded-md border border-primary/30 bg-card/60 p-4 backdrop-blur-sm hover:border-primary/60 transition-colors"
            >
              <div className="font-mono text-primary font-bold mb-1">Terminal</div>
              <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                An interactive shell for the site — type <span className="text-primary">whoami</span>,{' '}
                <span className="text-primary">ls</span>, <span className="text-primary">projects</span>, or{' '}
                <span className="text-primary">open /life</span>. Tab-completion and command history included.
              </p>
              <span className="inline-flex items-center gap-1 mt-3 text-xs font-mono text-primary/80">
                Open /terminal <ExternalLink size={12} />
              </span>
            </Link>
            <Link
              to="/life"
              className="rounded-md border border-primary/30 bg-card/60 p-4 backdrop-blur-sm hover:border-primary/60 transition-colors"
            >
              <div className="font-mono text-primary font-bold mb-1">Game of Life</div>
              <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                Conway&apos;s cellular automaton — draw cells, drop in gliders and a glider gun, and
                watch the B3/S23 rules play out on a wrap-around grid.
              </p>
              <span className="inline-flex items-center gap-1 mt-3 text-xs font-mono text-primary/80">
                Open /life <ExternalLink size={12} />
              </span>
            </Link>
            <Link
              to="/snake"
              className="rounded-md border border-primary/30 bg-card/60 p-4 backdrop-blur-sm hover:border-primary/60 transition-colors"
            >
              <div className="font-mono text-primary font-bold mb-1">Snake</div>
              <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                The classic — grid movement, food, growth, score, and crash state. Arrow keys or
                WASD, space to pause.
              </p>
              <span className="inline-flex items-center gap-1 mt-3 text-xs font-mono text-primary/80">
                Open /snake <ExternalLink size={12} />
              </span>
            </Link>
          </div>
        </section>

        <footer className="text-center text-xs font-mono text-muted-foreground">
          <a href="/" className="text-primary/70 hover:text-primary">
            ← back to ianalloway.xyz
          </a>
        </footer>
      </main>
    </div>
  );
};

export default Demos;
