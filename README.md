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
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
npm run lint     # ESLint
```

## Content updates

### Adding academic papers

1. Add the PDF to `/public/papers/` with a clean filename.
2. Update the `academicPapers` array in `src/pages/Index.tsx`.
3. Commit and deploy.

### Newsletter / contact form

The contact-area subscribe form posts to `/api/newsletter-subscribe` and:

- creates a Notion entry
- sends a notification email
- redirects the visitor to the Substack subscribe flow

Required env vars:

```bash
NOTION_API_KEY=secret_your_notion_integration_token
NOTION_PARENT_PAGE_ID=your_notion_parent_page_id
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL="Ian Alloway <onboarding@yourdomain.com>"
NOTIFY_EMAIL=ian@allowayllc.com
SUBSTACK_PUBLICATION_URL=https://allowayai.substack.com
```

## Deployment

The repo includes `vercel.json` so preview deployments can serve SPA routes like `/now`, `/hireme`, and `/toolkit` without 404s while still routing `/api/*` to serverless functions.

## Notes

- Keep the homepage current and minimal.
- This repo should feel like a polished landing page, not a feature dump.

Built with ❤️ by Ian Alloway
