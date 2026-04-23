import { useEffect, useRef, useState } from 'react';
import { Brain, Database, Bot, BarChart3, CheckCircle2 } from 'lucide-react';

const FEATURES = [
  {
    icon: Brain,
    title: 'Machine Learning',
    description: 'Production ML systems with XGBoost, PyTorch, TensorFlow. From training to deployment.',
    color: 'hsl(120 100% 50%)',
  },
  {
    icon: Database,
    title: 'Data Engineering',
    description: 'ETL pipelines, multi-chain blockchain data, SQL optimization, and real-time analytics.',
    color: 'hsl(180 100% 50%)',
  },
  {
    icon: Bot,
    title: 'AI Systems',
    description: 'Computer vision (YOLOv8), NLP, autonomous agents, and LLM-powered applications.',
    color: 'hsl(60 100% 50%)',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description: 'Tableau, Power BI dashboards. Turning complex datasets into decisions that move the needle.',
    color: 'hsl(300 100% 60%)',
  },
];

const TIMELINE = [
  { year: '2022', label: 'Started B.S. Information Science @ USF', type: 'edu' },
  { year: '2023', label: 'Founded Alloway LLC · First production ML system', type: 'work' },
  { year: '2024', label: 'Launched AI Advantage Sports · 68.3% model accuracy', type: 'launch' },
  { year: '2025', label: 'Published 9 OSS skills on ClawHub · nba-edge on PyPI', type: 'oss' },
  { year: 'May 2026', label: 'B.S. Information Science graduation', type: 'edu' },
  { year: 'Aug 2026', label: 'M.S. Artificial Intelligence begins @ USF', type: 'edu' },
];

const TYPE_COLORS: Record<string, string> = {
  edu: 'hsl(221 83% 60%)',
  work: 'hsl(120 100% 50%)',
  launch: 'hsl(60 100% 50%)',
  oss: 'hsl(300 100% 60%)',
};

const STATS = [
  { label: 'Fraud Reduction', value: 30, suffix: '%', description: 'for fintech client' },
  { label: 'Ops Efficiency', value: 40, suffix: '%', description: 'improvement delivered' },
  { label: 'Model Accuracy', value: 68.3, suffix: '%', description: 'NBA betting model' },
  { label: 'OSS Skills', value: 9, suffix: '', description: 'published on ClawHub' },
];

function AnimatedCounter({ target, suffix, visible }: { target: number; suffix: string; visible: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const duration = 1500;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(parseFloat(current.toFixed(1)));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [visible, target]);

  return (
    <span className="text-3xl font-bold font-mono text-primary">
      {count % 1 === 0 ? count : count.toFixed(1)}{suffix}
    </span>
  );
}

const About = () => {
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="about" ref={sectionRef} className="py-20">
      <div className="container mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-muted-foreground text-xs uppercase tracking-widest font-mono mb-2">// WHO_AM_I</p>
          <h2 className="text-4xl font-bold text-foreground mb-4 font-mono">About</h2>
          <p className="text-muted-foreground max-w-3xl mx-auto font-mono text-sm leading-relaxed">
            ML Engineer finishing a B.S. in Information Science at USF in May 2026 and starting an M.S. in Artificial Intelligence in August 2026.
            Building production ML systems and shipping open source work people can actually use.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {FEATURES.map((feature, i) => (
            <div
              key={i}
              className="rounded-xl border border-primary/20 bg-card p-6 text-center hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_0_20px_hsl(120_100%_50%/0.1)]"
            >
              <div
                className="w-12 h-12 mx-auto mb-4 rounded-lg flex items-center justify-center border"
                style={{ borderColor: `${feature.color}44`, background: `${feature.color}15` }}
              >
                <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
              </div>
              <h3 className="text-base font-semibold mb-2 text-foreground font-mono">{feature.title}</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Stats counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="text-center rounded-xl border border-primary/20 bg-card p-5 hover:border-primary/40 transition-all duration-300"
            >
              <AnimatedCounter target={stat.value} suffix={stat.suffix} visible={visible} />
              <p className="text-sm font-mono font-semibold text-foreground mt-1">{stat.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.description}</p>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="max-w-3xl mx-auto">
          <p className="text-xs uppercase tracking-widest font-mono text-muted-foreground mb-8 text-center">// TIMELINE</p>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[5.5rem] top-0 bottom-0 w-px bg-primary/20" />

            {TIMELINE.map((item, i) => (
              <div
                key={i}
                className={`flex items-start gap-4 mb-6 transition-all duration-500 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <span className="w-20 text-right text-xs font-mono text-muted-foreground pt-0.5 shrink-0">
                  {item.year}
                </span>
                <div
                  className="w-2.5 h-2.5 rounded-full mt-1 shrink-0 relative z-10 shadow-[0_0_8px_currentColor]"
                  style={{ background: TYPE_COLORS[item.type], color: TYPE_COLORS[item.type] }}
                />
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} style={{ color: TYPE_COLORS[item.type] }} className="shrink-0" />
                  <p className="text-sm font-mono text-foreground/90">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bio blurb */}
        <div className="mt-16 max-w-4xl mx-auto rounded-xl border border-primary/20 bg-card p-6">
          <p className="text-muted-foreground text-sm font-mono leading-relaxed text-center">
            Active open source contributor to OpenClaw (194k+ stars). Published 9 AI agent skills on ClawHub.
            Founder of Alloway LLC delivering data-driven solutions across sports analytics, fintech, and cybersecurity.
            Proven track record of reducing fraud incidents by <span className="text-primary">30%</span> and improving client operational efficiency by <span className="text-primary">40%</span>.
          </p>
        </div>

      </div>
    </section>
  );
};

export default About;
