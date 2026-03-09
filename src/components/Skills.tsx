import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Skills = () => {
  const skillCategories = [
    {
      title: "Languages",
      skills: ["Python", "SQL", "R", "TypeScript", "JavaScript", "Solidity"]
    },
    {
      title: "ML / AI",
      skills: ["TensorFlow", "PyTorch", "Scikit-learn", "XGBoost", "YOLOv8", "NLP", "Deep Learning", "Computer Vision"]
    },
    {
      title: "Data & Analytics",
      skills: ["Pandas", "NumPy", "Tableau", "Power BI", "Statistical Analysis", "A/B Testing", "Streamlit"]
    },
    {
      title: "Infrastructure & Web",
      skills: ["Docker", "AWS", "Git", "React", "FastAPI", "PostgreSQL", "Blockchain Analytics", "APIs"]
    }
  ];

  return (
    <section id="skills" className="py-20 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">Skills</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Technology stack and framework proficiencies across modern development tools.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {skillCategories.map((category, index) => (
            <Card key={index} className="bg-card hover:border-muted-foreground/30 transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-xl text-foreground">{category.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {category.skills.map((skill, skillIndex) => (
                    <Badge
                      key={skillIndex}
                      variant="secondary"
                      className="hover:bg-foreground hover:text-background transition-colors cursor-pointer"
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
