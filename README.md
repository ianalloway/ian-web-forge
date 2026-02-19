# Ian Alloway Portfolio

Personal portfolio website for Ian Alloway - Data Scientist & AI Specialist.

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

The site is deployed via Lovable and connected to the custom domain https://ianalloway.xyz

---

Built with ❤️ by Ian Alloway
