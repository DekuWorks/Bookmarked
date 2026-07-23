-- Group chat avatars (book_clubs.image_url already exists for club avatars).

alter table public.conversations
  add column if not exists avatar_url text;

-- ---------------------------------------------------------------------------
-- Helpers for storage RLS (group owners / club owners)
-- ---------------------------------------------------------------------------
create or replace function public.user_is_group_conversation_owner(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_participants cp
    join public.conversations c on c.id = cp.conversation_id
    where cp.conversation_id = p_conversation_id
      and cp.user_id = auth.uid()
      and cp.role = 'owner'
      and c.type = 'group'
  );
$$;

create or replace function public.user_is_book_club_owner(p_club_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.book_clubs bc
    where bc.id = p_club_id
      and bc.owner_id = auth.uid()
  );
$$;

-- Paths: avatars/groups/{conversation_id}/avatar.{ext}
--        avatars/clubs/{club_id}/avatar.{ext}

drop policy if exists "Group owners can upload group avatar" on storage.objects;
create policy "Group owners can upload group avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'groups'
    and public.user_is_group_conversation_owner(((storage.foldername(name))[2])::uuid)
  );

drop policy if exists "Group owners can update group avatar" on storage.objects;
create policy "Group owners can update group avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'groups'
    and public.user_is_group_conversation_owner(((storage.foldername(name))[2])::uuid)
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'groups'
    and public.user_is_group_conversation_owner(((storage.foldername(name))[2])::uuid)
  );

drop policy if exists "Group owners can delete group avatar" on storage.objects;
create policy "Group owners can delete group avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'groups'
    and public.user_is_group_conversation_owner(((storage.foldername(name))[2])::uuid)
  );

drop policy if exists "Club owners can upload club avatar" on storage.objects;
create policy "Club owners can upload club avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'clubs'
    and public.user_is_book_club_owner(((storage.foldername(name))[2])::uuid)
  );

drop policy if exists "Club owners can update club avatar" on storage.objects;
create policy "Club owners can update club avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'clubs'
    and public.user_is_book_club_owner(((storage.foldername(name))[2])::uuid)
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'clubs'
    and public.user_is_book_club_owner(((storage.foldername(name))[2])::uuid)
  );

drop policy if exists "Club owners can delete club avatar" on storage.objects;
create policy "Club owners can delete club avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'clubs'
    and public.user_is_book_club_owner(((storage.foldername(name))[2])::uuid)
  );
