# Ian Alloway Portfolio

Personal portfolio site for Ian Alloway — data scientist, ML engineer, and applied systems builder.

**Live site:** https://ianalloway.xyz

## What this is

A clean portfolio focused on:

- selected projects
- writing and Substack updates
- a small toolkit/index for useful links
- a simple place to present current work

## Stack

- Vite
- React
- TypeScript
- shadcn-ui
- Tailwind CSS

## Local development

```bash
npm install
npm run dev
npm run build
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
