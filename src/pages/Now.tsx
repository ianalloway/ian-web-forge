import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Terminal, ArrowLeft, Book, Code, Brain, Music, MapPin, Target, Zap, Coffee, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MatrixRain from '@/components/MatrixRain';

const LAST_UPDATED = 'February 2026';

const NOW_DATA = {
  focus: {
    title: 'Main Focus',
    icon: Target,
    items: [
      'Finishing my B.S. Data Science thesis — Adversarial robustness in sports prediction models',
      'Growing AI Advantage Sports to 500 premium subscribers',
      'Contributing weekly to OpenClaw — currently refactoring the skill resolution pipeline',
      'Preparing applications for MSAI program start (Aug 2026)',
    ],
  },
  building: {
    title: 'Currently Building',
    icon: Code,
    items: [
      'AI Advantage Sports — daily picks engine, leaderboard, and live odds integration',
      'openclaw-skills v2 — dfs-optimizer, bet-journal, market-sentiment, streak-tracker',
      'Personal RAG pipeline over my Substack posts for a "chat with my writing" feature',
      'Drone AI — integrating YOLOv8 v10 for better real-time obstacle detection',
    ],
  },
  learning: {
    title: 'Currently Learning',
    icon: GraduationCap,
    items: [
      'Reinforcement learning from human feedback (RLHF) — working through Anthropic\'s alignment papers',
      'Rust — building CLI tools feels cleaner than Python for performance-critical work',
      'Advanced SQL window functions and query plan optimization for analytics pipelines',
      'Transformer architecture internals — reading "Attention Is All You Need" and follow-ups',
    ],
  },
  reading: {
    title: 'Currently Reading',
    icon: Book,
    items: [
      '"The Alignment Problem" — Brian Christian (understanding AI safety from first principles)',
      '"Thinking in Bets" — Annie Duke (rereading for the 3rd time, always find something new)',
      '"The Art of Statistics" — David Spiegelhalter (stats communication is underrated)',
      'Anthropic research blog — Constitutional AI, interpretability, scaling laws',
    ],
  },
  tools: {
    title: 'Daily Tools',
    icon: Zap,
    items: [
      'Claude Sonnet 4.6 — primary coding assistant, replaced GPT-4 entirely',
      'Cursor — AI-native editor for heavy refactoring sessions',
      'OpenClaw — my personal assistant, runs in terminal + Telegram + Discord',
      'Convex — realtime database for ClawHub and side projects',
      'Vercel + Netlify — deploy everything, zero config headaches',
    ],
  },
  listening: {
    title: 'On Repeat',
    icon: Music,
    items: [
      'Lofi hip-hop for deep work sessions — 90s lo-fi beats playlist',
      'Lex Fridman Podcast — long-form AI/CS/physics conversations',
      'My First Million — business idea generation fuel',
      'The Bill Simmons Podcast — sports takes and NBA deep dives',
    ],
  },
  location: {
    title: 'Where I Am',
    icon: MapPin,
    items: [
      'Fairmont, WV — home base, remote-first',
      'University of South Florida (Tampa) — campus visits for thesis work',
      'Remote-first since 2020, building everywhere',
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
  const navigate = useNavigate();
  const [theme] = useState<'matrix' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'matrix' | 'light') || 'matrix';
    }
    return 'matrix';
  });

  useEffect(() => {
    document.title = '/now — Ian Alloway';
    return () => { document.title = 'Ian Alloway'; };
  }, []);

  return (
    <div className="min-h-screen bg-background relative">
      {theme === 'matrix' && <MatrixRain />}

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-10">
        {/* Back nav */}
        <Button
          variant="ghost"
          className="font-mono text-primary border border-primary/30 hover:bg-primary/10 mb-8 text-sm"
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={14} className="mr-2" />
          [BACK]
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
