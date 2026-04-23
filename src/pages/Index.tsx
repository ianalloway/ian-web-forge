import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowRight,
  BarChart3,
  Brain,
  Briefcase,
  CheckCircle2,
  Code,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Github,
  GraduationCap,
  Heart,
  Linkedin,
  Mail,
  Moon,
  Package,
  Sun,
  Terminal,
} from 'lucide-react';
import MatrixRain from '@/components/MatrixRain';
import SubstackEmbed from '@/components/SubstackEmbed';
import { useToast } from '@/components/ui/use-toast';
import { applyTheme, getStoredTheme, type SiteTheme } from '@/lib/theme';

const ETH_DONATION_ADDRESS = '0x6f278ce76ba5ed31fd9be646d074863e126836e9';

// Animated counter
function useCounter(target: number, visible: boolean, decimals = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const steps = 50;
    const inc = target / steps;
    let cur = 0;
    const t = setInterval(() => {
      cur += inc;
      if (cur >= target) { setVal(target); clearInterval(t); }
      else setVal(parseFloat(cur.toFixed(decimals)));
    }, 1200 / steps);
    return () => clearInterval(t);
  }, [visible, target, decimals]);
  return val;
}

const outcomes = [
  'Built ML/data products used by real users',
  'Shipped evaluation dashboards and analytics tooling',
  'Production Python, FastAPI, SQL, and TypeScript',
  'Open-source work across ML, reporting, and decision-support systems',
];

const proofCards = [
  {
    title: 'Applied ML products, not notebook leftovers',
    stack: 'Python, XGBoost, React, FastAPI',
    impact:
      'I build model-backed products people can actually open, evaluate, and use instead of one-off experiments that die in a folder.',
  },
  {
    title: 'Evaluation-first analytics',
    stack: 'FastAPI, Chart.js, reporting pipelines',
    impact:
      'My best work focuses on calibration, CLV, regression gates, and model honesty so decision-makers can trust what they are seeing.',
  },
  {
    title: 'Developer tooling with clear business value',
    stack: 'Python, Bash, GitHub Actions, CLI UX',
    impact:
      'I like turning messy operational pain into usable tools, from repo quality scoring to safe cleanup scripts and reusable metrics workflows.',
  },
];

const featuredProjects = [
  {
    name: 'AI Advantage Sports',
    subtitle: 'Consumer-facing ML product',
    stack: ['Python', 'React', 'XGBoost', 'FastAPI'],
    image: '/proof/ai-advantage-screenshot.png',
    href: 'https://github.com/ianalloway/ai-advantage',
    ctaLabel: 'View repository',
    detail:
      'Prediction and DFS tooling with a real deployed product surface, model-backed recommendations, and a presentation layer that looks like something users would actually trust.',
    whyItMatters:
      'Shows I can take a model from feature engineering to an interface that feels like a product, not just a benchmark.',
  },
  {
    name: 'NBA CLV Dashboard',
    subtitle: 'Evaluation dashboard',
    stack: ['FastAPI', 'Chart.js', 'Python'],
    image: '/proof/nba-clv-dashboard.svg',
    href: 'https://github.com/ianalloway/nba-clv-dashboard',
    ctaLabel: 'View repository',
    detail:
      'Calibration, rolling accuracy, Brier score, and CLV-style reporting in one dashboard built to explain whether a model is actually useful.',
    whyItMatters:
      'This is the clearest example of the way I think: honest evaluation beats vanity metrics.',
  },
  {
    name: 'Sports Betting ML',
    subtitle: 'End-to-end pipeline + demo',
    stack: ['Python', 'FastAPI', 'Hugging Face', 'MLOps'],
    image: '/proof/sports-betting-ml-demo.gif',
    href: 'https://github.com/ianalloway/sports-betting-ml',
    ctaLabel: 'View repository',
    detail:
      'A full workflow for sports prediction with feature engineering, model training, serving, and a public-facing demo tied to a clear architecture.',
    whyItMatters:
      'It demonstrates end-to-end ownership across data, modeling, packaging, and deployment.',
  },
  {
    name: 'Repo Health',
    subtitle: 'Developer tooling / maintenance intelligence',
    stack: ['Python', 'CLI', 'GitHub APIs'],
    image: '/proof/repo-health.svg',
    href: 'https://github.com/ianalloway/repo-health',
    ctaLabel: 'View repository',
    detail:
      'A practical scoring tool for README quality, CI, licensing, issue hygiene, and maintenance signals.',
    whyItMatters:
      'It shows product thinking outside of ML too: I can package operational judgment into tools teams can use.',
  },
];

const whyHireMe = [
  'I build applied ML systems end-to-end, from data prep and evaluation to APIs, dashboards, and delivery.',
  'I care about evaluation, not just model accuracy, so the work holds up when someone depends on it.',
  'I turn analytics into usable products with clear UX, practical reporting, and developer-friendly documentation.',
  'I communicate technical work clearly enough for engineers, recruiters, and stakeholders to stay aligned.',
];

