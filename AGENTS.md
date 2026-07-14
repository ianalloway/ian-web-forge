# AGENTS.md - AI Agent Guidelines for ian-web-forge

## Overview

Matrix-themed developer portfolio for Ian Alloway — a single-page React SPA plus a handful of
lazy-loaded routes (Now, HireMe, Toolkit, Demos, Bots, Kelly). No backend: the newsletter form on
the homepage posts to Netlify Forms (see `index.html` + `netlify.toml`).

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
```

There is no `typecheck` script — `npm test` already runs `tsc --noEmit`. There is no browser/smoke
test harness in this repo; CI is a single build/lint/typecheck pipeline (below).

## CI

- `.github/workflows/ci.yml` — checkout → `npm ci` → lint → `tsc --noEmit` → build. Runs on every
  push/PR against `main`.
- `.github/workflows/codeql.yml` — GitHub CodeQL security scanning (scheduled + push/PR).
- CodeRabbit (`coderabbit.yaml`) reviews PRs automatically; no manual step required.

## Deployment

Netlify only (`netlify.toml`): `npm run build`, publish `dist/`, SPA rewrite to `index.html`. There
is no serverless API and no Vercel config — the newsletter and contact flows are pure Netlify Forms
submissions with no environment variables required (see `env.example`).

## Content updates

- Public repo catalog: `src/pages/Toolkit.tsx` (`CORE_SECTION` + `START_HERE`).
- Academic papers: add the PDF to `/public/papers/`, then update the `academicPapers` array in
  `src/pages/Index.tsx`.

## Routes

`/`, `/now`, `/hireme`, `/toolkit`, `/demos`, `/bots`, `/kelly`, and a catch-all 404. Keep
`Index.tsx` and `HireMe.tsx` intact — they're the hire-me-critical pages.
