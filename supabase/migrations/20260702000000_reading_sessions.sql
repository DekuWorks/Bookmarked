-- Reading sessions (journal entries) for progress history and analytics foundation

create table public.reading_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  user_book_id uuid not null references public.user_books (id) on delete cascade,
  page_start integer not null default 0 check (page_start >= 0),
  page_end integer not null default 0 check (page_end >= 0),
  pages_read integer not null default 0 check (pages_read >= 0),
  percent_complete numeric not null default 0 check (percent_complete >= 0 and percent_complete <= 100),
  note text,
  created_at timestamptz not null default now()
);

create index reading_sessions_user_id_created_at_idx
  on public.reading_sessions (user_id, created_at desc);

create index reading_sessions_user_book_id_created_at_idx
  on public.reading_sessions (user_book_id, created_at desc);

alter table public.reading_sessions enable row level security;

drop policy if exists "reading_sessions_select_own" on public.reading_sessions;
create policy "reading_sessions_select_own"
  on public.reading_sessions for select
  using (auth.uid() = user_id);

drop policy if exists "reading_sessions_insert_own" on public.reading_sessions;
create policy "reading_sessions_insert_own"
  on public.reading_sessions for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.user_books ub
      where ub.id = user_book_id
        and ub.user_id = auth.uid()
    )
  );

drop policy if exists "reading_sessions_delete_own" on public.reading_sessions;
create policy "reading_sessions_delete_own"
  on public.reading_sessions for delete
  using (auth.uid() = user_id);

-- Analytics helper: pages read per day for a user in a date range
create or replace function public.reading_pages_by_day(
  p_user_id uuid,
  p_start timestamptz,
  p_end timestamptz
)
returns table (
  day date,
  pages_read bigint,
  session_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    date_trunc('day', rs.created_at at time zone 'utc')::date as day,
    coalesce(sum(rs.pages_read), 0)::bigint as pages_read,
    count(*)::bigint as session_count
  from public.reading_sessions rs
  where rs.user_id = p_user_id
    and rs.created_at >= p_start
    and rs.created_at < p_end
  group by 1
  order by 1;
$$;

-- Analytics helper: aggregate stats for a user in a date range
create or replace function public.reading_stats_in_range(
  p_user_id uuid,
  p_start timestamptz,
  p_end timestamptz
)
returns table (
  total_pages bigint,
  session_count bigint,
  active_days bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    coalesce(sum(rs.pages_read), 0)::bigint as total_pages,
    count(*)::bigint as session_count,
    count(distinct date_trunc('day', rs.created_at))::bigint as active_days
  from public.reading_sessions rs
  where rs.user_id = p_user_id
    and rs.created_at >= p_start
    and rs.created_at < p_end;
$$;

-- Realtime for reading_sessions (journal refresh) and user_books (shelf/progress sync)
alter table public.reading_sessions replica identity full;
alter table public.user_books replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.reading_sessions;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.user_books;
exception
  when duplicate_object then null;
end $$;
