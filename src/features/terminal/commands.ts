/**
 * Interactive terminal — pure command interpreter.
 *
 * Mirrors the snake/life feature modules: all behaviour lives in plain,
 * framework-free functions so it can be reasoned about and tested in
 * isolation. The React view in pages/Terminal.tsx only handles I/O,
 * scrollback, and routing side-effects described by CommandResult.
 *
 * This module is also the single source of truth for the site's bio,
 * project list, socials, and routes that the terminal reports.
 */

export const PROMPT = "visitor@ianalloway.xyz:~$";

export type LineTone = "default" | "accent" | "muted" | "error" | "heading";

export interface OutputLine {
  text: string;
  tone?: LineTone;
  /** External URL — rendered as an anchor. */
  href?: string;
  /** Internal SPA route — rendered as a router link. */
  to?: string;
}

export interface CommandResult {
  lines: OutputLine[];
  /** Wipe the scrollback. */
  clear?: boolean;
  /** Internal route the view should navigate to. */
  navigate?: string;
  /** External URL the view should open in a new tab. */
  openUrl?: string;
}

export interface CommandContext {
  now?: Date;
}

interface SocialLink {
  key: string;
  label: string;
  url: string;
}

interface ProjectEntry {
  name: string;
  blurb: string;
  url: string;
}

interface RouteEntry {
  path: string;
  desc: string;
}

