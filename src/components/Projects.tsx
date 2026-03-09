import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Github } from 'lucide-react';

const Projects = () => {
  const projects = [
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
            Production ML systems, AI agents, Web3 apps, and open source contributions across LangChain, React.dev, and OpenClaw.
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
