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
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Tech background" 
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-hero opacity-80"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="text-foreground">Hi, I'm </span>
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Ian Alloway
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Full Stack Developer & Tech Enthusiast building innovative solutions 
            with modern technologies
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              size="lg" 
              className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
              onClick={() => scrollToSection('projects')}
            >
              View My Work
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => scrollToSection('contact')}
            >
              Get In Touch
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