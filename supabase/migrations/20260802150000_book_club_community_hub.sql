-- Book Club Community Hub: additive schema, RLS, and RPCs.
-- Preserves existing clubs, memberships, posts, and events.

-- =============================================================================
-- 1. Extend book_clubs
-- =============================================================================
alter table public.book_clubs
  add column if not exists banner_url text,
  add column if not exists join_policy text,
  add column if not exists status text not null default 'active',
  add column if not exists genre_tags text[] not null default '{}',
  add column if not exists meeting_frequency text,
  add column if not exists member_count integer not null default 0;

alter table public.book_clubs
  drop constraint if exists book_clubs_visibility_check;

alter table public.book_clubs
  add constraint book_clubs_visibility_check
  check (visibility in ('public', 'private', 'invite_only'));

alter table public.book_clubs
  drop constraint if exists book_clubs_join_policy_check;

alter table public.book_clubs
  add constraint book_clubs_join_policy_check
  check (join_policy is null or join_policy in ('open', 'request_approval', 'invitation_only'));

alter table public.book_clubs
  drop constraint if exists book_clubs_status_check;

alter table public.book_clubs
  add constraint book_clubs_status_check
  check (status in ('active', 'archived'));

update public.book_clubs
set join_policy = case
  when visibility = 'public' then 'open'
  else 'invitation_only'
end
where join_policy is null;

alter table public.book_clubs
  alter column join_policy set default 'open';

alter table public.book_clubs
  alter column join_policy set not null;

-- =============================================================================
-- 2. Extend book_club_members
-- =============================================================================
alter table public.book_club_members
  add column if not exists membership_status text not null default 'active',
  add column if not exists invited_by uuid references auth.users (id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

alter table public.book_club_members
  drop constraint if exists book_club_members_role_check;

alter table public.book_club_members
  add constraint book_club_members_role_check
  check (role in ('owner', 'host', 'moderator', 'member'));

alter table public.book_club_members
  drop constraint if exists book_club_members_status_check;

alter table public.book_club_members
  add constraint book_club_members_status_check
  check (membership_status in (
    'active', 'invited', 'requested', 'declined', 'removed', 'left', 'banned'
  ));

drop trigger if exists book_club_members_set_updated_at on public.book_club_members;
create trigger book_club_members_set_updated_at
  before update on public.book_club_members
  for each row execute function public.set_updated_at();

update public.book_clubs c
set member_count = (
  select count(*)::integer
  from public.book_club_members m
  where m.club_id = c.id
    and m.membership_status = 'active'
);

-- =============================================================================
-- 3. Member count trigger + helpers
-- =============================================================================
create or replace function public.user_is_active_club_member(p_club_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.book_club_members m
    where m.club_id = p_club_id
      and m.user_id = auth.uid()
      and m.membership_status = 'active'
  );
$$;

create or replace function public.user_has_club_role(p_club_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.book_club_members m
    where m.club_id = p_club_id
      and m.user_id = auth.uid()
      and m.membership_status = 'active'
      and m.role = any (p_roles)
  )
  or exists (
    select 1
    from public.book_clubs c
    where c.id = p_club_id
      and c.owner_id = auth.uid()
  );
$$;

-- Keep legacy helper aligned with active membership
create or replace function public.user_is_club_member(p_club_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.user_is_active_club_member(p_club_id);
$$;

create or replace function public.refresh_book_club_member_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_club_id uuid;
begin
  v_club_id := coalesce(new.club_id, old.club_id);
  update public.book_clubs
  set member_count = (
    select count(*)::integer
    from public.book_club_members m
    where m.club_id = v_club_id
      and m.membership_status = 'active'
  ),
  updated_at = now()
  where id = v_club_id;
  return coalesce(new, old);
end;
$$;

drop trigger if exists book_club_members_refresh_count on public.book_club_members;
create trigger book_club_members_refresh_count
  after insert or update of membership_status or delete
  on public.book_club_members
  for each row execute function public.refresh_book_club_member_count();

-- =============================================================================
-- 4. Invitations + join requests
-- =============================================================================
create table if not exists public.book_club_invitations (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.book_clubs (id) on delete cascade,
  inviter_id uuid not null references auth.users (id) on delete cascade,
  invitee_id uuid not null references auth.users (id) on delete cascade,
  message text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint book_club_invitations_status_check
    check (status in ('pending', 'accepted', 'declined', 'expired', 'canceled')),
  constraint book_club_invitations_not_self check (inviter_id <> invitee_id)
);

create unique index if not exists book_club_invitations_pending_unique
  on public.book_club_invitations (club_id, invitee_id)
  where status = 'pending';

create index if not exists book_club_invitations_invitee_idx
  on public.book_club_invitations (invitee_id, created_at desc);

create index if not exists book_club_invitations_club_idx
  on public.book_club_invitations (club_id, created_at desc);

drop trigger if exists book_club_invitations_set_updated_at on public.book_club_invitations;
create trigger book_club_invitations_set_updated_at
  before update on public.book_club_invitations
  for each row execute function public.set_updated_at();

alter table public.book_club_invitations
  drop constraint if exists book_club_invitations_invitee_profiles_fkey;
alter table public.book_club_invitations
  add constraint book_club_invitations_invitee_profiles_fkey
  foreign key (invitee_id) references public.profiles (id) on delete cascade;

alter table public.book_club_invitations
  drop constraint if exists book_club_invitations_inviter_profiles_fkey;
alter table public.book_club_invitations
  add constraint book_club_invitations_inviter_profiles_fkey
  foreign key (inviter_id) references public.profiles (id) on delete cascade;

create table if not exists public.book_club_join_requests (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.book_clubs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  message text,
  status text not null default 'pending',
  reviewed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  constraint book_club_join_requests_status_check
    check (status in ('pending', 'approved', 'declined', 'canceled'))
);

create unique index if not exists book_club_join_requests_pending_unique
  on public.book_club_join_requests (club_id, user_id)
  where status = 'pending';

create index if not exists book_club_join_requests_club_idx
  on public.book_club_join_requests (club_id, created_at desc);

create index if not exists book_club_join_requests_user_idx
  on public.book_club_join_requests (user_id, created_at desc);

drop trigger if exists book_club_join_requests_set_updated_at on public.book_club_join_requests;
create trigger book_club_join_requests_set_updated_at
  before update on public.book_club_join_requests
  for each row execute function public.set_updated_at();

alter table public.book_club_join_requests
  drop constraint if exists book_club_join_requests_user_profiles_fkey;
alter table public.book_club_join_requests
  add constraint book_club_join_requests_user_profiles_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;

-- =============================================================================
-- 5. Evolve posts → discussions (rename + columns)
-- =============================================================================
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'book_club_posts'
  ) and not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'book_club_discussions'
  ) then
    alter table public.book_club_posts rename to book_club_discussions;
  end if;
