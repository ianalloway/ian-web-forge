import { Card, CardContent } from '@/components/ui/card';
import { Code, Lightbulb, Users, Zap } from 'lucide-react';

const About = () => {
  const features = [
    {
      icon: Code,
      title: "Clean Code",
      description: "Writing maintainable, scalable, and efficient code that stands the test of time."
    },
    {
      icon: Lightbulb,
      title: "Problem Solving",
      description: "Approaching complex challenges with creative solutions and analytical thinking."
    },
    {
      icon: Users,
      title: "Collaboration",
      description: "Working effectively with teams to deliver exceptional user experiences."
    },
    {
      icon: Zap,
      title: "Performance",
      description: "Optimizing applications for speed, accessibility, and user satisfaction."
    }
  ];

  return (
    <section id="about" className="py-20 bg-muted/30 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="text-primary font-mono text-sm mb-2">
            <span className="animate-terminal-blink">█</span> ACCESSING_USER_DATA
          </div>
          <h2 className="text-4xl font-bold text-foreground mb-4 font-mono matrix-text">&gt; ABOUT.EXE</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-mono">
            &gt; LOADING: Developer profile data...<br/>
            &gt; STATUS: Full-stack engineer specializing in modern web architectures<br/>
            &gt; MISSION: Creating digital experiences with robust functionality
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
              When not actively coding, I engage in technology research, contribute to open-source repositories, 
              and participate in developer community knowledge sharing. Continuous learning protocol active - 
              staying current with industry evolution and best practices.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;