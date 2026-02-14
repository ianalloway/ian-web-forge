import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Github, ExternalLink, Mail, Linkedin, Twitter, Terminal, Brain, Code, BookOpen, FileText, Download, GraduationCap } from 'lucide-react';
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
    name: 'AI Advantage Sports',
    description: 'AI-powered sports betting analytics platform providing data-driven insights and predictions for smarter wagering decisions.',
    tech: ['React', 'AI/ML', 'Data Analytics'],
    url: 'https://aiadvantagesports.com',
  },
  {
    name: 'Mutant Intelligence',
    description: 'Transform your Mutant Ape Yacht Club NFT into a unique AI assistant with traits-based personality and specialized knowledge.',
    tech: ['React', 'Web3', 'Ethereum'],
    url: 'https://mutantintelligence.com',
  },
  {
    name: 'Personal Portfolio',
    description: 'Matrix-themed portfolio website showcasing my work as a Data Scientist and AI Specialist. Built with modern web technologies.',
    tech: ['React', 'TypeScript', 'Tailwind'],
    url: 'https://ianalloway.xyz',
  },
];

const academicPapers = [
  {
    title: 'Event Report Capstone',
    description: 'Comprehensive event analysis and reporting for capstone project',
    file: '/papers/event-report-capstone.pdf',
    category: 'Capstone',
  },
  {
    title: 'Bio and Career Goals',
    description: 'Enhanced biography and career objectives statement',
    file: '/papers/bio-and-career-goals.pdf',
    category: 'Personal Statement',
  },
  {
    title: 'GEA Capstone',
    description: 'Global Economic Analysis capstone research paper',
    file: '/papers/gea-capstone.pdf',
    category: 'Capstone',
  },
  {
    title: 'Case Study Capstone',
    description: 'In-depth case study analysis for capstone project',
    file: '/papers/case-study-capstone.pdf',
    category: 'Capstone',
  },
];

