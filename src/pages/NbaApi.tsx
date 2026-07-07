import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Code2,
  DollarSign,
  Gauge,
  GitBranch as Github,
  HelpCircle,
  Mail,
  Radio,
  Server,
  Target,
  Terminal,
  TrendingUp,
  Webhook,
  Zap,
} from 'lucide-react';
import MatrixRain from '@/components/MatrixRain';

const tickerStats = [
  { label: '68.3%', detail: 'Backtested accuracy', icon: Target },
  { label: 'XGBoost + Kelly', detail: 'Classifier & bet sizing', icon: BarChart3 },
  { label: 'REST API', detail: 'JSON over HTTPS', icon: Server },
];

const pricingTiers = [
  {
    name: 'Starter',
    price: '$29',
    cadence: '/mo',
    blurb: 'For builders kicking the tires and running nightly picks.',
    features: [
      '10 calls / day',
      'Daily picks endpoint',
      'Basic stats & accuracy feed',
      'Community support',
    ],
    cta: 'Start with Starter',
    featured: false,
    icon: Zap,
  },
  {
    name: 'Pro',
    price: '$99',
    cadence: '/mo',
    blurb: 'For serious modelers who want Kelly sizing and backtest access.',
    features: [
      '100 calls / day',
      'Kelly criterion bet sizing',
      'Backtest access & historical runs',
      'Webhook alerts on new picks',
      'Priority email support',
    ],
    cta: 'Go Pro',
    featured: true,
    icon: TrendingUp,
  },
  {
    name: 'Team',
    price: '$299',
    cadence: '/mo',
    blurb: 'For desks and teams that need throughput and guarantees.',
    features: [
      'Unlimited calls',
      'Custom models & feature sets',
      '99.9% uptime SLA',
      'Priority support + onboarding',
      'Dedicated rate ceiling',
    ],
    cta: 'Talk to us',
    featured: false,
    icon: Gauge,
  },
];

const curlLines = [
  'curl https://api.nba-edge.com/v1/picks/today ' + String.fromCharCode(92),
  '  -H "Authorization: Bearer YOUR_API_KEY"',
];
const curlCommand = curlLines.join('\n');

const apiResponse = [
  '{',
  '  "date": "2026-03-14",',
  '  "model": "xgb-nba-v3",',
  '  "picks": [',
  '    {',
  '      "game_id": "nba_20260314_LAL_BOS",',
  '      "away": "Lakers",',
  '      "home": "Celtics",',
  '      "predicted_winner": "Celtics",',
  '      "win_probability": 0.712,',
  '      "confidence": "high",',
  '      "kelly_fraction": 0.084,',
  '      "suggested_units": 0.84,',
  '      "features": {',
  '        "elo_diff": 64.2,',
  '        "home_advantage": true,',
  '        "rest_days_home": 2,',
  '        "recent_form_home": 0.71',
  '      }',
  '    }',
  '  ],',
  '  "meta": {',
  '    "accuracy_30d": 0.683,',
  '    "generated_at": "2026-03-14T18:00:00Z"',
  '  }',
  '}',
].join('\n');

const faqs = [
  {
    q: 'Is this financial advice?',
    a: 'No. NBA Edge API is an analytics and research product. It outputs probabilities and suggested bet sizing for informational and entertainment purposes only. You are responsible for your own decisions and any wagers you place.',
  },
  {
    q: 'How fresh are predictions?',
    a: 'Predictions are updated hourly during the season, incorporating the latest rosters, injury reports, rest days, and recent form. The meta.generated_at timestamp on every response tells you exactly when the last run fired.',
  },
  {
    q: 'What sports are covered?',
    a: 'NBA today. The same Elo + form + XGBoost pipeline is expanding to NFL next, with the same model discipline and backtesting standards. Reach out if you want early access to the NFL alpha.',
  },
];

const CTA_EMAIL = 'mailto:ian@allowayllc.com?subject=NBA%20Edge%20API%20Access';

