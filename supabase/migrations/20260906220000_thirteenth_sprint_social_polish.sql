-- Thirteenth sprint: social-only notifications, per-creator post alerts,
-- session_date for streaks, and structured Feed share sources.
-- Additive only. Existing notification rows are left in place.

-- ---------------------------------------------------------------------------
-- reading_sessions: local calendar day + activity kind
-- Historical session_date is derived from created_at (UTC date). New writes
-- send the client's local calendar date. This is not a streak-table rewrite.
-- ---------------------------------------------------------------------------
alter table public.reading_sessions
  add column if not exists session_date date;

alter table public.reading_sessions
  add column if not exists activity_kind text not null default 'session';

update public.reading_sessions
  set session_date = (created_at at time zone 'utc')::date
  where session_date is null;

alter table public.reading_sessions
  alter column session_date set default (timezone('utc', now()))::date;

alter table public.reading_sessions
  alter column session_date set not null;

alter table public.reading_sessions
  drop constraint if exists reading_sessions_activity_kind_check;

alter table public.reading_sessions
  add constraint reading_sessions_activity_kind_check
  check (activity_kind in ('session', 'progress', 'completion', 'import', 'backfill', 'correction'));

create index if not exists reading_sessions_user_session_date_idx
  on public.reading_sessions (user_id, session_date desc);

-- ---------------------------------------------------------------------------
-- posts: structured share source for review/note dedup
-- ---------------------------------------------------------------------------
alter table public.posts
  add column if not exists source_type text;

alter table public.posts
  add column if not exists source_id uuid;

alter table public.posts
  drop constraint if exists posts_source_type_check;

alter table public.posts
  add constraint posts_source_type_check
  check (source_type is null or source_type in ('review', 'note', 'post'));

create unique index if not exists posts_user_source_unique
  on public.posts (user_id, source_type, source_id)
  where source_type is not null and source_id is not null;

-- ---------------------------------------------------------------------------
-- per-creator post notification preferences
-- ---------------------------------------------------------------------------
create table if not exists public.post_notification_preferences (
  subscriber_id uuid not null references auth.users (id) on delete cascade,
  creator_id uuid not null references auth.users (id) on delete cascade,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (subscriber_id, creator_id),
  constraint post_notification_preferences_not_self check (subscriber_id <> creator_id)
);

create index if not exists post_notification_preferences_creator_idx
  on public.post_notification_preferences (creator_id)
  where enabled = true;

alter table public.post_notification_preferences enable row level security;

drop policy if exists "post_notification_preferences_select_own" on public.post_notification_preferences;
create policy "post_notification_preferences_select_own"
  on public.post_notification_preferences for select
  to authenticated
  using (auth.uid() = subscriber_id);

drop policy if exists "post_notification_preferences_insert_own" on public.post_notification_preferences;
create policy "post_notification_preferences_insert_own"
  on public.post_notification_preferences for insert
  to authenticated
  with check (
    auth.uid() = subscriber_id
    and subscriber_id <> creator_id
    and exists (
      select 1 from public.follows f
      where f.follower_id = subscriber_id
        and f.following_id = creator_id
    )
  );

drop policy if exists "post_notification_preferences_update_own" on public.post_notification_preferences;
create policy "post_notification_preferences_update_own"
  on public.post_notification_preferences for update
  to authenticated
  using (auth.uid() = subscriber_id)
  with check (auth.uid() = subscriber_id);

drop policy if exists "post_notification_preferences_delete_own" on public.post_notification_preferences;
create policy "post_notification_preferences_delete_own"
  on public.post_notification_preferences for delete
  to authenticated
  using (auth.uid() = subscriber_id);

