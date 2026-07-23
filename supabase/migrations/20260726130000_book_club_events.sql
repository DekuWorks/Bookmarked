-- Book club events: meetups, read-alongs, and discussion sessions tied to clubs.
-- Visibility follows the parent club (public clubs expose events to all readers;
-- private club events are member-only via RLS).

create table if not exists public.book_club_events (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.book_clubs (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint book_club_events_title_not_empty check (char_length(trim(title)) > 0),
  constraint book_club_events_ends_after_start check (ends_at is null or ends_at >= starts_at)
);

create index if not exists book_club_events_club_starts_idx
  on public.book_club_events (club_id, starts_at);

create index if not exists book_club_events_starts_at_idx
  on public.book_club_events (starts_at);

drop trigger if exists book_club_events_set_updated_at on public.book_club_events;
create trigger book_club_events_set_updated_at
  before update on public.book_club_events
  for each row execute function public.set_updated_at();

alter table public.book_club_events enable row level security;

drop policy if exists "book_club_events_select_visible" on public.book_club_events;
create policy "book_club_events_select_visible"
  on public.book_club_events for select
  to authenticated
  using (
    public.user_is_club_member(club_id)
    or exists (
      select 1
      from public.book_clubs c
      where c.id = club_id
        and c.visibility = 'public'
    )
  );

drop policy if exists "book_club_events_insert_member" on public.book_club_events;
create policy "book_club_events_insert_member"
  on public.book_club_events for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and public.user_is_club_member(club_id)
  );

drop policy if exists "book_club_events_update" on public.book_club_events;
create policy "book_club_events_update"
  on public.book_club_events for update
  to authenticated
  using (
    created_by = auth.uid()
    or exists (
      select 1
      from public.book_clubs c
      where c.id = club_id
        and c.owner_id = auth.uid()
    )
  );

drop policy if exists "book_club_events_delete" on public.book_club_events;
create policy "book_club_events_delete"
  on public.book_club_events for delete
  to authenticated
  using (
    created_by = auth.uid()
    or exists (
      select 1
      from public.book_clubs c
      where c.id = club_id
        and c.owner_id = auth.uid()
    )
  );
