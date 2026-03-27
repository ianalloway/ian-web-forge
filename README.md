# Ian Alloway Portfolio

Personal portfolio website for Ian Alloway - Data Scientist and AI Specialist.

**Live Site**: https://ianalloway.xyz

## Tech Stack

- **Vite** - Build tool
- **TypeScript** - Type safety
- **React** - UI framework
- **shadcn-ui** - Component library
- **Tailwind CSS** - Styling

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Adding Academic Papers

To add new academic papers to the portfolio:

1. **Add the PDF file** to `/public/papers/` directory with a clean filename (e.g., `my-paper-title.pdf`)

2. **Update the papers array** in `src/pages/Index.tsx` by adding a new entry to the `academicPapers` array:

```typescript
const academicPapers = [
  // ... existing papers ...
  {
    title: 'Your Paper Title',
    description: 'Brief description of the paper',
    file: '/papers/your-paper-filename.pdf',
    category: 'Capstone',
  },
];
```

3. **Commit and push** your changes - the site will automatically deploy.

## Deployment

The live site is connected to https://ianalloway.xyz, and the repo now also includes `vercel.json` so preview deployments on Vercel can serve SPA routes like `/now`, `/hireme`, and `/toolkit` without a 404 while still routing `/api/*` to serverless functions.

### Newsletter automation env vars

The contact-area subscribe form now posts to `/api/newsletter-subscribe`. On each signup it:

- creates a child page in Notion with the subscriber details
- sends you a notification email
- redirects the visitor into the official Substack subscribe page

Set these env vars before turning the form on in production:

```bash
NOTION_API_KEY=secret_your_notion_integration_token
NOTION_PARENT_PAGE_ID=your_notion_parent_page_id
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL="Ian Alloway <onboarding@yourdomain.com>"
NOTIFY_EMAIL=ian@allowayllc.com
SUBSTACK_PUBLICATION_URL=https://allowayai.substack.com
```

`NOTION_PARENT_PAGE_ID` should be the page where you want each new subscriber page to appear. Share that Notion page with your Notion integration before testing.

---

Built with ❤️ by Ian Alloway
