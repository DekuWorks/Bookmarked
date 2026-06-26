-- In-app notifications + profile notification preferences

-- ---------------------------------------------------------------------------
-- Profile preferences
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists notify_messages boolean not null default true;

alter table public.profiles
  add column if not exists notify_follows boolean not null default true;

alter table public.profiles
  add column if not exists notify_feed boolean not null default true;

alter table public.profiles
  add column if not exists notify_browser boolean not null default false;

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  actor_id uuid references public.profiles (id) on delete set null,
  link_url text,
  metadata_json jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_type_check check (type in ('message', 'follow', 'feed'))
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, read_at)
  where read_at is null;

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

alter table public.notifications replica identity full;

-- ---------------------------------------------------------------------------
-- create_notification (security definer — used by app + triggers)
-- ---------------------------------------------------------------------------
create or replace function public.create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_actor_id uuid default null,
  p_link_url text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_actor uuid;
begin
  v_actor := coalesce(p_actor_id, auth.uid());

  if p_user_id is null or v_actor is null then
    return null;
  end if;

  if p_user_id = v_actor then
    return null;
  end if;

  if auth.uid() is not null and v_actor is distinct from auth.uid() then
    raise exception 'Forbidden';
  end if;

  if p_type = 'message' and not exists (
    select 1 from public.profiles where id = p_user_id and notify_messages = true
  ) then
    return null;
  end if;

  if p_type = 'follow' and not exists (
    select 1 from public.profiles where id = p_user_id and notify_follows = true
  ) then
    return null;
  end if;

  if p_type = 'feed' and not exists (
    select 1 from public.profiles where id = p_user_id and notify_feed = true
  ) then
    return null;
  end if;

  insert into public.notifications (
    user_id, type, title, body, actor_id, link_url, metadata_json
  )
  values (
    p_user_id, p_type, p_title, p_body, v_actor, p_link_url, coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.create_notification(uuid, text, text, text, uuid, text, jsonb) from public;
grant execute on function public.create_notification(uuid, text, text, text, uuid, text, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Notify followers when followed users share feed-eligible activity
-- ---------------------------------------------------------------------------
create or replace function public.notify_followers_of_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_name text;
  activity_body text;
  actor_username text;
begin
  if NEW.visibility = 'private' then
    return NEW;
  end if;

  if NEW.event_type not in (
    'book_added', 'shelf_updated', 'book_finished', 'reading_finished',
    'reading_started', 'review_created', 'review_added', 'review_updated'
  ) then
    return NEW;
  end if;

  select
    coalesce(nullif(trim(display_name), ''), nullif(trim(username), ''), 'A reader'),
    nullif(trim(username), '')
  into actor_name, actor_username
  from public.profiles
  where id = NEW.user_id;

  activity_body := case NEW.event_type
    when 'review_created' then actor_name || ' wrote a review'
    when 'review_updated' then actor_name || ' updated a review'
    when 'review_added' then actor_name || ' wrote a review'
    when 'book_finished' then actor_name || ' finished a book'
    when 'reading_finished' then actor_name || ' finished a book'
    when 'reading_started' then actor_name || ' started reading a book'
    when 'book_added' then actor_name || ' added a book to their library'
    when 'shelf_updated' then actor_name || ' updated their shelves'
    else actor_name || ' shared a reading update'
  end;

  insert into public.notifications (
    user_id, type, title, body, actor_id, link_url, metadata_json
  )
  select
    f.follower_id,
    'feed',
    'New from ' || actor_name,
    activity_body,
    NEW.user_id,
    case
      when actor_username is not null then '/reader/?username=' || actor_username
      else '/feed/'
    end,
    jsonb_build_object(
      'activity_id', NEW.id,
      'event_type', NEW.event_type
    )
  from public.follows f
  inner join public.profiles fp on fp.id = f.follower_id
  where f.following_id = NEW.user_id
    and f.follower_id <> NEW.user_id
    and fp.notify_feed = true;

  return NEW;
end;
$$;

drop trigger if exists activity_events_notify_followers on public.activity_events;
create trigger activity_events_notify_followers
  after insert on public.activity_events
  for each row execute function public.notify_followers_of_activity();