const NbaApi = () => {
  const [mounted, setMounted] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    if (mounted) {
      return;
    }

    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, [mounted]);

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono overflow-x-hidden">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-green-500 px-4 py-2 text-sm font-semibold text-black focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
      >
        Skip to main content
      </a>
      <MatrixRain />

      <header className="fixed top-0 left-0 right-0 z-50 bg-black/82 backdrop-blur-md border-b border-green-500/20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="text-lg md:text-xl font-bold tracking-tight hover:text-green-300 transition-colors flex items-center gap-2">
            <Terminal size={18} /> NBA.EDGE
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-green-400/80">
            <a href="#pricing" className="hover:text-green-300 transition-colors">PRICING</a>
            <a href="#api" className="hover:text-green-300 transition-colors">API</a>
            <a href="#faq" className="hover:text-green-300 transition-colors">FAQ</a>
            <a href="#contact" className="hover:text-green-300 transition-colors">ACCESS</a>
          </nav>
        </div>
      </header>

      <main id="main-content">
        {/* Back link */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 pt-24">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-green-400/70 hover:text-green-300 transition-colors"
          >
            <ArrowLeft size={15} /> Back to portfolio
          </Link>
        </div>

        {/* Hero */}
        <section className="relative z-10 px-4 pt-8 pb-12 md:pt-12 md:pb-16">
          <div className="max-w-6xl mx-auto">
            <div className={`transition-[opacity,transform] duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <Badge className="mb-5 bg-green-500/10 text-green-300 border-green-500/30 hover:bg-green-500/10">
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                LIVE • api.nba-edge.com
              </Badge>
              <h1 className="text-5xl md:text-7xl font-bold leading-[0.95] tracking-tight text-white mb-5">
                NBA Edge API
              </h1>
              <p className="text-lg md:text-2xl text-green-300/90 max-w-3xl mb-3">
                68.3% backtested accuracy. Kelly-sized. API-first.
              </p>
              <p className="text-sm md:text-base text-green-400/65 max-w-2xl leading-relaxed mb-8">
                An XGBoost classifier trained on Elo ratings, recent form, rest days, home court, and
                injuries — published as a REST API with Kelly criterion bet sizing on every pick.
                Ship probabilities to your stack, not a spreadsheet.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button className="bg-green-500 text-black hover:bg-green-400 font-mono" asChild>
                  <a href={CTA_EMAIL}>
                    <Mail className="mr-2" size={16} /> Get API access
                  </a>
                </Button>
                <Button variant="outline" className="border-green-500/40 text-green-300 hover:bg-green-500/10 font-mono" asChild>
                  <a href="https://github.com/ianalloway/ai-advantage" target="_blank" rel="noopener noreferrer">
                    <Github className="mr-2" size={16} /> View the model
                  </a>
                </Button>
                <Button variant="outline" className="border-green-500/40 text-green-300 hover:bg-green-500/10 font-mono" asChild>
                  <a href="#pricing">
                    <DollarSign className="mr-2" size={16} /> See pricing
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stat ticker */}
        <section className="relative z-10 px-4 pb-8">
          <div className="max-w-6xl mx-auto">
            <div className="rounded-2xl border border-green-500/20 bg-black/60 backdrop-blur-sm divide-y divide-green-500/10 md:divide-y-0 md:divide-x md:grid md:grid-cols-3">
              {tickerStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="flex items-center gap-4 px-6 py-5">
                    <Icon size={22} className="text-green-300 shrink-0" />
                    <div>
                      <div className="text-xl md:text-2xl font-bold text-white">{stat.label}</div>
                      <div className="text-xs text-green-400/65 uppercase tracking-[0.15em]">{stat.detail}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="relative z-10 px-4 py-16">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-3xl mb-10">
              <p className="text-xs uppercase tracking-[0.2em] text-green-400/65 mb-3">Pricing</p>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Pick a tier. Get a key. Ship picks tonight.
              </h2>
              <p className="text-sm md:text-base text-green-400/72 leading-relaxed">
                Every tier includes the same 68.3%-accuracy model. You trade up on throughput,
                Kelly sizing, and support.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3 items-stretch">
              {pricingTiers.map((tier) => {
                const Icon = tier.icon;
                const isFeatured = tier.featured;
                return (
                  <Card
                    key={tier.name}
                    className={
                      'flex flex-col border bg-black/55 backdrop-blur-sm ' +
                      (isFeatured
                        ? 'border-green-400/60 md:-translate-y-3 shadow-[0_0_40px_-12px_rgba(91,228,155,0.45)]'
                        : 'border-green-500/20')
                    }
                  >
                    <CardContent className="p-6 flex flex-col flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Icon size={18} className="text-green-300" />
                          <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                        </div>
                        {isFeatured && (
                          <Badge className="bg-green-500/15 text-green-200 border-green-400/40 hover:bg-green-500/15">
                            POPULAR
                          </Badge>
                        )}
                      </div>

                      <div className="mb-2 flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-white">{tier.price}</span>
                        <span className="text-sm text-green-400/65">{tier.cadence}</span>
                      </div>
                      <p className="text-sm text-green-400/72 leading-relaxed mb-6">{tier.blurb}</p>

                      <ul className="space-y-3 mb-8 flex-1">
                        {tier.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2 text-sm text-green-400/80">
                            <CheckCircle2 size={16} className="text-green-300 mt-0.5 shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        className={
                          'font-mono ' +
                          (isFeatured
                            ? 'bg-green-500 text-black hover:bg-green-400'
                            : 'border border-green-500/40 text-green-300 hover:bg-green-500/10 bg-transparent')
                        }
                        variant={isFeatured ? 'default' : 'outline'}
                        asChild
                      >
                        <a href={CTA_EMAIL}>
                          {tier.cta} <ArrowRight className="ml-2" size={15} />
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <p className="mt-6 text-xs text-green-400/55 text-center">
              All plans are billed monthly. Cancel anytime. Not financial advice — see FAQ.
            </p>
          </div>
        </section>

        {/* API preview */}
        <section id="api" className="relative z-10 px-4 py-16 bg-green-500/5">
          <div className="max-w-6xl mx-auto grid gap-10 lg:grid-cols-2 lg:items-start">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-green-400/65 mb-3">API Preview</p>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                One request. Probabilities, confidence, and Kelly sizing.
              </h2>
              <p className="text-sm md:text-base text-green-400/72 leading-relaxed mb-6">
                Standard REST over HTTPS with a bearer token. Every response includes win probability,
                a confidence band, the Kelly fraction, suggested units, and the feature snapshot that
                drove the call — so you can audit the model, not just trust it.
              </p>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-green-400/80">
                  <Code2 size={16} className="text-green-300" /> Base: <code className="text-green-200">https://api.nba-edge.com/v1</code>
                </div>
                <div className="flex items-center gap-2 text-green-400/80">
                  <Radio size={16} className="text-green-300" /> Auth: Bearer token in <code className="text-green-200">Authorization</code> header
                </div>
                <div className="flex items-center gap-2 text-green-400/80">
                  <Activity size={16} className="text-green-300" /> Rate limits: per-tier daily quotas
                </div>
                <div className="flex items-center gap-2 text-green-400/80">
                  <Webhook size={16} className="text-green-300" /> Pro+: Webhook delivery on new picks
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-green-500/20 bg-black/80 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 border-b border-green-500/15 bg-green-500/5">
                  <span className="h-3 w-3 rounded-full bg-red-500/70" />
                  <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
                  <span className="h-3 w-3 rounded-full bg-green-500/70" />
                  <span className="ml-2 text-xs text-green-400/60 font-mono">request.sh</span>
                </div>
                <pre className="p-4 overflow-x-auto text-xs md:text-sm text-green-300/90 leading-relaxed"><code>{curlCommand}</code></pre>
              </div>

              <div className="rounded-xl border border-green-500/20 bg-black/80 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 border-b border-green-500/15 bg-green-500/5">
                  <Server size={14} className="text-green-400/70" />
                  <span className="text-xs text-green-400/60 font-mono">response.json</span>
                  <span className="ml-auto text-[10px] text-green-400/50">200 OK</span>
                </div>
                <pre className="p-4 overflow-x-auto text-xs md:text-sm text-green-200/90 leading-relaxed"><code>{apiResponse}</code></pre>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="relative z-10 px-4 py-16">
          <div className="max-w-3xl mx-auto">
            <div className="mb-10">
              <p className="text-xs uppercase tracking-[0.2em] text-green-400/65 mb-3">FAQ</p>
              <h2 className="text-3xl md:text-4xl font-bold text-white">Questions, answered straight.</h2>
            </div>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div
                  key={faq.q}
                  className="rounded-2xl border border-green-500/20 bg-black/50 backdrop-blur-sm px-5 py-5"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <HelpCircle size={18} className="text-green-300 mt-0.5 shrink-0" />
                    <h3 className="text-base md:text-lg font-semibold text-white">{faq.q}</h3>
                  </div>
                  <p className="text-sm text-green-400/75 leading-relaxed pl-7">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section id="contact" className="relative z-10 px-4 py-16">
          <div className="max-w-5xl mx-auto rounded-[28px] border border-green-500/20 bg-green-500/5 p-8 md:p-10 backdrop-blur-sm">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-green-400/65 mb-3">Get API access</p>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Email for a key and we’ll get you live today.
                </h2>
                <p className="text-sm md:text-base text-green-400/72 leading-relaxed max-w-2xl">
                  Drop a line with the tier you want and your intended use case. You’ll get a bearer
                  token, base URL, and example clients to wire into your stack.
                </p>
              </div>
              <div className="flex flex-col gap-3 min-w-[220px]">
                <Button className="bg-green-500 text-black hover:bg-green-400 font-mono" asChild>
                  <a href={CTA_EMAIL}>
                    <Mail className="mr-2" size={16} /> Get API access
                  </a>
                </Button>
                <Button variant="outline" className="border-green-500/40 text-green-300 hover:bg-green-500/10 font-mono" asChild>
                  <a href="https://github.com/ianalloway/ai-advantage" target="_blank" rel="noopener noreferrer">
                    <Github className="mr-2" size={16} /> View the model
                  </a>
                </Button>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center gap-2 text-sm text-green-400/70 hover:text-green-300 transition-colors mt-1"
                >
                  <ArrowLeft size={15} /> Back to portfolio
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default NbaApi;
