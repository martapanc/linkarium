-- Soft-delete support for lists
alter table public.lists add column deleted_at timestamptz default null;

create index idx_lists_deleted_at on public.lists(deleted_at)
  where deleted_at is not null;

-- Allow deleting lists (needed for the cron hard-delete path via service role)
create policy "Lists are publicly deletable"
  on public.lists for delete using (true);