import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Github, ExternalLink, Mail, Linkedin, Terminal, Brain, Code, GraduationCap, Bot, Download, CheckCircle2, Zap, Target, TrendingUp, Shield, Database, Cloud, Eye } from 'lucide-react';
import MatrixRain from '@/components/MatrixRain';

const HireMe = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const skills = [
    { name: 'Python', level: 95 },
    { name: 'Machine Learning', level: 90 },
    { name: 'TensorFlow / PyTorch', level: 85 },
    { name: 'SQL', level: 90 },
    { name: 'Data Analytics', level: 95 },
    { name: 'Deep Learning', level: 85 },
    { name: 'Power BI / Tableau', level: 88 },
    { name: 'Docker', level: 80 },
    { name: 'Computer Vision (YOLOv8)', level: 82 },
    { name: 'NLP', level: 85 },
    { name: 'FastAPI / React', level: 88 },
  ];

  const stack = [
    { icon: Brain, name: 'AI/ML', desc: 'TensorFlow, PyTorch, XGBoost, Scikit-learn' },
    { icon: Code, name: 'Full-Stack', desc: 'Python, React, TypeScript, FastAPI' },
    { icon: Database, name: 'Data', desc: 'PostgreSQL, SQL, Pandas, Redis' },
    { icon: Cloud, name: 'Cloud', desc: 'AWS, Docker, Git' },
    { icon: Eye, name: 'Vision', desc: 'YOLOv8, OpenCV, Computer Vision' },
    { icon: Terminal, name: 'Automation', desc: 'OpenClaw, LangChain, Agents' },
  ];

  const projects = [
    {
      name: 'NBA CLV dashboard (flagship)',
      description: 'Employer-facing eval UI: calibration, rolling accuracy, CLV block — demo JSON, swap for your backtests.',
      tech: ['FastAPI', 'Chart.js', 'Python'],
      url: 'https://github.com/ianalloway/nba-clv-dashboard',
    },
    {
      name: 'NBA ratings / nba-edge',
      description: 'Test-backed primitives: Elo, logistic win prob, Kelly helpers (PyPI package; repo nba-ratings).',
      tech: ['Python', 'Elo', 'Kelly'],
      url: 'https://github.com/ianalloway/nba-ratings',
    },
    {
      name: 'Odds drift watch',
      description: 'Webhook-based line-move monitoring with FastAPI and SQLite.',
      tech: ['FastAPI', 'SQLite', 'Sports'],
      url: 'https://github.com/ianalloway/odds-drift-watch',
    },
    {
      name: 'AI Advantage Sports',
      description: 'Sports betting platform with XGBoost ML predictions. 68.3% accuracy.',
      tech: ['Python', 'XGBoost', 'React'],
      url: 'https://aiadvantagesports.com',
    },
    {
      name: 'Repo Health',
      description: 'CLI that scores repo quality across README, CI, licensing, and maintenance signals.',
      tech: ['Python', 'CLI', 'GitHub'],
      url: 'https://github.com/ianalloway/repo-health',
    },
    {
      name: 'Backtest report generator',
      description: 'Static HTML backtest reports from evaluation JSON with calibration and CLV views.',
      tech: ['Python', 'Reporting', 'MLOps'],
      url: 'https://github.com/ianalloway/backtest-report-gen',
    },
    {
      name: 'Mutant Intelligence',
      description: 'MAYC NFT AI agents with trait-based personalities.',
      tech: ['React', 'Web3.js', 'LLMs'],
      url: 'https://mutantintelligence.com',
    },
    {
      name: 'macOS Disk Cleanup',
      description: 'Bash CLI + documented algorithm for safe cache cleanup on macOS; dry-run and ShellCheck CI.',
      tech: ['Bash', 'macOS', 'GitHub Actions'],
      url: 'https://github.com/ianalloway/macos-disk-cleanup',
    },
    {
      name: 'OSS toolkit (agents, MLOps, sports)',
      description:
        'Shipped public repos across sports analytics, evaluation dashboards, reporting, and developer tooling with clean READMEs and CI.',
      tech: ['Python', 'FastAPI', 'Bash', 'GitHub Actions'],
      url: 'https://github.com/ianalloway?tab=repositories',
    },
  ];

  const stats = [
    { value: '68%', label: 'ML Model Accuracy' },
    { value: '40%', label: 'Client Efficiency Boost' },
    { value: '30%', label: 'Fraud Reduction' },
    { value: '9', label: 'Open Source Skills' },
  ];

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      <MatrixRain />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-green-500/30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <a href="/" className="text-xl font-bold tracking-tighter hover:text-green-300 transition-colors">
            IAN.ALLOWAY
          </a>
          <nav className="flex flex-wrap gap-4 md:gap-6 text-sm">
            <a href="/toolkit" className="hover:text-green-300 transition-colors">TOOLKIT</a>
            <a href="#skills" className="hover:text-green-300 transition-colors">SKILLS</a>
            <a href="#projects" className="hover:text-green-300 transition-colors">PROJECTS</a>
            <a href="#stats" className="hover:text-green-300 transition-colors">RESULTS</a>
            <a href="#contact" className="hover:text-green-300 transition-colors">CONTACT</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
              <span className="text-green-500">&lt;</span>
              Hire Me
              <span className="text-green-500">/&gt;</span>
            </h1>
            <p className="text-xl md:text-2xl text-green-400/70 mb-8 max-w-2xl mx-auto">
              Flagship: sports ML stack — calibration-first evaluation (FastAPI + Chart.js), Elo/Kelly primitives (PyPI: <kbd className="text-green-300">nba-edge</kbd>), line-shopping CLI.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="/papers/sports-ml-evaluation-case-study.html" target="_blank" rel="noopener noreferrer" className="px-8 py-3 border border-green-500 text-green-400 hover:bg-green-500/10 transition-colors">
                Case study (PDF via print)
              </a>
              <a href="#contact" className="px-8 py-3 bg-green-500 text-black font-bold hover:bg-green-400 transition-colors">
                Get In Touch
              </a>
              <a 
                href="https://github.com/ianalloway/Resume/raw/main/Ian_Alloway_Resume_CV.docx" 
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 border border-green-500 text-green-400 hover:bg-green-500/10 transition-colors flex items-center gap-2"
              >
                <Download size={18} />
                Download Resume
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-16 px-4 bg-green-500/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-green-400 mb-2">{stat.value}</div>
                <div className="text-green-400/60 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stack */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">
            <span className="text-green-500">#</span> Tech Stack
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stack.map((item, i) => (
              <Card key={i} className="bg-green-500/5 border-green-500/20 hover:border-green-500/50 transition-colors">
                <CardContent className="p-6">
                  <item.icon className="w-8 h-8 text-green-400 mb-4" />
                  <h3 className="text-lg font-bold mb-2">{item.name}</h3>
                  <p className="text-green-400/60 text-sm">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Projects */}
      <section id="projects" className="py-20 px-4 bg-green-500/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">
            <span className="text-green-500">#</span> Featured Projects
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {projects.map((project, i) => (
              <Card key={i} className="bg-black border-green-500/20 hover:border-green-500/50 transition-colors group">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold group-hover:text-green-300 transition-colors">{project.name}</h3>
                    <a 
                      href={project.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-green-400 hover:text-green-300"
                    >
                      <ExternalLink size={20} />
                    </a>
                  </div>
                  <p className="text-green-400/70 mb-4">{project.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {project.tech.map((tech, j) => (
                      <span key={j} className="px-3 py-1 text-xs bg-green-500/10 text-green-400 rounded">
                        {tech}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Skills Bar */}
      <section id="skills" className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">
            <span className="text-green-500">#</span> Skills
          </h2>
          <div className="space-y-4">
            {skills.map((skill, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="w-32 text-right text-green-400/80">{skill.name}</span>
                <div className="flex-1 h-2 bg-green-500/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all duration-1000"
                    style={{ width: `${skill.level}%` }}
                  />
                </div>
                <span className="w-12 text-right text-green-400/60 text-sm">{skill.level}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Experience */}
      <section className="py-20 px-4 bg-green-500/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">
            <span className="text-green-500">#</span> Experience
          </h2>
          <div className="space-y-8">
            <div className="border-l-2 border-green-500/30 pl-6">
              <h3 className="text-xl font-bold">Founder & AI Engineer</h3>
              <p className="text-green-400/60 mb-2">Alloway LLC | July 2023 - Present</p>
              <p className="text-green-400/80">Built ML models improving client operational efficiency by 40%. Delivered AI solutions across sports analytics, fintech, and cybersecurity.</p>
            </div>
            <div className="border-l-2 border-green-500/30 pl-6">
              <h3 className="text-xl font-bold">Data Auditor / AI Engineer</h3>
              <p className="text-green-400/60 mb-2">Omniichain | Jan 2020 - Dec 2024</p>
              <p className="text-green-400/80">AI-based anomaly detection reducing fraud by 30%. Multi-chain blockchain data extraction from Ethereum, Solana, Polkadot.</p>
            </div>
            <div className="border-l-2 border-green-500/30 pl-6">
              <h3 className="text-xl font-bold">Task Force Manager</h3>
              <p className="text-green-400/60 mb-2">Hilton Hotels | Aug 2020 - Sept 2023</p>
              <p className="text-green-400/80">Directed operational improvements. Achieved 20% guest satisfaction increases. P&L management.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Education */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">
            <span className="text-green-500">#</span> Education
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-green-500/5 border-green-500/20">
              <CardContent className="p-6">
                <GraduationCap className="w-8 h-8 text-green-400 mb-4" />
                <h3 className="text-xl font-bold">MS in Artificial Intelligence</h3>
                <p className="text-green-400/60">University of South Florida</p>
                <p className="text-green-400/40 text-sm">Starting Aug 2026</p>
              </CardContent>
            </Card>
            <Card className="bg-green-500/5 border-green-500/20">
              <CardContent className="p-6">
                <GraduationCap className="w-8 h-8 text-green-400 mb-4" />
                <h3 className="text-xl font-bold">BS in Information Science</h3>
                <p className="text-green-400/60">University of South Florida</p>
                <p className="text-green-400/40 text-sm">Expected May 2026</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-20 px-4 bg-green-500/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">
            <span className="text-green-500">#</span> Certifications
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              'Deep Learning Specialization (Andrew Ng)',
              'Machine Learning Engineering (Google Cloud)',
              'AWS Certified Cloud Practitioner',
              'Blockchain Fundamentals (UC Berkeley)',
              'Tableau Desktop Certified Professional',
              'Oracle Database SQL Certified',
            ].map((cert, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-black/50 border border-green-500/20">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-green-400/80 text-sm">{cert}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">
            <span className="text-green-500">#</span> Let's Talk
          </h2>
          <p className="text-green-400/70 mb-8">
            Looking for ML engineers, data scientists, or AI talent. Or maybe you need someone to build your ML pipeline.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href="mailto:ian@allowayllc.com"
              className="px-6 py-3 bg-green-500 text-black font-bold hover:bg-green-400 transition-colors flex items-center gap-2"
            >
              <Mail size={18} />
              ian@allowayllc.com
            </a>
            <a 
              href="https://linkedin.com/in/ianit"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 border border-green-500 text-green-400 hover:bg-green-500/10 transition-colors flex items-center gap-2"
            >
              <Linkedin size={18} />
              LinkedIn
            </a>
            <a 
              href="https://github.com/ianalloway"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 border border-green-500 text-green-400 hover:bg-green-500/10 transition-colors flex items-center gap-2"
            >
              <Github size={18} />
              GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-green-500/20">
        <div className="max-w-6xl mx-auto text-center text-green-400/40 text-sm">
          <p>IAN.ALLOWAY — AI/ML Engineer & Data Scientist</p>
          <p className="mt-2">Built with Python. Deployed with Vercel.⚡</p>
        </div>
      </footer>
    </div>
  );
};

export default HireMe;
