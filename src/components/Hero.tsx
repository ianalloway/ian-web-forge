import { Button } from '@/components/ui/button';
import { Github, Linkedin, Mail, ChevronDown } from 'lucide-react';
import heroImage from '@/assets/hero-tech.jpg';

const Hero = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="min-h-screen flex items-center justify-center relative overflow-hidden">      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center animate-fade-in matrix-glow p-8 terminal-border bg-background/80 backdrop-blur-sm">
          <div className="mb-4 text-primary font-mono text-sm">
            <span className="animate-terminal-blink">█</span> SYSTEM ONLINE
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 matrix-text font-mono">
            <span className="text-foreground">&gt; ACCESSING: </span>
            <span className="text-primary">
              IAN.ALLOWAY
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto font-mono matrix-text">
            &gt; INITIALIZING: Full Stack Developer Protocol<br/>
            &gt; STATUS: Building innovative digital solutions<br/>
            &gt; SPECIALIZATION: Modern web technologies
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              size="lg" 
              className="bg-primary text-background hover:bg-primary/80 hover:shadow-glow transition-all duration-300 font-mono terminal-border"
              onClick={() => scrollToSection('projects')}
            >
              [VIEW_PROJECTS.EXE]
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="font-mono terminal-border text-primary border-primary hover:bg-primary/10"
              onClick={() => scrollToSection('contact')}
            >
              [INITIATE_CONTACT]
            </Button>
          </div>
          
          <div className="flex justify-center space-x-6">
            <a 
              href="https://github.com" 
              className="text-muted-foreground hover:text-primary transition-colors p-2 hover:scale-110 transform transition-transform"
              aria-label="GitHub"
            >
              <Github size={24} />
            </a>
            <a 
              href="https://linkedin.com" 
              className="text-muted-foreground hover:text-primary transition-colors p-2 hover:scale-110 transform transition-transform"
              aria-label="LinkedIn"
            >
              <Linkedin size={24} />
            </a>
            <a 
              href="mailto:hello@ianalloway.xyz" 
              className="text-muted-foreground hover:text-primary transition-colors p-2 hover:scale-110 transform transition-transform"
              aria-label="Email"
            >
              <Mail size={24} />
            </a>
          </div>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <button 
        onClick={() => scrollToSection('about')}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-muted-foreground hover:text-primary transition-colors animate-bounce"
      >
        <ChevronDown size={24} />
      </button>
    </section>
  );
};

export default Hero;