end $$;

alter table public.book_club_discussions
  add column if not exists title text,
  add column if not exists chapter_reference text,
  add column if not exists page_reference text,
  add column if not exists contains_spoilers boolean not null default false,
  add column if not exists is_pinned boolean not null default false,
  add column if not exists is_locked boolean not null default false,
  add column if not exists reply_count integer not null default 0,
  add column if not exists latest_activity_at timestamptz not null default now(),
  add column if not exists created_by uuid;

update public.book_club_discussions
set
  title = coalesce(nullif(trim(title), ''), left(trim(body), 80)),
  created_by = coalesce(created_by, user_id),
  latest_activity_at = coalesce(latest_activity_at, created_at)
where title is null or created_by is null;

alter table public.book_club_discussions
  alter column title set not null;

alter table public.book_club_discussions
  alter column created_by set not null;

-- Rename book_id → related_book_id for clarity (keep book_id as alias column sync)
alter table public.book_club_discussions
  add column if not exists related_book_id uuid references public.books (id) on delete set null;

update public.book_club_discussions
set related_book_id = book_id
where related_book_id is null and book_id is not null;

create index if not exists book_club_discussions_club_activity_idx
  on public.book_club_discussions (club_id, latest_activity_at desc);

create index if not exists book_club_discussions_club_pinned_idx
  on public.book_club_discussions (club_id, is_pinned desc, latest_activity_at desc);

-- Compatibility view for delete-account / older references
create or replace view public.book_club_posts
with (security_invoker = true)
as
select
  id,
  club_id,
  user_id,
  body,
  coalesce(related_book_id, book_id) as book_id,
  created_at,
  updated_at
from public.book_club_discussions;

create table if not exists public.book_club_discussion_replies (
  id uuid primary key default gen_random_uuid(),
  discussion_id uuid not null references public.book_club_discussions (id) on delete cascade,
  club_id uuid not null references public.book_clubs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  contains_spoilers boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint book_club_discussion_replies_body_not_empty
    check (char_length(trim(body)) > 0)
);

create index if not exists book_club_discussion_replies_discussion_idx
  on public.book_club_discussion_replies (discussion_id, created_at asc);

create index if not exists book_club_discussion_replies_club_idx
  on public.book_club_discussion_replies (club_id, created_at desc);

drop trigger if exists book_club_discussion_replies_set_updated_at on public.book_club_discussion_replies;
create trigger book_club_discussion_replies_set_updated_at
  before update on public.book_club_discussion_replies
  for each row execute function public.set_updated_at();

alter table public.book_club_discussion_replies
  drop constraint if exists book_club_discussion_replies_user_profiles_fkey;
alter table public.book_club_discussion_replies
  add constraint book_club_discussion_replies_user_profiles_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;

create or replace function public.touch_discussion_on_reply()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.book_club_discussions
    set reply_count = reply_count + 1,
        latest_activity_at = new.created_at,
        updated_at = now()
    where id = new.discussion_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.book_club_discussions
    set reply_count = greatest(reply_count - 1, 0),
        updated_at = now()
    where id = old.discussion_id;
    return old;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists book_club_discussion_replies_touch on public.book_club_discussion_replies;
create trigger book_club_discussion_replies_touch
  after insert or delete on public.book_club_discussion_replies
  for each row execute function public.touch_discussion_on_reply();

