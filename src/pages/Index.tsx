import { useEffect, type PointerEvent as ReactPointerEvent } from "react";
import Newsletter from "@/components/Newsletter";

type ProjectVisual = "solvent" | "sports" | "juryrig";

type Project = {
  number: string;
  label: string;
  title: string;
  description: string;
  proof: string;
  metric: string;
  metricLabel: string;
  visual: ProjectVisual;
  code: string;
  live?: string;
  liveLabel?: string;
};

const PROJECTS: Project[] = [
  {
    number: "01",
    label: "Agent economics",
    title: "SOLVENT",
    description:
      "A self-funding AI analyst that quotes work, collects payment, fulfills with Nemotron, pays its own vendor bills, and refuses jobs that cannot clear margin.",
    proof: "Guardrailed cash flow, Stripe settlement, vendor accounting, and a no-key demo.",
    metric: "P&L",
    metricLabel: "is a first-class constraint",
    visual: "solvent",
    code: "https://github.com/ianalloway/solvent-agent",
    live: "https://allowayai.substack.com/p/case-study-solvent-streamlining-agent",
    liveLabel: "Read the case study",
  },
  {
    number: "02",
    label: "Sports intelligence",
    title: "The NBA decision stack",
    description:
      "Ratings, win probabilities, calibration, closing-line evaluation, and Kelly sizing—built as one inspectable path from raw games to a decision.",
    proof: "XGBoost models, nba-edge on PyPI, and an evaluation dashboard built to expose failure.",
    metric: "68.3%",
    metricLabel: "recorded model accuracy",
    visual: "sports",
    code: "https://github.com/ianalloway/sports-betting-ml",
    live: "https://aiadvantagesports.com",
    liveLabel: "Open AI Advantage",
  },
  {
    number: "03",
    label: "Model evaluation",
    title: "juryrig",
    description:
      "A zero-dependency audit kit for LLM judges. It measures position bias, verbosity bias, self-consistency, calibration, and panel agreement before the scores ship.",
    proof: "Small enough to read in one sitting; sharp enough to fail an eval pipeline on purpose.",
    metric: "0",
    metricLabel: "runtime dependencies",
    visual: "juryrig",
    code: "https://github.com/ianalloway/juryrig",
  },
];

const OPEN_SOURCE = [
  {
    name: "kelly-js",
    kind: "TypeScript",
    description: "Kelly sizing, CLV tracking, bankroll stats. Zero dependencies.",
    href: "https://github.com/ianalloway/kelly-js",
  },
  {
    name: "nba-ratings",
    kind: "Python",
    description: "Elo and logistic win-probability helpers, published as nba-edge.",
    href: "https://github.com/ianalloway/nba-ratings",
  },
  {
    name: "matrix-rain",
    kind: "React",
    description: "A retina-aware, reduced-motion-friendly digital rain component.",
    href: "https://github.com/ianalloway/matrix-rain",
  },
  {
    name: "onchain-risk-scanner",
    kind: "Python",
    description: "Read-only proxy, upgrade, and contract-risk timelines.",
    href: "https://github.com/ianalloway/onchain-risk-scanner",
  },
  {
    name: "repo-health",
    kind: "CLI",
    description: "Scores maintenance signals, docs, licensing, CI, and staleness.",
    href: "https://github.com/ianalloway/oss-archive/tree/archive/repo-health",
  },
];

const NOTES = [
  {
    type: "Field note · agent economics",
    title: "I gave an AI agent a Stripe key and walked away",
    href: "https://allowayai.substack.com/p/i-gave-an-ai-agent-a-stripe-key-and-walked-away-heres-what-it-built",
  },
  {
    type: "Essay · evaluation",
    title: "Audit your LLM judges before you trust them",
    href: "https://allowayai.substack.com/p/audit-your-llm-judges-before-you-trust-them",
  },
  {
    type: "Reflection · memory",
    title: "The ghost in the machine needs memory, not just a prompt",
    href: "https://allowayai.substack.com/p/the-ghost-in-the-machine-why-your-ai-needs-a-memory-not-just-a-prompt",
  },
];