const credibilitySignals = [
  {
    label: 'Education',
    value: 'B.S. Information Science expected May 2026; M.S. Artificial Intelligence starts August 2026',
  },
  {
    label: 'Open source',
    value: 'Public work across evaluation dashboards, ML utilities, repo tooling, and developer automation',
  },
  {
    label: 'Selected certifications',
    value: 'Deep Learning Specialization, Google ML Engineering, AWS Cloud Practitioner, Oracle SQL',
  },
  {
    label: 'Flagship case study',
    value: 'Sports ML evaluation write-up with calibration, rolling accuracy, and CLV framing',
  },
];

const experience = [
  {
    title: 'Founder & Business Owner',
    company: 'Alloway LLC',
    period: 'July 2023 - Present',
    description:
      'Built AI and analytics solutions for client workflows, including dashboarding, ML prototypes, and operational tooling that improved efficiency by roughly 40%.',
  },
  {
    title: 'Data Auditor / AI Engineer',
    company: 'Omniichain',
    period: 'Jan 2020 - Dec 2024',
    description:
      'Worked on anomaly detection and blockchain analytics workflows that helped reduce fraud incidents while making transactional health easier to inspect.',
  },
  {
    title: 'Task Force Manager',
    company: 'Hilton Hotels',
    period: 'Aug 2020 - Sept 2023',
    description:
      'Led operational improvement work across multiple properties, with real ownership over process quality, budgets, and service outcomes.',
  },
  {
    title: 'Sales & Purchasing Manager',
    company: 'IT Parts and Spares Ltd.',
    period: 'Sept 2018 - Aug 2020',
    description:
      'Managed purchasing relationships and process improvements across international hardware vendors, building the operations discipline I still bring to technical work.',
  },
];

const selectedProjects = [
  {
    name: 'snake-game',
    description:
      'Classic Snake with deterministic grid logic, keyboard controls, mobile buttons, score tracking, and restart flow. Play it on the site or inspect the standalone repo.',
    codeHref: 'https://github.com/ianalloway/snake-game',
    demoHref: '/snake',
  },
  {
    name: 'nba-ratings',
    description: 'Reusable Elo, logistic win probability, and Kelly helpers packaged for repeatable modeling work.',
    codeHref: 'https://github.com/ianalloway/nba-ratings',
  },
  {
    name: 'kelly-js',
    description: 'Small, focused probability and bankroll utility package with clean API design.',
    codeHref: 'https://github.com/ianalloway/kelly-js',
  },
  {
    name: 'macos-disk-cleanup',
    description: 'A careful Bash tool for reclaiming disk space without the usual “hope this does not break anything” energy.',
    codeHref: 'https://github.com/ianalloway/macos-disk-cleanup',
  },
  {
    name: 'openclaw-skills',
    description: 'Published skills and workflows around sports odds, reporting, developer tooling, and agent productivity.',
    codeHref: 'https://github.com/ianalloway/openclaw-skills',
  },
];

const caseStudyBullets = [
  'Problem: sports models are often pitched on a single win-rate number that hides whether the edge is stable or trustworthy.',
  'Approach: package reusable primitives, build a reporting layer, and expose calibration, rolling accuracy, and CLV in one place.',
  'Tradeoff: honest reporting makes the results look less flashy, but much more useful for real decision-making.',
  'Next step: connect the same evaluation pattern to additional leagues and live data sources.',
];

type WritingAsset = {
  label: string;
  href: string;
  download?: boolean;
};

type WritingEntry = {
  title: string;
  description: string;
  category: string;
  assets: WritingAsset[];
  videoUrl?: string;
  videoThumbnail?: string;
  videoBadge?: string;
  note?: string;
};

const academicAssignments: WritingEntry[] = [
  {
    title: 'The Ratepayer Protection Pledge and the Rising',
    description:
      'A critical examination of the policy implications and infrastructure costs associated with powering AI data centers in America.',
    category: 'Academic Writing',
    assets: [
      { label: 'View PDF', href: '/papers/ratepayer-protection-pledge-rising.pdf' },
      { label: 'Download PDF', href: '/papers/ratepayer-protection-pledge-rising.pdf', download: true },
    ],
  },
  {
    title: 'Assignment: Information Policy/Technology in the News',
    description:
      'Critical analysis of AI data center energy costs and ratepayer protection policy. Preserved in the submitted PDF format.',
    category: 'Assignment',
    assets: [
      { label: 'View PDF', href: '/papers/it-news-essay-ratepayer-protection.pdf' },
      { label: 'Download PDF', href: '/papers/it-news-essay-ratepayer-protection.pdf', download: true },
    ],
  },
  {
    title: 'Assignment: BSIS Program Review',
    description:
      'Program review assignment restored with both the submitted PDF and the original DOCX version.',
    category: 'Assignment',
    assets: [
      { label: 'View PDF', href: '/papers/bsis-program-review-alloway.pdf' },
      { label: 'Download PDF', href: '/papers/bsis-program-review-alloway.pdf', download: true },
      { label: 'Original DOCX', href: '/papers/originals/bsis-program-review-alloway.docx', download: true },
    ],
  },
  {
    title: 'Discussion Question 2: Portfolio Peer Feedback and Support',
    description:
      'Discussion artifact restored in its original DOCX format from your course files.',
    category: 'Discussion',
    assets: [
      { label: 'Original DOCX', href: '/papers/originals/discussion-question-2-peer-feedback.docx', download: true },
    ],
  },
  {
    title: 'GEA#2 Assignment: Reflective Essay',
    description:
      'Reflective essay preserved in presentation form with the original video link and the script file included alongside it.',
    category: 'Assignment',
    videoUrl: 'https://www.youtube.com/watch?v=kzOzxch1-hE&t=236s',
    videoThumbnail: 'https://img.youtube.com/vi/kzOzxch1-hE/hqdefault.jpg',
    videoBadge: '3:56',
    assets: [
      { label: 'Watch Video', href: 'https://www.youtube.com/watch?v=kzOzxch1-hE&t=236s' },
      { label: 'Video Script', href: '/papers/originals/gea2-video-script.md', download: true },
    ],
  },
  {
    title: 'Portfolio Presentations',
    description:
      'Portfolio presentation slides restored in the original PPTX format from your course presentation files.',
    category: 'Presentation',
    assets: [
      { label: 'Original PPTX', href: '/papers/originals/portfolio-presentations.pptx', download: true },
    ],
    note: 'The large local movie recording was not added to GitHub because it exceeds repository file size limits.',
  },
];

