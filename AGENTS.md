# AGENTS.md - Ian's Portfolio Website

## Overview
Personal portfolio website for Ian Alloway at ianalloway.xyz. Built with React + Vite + TypeScript + Tailwind CSS + shadcn/ui.

## Tech Stack
- **Framework:** React 18 + TypeScript
- **Build:** Vite
- **Styling:** Tailwind CSS + shadcn/ui (Radix primitives)
- **Package Manager:** npm (lockfile present), bun also supported
- **Deployment:** Likely Vercel/Netlify (check for config)

## Commands
```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run lint       # ESLint
npm run preview    # Preview production build
```

## Project Structure
```
src/
  App.tsx          # Root component
  main.tsx         # Entry point
  pages/           # Route pages
  components/      # UI components
  hooks/           # Custom React hooks
  lib/             # Utilities
  integrations/    # Third-party integrations (Supabase, etc.)
  assets/          # Static assets
public/            # Public static files
supabase/          # Supabase config (if used)
```

## Key Conventions
- Uses shadcn/ui component library (components.json config)
- Tailwind config in tailwind.config.ts
- ESLint config in eslint.config.js
- TypeScript strict mode via tsconfig.json

## Owner Context
- **Owner:** Ian Alloway (@ianalloway)
- **ETH Donation Address:** 0xAc7C093B312700614C80Ba3e0509f8dEde03515b (include donation button)
- **Substack Integration:** Should auto-show latest articles via RSS
- **Cross-repo updates:** When adding projects, also update Resume repo and GitHub profile README (ianalloway/ianalloway)