const PRACTICE = [
  ["2020", "Audited data and built AI systems for multichain analytics."],
  ["2023", "Founded Alloway LLC and started shipping production ML for clients."],
  ["2024", "Turned sports modeling into an end-to-end decision product."],
  ["2025", "Published open-source agent skills, evaluation tools, and nba-edge."],
  ["Now", "M.S. Artificial Intelligence at USF. Building in public."],
];

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

function HeroPlot() {
  return (
    <div className="rd-hero-plot" aria-label="Abstract model calibration plot">
      <div className="rd-plot-meta rd-mono">
        <span>RUN / 0724</span>
        <span>CALIBRATION TRACE</span>
      </div>
      <svg viewBox="0 0 640 560" role="img" aria-label="Calibration curve rising across a coordinate field">
        <defs>
          <linearGradient id="plot-fade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#d7ff5f" stopOpacity="0" />
            <stop offset="35%" stopColor="#d7ff5f" stopOpacity=".78" />
            <stop offset="100%" stopColor="#d7ff5f" stopOpacity="1" />
          </linearGradient>
        </defs>
        <g className="rd-grid-lines">
          {[64, 160, 256, 352, 448, 544].map((x) => (
            <line key={`x-${x}`} x1={x} y1="40" x2={x} y2="512" />
          ))}
          {[64, 152, 240, 328, 416, 504].map((y) => (
            <line key={`y-${y}`} x1="40" y1={y} x2="600" y2={y} />
          ))}
        </g>
        <path className="rd-plot-reference" d="M64 470 L558 84" />
        <path
          className="rd-plot-line"
          pathLength="1"
          d="M64 474 C118 459 152 419 196 414 C241 408 256 340 315 350 C369 360 391 252 443 264 C498 276 510 154 559 112"
        />
        <g className="rd-plot-points">
          {[
            [64, 474],
            [196, 414],
            [315, 350],
            [443, 264],
            [559, 112],
          ].map(([x, y], index) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={index === 4 ? 7 : 4} />
          ))}
        </g>
        <circle className="rd-orbit" cx="443" cy="264" r="54" />
        <path className="rd-plot-signal" d="M443 264 L542 264 L574 236" />
      </svg>
      <div className="rd-plot-readout">
        <span className="rd-mono">MODEL / NBA</span>
        <strong>68.3</strong>
        <span className="rd-mono">OBSERVED ACCURACY</span>
      </div>
      <div className="rd-plot-caption rd-mono">PREDICTED PROBABILITY →</div>
    </div>
  );
}

function ProjectGraphic({ type }: { type: ProjectVisual }) {
  if (type === "solvent") {
    return (
      <div className="rd-project-graphic rd-project-graphic--solvent" aria-hidden="true">
        <div className="rd-flow-node">
          <span className="rd-mono">01</span>
          <strong>Quote</strong>
          <small>margin check</small>
        </div>
        <span className="rd-flow-line" />
        <div className="rd-flow-node rd-flow-node--active">
          <span className="rd-mono">02</span>
          <strong>Fulfill</strong>
          <small>Nemotron</small>
        </div>
        <span className="rd-flow-line" />
        <div className="rd-flow-node">
          <span className="rd-mono">03</span>
          <strong>Settle</strong>
          <small>book P&amp;L</small>
        </div>
      </div>
    );
  }

  if (type === "sports") {
    return (
      <div className="rd-project-graphic rd-project-graphic--sports" aria-hidden="true">
        <div className="rd-mini-axis" />
        <svg viewBox="0 0 560 230">
          <path className="rd-mini-baseline" d="M34 194 L520 32" />
          <path
            className="rd-mini-curve"
            pathLength="1"
            d="M34 200 C92 197 112 158 167 165 C226 172 252 105 307 120 C365 136 410 61 520 45"
          />
          {[["34", "200"], ["167", "165"], ["307", "120"], ["520", "45"]].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="5" />
          ))}
        </svg>
        <span className="rd-mono rd-mini-label">CALIBRATION / HOLDOUT</span>
      </div>
    );
  }

  return (
    <div className="rd-project-graphic rd-project-graphic--juryrig" aria-hidden="true">
      {[
        ["POSITION", "42%"],
        ["VERBOSITY", "61%"],
        ["SELF / CONSISTENCY", "84%"],
        ["PANEL / AGREEMENT", "73%"],
      ].map(([label, width]) => (
        <div className="rd-audit-row" key={label}>
          <span className="rd-mono">{label}</span>
          <i>
            <b style={{ width }} />
          </i>
          <em>{width}</em>
        </div>
      ))}
    </div>
  );
}

