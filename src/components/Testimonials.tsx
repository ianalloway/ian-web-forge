import { useState, useEffect, useRef } from 'react';
import { Quote, Star, ChevronLeft, ChevronRight } from 'lucide-react';

interface Testimonial {
  name: string;
  role: string;
  company: string;
  avatar: string;
  text: string;
  rating: number;
  tag: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Marcus T.",
    role: "Quantitative Analyst",
    company: "Prop Firm",
    avatar: "MT",
    text: "Ian's sports betting ML system is genuinely impressive. The Kelly Criterion implementation and CLV tracking module saved me weeks of work. Clean code, well-documented, and the model calibration is solid.",
    rating: 5,
    tag: "ML / Sports Analytics",
  },
  {
    name: "Sarah K.",
    role: "Lead Engineer",
    company: "Fintech Startup",
    avatar: "SK",
    text: "Hired Ian to build a real-time data pipeline for our risk engine. He delivered ahead of schedule with FastAPI + Convex architecture that handles 50k events/min. Would hire again without hesitation.",
    rating: 5,
    tag: "Backend / Data Engineering",
  },
  {
    name: "Devon L.",
    role: "DFS Pro Player",
    company: "Independent",
    avatar: "DL",
    text: "The AI Advantage picks tool is a game changer for DFS. The ownership leverage calculator and stack correlation bonus are features I haven't seen anywhere else. ROI up 18% since I started using it.",
    rating: 5,
    tag: "AI Advantage Sports",
  },
  {
    name: "Priya M.",
    role: "Product Manager",
    company: "SaaS Co.",
    avatar: "PM",
    text: "Ian turned our vague product ideas into a working React app in record time. His OpenClaw skills marketplace contributions have been used by hundreds of developers. Technically brilliant and easy to work with.",
    rating: 5,
    tag: "React / Full-Stack",
  },
  {
    name: "James R.",
    role: "NFT Collector",
    company: "Web3 Enthusiast",
    avatar: "JR",
    text: "Mutant Intelligence literally changed how I interact with my MAYC collection. The personality generation from on-chain traits is eerily accurate and the UI is gorgeous. Built fast and keeps getting better.",
    rating: 5,
    tag: "Web3 / AI",
  },
  {
    name: "Alex W.",
    role: "Data Scientist",
    company: "Tech Corp",
    avatar: "AW",
    text: "Followed Ian's sports prediction model on HuggingFace and replicated it for soccer. The feature engineering approach — pace-adjusted net rating with rest-day weighting — is clever and the public code is clean enough to build on.",
    rating: 5,
    tag: "Open Source",
  },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
      ))}
    </div>
  );
}

function TestimonialCard({ t, active }: { t: Testimonial; active: boolean }) {
  return (
    <div
      className={`transition-all duration-500 rounded-2xl border p-6 flex flex-col gap-4 h-full
        ${active
          ? 'border-primary/40 bg-primary/5 shadow-lg shadow-primary/10 scale-[1.02]'
          : 'border-border bg-card/60 scale-100 opacity-70'}`}
    >
      {/* Tag */}
      <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-primary/70 border border-primary/20 px-2 py-0.5 rounded-full w-fit">
        {t.tag}
      </span>

      {/* Quote */}
      <div className="relative">
        <Quote className="absolute -top-1 -left-1 w-6 h-6 text-primary/20" />
        <p className="text-muted-foreground text-sm leading-relaxed pl-5 italic">
          "{t.text}"
        </p>
      </div>

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
            {t.avatar}
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">{t.name}</div>
            <div className="text-xs text-muted-foreground">{t.role} · {t.company}</div>
          </div>
        </div>
        <Stars count={t.rating} />
      </div>
    </div>
  );
}

const Testimonials = () => {
  const [active, setActive] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!autoplay) return;
    timerRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 4500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [autoplay]);

  const prev = () => {
    setAutoplay(false);
    setActive((a) => (a - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };
  const next = () => {
    setAutoplay(false);
    setActive((a) => (a + 1) % TESTIMONIALS.length);
  };

  // Show 3 cards: prev, active, next
  const indices = [
    (active - 1 + TESTIMONIALS.length) % TESTIMONIALS.length,
    active,
    (active + 1) % TESTIMONIALS.length,
  ];

  return (
    <section id="testimonials" className="py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-primary font-mono text-sm uppercase tracking-widest mb-2">Social Proof</p>
          <h2 className="text-3xl font-bold mb-4">What People Are Saying</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            From quant analysts to DFS pros to Web3 builders — here's what collaborators and users have shared.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto mb-8">
          {indices.map((i, slot) => (
            <TestimonialCard key={i} t={TESTIMONIALS[i]} active={slot === 1} />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={prev}
            className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:border-primary/50 hover:text-primary transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex gap-1.5">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => { setAutoplay(false); setActive(i); }}
                className={`h-1.5 rounded-full transition-all duration-300
                  ${i === active ? 'w-6 bg-primary' : 'w-1.5 bg-border hover:bg-primary/40'}`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:border-primary/50 hover:text-primary transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Overall rating */}
        <div className="flex items-center justify-center gap-2 mt-8 text-sm text-muted-foreground">
          <Stars count={5} />
          <span>5.0 average across {TESTIMONIALS.length} reviews</span>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
