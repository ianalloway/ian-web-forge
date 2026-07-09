import { useEffect, useRef, useState } from 'react';
import Newsletter from '@/components/Newsletter';

/* ──────────────────────────────────────────────────────────────────────────
   Portfolio homepage redesign — data-forward, restrained terminal aesthetic.
   Single scrolling page: Nav → Hero → Selected Work → Capabilities →
   Measured Impact + Timeline → Agents → Contact → Footer.
   Styling is intentionally self-contained (explicit hex tokens) so the rest of
   the site keeps its existing matrix theme.
   ────────────────────────────────────────────────────────────────────────── */

const ACCENT = '#5be49b';

const CATEGORY_COLORS: Record<string, string> = {
  'Sports ML': '#5be49b',
  'AI Agents': '#4fd6e0',
  MLOps: '#e9c14a',
  Tools: '#c79bf0',
  Web3: '#7aa2f0',
};

type Category = 'Sports ML' | 'AI Agents' | 'MLOps' | 'Tools' | 'Web3';
type Filter = 'All' | Category;

interface Project {
  title: string;
  category: Category;
  description: string;
  tech: string[];
  code?: string;
  demo?: string;
  featured?: boolean;
}

const PROJECTS: Project[] = [
  {
    title: 'NBA Sports Betting Pipeline',
    category: 'Sports ML',
    featured: true,
    description:
      'XGBoost model hitting 68.3% accuracy with Kelly Criterion bet sizing. Live in production at aiadvantagesports.com and published on Hugging Face.',
    tech: ['XGBoost', 'Kelly', 'Python'],
    code: 'https://github.com/ianalloway/sports-betting-ml',
    demo: 'https://aiadvantagesports.com',
  },
  {
    title: 'nba-clv-dashboard',
    category: 'Sports ML',
    description:
      'FastAPI + Chart.js evaluation demo: calibration, rolling accuracy, and CLV summary. Drop in your own backtest JSON. The flagship sports-ML showcase.',
    tech: ['FastAPI', 'Chart.js', 'Calibration'],
    code: 'https://github.com/ianalloway/oss-archive/tree/archive/nba-clv-dashboard',
    demo: 'https://ianalloway.xyz/papers/sports-ml-evaluation-case-study.html',
  },
  {
    title: 'nba-ratings / nba-edge',
    category: 'Sports ML',
    description:
      'Installable Elo, logistic win-probability, and Kelly helpers for NBA-style models. Published to PyPI as nba-edge.',
    tech: ['Elo', 'PyPI', 'Python'],
    code: 'https://github.com/ianalloway/nba-ratings',
  },
  {
    title: 'solvent-agent',
    category: 'AI Agents',
    featured: true,
    description:
      'Self-funding AI analyst: quotes jobs, collects Stripe payment, fulfils work on Nemotron, pays its own vendor bills under guardrails, and books P&L.',
    tech: ['Stripe', 'Nemotron', 'Python'],
    code: 'https://github.com/ianalloway/solvent-agent',
    demo: 'https://allowayai.substack.com/p/case-study-solvent-streamlining-agent',
  },
  {
    title: 'juryrig',
    category: 'AI Agents',
    description:
      'Audit LLM-as-judge pipelines for position bias, verbosity bias, prompt-injection, calibration, and panel agreement before you trust automated evals. Zero dependencies.',
    tech: ['Evals', 'LLM-judge', 'Python'],
    code: 'https://github.com/ianalloway/juryrig',
  },
  {
    title: 'openclaw-skills',
    category: 'AI Agents',
    description:
      'Nine published open-source skills — sports odds, Kelly sizing, DFS optimizer, bet journal, market sentiment, and more — that extend the OpenClaw assistant.',
    tech: ['Skills', 'OpenClaw', 'Python'],
    code: 'https://github.com/ianalloway/openclaw-skills',
  },
  {
    title: 'backtest-report-gen',
    category: 'MLOps',
    description:
      'Turn evaluation JSON into static HTML backtest reports with calibration, Brier, CLV, and ledger views. No server required.',
    tech: ['HTML', 'Eval', 'CLV'],
    code: 'https://github.com/ianalloway/oss-archive/tree/archive/backtest-report-gen',
  },
  {
    title: 'metric-regression-gate',
    category: 'MLOps',
    description:
      'Composite GitHub Action that fails CI when metrics regress against a baseline. Plug-and-play for any ML project.',
    tech: ['GitHub Action', 'CI', 'YAML'],
    code: 'https://github.com/ianalloway/oss-archive/tree/archive/metric-regression-gate',
  },
  {
    title: 'repo-health',
    category: 'Tools',
    description:
      'Repo-scoring CLI for README quality, licensing, CI, maintenance signals, and staleness detection. Rich terminal output with score deltas.',
    tech: ['CLI', 'Python', 'Scoring'],
    code: 'https://github.com/ianalloway/oss-archive/tree/archive/repo-health',
  },
  {
    title: 'onchain-risk-scanner',
    category: 'Web3',
    description:
      'Read-only risk, proxy, and upgrade-timeline scanner for Ethereum, Base, Optimism, and Arbitrum contracts.',
    tech: ['EVM', 'Solidity', 'Risk'],
    code: 'https://github.com/ianalloway/onchain-risk-scanner',
  },
];

