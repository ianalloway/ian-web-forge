import { Github, Linkedin, Mail, Heart } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/50 py-12 relative">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <div className="text-primary font-mono text-sm mb-4">
            <span className="animate-terminal-blink">█</span> SYSTEM_FOOTER_V2.1
          </div>
          <div className="flex justify-center space-x-6 mb-8">
            <a 
              href="https://github.com" 
              className="text-muted-foreground hover:text-primary transition-colors p-2 hover:scale-110 transform transition-transform matrix-glow"
              aria-label="GitHub"
            >
              <Github size={24} />
            </a>
            <a 
              href="https://www.linkedin.com/in/ianalloway" 
              className="text-muted-foreground hover:text-primary transition-colors p-2 hover:scale-110 transform transition-transform matrix-glow"
              aria-label="LinkedIn"
            >
              <Linkedin size={24} />
            </a>
            <a 
              href="mailto:hello@ianalloway.xyz" 
              className="text-muted-foreground hover:text-primary transition-colors p-2 hover:scale-110 transform transition-transform matrix-glow"
              aria-label="Email"
            >
              <Mail size={24} />
            </a>
          </div>
          
          <div className="border-t border-primary/30 pt-8 terminal-border">
            <p className="text-muted-foreground flex items-center justify-center gap-2 font-mono matrix-text">
              &gt; © {currentYear} IAN.ALLOWAY.SYS | COMPILED WITH <Heart className="w-4 h-4 text-primary animate-glow-pulse" /> | REACT + TAILWIND.CSS
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;