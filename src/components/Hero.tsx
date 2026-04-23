import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Github, Linkedin, Mail, Twitter, BookOpen, Download, Zap } from 'lucide-react';

const ROLES = [
  'ML Engineer',
  'Data Scientist',
  'AI Builder',
  'Sports Analytics',
  'Open Source Dev',
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
        setCharIndex((c) => c + 1);
      }, 65);
    } else if (!deleting && charIndex === current.length) {
      timeout = setTimeout(() => setDeleting(true), 1800);
    } else if (deleting && charIndex > 0) {
      timeout = setTimeout(() => {
        setDisplayed(current.slice(0, charIndex - 1));
        setCharIndex((c) => c - 1);
      }, 35);
    } else if (deleting && charIndex === 0) {
      setDeleting(false);
      setRoleIndex((r) => (r + 1) % ROLES.length);
    }

    return () => clearTimeout(timeout);
  }, [charIndex, deleting, roleIndex]);

  return (
    <section id="home" className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center animate-fade-in matrix-glow p-8 terminal-border bg-background/80 backdrop-blur-sm">

          {/* Status badge */}
          <div className="mb-6 flex justify-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-green-400/40 bg-green-400/10 text-green-400 font-mono text-xs font-bold tracking-widest uppercase">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
              </span>
              Open to Work · Data Scientist / ML Engineer
            </span>
          </div>

          {/* System boot line */}
          <div className="mb-3 text-primary font-mono text-sm tracking-widest">
            <span className="animate-terminal-blink">_</span> SYSTEM ONLINE · USF M.S. AI · 2026
          </div>

          {/* Name */}
          <h1 className="text-5xl md:text-7xl font-bold mb-4 matrix-text font-mono animate-glow-pulse">
            <span className="text-foreground/60">&gt; </span>
            <span className="text-primary">IAN ALLOWAY</span>
          </h1>

          {/* Typewriter role */}
          <div className="h-10 flex items-center justify-center mb-6">
            <p className="text-xl md:text-2xl text-muted-foreground font-mono">
              <span className="text-primary/80">// </span>
              <span className="text-foreground">{displayed}</span>
              <span className="animate-terminal-blink text-primary">|</span>
            </p>
          </div>

          {/* Subtitle */}
          <p className="text-muted-foreground mb-8 font-mono text-sm max-w-xl mx-auto leading-relaxed">
            B.S. Information Science @ USF (May 2026) &nbsp;·&nbsp; M.S. AI @ USF (Aug 2026)
            <br />
            Founder @ Alloway LLC &nbsp;·&nbsp; Open source contributor
          </p>

          {/* Quick stats row */}
          <div className="flex flex-wrap justify-center gap-6 mb-8 font-mono text-xs text-muted-foreground">
            {[
              { label: 'GitHub Repos', value: '60+' },
              { label: 'PyPI Package', value: 'nba-edge' },
              { label: 'Model Accuracy', value: '68.3%' },
              { label: 'OSS Skills', value: '9 published' },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-0.5 px-4 border-l border-primary/20 first:border-l-0">
                <span className="text-primary text-lg font-bold">{s.value}</span>
                <span className="text-muted-foreground/70 uppercase tracking-widest text-[10px]">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Social links */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
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
                className="font-mono terminal-border text-primary border-primary hover:bg-primary/10 hover:shadow-[0_0_12px_hsl(120_100%_50%/0.3)] transition-all duration-200"
                asChild
              >
                <a
                  href={link.href}
                  target={link.external ? '_blank' : undefined}
                  rel={link.external ? 'noopener noreferrer' : undefined}
                  download={link.download ? true : undefined}
                >
                  <link.icon className="mr-2" size={15} />
                  {link.label}
                </a>
              </Button>
            ))}
          </div>

          {/* CTA */}
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              className="bg-primary text-background hover:bg-primary/80 hover:shadow-[0_0_20px_hsl(120_100%_50%/0.5)] transition-all duration-300 font-mono terminal-border"
              asChild
            >
              <a href="#contact">&gt; GET_IN_TOUCH</a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="font-mono terminal-border text-primary border-primary hover:bg-primary/10 transition-all duration-300"
              asChild
            >
              <a href="#projects">
                <Zap size={16} className="mr-2" />
                VIEW_WORK
              </a>
            </Button>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
