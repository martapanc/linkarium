-- ============================================================
-- Linkarium MVP Schema
-- ============================================================

-- Lists table
create table public.lists (
  id text primary key,
  title text not null default 'My Links',
  description text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz default (now() + interval '90 days')
);

-- Links table
create table public.links (
  id uuid primary key default gen_random_uuid(),
  list_id text not null references public.lists(id) on delete cascade,
  url text not null,
  title text,
  description text,
  image_url text,
  favicon_url text,
  domain text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  scraped_at timestamptz
);

-- Indexes
create index idx_links_list_id on public.links(list_id);
create index idx_links_list_position on public.links(list_id, position);
create index idx_lists_created_at on public.lists(created_at desc);
create index idx_lists_expires_at on public.lists(expires_at);

-- Full-text search index on links
alter table public.links add column fts tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(domain, '')), 'C')
  ) stored;

create index idx_links_fts on public.links using gin(fts);

-- Unique constraint: no duplicate URLs within the same list
create unique index idx_links_unique_url_per_list on public.links(list_id, url);

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger lists_updated_at
  before update on public.lists
  for each row execute function update_updated_at();

-- Row Level Security
alter table public.lists enable row level security;
alter table public.links enable row level security;

-- For MVP: all lists are public, anyone can read and write
-- This will be tightened in phase 2 when auth is added
create policy "Lists are publicly readable"
  on public.lists for select using (true);

create policy "Lists are publicly insertable"
  on public.lists for insert with check (true);

create policy "Lists are publicly updatable"
  on public.lists for update using (true);

create policy "Links are publicly readable"
  on public.links for select using (true);

create policy "Links are publicly insertable"
  on public.links for insert with check (true);

create policy "Links are publicly updatable"
  on public.links for update using (true);

create policy "Links are publicly deletable"
  on public.links for delete using (true);
