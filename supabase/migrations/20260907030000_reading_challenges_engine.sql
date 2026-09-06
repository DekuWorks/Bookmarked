-- Thirteenth Sprint — Reading Challenges engine.
-- Additive only. Reuses reading_challenges + reading_challenge_members.
-- No reset, no drop of existing joins.

-- ---------------------------------------------------------------------------
-- Extend existing challenge tables
-- ---------------------------------------------------------------------------
alter table public.reading_challenges
  add column if not exists cover_url text,
  add column if not exists category text,
  add column if not exists visibility text not null default 'public',
  add column if not exists owner_kind text not null default 'official',
  add column if not exists created_by uuid references auth.users (id) on delete set null,
  add column if not exists goal_type text not null default 'BOOK_COUNT',
  add column if not exists goal_amount numeric not null default 0,
  add column if not exists allow_same_book_for_multiple_objectives boolean not null default false,
  add column if not exists allow_historical boolean not null default false,
  add column if not exists featured boolean not null default false,
  add column if not exists community_total numeric not null default 0,
  add column if not exists community_unit text not null default 'books';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'reading_challenges_visibility_check'
  ) then
    alter table public.reading_challenges
      add constraint reading_challenges_visibility_check
      check (visibility in ('public', 'followers', 'friend', 'private'));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'reading_challenges_owner_kind_check'
  ) then
    alter table public.reading_challenges
      add constraint reading_challenges_owner_kind_check
      check (owner_kind in ('official', 'user'));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'reading_challenges_goal_type_check'
  ) then
    alter table public.reading_challenges
      add constraint reading_challenges_goal_type_check
      check (goal_type in (
        'BOOK_COUNT', 'PAGE_COUNT', 'AUDIOBOOK_COUNT', 'LISTENING_TIME', 'OBJECTIVE_CHECKLIST'
      ));
  end if;
end $$;

alter table public.reading_challenge_members
  add column if not exists status text not null default 'active',
  add column if not exists completed_at timestamptz,
  add column if not exists books_completed integer not null default 0,
  add column if not exists pages_completed integer not null default 0,
  add column if not exists listening_seconds_completed integer not null default 0,
  add column if not exists last_progress_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'reading_challenge_members_status_check'
  ) then
    alter table public.reading_challenge_members
      add constraint reading_challenge_members_status_check
      check (status in ('active', 'completed', 'left'));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- New satellite tables
