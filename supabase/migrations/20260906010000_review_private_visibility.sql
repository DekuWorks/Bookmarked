-- History Tab: true private reviews.
-- Reuses existing public.reviews.visibility (default 'public' since phase 0).
-- Existing rows stay public. Unexpected/legacy values (e.g. 'followers') → public.
-- Never backfills visibility = 'private'.
--
-- Rollback:
--   drop trigger if exists reviews_sync_activity_visibility on public.reviews;
--   drop function if exists public.sync_review_activity_visibility();
--   drop function if exists public.review_visible_to_viewer(text, uuid, uuid);
--   drop index if exists public.reviews_owner_private_idx;
--   alter table public.reviews drop constraint if exists reviews_visibility_check;
--   -- column and row data remain; default stays 'public'.

update public.reviews
set visibility = 'public'
where visibility is null
   or visibility not in ('public', 'private');

alter table public.reviews
  alter column visibility set default 'public';

alter table public.reviews
  drop constraint if exists reviews_visibility_check;

alter table public.reviews
  add constraint reviews_visibility_check
  check (visibility in ('public', 'private'));

create index if not exists reviews_owner_private_idx
  on public.reviews (user_id, created_at desc)
  where visibility = 'private';

create or replace function public.review_visible_to_viewer(
  p_visibility text,
  p_owner_id uuid,
  p_viewer_id uuid
)
returns boolean
language sql
stable
as $$
  select (p_viewer_id is not null and p_viewer_id = p_owner_id)
    or coalesce(p_visibility, 'public') = 'public';
$$;

comment on function public.review_visible_to_viewer(text, uuid, uuid) is
  'Owner can read public + private reviews; everyone else can read public only.';

drop policy if exists "reviews_select_visible" on public.reviews;
create policy "reviews_select_visible"
  on public.reviews for select
  using (
    public.review_visible_to_viewer(visibility, user_id, auth.uid())
  );

drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own"
  on public.reviews for insert
  with check (auth.uid() = user_id);

drop policy if exists "reviews_update_own" on public.reviews;
create policy "reviews_update_own"
  on public.reviews for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "reviews_delete_own" on public.reviews;
create policy "reviews_delete_own"
  on public.reviews for delete
  using (auth.uid() = user_id);

-- Copied Feed rows live on activity_events. Flip their visibility with the
-- review so Public→Private hides immediately and Private→Public reuses the
-- same rows (no duplicate posts).
create or replace function public.sync_review_activity_visibility()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_visibility text;
begin
  if TG_OP <> 'UPDATE' then
    return NEW;
  end if;

  if NEW.visibility is not distinct from OLD.visibility then
    return NEW;
  end if;

  next_visibility := case
    when NEW.visibility = 'private' then 'private'
    else 'public'
  end;

  update public.activity_events
  set visibility = next_visibility
  where entity_type = 'review'
    and entity_id = NEW.id
    and user_id = NEW.user_id;

  if next_visibility = 'private' then
    delete from public.notifications n
    using public.activity_events e
    where e.entity_type = 'review'
      and e.entity_id = NEW.id
      and e.user_id = NEW.user_id
      and n.type = 'feed'
      and n.metadata_json ->> 'activity_id' = e.id::text;
  end if;

  return NEW;
end;
$$;

drop trigger if exists reviews_sync_activity_visibility on public.reviews;
create trigger reviews_sync_activity_visibility
  after update of visibility on public.reviews
  for each row
  execute function public.sync_review_activity_visibility();
