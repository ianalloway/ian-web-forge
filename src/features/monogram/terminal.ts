// Contact prompt. Every command is also a plain link on the page, so this is an extra, not a gate.

const LINKS: Record<string, { label: string; href: string }> = {
  email: { label: 'ian@allowayllc.com', href: 'mailto:ian@allowayllc.com' },
  cv: { label: 'Ian_Alloway_Resume_CV.pdf', href: 'https://ianalloway.xyz/Ian_Alloway_Resume_CV.pdf' },
  github: { label: 'github.com/ianalloway', href: 'https://github.com/ianalloway' },
  linkedin: { label: 'linkedin.com/in/ianit', href: 'https://www.linkedin.com/in/ianit' },
  substack: { label: 'allowayai.substack.com', href: 'https://allowayai.substack.com/' },
  x: { label: 'x.com/ianallowayxyz', href: 'https://x.com/ianallowayxyz' },
};

const NOTES = [
  ['I gave an AI agent a Stripe key and walked away', 'https://allowayai.substack.com/p/i-gave-an-ai-agent-a-stripe-key-and'],
  ['Audit your LLM judges before you trust them', 'https://allowayai.substack.com/p/audit-your-llm-judges-before-you'],
  ['The ghost in the machine needs memory, not just a prompt', 'https://allowayai.substack.com/p/the-ghost-in-the-machine-why-your'],
];

const HELP: [string, string][] = [
  ['email', 'show the address'],
  ['cv', 'open the résumé (pdf)'],
  ['github', 'source for everything here'],
  ['linkedin', 'full experience'],
  ['notes', 'recent field notes'],
  ['substack', 'get the next field note'],
  ['x', 'short-form'],
  ['clear', 'clear the screen'],
];

export function initTerminal(root: HTMLElement, signal: AbortSignal) {
  const output = root.querySelector<HTMLElement>('#term-output');
  const form = root.querySelector<HTMLFormElement>('#term-form');
  const input = root.querySelector<HTMLInputElement>('#term-input');
  if (!output || !form || !input) return;

  const line = (...parts: (string | Node)[]) => {
    const p = document.createElement('p');
    p.append(...parts);
    output.append(p);
    output.scrollTop = output.scrollHeight;
  };
  const anchor = (label: string, href: string) => {
    const a = document.createElement('a');
    a.textContent = label;
    a.href = href;
    if (!href.startsWith('mailto:')) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
    return a;
  };

  const run = (raw: string) => {
    const command = raw.trim().toLowerCase();
    if (!command) return;
    line(`ian@alloway:~$ ${command}`);
    if (command === 'clear') {
      output.replaceChildren();
    } else if (command === 'help') {
      for (const [name, description] of HELP) line(`  ${name.padEnd(10)}${description}`);
    } else if (command === 'notes') {
      for (const [title, href] of NOTES) line('  ', anchor(title, href));
    } else if (command === 'cv') {
      line('  opening ', anchor(LINKS.cv.label, LINKS.cv.href));
      window.open(LINKS.cv.href, '_blank', 'noopener');
    } else if (LINKS[command]) {
      line('  ', anchor(LINKS[command].label, LINKS[command].href));
    } else {
      line(`  command not found: ${command} — try 'help'`);
    }
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    run(input.value);
    input.value = '';
  }, { signal });
  root.querySelectorAll<HTMLButtonElement>('[data-command]').forEach((button) => {
    button.addEventListener('click', () => run(button.dataset.command!), { signal });
  });
  root.querySelector('.terminal')?.addEventListener('click', (event) => {
    if (!(event.target as HTMLElement).closest('a, button')) input.focus({ preventScroll: true });
  }, { signal });
}