function useReveal() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      nodes.forEach((node) => node.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -7% 0px" },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);
}

export default function Index() {
  useReveal();

  useEffect(() => {
    document.body.classList.add("home-redesign");
    return () => document.body.classList.remove("home-redesign");
  }, []);

  const movePlot = (event: ReactPointerEvent<HTMLElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    event.currentTarget.style.setProperty("--pointer-x", x.toFixed(3));
    event.currentTarget.style.setProperty("--pointer-y", y.toFixed(3));
  };

  return (
    <div className="rd-site">
      <a className="rd-skip rd-mono" href="#work">
        Skip to selected work
      </a>

      <nav className="rd-nav" aria-label="Primary navigation">
        <a className="rd-wordmark" href="#top" aria-label="Ian Alloway, home">
          <span className="rd-wordmark-mark">IA</span>
          <span>Ian Alloway</span>
        </a>
        <div className="rd-nav-links rd-mono">
          <a href="#work">Work</a>
          <a href="#source">Source</a>
          <a href="#writing">Writing</a>
        </div>
        <a className="rd-nav-cta rd-mono" href="mailto:ian@allowayllc.com">
          Start a conversation <Arrow />
        </a>
      </nav>

      <main id="top">
        <header className="rd-hero" onPointerMove={movePlot}>
          <div className="rd-hero-copy">
            <div className="rd-availability rd-mono">
              <span />
              Open to ML, data &amp; AI roles
            </div>
            <p className="rd-hero-kicker rd-mono">ML ENGINEER · DATA SCIENTIST · USF M.S. AI</p>
            <h1>
              Ian
              <br />
              Alloway<span>.</span>
            </h1>
            <p className="rd-hero-statement">
              I build systems that make the right call when the data gets noisy.
            </p>
            <p className="rd-hero-detail">
              Applied ML, agent economics, sports models, and evaluation tooling—shipped in public
              and measured in production.
            </p>
            <div className="rd-hero-actions">
              <a className="rd-primary-action rd-mono" href="#work">
                Explore the experiments <span aria-hidden="true">↓</span>
              </a>
              <a
                className="rd-text-action rd-mono"
                href="https://github.com/ianalloway"
                target="_blank"
                rel="noreferrer"
              >
                GitHub <Arrow />
              </a>
              <a className="rd-text-action rd-mono" href="/Ian_Alloway_Resume_CV.pdf" download>
                Résumé ↓
              </a>
            </div>
          </div>
          <HeroPlot />
          <div className="rd-hero-index rd-mono">
            <span>27.9506° N</span>
            <span>82.4572° W</span>
            <span>BUILD / TEST / MEASURE</span>
          </div>
        </header>

        <div className="rd-signal-strip rd-mono" aria-label="Current areas of focus">
          <span>Current signal</span>
          <i />
          <span>Agent evaluation</span>
          <i />
          <span>Sports intelligence</span>
          <i />
          <span>Decision systems</span>
          <i />
          <span>Open source</span>
        </div>

        <section className="rd-section rd-work" id="work">
          <div className="rd-section-intro" data-reveal>
            <p className="rd-section-label rd-mono">01 / SELECTED WORK</p>
            <h2>Three systems.<br />One obsession: proof.</h2>
            <p>
              The interesting part starts after the demo—when the model is wrong, the incentives
              get weird, or the evaluation disagrees with itself.
            </p>
          </div>

          <div className="rd-case-list">
            {PROJECTS.map((project) => (
              <article className="rd-case" key={project.title} data-reveal>
                <div className="rd-case-heading">
                  <span className="rd-case-number rd-mono">{project.number}</span>
                  <p className="rd-mono">{project.label}</p>
                  <h3>{project.title}</h3>
                </div>
                <ProjectGraphic type={project.visual} />
                <div className="rd-case-copy">
                  <p>{project.description}</p>
                  <small>{project.proof}</small>
                  <div className="rd-case-links rd-mono">
                    <a href={project.code} target="_blank" rel="noreferrer">
                      Source <Arrow />
                    </a>
                    {project.live && (
                      <a href={project.live} target="_blank" rel="noreferrer">
                        {project.liveLabel} <Arrow />
                      </a>
                    )}
                  </div>
                </div>
                <div className="rd-case-metric">
                  <strong>{project.metric}</strong>
                  <span className="rd-mono">{project.metricLabel}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rd-section rd-source" id="source">
          <div className="rd-section-intro rd-section-intro--compact" data-reveal>
            <p className="rd-section-label rd-mono">02 / OPEN SOURCE</p>
            <h2>Useful before impressive.</h2>
            <p>
              Small tools with legible code, direct interfaces, and enough documentation for
              someone else to run.
            </p>
          </div>
          <div className="rd-repo-index" data-reveal>
            {OPEN_SOURCE.map((repo, index) => (
              <a href={repo.href} target="_blank" rel="noreferrer" key={repo.name}>
                <span className="rd-repo-count rd-mono">{String(index + 1).padStart(2, "0")}</span>
                <strong>{repo.name}</strong>
                <span className="rd-repo-kind rd-mono">{repo.kind}</span>
                <p>{repo.description}</p>
                <Arrow />
              </a>
            ))}
          </div>
          <a className="rd-index-link rd-mono" href="/toolkit">
            Open the full toolkit <span aria-hidden="true">→</span>
          </a>
        </section>

        <section className="rd-practice" id="about">
          <div className="rd-practice-statement" data-reveal>
            <p className="rd-section-label rd-mono">03 / PRACTICE</p>
            <h2>Builder by habit.<br />Skeptic by training.</h2>
            <p>
              I like models with receipts: calibration curves, cost constraints, failure cases,
              reproducible runs, and a human who can still understand what happened.
            </p>
            <a
              className="rd-text-action rd-mono"
              href="https://www.linkedin.com/in/ianit"
              target="_blank"
              rel="noreferrer"
            >
              Full experience on LinkedIn <Arrow />
            </a>
          </div>
          <ol className="rd-practice-log" data-reveal>
            {PRACTICE.map(([year, text]) => (
              <li key={`${year}-${text}`}>
                <span className="rd-mono">{year}</span>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="rd-section rd-writing" id="writing">
          <div className="rd-section-intro rd-section-intro--compact" data-reveal>
            <p className="rd-section-label rd-mono">04 / FIELD NOTES</p>
            <h2>Thinking in public.</h2>
            <p>
              Notes on the edge cases, wrong turns, and design decisions that do not fit in a
              README.
            </p>
          </div>
          <div className="rd-notes" data-reveal>
            {NOTES.map((note) => (
              <a href={note.href} target="_blank" rel="noreferrer" key={note.title}>
                <span className="rd-mono">{note.type}</span>
                <h3>{note.title}</h3>
                <Arrow />
              </a>
            ))}
          </div>
          <Newsletter />
        </section>

        <section className="rd-contact" id="contact">
          <div data-reveal>
            <p className="rd-mono">AVAILABLE FOR THE RIGHT PROBLEM</p>
            <h2>Have a probability<br />hiding inside it?</h2>
            <p>
              I’m interested in ML engineering, data science, evaluation, and the odd ambitious
              system that needs all three.
            </p>
            <a className="rd-contact-link rd-mono" href="mailto:ian@allowayllc.com">
              ian@allowayllc.com <span aria-hidden="true">↗</span>
            </a>
          </div>
          <div className="rd-contact-orbit" aria-hidden="true">
            <span>IAN ALLOWAY · TAMPA / REMOTE · 2026 ·</span>
          </div>
        </section>
      </main>

      <footer className="rd-footer rd-mono">
        <span>© 2026 Alloway LLC</span>
        <div>
          <a href="https://github.com/ianalloway" target="_blank" rel="noreferrer">GitHub</a>
          <a href="https://x.com/ianallowayxyz" target="_blank" rel="noreferrer">X</a>
          <a href="https://allowayai.substack.com" target="_blank" rel="noreferrer">Substack</a>
        </div>
        <span>Designed as a living research log.</span>
      </footer>
    </div>
  );
}
