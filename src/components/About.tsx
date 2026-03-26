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
    <section id="about" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">About</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            ML Engineer finishing a B.S. in Information Science at USF in May 2026 and starting an M.S. in Artificial Intelligence in August 2026. Building production ML systems and shipping open source work people can actually use.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="bg-card hover:border-muted-foreground/30 transition-all duration-200 hover:-translate-y-1">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-accent rounded-lg flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <div className="border border-border p-6 rounded-lg bg-card">
            <p className="text-muted-foreground max-w-4xl mx-auto text-lg leading-relaxed">
                Active open source contributor to OpenClaw (194k+ stars). Published 9 AI agent skills on ClawHub.
                Founder of Alloway LLC delivering data-driven solutions across sports analytics, fintech, and cybersecurity.
                Proven track record of reducing fraud incidents by 30% and improving client operational efficiency by 40%.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
