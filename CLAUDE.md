# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn dev          # Start dev server on port 3637
yarn build        # Production build
yarn lint         # ESLint via Next.js
yarn db:migrate   # Push migrations to Supabase (supabase db push)
yarn db:reset     # Reset local Supabase DB
```

There are no automated tests in this project yet.

## Environment

Copy `.env.example` to `.env` and fill in:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` — Supabase publishable key
- `NEXT_PUBLIC_APP_URL` — base URL (e.g. `http://localhost:3000`)
- `SCRAPE_RATE_LIMIT` — requests/min per IP for the scrape endpoint (default 30)

## Architecture

**Next.js 15 App Router** with TypeScript. No auth yet (Phase 2 roadmap).

### Data flow

1. **Landing page** (`src/app/page.tsx`) — user pastes raw text or URLs, POSTs to `/api/lists` which creates the list, extracts URLs via `lib/url-parser.ts`, and scrapes OG metadata via `lib/scraper.ts`.
2. **List page** (`src/app/[listId]/page.tsx`) — SSR: fetches list + links from Supabase, renders `<ListView>` with initial data, generates OG metadata for social previews. List IDs are 7-char nanoid strings.
3. **Client components** manage state after hydration: `ListView.tsx` orchestrates the list view; `AddLinksForm`, `SearchFilterBar`, `ListHeader`, `LinkCard`, `ShareButton` are all client components.

### API routes

| Route | Methods | Purpose |
|---|---|---|
| `/api/lists` | POST, PATCH | Create list (with optional initial URLs); update title/description |
| `/api/links` | POST, DELETE, PUT | Add links to list; delete a link; reorder links (bulk position update) |
| `/api/scrape` | POST | Scrape/re-scrape OG metadata for a single URL, optionally updating an existing link record |

### Supabase

- `lib/supabase/server.ts` — server-side client (used in RSCs and API routes)
- `lib/supabase/client.ts` — browser client (used in client components)
- Schema: `lists` (id: nanoid text PK) → `links` (id: uuid, position: int). Full-text search via a `fts` generated `tsvector` column on `links` (title A, description B, domain C).
- Migration: `supabase/migrations/001_initial_schema.sql`. RLS is enabled but all policies are open (no auth in MVP).

### Key lib utilities

- `lib/url-parser.ts` — `extractUrls(text)` parses URLs from raw text; `isValidUrl(url)` validates a single URL
- `lib/scraper.ts` — `scrapeUrl(url)` / `scrapeUrls(urls[])` fetch OG metadata using `open-graph-scraper`, returns `ScrapeResult`
- `lib/types.ts` — all shared TypeScript types (`DbList`, `DbLink`, API request/response types, UI sort/filter types)

### Drag-and-drop reorder

`@dnd-kit` is installed (`/core`, `/sortable`, `/utilities`) for drag-and-drop link reordering; reorder calls `PUT /api/links` with `{ listId, orderedIds }`.

## CI/CD

GitHub Actions (`release.yml`) runs `release-please` on pushes to `master` via a shared workflow. Deployment target is Vercel.