import { Github, Linkedin, Mail, Heart } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/50 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <div className="flex justify-center space-x-6 mb-8">
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
          
          <div className="border-t border-border pt-8">
            <p className="text-muted-foreground flex items-center justify-center gap-2">
              © {currentYear} Ian Alloway. Made with <Heart className="w-4 h-4 text-accent" /> using React & Tailwind CSS.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;