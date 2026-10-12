import { useState } from "react";
import { Link } from "react-router-dom";
import ResearchShell from "@/components/ResearchShell";
import { CATEGORIES, type ExperimentCategory } from "@/lib/experimentCategories";
import { EXPERIMENTS, type Experiment } from "@/lib/experiments";

const START_HERE = ["/judge", "/kellysim", "/bandit", "/descent", "/mcmc", "/gp", "/hyperloglog"];

const COUNTS = new Map<ExperimentCategory, number>();
for (const e of EXPERIMENTS) COUNTS.set(e.category, (COUNTS.get(e.category) ?? 0) + 1);

function split(title: string) {
  const [name, ...rest] = title.split(" — ");
  return { name, tagline: rest.join(" — ") };
}

export default function Lab() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ExperimentCategory | "all">("all");

  const picks = START_HERE.map((p) => EXPERIMENTS.find((e) => e.path === p)).filter(
    (e): e is Experiment => Boolean(e)
  );

  // Every word has to appear somewhere, so "entropy compression" finds the coders.
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const filtered = EXPERIMENTS.filter((e) => {
    if (category !== "all" && e.category !== category) return false;
    const text = `${e.title} ${e.description}`.toLowerCase();
    return words.every((w) => text.includes(w));
  });

  const [lead, ...rest] = picks;

  return (
    <ResearchShell>
      <section className="rl-head">
        <p className="rd-section-label rd-mono">LAB / {EXPERIMENTS.length} EXPERIMENTS</p>
        <h1>
          The lab<span>.</span>
        </h1>
        <p className="rl-lede">
          Every experiment here runs in your browser and is written from scratch — no library doing the
          interesting part. If you&rsquo;re here for evaluation work, start with the judge audit. If you&rsquo;re
          here to poke at things, wander.
        </p>
      </section>

      {lead && (
        <section className="rl-start" aria-labelledby="start-h">
          <h2 id="start-h" className="rl-h2 rd-mono">
            START HERE
          </h2>
          <div className="rl-start-grid">
            <Link to={lead.path} className="rl-lead">
              <span className="rd-mono">FLAGSHIP · EVALUATION</span>
              <strong>{split(lead.title).name}</strong>
              <em>{split(lead.title).tagline}</em>
              <p>{lead.description}</p>
              <span className="rl-go rd-mono">Open the audit →</span>
            </Link>
            {rest.map((e) => {
              const { name, tagline } = split(e.title);
              return (
                <Link to={e.path} className="rl-pick" key={e.path}>
                  <strong>{name}</strong>
                  <em>{tagline}</em>
                  <span aria-hidden="true">→</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="rl-index" aria-labelledby="index-h">
        <h2 id="index-h" className="rl-h2 rd-mono">
          EVERYTHING
        </h2>
        <div className="rl-filters">
          <label className="rl-search">
            <span className="rd-mono">SEARCH</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="kelly, entropy, phase transition…"
            />
          </label>
          <div className="rl-chips rd-mono" role="group" aria-label="Filter by category">
            <button type="button" aria-pressed={category === "all"} onClick={() => setCategory("all")}>
              All <i>{EXPERIMENTS.length}</i>
            </button>
            {CATEGORIES.map((c) => (
              <button
                type="button"
                key={c.id}
                aria-pressed={category === c.id}
                onClick={() => setCategory(c.id)}
              >
                {c.label} <i>{COUNTS.get(c.id) ?? 0}</i>
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 && <p className="rl-empty">Nothing matches “{query}”.</p>}

        {CATEGORIES.map((c) => {
          const items = filtered.filter((e) => e.category === c.id);
          if (items.length === 0) return null;
          return (
            <div className="rl-group" key={c.id}>
              <div className="rl-group-head">
                <h3>{c.label}</h3>
                <p>{c.blurb}</p>
              </div>
              <ul>
                {items.map((e) => {
                  const { name, tagline } = split(e.title);
                  return (
                    <li key={e.path}>
                      <Link to={e.path}>
                        <strong>{name}</strong>
                        {tagline && <em>{tagline}</em>}
                        <p>{e.description}</p>
                        <span className="rd-mono" aria-hidden="true">
                          {e.path} →
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </section>
    </ResearchShell>
  );
}
