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
    <section id="about" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">About Me</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            I'm a passionate full-stack developer with expertise in modern web technologies. 
            I love creating digital experiences that combine beautiful design with robust functionality.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="bg-gradient-card hover:shadow-card transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center">
          <p className="text-muted-foreground max-w-4xl mx-auto text-lg leading-relaxed">
            When I'm not coding, you can find me exploring new technologies, contributing to open-source projects, 
            or sharing knowledge with the developer community. I believe in continuous learning and staying 
            up-to-date with the latest industry trends and best practices.
          </p>
        </div>
      </div>
    </section>
  );
};

export default About;