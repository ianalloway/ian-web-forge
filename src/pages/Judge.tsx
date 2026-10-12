import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ResearchShell from "@/components/ResearchShell";
import {
  DEFAULT_MATCHUP,
  PRESETS,
  type AuditResult,
  type JudgeConfig,
  type MatchupConfig,
  runAudit,
} from "../features/judge/audit";

const pct = (v: number, digits = 1) => `${(v * 100).toFixed(digits)}%`;
const pts = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(v * 100).toFixed(1)}`;

export default function Judge() {
  const [presetId, setPresetId] = useState("typical");
  const [judge, setJudge] = useState<JudgeConfig>(PRESETS[0].judge);
  const [matchup, setMatchup] = useState<MatchupConfig>(DEFAULT_MATCHUP);

  const result = useMemo(() => runAudit(judge, matchup), [judge, matchup]);
  const naive = result.estimates[0].rate;
  const drift = naive - result.truth;
  const flags = result.audits.filter((a) => a.status === "flag").length;

  const setJ = (key: keyof JudgeConfig) => (v: number) => {
    setPresetId("");
    setJudge((j) => ({ ...j, [key]: v }));
  };
  const setM = <K extends keyof MatchupConfig>(key: K) => (v: MatchupConfig[K]) =>
    setMatchup((m) => ({ ...m, [key]: v }));

  return (
    <ResearchShell>
      <section className="rj-head">
        <p className="rd-section-label rd-mono">LAB / EVALUATION · JURYRIG, INTERACTIVE</p>
        <h1>
          Audit the judge<span>.</span>
        </h1>
        <p className="rj-lede">
          A candidate model and a baseline answer the same {matchup.prompts} prompts, and an LLM judge picks
          the winner of each pair. Here the ground truth is known, so you can watch the leaderboard number
          drift away from it — and see which of juryrig&rsquo;s audits catches which drift.
        </p>
      </section>

      <section className="rj-verdict" aria-live="polite">
        <div>
          <span className="rd-mono">LEADERBOARD SAYS</span>
          <strong>{pct(naive)}</strong>
          <small className="rd-mono">candidate win rate, one judge call per prompt</small>
        </div>
        <div>
          <span className="rd-mono">GROUND TRUTH</span>
          <strong className="rj-truth">{pct(result.truth)}</strong>
          <small className="rd-mono">share of prompts where the candidate is actually better</small>
        </div>
        <div>
          <span className="rd-mono">THE JUDGE&rsquo;S CONTRIBUTION</span>
          <strong className={Math.abs(drift) > 0.03 ? "rj-bad" : "rj-good"}>{pts(drift)} pts</strong>
          <small className="rd-mono">
            {flags === 0 ? "no audit flagged" : `${flags} of ${result.audits.length} audits flagged`}
          </small>
        </div>
      </section>

      <div className="rj-grid">
        <aside className="rj-controls" aria-label="Simulation controls">
          <fieldset>
            <legend className="rd-mono">JUDGE</legend>
            <div className="rj-presets">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`rd-mono${p.id === presetId ? " is-active" : ""}`}
                  aria-pressed={p.id === presetId}
                  title={p.note}
                  onClick={() => {
                    setPresetId(p.id);
                    setJudge(p.judge);
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <p className="rj-preset-note">
              {PRESETS.find((p) => p.id === presetId)?.note ?? "Custom judge."}
            </p>
            <Slider label="Reads the answers" hint="weight on true quality" min={0} max={3} step={0.05} value={judge.sharpness} onChange={setJ("sharpness")} />
            <Slider label="Position bias" hint="push toward slot 1" min={-2} max={2} step={0.05} value={judge.positionBias} onChange={setJ("positionBias")} />
            <Slider label="Verbosity bias" hint="push per log length ratio" min={-1} max={3} step={0.05} value={judge.verbosityBias} onChange={setJ("verbosityBias")} />
            <Slider label="Noise" hint="per-call randomness" min={0} max={2.5} step={0.05} value={judge.noise} onChange={setJ("noise")} />
            <Slider label="Overconfidence" hint="scale on stated confidence" min={0.3} max={4} step={0.05} value={judge.overconfidence} onChange={setJ("overconfidence")} />
          </fieldset>

          <fieldset>
            <legend className="rd-mono">MATCHUP</legend>
            <Slider label="True quality gap" hint="candidate advantage, in SDs" min={-0.6} max={0.8} step={0.05} value={matchup.qualityGap} onChange={setM("qualityGap")} />
            <Slider label="Candidate length" hint="× baseline, on average" min={0.5} max={3} step={0.05} value={matchup.lengthRatio} onChange={setM("lengthRatio")} fmt={(v) => `${v.toFixed(2)}×`} />
            <Slider label="Prompts" hint="sample size" min={50} max={2000} step={50} value={matchup.prompts} onChange={setM("prompts")} fmt={(v) => `${v}`} />
            <label className="rj-toggle">
              <input
                type="checkbox"
                checked={matchup.candidateFirst}
                onChange={(e) => setM("candidateFirst")(e.target.checked)}
              />
              <span>Naive pipeline always shows the candidate first</span>
            </label>
            <button
              type="button"
              className="rj-reseed rd-mono"
              onClick={() => setM("seed")((matchup.seed * 1103515245 + 12345) >>> 0)}
            >
              ↻ Draw new prompts
            </button>
          </fieldset>
        </aside>

        <div className="rj-results">
          <section aria-labelledby="estimates-h">
            <h2 id="estimates-h" className="rj-h2">
              Three ways to read the same judge
            </h2>
            <EstimateChart result={result} />
          </section>

          <section aria-labelledby="audits-h">
            <h2 id="audits-h" className="rj-h2">
              The audit battery
            </h2>
            <div className="rj-audits" role="table" aria-label="Audit results">
              {result.audits.map((a) => (
                <div className="rj-audit" role="row" key={a.id}>
                  <span role="cell" className={`rj-chip rd-mono rj-chip--${a.status}`}>
                    {a.status === "flag" ? "FLAG" : "PASS"}
                  </span>
                  <strong role="cell">{a.label}</strong>
                  <span role="cell" className="rj-audit-value rd-mono">
                    {a.display}
                  </span>
                  <span role="cell" className="rj-audit-threshold rd-mono">
                    {a.threshold}
                  </span>
                  <p role="cell">{a.note}</p>
                </div>
              ))}
            </div>
            <p className="rj-footnote">
              Thresholds for order flips, slot skew, padding lift and κ are juryrig&rsquo;s defaults. Single-call
              accuracy against ground truth: <b>{pct(result.accuracy)}</b>. The longer response is truly better{" "}
              {pct(result.longerTrulyBetter, 0)} of the time; the judge picks it {pct(result.longerJudgedBetter, 0)}.
            </p>
          </section>

          <section aria-labelledby="calibration-h" className="rj-split">
            <div>
              <h2 id="calibration-h" className="rj-h2">
                Does it know when it&rsquo;s right?
              </h2>
              <p className="rj-body">
                Each verdict comes with a stated confidence. Bars show how often verdicts in each confidence band
                were actually correct; the diagonal is where an honest judge would land. Turn up overconfidence and
                watch the bars fall below the line.
              </p>
            </div>
            <ReliabilityChart result={result} />
          </section>
        </div>
      </div>

      <section className="rj-code">
        <div>
          <p className="rd-section-label rd-mono">RUN IT ON YOUR OWN JUDGE</p>
          <h2>Same battery, real model.</h2>
          <p className="rj-body">
            This page simulates the judge so the ground truth is visible. juryrig runs the same audits against a
            real one — pass it your judge and a handful of (prompt, good, weak) cases and it fails the pipeline
            before a biased score ships.
          </p>
          <div className="rj-links rd-mono">
            <a href="https://github.com/ianalloway/juryrig" target="_blank" rel="noreferrer">
              juryrig on GitHub ↗
            </a>
            <a href="https://allowayai.substack.com/p/audit-your-llm-judges-before-you" target="_blank" rel="noreferrer">
              Read the essay ↗
            </a>
            <Link to="/lab">Back to the lab →</Link>
          </div>
        </div>
        <pre className="rd-mono" aria-label="juryrig example">
          <code>{`pip install "juryrig==0.3.0"

