import { useEffect, useState } from 'react';
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
import { useToast } from '@/components/ui/use-toast';

const ETH_DONATION_ADDRESS = '0x6f278ce76ba5ed31fd9be646d074863e126836e9';

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
    name: 'nba-ratings',
    description: 'Reusable Elo, logistic win probability, and Kelly helpers packaged for repeatable modeling work.',
    href: 'https://github.com/ianalloway/nba-ratings',
  },
  {
    name: 'kelly-js',
    description: 'Small, focused probability and bankroll utility package with clean API design.',
    href: 'https://github.com/ianalloway/kelly-js',
  },
  {
    name: 'macos-disk-cleanup',
    description: 'A careful Bash tool for reclaiming disk space without the usual “hope this does not break anything” energy.',
    href: 'https://github.com/ianalloway/macos-disk-cleanup',
  },
  {
    name: 'openclaw-skills',
    description: 'Published skills and workflows around sports odds, reporting, developer tooling, and agent productivity.',
    href: 'https://github.com/ianalloway/openclaw-skills',
  },
];

const caseStudyBullets = [
  'Problem: sports models are often pitched on a single win-rate number that hides whether the edge is stable or trustworthy.',
  'Approach: package reusable primitives, build a reporting layer, and expose calibration, rolling accuracy, and CLV in one place.',
  'Tradeoff: honest reporting makes the results look less flashy, but much more useful for real decision-making.',
  'Next step: connect the same evaluation pattern to additional leagues and live data sources.',
];

const quote = {
  text: 'Hired Ian to build a real-time data pipeline for our risk engine. He delivered ahead of schedule with FastAPI + Convex architecture that handles 50k events/min. Would hire again without hesitation.',
  person: 'Sarah K.',
  role: 'Lead Engineer, fintech startup',
};

const Index = () => {
  const [typedText, setTypedText] = useState('');
  const [theme, setTheme] = useState<'matrix' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'matrix' | 'light') || 'matrix';
    }
    return 'matrix';
  });
  const { toast } = useToast();
  const fullText = 'IAN ALLOWAY';

  useEffect(() => {
    document.documentElement.classList.remove('light');
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
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
            <a href="#why-hire-me" className="text-primary hover:text-primary/70 transition-colors">[WHY_ME]</a>
            <a href="#contact" className="text-primary hover:text-primary/70 transition-colors">[CONTACT]</a>
            <a href="/hireme" className="text-primary hover:text-primary/70 transition-colors">[/HIRE]</a>
            <button
              onClick={() => setTheme((prev) => (prev === 'matrix' ? 'light' : 'matrix'))}
              className="rounded-md border border-primary/30 p-2 hover:bg-primary/10 transition-all"
              aria-label="Toggle theme"
            >
              {theme === 'matrix' ? <Sun size={16} className="text-primary" /> : <Moon size={16} className="text-primary" />}
            </button>
          </div>
        </div>
      </nav>

      <section id="top" className="relative z-10 px-4 pt-28 pb-16 md:pt-36 md:pb-24">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <Badge className="mb-5 bg-primary/10 text-primary border-primary/30 font-mono hover:bg-primary/10">
              OPEN TO WORK • ML Engineer / Data Scientist
            </Badge>
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
                  <img src={project.image} alt={project.name} className="h-full w-full object-cover object-top" />
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
              <img src="/proof/sports-betting-ml-architecture.svg" alt="Sports Betting ML architecture" className="h-full w-full object-cover" />
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
            {experience.map((item) => (
              <Card key={`${item.company}-${item.title}`} className="border-primary/20 bg-card/70 backdrop-blur-sm border-l-4 border-l-primary">
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="text-sm md:text-base font-mono font-semibold text-primary">{item.title}</h3>
                      <p className="text-xs md:text-sm font-mono text-muted-foreground">{item.company}</p>
                    </div>
                    <span className="text-xs font-mono text-primary/70">{item.period}</span>
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
                    <a href={project.href} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/70 transition-colors shrink-0">
                      <ExternalLink size={18} />
                    </a>
                  </div>
                </CardContent>
              </Card>
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
              </div>
            </div>

            <div className="space-y-3 font-mono text-sm text-muted-foreground min-w-[260px]">
              <a href="mailto:ian@allowayllc.com" className="flex items-center gap-2 text-primary hover:text-primary/70 transition-colors">
                <Mail size={15} /> ian@allowayllc.com
              </a>
              <a href="https://github.com/ianalloway" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:text-primary/70 transition-colors">
                <Github size={15} /> github.com/ianalloway
              </a>
              <a href="https://www.linkedin.com/in/ianit" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:text-primary/70 transition-colors">
                <Linkedin size={15} /> linkedin.com/in/ianit
              </a>
              <a href="/hireme" className="flex items-center gap-2 text-primary hover:text-primary/70 transition-colors">
                <Briefcase size={15} /> Hire / consulting page
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-primary/20 px-4 py-8">
        <div className="mx-auto max-w-6xl flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-primary/70 text-sm font-mono">IAN.ALLOWAY.SYS</p>
            <p className="text-xs font-mono text-muted-foreground mt-1">Built with React + Tailwind. Calm UI, honest metrics, and a little bit of terminal theater.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a href="/papers/sports-ml-evaluation-case-study.html" target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-primary hover:text-primary/70 transition-colors inline-flex items-center gap-1">
              <FileText size={12} /> Case study
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
    </div>
  );
};

export default Index;
