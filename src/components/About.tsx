import { Card, CardContent } from '@/components/ui/card';
import { Brain, Database, Bot, BarChart3 } from 'lucide-react';

const About = () => {
  const features = [
    {
      icon: Brain,
      title: "Machine Learning",
      description: "Production ML systems with XGBoost, PyTorch, TensorFlow. From training to deployment."
    },
    {
      icon: Database,
      title: "Data Engineering",
      description: "ETL pipelines, multi-chain blockchain data, SQL optimization, and real-time analytics."
    },
    {
      icon: Bot,
      title: "AI Systems",
      description: "Computer vision (YOLOv8), NLP, autonomous navigation, and AI agent development."
    },
    {
      icon: BarChart3,
      title: "Analytics",
      description: "Tableau, Power BI dashboards. Turning complex datasets into decisions that move the needle."
    }
  ];

  return (
    <section id="about" className="py-20 bg-muted/30 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="text-primary font-mono text-sm mb-2">
            <span className="animate-terminal-blink">_</span> ACCESSING_USER_DATA
          </div>
          <h2 className="text-4xl font-bold text-foreground mb-4 font-mono matrix-text">&gt; ABOUT.EXE</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-mono">
            &gt; ML Engineer graduating B.S. Data Science from USF (May 2026)<br/>
            &gt; Starting M.S. in Artificial Intelligence (Fall 2026)<br/>
            &gt; Building production ML systems and shipping open source contributions
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="bg-card/50 hover:bg-card/80 hover:shadow-glow transition-all duration-300 hover:-translate-y-1 terminal-border matrix-glow">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-primary/20 rounded-lg flex items-center justify-center terminal-border">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground font-mono matrix-text">[{feature.title.toUpperCase()}]</h3>
                <p className="text-muted-foreground text-sm font-mono">&gt; {feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center">
          <div className="terminal-border matrix-glow p-6 bg-background/50 backdrop-blur-sm font-mono">
            <div className="text-primary mb-2">&gt; ADDITIONAL_INFO:</div>
            <p className="text-muted-foreground max-w-4xl mx-auto text-lg leading-relaxed">
              Active open source contributor to OpenClaw (190K+ stars). Published 4 AI agent skills on ClawHub.
              Founder of Alloway LLC delivering AI-powered analytics that reduced client fraud incidents by 30%
              and improved operational efficiency by 40%.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
