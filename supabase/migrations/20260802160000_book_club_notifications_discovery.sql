-- Club notifications preference + invitation/announcement/event triggers.
-- Extends create_notification for type=club and notify_clubs.

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

      -- Important-only: skip low-priority kinds
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

create or replace function public.notify_book_club_invitation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_club_name text;
  v_actor_name text;
begin
  if new.status <> 'pending' then
    return new;
  end if;

  select name into v_club_name from public.book_clubs where id = new.club_id;
  select coalesce(nullif(trim(display_name), ''), nullif(trim(username), ''), 'A reader')
  into v_actor_name
  from public.profiles where id = new.inviter_id;

  perform public.create_notification(
    new.invitee_id,
    'club',
    'Book club invitation',
    v_actor_name || ' invited you to join ' || coalesce(v_club_name, 'a book club'),
    new.inviter_id,
    '/clubs/',
    jsonb_build_object(
      'club_id', new.club_id,
      'invitation_id', new.id,
      'kind', 'invitation',
      'priority', 'important',
      'dedup_key', 'club_invite:' || new.id::text
    )
  );

  return new;
end;
$$;

drop trigger if exists book_club_invitations_notify on public.book_club_invitations;
create trigger book_club_invitations_notify
  after insert on public.book_club_invitations
  for each row execute function public.notify_book_club_invitation();

create or replace function public.notify_book_club_announcement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_club_name text;
  v_member record;
begin
  select name into v_club_name from public.book_clubs where id = new.club_id;

  for v_member in
    select user_id from public.book_club_members
    where club_id = new.club_id
      and membership_status = 'active'
      and user_id <> new.created_by
  loop
    perform public.create_notification(
      v_member.user_id,
      'club',
      'Club announcement',
      coalesce(v_club_name, 'Your club') || ': ' || left(new.title, 80),
      new.created_by,
      '/clubs/club/?id=' || new.club_id::text,
      jsonb_build_object(
        'club_id', new.club_id,
        'announcement_id', new.id,
        'kind', 'announcement',
        'priority', 'important',
        'dedup_key', 'club_announcement:' || new.id::text || ':' || v_member.user_id::text
      )
    );
  end loop;

  return new;
end;
$$;

drop trigger if exists book_club_announcements_notify on public.book_club_announcements;
create trigger book_club_announcements_notify
  after insert on public.book_club_announcements
  for each row execute function public.notify_book_club_announcement();

create or replace function public.notify_book_club_event_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_club_name text;
  v_member record;
begin
  select name into v_club_name from public.book_clubs where id = new.club_id;

  for v_member in
    select user_id from public.book_club_members
    where club_id = new.club_id
      and membership_status = 'active'
      and user_id <> new.created_by
  loop
    perform public.create_notification(
      v_member.user_id,
      'club',
      'New club event',
      coalesce(v_club_name, 'Your club') || ': ' || left(new.title, 80),
      new.created_by,
      '/clubs/club/?id=' || new.club_id::text || '&tab=schedule',
      jsonb_build_object(
        'club_id', new.club_id,
        'event_id', new.id,
        'kind', 'event_created',
        'priority', 'important',
        'dedup_key', 'club_event:' || new.id::text || ':' || v_member.user_id::text
      )
    );
  end loop;

  return new;
end;
$$;

drop trigger if exists book_club_events_notify on public.book_club_events;
create trigger book_club_events_notify
  after insert on public.book_club_events
  for each row execute function public.notify_book_club_event_created();

-- Discovery helper: public clubs ordered by member_count / recency
create or replace function public.discover_trending_book_clubs(p_limit integer default 12)
returns setof public.book_clubs
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.book_clubs
  where visibility = 'public'
    and status = 'active'
  order by member_count desc, updated_at desc
  limit greatest(1, least(coalesce(p_limit, 12), 50));
$$;

grant execute on function public.discover_trending_book_clubs(integer) to authenticated;
