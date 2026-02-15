import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Github, ExternalLink, Mail, Linkedin, Twitter, Terminal, Brain, Code, BookOpen, FileText, Download, GraduationCap, Bot, Newspaper, Heart, Copy, Sun, Moon } from 'lucide-react';
import MatrixRain from '@/components/MatrixRain';
import { useToast } from '@/components/ui/use-toast';

const ETH_DONATION_ADDRESS = "0xAc7C093B312700614C80Ba3e0509f8dEde03515b";

const skills = [
  { name: 'Python', level: 95 },
  { name: 'Machine Learning', level: 90 },
  { name: 'TensorFlow', level: 85 },
  { name: 'SQL', level: 90 },
  { name: 'Data Analytics', level: 95 },
  { name: 'Deep Learning', level: 85 },
  { name: 'Power BI / Tableau', level: 88 },
  { name: 'Docker', level: 80 },
  { name: 'Computer Vision', level: 82 },
  { name: 'NLP', level: 85 },
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
    name: 'Drone AI',
    description: 'Autonomous vehicle intelligence platform with YOLOv8 computer vision, A*/RRT* path planning, behavior trees, and MAVLink drone communication.',
    tech: ['Python', 'PyTorch', 'MAVLink'],
    url: 'https://github.com/ianalloway/ai-drone-auto-vehicle',
    isGithub: true,
  },
  {
    name: 'Sports Betting ML',
    description: 'NBA game prediction model with value bet detection. XGBoost ML model compares predictions to betting odds using Kelly Criterion for optimal bet sizing.',
    tech: ['Python', 'XGBoost', 'Streamlit'],
    url: 'https://huggingface.co/spaces/ianalloway/sports-betting-ml',
    isGithub: false,
  },
  {
    name: 'Money Maker Bot',
    description: 'Financial intelligence assistant for sports betting analysis, NFT tracking, and portfolio visualization. Fork it to build your own AI trading assistant.',
    tech: ['TypeScript', 'AI', 'OpenClaw'],
    url: 'https://github.com/ianalloway/Money-maker-bot',
    isGithub: true,
  },
  {
    name: 'ClawHub Skills',
    description: 'Published AI agent skills on ClawHub: sports-odds, nft-tracker, data-viz, and screenshot-annotator. Extending OpenClaw capabilities.',
    tech: ['TypeScript', 'AI Agents', 'Peekaboo'],
    url: 'https://clawhub.ai',
    isGithub: false,
  },
  {
    name: 'AI Advantage Sports',
    description: 'AI-powered sports betting platform with integrated ML predictions, Kelly Criterion bet sizing, and value bet detection for NBA games.',
    tech: ['React', 'XGBoost', 'Kelly Criterion'],
    url: 'https://aiadvantagesports.com',
    isGithub: false,
  },
  {
    name: 'Mutant Intelligence',
    description: 'Transform your Mutant Ape Yacht Club NFT into a unique AI assistant with traits-based personality and specialized knowledge.',
    tech: ['React', 'Web3', 'Ethereum'],
    url: 'https://mutantintelligence.com',
    isGithub: false,
  },
  {
    name: 'OpenClaw Contributor',
    description: 'Active contributor to OpenClaw, the open-source AI agent framework. Fixing bugs and improving the skill system.',
    tech: ['TypeScript', 'Open Source', 'AI'],
    url: 'https://github.com/openclaw/openclaw',
    isGithub: true,
  },
  {
    name: 'Crypto Portfolio CLI',
    description: 'Terminal-based cryptocurrency portfolio tracker with live prices, charts, and alerts via CoinGecko API. Track holdings, set price alerts, and visualize allocation.',
    tech: ['Python', 'Click', 'Rich'],
    url: 'https://github.com/ianalloway/crypto-portfolio-cli',
    isGithub: true,
  },
  {
    name: 'AI Portfolio Analyzer',
    description: 'AI-powered CLI tool that analyzes investment portfolios, calculates profit/loss, and generates intelligent insights. Supports crypto and stocks with diversification recommendations.',
    tech: ['Python', 'AI', 'Financial Analysis'],
    url: 'https://github.com/ianalloway/ai-portfolio-analyzer',
    isGithub: true,
  },
  {
    name: 'Job Fit Analyzer',
    description: 'Paste any job description and instantly see how well my skills match. NLP-powered analysis shows matched skills, strengths, and recommendations.',
    tech: ['React', 'FastAPI', 'NLP'],
    url: 'https://clawdbot-setup-app-haw39wkx.devinapps.com',
    isGithub: false,
  },
];

