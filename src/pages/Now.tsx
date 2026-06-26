import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Terminal, ArrowLeft, Book, Code, Brain, Music, MapPin, Target, Zap, Coffee, GraduationCap } from 'lucide-react';
import MatrixRain from '@/components/MatrixRain';
import { applyTheme, getStoredTheme, type SiteTheme } from '@/lib/theme';

const LAST_UPDATED = 'July 2026';

const NOW_DATA = {
  focus: {
    title: 'Main Focus',
    icon: Target,
    items: [
      'Shipping SOLVENT (self-funding AI agent) to v1.0 with stable Stripe webhooks + LLM fulfillment',
      'Pushing nba-edge from 68.3% to 70% accuracy with real-time injury data and rest-day features',
      'Interviewing for ML engineering roles — focused on AI evaluation and applied systems teams',
      'Finishing my M.S. in AI at USF — capstone on LLM judge calibration',
    ],
  },
  building: {
    title: 'Currently Building',
    icon: Code,
    items: [
      'solvent-agent v0.2 — adding P&L reporting, multi-job queue, and Stripe Issuing integration',
      'juryrig v0.2 — releasing prompt-injection audit and drift monitoring probes',
      'nba-clv-dashboard v2 — adding live calibration charts and CLV-by-strategy breakdowns',
      'openclaw-skills bundles — Sports Bettor, Crypto Watcher, Developer Power Tools',
    ],
  },
  learning: {
    title: 'Currently Learning',
    icon: GraduationCap,
    items: [
      'Multi-agent orchestration — reading DeepMind and Anthropic multi-agent papers, evaluating LangGraph vs Autogen vs custom',
      'Post-training RL — RLHF, DPO, GRPO. How do you measure alignment without gaming?',
      'Stripe Issuing limits and treasury flows — what it takes to run a real economic agent in production',
      'Time-series foundation models — Chronos, TimesFM, Mamba. Are they better than XGBoost for NBA?',
    ],
  },
  reading: {
    title: 'Currently Reading',
    icon: Book,
    items: [
      '"The Beginning of Infinity" — David Deutsch (on knowledge, error, and the nature of progress)',
      'Anthropic interpretability research — circuit-level analysis of LLM features',
      'A selection of LLM judge papers: Zheng MT-Bench, Wang Fair Evaluators, recent 2026 work',
      'Stripe engineering blog — webhook reliability at scale',
    ],
  },
  tools: {
    title: 'Daily Tools',
    icon: Zap,
    items: [
      'Claude Sonnet 4.6 + o1 — primary coding + reasoning models',
      'Cursor — AI-native editor for heavy refactoring sessions',
      'OpenClaw — my personal assistant, runs in terminal + Telegram + Discord',
      'Vercel — deploy everything, zero config',
      'Stripe + Stripe Issuing — production payment infrastructure for solvent-agent',
    ],
  },
  listening: {
    title: 'On Repeat',
    icon: Music,
    items: [
      'Lex Fridman Podcast — long-form AI/CS/physics conversations',
      'Latent Space — the AI engineering podcast, very tactical',
      'My First Million — business idea generation fuel',
      'The Bill Simmons Podcast — sports takes and NBA deep dives',
    ],
  },
  location: {
    title: 'Where I Am',
    icon: MapPin,
    items: [
      'Tampa, FL — University of South Florida, finishing M.S. in AI',
      'Open to remote ML engineer / applied AI roles',
      'Available for LLM evaluation consulting engagements',
    ],
  },
  not: {
    title: 'NOT Doing Right Now',
    icon: Coffee,
    items: [
      'Taking on freelance clients — fully heads-down on product work until May',
      'Social media growth hacking — just shipping and letting the work speak',
      'Anything that doesn\'t compound (one-off gigs, unfocused side projects)',
    ],
  },
};

type NowSection = typeof NOW_DATA[keyof typeof NOW_DATA];

function NowCard({ section }: { section: NowSection }) {
  const Icon = section.icon;
  return (
    <Card className="terminal-border bg-card/80 backdrop-blur-sm">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Icon className="text-primary" size={18} />
          <h3 className="text-primary font-bold font-mono text-sm uppercase tracking-wider">
            {section.title}
          </h3>
        </div>
        <ul className="space-y-2">
          {section.items.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm font-mono text-muted-foreground">
              <span className="text-primary/40 mt-0.5 flex-shrink-0">&gt;</span>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default function Now() {
  const [theme] = useState<SiteTheme>(() => getStoredTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <div className="min-h-screen bg-background relative">
      {theme === 'matrix' && <MatrixRain />}

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-10">
        {/* Back nav */}
        <Button
          variant="ghost"
          className="mb-8 border border-primary/30 font-mono text-sm text-primary hover:bg-primary/10"
          asChild
        >
          <Link to="/">
            <ArrowLeft size={14} className="mr-2" />
            [BACK]
          </Link>
        </Button>

        {/* Header */}
        <div className="mb-10">
          <div className="inline-block px-3 py-1 terminal-border text-primary text-xs mb-4 font-mono">
            <span className="inline-block w-2 h-2 bg-primary rounded-full mr-2 animate-pulse" />
            LIVE_SNAPSHOT
          </div>
          <h1 className="text-4xl font-bold matrix-text font-mono text-primary mb-2">
            <Terminal className="inline mr-3" size={32} />
            /now
          </h1>
          <p className="text-muted-foreground font-mono text-sm">
            What Ian is focused on right now. Inspired by{' '}
            <a
              href="https://nownownow.com/about"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Derek Sivers' /now pages
            </a>
            .
          </p>
          <p className="text-muted-foreground/50 font-mono text-xs mt-1">
            Last updated: {LAST_UPDATED}
          </p>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {Object.values(NOW_DATA).map((section) => (
            <NowCard key={section.title} section={section} />
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-10 p-4 terminal-border text-center">
          <p className="text-muted-foreground/60 font-mono text-xs">
            &gt; This page is updated manually when life changes significantly.
            <br />
            &gt; Have a question about something above?{' '}
            <a href="mailto:ian@allowayllc.com" className="text-primary hover:underline">
              ian@allowayllc.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
