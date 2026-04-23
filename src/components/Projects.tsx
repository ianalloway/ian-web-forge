import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, Github, Star, Zap } from 'lucide-react';

type Category = 'All' | 'Sports ML' | 'AI Agents' | 'MLOps' | 'Tools' | 'Web3';

interface Project {
  title: string;
  description: string;
  technologies: string[];
  github: string;
  demo: string;
  image: string;
  category: Category;
  featured?: boolean;
}

const PROJECTS: Project[] = [
  {
    title: 'nba-clv-dashboard',
    description: 'FastAPI + Chart.js evaluation demo: calibration, rolling accuracy, CLV summary. Swap in your backtest JSON. Flagship sports ML showcase.',
    technologies: ['FastAPI', 'Chart.js', 'Sports ML', 'Python'],
    github: 'https://github.com/ianalloway/nba-clv-dashboard',
    demo: 'https://ianalloway.xyz/papers/sports-ml-evaluation-case-study.html',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=350&fit=crop',
    category: 'Sports ML',
    featured: true,
  },
  {
    title: 'NBA Sports Betting Pipeline',
    description: 'XGBoost model hitting 68.3% accuracy with Kelly Criterion bet sizing. Live at aiadvantagesports.com and on Hugging Face.',
    technologies: ['Python', 'XGBoost', 'FastAPI', 'Hugging Face'],
    github: '#',
    demo: 'https://aiadvantagesports.com',
    image: 'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?w=600&h=350&fit=crop',
    category: 'Sports ML',
    featured: true,
  },
  {
    title: 'nba-ratings / nba-edge',
    description: 'Installable Elo / logistic win-prob / Kelly helpers. Published to PyPI as nba-edge.',
    technologies: ['Python', 'Elo', 'Kelly Criterion', 'PyPI'],
    github: 'https://github.com/ianalloway/nba-ratings',
    demo: 'https://github.com/ianalloway/nba-ratings#readme',
    image: 'https://images.unsplash.com/photo-1519861536423-041a8384d70d?w=600&h=350&fit=crop',
    category: 'Sports ML',
  },
  {
    title: 'odds-drift-watch',
    description: 'Webhook-based line-move monitoring with FastAPI and SQLite. Alerts on meaningful market shifts using Line Shock Index.',
    technologies: ['FastAPI', 'SQLite', 'Sports Analytics', 'Webhooks'],
    github: 'https://github.com/ianalloway/odds-drift-watch',
    demo: 'https://github.com/ianalloway/odds-drift-watch#readme',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&h=350&fit=crop',
    category: 'Sports ML',
  },
  {
    title: 'openclaw-skills',
    description: '9 published open-source skills: sports-odds, nft-tracker, data-viz, screenshot-annotator, kelly-criterion, portfolio-rebalancer, market-sentiment, streak-tracker, devin-integration.',
    technologies: ['Python', 'OpenClaw', 'Open Source', 'ClawHub'],
    github: 'https://github.com/ianalloway/openclaw-skills',
    demo: 'https://github.com/ianalloway/openclaw-skills#readme',
    image: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=600&h=350&fit=crop',
    category: 'AI Agents',
    featured: true,
  },
  {
    title: 'Booperbot',
    description: 'Autonomous AI agent with Notion diary integration, memory, and task automation built on LLMs with tool-use.',
    technologies: ['Python', 'LLMs', 'Notion API', 'Agents'],
    github: 'https://github.com/ianalloway',
    demo: '#',
    image: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&h=350&fit=crop',
    category: 'AI Agents',
  },
  {
    title: 'Job Fit Analyzer',
    description: 'FastAPI + React app with regex-based skill extraction and job-resume matching. Hosted on Devin.',
    technologies: ['Python', 'FastAPI', 'React', 'NLP'],
    github: '#',
    demo: 'https://clawdbot-setup-app-haw39wkx.devinapps.com',
    image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&h=350&fit=crop',
    category: 'AI Agents',
  },
  {
    title: 'backtest-report-gen',
    description: 'Turn evaluation JSON into static HTML backtest reports with calibration, Brier, CLV, and ledger views.',
    technologies: ['Python', 'Reporting', 'MLOps', 'HTML'],
    github: 'https://github.com/ianalloway/backtest-report-gen',
    demo: 'https://github.com/ianalloway/backtest-report-gen#readme',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=350&fit=crop',
    category: 'MLOps',
  },
  {
    title: 'metric-regression-gate',
    description: 'Composite GitHub Action that fails CI when metrics regress against a baseline. Plug-and-play for any ML project.',
    technologies: ['GitHub Actions', 'CI/CD', 'MLOps', 'YAML'],
    github: 'https://github.com/ianalloway/metric-regression-gate',
    demo: 'https://github.com/ianalloway/metric-regression-gate#readme',
    image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=600&h=350&fit=crop',
    category: 'MLOps',
  },
  {
    title: 'stock-sentiment-analyzer',
    description: 'NLP-driven stock sentiment combining news, Reddit, and SEC filing signals into ticker-level views.',
    technologies: ['Python', 'NLP', 'Analytics', 'APIs'],
    github: 'https://github.com/ianalloway/stock-sentiment-analyzer',
    demo: 'https://github.com/ianalloway/stock-sentiment-analyzer#readme',
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&h=350&fit=crop',
    category: 'MLOps',
  },
  {
    title: 'macOS Disk Cleanup',
    description: 'Open-source Bash CLI that reclaims macOS disk space from regenerable caches only. ShellCheck CI, --dry-run flag.',
    technologies: ['Bash', 'macOS', 'GitHub Actions', 'CLI'],
    github: 'https://github.com/ianalloway/macos-disk-cleanup',
    demo: 'https://github.com/ianalloway/macos-disk-cleanup#readme',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=350&fit=crop',
    category: 'Tools',
  },
  {
    title: 'code-stash',
    description: 'CLI snippet manager with SQLite storage and local LLM-powered search for reusable code blocks.',
    technologies: ['Python', 'SQLite', 'LLMs', 'CLI'],
    github: 'https://github.com/ianalloway/code-stash',
    demo: 'https://github.com/ianalloway/code-stash#readme',
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&h=350&fit=crop',
    category: 'Tools',
  },
  {
    title: 'repo-health',
    description: 'Repo scoring CLI for README quality, licensing, CI, maintenance signals, and staleness detection.',
    technologies: ['Python', 'CLI', 'Developer Tools', 'GitHub API'],
    github: 'https://github.com/ianalloway/repo-health',
    demo: 'https://github.com/ianalloway/repo-health#readme',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=350&fit=crop',
    category: 'Tools',
  },
  {
    title: 'Mutant Intelligence',
    description: 'AI agent built on MAYC NFT traits. Personality generation from on-chain data. Live at mutantintelligence.com.',
    technologies: ['Python', 'Web3', 'LLMs', 'NFT'],
    github: '#',
    demo: 'https://mutantintelligence.com',
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&h=350&fit=crop',
    category: 'Web3',
  },
];