const FILTERS: Filter[] = ['All', 'Sports ML', 'AI Agents', 'MLOps', 'Tools', 'Web3'];

const HERO_METRICS = [
  { value: '68.3%', label: 'Model accuracy', sub: 'NBA betting model' },
  { value: '47', label: 'GitHub repos', sub: 'public' },
  { value: '9', label: 'OSS skills', sub: 'on ClawHub' },
  { value: 'PyPI', label: 'nba-edge', sub: 'installable' },
];

const CAPABILITIES = [
  {
    n: '01',
    title: 'Machine Learning',
    desc: 'Production ML with XGBoost, PyTorch, and scikit-learn — from feature engineering through deployment and monitoring.',
    tags: ['XGBoost', 'PyTorch', 'scikit-learn'],
  },
  {
    n: '02',
    title: 'Data Engineering',
    desc: 'ETL pipelines, multi-chain blockchain analytics, SQL optimization, and real-time event processing.',
    tags: ['FastAPI', 'PostgreSQL', 'SQL'],
  },
  {
    n: '03',
    title: 'AI Systems',
    desc: 'Autonomous agents, LLM-powered apps, NLP, computer vision, and the evaluation tooling that keeps them honest.',
    tags: ['LLMs', 'Agents', 'Eval'],
  },
  {
    n: '04',
    title: 'Analytics',
    desc: 'Calibration dashboards, A/B testing, and reporting layers that turn messy data into decisions people trust.',
    tags: ['Tableau', 'Power BI', 'Streamlit'],
  },
];

const IMPACT = [
  { num: '68.3%', label: 'NBA betting model accuracy', sub: 'XGBoost + Kelly sizing, live in production' },
  { num: '30%', label: 'Fraud reduction', sub: 'delivered for a fintech client' },
  { num: '40%', label: 'Ops efficiency gain', sub: 'improvement delivered to clients' },
  { num: '194k+', label: 'OpenClaw stars', sub: 'active open-source contributor' },
];

const TIMELINE = [
  { year: '2020', color: '#7aa2f0', label: 'Data Auditor / AI Engineer — Omniichain blockchain analytics' },
  { year: '2023', color: '#e9c14a', label: 'Founded Alloway LLC · first production ML system shipped' },
  { year: '2024', color: '#e9c14a', label: 'Launched AI Advantage Sports · 68.3% model accuracy' },
  { year: '2025', color: '#c79bf0', label: 'Published 9 OSS skills on ClawHub · nba-edge on PyPI' },
  { year: '2025', color: '#7aa2f0', label: 'Completed B.S. Information Science @ USF' },
  { year: '2026', color: '#5be49b', label: 'M.S. Artificial Intelligence @ USF — in progress' },
];

const AGENTS = [
  {
    id: 'solvent',
    name: 'SOLVENT',
    accent: '#5be49b',
    tagline: 'Self-funding business agent',
    repo: 'ianalloway/solvent-agent',
    repoUrl: 'https://github.com/ianalloway/solvent-agent',
    desc: 'An AI analyst that quotes jobs, collects Stripe payment, fulfils work on Nemotron, pays its own vendor bills under guardrails, and books P&L — declining work that does not clear margin.',
    command: 'git clone https://github.com/ianalloway/solvent-agent.git\ncd solvent-agent\npython3 run_demo.py',
  },
  {
    id: 'juryrig',
    name: 'juryrig',
    accent: '#4fd6e0',
    tagline: 'Audit LLM-as-judge pipelines',
    repo: 'ianalloway/juryrig',
    repoUrl: 'https://github.com/ianalloway/juryrig',
    desc: 'A zero-dependency toolkit that tests your LLM judge for position bias, verbosity bias, prompt-injection, calibration, and panel agreement before you trust automated evals.',
    command: 'git clone https://github.com/ianalloway/juryrig.git\ncd juryrig\npython3 examples/audit_demo.py',
  },
  {
    id: 'openclaw',
    name: 'openclaw-skills',
    accent: '#c79bf0',
    tagline: 'Agent skills for OpenClaw',
    repo: 'ianalloway/openclaw-skills',
    repoUrl: 'https://github.com/ianalloway/openclaw-skills',
    desc: 'A collection of skills — sports odds, Kelly sizing, DFS optimizer, bet journal, market sentiment, and more — that extend the OpenClaw AI assistant when relevant tasks come up.',
    command: 'git clone https://github.com/ianalloway/openclaw-skills.git\ncd openclaw-skills\ncp -r kelly-criterion ~/.openclaw/skills/',
  },
];

