import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Github,
  GraduationCap,
  Linkedin,
  Mail,
  ShieldCheck,
  Target,
  Terminal,
} from 'lucide-react';
import MatrixRain from '@/components/MatrixRain';

const fitPoints = [
  'ML Engineer roles where evaluation quality matters as much as model lift.',
  'Applied AI teams that need APIs, dashboards, and product-facing delivery around the model.',
  'Data science or analytics engineering roles with forecasting, experimentation, risk, or decision-support work.',
  'Teams that want someone who can ship clean public proof instead of just talking about what they could build.',
];

const outcomes = [
  { label: '40%', detail: 'client efficiency improvement through analytics and automation work' },
  { label: '30%', detail: 'fraud reduction support from anomaly detection and blockchain analytics work' },
  { label: '4', detail: 'flagship public projects that show modeling, evaluation, deployment, and tooling' },
  { label: '2026', detail: 'B.S. in Information Science completion, with M.S. in AI starting the same year' },
];

const featuredWork = [
  {
    name: 'AI Advantage Sports',
    image: '/proof/ai-advantage-screenshot.png',
    href: 'https://github.com/ianalloway/ai-advantage',
    stack: 'Python, React, XGBoost, FastAPI',
    whyItMatters:
      'Shows product thinking and ML delivery together: model-backed recommendations, real UI, and something users can actually evaluate.',
  },
  {
    name: 'NBA CLV Dashboard',
    image: '/proof/nba-clv-dashboard.svg',
    href: 'https://github.com/ianalloway/nba-clv-dashboard',
    stack: 'FastAPI, Chart.js, Python',
    whyItMatters:
      'A concrete example of how I build evaluation-first systems instead of hiding behind headline accuracy.',
  },
  {
    name: 'Sports Betting ML',
    image: '/proof/sports-betting-ml-demo.gif',
    href: 'https://github.com/ianalloway/sports-betting-ml',
    stack: 'Python, FastAPI, MLOps, Hugging Face',
    whyItMatters:
      'Demonstrates full workflow ownership from feature engineering to deployment and public demo packaging.',
  },
  {
    name: 'Repo Health',
    image: '/proof/repo-health.svg',
    href: 'https://github.com/ianalloway/repo-health',
    stack: 'Python, CLI, GitHub APIs',
    whyItMatters:
      'Useful evidence that I can build practical tools with strong developer UX outside of ML too.',
  },
];

const workStyle = [
  'I build the layer around the model, not just the model itself.',
  'I favor evaluation honesty over inflated metrics and glossy dashboards.',
  'I document and package work so another engineer can actually use it.',
  'I am comfortable turning vague ideas into something stakeholders can click, inspect, and discuss.',
];

const education = [
  {
    title: 'B.S. Information Science',
    sub: 'University of South Florida',
    meta: 'Expected May 2026',
  },
  {
    title: 'M.S. Artificial Intelligence',
    sub: 'University of South Florida',
    meta: 'Starting August 2026',
  },
];

