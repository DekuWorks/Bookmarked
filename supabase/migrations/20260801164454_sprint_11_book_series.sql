-- Sprint 11: curated series data. Existing catalog series_name/series_position
-- remains a fallback while verified entries take precedence in public views.
create table if not exists public.book_series (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  verified boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (name)
);

create table if not exists public.book_series_entries (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null references public.book_series(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  position numeric,
  entry_type text not null default 'main'
    check (entry_type in ('main', 'novella', 'prequel', 'companion', 'short_story', 'other')),
  created_at timestamptz not null default now(),
  unique (series_id, book_id)
);

create index if not exists book_series_entries_series_position_idx
  on public.book_series_entries (series_id, position);
create index if not exists book_series_entries_book_idx
  on public.book_series_entries (book_id);

alter table public.book_series enable row level security;
alter table public.book_series_entries enable row level security;

create policy "series are publicly readable"
  on public.book_series for select to authenticated using (true);
create policy "series entries are publicly readable"
  on public.book_series_entries for select to authenticated using (true);
create policy "readers can create series"
  on public.book_series for insert to authenticated
  with check (created_by = auth.uid());
create policy "creators can update their series"
  on public.book_series for update to authenticated
  using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy "creators can add series entries"
  on public.book_series_entries for insert to authenticated
  with check (exists (
    select 1 from public.book_series s where s.id = series_id and s.created_by = auth.uid()
  ));
create policy "creators can update series entries"
  on public.book_series_entries for update to authenticated
  using (exists (
    select 1 from public.book_series s where s.id = series_id and s.created_by = auth.uid()
  ));
create policy "creators can remove series entries"
  on public.book_series_entries for delete to authenticated
  using (exists (
    select 1 from public.book_series s where s.id = series_id and s.created_by = auth.uid()
  ));
