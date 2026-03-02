import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Github, ExternalLink, Mail, Linkedin, Twitter, Terminal, Brain, Code, BookOpen, FileText, Download, GraduationCap, Bot, Newspaper, Heart, Copy, Sun, Moon } from 'lucide-react';
import MatrixRain from '@/components/MatrixRain';
import Testimonials from '@/components/Testimonials';
import { useToast } from '@/components/ui/use-toast';

const ETH_DONATION_ADDRESS = "0x6f278ce76ba5ed31fd9be646d074863e126836e9";

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
  { name: 'Streamlit', level: 88 },
  { name: 'Sentiment Analysis', level: 85 },
];

const experience = [
  {
    title: 'Founder & Business Owner',
    company: 'Alloway LLC',
    period: 'July 2023 - Present',
    description: 'Founded data consultancy delivering AI-powered solutions to e-commerce and enterprise clients. Deployed ML models improving client operational efficiency by 40%. Built custom Tableau and Power BI dashboards for real-time data tracking.'
  },
  {
    title: 'Data Auditor / AI Engineer',
    company: 'Omniichain',
    period: 'Jan 2020 - Dec 2024',
    description: 'Engineered AI-based anomaly detection tools analyzing multi-chain blockchain data, reducing fraud incidents by 30%. Built interactive dashboards visualizing token flow, market movements, and transactional health.'
  },
  {
    title: 'Task Force Manager',
    company: 'Hilton Hotels',
    period: 'Aug 2020 - Sept 2023',
    description: 'Directed operational improvements across multiple Hilton locations. Achieved measurable guest satisfaction increases of up to 20% through process optimization. Managed property P&L and budgeting operations.'
  },
  {
    title: 'Sales & Purchasing Manager',
    company: 'IT Parts and Spares Ltd.',
    period: 'Sept 2018 - Aug 2023',
    description: 'Led purchasing operations with international vendors for HP, IBM, Lenovo, and Dell hardware, reducing costs by 15%. Collaborated with IT teams to implement procurement automation tools.'
  },
];

