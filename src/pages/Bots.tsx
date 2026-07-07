import { GitBranch as Github, ExternalLink, Terminal, Bot, Coins, Scale, Puzzle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import MatrixRain from '@/components/MatrixRain';

type BotGuide = {
  id: string;
  icon: LucideIcon;
  name: string;
  repo: string;
  tagline: string;
  whatItIs: string;
  prerequisites: string[];
  startCommand: string;
  optionalCommands?: { label: string; command: string }[];
  whatHappensNext: string[];
  hero?: boolean;
};

const BOTS: BotGuide[] = [
  {
    id: 'solvent',
    icon: Coins,
    name: 'SOLVENT',
    repo: 'ianalloway/solvent-agent',
    tagline: 'Self-funding business agent',
    whatItIs:
      'An AI analyst that quotes jobs, collects Stripe payment, fulfils work on Nemotron, pays its own vendor bills under guardrails, and books P&L — declining work that does not clear margin.',
    prerequisites: [
      'Python 3.10+ (stdlib only for the demo — no pip install required)',
      'No API keys needed for the offline demo',
      'Optional: NVIDIA_API_KEY + STRIPE_API_KEY=sk_test_... for live test-mode inference',
    ],
    startCommand: `git clone https://github.com/ianalloway/solvent-agent.git
cd solvent-agent
python3 run_demo.py`,
    optionalCommands: [
      {
        label: 'Interactive dashboard — chat + voice + live SSE treasury',
        command: `pip install -r requirements.txt -r requirements-serve.txt
python3 -m solvent serve --port 8787
# optional second terminal:
python3 -m solvent worker
# then open http://127.0.0.1:8787/`,
      },
      {
        label: 'Telegram bot — pairing + job notifications',
        command: `pip install -r requirements-telegram.txt
export TELEGRAM_BOT_TOKEN="..."
python3 -m solvent serve
python3 -m solvent worker
python3 -m solvent telegram
# docs: github.com/ianalloway/solvent-agent/blob/main/docs/TELEGRAM.md`,
      },
      { label: 'Interactive — type your own research jobs', command: 'python3 run_demo.py --interactive' },
      { label: 'Skip first-run wizard (use saved defaults)', command: 'python3 run_demo.py --no-onboard' },
      { label: 'Open treasury dashboard after a run', command: 'open treasury_dashboard.html' },
    ],
    whatHappensNext: [
      'First run: a short onboarding wizard asks for model, batch vs interactive mode, and whether to enable Stripe test mode. Choices save to .solvent/config.json.',
      'Batch mode (default): four pre-loaded analyst jobs run in ~30 seconds — margin gating, payment simulation, Nemotron fulfilment, guardrail screening, live P&L.',
      'Interactive mode: type a research topic and client budget at the prompt; the agent quotes, collects, fulfils, and books each job until you quit.',
      'Live dashboard: `solvent serve` hosts a browser UI with typed chat, Web Speech mic input, and Server-Sent Events that refresh treasury + job state in real time.',
      'Telegram: long-poll bot with OpenClaw-style DM pairing — quote, commission, and payment notifications in chat (see repo docs/TELEGRAM.md).',
      'When finished, open treasury_dashboard.html for revenue, spend, job cards, and a transaction log.',
    ],
    hero: true,
  },
  {
    id: 'juryrig',
    icon: Scale,
    name: 'juryrig',
    repo: 'ianalloway/juryrig',
    tagline: 'Audit LLM-as-judge pipelines',
    whatItIs:
      'A zero-dependency toolkit that tests your LLM judge for position bias, verbosity bias, prompt-injection susceptibility, calibration, and panel agreement before you trust automated evals.',
    prerequisites: ['Python 3.10+', 'No API keys for the built-in demo (MockJudge)'],
    startCommand: `git clone https://github.com/ianalloway/juryrig.git
cd juryrig
python3 examples/audit_demo.py`,
    optionalCommands: [
      {
        label: 'Install + launch local audit dashboard',
        command: 'pip install git+https://github.com/ianalloway/juryrig\njuryrig-dashboard',
      },
    ],
    whatHappensNext: [
      'audit_demo.py runs the full audit suite against a fair judge and a rigged one — no network calls.',
      'You see flip rates, injection lift, verbosity bias, and which audits flag the judge.',
      'With juryrig-dashboard, a local console opens at http://127.0.0.1:8765 with live metrics and JSON export.',
    ],
  },
  {
    id: 'openclaw-skills',
    icon: Puzzle,
    name: 'openclaw-skills',
    repo: 'ianalloway/openclaw-skills',
    tagline: 'Agent skills for OpenClaw / ClawHub',
    whatItIs:
      'A collection of skills — sports odds, Kelly sizing, DFS optimizer, bet journal, market sentiment, and more — that extend the OpenClaw AI assistant when relevant tasks come up.',
    prerequisites: [
      'OpenClaw installed and running (terminal, Telegram, or Discord)',
      'Some skills need free API keys (e.g. The Odds API for live lines)',
    ],
    startCommand: `git clone https://github.com/ianalloway/openclaw-skills.git
cd openclaw-skills
cp -r sports-odds ~/.openclaw/skills/
cp -r kelly-criterion ~/.openclaw/skills/
cp -r bet-journal ~/.openclaw/skills/`,
    optionalCommands: [
      {
        label: 'Copy all skills at once',
        command:
          'for d in sports-odds nft-tracker data-viz kelly-criterion portfolio-rebalancer market-sentiment streak-tracker dfs-optimizer bet-journal; do cp -r "$d" ~/.openclaw/skills/; done',
      },
    ],
    whatHappensNext: [
      'OpenClaw picks up new skills from ~/.openclaw/skills/ on the next session.',
      'Ask naturally: "Get NFL betting odds", "What\'s the optimal Kelly bet at -130?", or "Show my bet journal dashboard".',
      'Skills run inside your existing OpenClaw agent — no separate process to start.',
    ],
  },
];

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded border border-primary/30 bg-background/80 p-4 text-[11px] md:text-xs font-mono text-primary/90 leading-relaxed">
      <code>{children}</code>
    </pre>
  );
}

