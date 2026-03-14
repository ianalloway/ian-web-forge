import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Github, ExternalLink, Mail, Linkedin, Twitter, Terminal, Brain, Code, BookOpen, FileText, Download, GraduationCap, Bot, Newspaper, Heart, Copy, Sun, Moon, Briefcase, DollarSign, CheckCircle2 } from 'lucide-react';
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
    name: 'Money-maker-bot',
    description: 'Financial intelligence agent forked from OpenClaw/Clawdbot. Built with an 8-component architecture: Brain, Soul, DNA, Muscles, Bones, Eyes, Heartbeat, and Nervous System.',
    tech: ['Python', 'OpenClaw', 'Anthropic API'],
    url: 'https://github.com/ianalloway/Money-maker-bot',
    isGithub: true,
  },
  {
    name: 'NBA Sports Betting Pipeline',
    description: 'XGBoost model hitting 68.3% accuracy with Kelly Criterion bet sizing. Live at aiadvantagesports.com and on Hugging Face.',
    tech: ['Python', 'XGBoost', 'FastAPI', 'Hugging Face'],
    url: 'https://aiadvantagesports.com',
    isGithub: false,
  },
  {
    name: 'Booperbot',
    description: 'Autonomous agent featuring Notion diary integration.',
    tech: ['Python', 'LLMs', 'Notion API'],
    url: 'https://github.com/ianalloway',
    isGithub: true,
  },
  {
    name: 'Mutant Intelligence',
    description: 'AI agent built on MAYC NFT traits. Live at mutantintelligence.com.',
    tech: ['Python', 'Web3', 'LLMs'],
    url: 'https://mutantintelligence.com',
    isGithub: false,
  },
  {
    name: 'ClawHub Contributions',
    description: '9 published open-source skills including sports-odds, nft-tracker, data-viz, screenshot-annotator, kelly-criterion, portfolio-rebalancer, market-sentiment, streak-tracker, and devin-integration.',
    tech: ['Python', 'OpenClaw', 'Open Source'],
    url: 'https://github.com/openclaw/openclaw',
    isGithub: true,
  },
  {
    name: 'Job Fit Analyzer',
    description: 'FastAPI + React app with regex-based skill extraction, hosted on Devin.',
    tech: ['Python', 'FastAPI', 'React'],
    url: 'https://clawdbot-setup-app-haw39wkx.devinapps.com',
    isGithub: false,
  },
  {
    name: 'Drone AI',
    description: 'Autonomous navigation system: YOLOv8 obstacle detection, A*/RRT* path planning, behavior trees for mission logic, and MAVLink flight controller communication.',
    tech: ['Python', 'PyTorch', 'MAVLink'],
    url: 'https://github.com/ianalloway/ai-drone-auto-vehicle',
    isGithub: true,
  },
  {
    name: 'TF Object Detector',
    description: 'Real-time object detection running entirely in the browser. TensorFlow.js COCO-SSD identifies 80+ object classes via webcam with animated bounding boxes and confidence scores.',
    tech: ['TensorFlow.js', 'React', 'TypeScript'],
    url: 'https://github.com/ianalloway/tf-object-detection',
    isGithub: true,
  },
  {
    name: 'Stock Sentiment Analyzer',
    description: 'AI-powered news sentiment analysis app. Enter any stock ticker and get real-time sentiment analysis using NLP transformers.',
    tech: ['Python', 'NLP', 'Streamlit'],
    url: 'https://github.com/ianalloway/stock-sentiment-analyzer',
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
    const cacheBuster = Math.floor(Date.now() / 60000);
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
            <a href="#blog" className="text-primary hover:text-primary/70 transition-all">[BLOG]</a>
            <a href="#opensource" className="text-primary hover:text-primary/70 transition-all">[OSS]</a>
            <a href="#contact" className="text-primary hover:text-primary/70 transition-all">[CONTACT]</a>
            <a href="/now" className="text-primary hover:text-primary/70 transition-all">[/NOW]</a>
            <a href="/hireme" className="text-primary hover:text-primary/70 transition-all">[/HIRE]</a>
            <a href="/pdf-reader" className="text-primary hover:text-primary/70 transition-all">[/PDF]</a>
            <button
              onClick={toggleTheme}
              className="ml-2 p-2 rounded-md border border-primary/30 hover:bg-primary/10 transition-all"
              aria-label="Toggle theme"
            >
              {theme === 'matrix' ? <Sun size={16} className="text-primary" /> : <Moon size={16} className="text-primary" />}
            </button>
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
            Machine Learning Engineer &amp; Data Scientist
          </p>
          <p className="text-muted-foreground font-mono mb-5 text-sm">
            I build robust AI/ML pipelines, predictive models, and full-stack applications. I'm a builder focused on solving real-world problems with data.
          </p>
          <p className="text-muted-foreground font-mono mb-8 text-sm">
            B.S. Data Science @ USF (Dec 2025) | M.S. AI @ USF (Dec 2027) | Founder @ Alloway LLC
          </p>

          <div className="inline-block px-4 py-2 mb-6 terminal-border rounded-lg bg-primary/5">
            <span className="text-primary text-sm font-semibold font-mono">OPEN TO WORK</span>
            <span className="text-muted-foreground text-sm font-mono"> — Data Scientist / ML Engineer roles</span>
          </div>

          {/* Social Links */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            <Button className="font-mono bg-primary text-primary-foreground hover:bg-primary/90" asChild>
              <a href="#contracting">
                <Briefcase className="mr-2" size={18} /> Hire Me
              </a>
            </Button>
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
                <BookOpen className="mr-2" size={16} /> Substack
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
                &gt; Machine Learning Engineer and Data Scientist. I build robust AI/ML pipelines, predictive models, and full-stack applications.
                Open-source contributor to OpenClaw (194k+ stars) with 9 published skills on ClawHub. Founder of Alloway LLC, delivering data-driven solutions across sports analytics, fintech, and cybersecurity.
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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project, index) => (
              <Card key={index} className="terminal-border bg-card/80 backdrop-blur-sm hover:scale-105 transition-transform">
                <CardContent className="p-4 flex flex-col h-full">
                  <h3 className="text-primary font-bold mb-2 font-mono text-sm">{project.name}</h3>
                  <p className="text-muted-foreground/70 text-xs mb-3 font-mono flex-grow">{project.description}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {project.tech.map((tech, i) => (
                      <span key={i} className="px-2 py-0.5 text-xs terminal-border rounded font-mono text-primary/80">
                        {tech}
                      </span>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="font-mono terminal-border text-primary border-primary hover:bg-primary/10 text-xs w-fit" asChild>
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
              <h3 className="text-primary font-bold mb-3 font-mono text-lg">Money-maker-bot</h3>
              <p className="text-muted-foreground font-mono mb-4 text-sm">
                &gt; Financial intelligence agent forked from OpenClaw/Clawdbot. Built with an 8-component architecture:
                Brain, Soul, DNA, Muscles, Bones, Eyes, Heartbeat, and Nervous System. Fork it and build your own.
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
                      <a href={`/pdf-reader?url=${encodeURIComponent(paper.file)}`}>
                        <FileText className="mr-1" size={12} /> Open in Reader
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
      <section id="certifications" className="py-16 px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 matrix-text font-mono text-primary">
            <GraduationCap className="inline mr-2" size={24} />
            [CERTIFICATIONS]
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              { name: 'Deep Learning Specialization', org: 'Coursera (Andrew Ng)' },
              { name: 'Machine Learning Engineering', org: 'Google Cloud' },
              { name: 'AWS Certified Cloud Practitioner', org: 'Amazon Web Services' },
              { name: 'Blockchain Fundamentals', org: 'UC Berkeley Extension' },
              { name: 'Oracle Database SQL Certified Associate', org: 'Oracle' },
              { name: 'Tableau Desktop Certified Professional', org: 'Tableau / Salesforce' },
              { name: 'SQL Specialist Certification', org: 'Microsoft' },
              { name: 'Microsoft Office Specialist: Excel', org: 'Microsoft' },
            ].map((cert, index) => (
              <Card key={index} className="terminal-border bg-card/80 backdrop-blur-sm border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <h4 className="text-primary font-bold font-mono text-sm">{cert.name}</h4>
                  <p className="text-muted-foreground font-mono text-xs">{cert.org}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Open Source Section */}
      <section id="opensource" className="py-16 px-4 bg-primary/5 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 matrix-text font-mono text-primary">
            <Code className="inline mr-2" size={24} />
            [OPEN_SOURCE]
          </h2>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {[
              { stat: '194k+', label: 'Stars — OpenClaw',    desc: 'Active contributor to the leading open-source AI agent framework' },
              { stat: '9',     label: 'Published Skills',    desc: 'Custom skills on ClawHub: sports-odds, nft-tracker, data-viz, screenshot-annotator, kelly-criterion, portfolio-rebalancer, market-sentiment, streak-tracker, devin-integration' },
              { stat: '5+',    label: 'Merged OSS PRs',      desc: 'Contributions to LangChain, OpenClaw, React.dev, and other major repos' },
            ].map(({ stat, label, desc }) => (
              <Card key={label} className="terminal-border bg-card/80 backdrop-blur-sm text-center">
                <CardContent className="p-5">
                  <div className="text-3xl font-bold text-primary mb-1 font-mono matrix-text">{stat}</div>
                  <div className="text-muted-foreground text-sm font-semibold mb-2 font-mono">{label}</div>
                  <p className="text-muted-foreground/70 text-xs font-mono">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-3">
            {[
              {
                repo: 'OpenClaw',
                url: 'https://github.com/openclaw/openclaw',
                description: 'Bug fixes, skill system improvements, and published 9 skills to the ClawHub marketplace including sports-odds, nft-tracker, data-viz, kelly-criterion, portfolio-rebalancer, market-sentiment, streak-tracker, screenshot-annotator, and devin-integration.',
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
                    <span className="text-xs px-2 py-0.5 rounded terminal-border font-mono text-primary/80">{badge}</span>
                  </div>
                  <p className="text-muted-foreground/70 text-xs mb-2 font-mono">{description}</p>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/70 text-xs flex items-center gap-1 w-fit transition-colors font-mono"
                  >
                    <ExternalLink size={11} /> View on GitHub
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contracting Section */}
      <section id="contracting" className="py-16 px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 matrix-text font-mono text-primary">
            <Briefcase className="inline mr-2" size={24} />
            [HIRE_ME]
          </h2>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="space-y-6">
              <p className="text-muted-foreground text-sm leading-relaxed font-mono">
                &gt; I am available for independent contractor (1099) roles.
                Whether you need AI integration, data pipeline engineering, or full-stack development,
                I can help scale your technical capabilities.
              </p>

              <ul className="space-y-3">
                {[
                  "AI Agent Development & Integration",
                  "ML Model Training & Deployment",
                  "Data Visualization & Dashboards",
                  "Full-stack Web Applications",
                  "Process Automation & Optimization"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-muted-foreground text-xs font-mono">
                    <CheckCircle2 size={14} className="text-primary/60" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="terminal-border p-4 rounded bg-card/80 backdrop-blur-sm">
                <h4 className="text-primary font-bold text-sm mb-2 flex items-center gap-2 font-mono">
                  <DollarSign size={16} /> HOURLY_RATE
                </h4>
                <div className="text-2xl font-bold text-primary mb-1 font-mono matrix-text">$100<span className="text-xs text-muted-foreground ml-1">/hour</span></div>
                <p className="text-muted-foreground/70 text-[10px] font-mono">
                  &gt; Standard rate for 1099 independent contractor services.
                </p>
              </div>
            </div>

            <Card className="terminal-border bg-card/80 backdrop-blur-sm border-t-4 border-t-primary">
              <CardContent className="p-6">
                <h3 className="text-primary font-bold text-lg mb-4 text-center font-mono">[GET_STARTED]</h3>
                <p className="text-muted-foreground text-xs mb-6 text-center font-mono">
                  &gt; Ready to start? Pay initial hours securely via Stripe to kick off our collaboration.
                </p>

                <div className="space-y-4">
                  <Button
                    className="w-full font-mono bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-sm"
                    asChild
                  >
                    <a
                      href="https://buy.stripe.com/test_6oU6oG0Na4vQ02N9od9R606"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Briefcase className="mr-2" size={18} /> Hire as Contractor
                    </a>
                  </Button>

                  <div className="flex items-center gap-2 justify-center py-2">
                    <div className="h-[1px] bg-primary/30 flex-1"></div>
                    <span className="text-[10px] text-muted-foreground font-mono">OR</span>
                    <div className="h-[1px] bg-primary/30 flex-1"></div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full font-mono terminal-border text-primary border-primary hover:bg-primary/10 h-12 text-sm"
                    asChild
                  >
                    <a href="mailto:ian@allowayllc.com">
                      <Mail className="mr-2" size={18} /> Discuss Project
                    </a>
                  </Button>
                </div>

                <div className="mt-6 flex items-center justify-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-4" />
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
            &gt; Looking for a data scientist, ML engineer, or research engineer? Reach out directly.
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
                className="px-3 py-1.5 rounded bg-primary/10 text-primary text-xs font-mono hover:text-primary/70 transition-colors"
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