create table if not exists public.book_club_discussion_reactions (
  id uuid primary key default gen_random_uuid(),
  discussion_id uuid references public.book_club_discussions (id) on delete cascade,
  reply_id uuid references public.book_club_discussion_replies (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  constraint book_club_discussion_reactions_target_check
    check (
      (discussion_id is not null and reply_id is null)
      or (discussion_id is null and reply_id is not null)
    ),
  constraint book_club_discussion_reactions_emoji_not_empty
    check (char_length(trim(emoji)) > 0)
);

create unique index if not exists book_club_discussion_reactions_discussion_unique
  on public.book_club_discussion_reactions (discussion_id, user_id, emoji)
  where discussion_id is not null;

create unique index if not exists book_club_discussion_reactions_reply_unique
  on public.book_club_discussion_reactions (reply_id, user_id, emoji)
  where reply_id is not null;

alter table public.book_club_discussion_reactions
  drop constraint if exists book_club_discussion_reactions_user_profiles_fkey;
alter table public.book_club_discussion_reactions
  add constraint book_club_discussion_reactions_user_profiles_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;

-- Realtime: discussions (renamed from posts)
alter table public.book_club_discussions replica identity full;
do $$
begin
  begin
    alter publication supabase_realtime drop table public.book_club_posts;
  exception when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.book_club_discussions;
  exception when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.book_club_discussion_replies;
  exception when others then null;
  end;
end $$;

-- =============================================================================
-- 6. Extend events + attendees
-- =============================================================================
alter table public.book_club_events
  add column if not exists event_type text not null default 'meeting',
  add column if not exists timezone text not null default 'UTC',
  add column if not exists reading_assignment text,
  add column if not exists meeting_platform text,
  add column if not exists reminder_config jsonb not null default '{}'::jsonb;

alter table public.book_club_events
  drop constraint if exists book_club_events_type_check;

alter table public.book_club_events
  add constraint book_club_events_type_check
  check (event_type in (
    'reading_deadline', 'discussion', 'meeting', 'readathon', 'announcement', 'other'
  ));

alter table public.book_club_events
  drop constraint if exists book_club_events_platform_check;

alter table public.book_club_events
  add constraint book_club_events_platform_check
  check (
    meeting_platform is null
    or meeting_platform in ('zoom', 'google_meet', 'microsoft_teams', 'other')
  );

create table if not exists public.book_club_event_attendees (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.book_club_events (id) on delete cascade,
  club_id uuid not null references public.book_clubs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rsvp_status text not null default 'going',
  reminder_at timestamptz,
  reminder_canceled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, user_id),
  constraint book_club_event_attendees_rsvp_check
    check (rsvp_status in ('going', 'maybe', 'not_going'))
);

create index if not exists book_club_event_attendees_event_idx
  on public.book_club_event_attendees (event_id);

create index if not exists book_club_event_attendees_user_idx
  on public.book_club_event_attendees (user_id);

drop trigger if exists book_club_event_attendees_set_updated_at on public.book_club_event_attendees;
create trigger book_club_event_attendees_set_updated_at
  before update on public.book_club_event_attendees
  for each row execute function public.set_updated_at();

alter table public.book_club_event_attendees
  drop constraint if exists book_club_event_attendees_user_profiles_fkey;
alter table public.book_club_event_attendees
  add constraint book_club_event_attendees_user_profiles_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;

