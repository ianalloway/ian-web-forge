# AGENTS.md - AI Agent Guidelines for ian-web-forge

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
