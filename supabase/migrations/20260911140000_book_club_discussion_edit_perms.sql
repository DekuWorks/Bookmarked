-- Book Clubs: discussion edit by creator only; hosts may delete/pin/lock but not edit body.
-- Adds edited_at so reply-activity bumps to updated_at do not show a false "Edited" badge.

-- =============================================================================
-- 1. edited_at for content edits (title/body)
-- =============================================================================

alter table public.book_club_discussions
  add column if not exists edited_at timestamptz;

comment on column public.book_club_discussions.edited_at is
  'Set when the creator edits title/body. Null until first content edit.';

-- =============================================================================
-- 2. UPDATE: creators only (hosts may delete, not edit others' title/body)
-- =============================================================================

drop policy if exists "book_club_discussions_update" on public.book_club_discussions;
create policy "book_club_discussions_update"
  on public.book_club_discussions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- DELETE policy unchanged: creator OR owner/host/moderator.

-- =============================================================================
-- 3. Pin / lock RPCs (hosts cannot use table UPDATE after author-only policy)
-- =============================================================================

create or replace function public.set_book_club_discussion_pinned(
  p_discussion_id uuid,
  p_is_pinned boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_club_id uuid;
begin
  select club_id into v_club_id
  from public.book_club_discussions
  where id = p_discussion_id;

  if v_club_id is null then
    raise exception 'Discussion not found';
  end if;

  if not public.user_has_club_role(v_club_id, array['owner', 'host']) then
    raise exception 'Forbidden';
  end if;

  update public.book_club_discussions
  set is_pinned = coalesce(p_is_pinned, false),
      updated_at = now()
  where id = p_discussion_id;
end;
$$;

create or replace function public.set_book_club_discussion_locked(
  p_discussion_id uuid,
  p_is_locked boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_club_id uuid;
begin
  select club_id into v_club_id
  from public.book_club_discussions
  where id = p_discussion_id;

  if v_club_id is null then
    raise exception 'Discussion not found';
  end if;

  if not public.user_has_club_role(v_club_id, array['owner', 'host', 'moderator']) then
    raise exception 'Forbidden';
  end if;

  update public.book_club_discussions
  set is_locked = coalesce(p_is_locked, false),
      updated_at = now()
  where id = p_discussion_id;
end;
$$;

revoke all on function public.set_book_club_discussion_pinned(uuid, boolean) from public;
revoke all on function public.set_book_club_discussion_locked(uuid, boolean) from public;
grant execute on function public.set_book_club_discussion_pinned(uuid, boolean) to authenticated;
grant execute on function public.set_book_club_discussion_locked(uuid, boolean) to authenticated;
