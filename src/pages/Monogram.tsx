import { useEffect, useRef, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-600.css";
import "../features/monogram/monogram.css";
import { initMonogramPage } from "../features/monogram/page";
import type { ModelKey } from "../features/monogram/scene";

const WORK: { name: string; type: string; href: string; model: ModelKey; desc: string }[] = [
  {
    name: "solvent",
    type: "agent economics",
    href: "https://github.com/ianalloway/solvent-agent",
    model: "solvent",
    desc: "A self-funding AI analyst that quotes work, collects payment, pays its own vendor bills and refuses jobs that cannot clear margin.",
  },
  {
    name: "ai advantage",
    type: "sports intelligence",
    href: "https://aiadvantagesports.com/",
    model: "advantage",
    desc: "A live sports decision desk: model-backed picks, Kelly sizing, portfolio risk and closing-line evaluation.",
  },
  {
    name: "juryrig",
    type: "model evaluation",
    href: "https://github.com/ianalloway/juryrig",
    model: "juryrig",
    desc: "A zero-dependency audit kit for LLM judges: position bias, verbosity bias, self-consistency, calibration and panel agreement.",
  },
  {
    name: "kelly-js",
    type: "open source",
    href: "https://github.com/ianalloway/kelly-js",
    model: "kelly",
    desc: "Kelly sizing, CLV tracking and bankroll stats. Zero dependencies.",
  },
  {
    name: "nba-ratings",
    type: "open source",
    href: "https://github.com/ianalloway/nba-ratings",
    model: "ratings",
    desc: "Elo and logistic win-probability helpers, published as nba-edge.",
  },
  {
    name: "evm-sentry",
    type: "open source",
    href: "https://github.com/ianalloway/evm-sentry",
    model: "sentry",
    desc: "On-chain anomaly and honeypot signal scanner for Base and Ethereum.",
  },
  {
    name: "sports-betting-ml",
    type: "open source",
    href: "https://github.com/ianalloway/sports-betting-ml",
    model: "training",
    desc: "The NBA/NFL training stack: XGBoost, ensembles and an evaluation harness.",
  },
];

const SKETCHES = [
  { id: "torus", tone: "var(--text)", title: "torus.z-buffer", note: "depth, one char at a time" },
  { id: "calibration", tone: "var(--accent)", title: "calibration.trace", note: "predicted vs observed" },
  { id: "kelly", tone: "var(--secondary)", title: "kelly.growth", note: "log-growth by bet size" },
  { id: "descent", tone: "var(--text)", title: "gradient.descent", note: "a step at a time, downhill" },
  { id: "rain", tone: "var(--accent)", title: "matrix.rain", note: "the obligatory one" },
  { id: "sampler", tone: "var(--secondary)", title: "metropolis.sampler", note: "a histogram finds two modes" },
];

const TIMELINE = [
  ["now ", "M.S. Artificial Intelligence at USF. Building juryrig in public."],
  ["2026", "B.S. at USF. Started grading frontier models for AI labs' eval programs."],
  ["2025", "Published open-source agent skills, evaluation tools and nba-edge."],
  ["2024", "Audited multichain data at Omniichain; turned sports modeling into a decision product."],
  ["2020", "Started Alloway LLC and began shipping ML and analytics for clients."],
];

const EXTERNAL = { target: "_blank", rel: "noopener" } as const;

export default function Monogram() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Same opt-out the redesigned homepage uses for the CRT scanline shell.
    document.body.classList.add("home-redesign");
    const dispose = initMonogramPage(root.current!);
    return () => {
      dispose();
      document.body.classList.remove("home-redesign");
    };
  }, []);

  return (
    <div className="monogram" data-zone="hero" ref={root}>
      <a className="skip-link" href="#work">Skip to work</a>
      <canvas id="ascii" aria-hidden="true" />

      <header className="topbar">
        <p className="prompt">
          <span aria-hidden="true">&gt; </span>ian_alloway<span className="cursor" aria-hidden="true" />
        </p>
        <p className="badge">
          <span className="dot" aria-hidden="true" />open to AI engineering &amp; evaluation roles
        </p>
      </header>

      <main>
        <section className="hero" id="top" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="path">~/ai-engineer</p>
            <h1 id="hero-title">Ian Alloway.</h1>
            <p className="bio">
              I build systems that make the right call when the data gets noisy. Applied ML, agent economics, sports
              models and evaluation tooling — shipped in public, measured in production.
            </p>
            <nav className="commands" aria-label="Sections">
              {["work", "lab", "about", "contact"].map((id, i) => (
                <a key={id} href={`#${id}`}>
                  <span aria-hidden="true">[{i + 1}]</span> {id}
                </a>
              ))}
            </nav>
          </div>
          <p className="status" id="status" aria-hidden="true">fps -- · cells --x-- · glyphs 10</p>
        </section>

        <section className="work" id="work" aria-labelledby="work-title">
          <div className="work-inner">
            <p className="label reveal">01 / work</p>
            <h2 id="work-title" className="reveal">Seven systems. One obsession: proof.</h2>
            <p className="lede reveal">
              The interesting part starts after the demo — when the model is wrong, the incentives get weird, or the
              evaluation disagrees with itself.
            </p>
            <ol className="rows">
              {WORK.map((item, i) => (
                <li key={item.name} className="reveal">
                  <a href={item.href} {...EXTERNAL} data-model={item.model}>
                    <span className="n">{String(i + 1).padStart(2, "0")}</span>
                    <span className="name">{item.name}</span>
                    <span className="type">{item.type}</span>
                    <span className="arrow" aria-hidden="true">→</span>
                    <span className="desc">{item.desc}</span>
                  </a>
                </li>
              ))}
            </ol>
            <p className="more reveal"><Link to="/toolkit">open the full toolkit →</Link></p>
          </div>
        </section>

        <section className="lab" id="lab" aria-labelledby="lab-title">
          <div className="wrap">
            <p className="label reveal">02 / lab</p>
            <h2 id="lab-title" className="reveal">From scratch, in the browser.</h2>
            <p className="lede reveal">
              Six text-mode sketches, running live. The full lab has many more interactive experiments — a live
              LLM-judge audit, Kelly and closing-line tools, samplers and optimisers you can watch converge.
            </p>
            <div className="lab-grid">
              {SKETCHES.map((sketch) => (
                <figure key={sketch.id} className="panel reveal" style={{ "--tone": sketch.tone } as CSSProperties}>
                  <pre data-sketch={sketch.id} aria-hidden="true" />
                  <figcaption><span>{sketch.title}</span><span>{sketch.note}</span></figcaption>
                </figure>
              ))}
            </div>
            <p className="more reveal"><Link to="/lab">enter the lab →</Link></p>
          </div>
        </section>

        <section className="about" id="about" aria-labelledby="about-title">
          <div className="wrap about-grid">
            <div>
              <p className="label reveal">03 / about</p>
              <h2 id="about-title" className="reveal">Builder by habit. Skeptic by training.</h2>
              <p className="typed" id="typed">
                I like models with receipts: calibration curves, cost constraints, failure cases, reproducible runs,
                and a human who can still understand what happened. Right now that means an M.S. in Artificial
                Intelligence at USF, grading frontier models for AI labs' eval programs, and building juryrig in
                public.
              </p>
              <button className="skip" id="skip" type="button" hidden>skip ↵</button>
            </div>
            <div className="log reveal" aria-label="Timeline">
              <p className="log-head">$ git log --oneline career</p>
              <ol>
                {TIMELINE.map(([when, what]) => (
                  <li key={when}><span className="hash">{when}</span><span>{what}</span></li>
                ))}
              </ol>
              <p className="more">
                <a href="https://www.linkedin.com/in/ianit" {...EXTERNAL}>full experience on linkedin →</a>
              </p>
            </div>
          </div>
        </section>

        <section className="contact" id="contact" aria-labelledby="contact-title">
          <div className="wrap">
            <p className="label reveal">04 / contact</p>
            <h2 id="contact-title" className="reveal">Have a probability hiding inside it?</h2>
            <p className="lede reveal">
              I'm interested in ML engineering, data science, evaluation, and the odd ambitious system that needs all
              three.
            </p>
            <div className="terminal reveal">
              <div id="term-output" className="term-output" role="log" aria-live="polite">
                <p>type 'help' to list commands, or use the links below.</p>
              </div>
              <form id="term-form" className="term-form" autoComplete="off">
                <label htmlFor="term-input">ian@alloway:~$</label>
                <input id="term-input" type="text" spellCheck={false} autoCapitalize="off" aria-describedby="term-hint" />
              </form>
              <div className="term-buttons" aria-label="Commands">
                {["email", "cv", "notes", "help"].map((command) => (
                  <button key={command} type="button" data-command={command}>{command}</button>
                ))}
              </div>
              <p id="term-hint" className="visually-hidden">
                Commands: help, email, cv, github, linkedin, notes, substack, x, clear.
              </p>
            </div>
            <ul className="links reveal">
              <li><a href="mailto:ian@allowayllc.com">ian@allowayllc.com</a></li>
              <li><a href="/Ian_Alloway_Resume_CV.pdf" {...EXTERNAL}>résumé ↓</a></li>
              <li><a href="https://github.com/ianalloway" {...EXTERNAL}>github ↗</a></li>
              <li><a href="https://www.linkedin.com/in/ianit" {...EXTERNAL}>linkedin ↗</a></li>
              <li><a href="https://allowayai.substack.com/" {...EXTERNAL}>substack ↗</a></li>
              <li><a href="https://x.com/ianallowayxyz" {...EXTERNAL}>x ↗</a></li>
            </ul>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>ian alloway · fairmont, wv / remote · 2026</p>
        <p><Link to="/">← ianalloway.xyz</Link></p>
      </footer>
    </div>
  );
}