const SOCIALS: SocialLink[] = [
  { key: "github", label: "GitHub", url: "https://github.com/ianalloway" },
  { key: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/in/ianit" },
  { key: "twitter", label: "Twitter / X", url: "https://x.com/ianallowayxyz" },
  { key: "substack", label: "Substack", url: "https://allowayai.substack.com" },
  { key: "email", label: "Email", url: "mailto:ian@allowayllc.com" },
];

const PROJECTS: ProjectEntry[] = [
  {
    name: "sports-betting-ml",
    blurb: "XGBoost NBA model — 68.3% accuracy, Kelly sizing, live in production.",
    url: "https://github.com/ianalloway/sports-betting-ml",
  },
  {
    name: "nba-ratings / nba-edge",
    blurb: "Elo + logistic win-probability + Kelly helpers. Published to PyPI as nba-edge.",
    url: "https://github.com/ianalloway/nba-ratings",
  },
  {
    name: "solvent-agent",
    blurb: "Self-funding AI analyst: quotes jobs, takes Stripe payment, books its own P&L.",
    url: "https://github.com/ianalloway/solvent-agent",
  },
  {
    name: "juryrig",
    blurb: "Zero-dependency audit toolkit for LLM-as-judge pipelines.",
    url: "https://github.com/ianalloway/juryrig",
  },
  {
    name: "openclaw-skills",
    blurb: "Nine published OSS agent skills: odds, Kelly sizing, DFS optimizer, and more.",
    url: "https://github.com/ianalloway/openclaw-skills",
  },
  {
    name: "onchain-risk-scanner",
    blurb: "Read-only risk + upgrade-timeline scanner for EVM contracts.",
    url: "https://github.com/ianalloway/onchain-risk-scanner",
  },
];

const ROUTES: RouteEntry[] = [
  { path: "/", desc: "home — selected work, capabilities, contact" },
  { path: "/now", desc: "what I'm focused on right now" },
  { path: "/toolkit", desc: "sports-ML stack + OSS repo index" },
  { path: "/demos", desc: "live, runnable product demos" },
  { path: "/bots", desc: "copy-paste commands to run the agents" },
  { path: "/kelly", desc: "Kelly Criterion bet-sizing calculator" },
  { path: "/nba-api", desc: "NBA Edge API — 68.3% backtested accuracy" },
  { path: "/consulting", desc: "LLM evaluation consulting" },
  { path: "/life", desc: "Conway's Game of Life playground" },
  { path: "/snake", desc: "classic Snake" },
  { path: "/terminal", desc: "this shell" },
];

interface CommandSpec {
  name: string;
  summary: string;
  run: (args: string[], ctx: CommandContext) => CommandResult;
}

function text(value: string, tone?: LineTone): OutputLine {
  return { text: value, tone };
}

function result(lines: OutputLine[]): CommandResult {
  return { lines };
}

const BANNER: OutputLine[] = [
  text("┌──────────────────────────────────────────────┐", "accent"),
  text("│   ian.alloway // evaluation-first ml.systems   │", "accent"),
  text("└──────────────────────────────────────────────┘", "accent"),
];

function helpCommand(): CommandResult {
  const lines: OutputLine[] = [text("Available commands:", "heading")];
  for (const command of COMMANDS) {
    lines.push(text(`  ${command.name.padEnd(12)} ${command.summary}`));
  }
  lines.push(text(""));
  lines.push(text("Tip: try `ls`, then `open <page>`. Tab completes commands.", "muted"));
  return result(lines);
}

function whoamiCommand(): CommandResult {
  return result([
    text("Ian Alloway — ML engineer & data scientist.", "accent"),
    text("I build evaluation-first ML systems that survive contact with real users."),
    text("USF M.S. Artificial Intelligence (in progress) · founder, Alloway LLC."),
  ]);
}

const FILES: Record<string, OutputLine[]> = {
  "about.txt": [
    text("Ian Alloway", "heading"),
    text("ML engineer & data scientist focused on sports analytics, AI agents,"),
    text("and the evaluation tooling that keeps models honest. I ship production"),
    text("systems — APIs, dashboards, and developer tools — and write most of it"),
    text("in the open. Flagship work: a 68.3%-accuracy NBA betting model (live"),
    text("at aiadvantagesports.com) and solvent-agent, an AI that funds itself."),
  ],
  "skills.txt": [
    text("machine_learning : XGBoost · PyTorch · scikit-learn"),
    text("ai_systems       : LLMs · autonomous agents · evals (juryrig)"),
    text("data_engineering : FastAPI · PostgreSQL · SQL · ETL"),
    text("analytics        : Streamlit · Tableau · Power BI · calibration"),
  ],
  "education.txt": [
    text("M.S. Artificial Intelligence — University of South Florida (in progress, 2026)"),
    text("B.S. Information Science    — University of South Florida (2025)"),
  ],
  "contact.txt": [
    text("email    : ian@allowayllc.com", undefined),
    text("the fastest way to reach me is email — open with `open email`.", "muted"),
  ],
};

function lsCommand(args: string[]): CommandResult {
  const target = args[0];

  if (target === "projects" || target === "projects/") {
    const lines: OutputLine[] = [text("projects/", "heading")];
    for (const project of PROJECTS) {
      lines.push({ text: `  ${project.name}`, href: project.url, tone: "accent" });
    }
    lines.push(text("Run `projects` for descriptions.", "muted"));
    return result(lines);
  }

  if (target && target !== "." && target !== "~" && target !== "/") {
    return result([text(`ls: cannot access '${target}': not a directory`, "error")]);
  }

  const lines: OutputLine[] = [text("drwxr-xr-x  pages and files", "muted")];
  lines.push(text("  projects/", "accent"));
  for (const route of ROUTES) {
    lines.push(text(`  ${route.path.padEnd(12)} ${route.desc}`));
  }
  for (const file of Object.keys(FILES)) {
    lines.push(text(`  ${file}`));
  }
  return result(lines);
}

function catCommand(args: string[]): CommandResult {
  const name = args[0];
  if (!name) {
    return result([text("usage: cat <file>   (try `ls` to see files)", "muted")]);
  }
  const file = FILES[name] ?? FILES[`${name}.txt`];
  if (!file) {
    return result([text(`cat: ${name}: No such file`, "error")]);
  }
  return result(file);
}

function projectsCommand(): CommandResult {
  const lines: OutputLine[] = [text("Selected open-source work:", "heading")];
  for (const project of PROJECTS) {
    lines.push({ text: project.name, href: project.url, tone: "accent" });
    lines.push(text(`  ${project.blurb}`, "muted"));
  }
  return result(lines);
}

function skillsCommand(): CommandResult {
  return catCommand(["skills.txt"]);
}

function socialCommand(): CommandResult {
  const lines: OutputLine[] = [text("Find me here:", "heading")];
  for (const social of SOCIALS) {
    lines.push({ text: `  ${social.label.padEnd(12)} ${social.url}`, href: social.url, tone: "accent" });
  }
  lines.push(text("Shortcut: `open github`, `open linkedin`, `open email`, ...", "muted"));
  return result(lines);
}

function openCommand(args: string[]): CommandResult {
  const target = args[0];
  if (!target) {
    return result([text("usage: open <page|link>   e.g. `open /life` or `open github`", "muted")]);
  }

  const social = SOCIALS.find((entry) => entry.key === target.toLowerCase());
  if (social) {
    return {
      lines: [text(`Opening ${social.label} → ${social.url}`, "muted")],
      openUrl: social.url,
    };
  }

  const normalized = target.startsWith("/") ? target : `/${target}`;
  const route = ROUTES.find((entry) => entry.path === normalized);
  if (route) {
    return {
      lines: [text(`Navigating to ${route.path} ...`, "muted")],
      navigate: route.path,
    };
  }

  if (/^https?:\/\//.test(target)) {
    return { lines: [text(`Opening ${target}`, "muted")], openUrl: target };
  }

  return result([
    text(`open: '${target}' not found.`, "error"),
    text("Try `ls` for pages or `social` for links.", "muted"),
  ]);
}

function echoCommand(args: string[]): CommandResult {
  return result([text(args.join(" "))]);
}

function dateCommand(_args: string[], ctx: CommandContext): CommandResult {
  const now = ctx.now ?? new Date();
  return result([text(now.toString())]);
}

function bannerCommand(): CommandResult {
  return result([...BANNER]);
}

function sudoCommand(args: string[]): CommandResult {
  const rest = args.join(" ") || "su";
  return result([
    text(`[sudo] password for visitor: `, "muted"),
    text(`visitor is not in the sudoers file. This incident will be reported. (${rest})`, "error"),
  ]);
}

function matrixCommand(): CommandResult {
  return result([
    text("Wake up, Neo...", "accent"),
    text("The green rain behind this window? That's a <canvas>, not the Matrix."),
    text("It lives in src/components/MatrixRain.tsx — recently un-broke in CI. :)", "muted"),
  ]);
}

function clearCommand(): CommandResult {
  return { lines: [], clear: true };
}

function exitCommand(): CommandResult {
  return result([text("There is no exit. But `open /` will take you home.", "muted")]);
}

export const COMMANDS: CommandSpec[] = [
  { name: "help", summary: "list available commands", run: helpCommand },
  { name: "whoami", summary: "one-line bio", run: whoamiCommand },
  { name: "ls", summary: "list pages, projects, and files", run: lsCommand },
  { name: "cat", summary: "print a file (about.txt, skills.txt, ...)", run: catCommand },
  { name: "projects", summary: "open-source project list", run: projectsCommand },
  { name: "skills", summary: "tech stack", run: skillsCommand },
  { name: "social", summary: "links — github, linkedin, substack, email", run: socialCommand },
  { name: "open", summary: "open a page or link, e.g. open /life", run: openCommand },
  { name: "echo", summary: "print text", run: echoCommand },
  { name: "date", summary: "current date and time", run: dateCommand },
  { name: "banner", summary: "print the header banner", run: bannerCommand },
  { name: "matrix", summary: "?", run: matrixCommand },
  { name: "sudo", summary: "nice try", run: sudoCommand },
  { name: "clear", summary: "clear the screen", run: clearCommand },
  { name: "exit", summary: "leave the shell", run: exitCommand },
];

const COMMAND_MAP: Record<string, CommandSpec> = Object.fromEntries(
  COMMANDS.map((command) => [command.name, command]),
);

/** Command names available for tab-completion / hints. */
export const COMMAND_NAMES: string[] = COMMANDS.map((command) => command.name);

/** The lines shown when the terminal first mounts. */
export function welcomeLines(): OutputLine[] {
  return [
    ...BANNER,
    text(""),
    text("Interactive shell. Type `help` to get started, or `ls` to look around.", "muted"),
    text(""),
  ];
}

/** Parse and execute a single line of input. Pure aside from ctx.now. */
export function runCommand(input: string, ctx: CommandContext = {}): CommandResult {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return result([]);
  }

  const [name, ...args] = trimmed.split(/\s+/);
  const command = COMMAND_MAP[name.toLowerCase()];
  if (!command) {
    return result([
      text(`command not found: ${name}`, "error"),
      text("Type `help` for the list of commands.", "muted"),
    ]);
  }

  return command.run(args, ctx);
}

/** Longest-common-prefix completion against the command list. */
export function completeCommand(partial: string): string | null {
  const token = partial.trimStart();
  if (token.length === 0 || token.includes(" ")) {
    return null;
  }

  const matches = COMMAND_NAMES.filter((candidate) => candidate.startsWith(token));
  if (matches.length === 0) {
    return null;
  }
  if (matches.length === 1) {
    return matches[0];
  }

  let prefix = matches[0];
  for (const candidate of matches.slice(1)) {
    while (!candidate.startsWith(prefix)) {
      prefix = prefix.slice(0, -1);
    }
  }
  return prefix.length > token.length ? prefix : null;
}
