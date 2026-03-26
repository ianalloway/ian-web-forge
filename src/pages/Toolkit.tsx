import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  FileText,
  ArrowRight,
} from 'lucide-react';
import MatrixRain from '@/components/MatrixRain';

type Tool = {
  name: string;
  description: string;
  url: string;
  tags: string[];
};

const SECTIONS: { id: string; title: string; blurb: string; icon: LucideIcon; tools: Tool[] }[] = [
  {
    id: 'sports-ml',
    title: 'Sports ML — evaluation & primitives',
    blurb:
      'Calibration-first story: dashboard + library + reports. Swap demo JSON for your own backtests.',
    icon: LineChart,
    tools: [
      {
        name: 'nba-clv-dashboard',
        description: 'FastAPI + Chart.js: calibration, rolling accuracy, CLV summary block.',
        url: 'https://github.com/ianalloway/nba-clv-dashboard',
        tags: ['FastAPI', 'Chart.js', 'flagship'],
      },
      {
        name: 'nba-ratings (PyPI: nba-edge)',
        description: 'Elo updates, logistic win probability, Kelly / implied prob helpers.',
        url: 'https://github.com/ianalloway/nba-ratings',
        tags: ['Python', 'PyPI', 'tests'],
      },
      {
        name: 'backtest-report-gen',
        description: 'metrics.json → static HTML report (print to PDF). Same shape as the dashboard demo.',
        url: 'https://github.com/ianalloway/backtest-report-gen',
        tags: ['CLI', 'HTML', 'eval'],
      },
      {
        name: 'metric-regression-gate',
        description: 'CI gate: fail PRs when metrics.json regresses vs baseline; composite GitHub Action.',
        url: 'https://github.com/ianalloway/metric-regression-gate',
        tags: ['GitHub Actions', 'MLOps'],
      },
    ],
  },
  {
    id: 'odds-data',
    title: 'Odds, lines & closing-line data',
    blurb: 'Shop lines, archive snapshots, alert on drift — BYOK for The Odds API where noted.',
    icon: Activity,
    tools: [
      {
        name: 'odds-drift-watch',
        description: 'Webhook alerts when sportsbook odds move past a threshold (Line Shock Index).',
        url: 'https://github.com/ianalloway/odds-drift-watch',
        tags: ['FastAPI', 'webhooks'],
      },
      {
        name: 'closing-line-archive',
        description: 'SQLite CLI: append JSONL snapshots; export CSV; beat-close vs open/close cutoffs.',
        url: 'https://github.com/ianalloway/closing-line-archive',
        tags: ['SQLite', 'data'],
      },
      {
        name: 'kelly-js',
        description: 'Zero-dep TypeScript Kelly, CLV helpers, odds conversion (npm).',
        url: 'https://github.com/ianalloway/kelly-js',
        tags: ['TypeScript', 'npm'],
      },
      {
        name: 'odds-cli',
        description: 'Terminal odds comparison and Kelly sizing (legacy companion CLI).',
        url: 'https://github.com/ianalloway/odds-cli',
        tags: ['CLI'],
      },
    ],
  },
  {
    id: 'shipped-products',
    title: 'Shipped sports products',
    blurb: 'Live apps and models beyond the OSS toolkit.',
    icon: ExternalLink,
    tools: [
      {
        name: 'AI Advantage Sports',
        description: 'XGBoost pipeline, Kelly sizing, live product experience.',
        url: 'https://aiadvantagesports.com',
        tags: ['product', 'XGBoost'],
      },
      {
        name: 'sports-betting-ml (Hugging Face)',
        description: 'Sports ML models and spaces.',
        url: 'https://github.com/ianalloway/sports-betting-ml',
        tags: ['Hugging Face'],
      },
      {
        name: 'nba-edge (legacy CLI repo)',
        description: 'Older edge-finder CLI; library source of truth is nba-ratings.',
        url: 'https://github.com/ianalloway/nba-edge',
        tags: ['legacy'],
      },
    ],
  },
  {
    id: 'mlops-agents',
    title: 'MLOps, agents & research utilities',
    blurb: 'Documentation, benchmarks, traces, RAG — same engineering standards (README + CI).',
    icon: Cpu,
    tools: [
      {
        name: 'repo-health',
        description: 'CLI that scores README quality, licensing, CI, topic coverage, and maintenance signals.',
        url: 'https://github.com/ianalloway/repo-health',
        tags: ['CLI', 'developer tooling'],
      },
      {
        name: 'code-stash',
        description: 'SQLite-backed code snippet manager with local LLM search.',
        url: 'https://github.com/ianalloway/code-stash',
        tags: ['SQLite', 'developer tooling'],
      },
      {
        name: 'stock-sentiment-analyzer',
        description: 'NLP-powered stock sentiment scoring across Reddit, headlines, and filings.',
        url: 'https://github.com/ianalloway/stock-sentiment-analyzer',
        tags: ['NLP', 'analytics'],
      },
      {
        name: 'openclaw-skills',
        description: 'Published OpenClaw and ClawHub skills for sports, Kelly sizing, market sentiment, and agent workflows.',
        url: 'https://github.com/ianalloway/openclaw-skills',
        tags: ['agents', 'open source'],
      },
    ],
  },
  {
    id: 'dev-tooling',
    title: 'Dev & Mac hygiene',
    blurb: 'Reproducible environments and safe cleanup.',
    icon: Wrench,
    tools: [
      {
        name: 'macos-disk-cleanup',
        description: 'Bash CLI: regenerable caches only; documented algorithm; ShellCheck CI.',
        url: 'https://github.com/ianalloway/macos-disk-cleanup',
        tags: ['Bash', 'macOS'],
      },
      {
        name: 'repo-health',
        description: 'Repository scoring and maintenance auditing for public OSS hygiene.',
        url: 'https://github.com/ianalloway/repo-health',
        tags: ['CLI', 'GitHub'],
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
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="text-primary/80 hover:text-primary px-2 py-0.5 terminal-border rounded"
              >
                {s.title.split(' —')[0]}
              </a>
            ))}
            <a href="/" className="text-primary/80 hover:text-primary px-2 py-0.5 terminal-border rounded">
              [HOME]
            </a>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-4 pt-24 pb-20">
        <header className="mb-12 text-center">
          <p className="text-primary text-xs font-mono mb-2 terminal-border inline-block px-2 py-1">
            PUBLIC_TOOLKIT
          </p>
          <h1 className="text-3xl md:text-4xl font-bold matrix-text font-mono text-primary mb-4">
            Sports analytics &amp; GitHub tools
          </h1>
          <p className="text-muted-foreground font-mono text-sm max-w-2xl mx-auto mb-6">
            One page on the open internet listing the repos I ship: evaluation-first sports ML, odds data
            utilities, MLOps CLIs, and Mac dev hygiene. All MIT-licensed unless noted; each has a README and CI
            where applicable.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button className="font-mono bg-primary text-primary-foreground" asChild>
              <a href="https://github.com/ianalloway?tab=repositories" target="_blank" rel="noopener noreferrer">
                <Github className="mr-2" size={16} />
                All repos @ianalloway
              </a>
            </Button>
            <Button variant="outline" className="font-mono terminal-border text-primary border-primary" asChild>
              <a href="/papers/sports-ml-evaluation-case-study.html" target="_blank" rel="noopener noreferrer">
                <FileText className="mr-2" size={16} />
                Sports ML case study
              </a>
            </Button>
            <Button variant="outline" className="font-mono terminal-border text-primary border-primary" asChild>
              <a href="https://github.com/ianalloway/ianalloway" target="_blank" rel="noopener noreferrer">
                <Github className="mr-2" size={16} />
                GitHub profile README
              </a>
            </Button>
          </div>
        </header>

        <section className="mb-14 terminal-border rounded-lg p-4 bg-card/40 backdrop-blur-sm">
          <h2 className="text-primary font-mono text-sm font-bold mb-3 flex items-center gap-2">
            <Database size={16} />
            [PIPELINE_AT_A_GLANCE]
          </h2>
          <p className="text-muted-foreground font-mono text-xs mb-4">
            How the pieces connect — use what you need; no single vendor lock-in.
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

        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <section key={section.id} id={section.id} className="mb-14 scroll-mt-24">
              <h2 className="text-xl font-bold matrix-text font-mono text-primary mb-2 flex items-center gap-2">
                <Icon size={22} className="text-primary shrink-0" />
                {section.title}
              </h2>
              <p className="text-muted-foreground font-mono text-sm mb-6">{section.blurb}</p>
              <div className="grid md:grid-cols-2 gap-4">
                {section.tools.map((t) => (
                  <Card
                    key={t.url}
                    className="terminal-border bg-card/80 backdrop-blur-sm hover:border-primary/50 transition-colors"
                  >
                    <CardContent className="p-4">
                      <h3 className="text-primary font-bold font-mono text-sm mb-2">{t.name}</h3>
                      <p className="text-muted-foreground/90 text-xs font-mono mb-3 leading-relaxed">
                        {t.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {t.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 text-[10px] terminal-border rounded font-mono text-primary/80"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="font-mono terminal-border text-primary border-primary text-xs h-8"
                        asChild
                      >
                        <a href={t.url} target="_blank" rel="noopener noreferrer">
                          <Github className="mr-1" size={12} />
                          Open
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          );
        })}

        <section className="terminal-border rounded-lg p-6 bg-primary/5 text-center">
          <Shield className="mx-auto mb-3 text-primary" size={28} />
          <h2 className="text-primary font-mono font-bold mb-2">Hire / collaborate</h2>
          <p className="text-muted-foreground font-mono text-xs mb-4 max-w-lg mx-auto">
            If you want this stack applied to your data pipeline, eval story, or product, use the main site or
            hire page.
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