const CATEGORIES: Category[] = ['All', 'Sports ML', 'AI Agents', 'MLOps', 'Tools', 'Web3'];

const CAT_COLORS: Record<Category, string> = {
  'All': 'hsl(120 100% 50%)',
  'Sports ML': 'hsl(120 100% 50%)',
  'AI Agents': 'hsl(180 100% 50%)',
  'MLOps': 'hsl(60 100% 55%)',
  'Tools': 'hsl(300 100% 65%)',
  'Web3': 'hsl(221 83% 60%)',
};

const Projects = () => {
  const [active, setActive] = useState<Category>('All');
  const filtered = active === 'All' ? PROJECTS : PROJECTS.filter(p => p.category === active);

  return (
    <section id="projects" className="py-24">
      <div className="container mx-auto px-4">

        <div className="text-center mb-12">
          <p className="section-label">// SHIPPED_WORK</p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-mono">Featured Projects</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto font-mono text-sm">
            Sports ML · AI agents · MLOps tooling · Developer tools. All production-grade, most open source.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {CATEGORIES.map((cat) => {
            const count = cat === 'All' ? PROJECTS.length : PROJECTS.filter(p => p.category === cat).length;
            const color = CAT_COLORS[cat];
            const isActive = active === cat;
            return (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className="px-4 py-1.5 rounded-full font-mono text-xs font-bold tracking-widest uppercase transition-all duration-200 border"
                style={isActive ? {
                  background: color,
                  color: '#000',
                  borderColor: color,
                  boxShadow: `0 0 16px ${color}55`,
                } : {
                  borderColor: `${color}33`,
                  color: 'hsl(var(--muted-foreground))',
                }}
              >
                {cat}
                <span className="ml-1.5 opacity-60">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 gap-5">
          {filtered.map((project) => {
            const catColor = CAT_COLORS[project.category];
            return (
              <div
                key={project.title}
                className="glass-card rounded-xl overflow-hidden transition-all duration-300"
                style={project.featured ? { borderColor: `${catColor}44` } : {}}
              >
                {/* Image */}
                <div className="aspect-video overflow-hidden relative">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span
                      className="tag-pill"
                      style={{ borderColor: `${catColor}44`, color: catColor, background: `${catColor}15` }}
                    >
                      {project.category}
                    </span>
                    {project.featured && (
                      <span className="tag-pill" style={{ borderColor: 'hsl(60 100% 55% / 0.4)', color: 'hsl(60 100% 55%)', background: 'hsl(60 100% 55% / 0.1)' }}>
                        <Star size={8} className="mr-1 fill-current" />Featured
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-base font-bold text-foreground font-mono mb-2">{project.title}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed mb-4">{project.description}</p>

                  {/* Tech badges */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {project.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-0.5 rounded-full border border-primary/15 bg-card/50 text-muted-foreground font-mono text-[10px]"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2">
                    {project.github !== '#' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="font-mono text-xs border-primary/25 text-primary hover:bg-primary/10 hover:border-primary/50"
                        asChild
                      >
                        <a href={project.github} target="_blank" rel="noopener noreferrer">
                          <Github size={12} className="mr-1.5" /> Code
                        </a>
                      </Button>
                    )}
                    {project.demo !== '#' && (
                      <Button
                        size="sm"
                        className="font-mono text-xs bg-primary text-background hover:bg-primary/85 hover:shadow-[0_0_12px_hsl(120_100%_50%/0.4)]"
                        asChild
                      >
                        <a href={project.demo} target="_blank" rel="noopener noreferrer">
                          <ExternalLink size={12} className="mr-1.5" /> Live Demo
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* GitHub CTA */}
        <div className="text-center mt-12">
          <a
            href="https://github.com/ianalloway"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-mono text-sm text-muted-foreground hover:text-primary transition-colors duration-200 group"
          >
            <Github size={14} />
            <span className="neon-underline">See all 60+ repos on GitHub</span>
            <Zap size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        </div>

      </div>
    </section>
  );
};

export default Projects;
