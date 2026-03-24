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
      github: "https://github.com/ianalloway/nba-clv-dashboard",
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
      title: "line-shop-cli",
      description: "Line shopping + CSV + optional Kelly sizing; demo odds fixture or The Odds API.",
      technologies: ["Python", "Sports analytics"],
      github: "https://github.com/ianalloway/line-shop-cli",
      demo: "https://github.com/ianalloway/line-shop-cli#readme",
      image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=250&fit=crop"
    },
    {
      title: "macOS Disk Cleanup",
      description: "Open-source Bash CLI that reclaims macOS disk space from regenerable caches only (Homebrew, Go, Chrome, npm/pip, optional Docker/Xcode). Documented algorithm, --dry-run, ShellCheck CI.",
      technologies: ["Bash", "macOS", "GitHub Actions"],
      github: "https://github.com/ianalloway/macos-disk-cleanup",
      demo: "https://github.com/ianalloway/macos-disk-cleanup#readme",
      image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=250&fit=crop"
    },
    {
      title: "dev-setup-macos",
      description: "One-command Homebrew Bundle bootstrap for a clean dev Mac—pairs with macOS Disk Cleanup.",
      technologies: ["Bash", "Homebrew", "ShellCheck CI"],
      github: "https://github.com/ianalloway/dev-setup-macos",
      demo: "https://github.com/ianalloway/dev-setup-macos#readme",
      image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=250&fit=crop"
    },
    {
      title: "model-cardgen",
      description: "Turn metrics.json into Markdown model cards and data cards—MLOps documentation without extra deps.",
      technologies: ["Python", "MLOps", "CLI"],
      github: "https://github.com/ianalloway/model-cardgen",
      demo: "https://github.com/ianalloway/model-cardgen#readme",
      image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=250&fit=crop"
    },
    {
      title: "agent-trace-kit",
      description: "JSONL spans + HTML replay for debugging agent tool loops.",
      technologies: ["Python", "Agents", "Observability"],
      github: "https://github.com/ianalloway/agent-trace-kit",
      demo: "https://github.com/ianalloway/agent-trace-kit#readme",
      image: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=250&fit=crop"
    },
    {
      title: "fraud-anomaly-bench",
      description: "Synthetic + OpenML baselines; RandomForest vs IsolationForest leaderboard.",
      technologies: ["Python", "scikit-learn"],
      github: "https://github.com/ianalloway/fraud-anomaly-bench",
      demo: "https://github.com/ianalloway/fraud-anomaly-bench#readme",
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&h=250&fit=crop"
    },
    {
      title: "substack-rag-local",
      description: "Local RAG over Substack RSS—TF–IDF retrieval + Streamlit or CLI.",
      technologies: ["Python", "RAG", "Streamlit"],
      github: "https://github.com/ianalloway/substack-rag-local",
      demo: "https://github.com/ianalloway/substack-rag-local#readme",
      image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=250&fit=crop"
    },
    {
      title: "Money-maker-bot",
      description: "Financial intelligence agent forked from OpenClaw/Clawdbot. Built with an 8-component architecture: Brain, Soul, DNA, Muscles, Bones, Eyes, Heartbeat, and Nervous System.",
      technologies: ["Python", "OpenClaw", "Anthropic API"],
      github: "https://github.com/ianalloway/Money-maker-bot",
      demo: "#",
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
      title: "Drone AI",
      description: "Autonomous navigation system: YOLOv8 obstacle detection, A*/RRT* path planning, behavior trees for mission logic, and MAVLink flight controller communication.",
      technologies: ["Python", "YOLOv8", "PyTorch", "MAVLink"],
      github: "https://github.com/ianalloway/ai-drone-auto-vehicle",
      demo: "#",
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
