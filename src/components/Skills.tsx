import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';

interface Skill {
  name: string;
  level: number; // 0-100
}

interface SkillCategory {
  title: string;
  icon: string;
  color: string;
  skills: Skill[];
}

const SKILL_CATEGORIES: SkillCategory[] = [
  {
    title: 'Languages',
    icon: '{ }',
    color: 'hsl(120 100% 50%)',
    skills: [
      { name: 'Python', level: 95 },
      { name: 'SQL', level: 88 },
      { name: 'TypeScript', level: 78 },
      { name: 'JavaScript', level: 80 },
      { name: 'R', level: 70 },
      { name: 'Solidity', level: 55 },
    ],
  },
  {
    title: 'ML / AI',
    icon: '⚡',
    color: 'hsl(180 100% 50%)',
    skills: [
      { name: 'PyTorch', level: 85 },
      { name: 'XGBoost', level: 92 },
      { name: 'Scikit-learn', level: 90 },
      { name: 'TensorFlow', level: 78 },
      { name: 'YOLOv8', level: 75 },
      { name: 'NLP / LLMs', level: 82 },
    ],
  },
  {
    title: 'Data & Analytics',
    icon: '▲',
    color: 'hsl(60 100% 50%)',
    skills: [
      { name: 'Pandas / NumPy', level: 95 },
      { name: 'Statistical Analysis', level: 88 },
      { name: 'Tableau', level: 80 },
      { name: 'Power BI', level: 75 },
      { name: 'A/B Testing', level: 82 },
      { name: 'Streamlit', level: 78 },
    ],
  },
  {
    title: 'Infrastructure & Web',
    icon: '◈',
    color: 'hsl(300 100% 60%)',
    skills: [
      { name: 'FastAPI', level: 90 },
      { name: 'React', level: 82 },
      { name: 'Docker', level: 78 },
      { name: 'AWS', level: 72 },
      { name: 'PostgreSQL', level: 80 },
      { name: 'GitHub Actions', level: 85 },
    ],
  },
];

const TOOL_BADGES = [
  'Hugging Face', 'MLflow', 'Weights & Biases', 'Jupyter', 'VSCode',
  'Git', 'Linux', 'Bash', 'REST APIs', 'WebSockets', 'SQLite',
  'Blockchain Analytics', 'OpenAI API', 'Anthropic API', 'LangChain',
];

function SkillBar({ skill, visible, color }: { skill: Skill; visible: boolean; color: string }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-mono text-foreground/90">{skill.name}</span>
        <span className="text-xs font-mono text-muted-foreground">{skill.level}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: visible ? `${skill.level}%` : '0%',
            background: `linear-gradient(90deg, ${color}99, ${color})`,
            boxShadow: visible ? `0 0 8px ${color}66` : 'none',
          }}
        />
      </div>
    </div>
  );
}

const Skills = () => {
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="skills" ref={sectionRef} className="py-20 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-muted-foreground text-xs uppercase tracking-widest font-mono mb-2">// TECH_STACK</p>
          <h2 className="text-4xl font-bold text-foreground mb-4 font-mono">Skills &amp; Proficiency</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto font-mono text-sm">
            Production-grade tooling across ML, data engineering, and full-stack development.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {SKILL_CATEGORIES.map((cat) => (
            <div
              key={cat.title}
              className="rounded-xl border border-primary/20 bg-card p-6 hover:border-primary/40 transition-all duration-300 hover:shadow-[0_0_20px_hsl(120_100%_50%/0.1)]"
            >
              <div className="flex items-center gap-3 mb-5">
                <span
                  className="text-lg font-mono font-bold w-9 h-9 flex items-center justify-center rounded-lg border border-primary/20"
                  style={{ color: cat.color, borderColor: `${cat.color}44` }}
                >
                  {cat.icon}
                </span>
                <h3 className="text-lg font-semibold font-mono text-foreground">{cat.title}</h3>
              </div>
              {cat.skills.map((skill) => (
                <SkillBar key={skill.name} skill={skill} visible={visible} color={cat.color} />
              ))}
            </div>
          ))}
        </div>

        {/* Tools badges */}
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest font-mono text-muted-foreground mb-4">// ALSO_USING</p>
          <div className="flex flex-wrap justify-center gap-2">
            {TOOL_BADGES.map((tool) => (
              <Badge
                key={tool}
                variant="outline"
                className="font-mono text-xs border-primary/20 text-muted-foreground hover:border-primary/60 hover:text-primary hover:shadow-[0_0_8px_hsl(120_100%_50%/0.2)] transition-all duration-200 cursor-default"
              >
                {tool}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Skills;