drop trigger if exists post_notification_preferences_set_updated_at on public.post_notification_preferences;
create trigger post_notification_preferences_set_updated_at
  before update on public.post_notification_preferences
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- create_notification: standard in-app notifs are social-only
-- Club notifications stay. Auth emails are not this function.
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
  v_dedup_key text;
  v_kind text;
  v_club_id uuid;
  v_member_level text;
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

  v_kind := coalesce(nullif(trim(coalesce(p_metadata, '{}'::jsonb)->>'notification_kind'), ''), p_type);

  -- Standard notifications: message, follow, post like/comment, new post.
  -- Review/shelf/start/finish/progress/mentions do not create new rows.
  if p_type = 'club' then
    null;
  elsif p_type = 'message' then
    v_kind := 'message';
  elsif p_type = 'follow' then
    v_kind := 'follow';
  elsif v_kind not in (
    'message', 'follow', 'post_like', 'post_comment', 'post_comment_reply', 'post_published'
  ) then
    return null;
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

  if p_type = 'feed' then
    if v_kind in ('post_like') then
      if not exists (
        select 1 from public.profiles where id = p_user_id and notify_likes = true
      ) then
        return null;
      end if;
    elsif v_kind in ('post_comment', 'post_comment_reply') then
      if not exists (
        select 1 from public.profiles where id = p_user_id and notify_comments = true
      ) then
        return null;
      end if;
    elsif v_kind = 'post_published' then
      if not exists (
        select 1
        from public.post_notification_preferences pnp
        where pnp.subscriber_id = p_user_id
          and pnp.creator_id = v_actor
          and pnp.enabled = true
      ) then
        return null;
      end if;
    end if;
  end if;

  if p_type = 'club' then
    if not exists (
      select 1 from public.profiles where id = p_user_id and notify_clubs = true
    ) then
      return null;
    end if;

    v_club_id := nullif(coalesce(p_metadata, '{}'::jsonb)->>'club_id', '')::uuid;
    if v_club_id is not null then
      select level into v_member_level
      from public.book_club_member_notification_prefs
      where club_id = v_club_id and user_id = p_user_id;

      if v_member_level = 'off' then
        return null;
      end if;

      if coalesce(v_member_level, 'important') = 'important'
         and coalesce(p_metadata->>'priority', 'important') = 'low' then
        return null;
      end if;

      if v_member_level = 'mentions'
         and coalesce(p_metadata->>'kind', '') not in ('mention', 'discussion_reply', 'invitation') then
        return null;
      end if;
    end if;
  end if;

  v_dedup_key := coalesce(p_metadata, '{}'::jsonb)->>'dedup_key';
  if v_dedup_key is not null and exists (
    select 1
    from public.notifications n
    where n.user_id = p_user_id
      and n.metadata_json->>'dedup_key' = v_dedup_key
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

-- Activity (review/shelf/start/finish/progress) stays on Feed, not the bell.
create or replace function public.notify_followers_of_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  return NEW;
end;
$$;

-- ---------------------------------------------------------------------------
-- Notify subscribers when a visible Feed post is published
-- ---------------------------------------------------------------------------
create or replace function public.notify_post_subscribers()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_name text;
  subscriber_id uuid;
begin
  select coalesce(nullif(trim(display_name), ''), nullif(trim(username), ''), 'A reader')
  into actor_name
  from public.profiles
  where id = NEW.user_id;

  for subscriber_id in
    select pnp.subscriber_id
    from public.post_notification_preferences pnp
    where pnp.creator_id = NEW.user_id
      and pnp.enabled = true
      and pnp.subscriber_id <> NEW.user_id
      and exists (
        select 1 from public.profiles p
        where p.id = pnp.subscriber_id
      )
      and exists (
        select 1 from public.follows f
        where f.follower_id = pnp.subscriber_id
          and f.following_id = NEW.user_id
      )
      and public.post_visible_to_viewer(NEW.id, pnp.subscriber_id)
      and not exists (
        select 1 from public.user_blocks b
        where (b.blocker_id = pnp.subscriber_id and b.blocked_id = NEW.user_id)
           or (b.blocker_id = NEW.user_id and b.blocked_id = pnp.subscriber_id)
      )
  loop
    perform public.create_notification(
      subscriber_id,
      'feed',
      actor_name || ' posted something new.',
      'Tap to view the post.',
      NEW.user_id,
      '/feed/?post=' || NEW.id::text,
      jsonb_build_object(
        'post_id', NEW.id,
        'notification_kind', 'post_published',
        'dedup_key', 'post_published:' || NEW.id::text || ':' || subscriber_id::text
      )
    );
  end loop;

  return NEW;
end;
$$;

drop trigger if exists posts_notify_subscribers on public.posts;
create trigger posts_notify_subscribers
  after insert on public.posts
  for each row execute function public.notify_post_subscribers();

-- Hide Feed representation when a shared review/note becomes private.
create or replace function public.hide_private_source_posts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_TABLE_NAME = 'reviews' then
    if NEW.visibility is distinct from 'public' then
      delete from public.posts
      where source_type = 'review'
        and source_id = NEW.id;
    end if;
  elsif TG_TABLE_NAME = 'reading_notes' then
    if NEW.visibility is distinct from 'public' then
      delete from public.posts
      where source_type = 'note'
        and source_id = NEW.id;
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists reviews_hide_private_source_posts on public.reviews;
create trigger reviews_hide_private_source_posts
  after update of visibility on public.reviews
  for each row execute function public.hide_private_source_posts();

drop trigger if exists reading_notes_hide_private_source_posts on public.reading_notes;
create trigger reading_notes_hide_private_source_posts
  after update of visibility on public.reading_notes
  for each row execute function public.hide_private_source_posts();
