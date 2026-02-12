import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Github, ExternalLink, Mail, Linkedin, Twitter, Terminal, Database, Brain, Code, ChevronDown, BookOpen, Send } from 'lucide-react';
import MatrixRain from '@/components/MatrixRain';

const skills = [
  { name: 'Python', level: 95 },
  { name: 'Machine Learning', level: 90 },
  { name: 'TensorFlow', level: 85 },
  { name: 'SQL', level: 90 },
  { name: 'Data Analytics', level: 95 },
  { name: 'Deep Learning', level: 85 },
  { name: 'Power BI / Tableau', level: 88 },
  { name: 'Docker', level: 80 },
];

const experience = [
  {
    title: 'Founder & Data Consultant',
    company: 'Alloway LLC',
    period: 'July 2023 - Present',
    description: 'AI-Driven Cybersecurity & Blockchain Analytics consulting'
  },
  {
    title: 'MSAI Candidate',
    company: 'University of South Florida',
    period: '2024 - Present',
    description: 'Masters in Artificial Intelligence'
  },
  {
    title: 'Data Analyst',
    company: 'The Global Career Accelerator',
    period: 'Dec 2024 - May 2025',
    description: 'Data analysis and insights extraction'
  },
  {
    title: 'Data Specialist',
    company: 'Omniichain',
    period: 'Jan 2020 - Dec 2024',
    description: 'Blockchain data analytics and modeling'
  },
];

const projects = [
  {
    name: 'AI Cybersecurity Platform',
    description: 'Machine learning-powered threat detection system',
    tech: ['Python', 'TensorFlow', 'Docker'],
  },
  {
    name: 'Blockchain Analytics Dashboard',
    description: 'Real-time crypto transaction analysis tool',
    tech: ['Python', 'SQL', 'Power BI'],
  },
  {
    name: 'Predictive Modeling Suite',
    description: 'Statistical modeling for business intelligence',
    tech: ['Python', 'Scikit-learn', 'Tableau'],
  },
];

