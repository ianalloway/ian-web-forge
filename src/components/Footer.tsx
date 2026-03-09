import { Github, Linkedin, Mail } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-12 relative">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <div className="flex justify-center space-x-6 mb-8">
            <a
              href="https://github.com/ianalloway"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors p-2"
              aria-label="GitHub"
            >
              <Github size={24} />
            </a>
            <a
              href="https://www.linkedin.com/in/ianit"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors p-2"
              aria-label="LinkedIn"
            >
              <Linkedin size={24} />
            </a>
            <a
              href="mailto:ian@allowayllc.com"
              className="text-muted-foreground hover:text-foreground transition-colors p-2"
              aria-label="Email"
            >
              <Mail size={24} />
            </a>
          </div>

          <div className="border-t border-border pt-8">
            <p className="text-muted-foreground text-sm">
              &copy; {currentYear} Ian Alloway. Built with React + Tailwind.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