const writingResources: WritingEntry[] = [
  {
    title: 'Portfolio Conclusion — LIS 4934 Senior Capstone',
    description:
      'Reflective capstone conclusion restored with both the web PDF and the original DOCX draft.',
    category: 'Capstone',
    assets: [
      { label: 'View PDF', href: '/papers/portfolio-conclusion-lis4934.pdf' },
      { label: 'Download PDF', href: '/papers/portfolio-conclusion-lis4934.pdf', download: true },
      { label: 'Original DOCX', href: '/papers/originals/portfolio-conclusion-lis4934.docx', download: true },
    ],
  },
  {
    title: 'Bio and Career Goals',
    description:
      'Biography and goals statement with the submitted PDF plus the original DOCX version you authored.',
    category: 'Portfolio',
    assets: [
      { label: 'View PDF', href: '/papers/bio-and-career-goals.pdf' },
      { label: 'Download PDF', href: '/papers/bio-and-career-goals.pdf', download: true },
      { label: 'Original DOCX', href: '/papers/originals/enhanced-bio-and-career-goals-alloway.docx', download: true },
    ],
  },
  {
    title: 'Event Report Capstone',
    description:
      'Capstone event report with both the PDF version and the original DOCX submission format.',
    category: 'Capstone',
    assets: [
      { label: 'View PDF', href: '/papers/event-report-capstone.pdf' },
      { label: 'Download PDF', href: '/papers/event-report-capstone.pdf', download: true },
      { label: 'Original DOCX', href: '/papers/originals/event-report-capstone.docx', download: true },
    ],
  },
  {
    title: 'Case Study Capstone',
    description:
      'Case study capstone preserved with the PDF and the original DOCX version from your course files.',
    category: 'Capstone',
    assets: [
      { label: 'View PDF', href: '/papers/case-study-capstone.pdf' },
      { label: 'Download PDF', href: '/papers/case-study-capstone.pdf', download: true },
      { label: 'Original DOCX', href: '/papers/originals/case-study-capstone.docx', download: true },
    ],
  },
  {
    title: 'GEA Capstone',
    description:
      'GEA capstone available in both PDF and original DOCX format.',
    category: 'Capstone',
    assets: [
      { label: 'View PDF', href: '/papers/gea-capstone.pdf' },
      { label: 'Download PDF', href: '/papers/gea-capstone.pdf', download: true },
      { label: 'Original DOCX', href: '/papers/originals/gea-capstone-alloway.docx', download: true },
    ],
  },
  {
    title: 'AllowayAI on Substack',
    description:
      'Your original long-form writing outlet for technical essays, build notes, and public-facing writing.',
    category: 'Writing',
    assets: [
      { label: 'Visit Substack', href: 'https://allowayai.substack.com' },
    ],
  },
];

const quote = {
  text: 'Hired Ian to build a real-time data pipeline for our risk engine. He delivered ahead of schedule with FastAPI + Convex architecture that handles 50k events/min. Would hire again without hesitation.',
  person: 'Sarah K.',
  role: 'Lead Engineer, fintech startup',
};