const Index = () => {
  const [activeSection, setActiveSection] = useState('home');
  const [typedText, setTypedText] = useState('');
  const fullText = '> ACCESSING: IAN.ALLOWAY.SYS';

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index <= fullText.length) {
        setTypedText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 50);
    return () => clearInterval(timer);
  }, []);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background relative">
      <MatrixRain />
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-primary/30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-primary font-bold text-lg matrix-text font-mono">
            <Terminal className="inline mr-2" size={20} />
            IAN.SYS
          </div>
          <div className="flex gap-6 text-sm font-mono">
            {['home', 'about', 'skills', 'projects', 'blog', 'contact'].map((section) => (
              <button
                key={section}
                onClick={() => scrollToSection(section)}
                className={`hover:text-primary/80 transition-all text-primary ${activeSection === section ? 'matrix-text' : ''}`}
              >
                [{section.toUpperCase()}]
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="min-h-screen flex items-center justify-center px-4 pt-16 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block px-3 py-1 terminal-border text-primary text-sm mb-6 font-mono">
            <span className="inline-block w-2 h-2 bg-primary rounded-full mr-2 animate-pulse"></span>
            SYSTEM_ONLINE
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 matrix-text font-mono text-primary">
            {typedText}<span className="animate-terminal-blink">_</span>
          </h1>
          
          <div className="text-muted-foreground space-y-2 text-lg font-mono">
            <p>&gt; STATUS: Data Science Protocol Active</p>
            <p>&gt; MISSION: Extracting insights from complex datasets</p>
            <p>&gt; SPECIALIZATION: AI, Machine Learning & Blockchain Analytics</p>
          </div>

          <div className="mt-10 flex justify-center gap-4">
            <Button 
              onClick={() => scrollToSection('projects')}
              variant="outline"
              className="font-mono terminal-border text-primary border-primary hover:bg-primary/10"
            >
              &gt; VIEW_PROJECTS
            </Button>
            <Button 
              onClick={() => scrollToSection('contact')}
              className="font-mono bg-primary text-primary-foreground hover:bg-primary/90"
            >
              &gt; CONTACT_ME
            </Button>
          </div>

          <div className="mt-16 animate-bounce">
            <ChevronDown size={32} className="mx-auto text-primary" />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 matrix-text font-mono text-primary">
            <Database className="inline mr-3" size={28} />
            [ABOUT.SYS]
          </h2>
          
          <Card className="terminal-border bg-card/80 backdrop-blur-sm matrix-glow">
            <CardContent className="p-6">
              <p className="text-muted-foreground leading-relaxed mb-6 font-mono">
                &gt; I'm Ian Alloway, a Data Scientist and AI specialist currently pursuing my Masters in 
                Artificial Intelligence at the University of South Florida. As the founder of Alloway LLC, 
                I specialize in AI-driven cybersecurity solutions and blockchain analytics.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6 font-mono">
                &gt; With experience spanning data analysis, machine learning, and statistical modeling, 
                I transform complex datasets into actionable insights. My work bridges the gap between 
                cutting-edge AI research and practical business applications.
              </p>
              <p className="text-muted-foreground leading-relaxed font-mono">
                &gt; When I'm not training models or analyzing data, you'll find me exploring the latest 
                developments in AI, writing about technology, and building tools that make a difference.
              </p>
            </CardContent>
          </Card>

          {/* Experience Timeline */}
          <h3 className="text-2xl font-bold mt-12 mb-6 font-mono text-primary">
            <Code className="inline mr-3" size={24} />
            [EXPERIENCE.LOG]
          </h3>
          
          <div className="space-y-4">
            {experience.map((exp, index) => (
              <Card key={index} className="terminal-border bg-card/80 backdrop-blur-sm border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <h4 className="text-primary font-bold font-mono">{exp.title}</h4>
                      <p className="text-muted-foreground font-mono">{exp.company}</p>
                    </div>
                    <span className="text-primary text-sm font-mono">{exp.period}</span>
                  </div>
                  <p className="text-muted-foreground/70 mt-2 text-sm font-mono">{exp.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="py-20 px-4 bg-primary/5 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 matrix-text font-mono text-primary">
            <Brain className="inline mr-3" size={28} />
            [SKILLS.DB]
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {skills.map((skill, index) => (
              <Card key={index} className="terminal-border bg-card/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex justify-between mb-2 font-mono">
                    <span className="text-primary">&gt; {skill.name}</span>
                    <span className="text-primary">{skill.level}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-1000"
                      style={{ width: `${skill.level}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-20 px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 matrix-text font-mono text-primary">
            <ExternalLink className="inline mr-3" size={28} />
            [PROJECTS.DIR]
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <Card key={index} className="terminal-border bg-card/80 backdrop-blur-sm hover:scale-105 transition-transform matrix-glow">
                <CardContent className="p-6">
                  <h3 className="text-primary font-bold mb-2 font-mono">{project.name}</h3>
                  <p className="text-muted-foreground/70 text-sm mb-4 font-mono">{project.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {project.tech.map((tech, i) => (
                      <span key={i} className="px-2 py-1 text-xs terminal-border rounded font-mono text-primary">
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

      {/* Blog Section */}
      <section id="blog" className="py-20 px-4 bg-primary/5 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 matrix-text font-mono text-primary">
            <BookOpen className="inline mr-3" size={28} />
            [BLOG.POSTS]
          </h2>
          
          <Card className="terminal-border bg-card/80 backdrop-blur-sm matrix-glow text-center">
            <CardContent className="p-6">
              <p className="text-muted-foreground mb-6 font-mono">
                &gt; Read my latest thoughts on AI, Data Science, and Technology
              </p>
              <Button 
                variant="outline"
                className="font-mono terminal-border text-primary border-primary hover:bg-primary/10"
                asChild
              >
                <a href="https://allowayai.substack.com/home" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="inline mr-2" size={16} />
                  &gt; VISIT_SUBSTACK
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 matrix-text font-mono text-primary">
            <Send className="inline mr-3" size={28} />
            [CONTACT.SYS]
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="terminal-border bg-card/80 backdrop-blur-sm matrix-glow">
              <CardHeader>
                <CardTitle className="font-mono text-primary">&gt; GET_IN_TOUCH</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground/70 mb-6 font-mono">
                  Ready to collaborate on your next data project? Let's connect and build something amazing together.
                </p>
                
                <div className="space-y-4">
                  <a 
                    href="mailto:hello@ianalloway.xyz" 
                    className="flex items-center gap-3 text-primary hover:text-primary/80 transition-all font-mono"
                  >
                    <Mail size={20} />
                    &gt; hello@ianalloway.xyz
                  </a>
                  <a 
                    href="https://x.com/ianallowayxyz" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-primary hover:text-primary/80 transition-all font-mono"
                  >
                    <Twitter size={20} />
                    &gt; @ianallowayxyz
                  </a>
                  <a 
                    href="https://linkedin.com/in/ianalloway" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-primary hover:text-primary/80 transition-all font-mono"
                  >
                    <Linkedin size={20} />
                    &gt; LinkedIn
                  </a>
                  <a 
                    href="https://github.com/ianalloway" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-primary hover:text-primary/80 transition-all font-mono"
                  >
                    <Github size={20} />
                    &gt; GitHub
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card className="terminal-border bg-card/80 backdrop-blur-sm matrix-glow">
              <CardHeader>
                <CardTitle className="font-mono text-primary">&gt; SEND_MESSAGE</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div>
                    <label className="block text-primary text-sm mb-1 font-mono">&gt; NAME</label>
                    <input 
                      type="text" 
                      className="w-full bg-background terminal-border rounded px-3 py-2 text-primary focus:border-primary focus:outline-none font-mono"
                      placeholder="Enter your name..."
                    />
                  </div>
                  <div>
                    <label className="block text-primary text-sm mb-1 font-mono">&gt; EMAIL</label>
                    <input 
                      type="email" 
                      className="w-full bg-background terminal-border rounded px-3 py-2 text-primary focus:border-primary focus:outline-none font-mono"
                      placeholder="Enter your email..."
                    />
                  </div>
                  <div>
                    <label className="block text-primary text-sm mb-1 font-mono">&gt; MESSAGE</label>
                    <textarea 
                      rows={4}
                      className="w-full bg-background terminal-border rounded px-3 py-2 text-primary focus:border-primary focus:outline-none resize-none font-mono"
                      placeholder="Enter your message..."
                    />
                  </div>
                  <Button 
                    type="submit"
                    className="w-full font-mono bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    &gt; TRANSMIT_MESSAGE
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-primary/30 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-primary/70 text-sm font-mono">
            &gt; IAN.ALLOWAY.SYS // {new Date().getFullYear()} // ALL_RIGHTS_RESERVED
          </p>
          <p className="text-primary/50 text-xs mt-2 font-mono">
            &gt; Built with React + Tailwind // Matrix theme activated
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