interface BlogPost {
  title: string;
  description: string;
  url: string;
  date: string;
}

const fallbackBlogPosts: BlogPost[] = [
  {
    title: 'I Built an AI-Powered Financial Intelligence Bot. Here\'s How You Can Fork It.',
    description: 'What a time to be alive',
    url: 'https://allowayai.substack.com/p/i-built-an-ai-powered-financial-intelligence',
    date: 'Feb 14',
  },
  {
    title: 'How to Be a Better Investor Without Knowing Finance',
    description: 'Level 2 - Value Investor',
    url: 'https://allowayai.substack.com/p/how-to-be-a-better-investor-without',
    date: 'Feb 3',
  },
  {
    title: 'The Eviction of the American Dream: An Audit of \'99 Homes\'',
    description: 'Movie Review',
    url: 'https://allowayai.substack.com/p/the-eviction-of-the-american-dream',
    date: 'Feb 2',
  },
  {
    title: 'how to master AI in 30 days (the exact roadmap)',
    description: 'Red pill or blue pill',
    url: 'https://allowayai.substack.com/p/how-to-master-ai-in-30-days',
    date: 'Jan 28',
  },
  {
    title: 'The Spreadsheet is Dead (Long Live the Code)',
    description: 'Excel is over',
    url: 'https://allowayai.substack.com/p/the-spreadsheet-is-dead-long-live',
    date: 'Jan 25',
  },
];

