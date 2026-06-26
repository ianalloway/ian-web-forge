import MatrixRain from '@/components/MatrixRain';

/* ──────────────────────────────────────────────────────────────────────────
   LLM Evaluation Consulting — positions Ian as an LLM eval consultant,
   anchored on juryrig (zero-dependency LLM-as-judge audit toolkit).
   Matches the terminal/matrix aesthetic of Index.tsx (explicit hex tokens).
   ────────────────────────────────────────────────────────────────────────── */

const ACCENT = '#5be49b';
const CYAN = '#4fd6e0';
const HAIRLINE = 'rgba(255,255,255,0.08)';

const PROBLEMS = [
  {
    label: 'Position bias',
    desc: 'Swap the order of two candidates and the judge flips its verdict. Same content, opposite outcome — your eval scores are noise.',
  },
  {
    label: 'Verbosity bias',
    desc: 'The model rewards longer answers regardless of correctness. Bloated responses win, concise right answers lose.',
  },
  {
    label: 'Miscalibration',
    desc: 'The judge says "92% confident" and is right 60% of the time. Your Brier score and ECE quietly drift, and nobody checks.',
  },
  {
    label: 'Prompt-injection',
    desc: 'A buried instruction in a candidate response flips the judge. Your automated eval gets gamed by the thing it is scoring.',
  },
];

const SERVICES = [
  {
    n: '01',
    title: 'Audit & Calibration',
    desc: 'Stress-test your existing LLM-as-judge pipeline for position bias, verbosity bias, injection susceptibility, and calibration drift. Get a report with flip rates, Brier, and ECE — plus what to fix.',
    tags: ['Brier', 'ECE', 'Flip rate'],
  },
  {
    n: '02',
    title: 'Pipeline Design',
    desc: 'Design an eval harness that survives contact with production: rubric structure, panel agreement, tie-breaking, and regression gates that fail CI when metrics slip.',
    tags: ['Rubrics', 'Panels', 'CI gates'],
  },
  {
    n: '03',
    title: 'Custom Tooling',
    desc: 'Zero-dependency audit tooling that drops into your repo and runs in CI. Based on the patterns proven in juryrig — no vendored blobs, no supply-chain surprises.',
    tags: ['Stdlib', 'CI', 'CLI'],
  },
  {
    n: '04',
    title: 'Team Training',
    desc: 'Get your engineers reading bias plots and calibration curves instead of trusting a single leaderboard number. Workshops on running and interpreting LLM-judge audits.',
    tags: ['Workshops', 'Reviews'],
  },
];

const METRICS = [
  { value: '0', label: 'dependencies', sub: 'pure stdlib, auditable' },
  { value: 'Position', label: 'bias audit', sub: 'order-swap flip rates' },
  { value: 'Verbosity', label: 'bias audit', sub: 'length-vs-score drift' },
  { value: 'Brier + ECE', label: 'calibration', sub: 'confidence vs accuracy' },
];

const AUDITS = [
  { name: 'Position bias', detail: 'Swaps candidate order and measures verdict flip rate.' },
  { name: 'Verbosity bias', detail: 'Correlates response length against awarded score.' },
  { name: 'Prompt-injection', detail: 'Embeds adversarial instructions and measures lift.' },
  { name: 'Calibration', detail: 'Brier score and Expected Calibration Error vs ground truth.' },
  { name: 'Panel agreement', detail: 'Inter-judge agreement across a multi-model panel.' },
];

const Eyebrow = ({ children }: { children: string }) => (
  <p
    className="font-jet uppercase"
    style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.18em', color: ACCENT, marginBottom: 12 }}
  >
    {children}
  </p>
);