const projects = [
  {
    name: 'Sports Betting ML',
    description: 'Trained XGBoost model on 5 seasons of NBA data to predict game outcomes. Compares model probabilities against sportsbook odds to find value bets, then sizes positions using Kelly Criterion. Live on HuggingFace.',
    tech: ['Python', 'XGBoost', 'Streamlit'],
    url: 'https://huggingface.co/spaces/ianalloway/sports-betting-ml',
    isGithub: false,
  },
  {
    name: 'Drone AI',
    description: 'Autonomous navigation system for drones: YOLOv8 detects obstacles in real-time, A*/RRT* algorithms plan collision-free paths, behavior trees handle mission logic. Communicates with flight controllers via MAVLink.',
    tech: ['Python', 'PyTorch', 'MAVLink'],
    url: 'https://github.com/ianalloway/ai-drone-auto-vehicle',
    isGithub: true,
  },
  {
    name: 'Money Maker Bot',
    description: 'Open-source financial intelligence assistant built on OpenClaw. Pre-configured with custom skills for sports betting analysis, NFT price tracking, and portfolio visualization. Fork it and build your own.',
    tech: ['TypeScript', 'AI', 'OpenClaw'],
    url: 'https://github.com/ianalloway/Money-maker-bot',
    isGithub: true,
  },
  {
    name: 'Job Fit Analyzer',
    description: 'Full-stack NLP app: paste any job description and get instant skill-match analysis. React frontend sends text to FastAPI backend which runs semantic similarity against my profile. Deployed live.',
    tech: ['React', 'FastAPI', 'NLP'],
    url: 'https://clawdbot-setup-app-haw39wkx.devinapps.com',
    isGithub: false,
  },
  {
    name: 'AI Advantage Sports',
    description: 'Production sports betting platform combining ML predictions with Kelly Criterion bet sizing. Users get real-time value bet alerts for NBA games with confidence scores.',
    tech: ['React', 'XGBoost', 'Kelly Criterion'],
    url: 'https://aiadvantagesports.com',
    isGithub: false,
  },
  {
    name: 'OpenClaw Contributor',
    description: 'Active contributor to the 194k+ star open-source AI agent framework. Published 4 custom skills on ClawHub marketplace: sports-odds, nft-tracker, data-viz, screenshot-annotator.',
    tech: ['TypeScript', 'Open Source', 'AI'],
    url: 'https://github.com/openclaw/openclaw',
    isGithub: true,
  },
  {
    name: 'Mutant Intelligence',
    description: 'Web3 app that transforms Mutant Ape Yacht Club NFTs into unique AI assistants. Each bot inherits personality traits from on-chain metadata to create personalized interactions.',
    tech: ['React', 'Web3', 'Ethereum'],
    url: 'https://mutantintelligence.com',
    isGithub: false,
  },
  {
    name: 'Crypto Portfolio CLI',
    description: 'Terminal-based portfolio tracker pulling live prices from CoinGecko API. Track holdings, set price alerts, visualize allocation with Rich terminal charts. Zero browser needed.',
    tech: ['Python', 'Click', 'Rich'],
    url: 'https://github.com/ianalloway/crypto-portfolio-cli',
    isGithub: true,
  },
  {
    name: 'AI Portfolio Analyzer',
    description: 'CLI tool that analyzes investment portfolios with AI. Calculates profit/loss, generates diversification recommendations, and produces intelligent insights for crypto and stock holdings.',
    tech: ['Python', 'AI', 'Financial Analysis'],
    url: 'https://github.com/ianalloway/ai-portfolio-analyzer',
    isGithub: true,
  },
  {
    name: 'Stock Sentiment Analyzer',
    description: 'AI-powered news sentiment analysis app. Enter any stock ticker and get real-time sentiment analysis using NLP transformers. Built with Streamlit.',
    tech: ['Python', 'NLP', 'Streamlit'],
    url: 'https://github.com/ianalloway/stock-sentiment-analyzer',
    isGithub: true,
  },
  {
    name: 'Crypto Price Predictor',
    description: 'LSTM neural network for cryptocurrency price prediction. Technical indicators, backtesting, and interactive charts. Supports BTC, ETH, SOL, and more.',
    tech: ['Python', 'TensorFlow', 'LSTM'],
    url: 'https://github.com/ianalloway/crypto-price-predictor',
    isGithub: true,
  },
  {
    name: 'Job Application Tracker',
    description: 'Streamlit app to track job applications with analytics dashboard, status tracking, and CSV export. Never lose track of your applications again.',
    tech: ['Python', 'Streamlit', 'Analytics'],
    url: 'https://github.com/ianalloway/job-application-tracker',
    isGithub: true,
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
    title: 'I Gave My AI Bot a Diary. It Writes in It Every Day.',
    description: 'by Ian Alloway',
    url: 'https://allowayai.substack.com/p/i-gave-my-ai-bot-a-diary-it-writes',
    date: 'Feb 15',
  },
  {
    title: 'Building a Job Fit Analyzer with NLP and React',
    description: 'by Ian Alloway',
    url: 'https://allowayai.substack.com/p/building-a-job-fit-analyzer-with',
    date: 'Feb 15',
  },
  {
    title: 'I Went to See Marty Supreme and Left Feeling Like I Got Hustled (In the Best Way)',
    description: 'By Ian Alloway',
    url: 'https://allowayai.substack.com/p/i-went-to-see-marty-supreme',
    date: 'Feb 15',
  },
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
];

