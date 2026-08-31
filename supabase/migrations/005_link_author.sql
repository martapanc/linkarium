-- ============================================================
-- Content author (e.g. YouTube channel name)
-- ============================================================

alter table public.links add column author text;

-- Recreate FTS column so the author is searchable
alter table public.links drop column fts;
alter table public.links add column fts tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(domain, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(citation_authors, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(citation_venue, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(author, '')), 'B')
  ) stored;

create index idx_links_fts on public.links using gin(fts);
