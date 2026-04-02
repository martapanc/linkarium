# Linkarium

> Drop your links. Share the list.

Create shareable link lists with automatic metadata scraping, search, sort, and filtering. No signup required.

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, TypeScript)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL + full-text search)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Link Scraping**: [open-graph-scraper](https://github.com/jshemas/openGraphScraper)
- **Deployment**: [Vercel](https://vercel.com/)

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com/) project (free tier works)
- Optionally: [Supabase CLI](https://supabase.com/docs/guides/cli) for local development

### 1. Clone & Install

```bash
git clone https://github.com/martapanc/linkarium.git
cd linkarium
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com/dashboard)
2. Go to **SQL Editor** and run the migration in `supabase/migrations/001_initial_schema.sql`
3. Copy your project URL and anon key from **Settings → API**

### 3. Configure Environment

```bash
cp .env.example .env
```

Fill in your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page with create form
│   ├── layout.tsx                  # Root layout + metadata
│   ├── not-found.tsx               # 404 page
│   ├── globals.css                 # Tailwind + custom theme
│   ├── [listId]/
│   │   └── page.tsx                # List view (SSR for OG tags)
│   └── api/
│       ├── lists/route.ts          # POST (create) + PATCH (update)
│       ├── links/route.ts          # POST (add) + DELETE + PUT (reorder)
│       └── scrape/route.ts         # POST (scrape/re-scrape URL)
├── components/
│   ├── ListView.tsx                # Main list page orchestrator
│   ├── LinkCard.tsx                # Individual link card
│   ├── AddLinksForm.tsx            # Collapsible form to add links
│   ├── SearchFilterBar.tsx         # Search, domain filter, sort
│   ├── ListHeader.tsx              # Editable title + description
│   ├── ShareButton.tsx             # Copy list URL to clipboard
│   └── EmptyState.tsx              # Shown when list is empty
└── lib/
    ├── types.ts                    # TypeScript types
    ├── url-parser.ts               # URL extraction from raw text
    ├── scraper.ts                  # OG metadata scraper
    └── supabase/
        ├── client.ts               # Browser Supabase client
        └── server.ts               # Server Supabase client
```

## Features (MVP)

- **Create lists** — paste URLs or raw text, get a shareable page
- **Metadata scraping** — automatic OG image, title, description, favicon
- **Search & filter** — full-text search, domain filter
- **Sort** — by position, date added, title, or domain
- **Inline editing** — click to edit list title and description
- **Share** — one-click copy of list URL
- **SSR** — server-rendered OG tags for social media previews
- **Responsive** — mobile-first design
- **Duplicate detection** — warns when adding duplicate URLs
- **Re-scrape** — refresh metadata for any individual link

## Deployment

### Vercel (recommended)

1. Push to GitHub
2. Import project at [vercel.com/new](https://vercel.com/new)
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Phase 2 Roadmap

- [ ] User accounts (Supabase Auth)
- [ ] Private lists (RLS policies per user)
- [ ] Display options (card size, theme colours)
- [ ] Drag-and-drop reorder (@dnd-kit)
- [ ] Brand customisation (logo, custom CSS)
- [ ] List expiry warnings + renewal
- [ ] Tags/categories for links
- [ ] Import/export (JSON, bookmark HTML)
- [ ] Collaborative editing (Supabase Realtime)

## License

MIT
