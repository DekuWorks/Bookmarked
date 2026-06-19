-- Per-shelf visibility on profiles + RLS for viewing other users' shelves

alter table public.profiles
  add column if not exists shelf_visibility_want_to_read text not null default 'public',
  add column if not exists shelf_visibility_currently_reading text not null default 'public',
  add column if not exists shelf_visibility_read text not null default 'public';

alter table public.profiles
  drop constraint if exists profiles_shelf_vis_wtr_check;

alter table public.profiles
  add constraint profiles_shelf_vis_wtr_check
  check (shelf_visibility_want_to_read in ('public', 'followers', 'private'));

alter table public.profiles
  drop constraint if exists profiles_shelf_vis_cr_check;

alter table public.profiles
  add constraint profiles_shelf_vis_cr_check
  check (shelf_visibility_currently_reading in ('public', 'followers', 'private'));

alter table public.profiles
  drop constraint if exists profiles_shelf_vis_read_check;

alter table public.profiles
  add constraint profiles_shelf_vis_read_check
  check (shelf_visibility_read in ('public', 'followers', 'private'));

create or replace function public.shelf_visible_to_viewer(
  p_owner_id uuid,
  p_shelf_status text,
  p_viewer_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_vis text;
begin
  if p_viewer_id is null then
    return false;
  end if;

  if p_viewer_id = p_owner_id then
    return true;
  end if;

  select case p_shelf_status
    when 'want_to_read' then coalesce(shelf_visibility_want_to_read, 'public')
    when 'currently_reading' then coalesce(shelf_visibility_currently_reading, 'public')
    when 'read' then coalesce(shelf_visibility_read, 'public')
    else 'private'
  end into v_vis
  from public.profiles
  where id = p_owner_id;

  if v_vis is null or v_vis = 'private' then
    return false;
  end if;

  if v_vis = 'public' then
    return true;
  end if;

  return exists (
    select 1
    from public.follows
    where follower_id = p_viewer_id
      and following_id = p_owner_id
  );
end;
$$;

drop policy if exists "user_books_select_visible_shelves" on public.user_books;

create policy "user_books_select_visible_shelves"
  on public.user_books for select
  using (public.shelf_visible_to_viewer(user_id, shelf_status, auth.uid()));
