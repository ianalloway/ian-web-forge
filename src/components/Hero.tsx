import { Button } from '@/components/ui/button';
import { Github, Linkedin, Mail, Twitter, BookOpen, Download } from 'lucide-react';

const Hero = () => {
  return (
    <section id="home" className="min-h-screen flex items-center justify-center relative overflow-hidden">      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center animate-fade-in matrix-glow p-8 terminal-border bg-background/80 backdrop-blur-sm">
          <div className="mb-4 text-primary font-mono text-sm">
            <span className="animate-terminal-blink">_</span> SYSTEM ONLINE
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 matrix-text font-mono">
            <span className="text-foreground">&gt; </span>
            <span className="text-primary">
              IAN ALLOWAY
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto font-mono">
            ML Engineer | Data Scientist | AI Builder
          </p>
          <p className="text-muted-foreground mb-4 font-mono">
            B.S. Data Science @ USF (May 2026) | M.S. AI @ USF (Fall 2026) | Founder @ Alloway LLC
          </p>

          <div className="inline-block px-4 py-2 mb-8 border border-green-400/50 rounded-lg bg-green-400/10">
            <span className="text-green-400 font-mono text-sm font-bold">OPEN TO WORK</span>
            <span className="text-muted-foreground font-mono text-sm"> - Data Scientist / ML Engineer roles</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <Button variant="outline" className="font-mono terminal-border text-primary border-primary hover:bg-primary/10" asChild>
              <a href="https://www.linkedin.com/in/ianit" target="_blank" rel="noopener noreferrer">
                <Linkedin className="mr-2" size={16} /> LinkedIn
              </a>
            </Button>
            <Button variant="outline" className="font-mono terminal-border text-primary border-primary hover:bg-primary/10" asChild>
              <a href="https://x.com/ianallowayxyz" target="_blank" rel="noopener noreferrer">
                <Twitter className="mr-2" size={16} /> Twitter/X
              </a>
            </Button>
            <Button variant="outline" className="font-mono terminal-border text-primary border-primary hover:bg-primary/10" asChild>
              <a href="https://github.com/ianalloway" target="_blank" rel="noopener noreferrer">
                <Github className="mr-2" size={16} /> GitHub
              </a>
            </Button>
            <Button variant="outline" className="font-mono terminal-border text-primary border-primary hover:bg-primary/10" asChild>
              <a href="https://allowayai.substack.com" target="_blank" rel="noopener noreferrer">
                <BookOpen className="mr-2" size={16} /> Blog
              </a>
            </Button>
            <Button variant="outline" className="font-mono terminal-border text-primary border-primary hover:bg-primary/10" asChild>
              <a href="mailto:ian@allowayllc.com">
                <Mail className="mr-2" size={16} /> Email
              </a>
            </Button>
            <Button variant="outline" className="font-mono terminal-border text-primary border-primary hover:bg-primary/10" asChild>
              <a href="/Ian_Alloway_Resume.pdf" download>
                <Download className="mr-2" size={16} /> Resume
              </a>
            </Button>
          </div>
          
          <Button 
            size="lg" 
            className="bg-primary text-background hover:bg-primary/80 hover:shadow-glow transition-all duration-300 font-mono terminal-border"
            asChild
          >
            <a href="#contact">&gt; GET_IN_TOUCH</a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