const Index = () => {
  const [typedText, setTypedText] = useState('');
  const fullText = 'IAN ALLOWAY';

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index <= fullText.length) {
        setTypedText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 100);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background relative">
      <MatrixRain />
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-primary/30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-primary font-bold text-lg matrix-text font-mono">
            <Terminal className="inline mr-2" size={18} />
            IAN.SYS
          </div>
                    <div className="flex gap-4 text-sm font-mono">
                      <a href="#about" className="text-primary hover:text-primary/70 transition-all">[ABOUT]</a>
                      <a href="#skills" className="text-primary hover:text-primary/70 transition-all">[SKILLS]</a>
                      <a href="#projects" className="text-primary hover:text-primary/70 transition-all">[PROJECTS]</a>
                      <a href="#academic" className="text-primary hover:text-primary/70 transition-all">[ACADEMIC]</a>
                      <a href="#contact" className="text-primary hover:text-primary/70 transition-all">[CONTACT]</a>
                    </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-4 pt-16 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block px-3 py-1 terminal-border text-primary text-sm mb-6 font-mono">
            <span className="inline-block w-2 h-2 bg-primary rounded-full mr-2 animate-pulse"></span>
            SYSTEM_ONLINE
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-4 matrix-text font-mono text-primary">
            {typedText}<span className="animate-terminal-blink">_</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-2 font-mono">
            Data Scientist | AI Specialist | Blockchain Analyst
          </p>
          <p className="text-muted-foreground font-mono mb-8">
            MSAI Candidate @ USF | Founder @ Alloway LLC
          </p>

          {/* Social Links - Prominent */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
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

          <Button className="font-mono bg-primary text-primary-foreground hover:bg-primary/90" asChild>
            <a href="#contact">&gt; GET_IN_TOUCH</a>
          </Button>
        </div>
      </section>

      {/* About & Resume Section */}
      <section id="about" className="py-16 px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 matrix-text font-mono text-primary">
            <FileText className="inline mr-2" size={24} />
            [ABOUT & RESUME]
          </h2>
          
          <Card className="terminal-border bg-card/80 backdrop-blur-sm mb-8">
            <CardContent className="p-6">
              <p className="text-muted-foreground leading-relaxed font-mono text-sm">
                &gt; Data Scientist and AI specialist pursuing a Masters in Artificial Intelligence at the University of South Florida. 
                As founder of Alloway LLC, I specialize in AI-driven cybersecurity solutions and blockchain analytics. 
                I transform complex datasets into actionable insights, bridging cutting-edge AI research with practical business applications.
              </p>
            </CardContent>
          </Card>

          {/* Experience/Resume */}
          <h3 className="text-xl font-bold mb-4 font-mono text-primary">
            <Code className="inline mr-2" size={20} />
            [EXPERIENCE]
          </h3>
          
          <div className="space-y-3">
            {experience.map((exp, index) => (
              <Card key={index} className="terminal-border bg-card/80 backdrop-blur-sm border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <h4 className="text-primary font-bold font-mono text-sm">{exp.title}</h4>
                      <p className="text-muted-foreground font-mono text-sm">{exp.company}</p>
                    </div>
                    <span className="text-primary/70 text-xs font-mono">{exp.period}</span>
                  </div>
                  <p className="text-muted-foreground/70 mt-1 text-xs font-mono">{exp.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="py-16 px-4 bg-primary/5 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 matrix-text font-mono text-primary">
            <Brain className="inline mr-2" size={24} />
            [SKILLS]
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            {skills.map((skill, index) => (
              <Card key={index} className="terminal-border bg-card/80 backdrop-blur-sm">
                <CardContent className="p-3">
                  <div className="flex justify-between mb-1 font-mono text-sm">
                    <span className="text-primary">&gt; {skill.name}</span>
                    <span className="text-primary/70">{skill.level}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full"
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
      <section id="projects" className="py-16 px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 matrix-text font-mono text-primary">
            <ExternalLink className="inline mr-2" size={24} />
            [PROJECTS]
          </h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            {projects.map((project, index) => (
              <Card key={index} className="terminal-border bg-card/80 backdrop-blur-sm hover:scale-105 transition-transform">
                <CardContent className="p-4">
                  <h3 className="text-primary font-bold mb-2 font-mono text-sm">{project.name}</h3>
                  <p className="text-muted-foreground/70 text-xs mb-3 font-mono">{project.description}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {project.tech.map((tech, i) => (
                      <span key={i} className="px-2 py-0.5 text-xs terminal-border rounded font-mono text-primary/80">
                        {tech}
                      </span>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="font-mono terminal-border text-primary border-primary hover:bg-primary/10 text-xs" asChild>
                    <a href={project.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1" size={12} /> Visit Site
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Academic Writing Section */}
      <section id="academic" className="py-16 px-4 bg-primary/5 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 matrix-text font-mono text-primary">
            <GraduationCap className="inline mr-2" size={24} />
            [ACADEMIC_WRITING]
          </h2>
          
          <p className="text-muted-foreground font-mono mb-6 text-sm">
            &gt; A collection of academic papers and research from my graduate studies.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            {academicPapers.map((paper, index) => (
              <Card key={index} className="terminal-border bg-card/80 backdrop-blur-sm hover:scale-105 transition-transform">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-primary font-bold font-mono text-sm">{paper.title}</h3>
                    <span className="px-2 py-0.5 text-xs terminal-border rounded font-mono text-primary/80">
                      {paper.category}
                    </span>
                  </div>
                  <p className="text-muted-foreground/70 text-xs mb-3 font-mono">{paper.description}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="font-mono terminal-border text-primary border-primary hover:bg-primary/10 text-xs" asChild>
                      <a href={paper.file} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-1" size={12} /> View
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" className="font-mono terminal-border text-primary border-primary hover:bg-primary/10 text-xs" asChild>
                      <a href={paper.file} download>
                        <Download className="mr-1" size={12} /> Download
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-6 matrix-text font-mono text-primary">
            [CONTACT]
          </h2>
          
          <p className="text-muted-foreground font-mono mb-6 text-sm">
            &gt; Ready to collaborate? Let's connect.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <a href="mailto:ian@allowayllc.com" className="flex items-center gap-2 text-primary hover:text-primary/70 font-mono text-sm">
              <Mail size={18} /> ian@allowayllc.com
            </a>
            <a href="https://www.linkedin.com/in/ianit" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:text-primary/70 font-mono text-sm">
              <Linkedin size={18} /> LinkedIn
            </a>
            <a href="https://x.com/ianallowayxyz" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:text-primary/70 font-mono text-sm">
              <Twitter size={18} /> @ianallowayxyz
            </a>
          </div>

          <Button className="font-mono bg-primary text-primary-foreground hover:bg-primary/90" asChild>
            <a href="mailto:ian@allowayllc.com">&gt; SEND_MESSAGE</a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-primary/30 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-primary/50 text-xs font-mono">
            &gt; IAN.ALLOWAY.SYS // {new Date().getFullYear()} // Built with React + Tailwind
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
