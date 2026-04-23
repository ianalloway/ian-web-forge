import { useEffect, useRef, useState } from 'react';

interface Skill { name: string; level: number; }
interface SkillCategory {
  title: string;
  icon: string;
  color: string;
  skills: Skill[];
}

const CATEGORIES: SkillCategory[] = [
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
      { name: 'XGBoost', level: 92 },
      { name: 'PyTorch', level: 85 },
      { name: 'Scikit-learn', level: 90 },
      { name: 'TensorFlow', level: 78 },
      { name: 'NLP / LLMs', level: 82 },
      { name: 'YOLOv8', level: 75 },
    ],
  },
  {
    title: 'Data & Analytics',
    icon: '▲',
    color: 'hsl(60 100% 55%)',
    skills: [
      { name: 'Pandas / NumPy', level: 95 },
      { name: 'Statistical Analysis', level: 88 },
      { name: 'A/B Testing', level: 82 },
      { name: 'Tableau', level: 80 },
      { name: 'Power BI', level: 75 },
      { name: 'Streamlit', level: 78 },
    ],
  },
  {
    title: 'Infrastructure',
    icon: '◈',
    color: 'hsl(300 100% 65%)',
    skills: [
      { name: 'FastAPI', level: 90 },
      { name: 'GitHub Actions', level: 85 },
      { name: 'React', level: 82 },
      { name: 'PostgreSQL', level: 80 },
      { name: 'Docker', level: 78 },
      { name: 'AWS', level: 72 },
    ],
  },
];

const TOOLS = [
  'Hugging Face', 'MLflow', 'Weights & Biases', 'Jupyter', 'Cursor',
  'OpenAI API', 'Anthropic API', 'LangChain', 'Convex', 'Vercel',
  'Netlify', 'SQLite', 'Bash', 'Linux', 'REST APIs', 'WebSockets',
  'Blockchain Analytics', 'Git', 'VSCode',
];

function SkillBar({ skill, visible, color }: { skill: Skill; visible: boolean; color: string }) {
  return (
    <div className="mb-3.5">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-mono text-foreground/90">{skill.name}</span>
        <span className="text-[10px] font-mono text-muted-foreground">{skill.level}%</span>
      </div>
      <div className="progress-bar">
        <div
          className="progress-bar-fill"
          style={{
            width: visible ? `${skill.level}%` : '0%',
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            color,
            transitionDelay: '100ms',
          }}
        />
      </div>
    </div>
  );
}

const Skills = () => {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="skills" ref={ref} className="py-24 relative">
      <div className="container mx-auto px-4">

        <div className="text-center mb-16">
          <p className="section-label">// TECH_STACK</p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-mono">Skills &amp; Proficiency</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto font-mono text-sm">
            Production-grade tooling across ML, data engineering, and full-stack development.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.title}
              className="glass-card rounded-xl p-6 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-6">
                <span
                  className="text-base font-mono font-bold w-9 h-9 flex items-center justify-center rounded-lg"
                  style={{ color: cat.color, background: `${cat.color}15`, border: `1px solid ${cat.color}33` }}
                >
                  {cat.icon}
                </span>
                <h3 className="text-base font-bold font-mono text-foreground">{cat.title}</h3>
              </div>
              {cat.skills.map((skill) => (
                <SkillBar key={skill.name} skill={skill} visible={visible} color={cat.color} />
              ))}
            </div>
          ))}
        </div>

        {/* Tools section */}
        <div className="text-center">
          <p className="section-label mb-5">// ALSO_USING</p>
          <div className="flex flex-wrap justify-center gap-2">
            {TOOLS.map((tool) => (
              <span
                key={tool}
                className="px-3 py-1 rounded-full border border-primary/20 bg-card/50 text-muted-foreground font-mono text-xs hover:border-primary/50 hover:text-primary hover:shadow-[0_0_10px_hsl(120_100%_50%/0.2)] transition-all duration-200 cursor-default"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default Skills;