const TYPEWRITER_PHRASES = [
  'ship them, watch them, fix them.',
  'measure them honestly.',
  'earn user trust.',
  'survive production.',
];

const HAIRLINE = 'rgba(255,255,255,0.08)';

/* ── Hero typewriter ── */
function useTypewriter(phrases: string[]) {
  const [text, setText] = useState('');
  const idx = useRef(0);
  const char = useRef(0);
  const deleting = useRef(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const phrase = phrases[idx.current];
      if (!deleting.current) {
        char.current += 1;
        setText(phrase.slice(0, char.current));
        if (char.current === phrase.length) {
          deleting.current = true;
          timer = setTimeout(tick, 2200);
          return;
        }
        timer = setTimeout(tick, 55);
      } else {
        char.current -= 1;
        setText(phrase.slice(0, char.current));
        if (char.current === 0) {
          deleting.current = false;
          idx.current = (idx.current + 1) % phrases.length;
          timer = setTimeout(tick, 350);
          return;
        }
        timer = setTimeout(tick, 28);
      }
    };
    timer = setTimeout(tick, 600);
    return () => clearTimeout(timer);
  }, [phrases]);

  return text;
}

const Caret = () => (
  <span
    aria-hidden
    style={{
      display: 'inline-block',
      width: 2,
      height: '0.9em',
      marginLeft: 2,
      transform: 'translateY(2px)',
      background: ACCENT,
      animation: 'home-caret-blink 1s step-end infinite',
    }}
  />
);

const Eyebrow = ({ children }: { children: string }) => (
  <p
    className="font-jet uppercase"
    style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.18em', color: ACCENT, marginBottom: 12 }}
  >
    {children}
  </p>
);

