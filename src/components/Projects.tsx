import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Github } from 'lucide-react';

const Projects = () => {
  const projects = [
    {
      title: "Sports Betting ML",
      description: "XGBoost model trained on 5 seasons of NBA data. Compares predictions against sportsbook odds to find value bets using Kelly Criterion. Live on HuggingFace.",
      technologies: ["Python", "XGBoost", "Scikit-learn", "Streamlit", "HuggingFace"],
      github: "https://github.com/ianalloway/sports-betting-ml",
      demo: "https://huggingface.co/spaces/ianalloway/sports-betting-ml",
      image: "https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?w=400&h=250&fit=crop"
    },
    {
      title: "Drone AI",
      description: "Autonomous navigation system: YOLOv8 obstacle detection, A*/RRT* path planning, behavior trees for mission logic, and MAVLink flight controller communication.",
      technologies: ["Python", "YOLOv8", "PyTorch", "MAVLink", "ROS"],
      github: "https://github.com/ianalloway/ai-drone-auto-vehicle",
      demo: "#",
      image: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400&h=250&fit=crop"
    },
    {
      title: "AI Advantage Sports",
      description: "Production sports betting platform with ML predictions, Kelly Criterion bet sizing, and real-time value bet alerts for NBA games.",
      technologies: ["React", "FastAPI", "PostgreSQL", "XGBoost", "Stripe"],
      github: "#",
      demo: "https://aiadvantagesports.com",
      image: "https://images.unsplash.com/photo-1461896836934-bd45ba8b0e28?w=400&h=250&fit=crop"
    },
    {
      title: "Mutant Intelligence",
      description: "Web3 app that transforms MAYC NFTs into AI assistants with traits-based personality generated from on-chain metadata.",
      technologies: ["React", "Ethers.js", "Solidity", "OpenAI", "Web3"],
      github: "#",
      demo: "https://mutantintelligence.com",
      image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=250&fit=crop"
    },
    {
      title: "Money Maker Bot",
      description: "Open-source financial intelligence assistant built on OpenClaw for sports betting, NFT tracking, and portfolio visualization.",
      technologies: ["Python", "OpenClaw", "FastAPI", "React", "Web3"],
      github: "https://github.com/ianalloway/Money-maker-bot",
      demo: "#",
      image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=250&fit=crop"
    },
    {
      title: "Job Fit Analyzer",
      description: "Full-stack NLP app that analyzes job descriptions against candidate profiles using semantic similarity scoring.",
      technologies: ["React", "FastAPI", "NLP", "Sentence Transformers", "Docker"],
      github: "#",
      demo: "https://clawdbot-setup-app-haw39wkx.devinapps.com",
      image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=250&fit=crop"
    }
  ];

  return (
    <section id="projects" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">Featured Projects</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Production ML systems, autonomous drones, Web3 apps, and open source contributions across LangChain, React.dev, and OpenClaw.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {projects.map((project, index) => (
            <Card key={index} className="bg-gradient-card hover:shadow-elegant transition-all duration-300 hover:-translate-y-2 overflow-hidden">
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