const Consulting = () => {
  const shell = 'max-w-[1120px] mx-auto px-8';

  return (
    <div
      className="font-plex"
      style={{ background: '#0a0b0a', color: '#e8eae6', minHeight: '100vh', position: 'relative' }}
    >
      <MatrixRain />

      {/* Ambient background layers */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.025) 1px, transparent 0)',
          backgroundSize: '42px 42px',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'fixed',
          top: '-15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80vw',
          height: '55vh',
          zIndex: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse at center, rgba(91,228,155,0.06) 0%, transparent 68%)',
        }}
      />

      <main style={{ position: 'relative', zIndex: 1 }}>
        {/* ── Nav ── */}
        <nav
          aria-label="Primary"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            background: 'rgba(10,11,10,0.72)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div className={shell} style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <a href="/consulting" style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: ACCENT, boxShadow: '0 0 10px rgba(91,228,155,0.7)' }} />
              <span className="font-jet" style={{ fontWeight: 700, fontSize: 14, color: '#e8eae6' }}>
                ian<span style={{ color: ACCENT }}>.</span>alloway
              </span>
            </a>
            <a href="/" className="font-jet btn-outline" style={{ fontSize: 12.5, color: '#d6dbcf', border: '1px solid rgba(255,255,255,0.13)', padding: '8px 16px', borderRadius: 6, whiteSpace: 'nowrap' }}>
              ← Back to home
            </a>
          </div>
        </nav>

        {/* ── 1. Hero ── */}
        <header id="top" style={{ padding: '96px 32px 88px' }}>
          <div style={{ maxWidth: 880, margin: '0 auto' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 9,
                padding: '6px 14px 6px 12px',
                border: '1px solid rgba(91,228,155,0.28)',
                borderRadius: 100,
                background: 'rgba(91,228,155,0.05)',
                marginBottom: 30,
              }}
            >
              <span style={{ position: 'relative', width: 8, height: 8 }}>
                <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: ACCENT }} />
                <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: ACCENT, animation: 'home-pulse-ring 2.4s ease-out infinite' }} />
              </span>
              <span className="font-jet uppercase" style={{ fontSize: 11.5, fontWeight: 500, letterSpacing: '0.14em', color: '#9fe9c1', whiteSpace: 'nowrap' }}>
                Consulting · LLM Evaluation
              </span>
            </div>

            <p className="font-jet" style={{ fontSize: 13, color: '#8b9085', letterSpacing: '0.04em', marginBottom: 18 }}>
              <span style={{ color: ACCENT }}>&gt;</span> ml engineer &amp; data scientist <span style={{ color: '#6f756a' }}>·</span> builder of{' '}
              <a href="https://github.com/ianalloway/juryrig" target="_blank" rel="noopener noreferrer" className="font-jet link-code" style={{ color: CYAN }}>
                juryrig
              </a>
            </p>

            <h1 className="font-display" style={{ fontWeight: 700, fontSize: 'clamp(40px, 6.5vw, 76px)', lineHeight: 0.98, letterSpacing: '-0.03em', color: '#f4f6f1', marginBottom: 26 }}>
              LLM Evaluation Consulting
            </h1>

            <p style={{ fontSize: 'clamp(19px, 2.4vw, 25px)', lineHeight: 1.5, color: '#c4c9bd', maxWidth: 720 }}>
              Your LLM-as-judge pipeline is producing numbers. I make sure those numbers are{' '}
              <span style={{ color: ACCENT, fontWeight: 500 }}>trustworthy</span> — audited for bias, calibrated against reality, and wired into CI so regressions actually fail.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 38, marginBottom: 46 }}>
              <a
                href="mailto:ian@allowayllc.com?subject=LLM%20Evaluation%20Consulting"
                className="font-jet btn-glow"
                style={{ fontSize: 13.5, fontWeight: 500, color: '#0a0b0a', background: ACCENT, padding: '13px 24px', borderRadius: 8 }}
              >
                Let&apos;s talk →
              </a>
              <a
                href="#proof"
                className="font-jet btn-outline"
                style={{ fontSize: 13.5, color: '#d6dbcf', border: '1px solid rgba(255,255,255,0.13)', padding: '13px 22px', borderRadius: 8 }}
              >
                See the proof
              </a>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                maxWidth: 720,
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.012)',
              }}
            >
              {METRICS.map((m, i) => (
                <div key={m.label} style={{ padding: '18px 16px', borderRight: i < METRICS.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                  <div className="font-display" style={{ fontWeight: 600, fontSize: 24, color: ACCENT, lineHeight: 1 }}>{m.value}</div>
                  <div className="font-jet uppercase" style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', color: '#cdd2c5', marginTop: 8 }}>{m.label}</div>
                  <div className="font-jet" style={{ fontSize: 10, color: '#6f756a', marginTop: 3 }}>{m.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* ── 2. Problem ── */}
        <section id="problem" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.008)' }}>
          <div style={{ maxWidth: 1120, margin: '0 auto', padding: '80px 32px' }}>
            <Eyebrow>// the_problem</Eyebrow>
            <h2 className="font-display" style={{ fontWeight: 700, fontSize: 'clamp(30px,4.6vw,48px)', letterSpacing: '-0.025em', color: '#f4f6f1', maxWidth: 820, marginBottom: 20 }}>
              Your LLM eval pipeline is lying to you
            </h2>
            <p style={{ fontSize: 15.5, lineHeight: 1.65, color: '#9aa093', maxWidth: 680, marginBottom: 44 }}>
              LLM-as-judge is fast, cheap, and dangerously seductive. The scores look authoritative — but a judge that is biased, miscalibrated, or injectable will quietly corrupt every decision built on it.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
              {PROBLEMS.map((p) => (
                <div key={p.label} className="cap-cell" style={{ background: '#0c0e0c', padding: '26px 22px' }}>
                  <h3 className="font-display" style={{ fontWeight: 600, fontSize: 18, color: ACCENT, marginBottom: 10 }}>{p.label}</h3>
                  <p style={{ fontSize: 13.5, lineHeight: 1.6, color: '#9aa093' }}>{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 3. Services ── */}
        <section id="services" style={{ padding: '80px 32px' }}>
          <div style={{ maxWidth: 1120, margin: '0 auto' }}>
            <Eyebrow>// services</Eyebrow>
            <h2 className="font-display" style={{ fontWeight: 600, fontSize: 'clamp(30px,4.4vw,44px)', letterSpacing: '-0.025em', color: '#f4f6f1', maxWidth: 640, marginBottom: 44 }}>
              How I help teams ship evals they can trust
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
              {SERVICES.map((s) => (
                <div key={s.n} className="cap-cell" style={{ background: '#0c0e0c', padding: '28px 24px' }}>
                  <div className="font-jet" style={{ fontSize: 11, color: ACCENT, marginBottom: 18 }}>{s.n}</div>
                  <h3 className="font-display" style={{ fontWeight: 600, fontSize: 18, color: '#f4f6f1', marginBottom: 10 }}>{s.title}</h3>
                  <p style={{ fontSize: 13.5, lineHeight: 1.6, color: '#8b9085', marginBottom: 16 }}>{s.desc}</p>
                  <div className="font-jet" style={{ display: 'flex', flexWrap: 'wrap', gap: 5, fontSize: 10, color: '#6f756a' }}>
                    {s.tags.map((t, i) => (
                      <span key={t}>{t}{i < s.tags.length - 1 ? ' ·' : ''}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. Proof: juryrig ── */}
        <section id="proof" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.008)' }}>
          <div style={{ maxWidth: 1120, margin: '0 auto', padding: '80px 32px' }}>
            <Eyebrow>// proof</Eyebrow>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20, marginBottom: 32 }}>
              <div style={{ maxWidth: 640 }}>
                <h2 className="font-display" style={{ fontWeight: 600, fontSize: 'clamp(30px,4.4vw,44px)', letterSpacing: '-0.025em', color: '#f4f6f1', marginBottom: 14 }}>
                  juryrig — the work behind the consulting
                </h2>
                <p style={{ fontSize: 14.5, lineHeight: 1.65, color: '#9aa093' }}>
                  A zero-dependency toolkit that audits an LLM judge for bias and calibration before you trust automated evals. It is the exact lens I bring to your pipeline.
                </p>
              </div>
              <a
                href="https://github.com/ianalloway/juryrig"
                target="_blank"
                rel="noopener noreferrer"
                className="font-jet btn-outline"
                style={{ fontSize: 13, color: CYAN, border: `1px solid ${CYAN}44`, padding: '11px 18px', borderRadius: 8, whiteSpace: 'nowrap' }}
              >
                github.com/ianalloway/juryrig ↗
              </a>
            </div>

            <div
              style={{
                background: '#0c0e0c',
                borderRadius: 14,
                border: `1px solid ${CYAN}2e`,
                overflow: 'hidden',
              }}
            >
              {/* terminal header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#3a3f35' }} />
                  <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#3a3f35' }} />
                  <span style={{ width: 11, height: 11, borderRadius: '50%', background: CYAN }} />
                </div>
                <span className="font-jet" style={{ fontWeight: 700, fontSize: 15, color: '#f4f6f1' }}>juryrig audit</span>
                <span style={{ fontSize: 13, color: '#8b9085' }}>zero-dependency · stdlib only</span>
              </div>

              <div style={{ padding: '26px 22px' }}>
                {/* key metrics strip */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 28 }}>
                  {[
                    { num: '0', label: 'dependencies' },
                    { num: 'Position', label: 'bias audit' },
                    { num: 'Verbosity', label: 'bias audit' },
                    { num: 'Brier + ECE', label: 'calibration' },
                  ].map((m) => (
                    <div key={m.label} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 11, padding: '16px 18px', background: 'rgba(255,255,255,0.012)' }}>
                      <div className="font-display" style={{ fontWeight: 700, fontSize: 22, color: ACCENT, letterSpacing: '-0.02em' }}>{m.num}</div>
                      <div className="font-jet" style={{ fontSize: 11, color: '#8b9085', marginTop: 4 }}>{m.label}</div>
                    </div>
                  ))}
                </div>

                {/* audit checklist */}
                <h3 className="font-jet" style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
                  What the audit suite covers
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {AUDITS.map((a) => (
                    <div key={a.name} style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
                      <span className="font-jet" style={{ color: CYAN, flexShrink: 0 }}>›</span>
                      <span className="font-jet" style={{ fontSize: 13.5, fontWeight: 700, color: '#e8eae6', minWidth: 140 }}>{a.name}</span>
                      <span style={{ fontSize: 13.5, color: '#9aa093', lineHeight: 1.55 }}>{a.detail}</span>
                    </div>
                  ))}
                </div>

                <pre
                  className="font-jet"
                  style={{ background: '#060706', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, padding: '16px 18px', fontSize: 12.5, lineHeight: 1.7, color: '#c4f3d6', overflowX: 'auto', margin: '24px 0 0' }}
                >
{`git clone https://github.com/ianalloway/juryrig.git
cd juryrig
python3 examples/audit_demo.py`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. CTA ── */}
        <section id="contact" style={{ padding: '96px 32px' }}>
          <div
            style={{
              maxWidth: 820,
              margin: '0 auto',
              border: '1px solid rgba(91,228,155,0.22)',
              borderRadius: 18,
              background: 'radial-gradient(ellipse at top, rgba(91,228,155,0.06), transparent 70%)',
              padding: 'clamp(40px,6vw,72px) clamp(28px,5vw,64px)',
              textAlign: 'center',
            }}
          >
            <p className="font-jet" style={{ fontSize: 13, color: '#8b9085', marginBottom: 18 }}>
              <span style={{ color: ACCENT }}>&gt;</span> let&apos;s make your evals trustworthy
            </p>
            <h2 className="font-display" style={{ fontWeight: 700, fontSize: 'clamp(32px,5vw,52px)', letterSpacing: '-0.03em', color: '#f4f6f1', marginBottom: 18 }}>
              Let&apos;s talk
            </h2>
            <p style={{ fontSize: 16, color: '#9aa093', maxWidth: 520, margin: '0 auto 32px' }}>
              Audit, pipeline design, custom tooling, or team training. Tell me what your LLM-as-judge setup looks like and what you are worried about.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginBottom: 30 }}>
              <a href="mailto:ian@allowayllc.com?subject=LLM%20Evaluation%20Consulting" className="font-jet btn-glow" style={{ fontSize: 14, color: '#0a0b0a', background: ACCENT, padding: '14px 28px', borderRadius: 9 }}>
                ian@allowayllc.com
              </a>
              <a href="https://github.com/ianalloway/juryrig" target="_blank" rel="noopener noreferrer" className="font-jet btn-outline" style={{ fontSize: 14, color: '#d6dbcf', border: '1px solid rgba(255,255,255,0.13)', padding: '14px 26px', borderRadius: 9 }}>
                Review juryrig ↗
              </a>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
              {[
                ['GitHub', 'https://github.com/ianalloway'],
                ['LinkedIn', 'https://www.linkedin.com/in/ianit'],
                ['Portfolio', '/'],
              ].map(([label, href]) => (
                <a key={label} href={href} className="font-jet social-pill" style={{ fontSize: 12.5, color: '#9aa093', border: `1px solid ${HAIRLINE}`, borderRadius: 100, padding: '8px 16px' }}>
                  {label}
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className={shell} style={{ padding: '30px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: ACCENT }} />
              <span className="font-jet" style={{ fontSize: 12.5, color: '#8b9085' }}>ian.alloway · LLM evaluation consulting</span>
            </div>
            <span className="font-jet" style={{ fontSize: 11.5, color: '#8b9085' }}>© 2026 Alloway LLC · ianalloway.xyz</span>
          </div>
        </footer>
      </main>

      {/* Scoped hover styles for this page */}
      <style>{`
        .btn-glow { transition: box-shadow .2s; }
        .btn-glow:hover { box-shadow: 0 0 26px rgba(91,228,155,0.42); }
        .btn-outline { transition: border-color .2s, background .2s; }
        .btn-outline:hover { border-color: rgba(91,228,155,0.45) !important; background: rgba(91,228,155,0.05); }
        .cap-cell { transition: background .18s; }
        .cap-cell:hover { background: #101310 !important; }
        .link-code { transition: color .18s; }
        .link-code:hover { color: #5be49b !important; }
        .social-pill { transition: color .18s, border-color .18s; }
        .social-pill:hover { color: #5be49b !important; border-color: rgba(91,228,155,0.4) !important; }
      `}</style>
    </div>
  );
};

export default Consulting;
