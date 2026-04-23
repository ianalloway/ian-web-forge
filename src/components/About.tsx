import { useEffect, useRef, useState } from 'react';
import { Brain, Database, Bot, BarChart3 } from 'lucide-react';

const FEATURES = [
  {
    icon: Brain,
    title: 'Machine Learning',
    description: 'Production ML systems with XGBoost, PyTorch, TensorFlow. From feature engineering to deployment.',
    color: 'hsl(120 100% 50%)',
    bg: 'hsl(120 100% 50% / 0.08)',
  },
  {
    icon: Database,
    title: 'Data Engineering',
    description: 'ETL pipelines, multi-chain blockchain analytics, SQL optimization, and real-time event processing.',
    color: 'hsl(180 100% 50%)',
    bg: 'hsl(180 100% 50% / 0.08)',
  },
  {
    icon: Bot,
    title: 'AI Systems',
    description: 'Computer vision (YOLOv8), NLP, autonomous agents, LLM-powered apps, and evaluation tooling.',
    color: 'hsl(60 100% 55%)',
    bg: 'hsl(60 100% 55% / 0.08)',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description: 'Tableau, Power BI, calibration dashboards. Turning messy data into decisions people can trust.',
    color: 'hsl(300 100% 65%)',
    bg: 'hsl(300 100% 65% / 0.08)',
  },
];

const TIMELINE = [
  { year: '2018', label: 'Sales & Purchasing Manager — IT Parts and Spares Ltd.', type: 'work' },
  { year: '2020', label: 'Data Auditor / AI Engineer — Omniichain blockchain analytics', type: 'work' },
  { year: '2022', label: 'Started B.S. Information Science @ USF', type: 'edu' },
  { year: '2023', label: 'Founded Alloway LLC · First production ML system shipped', type: 'launch' },
  { year: '2024', label: 'Launched AI Advantage Sports · 68.3% model accuracy', type: 'launch' },
  { year: '2025', label: 'Published 9 OSS skills on ClawHub · nba-edge on PyPI', type: 'oss' },
  { year: 'May 2026', label: 'B.S. Information Science graduation @ USF', type: 'edu' },
  { year: 'Aug 2026', label: 'M.S. Artificial Intelligence begins @ USF', type: 'edu' },
];

const TYPE_COLORS: Record<string, string> = {
  edu: 'hsl(221 83% 60%)',
  work: 'hsl(120 100% 50%)',
  launch: 'hsl(60 100% 55%)',
  oss: 'hsl(300 100% 65%)',
};

const TYPE_LABELS: Record<string, string> = {
  edu: 'Education',
  work: 'Work',
  launch: 'Launch',
  oss: 'Open Source',
};

const STATS = [
  { label: 'Fraud Reduction', value: 30, suffix: '%', sub: 'for fintech client' },
  { label: 'Ops Efficiency', value: 40, suffix: '%', sub: 'improvement delivered' },
  { label: 'Model Accuracy', value: 68.3, suffix: '%', sub: 'NBA betting model', decimals: 1 },
  { label: 'OSS Skills', value: 9, suffix: '', sub: 'published on ClawHub' },
];

function AnimatedCounter({ target, suffix, visible, decimals = 0 }: { target: number; suffix: string; visible: boolean; decimals?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const steps = 60;
    const inc = target / steps;
    let cur = 0;
    const t = setInterval(() => {
      cur += inc;
      if (cur >= target) { setCount(target); clearInterval(t); }
      else setCount(parseFloat(cur.toFixed(decimals)));
    }, 1400 / steps);
    return () => clearInterval(t);
  }, [visible, target, decimals]);
  return <>{count % 1 === 0 ? count : count.toFixed(decimals)}{suffix}</>;
}

const About = () => {
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.12 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="about" ref={sectionRef} className="py-24">
      <div className="container mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-16">
          <p className="section-label">// WHO_AM_I</p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-mono animate-glow-pulse">About</h2>
          <p className="text-muted-foreground max-w-3xl mx-auto font-mono text-sm leading-relaxed">
            ML Engineer finishing a B.S. in Information Science at USF (May 2026) and starting an M.S. in Artificial Intelligence (Aug 2026).
            Building production ML systems and shipping open-source work people can actually use.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="glass-card rounded-xl p-6 text-center transition-all duration-300"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <div
                className="w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center"
                style={{ background: f.bg, border: `1px solid ${f.color}33` }}
              >
                <f.icon className="w-6 h-6" style={{ color: f.color }} />
              </div>
              <h3 className="text-sm font-bold mb-2 text-foreground font-mono">{f.title}</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>

        {/* Stats counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="glass-card rounded-xl p-5 text-center"
            >
              <div className="text-3xl font-bold font-mono text-primary mb-1">
                <AnimatedCounter target={s.value} suffix={s.suffix} visible={visible} decimals={s.decimals} />
              </div>
              <p className="text-xs font-mono font-bold text-foreground/80 uppercase tracking-widest">{s.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="max-w-3xl mx-auto">
          <p className="section-label text-center mb-8">// TIMELINE</p>
          <div className="relative">
            <div className="absolute left-[5.5rem] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent" />
            {TIMELINE.map((item, i) => (
              <div
                key={i}
                className={`flex items-start gap-4 mb-5 transition-all duration-500 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-6'}`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <span className="w-20 text-right text-[10px] font-mono text-muted-foreground pt-0.5 shrink-0 leading-tight">
                  {item.year}
                </span>
                <div
                  className="w-2.5 h-2.5 rounded-full mt-0.5 shrink-0 relative z-10"
                  style={{
                    background: TYPE_COLORS[item.type],
                    boxShadow: `0 0 10px ${TYPE_COLORS[item.type]}`,
                  }}
                />
                <div className="flex items-start gap-2 flex-1">
                  <span
                    className="tag-pill shrink-0 mt-0.5"
                    style={{
                      borderColor: `${TYPE_COLORS[item.type]}44`,
                      color: TYPE_COLORS[item.type],
                      background: `${TYPE_COLORS[item.type]}12`,
                    }}
                  >
                    {TYPE_LABELS[item.type]}
                  </span>
                  <p className="text-sm font-mono text-foreground/85 leading-relaxed">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bio blurb */}
        <div className="mt-14 max-w-4xl mx-auto glass-card rounded-2xl p-7 text-center">
          <p className="text-muted-foreground text-sm font-mono leading-relaxed">
            Active open source contributor to OpenClaw (194k+ stars). Published 9 AI agent skills on ClawHub.
            Founder of Alloway LLC delivering data-driven solutions across sports analytics, fintech, and cybersecurity.
            Proven track record of reducing fraud incidents by{' '}
            <span className="text-primary font-bold">30%</span> and improving client operational efficiency by{' '}
            <span className="text-primary font-bold">40%</span>.
          </p>
        </div>

      </div>
    </section>
  );
};

export default About;
