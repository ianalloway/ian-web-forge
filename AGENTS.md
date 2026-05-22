# AGENTS.md - AI Agent Guidelines for ian-web-forge

## Changelog (maintainer notes)

| Date | Change |
|------|--------|
| **2026-03** | **`/toolkit`** lists **8 active** public repos + **`oss-archive`**. Retired OSS was copied to `ianalloway/oss-archive` branches `archive/<repo>` then originals were **GitHub-archived**. Sync profile README + Toolkit. `scripts/apply-topics.sh` targets **active** repos only. |

## Overview

This repo uses a risk-aware CI/CD pipeline with policy gates and code review agents.

## Risk Tiers

| Tier | Paths | Required Checks |
|------|-------|-----------------|
| High | `app/api/**`, `lib/tools/**`, `db/**`, `**/auth*`, `**/payment*`, `**/admin*` | risk-policy-gate, harness-smoke, Browser Evidence, CI Pipeline |
| Medium | `app/components/**`, `lib/**`, `services/**` | risk-policy-gate, CI Pipeline |
| Low | All other files | risk-policy-gate, CI Pipeline |

## Workflow

1. **Risk Policy Gate** runs first (before expensive CI)
2. **Code Review** via Greptile/Coderabbit for high-risk changes
3. **CI Pipeline** runs typecheck → lint → test → build
4. **Browser Evidence** captured for UI changes

## SHA Discipline

⚠️ **IMPORTANT**: Always verify against the current HEAD SHA. Stale review evidence is invalid.

## Testing Commands

```bash
npm run typecheck   # Type checking
npm run lint        # Linting
npm test            # Unit tests
npm run build       # Production build
npm run harness:ui:smoke  # Browser smoke tests
```

## Remediation Loop

If code review finds issues:
1. Agent reads review context
2. Agent patches code
3. Agent runs local validation
4. Agent pushes fix commit
5. Review re-runs automatically

## Useful Links

- Risk Policy: `risk-policy.json`
- CI Config: `.github/workflows/risk-policy-gate.yml`
- Greptile: `.greptile.yml`
- CodeRabbit: `coderabbit.yaml`
- Public repo catalog: `src/pages/Toolkit.tsx` (`CORE_SECTION` + `START_HERE`; condensed, matches profile “featured” story)

## Cursor Cloud specific instructions

- **Dev server**: `npm run dev` starts Vite on port 8080 (configured in `vite.config.ts`).
- **Lint/typecheck**: `npm run lint` (ESLint) and `npm run typecheck` (checks the Vite app, serverless API, and Vite config). No `harness:ui:smoke` script exists in `package.json`.
- **Build**: `npm run build` produces output in `dist/`.
- **Tests**: `npm test` is a no-op placeholder (`echo "No tests specified"`).
- **Serverless API** (`/api/newsletter-subscribe`): requires Vercel CLI + env vars (`NOTION_API_KEY`, `RESEND_API_KEY`, etc.). Not needed for frontend development; the SPA runs standalone via Vite.
- **No Docker or external services** required for the frontend.
