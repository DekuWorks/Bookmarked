-- Reading completion: page-count metadata on sessions + stats that exclude missing counts

alter table public.reading_sessions
  add column if not exists total_pages integer,
  add column if not exists page_count_status text,
  add column if not exists page_count_source text,
  add column if not exists edition_id uuid references public.books (id) on delete set null,
  add column if not exists completed_at timestamptz;

alter table public.reading_sessions
  drop constraint if exists reading_sessions_total_pages_positive;

alter table public.reading_sessions
  add constraint reading_sessions_total_pages_positive
  check (total_pages is null or total_pages > 0);

alter table public.reading_sessions
  drop constraint if exists reading_sessions_page_count_status_check;

alter table public.reading_sessions
  add constraint reading_sessions_page_count_status_check
  check (
    page_count_status is null
    or page_count_status in ('known', 'user_entered', 'missing')
  );

alter table public.reading_sessions
  drop constraint if exists reading_sessions_page_count_source_check;

alter table public.reading_sessions
  add constraint reading_sessions_page_count_source_check
  check (
    page_count_source is null
    or page_count_source in ('edition', 'canonical_book', 'user', 'unavailable')
  );

comment on column public.reading_sessions.total_pages is
  'Resolved edition/book page count at completion; null when page_count_status = missing.';
comment on column public.reading_sessions.page_count_status is
  'known | user_entered | missing — missing excludes pages from totals until resolved.';
comment on column public.reading_sessions.page_count_source is
  'edition | canonical_book | user | unavailable';
comment on column public.reading_sessions.edition_id is
  'Catalog book row (edition) used for page count at completion.';
comment on column public.reading_sessions.completed_at is
  'When the associated read was finished (may differ from created_at for backfills).';

update public.reading_sessions
set completed_at = created_at
where completed_at is null
  and percent_complete >= 100;

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
    date_trunc('day', coalesce(rs.completed_at, rs.created_at) at time zone 'utc')::date as day,
    coalesce(sum(rs.pages_read), 0)::bigint as pages_read,
    count(*)::bigint as session_count
  from public.reading_sessions rs
  where rs.user_id = p_user_id
    and coalesce(rs.completed_at, rs.created_at) >= p_start
    and coalesce(rs.completed_at, rs.created_at) < p_end
    and coalesce(rs.page_count_status, 'known') <> 'missing'
  group by 1
  order by 1;
$$;

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
    count(distinct date_trunc('day', coalesce(rs.completed_at, rs.created_at)))::bigint as active_days
  from public.reading_sessions rs
  where rs.user_id = p_user_id
    and coalesce(rs.completed_at, rs.created_at) >= p_start
    and coalesce(rs.completed_at, rs.created_at) < p_end
    and coalesce(rs.page_count_status, 'known') <> 'missing';
$$;

do $$
declare
  repaired_count integer := 0;
  needs_input_count integer := 0;
begin
  with broken as (
    select rs.id
    from public.reading_sessions rs
    join public.user_books ub on ub.id = rs.user_book_id
    where ub.shelf_status = 'read'
      and rs.percent_complete >= 100
      and coalesce(rs.pages_read, 0) = 0
      and (rs.total_pages is null or rs.total_pages = 0)
      and coalesce(rs.page_count_status, 'known') <> 'missing'
  ),
  updated as (
    update public.reading_sessions rs
    set
      total_pages = null,
      pages_read = 0,
      page_count_status = 'missing',
      page_count_source = 'unavailable',
      completed_at = coalesce(rs.completed_at, rs.created_at)
    from broken b
    where rs.id = b.id
    returning rs.id
  )
  select count(*) into repaired_count from updated;

  select count(*) into needs_input_count
  from public.reading_sessions
  where page_count_status = 'missing';

  raise notice 'reading_completion_backfill: repaired % sessions; % still need user page count',
    repaired_count, needs_input_count;
end $$;
