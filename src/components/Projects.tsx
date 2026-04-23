import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Github, Star } from 'lucide-react';

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
  stars?: string;
}

const PROJECTS: Project[] = [
  {
    title: 'nba-clv-dashboard',
    description: 'FastAPI + Chart.js evaluation demo: calibration, rolling accuracy, CLV summary — swap in your backtest JSON. Flagship sports ML showcase.',
    technologies: ['FastAPI', 'Chart.js', 'Sports ML', 'Python'],
    github: 'https://github.com/ianalloway/nba-clv-dashboard',
    demo: 'https://ianalloway.xyz/papers/sports-ml-evaluation-case-study.html',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=350&fit=crop',
    category: 'Sports ML',
    featured: true,
    stars: '⭐ Flagship',
  },
  {
    title: 'nba-ratings / nba-edge',
    description: 'Installable Elo / logistic win-prob / Kelly helpers. Published to PyPI as nba-edge. 68.3% model accuracy.',
    technologies: ['Python', 'Elo', 'Kelly Criterion', 'PyPI'],
    github: 'https://github.com/ianalloway/nba-ratings',
    demo: 'https://github.com/ianalloway/nba-ratings#readme',
    image: 'https://images.unsplash.com/photo-1519861536423-041a8384d70d?w=600&h=350&fit=crop',
    category: 'Sports ML',
    featured: true,
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
    title: 'closing-line-archive',
    description: 'CLI for historical odds snapshots and beat-close analysis using SQLite-backed sportsbook data.',
    technologies: ['Python', 'SQLite', 'Sports Data', 'CLI'],
    github: 'https://github.com/ianalloway/closing-line-archive',
    demo: 'https://github.com/ianalloway/closing-line-archive#readme',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&h=350&fit=crop',
    category: 'Sports ML',
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
    title: 'Booperbot',
    description: 'Autonomous AI agent with Notion diary integration, memory, and task automation. Built on LLMs with tool-use.',
    technologies: ['Python', 'LLMs', 'Notion API', 'Agents'],
    github: 'https://github.com/ianalloway',
    demo: '#',
    image: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&h=350&fit=crop',
    category: 'AI Agents',
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
    description: 'Open-source Bash CLI that reclaims macOS disk space from regenerable caches only. Documented algorithm, --dry-run, ShellCheck CI.',
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

const Projects = () => {
  const [activeCategory, setActiveCategory] = useState<Category>('All');

  const filtered = activeCategory === 'All'
    ? PROJECTS
    : PROJECTS.filter((p) => p.category === activeCategory);

  return (
    <section id="projects" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-muted-foreground text-xs uppercase tracking-widest font-mono mb-2">// SHIPPED_WORK</p>
          <h2 className="text-4xl font-bold text-foreground mb-4 font-mono">Featured Projects</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto font-mono text-sm">
            Sports ML · AI agents · MLOps tooling · and more. All production-grade, most open source.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full font-mono text-xs font-bold tracking-widest uppercase transition-all duration-200 border
                ${activeCategory === cat
                  ? 'bg-primary text-background border-primary shadow-[0_0_12px_hsl(120_100%_50%/0.4)]'
                  : 'border-primary/20 text-muted-foreground hover:border-primary/50 hover:text-primary'
                }`}
            >
              {cat}
              <span className="ml-1.5 opacity-60">
                ({cat === 'All' ? PROJECTS.length : PROJECTS.filter((p) => p.category === cat).length})
              </span>
            </button>
          ))}
        </div>

        {/* Project grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {filtered.map((project) => (
            <Card
              key={project.title}
              className={`bg-card overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_24px_hsl(120_100%_50%/0.12)]
                ${project.featured ? 'border-primary/30' : 'border-border hover:border-primary/30'}`}
            >
              <div className="aspect-video overflow-hidden relative">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-primary/40 bg-background/70 text-primary">
                    {project.category}
                  </span>
                  {project.featured && (
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-yellow-400/40 bg-background/70 text-yellow-400 flex items-center gap-1">
                      <Star size={9} className="fill-yellow-400" /> Featured
                    </span>
                  )}
                </div>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-foreground font-mono">{project.title}</CardTitle>
                <CardDescription className="text-muted-foreground text-sm leading-relaxed">
                  {project.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {project.technologies.map((tech) => (
                    <Badge
                      key={tech}
                      variant="outline"
                      className="text-[10px] font-mono border-primary/20 text-muted-foreground"
                    >
                      {tech}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  {project.github !== '#' && (
                    <Button size="sm" variant="outline" className="font-mono text-xs terminal-border border-primary/30 text-primary hover:bg-primary/10" asChild>
                      <a href={project.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                        <Github size={13} /> Code
                      </a>
                    </Button>
                  )}
                  {project.demo !== '#' && (
                    <Button size="sm" className="font-mono text-xs bg-primary text-background hover:bg-primary/80" asChild>
                      <a href={project.demo} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                        <ExternalLink size={13} /> Live Demo
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* GitHub CTA */}
        <div className="text-center mt-12">
          <a
            href="https://github.com/ianalloway"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-mono text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
          >
            <Github size={15} />
            See all 60+ repos on GitHub →
          </a>
        </div>
      </div>
    </section>
  );
};

export default Projects;
