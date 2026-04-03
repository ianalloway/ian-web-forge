import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';
import {
  Github,
  ExternalLink,
  Terminal,
  Activity,
  LineChart,
  Database,
  Shield,
  Cpu,
  Wrench,
  ArrowRight,
  Home,
  BookMarked,
  Archive,
  Gamepad2,
} from 'lucide-react';
import MatrixRain from '@/components/MatrixRain';

/** One row — mirrors github.com/ianalloway profile README catalog (March 2026). */
type CatalogRow = {
  name: string;
  href: string;
  oneLine: string;
};

type CatalogSection = {
  id: string;
  title: string;
  blurb: string;
  icon: LucideIcon;
  rows: CatalogRow[];
};

const START_HERE: { label: string; href: string; note: string }[] = [
  {
    label: 'Portfolio home',
    href: '/',
    note: 'Main site & sections',
  },
  {
    label: 'Sports ML case study',
    href: '/papers/sports-ml-evaluation-case-study.html',
    note: 'One-pager · print → PDF',
  },
  {
    label: 'All repositories',
    href: 'https://github.com/ianalloway?tab=repositories&q=&sort=updated',
    note: 'GitHub · sorted by updated',
  },
  {
    label: 'Profile README',
    href: 'https://github.com/ianalloway/ianalloway',
    note: 'Same catalog as this page (tables)',
  },
];