-- ---------------------------------------------------------------------------
create table if not exists public.reading_challenge_objectives (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.reading_challenges (id) on delete cascade,
  rule_type text not null,
  title text not null,
  sort_order integer not null default 0,
  target_amount numeric not null default 1,
  params jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists reading_challenge_objectives_challenge_idx
  on public.reading_challenge_objectives (challenge_id, sort_order);

create table if not exists public.reading_challenge_rewards (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.reading_challenges (id) on delete cascade,
  badge_key text not null,
  title text not null
);

create table if not exists public.reading_challenge_progress (
  challenge_id uuid not null references public.reading_challenges (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  objective_id uuid not null references public.reading_challenge_objectives (id) on delete cascade,
  current_amount numeric not null default 0,
  completed boolean not null default false,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (challenge_id, user_id, objective_id)
);

create table if not exists public.reading_challenge_contributions (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.reading_challenges (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  objective_id uuid not null references public.reading_challenge_objectives (id) on delete cascade,
  user_book_id uuid not null references public.user_books (id) on delete cascade,
  qualifying_event_id text not null,
  qualifying_date timestamptz not null,
  amount numeric not null default 0,
  unit text not null default 'books',
  reason text not null default '',
  created_at timestamptz not null default now(),
  unique (challenge_id, user_id, objective_id, user_book_id, qualifying_event_id)
);

create index if not exists reading_challenge_contributions_user_idx
  on public.reading_challenge_contributions (user_id, challenge_id);

create table if not exists public.reading_challenge_invites (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.reading_challenges (id) on delete cascade,
  inviter_id uuid not null references auth.users (id) on delete cascade,
  invitee_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (challenge_id, invitee_id),
  check (status in ('pending', 'accepted', 'declined')),
  check (inviter_id <> invitee_id)
);

create index if not exists reading_challenge_invites_invitee_idx
  on public.reading_challenge_invites (invitee_id, status);

create table if not exists public.reading_challenge_milestones (
  challenge_id uuid not null references public.reading_challenges (id) on delete cascade,
  threshold numeric not null,
  reached_at timestamptz not null default now(),
  primary key (challenge_id, threshold)
);

create table if not exists public.challenge_badge_definitions (
  badge_key text primary key,
  title text not null,
  description text not null
);

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  badge_key text not null references public.challenge_badge_definitions (badge_key) on delete cascade,
  source_challenge_id uuid references public.reading_challenges (id) on delete set null,
  featured boolean not null default false,
  awarded_at timestamptz not null default now(),
  unique (user_id, badge_key)
);

create index if not exists user_badges_user_idx on public.user_badges (user_id, awarded_at desc);

-- Trusted catalog metadata for AUTHOR_ID / representation rules. Never inferred from names.
alter table public.books
  add column if not exists trusted_metadata jsonb;

create table if not exists public.challenge_curated_lists (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  book_ids uuid[] not null default '{}',
  notes text,
  created_at timestamptz not null default now()
);

insert into public.challenge_badge_definitions (badge_key, title, description)
values
  ('first_challenge_completed', 'First Challenge Completed', 'Finished your first reading challenge.'),
  ('challenge_streak_30', '30-day streak', 'Kept a 30-day reading streak.'),
  ('books_100', '100 books', 'Finished 100 books.')
on conflict (badge_key) do update
set title = excluded.title,
    description = excluded.description;

-- Official seed challenges: attach goals + a primary objective (idempotent).
update public.reading_challenges
set
  featured = true,
  category = coalesce(category, 'Official'),
  goal_type = 'BOOK_COUNT',
  goal_amount = case slug
    when 'bookmark-52-in-2026' then 52
    when 'cozy-corner-2026' then 12
    when 'new-to-me-authors-2026' then 12
    when 'pages-with-friends-2026' then 12
    when 'finish-what-you-started-2026' then 6
    else greatest(goal_amount, 1)
  end,
  community_unit = 'books'
where owner_kind = 'official';

insert into public.reading_challenge_objectives (
  challenge_id, rule_type, title, sort_order, target_amount, params
)
select
  c.id,
  case c.slug
    when 'cozy-corner-2026' then 'GENRE'
    when 'pages-with-friends-2026' then 'BOOK_CLUB_SELECTION'
    else 'BOOK_COUNT'
  end,
  case c.slug
    when 'bookmark-52-in-2026' then 'Finish 52 books'
    when 'cozy-corner-2026' then 'Read romance or mystery'
    when 'new-to-me-authors-2026' then 'Finish 12 books'
    when 'pages-with-friends-2026' then 'Finish a book club selection'
    when 'finish-what-you-started-2026' then 'Finish 6 books'
    else 'Finish books'
  end,
  0,
  c.goal_amount,
  case c.slug
    when 'cozy-corner-2026' then '{"genre_ids":["romance","mystery"]}'::jsonb
    else '{}'::jsonb
  end
from public.reading_challenges c
where c.owner_kind = 'official'
  and not exists (
    select 1 from public.reading_challenge_objectives o where o.challenge_id = c.id
  );

-- ---------------------------------------------------------------------------
-- Visibility helpers
-- ---------------------------------------------------------------------------
create or replace function public.reading_challenge_visible_to_viewer(p_challenge_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.reading_challenges c
    where c.id = p_challenge_id
      and (
        c.created_by = auth.uid()
        or exists (
          select 1 from public.reading_challenge_members m
          where m.challenge_id = c.id
            and m.user_id = auth.uid()
            and m.status <> 'left'
        )
        or (
          c.visibility = 'public' and c.is_active = true
        )
        or (
          c.visibility = 'followers'
          and c.created_by is not null
          and exists (
            select 1 from public.follows f
            where f.follower_id = auth.uid()
              and f.following_id = c.created_by
          )
        )
        or (
          c.visibility = 'friend'
          and exists (
            select 1 from public.reading_challenge_invites i
            where i.challenge_id = c.id
              and i.invitee_id = auth.uid()
              and i.status in ('pending', 'accepted')
          )
        )
      )
  );
$$;

create or replace function public.user_has_paid_entitlement(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_subscriptions s
    where s.user_id = p_user_id
      and s.subscription_tier in ('plus', 'home')
      and s.subscription_status in ('active', 'trialing', 'past_due', 'grace_period', 'canceled')
      and (
        s.subscription_expires_at is null
        and s.subscription_status <> 'canceled'
        or s.subscription_expires_at > now()
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.reading_challenge_objectives enable row level security;
alter table public.reading_challenge_rewards enable row level security;
alter table public.reading_challenge_progress enable row level security;
alter table public.reading_challenge_contributions enable row level security;
alter table public.reading_challenge_invites enable row level security;
alter table public.reading_challenge_milestones enable row level security;
alter table public.challenge_badge_definitions enable row level security;
alter table public.user_badges enable row level security;
alter table public.challenge_curated_lists enable row level security;

drop policy if exists "reading_challenges_select_active" on public.reading_challenges;
create policy "reading_challenges_select_visible"
  on public.reading_challenges for select
  using (public.reading_challenge_visible_to_viewer(id));

drop policy if exists "reading_challenges_insert_creator" on public.reading_challenges;
create policy "reading_challenges_insert_creator"
  on public.reading_challenges for insert
  with check (auth.uid() = created_by);

drop policy if exists "reading_challenges_update_creator" on public.reading_challenges;
create policy "reading_challenges_update_creator"
  on public.reading_challenges for update
  using (auth.uid() = created_by);

drop policy if exists "reading_challenge_members_select_own" on public.reading_challenge_members;
create policy "reading_challenge_members_select_visible"
  on public.reading_challenge_members for select
  using (
    user_id = auth.uid()
    or public.reading_challenge_visible_to_viewer(challenge_id)
  );

drop policy if exists "reading_challenge_objectives_select" on public.reading_challenge_objectives;
create policy "reading_challenge_objectives_select"
  on public.reading_challenge_objectives for select
  using (public.reading_challenge_visible_to_viewer(challenge_id));

drop policy if exists "reading_challenge_rewards_select" on public.reading_challenge_rewards;
create policy "reading_challenge_rewards_select"
  on public.reading_challenge_rewards for select
  using (public.reading_challenge_visible_to_viewer(challenge_id));

drop policy if exists "reading_challenge_progress_select" on public.reading_challenge_progress;
create policy "reading_challenge_progress_select"
  on public.reading_challenge_progress for select
  using (
    user_id = auth.uid()
    or public.reading_challenge_visible_to_viewer(challenge_id)
  );

drop policy if exists "reading_challenge_contributions_select" on public.reading_challenge_contributions;
create policy "reading_challenge_contributions_select"
  on public.reading_challenge_contributions for select
  using (
    user_id = auth.uid()
    or public.reading_challenge_visible_to_viewer(challenge_id)
  );

drop policy if exists "reading_challenge_invites_select" on public.reading_challenge_invites;
create policy "reading_challenge_invites_select"
  on public.reading_challenge_invites for select
  using (inviter_id = auth.uid() or invitee_id = auth.uid());

drop policy if exists "reading_challenge_invites_insert" on public.reading_challenge_invites;
create policy "reading_challenge_invites_insert"
  on public.reading_challenge_invites for insert
  with check (
    inviter_id = auth.uid()
    and exists (
      select 1 from public.reading_challenge_members m
      where m.challenge_id = reading_challenge_invites.challenge_id
        and m.user_id = auth.uid()
        and m.status <> 'left'
    )
  );

drop policy if exists "reading_challenge_invites_update" on public.reading_challenge_invites;
create policy "reading_challenge_invites_update"
  on public.reading_challenge_invites for update
  using (invitee_id = auth.uid() or inviter_id = auth.uid());

drop policy if exists "reading_challenge_milestones_select" on public.reading_challenge_milestones;
create policy "reading_challenge_milestones_select"
  on public.reading_challenge_milestones for select
  using (public.reading_challenge_visible_to_viewer(challenge_id));

drop policy if exists "challenge_badge_definitions_select" on public.challenge_badge_definitions;
create policy "challenge_badge_definitions_select"
  on public.challenge_badge_definitions for select
  using (true);

drop policy if exists "user_badges_select" on public.user_badges;
create policy "user_badges_select"
  on public.user_badges for select
  using (user_id = auth.uid() or featured = true);

drop policy if exists "user_badges_update_own" on public.user_badges;
create policy "user_badges_update_own"
  on public.user_badges for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "challenge_curated_lists_select" on public.challenge_curated_lists;
create policy "challenge_curated_lists_select"
  on public.challenge_curated_lists for select
  using (true);

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------
create or replace function public.create_user_reading_challenge(
  p_title text,
  p_description text,
  p_cover_url text,
  p_goal_type text,
  p_goal_amount numeric,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_visibility text,
  p_category text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
  v_slug text;
  v_visibility text;
  v_goal text;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  if not public.user_has_paid_entitlement(v_user) then
    raise exception 'Creating reading challenges is a Bookmarked Plus feature. Upgrade to Bookmarked Plus to design your own challenge.';
  end if;

  v_visibility := coalesce(nullif(trim(p_visibility), ''), 'private');
  if v_visibility not in ('public', 'followers', 'friend', 'private') then
    raise exception 'Invalid visibility';
  end if;

  v_goal := coalesce(nullif(trim(p_goal_type), ''), 'BOOK_COUNT');
  if v_goal not in ('BOOK_COUNT', 'PAGE_COUNT', 'AUDIOBOOK_COUNT', 'LISTENING_TIME', 'OBJECTIVE_CHECKLIST') then
    raise exception 'Invalid goal type';
  end if;

  if p_title is null or length(trim(p_title)) < 2 then
    raise exception 'Title is required';
  end if;

  v_slug := lower(regexp_replace(trim(p_title), '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);
  if v_slug = '' then
    v_slug := 'challenge';
  end if;
  v_slug := v_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

  insert into public.reading_challenges (
    slug, title, description, cover_url, category, year,
    starts_at, ends_at, is_active, visibility, owner_kind, created_by,
    goal_type, goal_amount, community_unit, featured
  )
  values (
    v_slug,
    trim(p_title),
    nullif(trim(coalesce(p_description, '')), ''),
    nullif(trim(coalesce(p_cover_url, '')), ''),
    nullif(trim(coalesce(p_category, '')), ''),
    extract(year from coalesce(p_starts_at, now()))::integer,
    p_starts_at,
    p_ends_at,
    true,
    v_visibility,
    'user',
    v_user,
    v_goal,
    greatest(coalesce(p_goal_amount, 1), 1),
    case v_goal
      when 'PAGE_COUNT' then 'pages'
      when 'LISTENING_TIME' then 'listening_seconds'
      when 'OBJECTIVE_CHECKLIST' then 'objectives'
      else 'books'
    end,
    false
  )
  returning id into v_id;

  insert into public.reading_challenge_members (challenge_id, user_id, status)
  values (v_id, v_user, 'active');

  insert into public.reading_challenge_objectives (
    challenge_id, rule_type, title, sort_order, target_amount, params
  )
  values (
    v_id,
    v_goal,
    trim(p_title),
    0,
    greatest(coalesce(p_goal_amount, 1), 1),
    '{}'::jsonb
  );

  return v_id;
end;
$$;

create or replace function public.record_challenge_contribution(
  p_challenge_id uuid,
  p_objective_id uuid,
  p_user_book_id uuid,
  p_qualifying_event_id text,
  p_qualifying_date timestamptz,
  p_amount numeric,
  p_unit text,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_inserted integer := 0;
  v_member_status text;
  v_goal_type text;
  v_goal_amount numeric;
  v_books integer;
  v_pages integer;
  v_listening integer;
  v_completed_objectives integer;
  v_objective_count integer;
  v_now_complete boolean := false;
  v_prev_community numeric;
  v_next_community numeric;
  v_visibility text;
  v_title text;
  v_thresholds numeric[] := array[250000, 500000, 750000, 1000000];
  v_threshold numeric;
  v_milestones numeric[] := '{}';
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  select m.status into v_member_status
  from public.reading_challenge_members m
  where m.challenge_id = p_challenge_id
    and m.user_id = v_user;

  if v_member_status is null or v_member_status = 'left' then
    return jsonb_build_object('ok', false, 'error', 'not_a_member');
  end if;

  insert into public.reading_challenge_contributions (
    challenge_id, user_id, objective_id, user_book_id,
    qualifying_event_id, qualifying_date, amount, unit, reason
  )
  values (
    p_challenge_id, v_user, p_objective_id, p_user_book_id,
    p_qualifying_event_id, p_qualifying_date,
    greatest(coalesce(p_amount, 0), 0),
    coalesce(nullif(p_unit, ''), 'books'),
    coalesce(p_reason, '')
  )
  on conflict (challenge_id, user_id, objective_id, user_book_id, qualifying_event_id)
  do nothing;

  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then
    return jsonb_build_object('ok', true, 'inserted', false);
  end if;

  insert into public.reading_challenge_progress (
    challenge_id, user_id, objective_id, current_amount, completed, completed_at
  )
  values (
    p_challenge_id, v_user, p_objective_id, greatest(coalesce(p_amount, 0), 0),
    false, null
  )
  on conflict (challenge_id, user_id, objective_id) do update
  set
    current_amount = public.reading_challenge_progress.current_amount + greatest(coalesce(p_amount, 0), 0),
    updated_at = now();

  update public.reading_challenge_progress p
  set
    completed = p.current_amount >= o.target_amount,
    completed_at = case
      when p.current_amount >= o.target_amount then coalesce(p.completed_at, now())
      else null
    end
  from public.reading_challenge_objectives o
  where p.challenge_id = p_challenge_id
    and p.user_id = v_user
    and p.objective_id = p_objective_id
    and o.id = p.objective_id;

  update public.reading_challenge_members m
  set
    books_completed = m.books_completed + case when coalesce(p_unit, 'books') = 'books' then 1 else 0 end,
    pages_completed = m.pages_completed + case when p_unit = 'pages' then greatest(p_amount, 0)::integer else 0 end,
    listening_seconds_completed = m.listening_seconds_completed
      + case when p_unit = 'listening_seconds' then greatest(p_amount, 0)::integer else 0 end,
    last_progress_at = now()
  where m.challenge_id = p_challenge_id
    and m.user_id = v_user;

  select goal_type, goal_amount, visibility, title, community_total
  into v_goal_type, v_goal_amount, v_visibility, v_title, v_prev_community
  from public.reading_challenges
  where id = p_challenge_id;

  update public.reading_challenges
  set community_total = community_total + greatest(coalesce(p_amount, 0), 0)
  where id = p_challenge_id
  returning community_total into v_next_community;

  select books_completed, pages_completed, listening_seconds_completed
  into v_books, v_pages, v_listening
  from public.reading_challenge_members
  where challenge_id = p_challenge_id and user_id = v_user;

  select count(*) into v_objective_count
  from public.reading_challenge_objectives
  where challenge_id = p_challenge_id;

  select count(*) into v_completed_objectives
  from public.reading_challenge_progress
  where challenge_id = p_challenge_id
    and user_id = v_user
    and completed = true;

  v_now_complete := case v_goal_type
    when 'PAGE_COUNT' then v_pages >= v_goal_amount
    when 'LISTENING_TIME' then v_listening >= v_goal_amount
    when 'OBJECTIVE_CHECKLIST' then v_completed_objectives >= v_goal_amount
    else v_books >= v_goal_amount
  end;

  if v_now_complete and v_member_status <> 'completed' then
    update public.reading_challenge_members
    set status = 'completed', completed_at = now()
    where challenge_id = p_challenge_id and user_id = v_user;

    perform public.create_notification(
      v_user,
      'challenge',
      'Challenge complete',
      coalesce(v_title, 'Reading challenge'),
      v_user,
      '/challenges/',
      jsonb_build_object('notification_kind', 'challenge_completed', 'challenge_id', p_challenge_id)
    );
  end if;

  foreach v_threshold in array v_thresholds loop
    if v_prev_community < v_threshold and v_next_community >= v_threshold then
      insert into public.reading_challenge_milestones (challenge_id, threshold)
      values (p_challenge_id, v_threshold)
      on conflict do nothing;
      if found then
        v_milestones := array_append(v_milestones, v_threshold);
      end if;
    end if;
  end loop;

  return jsonb_build_object(
    'ok', true,
    'inserted', true,
    'completed', v_now_complete,
    'community_total', v_next_community,
    'milestones', to_jsonb(v_milestones),
    'visibility', v_visibility
  );
end;
$$;

create or replace function public.award_user_badge(
  p_badge_key text,
  p_source_challenge_id uuid default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.user_badges (user_id, badge_key, source_challenge_id)
  values (v_user, p_badge_key, p_source_challenge_id)
  on conflict (user_id, badge_key) do nothing;

  return found;
end;
$$;

create or replace function public.respond_challenge_invite(
  p_invite_id uuid,
  p_accept boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_invite public.reading_challenge_invites%rowtype;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_invite
  from public.reading_challenge_invites
  where id = p_invite_id
    and invitee_id = v_user
    and status = 'pending';

  if not found then
    return jsonb_build_object('ok', false, 'error', 'invite_not_found');
  end if;

  update public.reading_challenge_invites
  set
    status = case when p_accept then 'accepted' else 'declined' end,
    responded_at = now()
  where id = p_invite_id;

  if p_accept then
    insert into public.reading_challenge_members (challenge_id, user_id, status)
    values (v_invite.challenge_id, v_user, 'active')
    on conflict (challenge_id, user_id) do update
    set status = 'active';

    perform public.create_notification(
      v_invite.inviter_id,
      'challenge',
      'Challenge invite accepted',
      'A reader joined your challenge.',
      v_user,
      '/challenges/',
      jsonb_build_object(
        'notification_kind', 'challenge_accepted',
        'challenge_id', v_invite.challenge_id
      )
    );
  end if;

  return jsonb_build_object('ok', true, 'accepted', p_accept);
end;
$$;

-- Notifications: keep social/club rules, add challenge invite/accepted/completed/milestone.
-- Reading activity stays off the bell. Self-notify only for own challenge complete/milestone.
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

  v_kind := coalesce(nullif(trim(coalesce(p_metadata, '{}'::jsonb)->>'notification_kind'), ''), p_type);

  if p_user_id = v_actor
     and not (
       p_type = 'challenge'
       and v_kind in ('challenge_completed', 'challenge_community_milestone')
     ) then
    return null;
  end if;

  if auth.uid() is not null and v_actor is distinct from auth.uid() then
    raise exception 'Forbidden';
  end if;

  if p_type = 'club' or p_type = 'challenge' then
    null;
  elsif p_type = 'message' then
    v_kind := 'message';
  elsif p_type = 'follow' then
    v_kind := 'follow';
  elsif v_kind not in (
    'message', 'follow', 'post_like', 'post_comment', 'post_comment_reply', 'post_published',
    'challenge_invitation', 'challenge_accepted', 'challenge_completed', 'challenge_community_milestone'
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

revoke all on function public.reading_challenge_visible_to_viewer(uuid) from public;
revoke all on function public.user_has_paid_entitlement(uuid) from public;
revoke all on function public.create_user_reading_challenge(text, text, text, text, numeric, timestamptz, timestamptz, text, text) from public;
revoke all on function public.record_challenge_contribution(uuid, uuid, uuid, text, timestamptz, numeric, text, text) from public;
revoke all on function public.award_user_badge(text, uuid) from public;
revoke all on function public.respond_challenge_invite(uuid, boolean) from public;

grant execute on function public.reading_challenge_visible_to_viewer(uuid) to authenticated;
grant execute on function public.user_has_paid_entitlement(uuid) to authenticated;
grant execute on function public.create_user_reading_challenge(text, text, text, text, numeric, timestamptz, timestamptz, text, text) to authenticated;
grant execute on function public.record_challenge_contribution(uuid, uuid, uuid, text, timestamptz, numeric, text, text) to authenticated;
grant execute on function public.award_user_badge(text, uuid) to authenticated;
grant execute on function public.respond_challenge_invite(uuid, boolean) to authenticated;
