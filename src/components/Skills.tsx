import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Skills = () => {
  const skillCategories = [
    {
      title: "Frontend",
      skills: ["React", "TypeScript", "Next.js", "Vue.js", "Tailwind CSS", "SCSS", "Vite", "Webpack"]
    },
    {
      title: "Backend", 
      skills: ["Node.js", "Python", "Express", "FastAPI", "PostgreSQL", "MongoDB", "Redis", "GraphQL"]
    },
    {
      title: "Tools & Cloud",
      skills: ["Docker", "AWS", "Google Cloud", "Git", "GitHub Actions", "Kubernetes", "Terraform", "Vercel"]
    },
    {
      title: "Mobile & Other",
      skills: ["React Native", "Flutter", "Figma", "Jest", "Cypress", "Linux", "Nginx", "Supabase"]
    }
  ];

  return (
    <section id="skills" className="py-20 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="text-primary font-mono text-sm mb-2">
            <span className="animate-terminal-blink">█</span> SCANNING_SKILL_DATABASE
          </div>
          <h2 className="text-4xl font-bold text-foreground mb-4 font-mono matrix-text">&gt; SKILLS.LOG</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-mono">
            &gt; COMPILING: Technology stack and framework proficiencies<br/>
            &gt; SCOPE: Modern development tools for exceptional digital architectures
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {skillCategories.map((category, index) => (
            <Card key={index} className="bg-card/50 hover:bg-card/80 hover:shadow-glow transition-all duration-300 terminal-border matrix-glow">
              <CardHeader>
                <CardTitle className="text-xl text-foreground font-mono matrix-text">[{category.title.toUpperCase()}_MODULE]</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {category.skills.map((skill, skillIndex) => (
                    <Badge 
                      key={skillIndex} 
                      variant="secondary" 
                      className="hover:bg-primary hover:text-background transition-colors cursor-pointer font-mono terminal-border matrix-text"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Skills;