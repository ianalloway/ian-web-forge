<div align="center">

# ian-web-forge

Matrix-themed developer portfolio — ML, sports analytics, AI agents.

[![Live Site](https://img.shields.io/badge/live-ianalloway.xyz-5be49b?style=flat-square)](https://ianalloway.xyz)
[![CI](https://github.com/ianalloway/ian-web-forge/actions/workflows/ci.yml/badge.svg)](https://github.com/ianalloway/ian-web-forge/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)

</div>

## Features

- **Matrix rain** — Canvas-based digital rain effect with HiDPI/retina support
- **Terminal aesthetic** — Monospace typography, green-on-black, scanline glow
- **Selected work** — Filterable project showcase (Sports ML, AI Agents, MLOps, Tools, Web3)
- **Live demos** — Kelly criterion calculator, odds converter, Streamlit app links
- **Agent tools** — Copy-paste install commands for SOLVENT, juryrig, OpenClaw skills
- **Mobile-first** — Responsive breakpoints, accessible navigation, reduced-motion support
- **Accessibility** — WCAG AA contrast, ARIA landmarks, keyboard navigation, skip-to-content

## Stack

- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS + shadcn/ui
- **Animation:** Canvas 2D (MatrixRain), CSS transitions
- **Routing:** React Router (lazy-loaded routes)
- **SEO:** react-helmet-async, OpenGraph, structured data

## Local development

```bash
git clone https://github.com/ianalloway/ian-web-forge.git
cd ian-web-forge
npm install
npm run dev      # http://localhost:8080
npm run build    # production build → dist/
npm run lint     # ESLint
npm test         # eslint . && tsc --noEmit
```

## Content updates

### Adding academic papers

1. Add the PDF to `/public/papers/` with a clean filename.
2. Update the `academicPapers` array in `src/pages/Index.tsx`.
3. Commit and deploy.

### Newsletter form

The newsletter signup on the homepage submits directly to Netlify Forms (`ianalloway-newsletter`,
declared as a hidden form in `index.html`) — no backend, no API keys, no environment variables.

## Deployment

Netlify only (`netlify.toml`): builds with `npm run build` and publishes `dist/`, with a catch-all
SPA rewrite to `index.html` so client-side routes like `/now`, `/hireme`, and `/toolkit` don't 404.

## Notes

- Keep the homepage current and minimal.
- This repo should feel like a polished landing page, not a feature dump.

Built with ❤️ by Ian Alloway
