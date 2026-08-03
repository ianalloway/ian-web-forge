# AGENTS.md - AI Agent Guidelines for ian-web-forge

## Overview

Matrix-themed developer portfolio for Ian Alloway — a single-page React SPA plus a handful of
lazy-loaded routes (Now, HireMe, Toolkit, Demos, Bots, Kelly). No backend: the newsletter form on
the homepage posts to Netlify Forms (see `public/__forms.html` + `netlify.toml`). There is no
contact form — the contact section is a `mailto:` link.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS + a small hand-picked set of shadcn/ui primitives (`src/components/ui/`)
- React Router (lazy-loaded routes), react-helmet-async for SEO tags

## Commands

```bash
npm install
npm run dev       # Vite dev server → http://localhost:8080 (port set in vite.config.ts)
npm run build     # production build → dist/
npm run lint      # ESLint
npm test          # eslint . && tsc --noEmit
npm run preview   # preview a production build
npm run check:forms  # verify the Netlify form wiring (needs a build first)
```

There is no `typecheck` script — `npm test` already runs `tsc --noEmit`. There is no browser/smoke
test harness in this repo; CI is a single build/lint/typecheck pipeline (below).

## CI

- `.github/workflows/ci.yml` — checkout → `npm ci` → lint → `tsc --noEmit` → build → form check.
  Runs on every push/PR against `main`.
- `.github/workflows/codeql.yml` — GitHub CodeQL security scanning (scheduled + push/PR).
- `.github/workflows/form-check.yml` — probes the **live** Netlify form wiring. The read-only probe
  is safe to run anytime; the live submission is opt-in (`workflow_dispatch` with `submit: true`,
  or a commit message containing `[form-submit]`) and creates a real Forms entry.
- CodeRabbit (`coderabbit.yaml`) reviews PRs automatically; no manual step required.

## Deployment

Netlify (`netlify.toml`): `npm run build`, publish `dist/`, SPA rewrite to `index.html`. No
serverless API and no environment variables required (see `env.example`). A Vercel integration also
builds preview deployments; Netlify Forms does not work on those, so only test the signup against
Netlify URLs.

## Newsletter form — read before touching it

The signup is pure Netlify Forms, and its failure mode is silent: a broken wiring still returns HTTP
200, so the browser shows success while nothing is recorded. That bug shipped once already.

- `public/__forms.html` is **load-bearing**. Netlify's form detection scans deployed HTML, and this
  plain file is what it detects. It also gives the client a POST target that is a real file, so the
  catch-all rewrite does not intercept it. Deleting it silently breaks every signup.
- `netlify.toml`'s `/* -> /index.html 200` rewrite answers *any* path with the app shell, so a 200
  from `/` proves nothing. `src/lib/newsletter.ts` therefore posts with `redirect: "manual"` and
  treats only a redirect, or a 2xx whose body is not the app shell, as a recorded submission.
- Netlify stores **only** fields declared on the detected form. Any field added to the client
  payload must also be declared in `public/__forms.html` and `index.html`. `npm run check:forms`
  enforces this after a build and runs in CI.

## Content updates

- Public repo catalog: `src/pages/Toolkit.tsx` (`CORE_SECTION` + `START_HERE`).
- Academic papers: add the PDF to `/public/papers/`, then update the `academicPapers` array in
  `src/pages/Index.tsx`.

## Routes

`/`, `/now`, `/hireme`, `/toolkit`, `/demos`, `/bots`, `/kelly`, and a catch-all 404. Keep
`Index.tsx` and `HireMe.tsx` intact — they're the hire-me-critical pages.
