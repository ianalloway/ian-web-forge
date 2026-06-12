import { Card, CardContent } from '@/components/ui/card';
import { Brain, Database, Bot, BarChart3 } from 'lucide-react';

const About = () => {
  const features = [
    {
      icon: Brain,
      title: "AI Evaluation",
      description: "LLM judge audits, calibration, adversarial checks, and reporting that makes model behavior easier to trust."
    },
    {
      icon: Database,
      title: "Data Systems",
      description: "Data auditing, ETL pipelines, SQL analysis, predictive analytics, and dashboards that survive real use."
    },
    {
      icon: Bot,
      title: "Agent Apps",
      description: "Agent-developed tools and workflows with clean logic, practical automation, and interfaces people can actually use."
    },
    {
      icon: BarChart3,
      title: "Product Delivery",
      description: "From rough idea to polished demo, docs, public proof, and software that feels intentionally built."
    }
  ];

  return (
    <section id="about" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">About</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Applied AI engineer with a B.S. in Information Science from USF, completed May 2026, and an M.S. in Artificial Intelligence at USF in progress. Building evaluation-driven software, agent apps, and analytics products that hold up under scrutiny.
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
                Contributor to OpenClaw and builder of public AI evaluation, developer tooling, and agent-workflow projects.
                Founder of Alloway LLC delivering data-driven solutions across analytics, fintech, and operational workflows.
                Proven track record of reducing fraud incidents by 30% and improving client operational efficiency by 40%.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
