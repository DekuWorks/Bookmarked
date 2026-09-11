-- Book Clubs sprint: banner_mode, reply edit authorship, reply delete activity refresh,
-- host/owner banner upload + setter RPC.

-- =============================================================================
-- 1. banner_mode on book_clubs
-- =============================================================================

alter table public.book_clubs
  add column if not exists banner_mode text;

alter table public.book_clubs
  drop constraint if exists book_clubs_banner_mode_check;

alter table public.book_clubs
  add constraint book_clubs_banner_mode_check
  check (banner_mode is null or banner_mode in ('current_read', 'custom'));

-- Existing clubs with a custom banner URL stay custom; everyone else matches current read.
update public.book_clubs
set banner_mode = case
  when banner_url is not null and length(trim(banner_url)) > 0 then 'custom'
  else 'current_read'
end
where banner_mode is null;

alter table public.book_clubs
  alter column banner_mode set default 'current_read';

alter table public.book_clubs
  alter column banner_mode set not null;

comment on column public.book_clubs.banner_mode is
  'current_read = derive banner from current book cover; custom = use banner_url.';

-- =============================================================================
-- 2. Reply UPDATE: authors only (hosts may delete, not edit others)
-- =============================================================================

drop policy if exists "book_club_discussion_replies_update" on public.book_club_discussion_replies;
create policy "book_club_discussion_replies_update"
  on public.book_club_discussion_replies for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =============================================================================
-- 3. On reply DELETE, recompute latest_activity_at
-- =============================================================================

create or replace function public.touch_discussion_on_reply()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_latest timestamptz;
begin
  if tg_op = 'INSERT' then
    update public.book_club_discussions
    set reply_count = reply_count + 1,
        latest_activity_at = new.created_at,
        updated_at = now()
    where id = new.discussion_id;
    return new;
  elsif tg_op = 'DELETE' then
    select coalesce(
      (
        select max(r.created_at)
        from public.book_club_discussion_replies r
        where r.discussion_id = old.discussion_id
      ),
      d.created_at
    )
      into v_latest
    from public.book_club_discussions d
    where d.id = old.discussion_id;

    update public.book_club_discussions
    set reply_count = greatest(reply_count - 1, 0),
        latest_activity_at = coalesce(v_latest, latest_activity_at),
        updated_at = now()
    where id = old.discussion_id;
    return old;
  end if;
  return coalesce(new, old);
end;
$$;

-- =============================================================================
-- 4. Banner setter for owner/host (avoids broadening full club UPDATE to hosts)
-- =============================================================================

create or replace function public.set_book_club_banner(
  p_club_id uuid,
  p_banner_mode text,
  p_banner_url text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_banner_mode is null or p_banner_mode not in ('current_read', 'custom') then
    raise exception 'Invalid banner mode';
  end if;

  if not public.user_has_club_role(p_club_id, array['owner', 'host']) then
    raise exception 'Forbidden';
  end if;

  if p_banner_mode = 'custom' then
    update public.book_clubs
    set banner_mode = 'custom',
        banner_url = nullif(trim(coalesce(p_banner_url, '')), ''),
        updated_at = now()
    where id = p_club_id;
  else
    -- Keep existing custom banner_url so switching back does not lose the upload.
    update public.book_clubs
    set banner_mode = 'current_read',
        updated_at = now()
    where id = p_club_id;
  end if;
end;
$$;

revoke all on function public.set_book_club_banner(uuid, text, text) from public;
grant execute on function public.set_book_club_banner(uuid, text, text) to authenticated;

-- =============================================================================
-- 5. Storage: owners + hosts can upload/replace club banners
-- =============================================================================

drop policy if exists "Club owners can upload club banner" on storage.objects;
drop policy if exists "Club managers can upload club banner" on storage.objects;
create policy "Club managers can upload club banner"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'clubs'
    and public.user_has_club_role(
      ((storage.foldername(name))[2])::uuid,
      array['owner', 'host']
    )
  );

drop policy if exists "Club managers can update club banner" on storage.objects;
create policy "Club managers can update club banner"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'clubs'
    and public.user_has_club_role(
      ((storage.foldername(name))[2])::uuid,
      array['owner', 'host']
    )
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'clubs'
    and public.user_has_club_role(
      ((storage.foldername(name))[2])::uuid,
      array['owner', 'host']
    )
  );

drop policy if exists "Club managers can delete club banner" on storage.objects;
create policy "Club managers can delete club banner"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'clubs'
    and name like '%/banner.%'
    and public.user_has_club_role(
      ((storage.foldername(name))[2])::uuid,
      array['owner', 'host']
    )
  );