-- =============================================================================
-- 7. Announcements, bookshelf, current reads, activity, chat link, settings
-- =============================================================================
create table if not exists public.book_club_announcements (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.book_clubs (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  title text not null,
  body text not null,
  linked_event_id uuid references public.book_club_events (id) on delete set null,
  related_book_id uuid references public.books (id) on delete set null,
  is_pinned boolean not null default false,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint book_club_announcements_title_not_empty check (char_length(trim(title)) > 0),
  constraint book_club_announcements_body_not_empty check (char_length(trim(body)) > 0)
);

create index if not exists book_club_announcements_club_idx
  on public.book_club_announcements (club_id, published_at desc);

drop trigger if exists book_club_announcements_set_updated_at on public.book_club_announcements;
create trigger book_club_announcements_set_updated_at
  before update on public.book_club_announcements
  for each row execute function public.set_updated_at();

create table if not exists public.book_club_books (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.book_clubs (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  category text not null default 'suggested',
  added_by uuid not null references auth.users (id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (club_id, book_id),
  constraint book_club_books_category_check
    check (category in (
      'current_read', 'upcoming', 'previous', 'suggested', 'optional'
    ))
);

create index if not exists book_club_books_club_category_idx
  on public.book_club_books (club_id, category, sort_order);

drop trigger if exists book_club_books_set_updated_at on public.book_club_books;
create trigger book_club_books_set_updated_at
  before update on public.book_club_books
  for each row execute function public.set_updated_at();

-- Seed shelf from current_book_id
insert into public.book_club_books (club_id, book_id, category, added_by)
select c.id, c.current_book_id, 'current_read', c.owner_id
from public.book_clubs c
where c.current_book_id is not null
on conflict (club_id, book_id) do nothing;

create table if not exists public.book_club_current_reads (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.book_clubs (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  started_at timestamptz,
  target_finish_at timestamptz,
  chapters_assigned text,
  pages_assigned text,
  is_current boolean not null default true,
  archived_at timestamptz,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists book_club_current_reads_one_current
  on public.book_club_current_reads (club_id)
  where is_current = true;

create index if not exists book_club_current_reads_club_idx
  on public.book_club_current_reads (club_id, created_at desc);

drop trigger if exists book_club_current_reads_set_updated_at on public.book_club_current_reads;
create trigger book_club_current_reads_set_updated_at
  before update on public.book_club_current_reads
  for each row execute function public.set_updated_at();

insert into public.book_club_current_reads (
  club_id, book_id, is_current, created_by, started_at
)
select c.id, c.current_book_id, true, c.owner_id, c.created_at
from public.book_clubs c
where c.current_book_id is not null
  and not exists (
    select 1 from public.book_club_current_reads r
    where r.club_id = c.id and r.is_current = true
  );

create table if not exists public.book_club_activity (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.book_clubs (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  activity_type text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists book_club_activity_club_created_idx
  on public.book_club_activity (club_id, created_at desc);

create table if not exists public.book_club_group_conversations (
  club_id uuid primary key references public.book_clubs (id) on delete cascade,
  conversation_id uuid not null unique references public.conversations (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.book_club_settings (
  club_id uuid primary key references public.book_clubs (id) on delete cascade,
  allow_member_suggestions boolean not null default true,
  hosts_can_approve_requests boolean not null default true,
  default_notification_level text not null default 'important',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint book_club_settings_notify_level_check
    check (default_notification_level in ('all', 'important', 'mentions', 'off'))
);

drop trigger if exists book_club_settings_set_updated_at on public.book_club_settings;
create trigger book_club_settings_set_updated_at
  before update on public.book_club_settings
  for each row execute function public.set_updated_at();

insert into public.book_club_settings (club_id)
select id from public.book_clubs
on conflict (club_id) do nothing;

create table if not exists public.book_club_member_notification_prefs (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.book_clubs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  level text not null default 'important',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (club_id, user_id),
  constraint book_club_member_notification_prefs_level_check
    check (level in ('all', 'important', 'mentions', 'off'))
);

drop trigger if exists book_club_member_notification_prefs_set_updated_at
  on public.book_club_member_notification_prefs;
create trigger book_club_member_notification_prefs_set_updated_at
  before update on public.book_club_member_notification_prefs
  for each row execute function public.set_updated_at();

-- =============================================================================
-- 8. Notifications type expansion
-- =============================================================================
alter table public.profiles
  add column if not exists notify_clubs boolean not null default true;

alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in ('message', 'follow', 'feed', 'club'));

-- =============================================================================
-- 9. RPCs: invitations, join requests, ownership transfer, ensure club chat
-- =============================================================================
create or replace function public.sync_book_club_conversation_participant(
  p_club_id uuid,
  p_user_id uuid,
  p_add boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conversation_id uuid;
begin
  select conversation_id into v_conversation_id
  from public.book_club_group_conversations
  where club_id = p_club_id;

  if v_conversation_id is null then
    return;
  end if;

  if p_add then
    insert into public.conversation_participants (conversation_id, user_id, role)
    values (v_conversation_id, p_user_id, 'member')
    on conflict (conversation_id, user_id) do nothing;
  else
    delete from public.conversation_participants
    where conversation_id = v_conversation_id
      and user_id = p_user_id;
  end if;
end;
$$;

create or replace function public.accept_book_club_invitation(p_invitation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv public.book_club_invitations%rowtype;
  v_member_id uuid;
begin
  select * into v_inv
  from public.book_club_invitations
  where id = p_invitation_id
  for update;

  if not found then
    raise exception 'Invitation not found';
  end if;
  if v_inv.invitee_id <> auth.uid() then
    raise exception 'Forbidden';
  end if;
  if v_inv.status <> 'pending' then
    raise exception 'Invitation is not pending';
  end if;

  update public.book_club_invitations
  set status = 'accepted', responded_at = now()
  where id = p_invitation_id;

  insert into public.book_club_members (club_id, user_id, role, membership_status, invited_by)
  values (v_inv.club_id, v_inv.invitee_id, 'member', 'active', v_inv.inviter_id)
  on conflict (club_id, user_id) do update
  set membership_status = 'active',
      role = case
        when book_club_members.role = 'owner' then 'owner'
        else 'member'
      end,
      invited_by = coalesce(book_club_members.invited_by, excluded.invited_by),
      updated_at = now()
  returning id into v_member_id;

  perform public.sync_book_club_conversation_participant(v_inv.club_id, v_inv.invitee_id, true);

  return v_member_id;
end;
$$;

create or replace function public.decline_book_club_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv public.book_club_invitations%rowtype;
begin
  select * into v_inv from public.book_club_invitations where id = p_invitation_id for update;
  if not found then raise exception 'Invitation not found'; end if;
  if v_inv.invitee_id <> auth.uid() then raise exception 'Forbidden'; end if;
  if v_inv.status <> 'pending' then raise exception 'Invitation is not pending'; end if;
  update public.book_club_invitations
  set status = 'declined', responded_at = now()
  where id = p_invitation_id;
end;
$$;

create or replace function public.approve_book_club_join_request(p_request_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req public.book_club_join_requests%rowtype;
  v_member_id uuid;
  v_hosts_ok boolean;
begin
  select * into v_req from public.book_club_join_requests where id = p_request_id for update;
  if not found then raise exception 'Request not found'; end if;
  if v_req.status <> 'pending' then raise exception 'Request is not pending'; end if;

  select coalesce(s.hosts_can_approve_requests, true) into v_hosts_ok
  from public.book_club_settings s where s.club_id = v_req.club_id;

  if not (
    public.user_has_club_role(v_req.club_id, array['owner'])
    or (coalesce(v_hosts_ok, true) and public.user_has_club_role(v_req.club_id, array['host']))
  ) then
    raise exception 'Forbidden';
  end if;

  update public.book_club_join_requests
  set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
  where id = p_request_id;

  insert into public.book_club_members (club_id, user_id, role, membership_status, invited_by)
  values (v_req.club_id, v_req.user_id, 'member', 'active', auth.uid())
  on conflict (club_id, user_id) do update
  set membership_status = 'active', updated_at = now()
  returning id into v_member_id;

  perform public.sync_book_club_conversation_participant(v_req.club_id, v_req.user_id, true);
  return v_member_id;
end;
$$;

create or replace function public.decline_book_club_join_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req public.book_club_join_requests%rowtype;
  v_hosts_ok boolean;
begin
  select * into v_req from public.book_club_join_requests where id = p_request_id for update;
  if not found then raise exception 'Request not found'; end if;
  if v_req.status <> 'pending' then raise exception 'Request is not pending'; end if;

  select coalesce(s.hosts_can_approve_requests, true) into v_hosts_ok
  from public.book_club_settings s where s.club_id = v_req.club_id;

  if not (
    public.user_has_club_role(v_req.club_id, array['owner'])
    or (coalesce(v_hosts_ok, true) and public.user_has_club_role(v_req.club_id, array['host']))
  ) then
    raise exception 'Forbidden';
  end if;

  update public.book_club_join_requests
  set status = 'declined', reviewed_by = auth.uid(), reviewed_at = now()
  where id = p_request_id;
end;
$$;

create or replace function public.transfer_book_club_ownership(p_club_id uuid, p_new_owner_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_club public.book_clubs%rowtype;
begin
  select * into v_club from public.book_clubs where id = p_club_id for update;
  if not found then raise exception 'Club not found'; end if;
  if v_club.owner_id <> auth.uid() then raise exception 'Forbidden'; end if;
  if p_new_owner_id = auth.uid() then raise exception 'Already owner'; end if;

  if not exists (
    select 1 from public.book_club_members
    where club_id = p_club_id
      and user_id = p_new_owner_id
      and membership_status = 'active'
  ) then
    raise exception 'New owner must be an active member';
  end if;

  update public.book_clubs set owner_id = p_new_owner_id where id = p_club_id;

  update public.book_club_members
  set role = 'member', updated_at = now()
  where club_id = p_club_id and user_id = auth.uid();

  update public.book_club_members
  set role = 'owner', updated_at = now()
  where club_id = p_club_id and user_id = p_new_owner_id;
end;
$$;

create or replace function public.ensure_book_club_group_conversation(p_club_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conversation_id uuid;
  v_club public.book_clubs%rowtype;
  v_member record;
begin
  if not public.user_is_active_club_member(p_club_id) then
    raise exception 'Forbidden';
  end if;

  select conversation_id into v_conversation_id
  from public.book_club_group_conversations
  where club_id = p_club_id;

  if v_conversation_id is not null then
    return v_conversation_id;
  end if;

  select * into v_club from public.book_clubs where id = p_club_id;
  if not found then raise exception 'Club not found'; end if;

  insert into public.conversations (type, title, created_by, avatar_url)
  values ('group', v_club.name, v_club.owner_id, v_club.image_url)
  returning id into v_conversation_id;

  insert into public.book_club_group_conversations (club_id, conversation_id)
  values (p_club_id, v_conversation_id);

  for v_member in
    select user_id, role
    from public.book_club_members
    where club_id = p_club_id and membership_status = 'active'
  loop
    insert into public.conversation_participants (conversation_id, user_id, role)
    values (
      v_conversation_id,
      v_member.user_id,
      case when v_member.role = 'owner' then 'owner' else 'member' end
    )
    on conflict (conversation_id, user_id) do nothing;
  end loop;

  return v_conversation_id;
end;
$$;

create or replace function public.set_book_club_current_read(
  p_club_id uuid,
  p_book_id uuid,
  p_started_at timestamptz default now(),
  p_target_finish_at timestamptz default null,
  p_chapters text default null,
  p_pages text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.user_has_club_role(p_club_id, array['owner', 'host']) then
    raise exception 'Forbidden';
  end if;

  update public.book_club_current_reads
  set is_current = false, archived_at = now()
  where club_id = p_club_id and is_current = true;

  update public.book_club_books
  set category = 'previous'
  where club_id = p_club_id and category = 'current_read';

  insert into public.book_club_current_reads (
    club_id, book_id, started_at, target_finish_at,
    chapters_assigned, pages_assigned, is_current, created_by
  ) values (
    p_club_id, p_book_id, p_started_at, p_target_finish_at,
    p_chapters, p_pages, true, auth.uid()
  )
  returning id into v_id;

  insert into public.book_club_books (club_id, book_id, category, added_by)
  values (p_club_id, p_book_id, 'current_read', auth.uid())
  on conflict (club_id, book_id) do update
  set category = 'current_read', updated_at = now();

  update public.book_clubs
  set current_book_id = p_book_id, updated_at = now()
  where id = p_club_id;

  return v_id;
end;
$$;

-- =============================================================================
-- 10. RLS policies
-- =============================================================================

-- book_clubs: allow invite_only discovery of safe rows for invitees via invitations
drop policy if exists "book_clubs_select_visible" on public.book_clubs;
create policy "book_clubs_select_visible"
  on public.book_clubs for select
  to authenticated
  using (
    visibility = 'public'
    or owner_id = auth.uid()
    or public.user_is_active_club_member(id)
    or exists (
      select 1 from public.book_club_invitations i
      where i.club_id = book_clubs.id
        and i.invitee_id = auth.uid()
        and i.status = 'pending'
    )
  );

drop policy if exists "book_clubs_update_owner" on public.book_clubs;
create policy "book_clubs_update_owner"
  on public.book_clubs for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- members
drop policy if exists "book_club_members_select_visible" on public.book_club_members;
create policy "book_club_members_select_visible"
  on public.book_club_members for select
  to authenticated
  using (
    public.user_is_active_club_member(club_id)
    or exists (
      select 1 from public.book_clubs c
      where c.id = club_id
        and (c.visibility = 'public' or c.owner_id = auth.uid())
    )
  );

drop policy if exists "book_club_members_insert" on public.book_club_members;
create policy "book_club_members_insert"
  on public.book_club_members for insert
  to authenticated
  with check (
    (
      auth.uid() = user_id
      and role = 'member'
      and membership_status = 'active'
      and exists (
        select 1 from public.book_clubs c
        where c.id = club_id
          and (
            (c.visibility = 'public' and c.join_policy = 'open')
            or c.owner_id = auth.uid()
          )
      )
    )
    or (
      role in ('member', 'moderator', 'host')
      and public.user_has_club_role(club_id, array['owner', 'host'])
    )
    or (
      auth.uid() = user_id
      and role = 'owner'
      and membership_status = 'active'
      and exists (
        select 1 from public.book_clubs c
        where c.id = club_id and c.owner_id = auth.uid()
      )
    )
  );

drop policy if exists "book_club_members_update" on public.book_club_members;
create policy "book_club_members_update"
  on public.book_club_members for update
  to authenticated
  using (
    public.user_has_club_role(club_id, array['owner', 'host'])
    or auth.uid() = user_id
  )
  with check (
    public.user_has_club_role(club_id, array['owner', 'host'])
    or (auth.uid() = user_id and role = (select m.role from public.book_club_members m where m.id = book_club_members.id))
  );

drop policy if exists "book_club_members_delete" on public.book_club_members;
create policy "book_club_members_delete"
  on public.book_club_members for delete
  to authenticated
  using (
    auth.uid() = user_id
    or public.user_has_club_role(club_id, array['owner', 'host'])
  );

-- invitations
alter table public.book_club_invitations enable row level security;

drop policy if exists "book_club_invitations_select" on public.book_club_invitations;
create policy "book_club_invitations_select"
  on public.book_club_invitations for select
  to authenticated
  using (
    invitee_id = auth.uid()
    or inviter_id = auth.uid()
    or public.user_has_club_role(club_id, array['owner', 'host'])
  );

drop policy if exists "book_club_invitations_insert" on public.book_club_invitations;
create policy "book_club_invitations_insert"
  on public.book_club_invitations for insert
  to authenticated
  with check (
    inviter_id = auth.uid()
    and public.user_has_club_role(club_id, array['owner', 'host'])
  );

drop policy if exists "book_club_invitations_update" on public.book_club_invitations;
create policy "book_club_invitations_update"
  on public.book_club_invitations for update
  to authenticated
  using (
    invitee_id = auth.uid()
    or inviter_id = auth.uid()
    or public.user_has_club_role(club_id, array['owner', 'host'])
  );

-- join requests
alter table public.book_club_join_requests enable row level security;

drop policy if exists "book_club_join_requests_select" on public.book_club_join_requests;
create policy "book_club_join_requests_select"
  on public.book_club_join_requests for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.user_has_club_role(club_id, array['owner', 'host'])
  );

drop policy if exists "book_club_join_requests_insert" on public.book_club_join_requests;
create policy "book_club_join_requests_insert"
  on public.book_club_join_requests for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.book_clubs c
      where c.id = club_id
        and c.join_policy = 'request_approval'
        and c.visibility in ('public', 'private')
    )
  );

drop policy if exists "book_club_join_requests_update" on public.book_club_join_requests;
create policy "book_club_join_requests_update"
  on public.book_club_join_requests for update
  to authenticated
  using (
    user_id = auth.uid()
    or public.user_has_club_role(club_id, array['owner', 'host'])
  );

-- discussions (replaces posts policies)
alter table public.book_club_discussions enable row level security;

drop policy if exists "book_club_posts_select_visible" on public.book_club_discussions;
drop policy if exists "book_club_discussions_select" on public.book_club_discussions;
create policy "book_club_discussions_select"
  on public.book_club_discussions for select
  to authenticated
  using (
    public.user_is_active_club_member(club_id)
    or exists (
      select 1 from public.book_clubs c
      where c.id = club_id and c.visibility = 'public'
    )
  );

drop policy if exists "book_club_posts_insert_member" on public.book_club_discussions;
drop policy if exists "book_club_discussions_insert" on public.book_club_discussions;
create policy "book_club_discussions_insert"
  on public.book_club_discussions for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and auth.uid() = created_by
    and public.user_is_active_club_member(club_id)
  );

drop policy if exists "book_club_posts_update_own" on public.book_club_discussions;
drop policy if exists "book_club_discussions_update" on public.book_club_discussions;
create policy "book_club_discussions_update"
  on public.book_club_discussions for update
  to authenticated
  using (
    auth.uid() = user_id
    or public.user_has_club_role(club_id, array['owner', 'host', 'moderator'])
  );

drop policy if exists "book_club_posts_delete_own" on public.book_club_discussions;
drop policy if exists "book_club_discussions_delete" on public.book_club_discussions;
create policy "book_club_discussions_delete"
  on public.book_club_discussions for delete
  to authenticated
  using (
    auth.uid() = user_id
    or public.user_has_club_role(club_id, array['owner', 'host', 'moderator'])
  );

alter table public.book_club_discussion_replies enable row level security;

drop policy if exists "book_club_discussion_replies_select" on public.book_club_discussion_replies;
create policy "book_club_discussion_replies_select"
  on public.book_club_discussion_replies for select
  to authenticated
  using (
    public.user_is_active_club_member(club_id)
    or exists (
      select 1 from public.book_clubs c
      where c.id = club_id and c.visibility = 'public'
    )
  );

drop policy if exists "book_club_discussion_replies_insert" on public.book_club_discussion_replies;
create policy "book_club_discussion_replies_insert"
  on public.book_club_discussion_replies for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.user_is_active_club_member(club_id)
    and exists (
      select 1 from public.book_club_discussions d
      where d.id = discussion_id and d.is_locked = false
    )
  );

drop policy if exists "book_club_discussion_replies_update" on public.book_club_discussion_replies;
create policy "book_club_discussion_replies_update"
  on public.book_club_discussion_replies for update
  to authenticated
  using (
    auth.uid() = user_id
    or public.user_has_club_role(club_id, array['owner', 'host', 'moderator'])
  );

drop policy if exists "book_club_discussion_replies_delete" on public.book_club_discussion_replies;
create policy "book_club_discussion_replies_delete"
  on public.book_club_discussion_replies for delete
  to authenticated
  using (
    auth.uid() = user_id
    or public.user_has_club_role(club_id, array['owner', 'host', 'moderator'])
  );

alter table public.book_club_discussion_reactions enable row level security;

drop policy if exists "book_club_discussion_reactions_select" on public.book_club_discussion_reactions;
create policy "book_club_discussion_reactions_select"
  on public.book_club_discussion_reactions for select
  to authenticated
  using (true);

drop policy if exists "book_club_discussion_reactions_insert" on public.book_club_discussion_reactions;
create policy "book_club_discussion_reactions_insert"
  on public.book_club_discussion_reactions for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and (
      (discussion_id is not null and exists (
        select 1 from public.book_club_discussions d
        where d.id = discussion_id and public.user_is_active_club_member(d.club_id)
      ))
      or (reply_id is not null and exists (
        select 1 from public.book_club_discussion_replies r
        where r.id = reply_id and public.user_is_active_club_member(r.club_id)
      ))
    )
  );

drop policy if exists "book_club_discussion_reactions_delete" on public.book_club_discussion_reactions;
create policy "book_club_discussion_reactions_delete"
  on public.book_club_discussion_reactions for delete
  to authenticated
  using (auth.uid() = user_id);

-- events: tighten write to owner/host/creator
drop policy if exists "book_club_events_select_visible" on public.book_club_events;
create policy "book_club_events_select_visible"
  on public.book_club_events for select
  to authenticated
  using (
    public.user_is_active_club_member(club_id)
    or exists (
      select 1 from public.book_clubs c
      where c.id = club_id and c.visibility = 'public'
    )
  );

drop policy if exists "book_club_events_insert_member" on public.book_club_events;
create policy "book_club_events_insert_member"
  on public.book_club_events for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and public.user_has_club_role(club_id, array['owner', 'host'])
  );

drop policy if exists "book_club_events_update" on public.book_club_events;
create policy "book_club_events_update"
  on public.book_club_events for update
  to authenticated
  using (
    created_by = auth.uid()
    or public.user_has_club_role(club_id, array['owner', 'host'])
  );

drop policy if exists "book_club_events_delete" on public.book_club_events;
create policy "book_club_events_delete"
  on public.book_club_events for delete
  to authenticated
  using (
    created_by = auth.uid()
    or public.user_has_club_role(club_id, array['owner', 'host'])
  );

alter table public.book_club_event_attendees enable row level security;

drop policy if exists "book_club_event_attendees_select" on public.book_club_event_attendees;
create policy "book_club_event_attendees_select"
  on public.book_club_event_attendees for select
  to authenticated
  using (public.user_is_active_club_member(club_id));

drop policy if exists "book_club_event_attendees_insert" on public.book_club_event_attendees;
create policy "book_club_event_attendees_insert"
  on public.book_club_event_attendees for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.user_is_active_club_member(club_id)
  );

drop policy if exists "book_club_event_attendees_update" on public.book_club_event_attendees;
create policy "book_club_event_attendees_update"
  on public.book_club_event_attendees for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "book_club_event_attendees_delete" on public.book_club_event_attendees;
create policy "book_club_event_attendees_delete"
  on public.book_club_event_attendees for delete
  to authenticated
  using (auth.uid() = user_id);

-- announcements
alter table public.book_club_announcements enable row level security;

drop policy if exists "book_club_announcements_select" on public.book_club_announcements;
create policy "book_club_announcements_select"
  on public.book_club_announcements for select
  to authenticated
  using (
    public.user_is_active_club_member(club_id)
    or exists (
      select 1 from public.book_clubs c
      where c.id = club_id and c.visibility = 'public'
    )
  );

drop policy if exists "book_club_announcements_write" on public.book_club_announcements;
create policy "book_club_announcements_insert"
  on public.book_club_announcements for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and public.user_has_club_role(club_id, array['owner', 'host'])
  );

create policy "book_club_announcements_update"
  on public.book_club_announcements for update
  to authenticated
  using (public.user_has_club_role(club_id, array['owner', 'host']));

create policy "book_club_announcements_delete"
  on public.book_club_announcements for delete
  to authenticated
  using (public.user_has_club_role(club_id, array['owner', 'host']));

-- bookshelf
alter table public.book_club_books enable row level security;

drop policy if exists "book_club_books_select" on public.book_club_books;
create policy "book_club_books_select"
  on public.book_club_books for select
  to authenticated
  using (
    public.user_is_active_club_member(club_id)
    or exists (
      select 1 from public.book_clubs c
      where c.id = club_id and c.visibility = 'public'
    )
  );

drop policy if exists "book_club_books_insert" on public.book_club_books;
create policy "book_club_books_insert"
  on public.book_club_books for insert
  to authenticated
  with check (
    added_by = auth.uid()
    and (
      public.user_has_club_role(club_id, array['owner', 'host'])
      or (
        category = 'suggested'
        and public.user_is_active_club_member(club_id)
        and exists (
          select 1 from public.book_club_settings s
          where s.club_id = book_club_books.club_id
            and s.allow_member_suggestions = true
        )
      )
    )
  );

drop policy if exists "book_club_books_update" on public.book_club_books;
create policy "book_club_books_update"
  on public.book_club_books for update
  to authenticated
  using (public.user_has_club_role(club_id, array['owner', 'host']));

drop policy if exists "book_club_books_delete" on public.book_club_books;
create policy "book_club_books_delete"
  on public.book_club_books for delete
  to authenticated
  using (
    public.user_has_club_role(club_id, array['owner', 'host'])
    or (added_by = auth.uid() and category = 'suggested')
  );

alter table public.book_club_current_reads enable row level security;

drop policy if exists "book_club_current_reads_select" on public.book_club_current_reads;
create policy "book_club_current_reads_select"
  on public.book_club_current_reads for select
  to authenticated
  using (
    public.user_is_active_club_member(club_id)
    or exists (
      select 1 from public.book_clubs c
      where c.id = club_id and c.visibility = 'public'
    )
  );

drop policy if exists "book_club_current_reads_write" on public.book_club_current_reads;
create policy "book_club_current_reads_insert"
  on public.book_club_current_reads for insert
  to authenticated
  with check (public.user_has_club_role(club_id, array['owner', 'host']));

create policy "book_club_current_reads_update"
  on public.book_club_current_reads for update
  to authenticated
  using (public.user_has_club_role(club_id, array['owner', 'host']));

alter table public.book_club_activity enable row level security;

drop policy if exists "book_club_activity_select" on public.book_club_activity;
create policy "book_club_activity_select"
  on public.book_club_activity for select
  to authenticated
  using (public.user_is_active_club_member(club_id));

drop policy if exists "book_club_activity_insert" on public.book_club_activity;
create policy "book_club_activity_insert"
  on public.book_club_activity for insert
  to authenticated
  with check (
    actor_id = auth.uid()
    and public.user_is_active_club_member(club_id)
  );

alter table public.book_club_group_conversations enable row level security;

drop policy if exists "book_club_group_conversations_select" on public.book_club_group_conversations;
create policy "book_club_group_conversations_select"
  on public.book_club_group_conversations for select
  to authenticated
  using (public.user_is_active_club_member(club_id));

alter table public.book_club_settings enable row level security;

drop policy if exists "book_club_settings_select" on public.book_club_settings;
create policy "book_club_settings_select"
  on public.book_club_settings for select
  to authenticated
  using (
    public.user_is_active_club_member(club_id)
    or exists (
      select 1 from public.book_clubs c
      where c.id = club_id and c.owner_id = auth.uid()
    )
  );

drop policy if exists "book_club_settings_update" on public.book_club_settings;
create policy "book_club_settings_update"
  on public.book_club_settings for update
  to authenticated
  using (public.user_has_club_role(club_id, array['owner']));

alter table public.book_club_member_notification_prefs enable row level security;

drop policy if exists "book_club_member_notification_prefs_select" on public.book_club_member_notification_prefs;
create policy "book_club_member_notification_prefs_select"
  on public.book_club_member_notification_prefs for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "book_club_member_notification_prefs_upsert" on public.book_club_member_notification_prefs;
create policy "book_club_member_notification_prefs_insert"
  on public.book_club_member_notification_prefs for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.user_is_active_club_member(club_id)
  );

create policy "book_club_member_notification_prefs_update"
  on public.book_club_member_notification_prefs for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Banner storage (avatars/clubs/{id}/banner.*)
drop policy if exists "Club owners can upload club banner" on storage.objects;
create policy "Club owners can upload club banner"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'clubs'
    and public.user_is_book_club_owner(((storage.foldername(name))[2])::uuid)
  );

comment on table public.book_club_invitations is 'Club invitations with pending uniqueness per invitee.';
comment on table public.book_club_discussions is 'Forum-style club discussions (migrated from book_club_posts).';
