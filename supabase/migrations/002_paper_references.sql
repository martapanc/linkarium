-- ============================================================
-- Paper references support
-- ============================================================

-- Allow url to be null for paper-only entries (no publicly accessible URL)
alter table public.links alter column url drop not null;

-- Discriminate between regular links and paper references
alter table public.links add column link_type text not null default 'url';

-- Paper citation metadata
alter table public.links add column citation_authors text;
alter table public.links add column citation_year integer;
alter table public.links add column citation_venue text;
alter table public.links add column doi text;

-- Unique URL constraint only applies when url is present
drop index idx_links_unique_url_per_list;
create unique index idx_links_unique_url_per_list
  on public.links(list_id, url)
  where url is not null;

-- Unique DOI per list
create unique index idx_links_unique_doi_per_list
  on public.links(list_id, doi)
  where doi is not null;

-- Recreate FTS column to include paper-specific metadata
alter table public.links drop column fts;
alter table public.links add column fts tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(domain, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(citation_authors, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(citation_venue, '')), 'C')
  ) stored;

create index idx_links_fts on public.links using gin(fts);