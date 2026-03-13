import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Github, ExternalLink, Mail, Linkedin, Terminal, Brain, Code, GraduationCap, Download, CheckCircle2, Database, Cloud, Eye, Sun, Moon } from 'lucide-react';
import MatrixRain from '@/components/MatrixRain';

const HireMe = () => {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'matrix' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'matrix' | 'light') || 'matrix';
    }
    return 'matrix';
  });

  useEffect(() => {
    document.documentElement.classList.remove('light');
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'matrix' ? 'light' : 'matrix');
  };

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
      name: 'AI Advantage Sports',
      description: 'Sports betting platform with XGBoost ML predictions. 68.3% accuracy.',
      tech: ['Python', 'XGBoost', 'React'],
      url: 'https://aiadvantagesports.com',
    },
    {
      name: 'Money Maker Bot',
      description: 'Financial intelligence agent. 8-component architecture.',
      tech: ['Python', 'OpenClaw', 'Anthropic API'],
      url: 'https://github.com/ianalloway/Money-maker-bot',
    },
    {
      name: 'Drone AI',
      description: 'Autonomous vehicle with YOLOv8, A*/RRT* path planning.',
      tech: ['Python', 'PyTorch', 'MAVLink'],
      url: 'https://github.com/ianalloway/ai-drone-auto-vehicle',
    },
    {
      name: 'Mutant Intelligence',
      description: 'MAYC NFT AI agents with trait-based personalities.',
      tech: ['React', 'Web3.js', 'LLMs'],
      url: 'https://mutantintelligence.com',
    },
  ];

  const stats = [
    { value: '68%', label: 'ML Model Accuracy' },
    { value: '40%', label: 'Client Efficiency Boost' },
    { value: '30%', label: 'Fraud Reduction' },
    { value: '9', label: 'Open Source Skills' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-mono">
      {theme === 'matrix' && <MatrixRain />}
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-primary/30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <a href="/" className="text-xl font-bold tracking-tighter text-primary hover:text-primary/70 transition-colors">
            IAN.ALLOWAY
          </a>
          <nav className="flex gap-6 text-sm items-center">
            <a href="#skills" className="text-primary hover:text-primary/70 transition-colors">SKILLS</a>
            <a href="#projects" className="text-primary hover:text-primary/70 transition-colors">PROJECTS</a>
            <a href="#stats" className="text-primary hover:text-primary/70 transition-colors">RESULTS</a>
            <a href="#contact" className="text-primary hover:text-primary/70 transition-colors">CONTACT</a>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md border border-primary/30 hover:bg-primary/10 transition-all"
              aria-label="Toggle theme"
            >
              {theme === 'matrix' ? <Sun size={16} className="text-primary" /> : <Moon size={16} className="text-primary" />}
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight text-primary matrix-text">
              <span className="text-primary">&lt;</span>
              Hire Me
              <span className="text-primary">/&gt;</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              AI/ML Engineer + Data Scientist building production systems that ship.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="#contact" className="px-8 py-3 bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors">
                Get In Touch
              </a>
              <a 
                href="https://github.com/ianalloway/Resume/raw/main/Ian_Alloway_Resume_CV.docx" 
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 border border-primary text-primary hover:bg-primary/10 transition-colors flex items-center gap-2"
              >
                <Download size={18} />
                Download Resume
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-16 px-4 bg-primary/5 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2 matrix-text">{stat.value}</div>
                <div className="text-muted-foreground text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stack */}
      <section className="py-20 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center text-primary">
            <span className="text-primary">#</span> Tech Stack
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stack.map((item, i) => (
              <Card key={i} className="terminal-border bg-card/80 backdrop-blur-sm hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <item.icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="text-lg font-bold mb-2 text-foreground">{item.name}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Projects */}
      <section id="projects" className="py-20 px-4 bg-primary/5 relative z-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center text-primary">
            <span className="text-primary">#</span> Featured Projects
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {projects.map((project, i) => (
              <Card key={i} className="terminal-border bg-card/80 backdrop-blur-sm hover:border-primary/50 transition-colors group">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-primary group-hover:text-primary/70 transition-colors">{project.name}</h3>
                    <a 
                      href={project.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/70"
                    >
                      <ExternalLink size={20} />
                    </a>
                  </div>
                  <p className="text-muted-foreground mb-4">{project.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {project.tech.map((tech, j) => (
                      <span key={j} className="px-3 py-1 text-xs terminal-border text-primary rounded font-mono">
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
      <section id="skills" className="py-20 px-4 relative z-10">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center text-primary">
            <span className="text-primary">#</span> Skills
          </h2>
          <div className="space-y-4">
            {skills.map((skill, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="w-40 text-right text-primary/80 text-sm">{skill.name}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-1000 rounded-full"
                    style={{ width: `${skill.level}%` }}
                  />
                </div>
                <span className="w-12 text-right text-muted-foreground text-sm">{skill.level}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Experience */}
      <section className="py-20 px-4 bg-primary/5 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center text-primary">
            <span className="text-primary">#</span> Experience
          </h2>
          <div className="space-y-8">
            <div className="border-l-2 border-primary/30 pl-6">
              <h3 className="text-xl font-bold text-foreground">Founder & AI Engineer</h3>
              <p className="text-muted-foreground mb-2">Alloway LLC | July 2023 - Present</p>
              <p className="text-muted-foreground/80">Built ML models improving client operational efficiency by 40%. Delivered AI solutions across sports analytics, fintech, and cybersecurity.</p>
            </div>
            <div className="border-l-2 border-primary/30 pl-6">
              <h3 className="text-xl font-bold text-foreground">Data Auditor / AI Engineer</h3>
              <p className="text-muted-foreground mb-2">Omniichain | Jan 2020 - Dec 2024</p>
              <p className="text-muted-foreground/80">AI-based anomaly detection reducing fraud by 30%. Multi-chain blockchain data extraction from Ethereum, Solana, Polkadot.</p>
            </div>
            <div className="border-l-2 border-primary/30 pl-6">
              <h3 className="text-xl font-bold text-foreground">Task Force Manager</h3>
              <p className="text-muted-foreground mb-2">Hilton Hotels | Aug 2020 - Sept 2023</p>
              <p className="text-muted-foreground/80">Directed operational improvements. Achieved 20% guest satisfaction increases. P&L management.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Education */}
      <section className="py-20 px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center text-primary">
            <span className="text-primary">#</span> Education
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="terminal-border bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <GraduationCap className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-xl font-bold text-foreground">MS in Artificial Intelligence</h3>
                <p className="text-muted-foreground">University of South Florida</p>
                <p className="text-muted-foreground/60 text-sm">Expected Dec 2027</p>
              </CardContent>
            </Card>
            <Card className="terminal-border bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <GraduationCap className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-xl font-bold text-foreground">BS in Data Science & Analytics</h3>
                <p className="text-muted-foreground">University of South Florida</p>
                <p className="text-muted-foreground/60 text-sm">Expected Dec 2025</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-20 px-4 bg-primary/5 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center text-primary">
            <span className="text-primary">#</span> Certifications
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
              <div key={i} className="flex items-center gap-3 p-4 terminal-border bg-card/80 rounded">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-muted-foreground text-sm">{cert}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 px-4 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8 text-primary">
            <span className="text-primary">#</span> Let's Talk
          </h2>
          <p className="text-muted-foreground mb-8">
            Looking for ML engineers, data scientists, or AI talent. Or maybe you need someone to build your ML pipeline.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href="mailto:ian@allowayllc.com"
              className="px-6 py-3 bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Mail size={18} />
              ian@allowayllc.com
            </a>
            <a 
              href="https://linkedin.com/in/ianit"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 border border-primary text-primary hover:bg-primary/10 transition-colors flex items-center gap-2"
            >
              <Linkedin size={18} />
              LinkedIn
            </a>
            <a 
              href="https://github.com/ianalloway"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 border border-primary text-primary hover:bg-primary/10 transition-colors flex items-center gap-2"
            >
              <Github size={18} />
              GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-primary/20 relative z-10">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground text-sm font-mono">
          <p>IAN.ALLOWAY — AI/ML Engineer & Data Scientist</p>
          <p className="mt-2">Built with React + Tailwind. Deployed on Netlify. ⚡</p>
        </div>
      </footer>
    </div>
  );
};

export default HireMe;