async function fetchSubstackPosts(): Promise<BlogPost[]> {
  try {
    // Add cache-busting timestamp to avoid stale RSS data
    const cacheBuster = Math.floor(Date.now() / 60000); // Changes every minute
    const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=https://allowayai.substack.com/feed&_=${cacheBuster}`);
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
                                                                                        <a href="#opensource" className="text-primary hover:text-primary/70 transition-all">[OSS]</a>
                                                                                        <a href="#academic" className="text-primary hover:text-primary/70 transition-all">[ACADEMIC]</a>
                                                                                        <a href="#certifications" className="text-primary hover:text-primary/70 transition-all">[CERTS]</a>
                                                                                        <a href="#contact" className="text-primary hover:text-primary/70 transition-all">[CONTACT]</a>
                                                                                        <a href="/now" className="text-primary hover:text-primary/70 transition-all">[/NOW]</a>
                                                                                        <a href="/vision" className="text-primary hover:text-primary/70 transition-all">[VISION]</a>
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
            AI/ML Engineer | Data Scientist | Business Intelligence Specialist
          </p>
          <p className="text-muted-foreground font-mono mb-8">
            B.S. Data Science @ USF (Dec 2025) | M.S. AI @ USF (Dec 2027) | Founder @ Alloway LLC
          </p>

          <div className="inline-block px-4 py-2 mb-6 border border-green-400/50 rounded-lg bg-green-400/10">
            <span className="text-green-400 font-mono text-sm font-bold">OPEN TO WORK</span>
            <span className="text-muted-foreground font-mono text-sm"> - Data Scientist / ML Engineer roles</span>
          </div>

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
              <a href="/Ian_Alloway_Resume_CV.pdf" download>
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
                &gt; Data Scientist and AI Engineer pursuing an MS in Artificial Intelligence at the University of South Florida. 
                Builds production ML systems, blockchain analytics pipelines, and AI-powered products. 
                Open-source contributor to OpenClaw (194k+ stars). Founder of Alloway LLC, delivering data-driven solutions across sports analytics, fintech, and cybersecurity. 
                Proven track record of reducing fraud incidents by 30% through AI-based anomaly detection and improving client operational efficiency by 40%.
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

      {/* Certifications Section */}
      <section id="certifications" className="py-16 px-4 bg-primary/5 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 matrix-text font-mono text-primary">
            [CERTIFICATIONS]
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="terminal-border bg-card/80 backdrop-blur-sm border-l-4 border-l-primary">
              <CardContent className="p-4">
                <h4 className="text-primary font-bold font-mono text-sm">Deep Learning Specialization</h4>
                <p className="text-muted-foreground/70 text-xs font-mono">Coursera (Andrew Ng)</p>
              </CardContent>
            </Card>
            <Card className="terminal-border bg-card/80 backdrop-blur-sm border-l-4 border-l-primary">
              <CardContent className="p-4">
                <h4 className="text-primary font-bold font-mono text-sm">Machine Learning Engineering</h4>
                <p className="text-muted-foreground/70 text-xs font-mono">Google Cloud</p>
              </CardContent>
            </Card>
            <Card className="terminal-border bg-card/80 backdrop-blur-sm border-l-4 border-l-primary">
              <CardContent className="p-4">
                <h4 className="text-primary font-bold font-mono text-sm">AWS Certified Cloud Practitioner</h4>
                <p className="text-muted-foreground/70 text-xs font-mono">Amazon Web Services</p>
              </CardContent>
            </Card>
            <Card className="terminal-border bg-card/80 backdrop-blur-sm border-l-4 border-l-primary">
              <CardContent className="p-4">
                <h4 className="text-primary font-bold font-mono text-sm">Blockchain Fundamentals</h4>
                <p className="text-muted-foreground/70 text-xs font-mono">UC Berkeley Extension</p>
              </CardContent>
            </Card>
            <Card className="terminal-border bg-card/80 backdrop-blur-sm border-l-4 border-l-primary">
              <CardContent className="p-4">
                <h4 className="text-primary font-bold font-mono text-sm">Oracle Database SQL Certified Associate</h4>
                <p className="text-muted-foreground/70 text-xs font-mono">Oracle</p>
              </CardContent>
            </Card>
            <Card className="terminal-border bg-card/80 backdrop-blur-sm border-l-4 border-l-primary">
              <CardContent className="p-4">
                <h4 className="text-primary font-bold font-mono text-sm">Tableau Desktop Certified Professional</h4>
                <p className="text-muted-foreground/70 text-xs font-mono">Tableau / Salesforce</p>
              </CardContent>
            </Card>
            <Card className="terminal-border bg-card/80 backdrop-blur-sm border-l-4 border-l-primary">
              <CardContent className="p-4">
                <h4 className="text-primary font-bold font-mono text-sm">SQL Specialist Certification</h4>
                <p className="text-muted-foreground/70 text-xs font-mono">Microsoft</p>
              </CardContent>
            </Card>
            <Card className="terminal-border bg-card/80 backdrop-blur-sm border-l-4 border-l-primary">
              <CardContent className="p-4">
                <h4 className="text-primary font-bold font-mono text-sm">Microsoft Office Specialist: Excel</h4>
                <p className="text-muted-foreground/70 text-xs font-mono">Microsoft</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Open Source Section */}
      <section id="opensource" className="py-16 px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 matrix-text font-mono text-primary">
            <Bot className="inline mr-2" size={24} />
            [OPEN_SOURCE]
          </h2>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {[
              { stat: '194k+', label: 'Stars — OpenClaw',    desc: 'Active contributor to the leading open-source AI agent framework' },
              { stat: '9+',    label: 'Published Skills',    desc: 'Custom skills on ClawHub: sports-odds, nft-tracker, data-viz, streak-tracker, market-sentiment, and more' },
              { stat: '5+',    label: 'Merged OSS PRs',      desc: 'Contributions to LangChain, OpenClaw, React.dev, and other major repos' },
            ].map(({ stat, label, desc }) => (
              <Card key={label} className="terminal-border bg-card/80 backdrop-blur-sm text-center">
                <CardContent className="p-5">
                  <div className="text-3xl font-bold text-primary font-mono mb-1">{stat}</div>
                  <div className="text-primary/80 font-mono text-sm font-semibold mb-2">{label}</div>
                  <p className="text-muted-foreground text-xs font-mono">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-3">
            {[
              {
                repo: 'OpenClaw',
                url: 'https://github.com/openclaw/openclaw',
                description: 'Bug fixes, skill system improvements, and published 9+ skills to the ClawHub marketplace including market-sentiment and streak-tracker.',
                badge: 'Active Contributor',
              },
              {
                repo: 'LangChain',
                url: 'https://github.com/ianalloway/langchain/pull/1',
                description: 'Robust args_schema annotation validation using get_origin/get_args — handles Type[BaseModel], Optional, Annotated, and Union types.',
                badge: 'Merged PR',
              },
              {
                repo: 'OpenClaw Brain',
                url: 'https://github.com/ianalloway/openclaw-brain/pull/2',
                description: 'Model-specific task routing with automatic failover chains for rate limits, timeouts, and context overflow.',
                badge: 'Merged PR',
              },
              {
                repo: 'React.dev',
                url: 'https://github.com/ianalloway/react.dev/pull/3',
                description: 'Grammar fix in TypeScript guide (useContext typing section).',
                badge: 'Merged PR',
              },
            ].map(({ repo, url, description, badge }) => (
              <Card key={repo} className="terminal-border bg-card/80 backdrop-blur-sm border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start flex-wrap gap-2 mb-1">
                    <h4 className="text-primary font-bold font-mono text-sm">{repo}</h4>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-primary/10 text-primary">{badge}</span>
                  </div>
                  <p className="text-muted-foreground/70 text-xs font-mono mb-2">{description}</p>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary/60 hover:text-primary text-xs font-mono flex items-center gap-1 w-fit"
                  >
                    <ExternalLink size={11} /> View on GitHub
                  </a>
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
              <a
                href={`https://etherscan.io/address/${ETH_DONATION_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded bg-primary/10 text-primary text-xs font-mono hover:bg-primary/20 transition-colors"
              >
                {ETH_DONATION_ADDRESS.slice(0, 10)}...{ETH_DONATION_ADDRESS.slice(-8)}
              </a>
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

      {/* Testimonials Section */}
      <div className="relative z-10">
        <Testimonials />
      </div>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-primary/30 relative z-10">
        <div className="max-w-4xl mx-auto text-center flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-primary/50 text-xs font-mono">
            &gt; IAN.ALLOWAY.SYS // {new Date().getFullYear()} // Built with React + Tailwind
          </p>
          <a 
            href={`https://etherscan.io/address/${ETH_DONATION_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary/50 hover:text-primary text-xs font-mono flex items-center gap-1"
          >
            <Heart size={12} /> Donate ETH
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Index;