async function fetchSubstackPosts(): Promise<BlogPost[]> {
  try {
    const response = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://allowayai.substack.com/feed');
    const data = await response.json();
    if (data.status === 'ok' && data.items) {
      return data.items.slice(0, 5).map((item: { title: string; description: string; link: string; pubDate: string }) => {
        const date = new Date(item.pubDate);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return {
          title: item.title,
          description: item.description.replace(/<[^>]*>/g, '').slice(0, 100) + '...',
          url: item.link,
          date: `${monthNames[date.getMonth()]} ${date.getDate()}`,
        };
      });
    }
    return fallbackBlogPosts;
  } catch {
    return fallbackBlogPosts;
  }
}

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
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(fallbackBlogPosts);
  const [theme, setTheme] = useState<'matrix' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'matrix' | 'light') || 'matrix';
    }
    return 'matrix';
  });
  const fullText = 'IAN ALLOWAY';
  const { toast } = useToast();

  useEffect(() => {
    document.documentElement.classList.remove('light');
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'matrix' ? 'light' : 'matrix');
  };

  const copyEthAddress = async () => {
    try {
      await navigator.clipboard.writeText(ETH_DONATION_ADDRESS);
      toast({
        title: "Address Copied!",
        description: "ETH donation address copied to clipboard",
      });
    } catch {
      toast({
        title: "Failed to copy",
        variant: "destructive",
      });
    }
  };

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

  useEffect(() => {
    fetchSubstackPosts().then(setBlogPosts);
  }, []);

    return (
      <div className="min-h-screen bg-background relative">
        {theme === 'matrix' && <MatrixRain />}
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-primary/30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-primary font-bold text-lg matrix-text font-mono">
            <Terminal className="inline mr-2" size={18} />
            IAN.SYS
          </div>
                                        <div className="flex gap-4 text-sm font-mono items-center">
                                                                                                            <a href="#about" className="text-primary hover:text-primary/70 transition-all">[ABOUT]</a>
                                                                                                            <a href="#skills" className="text-primary hover:text-primary/70 transition-all">[SKILLS]</a>
                                                                                                            <a href="#projects" className="text-primary hover:text-primary/70 transition-all">[PROJECTS]</a>
                                                                                                            <a href="#bot" className="text-primary hover:text-primary/70 transition-all">[BOT]</a>
                                <button
                                  onClick={toggleTheme}
                                  className="ml-2 p-2 rounded-md border border-primary/30 hover:bg-primary/10 transition-all"
                                  aria-label="Toggle theme"
                                >
                                  {theme === 'matrix' ? <Sun size={16} className="text-primary" /> : <Moon size={16} className="text-primary" />}
                                </button>
                                                                                        <a href="#blog" className="text-primary hover:text-primary/70 transition-all">[BLOG]</a>
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
                      {project.isGithub ? <Github className="mr-1" size={12} /> : <ExternalLink className="mr-1" size={12} />}
                      {project.isGithub ? 'View on GitHub' : 'Visit Site'}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Start Your Own Bot Section */}
      <section id="bot" className="py-16 px-4 bg-primary/5 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 matrix-text font-mono text-primary">
            <Bot className="inline mr-2" size={24} />
            [START_YOUR_OWN_BOT]
          </h2>
          
          <Card className="terminal-border bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <h3 className="text-primary font-bold mb-3 font-mono text-lg">Money Maker Bot</h3>
              <p className="text-muted-foreground font-mono mb-4 text-sm">
                &gt; Build your own AI-powered financial assistant. Money Maker Bot is my open-source fork of Clawdbot, 
                pre-configured with custom skills for sports betting analysis, NFT price tracking, and portfolio visualization.
              </p>
              
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="terminal-border p-3 rounded">
                  <h4 className="text-primary font-bold font-mono text-sm mb-1">Sports Odds</h4>
                  <p className="text-muted-foreground/70 text-xs font-mono">Compare betting lines across sportsbooks to find value</p>
                </div>
                <div className="terminal-border p-3 rounded">
                  <h4 className="text-primary font-bold font-mono text-sm mb-1">NFT Tracker</h4>
                  <p className="text-muted-foreground/70 text-xs font-mono">Monitor floor prices and whale activity for top collections</p>
                </div>
                <div className="terminal-border p-3 rounded">
                  <h4 className="text-primary font-bold font-mono text-sm mb-1">Data Viz</h4>
                  <p className="text-muted-foreground/70 text-xs font-mono">Generate terminal charts from your portfolio data</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Button className="font-mono bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                  <a href="https://github.com/ianalloway/Money-maker-bot" target="_blank" rel="noopener noreferrer">
                    <Github className="mr-2" size={16} /> Fork on GitHub
                  </a>
                </Button>
                <Button variant="outline" className="font-mono terminal-border text-primary border-primary hover:bg-primary/10" asChild>
                  <a href="https://github.com/ianalloway/Money-maker-bot#quick-start" target="_blank" rel="noopener noreferrer">
                    <Terminal className="mr-2" size={16} /> Quick Start Guide
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Blog Section */}
      <section id="blog" className="py-16 px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 matrix-text font-mono text-primary">
            <Newspaper className="inline mr-2" size={24} />
            [BLOG]
          </h2>
          
          <p className="text-muted-foreground font-mono mb-6 text-sm">
            &gt; Latest posts from my Substack on AI, investing, and data science.
          </p>
          
          <div className="space-y-4 mb-6">
            {blogPosts.map((post, index) => (
              <Card key={index} className="terminal-border bg-card/80 backdrop-blur-sm hover:scale-[1.02] transition-transform">
                <CardContent className="p-4">
                  <a href={post.url} target="_blank" rel="noopener noreferrer" className="block">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-primary font-bold font-mono text-sm hover:text-primary/70">{post.title}</h3>
                      <span className="text-primary/50 text-xs font-mono whitespace-nowrap ml-4">{post.date}</span>
                    </div>
                    <p className="text-muted-foreground/70 text-xs font-mono">{post.description}</p>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center">
            <Button className="font-mono bg-primary text-primary-foreground hover:bg-primary/90" asChild>
              <a href="https://allowayai.substack.com" target="_blank" rel="noopener noreferrer">
                <BookOpen className="mr-2" size={16} /> Read More on Substack
              </a>
            </Button>
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

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 px-4 bg-primary/5 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 matrix-text font-mono text-primary">
            [TESTIMONIALS]
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="terminal-border bg-card/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <p className="text-muted-foreground font-mono text-sm italic mb-3">
                  "Ian's data analysis skills transformed our decision-making process. His ability to extract insights from complex datasets is exceptional."
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-mono text-sm">JD</div>
                  <div>
                    <p className="text-primary font-mono text-sm">John D.</p>
                    <p className="text-muted-foreground/70 text-xs font-mono">Tech Startup CEO</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="terminal-border bg-card/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <p className="text-muted-foreground font-mono text-sm italic mb-3">
                  "Working with Ian on our blockchain analytics project was a game-changer. His technical depth and communication skills are top-notch."
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-mono text-sm">SK</div>
                  <div>
                    <p className="text-primary font-mono text-sm">Sarah K.</p>
                    <p className="text-muted-foreground/70 text-xs font-mono">DeFi Protocol Lead</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="terminal-border bg-card/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <p className="text-muted-foreground font-mono text-sm italic mb-3">
                  "Ian built our ML prediction system from scratch. The model accuracy exceeded our expectations and has been running reliably in production."
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-mono text-sm">MR</div>
                  <div>
                    <p className="text-primary font-mono text-sm">Mike R.</p>
                    <p className="text-muted-foreground/70 text-xs font-mono">Sports Analytics Firm</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="terminal-border bg-card/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <p className="text-muted-foreground font-mono text-sm italic mb-3">
                  "Excellent collaborator on open source projects. Ian's contributions to our codebase were clean, well-documented, and thoughtfully designed."
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-mono text-sm">AL</div>
                  <div>
                    <p className="text-primary font-mono text-sm">Alex L.</p>
                    <p className="text-muted-foreground/70 text-xs font-mono">Open Source Maintainer</p>
                  </div>
                </div>
              </CardContent>
            </Card>
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

          {/* ETH Donation */}
          <div className="mt-8 p-4 border border-primary/30 rounded-lg bg-background/50">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Heart size={16} className="text-red-400" />
              <span className="text-primary font-mono text-sm">SUPPORT_MY_WORK</span>
            </div>
            <p className="text-muted-foreground text-xs font-mono mb-3">
              &gt; If you find my projects helpful, consider donating ETH
            </p>
            <div className="flex items-center justify-center gap-2">
              <code className="px-3 py-1.5 rounded bg-primary/10 text-primary text-xs font-mono">
                {ETH_DONATION_ADDRESS.slice(0, 10)}...{ETH_DONATION_ADDRESS.slice(-8)}
              </code>
              <Button 
                variant="outline" 
                size="sm"
                onClick={copyEthAddress}
                className="font-mono terminal-border text-primary border-primary hover:bg-primary/10 text-xs"
              >
                <Copy size={12} className="mr-1" /> Copy
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-primary/30 relative z-10">
        <div className="max-w-4xl mx-auto text-center flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-primary/50 text-xs font-mono">
            &gt; IAN.ALLOWAY.SYS // {new Date().getFullYear()} // Built with React + Tailwind
          </p>
          <button 
            onClick={copyEthAddress}
            className="text-primary/50 hover:text-primary text-xs font-mono flex items-center gap-1"
          >
            <Heart size={12} /> Donate ETH
          </button>
        </div>
      </footer>
    </div>
  );
};

export default Index;