from juryrig import audit_suite

report = audit_suite(my_judge, cases, rubric)
print(report.summary())
assert not report.flagged, report.failures`}</code>
        </pre>
      </section>

      <section className="rj-model">
        <p className="rd-mono">
          MODEL · judge prefers slot 1 when sharpness·(q₁ − q₂) + position + verbosity·ln(len₁/len₂) + noise·ε &gt; 0 ·
          quality and length are drawn independently, so every link between them is the judge&rsquo;s · stated
          confidence = σ(overconfidence·|z|) · seeded, so a setting always reproduces the same run
        </p>
      </section>
    </ResearchShell>
  );
}

function Slider({
  label,
  hint,
  min,
  max,
  step,
  value,
  onChange,
  fmt = (v) => v.toFixed(2),
}: {
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  fmt?: (v: number) => string;
}) {
  return (
    <label className="rj-slider">
      <span className="rj-slider-top">
        <span>{label}</span>
        <output className="rd-mono">{fmt(value)}</output>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <small className="rd-mono">{hint}</small>
    </label>
  );
}

function EstimateChart({ result }: { result: AuditResult }) {
  const rows = [
    { label: "Ground truth", note: "what a perfect judge would report", rate: result.truth, margin: null as number | null, truth: true },
    ...result.estimates.map((e) => ({ ...e, truth: false })),
  ];
  const lo = 0.2;
  const hi = 1;
  const x = (v: number) => `${((Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * 100}%`;

  return (
    <div className="rj-estimates">
      <div className="rj-axis rd-mono" aria-hidden="true">
        {[0.2, 0.4, 0.5, 0.6, 0.8, 1].map((t) => (
          <span key={t} style={{ left: x(t) }}>
            {Math.round(t * 100)}
          </span>
        ))}
      </div>
      {rows.map((r) => {
        const off = r.rate - result.truth;
        return (
          <div className={`rj-est${r.truth ? " rj-est--truth" : ""}`} key={r.label}>
            <div className="rj-est-label">
              <strong>{r.label}</strong>
              <small>{r.note}</small>
            </div>
            <div className="rj-est-track">
              <span className="rj-est-truthline" style={{ left: x(result.truth) }} aria-hidden="true" />
              <span className="rj-est-half" style={{ left: x(0.5) }} aria-hidden="true" />
              <span className="rj-est-bar" style={{ width: x(r.rate) }} />
              {r.margin !== null && (
                <span
                  className="rj-est-ci"
                  style={{ left: x(r.rate - r.margin), width: `calc(${x(r.rate + r.margin)} - ${x(r.rate - r.margin)})` }}
                  aria-hidden="true"
                />
              )}
            </div>
            <div className="rj-est-value rd-mono">
              {pct(r.rate)}
              {!r.truth && <em className={Math.abs(off) > 0.03 ? "rj-bad" : "rj-good"}>{pts(off)}</em>}
            </div>
          </div>
        );
      })}
      <p className="rj-footnote">
        Swapping orders cancels position bias but not length bias — a judge that loves long answers loves them in
        both slots. Controlling for the length ratio removes it. The length-controlled read sits slightly toward 50%
        even for a fair judge, because judge noise shrinks every effect it measures.
      </p>
    </div>
  );
}

function ReliabilityChart({ result }: { result: AuditResult }) {
  const W = 320;
  const H = 240;
  const pad = 34;
  const sx = (v: number) => pad + ((v - 0.5) / 0.5) * (W - pad * 2);
  const sy = (v: number) => H - pad - v * (H - pad * 2);
  const binW = (W - pad * 2) / result.reliability.length;
  const total = result.reliability.reduce((s, b) => s + b.count, 0) || 1;

  return (
    <svg className="rj-reliability" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Reliability diagram">
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <g key={t}>
          <line x1={pad} x2={W - pad} y1={sy(t)} y2={sy(t)} className="rj-gridline" />
          <text x={pad - 6} y={sy(t) + 3} textAnchor="end">
            {Math.round(t * 100)}
          </text>
        </g>
      ))}
      {result.reliability.map((b, i) => {
        const x0 = pad + i * binW;
        return (
          <g key={b.lo}>
            {b.count > 0 && (
              <rect
                x={x0 + 3}
                width={binW - 6}
                y={sy(b.accuracy)}
                height={sy(0) - sy(b.accuracy)}
                className="rj-bin"
                style={{ opacity: 0.35 + 0.65 * Math.min(1, (b.count / total) * 3) }}
              />
            )}
            <text x={x0 + binW / 2} y={H - pad + 14} textAnchor="middle">
              {Math.round(b.lo * 100)}–{Math.round(b.hi * 100)}
            </text>
          </g>
        );
      })}
      <line x1={sx(0.5)} y1={sy(0.5)} x2={sx(1)} y2={sy(1)} className="rj-diagonal" />
      <text x={W / 2} y={H - 4} textAnchor="middle">
        stated confidence (%)
      </text>
      <text x={10} y={H / 2} textAnchor="middle" transform={`rotate(-90 10 ${H / 2})`}>
        actually right (%)
      </text>
    </svg>
  );
}
