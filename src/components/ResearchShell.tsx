import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";

/**
 * The research-desk frame (nav + footer) the homepage uses, for inner pages
 * that should feel like part of the same site rather than a separate demo.
 */
export default function ResearchShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.body.classList.add("home-redesign");
    return () => document.body.classList.remove("home-redesign");
  }, []);

  return (
    <div className="rd-site rd-inner">
      <a className="rd-skip rd-mono" href="#content">
        Skip to content
      </a>
      <nav className="rd-nav" aria-label="Primary navigation">
        <Link className="rd-wordmark" to="/" aria-label="Ian Alloway, home">
          <img className="rd-wordmark-mark" src="/favicon.svg" alt="" width="32" height="32" />
          <span>Ian Alloway</span>
        </Link>
        <div className="rd-nav-links rd-mono">
          <a href="/#work">Work</a>
          <Link to="/lab">Lab</Link>
          <a href="/#writing">Writing</a>
        </div>
        <a className="rd-nav-cta rd-mono" href="mailto:ian@allowayllc.com">
          Start a conversation <span aria-hidden="true">↗</span>
        </a>
      </nav>
      <main id="content">{children}</main>
      <footer className="rd-footer rd-mono">
        <span>© 2026 Alloway LLC</span>
        <div>
          <a href="https://github.com/ianalloway" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href="https://x.com/ianallowayxyz" target="_blank" rel="noreferrer">
            X
          </a>
          <a href="https://allowayai.substack.com" target="_blank" rel="noreferrer">
            Substack
          </a>
        </div>
        <span>Designed as a living research log.</span>
      </footer>
    </div>
  );
}
