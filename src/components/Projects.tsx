import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Github } from 'lucide-react';

const Projects = () => {
  const projects = [
    {
      title: "nba-clv-dashboard (flagship)",
      description: "FastAPI + Chart.js evaluation demo: calibration, rolling accuracy, CLV summary — swap in your backtest JSON.",
      technologies: ["FastAPI", "Chart.js", "Sports ML"],
      github: "https://github.com/ianalloway/oss-archive/tree/archive/nba-clv-dashboard",
      demo: "https://ianalloway.xyz/papers/sports-ml-evaluation-case-study.html",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop"
    },
    {
      title: "nba-ratings / nba-edge",
      description: "Installable Elo / logistic win-prob / Kelly helpers; PyPI package name nba-edge.",
      technologies: ["Python", "Elo", "Kelly"],
      github: "https://github.com/ianalloway/nba-ratings",
      demo: "https://github.com/ianalloway/nba-ratings#readme",
      image: "https://images.unsplash.com/photo-1519861536423-041a8384d70d?w=400&h=250&fit=crop"
    },
    {
      title: "odds-drift-watch",
      description: "Webhook-based line-move monitoring with FastAPI and SQLite for alerting on meaningful market shifts.",
      technologies: ["FastAPI", "SQLite", "Sports analytics"],
      github: "https://github.com/ianalloway/oss-archive/tree/archive/odds-drift-watch",
      demo: "https://github.com/ianalloway/oss-archive/tree/archive/odds-drift-watch#readme",
      image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=250&fit=crop"
    },
    {
      title: "macOS Disk Cleanup",
      description: "Open-source Bash CLI that reclaims macOS disk space from regenerable caches only (Homebrew, Go, Chrome, npm/pip, optional Docker/Xcode). Documented algorithm, --dry-run, ShellCheck CI.",
      technologies: ["Bash", "macOS", "GitHub Actions"],
      github: "https://github.com/ianalloway/oss-archive/tree/archive/macos-disk-cleanup",
      demo: "https://github.com/ianalloway/oss-archive/tree/archive/macos-disk-cleanup#readme",
      image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=250&fit=crop"
    },
    {
      title: "closing-line-archive",
      description: "CLI for historical odds snapshots and beat-close analysis using SQLite-backed sportsbook data.",
      technologies: ["Python", "SQLite", "Sports data"],
      github: "https://github.com/ianalloway/oss-archive/tree/archive/closing-line-archive",
      demo: "https://github.com/ianalloway/oss-archive/tree/archive/closing-line-archive#readme",
      image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=250&fit=crop"
    },
    {
      title: "backtest-report-gen",
      description: "Turn evaluation JSON into static HTML backtest reports with calibration, Brier, CLV, and ledger views.",
      technologies: ["Python", "Reporting", "MLOps"],
      github: "https://github.com/ianalloway/oss-archive/tree/archive/backtest-report-gen",
      demo: "https://github.com/ianalloway/oss-archive/tree/archive/backtest-report-gen#readme",
      image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=250&fit=crop"
    },
    {
      title: "metric-regression-gate",
      description: "Composite GitHub Action that fails CI when metrics regress against a baseline.",
      technologies: ["GitHub Actions", "CI", "MLOps"],
      github: "https://github.com/ianalloway/oss-archive/tree/archive/metric-regression-gate",
      demo: "https://github.com/ianalloway/oss-archive/tree/archive/metric-regression-gate#readme",
      image: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=250&fit=crop"
    },
    {
      title: "code-stash",
      description: "CLI snippet manager with SQLite storage and local LLM-powered search for reusable code.",
      technologies: ["Python", "SQLite", "Developer tools"],
      github: "https://github.com/ianalloway/oss-archive/tree/archive/code-stash",
      demo: "https://github.com/ianalloway/oss-archive/tree/archive/code-stash#readme",
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&h=250&fit=crop"
    },
    {
      title: "stock-sentiment-analyzer",
      description: "NLP-driven stock sentiment tool that combines news, Reddit, and filing signals into ticker-level sentiment views.",
      technologies: ["Python", "NLP", "Analytics"],
      github: "https://github.com/ianalloway/oss-archive/tree/archive/stock-sentiment-analyzer",
      demo: "https://github.com/ianalloway/oss-archive/tree/archive/stock-sentiment-analyzer#readme",
      image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=250&fit=crop"
    },
    {
      title: "repo-health",
      description: "Repo scoring CLI for README quality, licensing, CI, maintenance signals, and staleness.",
      technologies: ["Python", "CLI", "Developer tools"],
      github: "https://github.com/ianalloway/oss-archive/tree/archive/repo-health",
      demo: "https://github.com/ianalloway/oss-archive/tree/archive/repo-health#readme",
      image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=250&fit=crop"
    },
    {
      title: "NBA Sports Betting Pipeline",
      description: "XGBoost model hitting 68.3% accuracy with Kelly Criterion bet sizing. Live at aiadvantagesports.com and on Hugging Face.",
      technologies: ["Python", "XGBoost", "FastAPI", "Hugging Face"],
      github: "#",
      demo: "https://aiadvantagesports.com",
      image: "https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?w=400&h=250&fit=crop"
    },
    {
      title: "Booperbot",
      description: "Autonomous agent featuring Notion diary integration.",
      technologies: ["Python", "LLMs", "Notion API"],
      github: "https://github.com/ianalloway",
      demo: "#",
      image: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&h=250&fit=crop"
    },
    {
      title: "Mutant Intelligence",
      description: "AI agent built on MAYC NFT traits. Live at mutantintelligence.com.",
      technologies: ["Python", "Web3", "LLMs"],
      github: "#",
      demo: "https://mutantintelligence.com",
      image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=250&fit=crop"
    },
    {
      title: "ClawHub Contributions",
      description: "9 published open-source skills including sports-odds, nft-tracker, data-viz, screenshot-annotator, kelly-criterion, portfolio-rebalancer, market-sentiment, streak-tracker, and devin-integration.",
      technologies: ["Python", "OpenClaw", "Open Source"],
      github: "https://github.com/openclaw/openclaw",
      demo: "#",
      image: "https://images.unsplash.com/photo-1461896836934-bd45ba8b0e28?w=400&h=250&fit=crop"
    },
    {
      title: "Job Fit Analyzer",
      description: "FastAPI + React app with regex-based skill extraction, hosted on Devin.",
      technologies: ["Python", "FastAPI", "React"],
      github: "#",
      demo: "https://clawdbot-setup-app-haw39wkx.devinapps.com",
      image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=250&fit=crop"
    },
    {
      title: "openclaw-skills",
      description: "Published OpenClaw and ClawHub skills spanning sports odds, Kelly sizing, portfolio tools, and market sentiment.",
      technologies: ["OpenClaw", "Agents", "Open source"],
      github: "https://github.com/ianalloway/oss-archive/tree/archive/openclaw-skills",
      demo: "https://github.com/ianalloway/oss-archive/tree/archive/openclaw-skills#readme",
      image: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400&h=250&fit=crop"
    }
  ];

  return (
    <section id="projects" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">Featured Work</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Flagship narrative: sports ML — calibration-first dashboards, PyPI primitives (Elo / Kelly), and line-shopping tooling; plus agents, MLOps OSS, and earlier shipped products.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {projects.map((project, index) => (
            <Card key={index} className="bg-card hover:border-muted-foreground/30 transition-all duration-200 hover:-translate-y-1 overflow-hidden">
              <div className="aspect-video overflow-hidden">
                <img 
                  src={project.image} 
                  alt={project.title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
              <CardHeader>
                <CardTitle className="text-xl text-foreground">{project.title}</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {project.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.technologies.map((tech, techIndex) => (
                    <Badge key={techIndex} variant="outline" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button size="sm" variant="outline" asChild>
                    <a href={project.github} className="flex items-center gap-2">
                      <Github size={16} />
                      Code
                    </a>
                  </Button>
                  <Button size="sm" asChild>
                    <a href={project.demo} className="flex items-center gap-2">
                      <ExternalLink size={16} />
                      Live Demo
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;
