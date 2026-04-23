import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Github, Linkedin, Mail, Twitter, BookOpen, Download, Zap, ArrowDown } from 'lucide-react';

const ROLES = [
  'ML Engineer',
  'Data Scientist',
  'AI Builder',
  'Sports Analytics',
  'Open Source Dev',
  'Evaluation-First',
];

const QUICK_STATS = [
  { value: '68.3%', label: 'Model Accuracy', sub: 'NBA betting model' },
  { value: '60+', label: 'GitHub Repos', sub: 'public repositories' },
  { value: '9', label: 'OSS Skills', sub: 'published on ClawHub' },
  { value: 'PyPI', label: 'nba-edge', sub: 'installable package' },
];

const Hero = () => {
  const [roleIndex, setRoleIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    const current = ROLES[roleIndex];
    let timeout: ReturnType<typeof setTimeout>;
    if (!deleting && charIndex < current.length) {
      timeout = setTimeout(() => {
        setDisplayed(current.slice(0, charIndex + 1));
        setCharIndex(c => c + 1);
      }, 60);
    } else if (!deleting && charIndex === current.length) {
      timeout = setTimeout(() => setDeleting(true), 1800);
    } else if (deleting && charIndex > 0) {
      timeout = setTimeout(() => {
        setDisplayed(current.slice(0, charIndex - 1));
        setCharIndex(c => c - 1);
      }, 30);
    } else if (deleting && charIndex === 0) {
      setDeleting(false);
      setRoleIndex(r => (r + 1) % ROLES.length);
    }
    return () => clearTimeout(timeout);
  }, [charIndex, deleting, roleIndex]);

  return (
    <section id="home" className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Radial glow behind hero */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 40%, hsl(120 100% 50% / 0.06) 0%, transparent 70%)',
        }}
      />

      <div className="container mx-auto px-4 relative z-10 py-20">
        <div className="max-w-4xl mx-auto text-center">

          {/* Status badge */}
          <div className="mb-8 flex justify-center">
            <span className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-green-400/40 bg-green-400/8 text-green-400 font-mono text-xs font-bold tracking-widest uppercase animate-border-glow shadow-[0_0_20px_hsl(120_100%_50%/0.1)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
              </span>
              Open to Work · ML Engineer / Data Scientist
            </span>
          </div>

          {/* System line */}
          <div className="mb-4 text-primary/60 font-mono text-xs tracking-[0.3em] uppercase">
            <span className="animate-terminal-blink">_</span> SYSTEM ONLINE · USF M.S. AI · 2026
          </div>

          {/* Name */}
          <h1 className="text-6xl md:text-8xl font-bold mb-6 font-mono animate-glow-pulse leading-none">
            <span className="text-foreground/40">&gt; </span>
            <span className="gradient-text">IAN ALLOWAY</span>
          </h1>

          {/* Typewriter */}
          <div className="h-12 flex items-center justify-center mb-6">
            <p className="text-xl md:text-2xl font-mono">
              <span className="text-primary/50">// </span>
              <span className="text-foreground/90">{displayed}</span>
              <span className="animate-terminal-blink text-primary text-2xl leading-none">|</span>
            </p>
          </div>

          {/* Bio */}
          <p className="text-muted-foreground font-mono text-sm max-w-2xl mx-auto leading-relaxed mb-10">
            Building evaluation-first ML systems that survive contact with real users.
            APIs, dashboards, reporting layers, and developer tools that make model behavior
            easier to trust.
          </p>

          {/* Quick stats */}
          <div className="flex flex-wrap justify-center gap-0 mb-10 rounded-xl border border-primary/15 bg-card/50 backdrop-blur-sm overflow-hidden max-w-2xl mx-auto">
            {QUICK_STATS.map((s, i) => (
              <div
                key={s.label}
                className={`flex-1 min-w-[120px] text-center py-4 px-3 ${i < QUICK_STATS.length - 1 ? 'border-r border-primary/15' : ''}`}
              >
                <div className="text-xl font-bold font-mono text-primary">{s.value}</div>
                <div className="text-[10px] font-mono font-bold text-foreground/80 uppercase tracking-widest mt-0.5">{s.label}</div>
                <div className="text-[9px] font-mono text-muted-foreground/70 mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Social links */}
          <div className="flex flex-wrap justify-center gap-2.5 mb-8">
            {[
              { href: 'https://www.linkedin.com/in/ianit', icon: Linkedin, label: 'LinkedIn', external: true },
              { href: 'https://x.com/ianallowayxyz', icon: Twitter, label: 'Twitter/X', external: true },
              { href: 'https://github.com/ianalloway', icon: Github, label: 'GitHub', external: true },
              { href: 'https://allowayai.substack.com', icon: BookOpen, label: 'Blog', external: true },
              { href: 'mailto:ian@allowayllc.com', icon: Mail, label: 'Email', external: false },
              { href: '/Ian_Alloway_Resume.pdf', icon: Download, label: 'Resume', external: false, download: true },
            ].map((link) => (
              <Button
                key={link.label}
                variant="outline"
                size="sm"
                className="font-mono terminal-border text-primary border-primary/30 hover:bg-primary/10 hover:border-primary/60 hover:shadow-[0_0_14px_hsl(120_100%_50%/0.25)] transition-all duration-200 text-xs"
                asChild
              >
                <a
                  href={link.href}
                  target={link.external ? '_blank' : undefined}
                  rel={link.external ? 'noopener noreferrer' : undefined}
                  download={link.download ? true : undefined}
                >
                  <link.icon className="mr-1.5" size={13} />
                  {link.label}
                </a>
              </Button>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <Button
              size="lg"
              className="bg-primary text-background hover:bg-primary/85 hover:shadow-[0_0_24px_hsl(120_100%_50%/0.5)] transition-all duration-300 font-mono font-bold tracking-wider"
              asChild
            >
              <a href="#contact">&gt; GET_IN_TOUCH</a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="font-mono terminal-border text-primary border-primary/40 hover:bg-primary/10 hover:border-primary/70 transition-all duration-300"
              asChild
            >
              <a href="#featured">
                <Zap size={15} className="mr-2" />
                VIEW_WORK
              </a>
            </Button>
          </div>

          {/* Scroll indicator */}
          <a href="#featured" className="inline-flex flex-col items-center gap-1 text-muted-foreground/50 hover:text-primary transition-colors duration-200 animate-float">
            <span className="text-[10px] font-mono uppercase tracking-widest">scroll</span>
            <ArrowDown size={14} />
          </a>

        </div>
      </div>
    </section>
  );
};

export default Hero;