function BotSection({ bot }: { bot: BotGuide }) {
  const Icon = bot.icon;
  const isHero = bot.hero === true;

  return (
    <section
      id={bot.id}
      className={`scroll-mt-24 ${isHero ? 'mb-16' : 'mb-12'}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon size={isHero ? 22 : 18} className="text-primary shrink-0" />
        <h2
          className={`font-bold font-mono text-primary matrix-text ${
            isHero ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'
          }`}
        >
          {bot.name}
          <span className="text-muted-foreground font-normal text-base md:text-lg"> — {bot.tagline}</span>
        </h2>
      </div>

      <a
        href={`https://github.com/${bot.repo}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs font-mono text-primary/70 hover:text-primary mb-4"
      >
        <Github size={12} /> {bot.repo}
      </a>

      <div
        className={`rounded-md border border-primary/30 bg-card/60 backdrop-blur-sm ${
          isHero ? 'p-5 md:p-8' : 'p-4 md:p-6'
        }`}
      >
        <p className="text-sm text-muted-foreground mb-6 max-w-3xl">{bot.whatItIs}</p>

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <div>
            <h3 className="text-xs font-mono font-bold text-primary mb-2 uppercase tracking-wider">
              Prerequisites
            </h3>
            <ul className="space-y-1.5 text-xs font-mono text-muted-foreground">
              {bot.prerequisites.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-primary shrink-0">›</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-mono font-bold text-primary mb-2 uppercase tracking-wider">
              What happens next
            </h3>
            <ul className="space-y-1.5 text-xs font-mono text-muted-foreground">
              {bot.whatHappensNext.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-primary shrink-0">›</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-xs font-mono font-bold text-primary mb-2 uppercase tracking-wider">
            Start command
          </h3>
          <CodeBlock>{bot.startCommand}</CodeBlock>
        </div>

        {bot.optionalCommands && bot.optionalCommands.length > 0 && (
          <div className="mb-6 space-y-3">
            <h3 className="text-xs font-mono font-bold text-primary uppercase tracking-wider">
              Also useful
            </h3>
            {bot.optionalCommands.map(({ label, command }) => (
              <div key={label}>
                <p className="text-[11px] font-mono text-primary/80 mb-1">{label}</p>
                <CodeBlock>{command}</CodeBlock>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <a
            href={`https://github.com/${bot.repo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded border border-primary/40 bg-background/50 px-3 py-1.5 font-mono text-xs text-primary hover:bg-primary/10"
          >
            <Github size={12} /> GitHub repo
          </a>
          {bot.id === 'solvent' && (
            <a
              href="/demos#solvent"
              className="inline-flex items-center gap-2 rounded border border-primary/40 bg-background/50 px-3 py-1.5 font-mono text-xs text-primary hover:bg-primary/10"
            >
              Watch demo <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

const Bots = () => {
  const hero = BOTS.find((b) => b.hero);
  const others = BOTS.filter((b) => !b.hero);

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
            <a href="#solvent" className="text-primary/80 hover:text-primary px-2 py-0.5 terminal-border rounded">
              solvent
            </a>
            <a href="#juryrig" className="text-primary/80 hover:text-primary px-2 py-0.5 terminal-border rounded">
              juryrig
            </a>
            <a href="#openclaw-skills" className="text-primary/80 hover:text-primary px-2 py-0.5 terminal-border rounded">
              skills
            </a>
            <a href="/demos" className="text-primary/80 hover:text-primary px-2 py-0.5 terminal-border rounded">
              [DEMOS]
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
            START_THE_BOTS
          </p>
          <h1 className="text-3xl md:text-4xl font-bold matrix-text font-mono text-primary mb-3 flex items-center justify-center gap-2">
            <Bot size={28} className="shrink-0" />
            How to start the bots
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl mx-auto font-mono">
            Copy-paste commands to run each agent locally. SOLVENT needs zero API keys for the demo;
            the others have quick no-key paths too.
          </p>
        </header>

        <section className="mb-12 terminal-border rounded-lg p-4 md:p-5 bg-primary/5">
          <h2 className="text-primary font-mono text-sm font-bold mb-3">Three steps, any bot</h2>
          <ol className="grid md:grid-cols-3 gap-3 text-xs font-mono text-muted-foreground">
            <li className="rounded border border-primary/20 bg-background/50 px-3 py-2">
              <span className="text-primary font-bold">1.</span> Clone the repo
            </li>
            <li className="rounded border border-primary/20 bg-background/50 px-3 py-2">
              <span className="text-primary font-bold">2.</span> Run the start command below
            </li>
            <li className="rounded border border-primary/20 bg-background/50 px-3 py-2">
              <span className="text-primary font-bold">3.</span> Follow the terminal output — dashboards open in-browser when noted
            </li>
          </ol>
        </section>

        {hero && <BotSection bot={hero} />}

        {others.length > 0 && (
          <>
            <h2 className="text-lg font-mono font-bold text-primary mb-6 matrix-text">More agents &amp; skills</h2>
            {others.map((bot) => (
              <BotSection key={bot.id} bot={bot} />
            ))}
          </>
        )}

        <footer className="text-center text-xs font-mono text-muted-foreground mt-8">
          <a href="/demos" className="text-primary/70 hover:text-primary mr-4">
            live demos →
          </a>
          <a href="/" className="text-primary/70 hover:text-primary">
            ← back to ianalloway.xyz
          </a>
        </footer>
      </main>
    </div>
  );
};

export default Bots;