const Index = () => {
  const [filter, setFilter] = useState<Filter>('All');
  const [copied, setCopied] = useState<string | null>(null);
  const typed = useTypewriter(TYPEWRITER_PHRASES);

  useEffect(() => {
    document.body.classList.add('home-redesign');
    return () => document.body.classList.remove('home-redesign');
  }, []);

  const visible = filter === 'All' ? PROJECTS : PROJECTS.filter((p) => p.category === filter);
  const counts: Record<Filter, number> = {
    All: PROJECTS.length,
    'Sports ML': PROJECTS.filter((p) => p.category === 'Sports ML').length,
    'AI Agents': PROJECTS.filter((p) => p.category === 'AI Agents').length,
    MLOps: PROJECTS.filter((p) => p.category === 'MLOps').length,
    Tools: PROJECTS.filter((p) => p.category === 'Tools').length,
    Web3: PROJECTS.filter((p) => p.category === 'Web3').length,
  };

  const copy = (id: string, command: string) => {
    navigator.clipboard?.writeText(command).then(() => {
      setCopied(id);
      setTimeout(() => setCopied((c) => (c === id ? null : c)), 1600);
    });
  };

  const shell = 'max-w-[1120px] mx-auto px-8';

  return (
    <div className="font-plex" style={{ background: '#0a0b0a', color: '#e8eae6', minHeight: '100vh', position: 'relative' }}>
      <a
        href="#work"
        className="font-jet"
        style={{
          position: 'absolute',
          top: -100,
          left: 12,
          zIndex: 200,
          padding: '10px 18px',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 500,
          color: '#0a0b0a',
          background: ACCENT,
          transition: 'top .2s',
          ':focus': { top: 12 },
        }}
        onFocus={(e) => { e.currentTarget.style.top = '12px'; }}
        onBlur={(e) => { e.currentTarget.style.top = '-100px'; }}
      >
        Skip to content →
      </a>
      {/* Ambient background layers */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.025) 1px, transparent 0)',
          backgroundSize: '42px 42px',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'fixed',
          top: '-15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80vw',
          height: '55vh',
          zIndex: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse at center, rgba(91,228,155,0.06) 0%, transparent 68%)',
        }}
      />

      <main style={{ position: 'relative', zIndex: 1 }}>
        {/* ── 1. Nav ── */}
        <nav
          aria-label="Primary"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            background: 'rgba(10,11,10,0.72)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div className={shell} style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <a href="#top" style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: ACCENT, boxShadow: '0 0 10px rgba(91,228,155,0.7)' }} />
              <span className="font-jet" style={{ fontWeight: 700, fontSize: 14, color: '#e8eae6' }}>
                ian<span style={{ color: ACCENT }}>.</span>alloway
              </span>
            </a>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div className="hidden sm:flex" style={{ alignItems: 'center', gap: 4 }}>
                {[
                  ['work', '#work'],
                  ['capabilities', '#capabilities'],
                  ['agents', '#agents'],
                  ['about', '#about'],
                ].map(([label, href]) => (
                  <a key={href} href={href} className="nav-link font-jet" style={{ fontSize: 12.5, color: '#9aa093', padding: '7px 13px', borderRadius: 6 }}>
                    {label}
                  </a>
                ))}
              </div>
              <a
                href="#contact"
                className="font-jet btn-glow"
                style={{ fontSize: 12.5, fontWeight: 500, color: '#0a0b0a', background: ACCENT, padding: '8px 16px', borderRadius: 6, whiteSpace: 'nowrap' }}
              >
                Get in touch
              </a>
            </div>
          </div>
        </nav>

        {/* ── 2. Hero ── */}
        <header id="top" style={{ padding: '96px 32px 88px' }}>
          <div style={{ maxWidth: 780, margin: '0 auto' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 9,
                padding: '6px 14px 6px 12px',
                border: '1px solid rgba(91,228,155,0.28)',
                borderRadius: 100,
                background: 'rgba(91,228,155,0.05)',
                marginBottom: 30,
              }}
            >
              <span style={{ position: 'relative', width: 8, height: 8 }}>
                <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: ACCENT }} />
                <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: ACCENT, animation: 'home-pulse-ring 2.4s ease-out infinite' }} />
              </span>
              <span className="font-jet uppercase" style={{ fontSize: 11.5, fontWeight: 500, letterSpacing: '0.14em', color: '#9fe9c1', whiteSpace: 'nowrap' }}>
                Open to work · ML / Data roles
              </span>
            </div>

            <p className="font-jet" style={{ fontSize: 13, color: '#8b9085', letterSpacing: '0.04em', marginBottom: 18 }}>
              <span style={{ color: ACCENT }}>&gt;</span> ml engineer &amp; data scientist <span style={{ color: '#6f756a' }}>·</span> usf m.s. ai{' '}
              <span style={{ color: '#6f756a' }}>·</span> 2026
            </p>

            <h1 className="font-display" style={{ fontWeight: 700, fontSize: 'clamp(44px, 7vw, 84px)', lineHeight: 0.98, letterSpacing: '-0.03em', color: '#f4f6f1', marginBottom: 26 }}>
              Ian Alloway
            </h1>

            <p style={{ fontSize: 'clamp(19px, 2.4vw, 25px)', lineHeight: 1.5, color: '#c4c9bd', maxWidth: 640 }}>
              I build <span style={{ color: ACCENT, fontWeight: 500 }}>evaluation-first ML systems</span> that survive contact with real users —{' '}
              <span style={{ color: '#e8eae6' }}>{typed}</span>
              <Caret />
            </p>

            <p style={{ fontSize: 15.5, lineHeight: 1.65, color: '#8b9085', maxWidth: 600, marginTop: 20, marginBottom: 38 }}>
              APIs, dashboards, reporting layers, and developer tools that make model behavior easier to trust. Production-grade, mostly open source.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 46 }}>
              <a
                href="#work"
                className="font-jet btn-glow"
                style={{ fontSize: 13.5, fontWeight: 500, color: '#0a0b0a', background: ACCENT, padding: '13px 24px', borderRadius: 8 }}
              >
                View selected work
              </a>
              <a
                href="https://github.com/ianalloway"
                target="_blank"
                rel="noopener noreferrer"
                className="font-jet btn-outline"
                style={{ fontSize: 13.5, color: '#d6dbcf', border: '1px solid rgba(255,255,255,0.13)', padding: '13px 22px', borderRadius: 8 }}
              >
                GitHub ↗
              </a>
              <a
                href="/Ian_Alloway_Resume_CV.pdf"
                download
                className="font-jet btn-outline"
                style={{ fontSize: 13.5, color: '#d6dbcf', border: '1px solid rgba(255,255,255,0.13)', padding: '13px 22px', borderRadius: 8 }}
              >
                Résumé ↓
              </a>
            </div>

            <div
              className="hero-metrics-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                maxWidth: 640,
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.012)',
              }}
            >
              {HERO_METRICS.map((m, i) => (
                <div key={m.label} style={{ padding: '18px 16px', borderRight: i < HERO_METRICS.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                  <div className="font-display" style={{ fontWeight: 600, fontSize: 26, color: ACCENT, lineHeight: 1 }}>{m.value}</div>
                  <div className="font-jet uppercase" style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', color: '#cdd2c5', marginTop: 8 }}>{m.label}</div>
                  <div className="font-jet" style={{ fontSize: 10, color: '#6f756a', marginTop: 3 }}>{m.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* ── 3. Selected Work ── */}
        <section id="work" style={{ padding: '40px 32px 88px' }}>
          <div style={{ maxWidth: 1120, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20 }}>
              <div>
                <Eyebrow>// selected_work</Eyebrow>
                <h2 className="font-display" style={{ fontWeight: 600, fontSize: 'clamp(30px,4.4vw,44px)', letterSpacing: '-0.025em', color: '#f4f6f1' }}>
                  Things I&apos;ve shipped
                </h2>
              </div>
              <p style={{ fontSize: 14.5, color: '#8b9085', maxWidth: 340 }}>
                Sports ML, AI agents, MLOps tooling, and developer tools. Most are open source and runnable today.
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '28px 0' }}>
              {FILTERS.map((f) => {
                const active = filter === f;
                const color = f === 'All' ? ACCENT : CATEGORY_COLORS[f];
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    aria-pressed={active}
                    className="font-jet"
                    style={{
                      fontSize: 11.5,
                      fontWeight: 500,
                      padding: '7px 14px',
                      borderRadius: 7,
                      cursor: 'pointer',
                      transition: 'all .18s',
                      color: active ? '#0a0b0a' : '#9aa093',
                      background: active ? color : 'transparent',
                      border: active ? `1px solid ${color}` : '1px solid rgba(255,255,255,0.11)',
                    }}
                  >
                    {f} <span style={{ opacity: 0.5 }}>{counts[f]}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 18 }}>
              {visible.map((p) => {
                const color = CATEGORY_COLORS[p.category];
                return (
                  <article
                    key={p.title}
                    style={{
                      background: 'rgba(255,255,255,0.018)',
                      borderRadius: 12,
                      padding: 20,
                      border: `1px solid ${p.featured ? `${color}33` : 'rgba(255,255,255,0.08)'}`,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                        <span style={{ width: 7, height: 7, borderRadius: 2, background: color, boxShadow: `0 0 8px ${color}99`, flexShrink: 0 }} />
                        <span className="font-jet" style={{ fontWeight: 700, fontSize: 14.5, color: '#f4f6f1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.title}
                        </span>
                      </div>
                      <span
                        className="font-jet uppercase"
                        style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em', color, border: `1px solid ${color}33`, background: `${color}12`, borderRadius: 5, padding: '3px 8px', whiteSpace: 'nowrap' }}
                      >
                        {p.category}
                      </span>
                    </div>

                    <p style={{ fontSize: 13, lineHeight: 1.6, color: '#9aa093', minHeight: 62, marginTop: 14 }}>{p.description}</p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                      {p.tech.map((t) => (
                        <span key={t} className="font-jet" style={{ fontSize: 10.5, color: '#8b9085', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 5, padding: '3px 8px' }}>
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="font-jet" style={{ display: 'flex', gap: 14, marginTop: 'auto', paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 12 }}>
                      {p.code && (
                        <a href={p.code} target="_blank" rel="noopener noreferrer" className="link-code" style={{ color: '#9aa093' }}>
                          code ↗
                        </a>
                      )}
                      {p.demo && (
                        <a href={p.demo} target="_blank" rel="noopener noreferrer" className="link-demo" style={{ color: ACCENT }}>
                          live demo →
                        </a>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <a href="https://github.com/ianalloway" target="_blank" rel="noopener noreferrer" className="font-jet link-code" style={{ fontSize: 13.5, color: '#8b9085' }}>
                See all 47 repos on GitHub →
              </a>
            </div>
          </div>
        </section>

        {/* ── 4. Capabilities ── */}
        <section id="capabilities" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.008)' }}>
          <div style={{ maxWidth: 1120, margin: '0 auto', padding: '80px 32px' }}>
            <Eyebrow>// capabilities</Eyebrow>
            <h2 className="font-display" style={{ fontWeight: 600, fontSize: 'clamp(30px,4.4vw,44px)', letterSpacing: '-0.025em', color: '#f4f6f1', maxWidth: 640, marginBottom: 44 }}>
              From feature engineering to deployment
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 1,
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14,
                overflow: 'hidden',
              }}
            >
              {CAPABILITIES.map((c) => (
                <div key={c.n} className="cap-cell" style={{ background: '#0c0e0c', padding: '28px 24px' }}>
                  <div className="font-jet" style={{ fontSize: 11, color: ACCENT, marginBottom: 18 }}>{c.n}</div>
                  <h3 className="font-display" style={{ fontWeight: 600, fontSize: 18, color: '#f4f6f1', marginBottom: 10 }}>{c.title}</h3>
                  <p style={{ fontSize: 13.5, lineHeight: 1.6, color: '#8b9085', marginBottom: 16 }}>{c.desc}</p>
                  <div className="font-jet" style={{ display: 'flex', flexWrap: 'wrap', gap: 5, fontSize: 10, color: '#6f756a' }}>
                    {c.tags.map((t, i) => (
                      <span key={t}>{t}{i < c.tags.length - 1 ? ' ·' : ''}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5. Measured Impact + Timeline ── */}
        <section id="about" style={{ padding: '80px 32px' }}>
          <div style={{ maxWidth: 1120, margin: '0 auto' }} className="impact-grid">
            {/* Measured Impact */}
            <div>
              <Eyebrow>// measured_impact</Eyebrow>
              <h2 className="font-display" style={{ fontWeight: 600, fontSize: 'clamp(26px,3.4vw,36px)', letterSpacing: '-0.02em', color: '#f4f6f1', marginBottom: 26 }}>
                Results, not adjectives
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {IMPACT.map((s) => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'baseline', gap: 18, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 11, padding: '16px 20px', background: 'rgba(255,255,255,0.012)' }}>
                    <div className="font-display" style={{ fontWeight: 700, fontSize: 34, color: ACCENT, letterSpacing: '-0.03em', minWidth: 96 }}>{s.num}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#e8eae6' }}>{s.label}</div>
                      <div className="font-jet" style={{ fontSize: 11.5, color: '#8b9085', marginTop: 2 }}>{s.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div>
              <Eyebrow>// timeline</Eyebrow>
              <div style={{ position: 'relative', paddingLeft: 26, marginTop: 8 }}>
                <div
                  aria-hidden
                  style={{ position: 'absolute', left: 3, top: 4, bottom: 4, width: 1, background: 'linear-gradient(to bottom, transparent, rgba(91,228,155,0.35), transparent)' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                  {TIMELINE.map((t, i) => (
                    <div key={`${t.year}-${i}`} style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: -22, top: 4, width: 7, height: 7, borderRadius: 2, background: t.color, boxShadow: `0 0 8px ${t.color}99` }} />
                      <span className="font-jet" style={{ fontSize: 11.5, fontWeight: 700, color: t.color, marginRight: 10 }}>{t.year}</span>
                      <span style={{ fontSize: 13.5, color: '#c4c9bd' }}>{t.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 6. Agents ── */}
        <section id="agents" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.008)' }}>
          <div style={{ maxWidth: 1120, margin: '0 auto', padding: '80px 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20, marginBottom: 32 }}>
              <div>
                <Eyebrow>// run_the_agents</Eyebrow>
                <h2 className="font-display" style={{ fontWeight: 600, fontSize: 'clamp(30px,4.4vw,44px)', letterSpacing: '-0.025em', color: '#f4f6f1' }}>
                  Try them in your terminal
                </h2>
              </div>
              <p style={{ fontSize: 14.5, color: '#8b9085', maxWidth: 330 }}>
                Copy-paste to run each agent locally. SOLVENT needs zero API keys for the demo — the others have quick no-key paths too.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {AGENTS.map((a) => (
                <div key={a.id} style={{ background: '#0c0e0c', borderRadius: 14, border: `1px solid ${a.accent}2e`, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#3a3f35' }} />
                      <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#3a3f35' }} />
                      <span style={{ width: 11, height: 11, borderRadius: '50%', background: a.accent }} />
                    </div>
                    <span className="font-jet" style={{ fontWeight: 700, fontSize: 15, color: '#f4f6f1' }}>{a.name}</span>
                    <span style={{ fontSize: 13, color: '#8b9085' }}>{a.tagline}</span>
                    <a href={a.repoUrl} target="_blank" rel="noopener noreferrer" className="font-jet link-code" style={{ fontSize: 11.5, color: '#8b9085', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                      {a.repo} ↗
                    </a>
                  </div>
                  <div style={{ padding: '22px 20px' }}>
                    <p style={{ fontSize: 13.5, lineHeight: 1.65, color: '#9aa093', maxWidth: 760, marginBottom: 16 }}>{a.desc}</p>
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={() => copy(a.id, a.command)}
                        aria-label={`Copy ${a.name} install command`}
                        className="font-jet"
                        style={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          fontSize: 11,
                          fontWeight: 500,
                          padding: '5px 11px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          transition: 'all .18s',
                          color: copied === a.id ? a.accent : '#9aa093',
                          border: `1px solid ${copied === a.id ? a.accent : 'rgba(255,255,255,0.14)'}`,
                          background: copied === a.id ? `${a.accent}18` : 'rgba(255,255,255,0.04)',
                        }}
                      >
                        {copied === a.id ? 'copied ✓' : 'copy'}
                      </button>
                      <pre
                        className="font-jet"
                        style={{ background: '#060706', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, padding: '16px 18px', fontSize: 12.5, lineHeight: 1.7, color: '#c4f3d6', overflowX: 'auto', margin: 0 }}
                      >
                        {a.command}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 6.5. Writing ── */}
        <section id="writing" style={{ padding: '80px 32px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ maxWidth: 1120, margin: '0 auto' }}>
            <Eyebrow>// writing</Eyebrow>
            <h2 className="font-display" style={{ fontWeight: 700, fontSize: 'clamp(28px,4vw,40px)', letterSpacing: '-0.03em', color: '#f4f6f1', marginBottom: 12 }}>
              Notes from the loop
            </h2>
            <p style={{ fontSize: 14.5, color: '#9aa093', maxWidth: 560, marginBottom: 32 }}>
              I write about evaluation, agent systems, and applied ML on Substack. New posts drop when I learn something worth writing down.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 28 }}>
              <a
                href="https://allowayai.substack.com/p/i-gave-an-ai-agent-a-stripe-key-and-walked-away-heres-what-it-built"
                target="_blank"
                rel="noopener noreferrer"
                className="font-jet link-code"
                style={{ display: 'block', padding: '20px 22px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, background: 'rgba(255,255,255,0.012)', color: '#cdd2c5' }}
              >
                <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: ACCENT, marginBottom: 8 }}>Featured · Jun 2026</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#f4f6f1', marginBottom: 6, lineHeight: 1.3 }}>I Gave an AI Agent a Stripe Key and Walked Away</div>
                <div style={{ fontSize: 13, color: '#8b9085', lineHeight: 1.5 }}>Most agents can spend money. Almost none can run as a business. Notes from solvent-agent.</div>
              </a>
              <a
                href="https://allowayai.substack.com/p/audit-your-llm-judges-before-you-trust-them"
                target="_blank"
                rel="noopener noreferrer"
                className="font-jet link-code"
                style={{ display: 'block', padding: '20px 22px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, background: 'rgba(255,255,255,0.012)', color: '#cdd2c5' }}
              >
                <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: ACCENT, marginBottom: 8 }}>Essay · Jun 2026</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#f4f6f1', marginBottom: 6, lineHeight: 1.3 }}>Audit Your LLM Judges Before You Trust Them</div>
                <div style={{ fontSize: 13, color: '#8b9085', lineHeight: 1.5 }}>LLM-as-judge is useful, cheap, and everywhere. It also has vibes, blind spots, and the confidence of a toaster giving legal advice.</div>
              </a>
              <a
                href="https://allowayai.substack.com/p/the-ghost-in-the-machine-why-your-ai-needs-a-memory-not-just-a-prompt"
                target="_blank"
                rel="noopener noreferrer"
                className="font-jet link-code"
                style={{ display: 'block', padding: '20px 22px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, background: 'rgba(255,255,255,0.012)', color: '#cdd2c5' }}
              >
                <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: ACCENT, marginBottom: 8 }}>Reflection · May 2026</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#f4f6f1', marginBottom: 6, lineHeight: 1.3 }}>The Ghost in the Machine: Memory, Not Just a Prompt</div>
                <div style={{ fontSize: 13, color: '#8b9085', lineHeight: 1.5 }}>Treating my AI as a partner, not a tool. What I learned shipping a memory layer.</div>
              </a>
            </div>
            <a
              href="https://allowayai.substack.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-jet btn-outline"
              style={{ display: 'inline-block', fontSize: 13, color: '#d6dbcf', border: '1px solid rgba(255,255,255,0.13)', padding: '12px 22px', borderRadius: 8 }}
            >
              Subscribe to the Substack →
            </a>
            <Newsletter />
          </div>
        </section>

        {/* ── 7. Contact ── */}
        <section id="contact" style={{ padding: '96px 32px' }}>
          <div
            style={{
              maxWidth: 820,
              margin: '0 auto',
              border: '1px solid rgba(91,228,155,0.22)',
              borderRadius: 18,
              background: 'radial-gradient(ellipse at top, rgba(91,228,155,0.06), transparent 70%)',
              padding: 'clamp(40px,6vw,72px) clamp(28px,5vw,64px)',
              textAlign: 'center',
            }}
          >
            <p className="font-jet" style={{ fontSize: 13, color: '#8b9085', marginBottom: 18 }}>
              <span style={{ color: ACCENT }}>&gt;</span> let&apos;s build something measurable
            </p>
            <h2 className="font-display" style={{ fontWeight: 700, fontSize: 'clamp(32px,5vw,52px)', letterSpacing: '-0.03em', color: '#f4f6f1', marginBottom: 18 }}>
              Open to roles &amp; collaborations
            </h2>
            <p style={{ fontSize: 16, color: '#9aa093', maxWidth: 520, margin: '0 auto 32px' }}>
              Recruiting, consulting, or just want to talk evaluation-first ML? The fastest way to reach me is email.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginBottom: 30 }}>
              <a href="mailto:ian@allowayllc.com" className="font-jet btn-glow" style={{ fontSize: 14, color: '#0a0b0a', background: ACCENT, padding: '14px 28px', borderRadius: 9 }}>
                ian@allowayllc.com
              </a>
              <a href="/Ian_Alloway_Resume_CV.pdf" download className="font-jet btn-outline" style={{ fontSize: 14, color: '#d6dbcf', border: '1px solid rgba(255,255,255,0.13)', padding: '14px 26px', borderRadius: 9 }}>
                Download résumé ↓
              </a>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
              {[
                ['GitHub', 'https://github.com/ianalloway'],
                ['LinkedIn', 'https://www.linkedin.com/in/ianit'],
                ['Twitter / X', 'https://x.com/ianallowayxyz'],
                ['Substack', 'https://allowayai.substack.com'],
              ].map(([label, href]) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="font-jet social-pill" style={{ fontSize: 12.5, color: '#9aa093', border: `1px solid ${HAIRLINE}`, borderRadius: 100, padding: '8px 16px' }}>
                  {label}
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className={shell} style={{ padding: '30px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: ACCENT }} />
              <span className="font-jet" style={{ fontSize: 12.5, color: '#8b9085' }}>ian.alloway · ML engineer &amp; data scientist</span>
            </div>
            <span className="font-jet" style={{ fontSize: 11.5, color: '#8b9085' }}>© 2026 Alloway LLC · ianalloway.xyz</span>
          </div>
        </footer>
      </main>

      {/* Scoped hover styles for this page */}
      <style>{`
        .nav-link { transition: color .18s, background .18s; }
        .nav-link:hover { color: #e8eae6 !important; background: rgba(255,255,255,0.05); }
        .btn-glow { transition: box-shadow .2s; }
        .btn-glow:hover { box-shadow: 0 0 26px rgba(91,228,155,0.42); }
        .btn-outline { transition: border-color .2s, background .2s; }
        .btn-outline:hover { border-color: rgba(91,228,155,0.45) !important; background: rgba(91,228,155,0.05); }
        .cap-cell { transition: background .18s; }
        .cap-cell:hover { background: #101310 !important; }
        .link-code { transition: color .18s; }
        .link-code:hover { color: #5be49b !important; }
        .link-demo { transition: color .18s; }
        .link-demo:hover { color: #9fe9c1 !important; }
        .social-pill { transition: color .18s, border-color .18s; }
        @media (min-width: 480px) {
          .hero-metrics-grid { gridTemplateColumns: repeat(4, 1fr) !important; }
        }
        .social-pill:hover { color: #5be49b !important; border-color: rgba(91,228,155,0.4) !important; }
        .impact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: start; }
        @media (max-width: 860px) { .impact-grid { grid-template-columns: 1fr; gap: 48px; } }
      `}</style>
    </div>
  );
};

export default Index;