const CATALOG: CatalogSection[] = [
  {
    id: 'flagship',
    title: 'Flagship — sports ML & evaluation',
    blurb: 'Calibration-first stack: dashboard, primitives, reports, CI gate.',
    icon: LineChart,
    rows: [
      {
        name: 'nba-clv-dashboard',
        href: 'https://github.com/ianalloway/nba-clv-dashboard',
        oneLine: 'FastAPI + Chart.js: calibration, rolling accuracy, CLV block',
      },
      {
        name: 'nba-ratings',
        href: 'https://github.com/ianalloway/nba-ratings',
        oneLine: 'Elo / logistic / Kelly primitives · PyPI package nba-edge',
      },
      {
        name: 'backtest-report-gen',
        href: 'https://github.com/ianalloway/backtest-report-gen',
        oneLine: 'metrics.json → static HTML report',
      },
      {
        name: 'metric-regression-gate',
        href: 'https://github.com/ianalloway/metric-regression-gate',
        oneLine: 'CI: fail when metrics regress vs baseline',
      },
    ],
  },
  {
    id: 'odds-lines',
    title: 'Odds, lines & data',
    blurb: 'Shop lines, archive snapshots, drift alerts — BYOK Odds API where noted.',
    icon: Activity,
    rows: [
      {
        name: 'line-shop-cli',
        href: 'https://github.com/ianalloway/line-shop-cli',
        oneLine: 'Line shopping, CSV, optional Kelly · demo or Odds API',
      },
      {
        name: 'closing-line-archive',
        href: 'https://github.com/ianalloway/closing-line-archive',
        oneLine: 'SQLite snapshots · beat-close vs cutoffs',
      },
      {
        name: 'odds-drift-watch',
        href: 'https://github.com/ianalloway/odds-drift-watch',
        oneLine:
          'Webhook alerts when sportsbook odds move past a threshold (Line Shock Index)',
      },
      {
        name: 'odds-cli',
        href: 'https://github.com/ianalloway/odds-cli',
        oneLine: 'Terminal odds + Kelly',
      },
      {
        name: 'kelly-js',
        href: 'https://github.com/ianalloway/kelly-js',
        oneLine: 'TypeScript Kelly / CLV · npm',
      },
    ],
  },
  {
    id: 'mlops-research',
    title: 'MLOps, agents & research',
    blurb: 'Model cards, traces, benchmarks, RAG — README + CI on each.',
    icon: Cpu,
    rows: [
      {
        name: 'model-cardgen',
        href: 'https://github.com/ianalloway/model-cardgen',
        oneLine: 'metrics.json → Markdown model/data cards',
      },
      {
        name: 'agent-trace-kit',
        href: 'https://github.com/ianalloway/agent-trace-kit',
        oneLine: 'JSONL traces + HTML replay for agents',
      },
      {
        name: 'fraud-anomaly-bench',
        href: 'https://github.com/ianalloway/fraud-anomaly-bench',
        oneLine: 'Sklearn benchmark harness + leaderboard',
      },
      {
        name: 'substack-rag-local',
        href: 'https://github.com/ianalloway/substack-rag-local',
        oneLine: 'Local RAG over Substack posts',
      },
    ],
  },
  {
    id: 'dev-mac',
    title: 'Dev & Mac',
    blurb: 'Reproducible Mac setup and safe disk cleanup.',
    icon: Wrench,
    rows: [
      {
        name: 'macos-disk-cleanup',
        href: 'https://github.com/ianalloway/macos-disk-cleanup',
        oneLine: 'Safe cache cleanup · documented algorithm · ShellCheck CI',
      },
      {
        name: 'dev-setup-macos',
        href: 'https://github.com/ianalloway/dev-setup-macos',
        oneLine: 'Homebrew Bundle bootstrap',
      },
    ],
  },
  {
    id: 'shipped-products',
    title: 'Shipped products & demos',
    blurb: 'Live products and larger demos beyond small OSS libs.',
    icon: ExternalLink,
    rows: [
      {
        name: 'ai-advantage',
        href: 'https://github.com/ianalloway/ai-advantage',
        oneLine: 'Sports ML product codebase',
      },
      {
        name: 'AI Advantage Sports (live)',
        href: 'https://aiadvantagesports.com',
        oneLine: 'XGBoost + Kelly · live app',
      },
      {
        name: 'sports-betting-ml',
        href: 'https://github.com/ianalloway/sports-betting-ml',
        oneLine: 'Models / Hugging Face Spaces',
      },
      {
        name: 'tf-object-detection',
        href: 'https://github.com/ianalloway/tf-object-detection',
        oneLine: 'TensorFlow.js COCO-SSD in the browser',
      },
      {
        name: 'ai-drone-auto-vehicle',
        href: 'https://github.com/ianalloway/ai-drone-auto-vehicle',
        oneLine: 'YOLOv8 + path planning + MAVLink',
      },
      {
        name: 'Money-maker-bot',
        href: 'https://github.com/ianalloway/Money-maker-bot',
        oneLine: 'OpenClaw financial / odds agent',
      },
      {
        name: 'deathcon-api',
        href: 'https://github.com/ianalloway/deathcon-api',
        oneLine: 'FastAPI AI + webhooks',
      },
    ],
  },
  {
    id: 'legacy',
    title: 'Legacy / reference',
    blurb: 'Superseded or split elsewhere — kept for links and history.',
    icon: Archive,
    rows: [
      {
        name: 'nba-edge',
        href: 'https://github.com/ianalloway/nba-edge',
        oneLine: 'Older CLI repo · library source of truth is nba-ratings',
      },
      {
        name: 'repo-health',
        href: 'https://github.com/ianalloway/repo-health',
        oneLine: 'CLI: README quality, licensing, CI, topics, maintenance signals',
      },
      {
        name: 'code-stash',
        href: 'https://github.com/ianalloway/code-stash',
        oneLine: 'SQLite snippet manager with local LLM search',
      },
      {
        name: 'stock-sentiment-analyzer',
        href: 'https://github.com/ianalloway/stock-sentiment-analyzer',
        oneLine: 'NLP sentiment across Reddit, headlines, filings',
      },
      {
        name: 'openclaw-skills',
        href: 'https://github.com/ianalloway/openclaw-skills',
        oneLine: 'OpenClaw / ClawHub skills for sports, Kelly, markets, agents',
      },
    ],
  },
  {
    id: 'site-cv',
    title: 'Site & CV',
    blurb: 'This portfolio and resume source.',
    icon: BookMarked,
    rows: [
      {
        name: 'ian-web-forge',
        href: 'https://github.com/ianalloway/ian-web-forge',
        oneLine: 'Portfolio site (this deployment)',
      },
      {
        name: 'Resume',
        href: 'https://github.com/ianalloway/Resume',
        oneLine: 'CV source + PDF',
      },
    ],
  },
];