const HireMe = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono overflow-x-hidden">
      <MatrixRain />

      <header className="fixed top-0 left-0 right-0 z-50 bg-black/82 backdrop-blur-md border-b border-green-500/20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <a href="/" className="text-lg md:text-xl font-bold tracking-tight hover:text-green-300 transition-colors flex items-center gap-2">
            <Terminal size={18} /> IAN.ALLOWAY
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm text-green-400/80">
            <a href="#fit" className="hover:text-green-300 transition-colors">FIT</a>
            <a href="#proof" className="hover:text-green-300 transition-colors">PROOF</a>
            <a href="#approach" className="hover:text-green-300 transition-colors">APPROACH</a>
            <a href="#contact" className="hover:text-green-300 transition-colors">CONTACT</a>
          </nav>
        </div>
      </header>

      <section className="relative z-10 px-4 pt-28 pb-16 md:pt-36 md:pb-24">
        <div className="max-w-6xl mx-auto grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Badge className="mb-5 bg-green-500/10 text-green-300 border-green-500/30 hover:bg-green-500/10">
              OPEN TO WORK • ML Engineer / Data Scientist
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold leading-[0.95] tracking-tight text-white mb-5">
              Hire me for the part after the model too.
            </h1>
            <p className="text-lg md:text-xl text-green-400/75 max-w-3xl mb-5">
              I build evaluation-first analytics and decision-support products: models, APIs, dashboards, reporting, and the surrounding product layer that makes the work usable.
            </p>
            <p className="text-sm md:text-base text-green-400/65 max-w-2xl leading-relaxed mb-8">
              Best fit: ML engineering, applied AI, analytics engineering, and data science roles where someone needs more than a notebook and a nice chart. That is probably also why my favorite project category is “things that keep dashboards honest.”
            </p>
            <div className="flex flex-wrap gap-3">
              <Button className="bg-green-500 text-black hover:bg-green-400 font-mono" asChild>
                <a href="mailto:ian@allowayllc.com">
                  <Mail className="mr-2" size={16} /> Contact Me
                </a>
              </Button>
              <Button variant="outline" className="border-green-500/40 text-green-300 hover:bg-green-500/10 font-mono" asChild>
                <a href="/Ian_Alloway_Resume_CV.pdf" download>
                  <Download className="mr-2" size={16} /> Download Resume
                </a>
              </Button>
              <Button variant="outline" className="border-green-500/40 text-green-300 hover:bg-green-500/10 font-mono" asChild>
                <a href="/papers/sports-ml-evaluation-case-study.html" target="_blank" rel="noopener noreferrer">
                  <FileText className="mr-2" size={16} /> View Case Study
                </a>
              </Button>
            </div>
          </div>

          <Card className="border-green-500/20 bg-green-500/5 backdrop-blur-sm">
            <CardContent className="p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-green-400/65 mb-4">The Simple Pitch</p>
              <div className="space-y-4 text-sm text-green-400/75 leading-relaxed">
                <p>I build applied ML systems that are easier to trust because the evaluation layer is part of the work, not an afterthought.</p>
                <p>My public proof is strongest in sports analytics, forecasting-style tooling, and developer utilities, but the underlying skill transfers well to risk, experimentation, fraud, and product analytics.</p>
                <p>Currently finishing my B.S. in Information Science and starting an M.S. in Artificial Intelligence in August 2026.</p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3 text-sm">
                <a href="https://github.com/ianalloway" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-green-300 hover:text-green-200 transition-colors">
                  <Github size={15} /> GitHub
                </a>
                <a href="https://www.linkedin.com/in/ianit" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-green-300 hover:text-green-200 transition-colors">
                  <Linkedin size={15} /> LinkedIn
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="fit" className="relative z-10 px-4 pb-16">
        <div className="max-w-6xl mx-auto grid gap-4 md:grid-cols-2">
          {fitPoints.map((point) => (
            <div key={point} className="rounded-2xl border border-green-500/20 bg-green-500/5 px-5 py-5 backdrop-blur-sm flex gap-3">
              <Target size={18} className="text-green-300 mt-0.5 shrink-0" />
              <p className="text-sm text-green-400/78 leading-relaxed">{point}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 px-4 py-16 bg-green-500/5">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {outcomes.map((item) => (
            <Card key={item.label} className="border-green-500/20 bg-black/50">
              <CardContent className="p-5">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">{item.label}</div>
                <p className="text-sm text-green-400/70 leading-relaxed">{item.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="proof" className="relative z-10 px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mb-10">
            <p className="text-xs uppercase tracking-[0.2em] text-green-400/65 mb-3">Proof</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">The work that makes the strongest hiring case</h2>
            <p className="text-sm md:text-base text-green-400/72 leading-relaxed">
              These projects show the combination I want teams to notice: applied ML, evaluation discipline, product-minded implementation, and clean developer delivery.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {featuredWork.map((project) => (
              <Card key={project.name} className="overflow-hidden border-green-500/20 bg-black/55 backdrop-blur-sm">
                <div className="aspect-[16/10] overflow-hidden border-b border-green-500/20 bg-black/40">
                  <img src={project.image} alt={project.name} className="h-full w-full object-cover object-top" />
                </div>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{project.name}</h3>
                      <p className="text-sm text-green-400/60">{project.stack}</p>
                    </div>
                    <a href={project.href} target="_blank" rel="noopener noreferrer" className="text-green-300 hover:text-green-200 transition-colors shrink-0">
                      <ExternalLink size={18} />
                    </a>
                  </div>
                  <p className="text-sm text-green-400/78 leading-relaxed">{project.whyItMatters}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="approach" className="relative z-10 px-4 py-16 bg-green-500/5">
        <div className="max-w-6xl mx-auto grid gap-8 lg:grid-cols-[1fr_0.95fr] items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-green-400/65 mb-3">Approach</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How I work when the goal is real trust, not just a good demo</h2>
            <div className="space-y-4">
              {workStyle.map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-green-500/20 bg-black/40 px-5 py-5">
                  <ShieldCheck size={18} className="text-green-300 mt-0.5 shrink-0" />
                  <p className="text-sm text-green-400/78 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Card className="border-green-500/20 bg-black/50">
              <CardContent className="p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-green-400/65 mb-3">Education</p>
                <div className="space-y-4">
                  {education.map((item) => (
                    <div key={item.title} className="rounded-2xl border border-green-500/15 bg-green-500/5 px-4 py-4">
                      <div className="flex items-start gap-3">
                        <GraduationCap size={18} className="text-green-300 mt-0.5 shrink-0" />
                        <div>
                          <h3 className="text-white font-bold">{item.title}</h3>
                          <p className="text-sm text-green-400/75">{item.sub}</p>
                          <p className="text-sm text-green-400/55">{item.meta}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-500/20 bg-black/50">
              <CardContent className="p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-green-400/65 mb-3">Quick Links</p>
                <div className="space-y-3 text-sm">
                  <a href="https://github.com/ianalloway" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-green-300 hover:text-green-200 transition-colors">
                    <Github size={15} /> GitHub profile
                  </a>
                  <a href="https://www.linkedin.com/in/ianit" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-green-300 hover:text-green-200 transition-colors">
                    <Linkedin size={15} /> LinkedIn
                  </a>
                  <a href="/papers/sports-ml-evaluation-case-study.html" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-green-300 hover:text-green-200 transition-colors">
                    <BarChart3 size={15} /> Sports ML case study
                  </a>
                  <a href="/" className="flex items-center gap-2 text-green-300 hover:text-green-200 transition-colors">
                    <ArrowRight size={15} /> Back to portfolio
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="contact" className="relative z-10 px-4 py-16">
        <div className="max-w-5xl mx-auto rounded-[28px] border border-green-500/20 bg-green-500/5 p-8 md:p-10 backdrop-blur-sm">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-green-400/65 mb-3">Contact</p>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">If your team needs honest evaluation and shipped product thinking, I’d love to talk.</h2>
              <p className="text-sm md:text-base text-green-400/72 leading-relaxed mb-6 max-w-3xl">
                I’m most interested in ML engineering, applied AI, analytics engineering, and data science roles. Full-time is the priority, but I’m also open to strong contract work where the scope is meaningful.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button className="bg-green-500 text-black hover:bg-green-400 font-mono" asChild>
                  <a href="mailto:ian@allowayllc.com">
                    <Mail className="mr-2" size={16} /> Email Ian
                  </a>
                </Button>
                <Button variant="outline" className="border-green-500/40 text-green-300 hover:bg-green-500/10 font-mono" asChild>
                  <a href="/Ian_Alloway_Resume_CV.pdf" download>
                    <Download className="mr-2" size={16} /> Resume PDF
                  </a>
                </Button>
                <Button variant="outline" className="border-green-500/40 text-green-300 hover:bg-green-500/10 font-mono" asChild>
                  <a href="https://www.linkedin.com/in/ianit" target="_blank" rel="noopener noreferrer">
                    <Briefcase className="mr-2" size={16} /> LinkedIn
                  </a>
                </Button>
              </div>
            </div>

            <div className="space-y-3 min-w-[250px] text-sm text-green-400/72">
              <a href="mailto:ian@allowayllc.com" className="flex items-center gap-2 text-green-300 hover:text-green-200 transition-colors">
                <Mail size={15} /> ian@allowayllc.com
              </a>
              <a href="https://github.com/ianalloway" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-green-300 hover:text-green-200 transition-colors">
                <Github size={15} /> github.com/ianalloway
              </a>
              <a href="https://www.linkedin.com/in/ianit" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-green-300 hover:text-green-200 transition-colors">
                <Linkedin size={15} /> linkedin.com/in/ianit
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HireMe;