const Index = () => {
  const [typedText, setTypedText] = useState('');
  const statsRef = useRef<HTMLElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const c1 = useCounter(30, statsVisible);
  const c2 = useCounter(40, statsVisible);
  const c3 = useCounter(68.3, statsVisible, 1);
  const c4 = useCounter(60, statsVisible);
  const [theme, setTheme] = useState<SiteTheme>(() => getStoredTheme());
  const { toast } = useToast();
  const fullText = 'IAN ALLOWAY';

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStatsVisible(true); obs.disconnect(); } },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTypedText(fullText);
      return;
    }

    let index = 0;
    const timer = setInterval(() => {
      if (index <= fullText.length) {
        setTypedText(fullText.slice(0, index));
        index += 1;
      } else {
        clearInterval(timer);
      }
    }, 90);

    return () => clearInterval(timer);
  }, []);

  const copyEthAddress = async () => {
    try {
      await navigator.clipboard.writeText(ETH_DONATION_ADDRESS);
      toast({
        title: 'Address Copied!',
        description: 'ETH donation address copied to clipboard',
      });
    } catch {
      toast({
        title: 'Failed to copy',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
      >
        Skip to main content
      </a>
      {theme === 'matrix' && <MatrixRain />}

      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-primary/20 bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a href="#top" className="flex items-center gap-2 text-primary font-mono font-bold tracking-tight">
            <Terminal size={18} />
            IAN.SYS
          </a>
          <div className="hidden md:flex items-center gap-5 text-sm font-mono">
            <a href="#featured" className="text-primary hover:text-primary/70 transition-colors">[WORK]</a>
            <a href="#case-study" className="text-primary hover:text-primary/70 transition-colors">[CASE_STUDY]</a>
            <a href="#writing" className="text-primary hover:text-primary/70 transition-colors">[WRITING]</a>
            <a href="#why-hire-me" className="text-primary hover:text-primary/70 transition-colors">[WHY_ME]</a>
            <a href="#contact" className="text-primary hover:text-primary/70 transition-colors">[CONTACT]</a>
            <a href="/hireme" className="text-primary hover:text-primary/70 transition-colors">[/HIRE]</a>
            <a href="/now" className="text-primary hover:text-primary/70 transition-colors">[/NOW]</a>
            <button
              onClick={() => setTheme((prev) => (prev === 'matrix' ? 'light' : 'matrix'))}
              className="rounded-md border border-primary/30 p-2 transition-colors hover:bg-primary/10"
              aria-label="Toggle theme"
            >
              {theme === 'matrix' ? <Sun size={16} className="text-primary" /> : <Moon size={16} className="text-primary" />}
            </button>
          </div>
        </div>
      </nav>

      <main id="main-content">
      {/* Animated stats bar */}
      <section ref={statsRef as React.RefObject<HTMLElement>} className="relative z-10 border-b border-primary/10 bg-primary/5 px-4 py-4">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {[
              { label: 'Fraud Reduction', value: c1, suffix: '%', sub: 'for fintech client' },
              { label: 'Ops Efficiency', value: c2, suffix: '%', sub: 'improvement delivered' },
              { label: 'Model Accuracy', value: c3, suffix: '%', sub: 'NBA betting model' },
              { label: 'GitHub Repos', value: c4, suffix: '+', sub: 'public repositories' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-bold font-mono text-primary">{s.value}{s.suffix}</div>
                <div className="text-xs font-mono font-semibold text-foreground/80 uppercase tracking-widest">{s.label}</div>
                <div className="text-[10px] font-mono text-muted-foreground">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="top" className="relative z-10 px-4 pt-28 pb-16 md:pt-36 md:pb-24">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <div className="mb-5 flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-green-400/40 bg-green-400/10 text-green-400 font-mono text-xs font-bold tracking-widest uppercase">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                </span>
                Open to Work · ML Engineer / Data Scientist
              </span>
            </div>
            <h1 className="mb-4 text-5xl md:text-7xl font-bold font-mono matrix-text text-primary leading-[0.95]">
              {typedText}
              <span className="animate-terminal-blink">_</span>
            </h1>
            <p className="max-w-3xl text-xl md:text-2xl font-mono text-foreground/90 mb-4">
              ML Engineer / Data Scientist building evaluation-first analytics and decision-support products.
            </p>
            <p className="max-w-2xl text-sm md:text-base text-muted-foreground font-mono leading-relaxed mb-8">
              I build applied ML systems that survive contact with real users: APIs, dashboards, reporting layers, and developer tools that make model behavior easier to trust. Basically, I like useful models and I maintain a healthy suspicion of dashboards that look too good.
            </p>

            <div className="flex flex-wrap gap-3 mb-8">
              <Button className="font-mono bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                <a href="/Ian_Alloway_Resume_CV.pdf" download>
                  <Download className="mr-2" size={16} /> View Resume
                </a>
              </Button>
              <Button variant="outline" className="font-mono terminal-border text-primary border-primary hover:bg-primary/10" asChild>
                <a href="#featured">
                  <BarChart3 className="mr-2" size={16} /> See Featured Projects
                </a>
              </Button>
              <Button variant="outline" className="font-mono terminal-border text-primary border-primary hover:bg-primary/10" asChild>
                <a href="#contact">
                  <Mail className="mr-2" size={16} /> Contact Me
                </a>
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {outcomes.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-xl border border-primary/20 bg-card/70 px-4 py-4 backdrop-blur-sm">
                  <CheckCircle2 size={16} className="mt-0.5 text-primary shrink-0" />
                  <p className="text-sm font-mono text-muted-foreground leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-primary/20 bg-card/70 p-6 backdrop-blur-sm shadow-lg shadow-black/20">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary/70 mb-2">Current Narrative</p>
                <h2 className="text-2xl font-semibold font-mono text-primary">What I want recruiters to notice</h2>
              </div>
              <Brain size={26} className="text-primary/70" />
            </div>
            <div className="space-y-4 font-mono text-sm text-muted-foreground">
              <p>B.S. Information Science at USF, expected May 2026.</p>
              <p>M.S. Artificial Intelligence at USF, starting August 2026.</p>
              <p>Strongest public proof: sports analytics, ML evaluation, reporting, and developer tooling.</p>
              <p>Best fit roles: ML Engineer, Applied AI Engineer, Data Scientist, Analytics Engineer.</p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="https://github.com/ianalloway" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-mono text-primary hover:text-primary/70 transition-colors">
                <Github size={15} /> GitHub
              </a>
              <a href="https://www.linkedin.com/in/ianit" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-mono text-primary hover:text-primary/70 transition-colors">
                <Linkedin size={15} /> LinkedIn
              </a>
              <a href="mailto:ian@allowayllc.com" className="inline-flex items-center gap-2 text-sm font-mono text-primary hover:text-primary/70 transition-colors">
                <Mail size={15} /> ian@allowayllc.com
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 pb-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4 md:grid-cols-3">
            {proofCards.map((card) => (
              <Card key={card.title} className="terminal-border bg-card/80 backdrop-blur-sm border-primary/20">
                <CardContent className="p-6">
                  <p className="text-xs uppercase tracking-[0.22em] text-primary/60 font-mono mb-4">proof</p>
                  <h3 className="text-lg font-semibold text-primary font-mono mb-3">{card.title}</h3>
                  <p className="text-xs font-mono text-primary/70 mb-3">{card.stack}</p>
                  <p className="text-sm font-mono text-muted-foreground leading-relaxed">{card.impact}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="featured" className="relative z-10 px-4 py-16 bg-primary/5">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl mb-10">
            <p className="text-xs uppercase tracking-[0.22em] text-primary/70 font-mono mb-3">Featured Work</p>
            <h2 className="text-3xl md:text-4xl font-semibold font-mono text-primary mb-4">The projects that make the hiring case fastest</h2>
            <p className="text-sm md:text-base font-mono text-muted-foreground leading-relaxed">
              These are the strongest examples of how I work: a model-backed product, an honest evaluation dashboard, an end-to-end ML pipeline, and a practical developer tool with clear maintenance value.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {featuredProjects.map((project) => (
              <Card key={project.name} className="overflow-hidden border-primary/20 bg-card/80 backdrop-blur-sm">
                <div className="aspect-[16/10] overflow-hidden bg-black/30 border-b border-primary/20">
                  <img
                    src={project.image}
                    alt={project.name}
                    width="640"
                    height="400"
                    loading="lazy"
                    className="h-full w-full object-cover object-top"
                  />
                </div>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-primary/60 font-mono mb-2">{project.subtitle}</p>
                      <h3 className="text-xl font-semibold font-mono text-primary">{project.name}</h3>
                    </div>
                    <a href={project.href} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/70 transition-colors shrink-0">
                      <ExternalLink size={18} />
                    </a>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.stack.map((tech) => (
                      <span key={tech} className="rounded-full border border-primary/20 px-2.5 py-1 text-xs font-mono text-primary/80">
                        {tech}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm font-mono text-muted-foreground leading-relaxed mb-3">{project.detail}</p>
                  <p className="text-sm font-mono text-foreground/90 leading-relaxed mb-5">{project.whyItMatters}</p>
                  <Button variant="outline" className="font-mono terminal-border text-primary border-primary hover:bg-primary/10" asChild>
                    <a href={project.href} target="_blank" rel="noopener noreferrer">
                      <Github className="mr-2" size={16} /> {project.ctaLabel}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="why-hire-me" className="relative z-10 px-4 py-16">
        <div className="mx-auto max-w-6xl grid gap-8 lg:grid-cols-[0.95fr_1.05fr] items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-primary/70 font-mono mb-3">Why Hire Me</p>
            <h2 className="text-3xl md:text-4xl font-semibold font-mono text-primary mb-4">Clear strengths, no interpretive dance required</h2>
            <p className="text-sm md:text-base font-mono text-muted-foreground leading-relaxed">
              If someone only spends two minutes on this site, this is the section I want them to leave with. My edge is not just modeling. It is building the whole thing around the model so another person can trust, use, and extend it.
            </p>
          </div>
          <div className="grid gap-4">
            {whyHireMe.map((item) => (
              <div key={item} className="rounded-2xl border border-primary/20 bg-card/70 px-5 py-5 backdrop-blur-sm flex gap-4">
                <CheckCircle2 size={18} className="text-primary mt-0.5 shrink-0" />
                <p className="text-sm font-mono text-muted-foreground leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="case-study" className="relative z-10 px-4 py-16 bg-primary/5">
        <div className="mx-auto max-w-6xl grid gap-8 lg:grid-cols-[1.05fr_0.95fr] items-start">
          <Card className="border-primary/20 bg-card/80 backdrop-blur-sm overflow-hidden">
            <div className="aspect-[16/10] overflow-hidden border-b border-primary/20 bg-black/40">
              <img
                src="/proof/sports-betting-ml-architecture.svg"
                alt="Sports Betting ML architecture"
                width="1600"
                height="900"
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
            <CardContent className="p-6">
              <p className="text-xs uppercase tracking-[0.22em] text-primary/70 font-mono mb-3">Case Study</p>
              <h2 className="text-2xl md:text-3xl font-semibold font-mono text-primary mb-4">Sports ML evaluation and calibration</h2>
              <p className="text-sm font-mono text-muted-foreground leading-relaxed mb-5">
                I already had the pieces: reusable modeling primitives, reporting scripts, and a dashboard. The case study ties them together into the story recruiters actually need to see: problem, approach, tradeoffs, results, and what I would build next.
              </p>
              <div className="space-y-3 mb-6">
                {caseStudyBullets.map((bullet) => (
                  <p key={bullet} className="text-sm font-mono text-muted-foreground leading-relaxed">{bullet}</p>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button className="font-mono bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                  <a href="/papers/sports-ml-evaluation-case-study.html" target="_blank" rel="noopener noreferrer">
                    <FileText className="mr-2" size={16} /> Read Case Study
                  </a>
                </Button>
                <Button variant="outline" className="font-mono terminal-border text-primary border-primary hover:bg-primary/10" asChild>
                  <a href="https://github.com/ianalloway/nba-clv-dashboard" target="_blank" rel="noopener noreferrer">
                    <ArrowRight className="mr-2" size={16} /> See the dashboard repo
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.22em] text-primary/70 font-mono">Credibility Signals</p>
            {credibilitySignals.map((signal) => (
              <Card key={signal.label} className="border-primary/20 bg-card/70 backdrop-blur-sm">
                <CardContent className="p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-primary/60 font-mono mb-2">{signal.label}</p>
                  <p className="text-sm font-mono text-muted-foreground leading-relaxed">{signal.value}</p>
                </CardContent>
              </Card>
            ))}
            <Card className="border-primary/20 bg-card/70 backdrop-blur-sm">
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-primary/60 font-mono mb-3">One strong quote</p>
                <p className="text-sm font-mono text-foreground/90 leading-relaxed mb-3">“{quote.text}”</p>
                <p className="text-xs font-mono text-muted-foreground">{quote.person} • {quote.role}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="writing" className="py-16 px-4 bg-primary/5 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mb-8">
            <h2 className="text-2xl font-bold mb-4 matrix-text font-mono text-primary">
              <GraduationCap className="inline mr-2" size={24} />
              [ACADEMIC_WRITING]
            </h2>
            <p className="text-muted-foreground font-mono mb-3 text-sm">
              &gt; Restored class-facing assignments and writing artifacts in the original portfolio card format.
            </p>
            <p className="text-muted-foreground/80 font-mono text-xs">
              The assignment names below match your class list so they are easy to verify during review.
            </p>
          </div>

          <div className="grid xl:grid-cols-[1.15fr_0.85fr] gap-8 items-start">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-primary/70 font-mono mb-4">Assignments</p>
              <div className="grid md:grid-cols-2 gap-4">
                {academicAssignments.map((paper) => (
                  <Card key={paper.title} className="terminal-border bg-card/80 backdrop-blur-sm hover:scale-[1.02] transition-transform">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start gap-3 mb-2">
                        <h3 className="text-primary font-bold font-mono text-sm leading-snug">{paper.title}</h3>
                        <span className="px-2 py-0.5 text-xs terminal-border rounded font-mono text-primary/80 shrink-0">
                          {paper.category}
                        </span>
                      </div>
                      {paper.videoUrl && paper.videoThumbnail && (
                        <div className="mb-3 rounded overflow-hidden border border-primary/30">
                          <a href={paper.videoUrl} target="_blank" rel="noopener noreferrer" className="block relative group">
                            <img
                              src={paper.videoThumbnail}
                              alt={`${paper.title} thumbnail`}
                              width="480"
                              height="360"
                              loading="lazy"
                              className="w-full object-cover h-32"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/60 transition-colors">
                              <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-black ml-0.5"><path d="M8 5v14l11-7z"/></svg>
                              </div>
                            </div>
                            {paper.videoBadge && (
                              <span className="absolute bottom-1 right-1 bg-black/80 text-primary font-mono text-xs px-1 rounded">{paper.videoBadge}</span>
                            )}
                          </a>
                        </div>
                      )}
                      <p className="text-muted-foreground/70 text-xs mb-3 font-mono">{paper.description}</p>
                      {paper.note && (
                        <p className="text-[11px] font-mono text-primary/70 mb-3">{paper.note}</p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {paper.assets.map((asset) => (
                          <Button key={asset.label} variant="outline" size="sm" className="font-mono terminal-border text-primary border-primary hover:bg-primary/10 text-xs" asChild>
                            <a href={asset.href} target="_blank" rel="noopener noreferrer" download={asset.download}>
                              <FileText className="mr-1" size={12} /> {asset.label}
                            </a>
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.22em] text-primary/70 font-mono">Supporting Writing</p>
              {writingResources.map((item) => (
                <Card key={item.title} className="terminal-border bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <h3 className="text-primary font-bold font-mono text-sm leading-snug">{item.title}</h3>
                      <span className="px-2 py-0.5 text-xs terminal-border rounded font-mono text-primary/80 shrink-0">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-muted-foreground/70 text-xs mb-4 font-mono">{item.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {item.assets.map((asset) => (
                        <Button key={asset.label} variant="outline" size="sm" className="font-mono terminal-border text-primary border-primary hover:bg-primary/10 text-xs" asChild>
                          <a href={asset.href} target="_blank" rel="noopener noreferrer" download={asset.download}>
                            <FileText className="mr-1" size={12} /> {asset.label}
                          </a>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 py-16">
        <div className="mx-auto max-w-6xl grid gap-8 lg:grid-cols-[0.95fr_1.05fr] items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-primary/70 font-mono mb-3">Experience</p>
            <h2 className="text-3xl md:text-4xl font-semibold font-mono text-primary mb-4">Range is useful when the story stays coherent</h2>
            <p className="text-sm md:text-base font-mono text-muted-foreground leading-relaxed">
              I have done work across analytics, operations, client delivery, and developer tooling. The common thread is that I like systems that have to perform under real constraints, which is probably why I ended up obsessed with evaluation and process quality.
            </p>
          </div>
          <div className="space-y-3">
            {experience.map((item, idx) => (
              <Card key={`${item.company}-${item.title}`} className={`border-primary/20 bg-card/70 backdrop-blur-sm border-l-4 hover:-translate-y-0.5 hover:shadow-[0_0_16px_hsl(120_100%_50%/0.1)] transition-all duration-200 ${idx === 0 ? 'border-l-primary' : idx === 1 ? 'border-l-cyan-400' : idx === 2 ? 'border-l-yellow-400' : 'border-l-purple-400'}`}>
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="text-sm md:text-base font-mono font-semibold text-primary">{item.title}</h3>
                      <p className="text-xs md:text-sm font-mono text-muted-foreground">{item.company}</p>
                    </div>
                    <span className="text-xs font-mono text-primary/70 bg-primary/10 px-2 py-0.5 rounded-full">{item.period}</span>
                  </div>
                  <p className="text-sm font-mono text-muted-foreground leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 py-16 bg-primary/5">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl mb-8">
            <p className="text-xs uppercase tracking-[0.22em] text-primary/70 font-mono mb-3">More Good Proof</p>
            <h2 className="text-3xl md:text-4xl font-semibold font-mono text-primary mb-4">A few more repos worth clicking</h2>
            <p className="text-sm md:text-base font-mono text-muted-foreground leading-relaxed">
              These support the same hiring story without diluting it: reusable modeling utilities, practical tooling, and OSS work that looks like something a team could actually adopt.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {selectedProjects.map((project) => (
              <Card key={project.name} className="border-primary/20 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h3 className="text-lg font-semibold font-mono text-primary">{project.name}</h3>
                      <p className="text-sm font-mono text-muted-foreground leading-relaxed mt-2">{project.description}</p>
                    </div>
                    <a
                      href={project.demoHref ?? project.codeHref}
                      {...(!project.demoHref ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="text-primary hover:text-primary/70 transition-colors shrink-0"
                    >
                      <ExternalLink size={18} />
                    </a>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" className="font-mono terminal-border text-primary border-primary hover:bg-primary/10" asChild>
                      <a href={project.codeHref} target="_blank" rel="noopener noreferrer">
                        <Github className="mr-2" size={16} /> Code
                      </a>
                    </Button>
                    {project.demoHref ? (
                      <Button variant="outline" className="font-mono terminal-border text-primary border-primary hover:bg-primary/10" asChild>
                        <Link to={project.demoHref}>
                          <ExternalLink className="mr-2" size={16} /> Live Demo
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* GitHub Activity Strip */}
      <section className="relative z-10 px-4 py-10 border-t border-primary/10">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-primary/70 font-mono mb-1">// RECENT_ACTIVITY</p>
              <h2 className="text-xl font-semibold font-mono text-primary">Latest on GitHub</h2>
            </div>
            <a href="https://github.com/ianalloway" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-primary transition-colors">
              <Github size={13} /> View all 60+ repos →
            </a>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[
              { name: 'oss-arc', desc: 'Snapshots of archived open-source work', lang: 'Python', updated: '1 day ago', href: 'https://github.com/ianalloway/oss-arc' },
              { name: 'ai-advantage-sports', desc: 'Sports betting platform — ML picks engine', lang: 'TypeScript', updated: '1 day ago', href: 'https://github.com/ianalloway/ai-advantage-sports' },
              { name: 'ian-web-forge', desc: 'This portfolio site — React + Tailwind', lang: 'TypeScript', updated: '5 days ago', href: 'https://github.com/ianalloway/ian-web-forge' },
              { name: 'kana-dojo', desc: 'Aesthetic minimal Japanese learning app', lang: 'TypeScript', updated: '4 days ago', href: 'https://github.com/ianalloway/kana-dojo' },
              { name: 'nba-ratings', desc: 'Elo / Kelly / win-prob PyPI package', lang: 'Python', updated: '5 days ago', href: 'https://github.com/ianalloway/nba-ratings' },
              { name: 'kelly-js', desc: 'Kelly Criterion bankroll utility package', lang: 'JavaScript', updated: '4 days ago', href: 'https://github.com/ianalloway/kelly-js' },
            ].map((repo) => (
              <a
                key={repo.name}
                href={repo.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl border border-primary/20 bg-card/70 p-4 hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-[0_0_16px_hsl(120_100%_50%/0.1)] transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-mono text-sm font-semibold text-primary neon-underline">{repo.name}</span>
                  <ExternalLink size={12} className="text-muted-foreground shrink-0 mt-0.5" />
                </div>
                <p className="text-xs font-mono text-muted-foreground leading-relaxed mb-3">{repo.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                    <span className={`w-2 h-2 rounded-full ${repo.lang === 'Python' ? 'bg-blue-400' : repo.lang === 'TypeScript' ? 'bg-cyan-400' : 'bg-yellow-400'}`} />
                    {repo.lang}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground/60">Updated {repo.updated}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="relative z-10 px-4 py-16">
        <div className="mx-auto max-w-5xl rounded-[28px] border border-primary/20 bg-card/80 p-8 md:p-10 backdrop-blur-sm">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-primary/70 font-mono mb-3">Contact</p>
              <h2 className="text-3xl md:text-4xl font-semibold font-mono text-primary mb-4">If you need someone who can build the model and the layer around it, let’s talk.</h2>
              <p className="text-sm md:text-base font-mono text-muted-foreground leading-relaxed mb-6 max-w-3xl">
                I’m especially interested in ML engineering, applied AI, analytics engineering, and data science roles where evaluation quality, product thinking, and practical delivery all matter.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button className="font-mono bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                  <a href="mailto:ian@allowayllc.com">
                    <Mail className="mr-2" size={16} /> Contact Me
                  </a>
                </Button>
                <Button variant="outline" className="font-mono terminal-border text-primary border-primary hover:bg-primary/10" asChild>
                  <a href="/Ian_Alloway_Resume_CV.pdf" download>
                    <Download className="mr-2" size={16} /> Download Resume
                  </a>
                </Button>
                <Button variant="outline" className="font-mono terminal-border text-primary border-primary hover:bg-primary/10" asChild>
                  <a href="https://www.linkedin.com/in/ianit" target="_blank" rel="noopener noreferrer">
                    <Linkedin className="mr-2" size={16} /> LinkedIn
                  </a>
                </Button>
                <Button variant="outline" className="font-mono terminal-border text-primary border-primary hover:bg-primary/10" asChild>
                  <a href="https://allowayai.substack.com" target="_blank" rel="noopener noreferrer">
                    <FileText className="mr-2" size={16} /> Read Substack
                  </a>
                </Button>
              </div>

              <div className="mt-8 max-w-2xl rounded-2xl border border-primary/20 bg-background/70 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-primary/70 font-mono mb-2">Subscribe By Email</p>
                <h3 className="text-xl font-semibold font-mono text-primary mb-2">Get new writing the minute it lands.</h3>
                <p className="text-sm font-mono text-muted-foreground leading-relaxed mb-4">
                  This now uses the official embedded Substack signup, so people can subscribe right here in the contact section without leaving the site.
                </p>
                <SubstackEmbed className="max-w-xl" />
                <p className="mt-4 text-xs font-mono text-muted-foreground">
                  If the embed does not load,{" "}
                  <a
                    href="https://allowayai.substack.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/70 transition-colors"
                  >
                    open AllowayAI on Substack directly
                  </a>
                  .
                </p>
              </div>
            </div>

            <div className="space-y-3 font-mono text-sm text-muted-foreground min-w-[260px]">
              <a href="mailto:ian@allowayllc.com" className="flex items-center gap-2 text-primary hover:text-primary/70 transition-colors">
                <Mail size={15} /> ian@allowayllc.com
              </a>
              <a href="https://allowayai.substack.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:text-primary/70 transition-colors">
                <FileText size={15} /> allowayai.substack.com
              </a>
              <a href="https://github.com/ianalloway" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:text-primary/70 transition-colors">
                <Github size={15} /> github.com/ianalloway
              </a>
              <a href="https://www.linkedin.com/in/ianit" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:text-primary/70 transition-colors">
                <Linkedin size={15} /> linkedin.com/in/ianit
              </a>
              <Link to="/hireme" className="flex items-center gap-2 text-primary transition-colors hover:text-primary/70">
                <Briefcase size={15} /> Hire / consulting page
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-primary/20 px-4 py-8">
        <div className="mx-auto max-w-6xl flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-primary/70 text-sm font-mono">IAN.ALLOWAY.SYS</p>
            <p className="text-xs font-mono text-muted-foreground mt-1">Built with React + Tailwind. Calm UI, honest metrics, and a little bit of terminal theater.</p>
            <p className="text-xs font-mono text-muted-foreground mt-1 flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400"></span>
              </span>
              Currently building: M.S. AI coursework + AI Advantage Sports v2
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a href="/papers/sports-ml-evaluation-case-study.html" target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-primary hover:text-primary/70 transition-colors inline-flex items-center gap-1">
              <FileText size={12} /> Case study
            </a>
            <a href="/papers/bsis-program-review-alloway.pdf" target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-primary hover:text-primary/70 transition-colors inline-flex items-center gap-1">
              <GraduationCap size={12} /> Academic writing
            </a>
            <a href="https://allowayai.substack.com" target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-primary hover:text-primary/70 transition-colors inline-flex items-center gap-1">
              <FileText size={12} /> AllowayAI
            </a>
            <a href="/toolkit" className="text-xs font-mono text-primary hover:text-primary/70 transition-colors inline-flex items-center gap-1">
              <Package size={12} /> Toolkit
            </a>
            <a href="https://etherscan.io/address/0x6F278Ce76BA5ED31Fd9bE646D074863e126836E9" target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-primary hover:text-primary/70 transition-colors inline-flex items-center gap-1">
              <Heart size={12} /> Crypto tips
            </a>
            <Button
              variant="outline"
              size="sm"
              onClick={copyEthAddress}
              className="font-mono terminal-border text-primary border-primary hover:bg-primary/10 text-xs"
            >
              <Copy size={12} className="mr-1" /> Copy wallet
            </Button>
          </div>
        </div>
      </footer>
      </main>
    </div>
  );
};

export default Index;