const FLOW_STEPS = [
  { label: 'Primitives', href: 'https://github.com/ianalloway/nba-ratings' },
  { label: 'Drift alerts', href: 'https://github.com/ianalloway/odds-drift-watch' },
  { label: 'Archive', href: 'https://github.com/ianalloway/closing-line-archive' },
  { label: 'Kelly math', href: 'https://github.com/ianalloway/kelly-js' },
  { label: 'Eval UI', href: 'https://github.com/ianalloway/nba-clv-dashboard' },
  { label: 'Report', href: 'https://github.com/ianalloway/backtest-report-gen' },
  { label: 'CI gate', href: 'https://github.com/ianalloway/metric-regression-gate' },
];

function CatalogTable({ rows }: { rows: CatalogRow[] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-primary/30 bg-card/50">
      <table className="w-full text-left text-xs font-mono">
        <thead>
          <tr className="border-b border-primary/30 bg-primary/5 text-primary/90">
            <th className="px-3 py-2 font-semibold w-[min(40%,220px)]">Repo / link</th>
            <th className="px-3 py-2 font-semibold">One line</th>
            <th className="px-3 py-2 w-16 text-right"> </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.href} className="border-b border-primary/15 last:border-0 hover:bg-primary/5">
              <td className="px-3 py-2.5 text-primary align-top">
                <a
                  href={r.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold hover:underline break-all"
                >
                  {r.name}
                </a>
              </td>
              <td className="px-3 py-2.5 text-muted-foreground align-top">{r.oneLine}</td>
              <td className="px-3 py-2.5 text-right align-top">
                <a
                  href={r.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary/70 hover:text-primary inline-flex"
                  aria-label={`Open ${r.name}`}
                >
                  <ExternalLink size={14} />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const Toolkit = () => {
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
            <a href="#start" className="text-primary/80 hover:text-primary px-2 py-0.5 terminal-border rounded">
              Start
            </a>
            {CATALOG.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="text-primary/80 hover:text-primary px-2 py-0.5 terminal-border rounded max-w-[10rem] truncate"
                title={s.title}
              >
                {s.title.split(' —')[0]}
              </a>
            ))}
            <a href="#more" className="text-primary/80 hover:text-primary px-2 py-0.5 terminal-border rounded">
              More
            </a>
            <a href="/" className="text-primary/80 hover:text-primary px-2 py-0.5 terminal-border rounded">
              [HOME]
            </a>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-4 pt-24 pb-20">
        <header className="mb-10 text-center">
          <p className="text-primary text-xs font-mono mb-2 terminal-border inline-block px-2 py-1">
            PUBLIC_TOOLKIT
          </p>
          <h1 className="text-3xl md:text-4xl font-bold matrix-text font-mono text-primary mb-4">
            Sports analytics &amp; GitHub tools
          </h1>
          <p className="text-muted-foreground font-mono text-sm max-w-2xl mx-auto mb-2">
            Same catalog as the{' '}
            <a
              href="https://github.com/ianalloway/ianalloway"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              GitHub profile README
            </a>
            — tables below for quick scanning.
          </p>
          <p className="text-muted-foreground/80 font-mono text-xs max-w-xl mx-auto mb-6">
            MIT-licensed OSS unless noted; README + CI where applicable.
          </p>
        </header>

        <section id="start" className="mb-12 scroll-mt-24">
          <h2 className="text-primary font-mono text-sm font-bold mb-3 flex items-center gap-2">
            <Home size={16} />
            [START_HERE]
          </h2>
          <CatalogTable
            rows={START_HERE.map((s) => ({
              name: s.label,
              href: s.href.startsWith('http') || s.href.startsWith('/') ? s.href : `/${s.href}`,
              oneLine: s.note,
            }))}
          />
        </section>

        <section className="mb-14 terminal-border rounded-lg p-4 bg-card/40 backdrop-blur-sm">
          <h2 className="text-primary font-mono text-sm font-bold mb-3 flex items-center gap-2">
            <Database size={16} />
            [PIPELINE_AT_A_GLANCE]
          </h2>
          <p className="text-muted-foreground font-mono text-xs mb-4">
            How the flagship pieces connect — optional path through the stack.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-1 md:gap-2 font-mono text-xs text-primary">
            {FLOW_STEPS.map((step, i) => (
              <span key={step.label} className="flex items-center gap-1 md:gap-2">
                {i > 0 && <ArrowRight className="text-primary/40 w-3 h-3 md:w-4 md:h-4 shrink-0" />}
                <a
                  href={step.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="terminal-border px-2 py-1 rounded hover:bg-primary/10 whitespace-nowrap"
                >
                  {step.label}
                </a>
              </span>
            ))}
          </div>
        </section>

        <section className="mb-14">
          <Card className="terminal-border bg-card/40 backdrop-blur-sm">
            <CardContent className="p-5 md:p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-primary font-mono text-lg font-bold flex items-center gap-2 mb-2">
                  <Gamepad2 size={18} />
                  [PLAY_SNAKE]
                </h2>
                <p className="text-muted-foreground font-mono text-sm max-w-2xl">
                  A small classic Snake game now lives on the site at <span className="text-primary">/snake</span>.
                  No extra dependencies, just a clean playable route.
                </p>
              </div>
              <Button className="font-mono bg-primary text-primary-foreground shrink-0" asChild>
                <a href="/snake">
                  Launch Snake
                  <ArrowRight className="ml-2" size={16} />
                </a>
              </Button>
            </CardContent>
          </Card>
        </section>

        {CATALOG.map((section) => {
          const Icon = section.icon;
          return (
            <section key={section.id} id={section.id} className="mb-12 scroll-mt-24">
              <h2 className="text-xl font-bold matrix-text font-mono text-primary mb-2 flex items-center gap-2">
                <Icon size={22} className="text-primary shrink-0" />
                {section.title}
              </h2>
              <p className="text-muted-foreground font-mono text-sm mb-4">{section.blurb}</p>
              <CatalogTable rows={section.rows} />
            </section>
          );
        })}

        <section id="more" className="mb-12 scroll-mt-24 terminal-border rounded-lg p-5 bg-card/30">
          <h2 className="text-primary font-mono text-sm font-bold mb-2">More utilities</h2>
          <p className="text-muted-foreground font-mono text-xs mb-4">
            Smaller tools (e.g. <code className="text-primary/90">code-stash</code>,{' '}
            <code className="text-primary/90">repo-health</code>,{' '}
            <code className="text-primary/90">stock-sentiment-analyzer</code>)—browse the full{' '}
            <a
              href="https://github.com/ianalloway?tab=repositories&q=&sort=updated"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              repository list
            </a>
            .
          </p>
          <Button className="font-mono bg-primary text-primary-foreground" asChild>
            <a href="https://github.com/ianalloway?tab=repositories&q=&sort=updated" target="_blank" rel="noopener noreferrer">
              <Github className="mr-2" size={16} />
              All repos @ianalloway
            </a>
          </Button>
        </section>

        <section className="terminal-border rounded-lg p-6 bg-primary/5 text-center">
          <Shield className="mx-auto mb-3 text-primary" size={28} />
          <h2 className="text-primary font-mono font-bold mb-2">Hire / collaborate</h2>
          <p className="text-muted-foreground font-mono text-xs mb-4 max-w-lg mx-auto">
            If you want this stack applied to your pipeline or product, use the main site or hire page.
          </p>
          <Button variant="outline" className="font-mono terminal-border text-primary border-primary" asChild>
            <a href="/hireme">[/HIRE]</a>
          </Button>
        </section>
      </main>
    </div>
  );
};

export default Toolkit;
