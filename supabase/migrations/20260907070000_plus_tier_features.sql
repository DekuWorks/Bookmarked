-- Plus tier: insights extras, favorite authors, advanced goals, review extras,
-- club polls, AI companion cache/rate limits, optional print-session duration.
-- Additive only. Plus mutations re-check user_has_paid_entitlement().

-- ---------------------------------------------------------------------------
-- Optional timed duration for print sessions (never infer from dates)
-- ---------------------------------------------------------------------------
alter table public.reading_sessions
  add column if not exists duration_seconds integer;

alter table public.reading_sessions
  drop constraint if exists reading_sessions_duration_seconds_check;

alter table public.reading_sessions
  add constraint reading_sessions_duration_seconds_check
  check (duration_seconds is null or duration_seconds > 0);

comment on column public.reading_sessions.duration_seconds is
  'Optional timed print-session duration. Pages/hour uses this + pages_read only. Never derive from start/finish dates.';

-- Date insights from session_date. Never count audiobook rows as pages.
create or replace function public.reading_pages_by_day(
  p_user_id uuid,
  p_start timestamptz,
  p_end timestamptz
)
returns table (
  day date,
  pages_read bigint,
  session_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    rs.session_date as day,
    coalesce(sum(case
      when coalesce(rs.session_format, 'book') = 'audiobook' then 0
      else rs.pages_read
    end), 0)::bigint as pages_read,
    count(*)::bigint as session_count
  from public.reading_sessions rs
  where rs.user_id = p_user_id
    and rs.session_date >= (p_start at time zone 'utc')::date
    and rs.session_date < (p_end at time zone 'utc')::date
    and coalesce(rs.activity_kind, 'session') in ('session', 'progress')
  group by 1
  order by 1;
$$;

create or replace function public.reading_stats_in_range(
  p_user_id uuid,
  p_start timestamptz,
  p_end timestamptz
)
returns table (
  total_pages bigint,
  session_count bigint,
  active_days bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    coalesce(sum(case
      when coalesce(rs.session_format, 'book') = 'audiobook' then 0
      else rs.pages_read
    end), 0)::bigint as total_pages,
    count(*)::bigint as session_count,
    count(distinct rs.session_date)::bigint as active_days
  from public.reading_sessions rs
  where rs.user_id = p_user_id
    and rs.session_date >= (p_start at time zone 'utc')::date
    and rs.session_date < (p_end at time zone 'utc')::date
    and coalesce(rs.activity_kind, 'session') in ('session', 'progress');
$$;

-- ---------------------------------------------------------------------------
-- Favorite authors (explicit pick, unique user + author)
-- ---------------------------------------------------------------------------
create table if not exists public.user_favorite_authors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  author_name text not null,
  author_key text not null,
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, author_key)
);

create index if not exists user_favorite_authors_user_id_idx
  on public.user_favorite_authors (user_id, created_at desc);

alter table public.user_favorite_authors enable row level security;

drop policy if exists "user_favorite_authors_select_own" on public.user_favorite_authors;
create policy "user_favorite_authors_select_own"
  on public.user_favorite_authors for select
  using (auth.uid() = user_id);

drop policy if exists "user_favorite_authors_write_own" on public.user_favorite_authors;
create policy "user_favorite_authors_write_own"
  on public.user_favorite_authors for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.enforce_favorite_author_plus()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.user_has_paid_entitlement(new.user_id) then
    raise exception 'Favorite authors are a Bookmarked Plus feature. Subscribe in the Bookmarked iOS app.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_favorite_author_plus on public.user_favorite_authors;
create trigger enforce_favorite_author_plus
  before insert on public.user_favorite_authors
  for each row execute function public.enforce_favorite_author_plus();

-- ---------------------------------------------------------------------------
-- Advanced reading goals
-- ---------------------------------------------------------------------------
create table if not exists public.advanced_reading_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  kind text not null,
  target_amount numeric not null check (target_amount > 0),
  progress_amount numeric not null default 0,
  params jsonb not null default '{}'::jsonb,
  starts_at date,
  ends_at date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint advanced_reading_goals_kind_check
    check (kind in (
      'BOOK_COUNT',
      'PAGE_COUNT',
      'AUDIOBOOK_COUNT',
      'LISTENING_TIME',
      'READING_TIME',
      'GENRE',
      'MONTHLY',
      'DATE_RANGE'
    ))
);

create index if not exists advanced_reading_goals_user_active_idx
  on public.advanced_reading_goals (user_id, is_active, created_at desc);

alter table public.advanced_reading_goals enable row level security;

drop policy if exists "advanced_reading_goals_own" on public.advanced_reading_goals;
create policy "advanced_reading_goals_own"
  on public.advanced_reading_goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.enforce_advanced_goal_plus()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.user_has_paid_entitlement(new.user_id) then
    raise exception 'Advanced reading goals are a Bookmarked Plus feature. Subscribe in the Bookmarked iOS app.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_advanced_goal_plus on public.advanced_reading_goals;
create trigger enforce_advanced_goal_plus
  before insert on public.advanced_reading_goals
  for each row execute function public.enforce_advanced_goal_plus();

-- ---------------------------------------------------------------------------
-- Advanced reviews extras
-- ---------------------------------------------------------------------------
alter table public.reviews
  add column if not exists would_recommend boolean,
  add column if not exists reread_likelihood numeric,
  add column if not exists reread_likelihood_scale text,
  add column if not exists favorite_chapter_number integer,
  add column if not exists favorite_chapter_label text;

alter table public.reviews
  drop constraint if exists reviews_favorite_chapter_number_check;
alter table public.reviews
  add constraint reviews_favorite_chapter_number_check
  check (favorite_chapter_number is null or favorite_chapter_number >= 1);

comment on column public.reviews.reread_likelihood is
  'Numeric reread score. Scale is an open product decision — do not assume 1-10.';
comment on column public.reviews.reread_likelihood_scale is
  'Optional scale key once product defines it.';

create table if not exists public.review_chapter_notes (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  chapter_number integer not null check (chapter_number >= 1),
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (review_id, chapter_number)
);

create table if not exists public.review_character_ratings (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  character_name text not null,
  score numeric,
  created_at timestamptz not null default now(),
  unique (review_id, character_name)
);

alter table public.review_chapter_notes enable row level security;
alter table public.review_character_ratings enable row level security;

drop policy if exists "review_chapter_notes_own" on public.review_chapter_notes;
create policy "review_chapter_notes_own"
  on public.review_chapter_notes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "review_character_ratings_own" on public.review_character_ratings;
create policy "review_character_ratings_own"
  on public.review_character_ratings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.enforce_plus_review_extras()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.user_has_paid_entitlement(new.user_id) then
    raise exception 'Advanced review extras are a Bookmarked Plus feature. Subscribe in the Bookmarked iOS app.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_plus_review_chapter_notes on public.review_chapter_notes;
create trigger enforce_plus_review_chapter_notes
  before insert on public.review_chapter_notes
  for each row execute function public.enforce_plus_review_extras();

drop trigger if exists enforce_plus_review_character_ratings on public.review_character_ratings;
create trigger enforce_plus_review_character_ratings
  before insert on public.review_character_ratings
  for each row execute function public.enforce_plus_review_extras();

-- ---------------------------------------------------------------------------
-- Club polls
-- ---------------------------------------------------------------------------
create table if not exists public.club_polls (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.book_clubs (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  question text not null,
  allow_multiple boolean not null default false,
  closes_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.club_poll_choices (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.club_polls (id) on delete cascade,
  label text not null,
  sort_order integer not null default 0
);

create table if not exists public.club_poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.club_polls (id) on delete cascade,
  choice_id uuid not null references public.club_poll_choices (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (poll_id, user_id, choice_id)
);

create index if not exists club_polls_club_id_idx on public.club_polls (club_id, created_at desc);
create index if not exists club_poll_votes_poll_id_idx on public.club_poll_votes (poll_id);

alter table public.club_polls enable row level security;
alter table public.club_poll_choices enable row level security;
alter table public.club_poll_votes enable row level security;

drop policy if exists "club_polls_member_select" on public.club_polls;
create policy "club_polls_member_select"
  on public.club_polls for select
  using (public.user_is_active_club_member(club_id));

drop policy if exists "club_polls_member_insert" on public.club_polls;
create policy "club_polls_member_insert"
  on public.club_polls for insert
  with check (
    auth.uid() = created_by
    and public.user_is_active_club_member(club_id)
  );

drop policy if exists "club_polls_creator_delete" on public.club_polls;
create policy "club_polls_creator_delete"
  on public.club_polls for delete
  using (
    auth.uid() = created_by
    or public.user_has_club_role(club_id, array['owner', 'host'])
  );

drop policy if exists "club_poll_choices_member_select" on public.club_poll_choices;
create policy "club_poll_choices_member_select"
  on public.club_poll_choices for select
  using (
    exists (
      select 1 from public.club_polls p
      where p.id = poll_id and public.user_is_active_club_member(p.club_id)
    )
  );

drop policy if exists "club_poll_choices_insert" on public.club_poll_choices;
create policy "club_poll_choices_insert"
  on public.club_poll_choices for insert
  with check (
    exists (
      select 1 from public.club_polls p
      where p.id = poll_id
        and p.created_by = auth.uid()
        and public.user_is_active_club_member(p.club_id)
    )
  );

drop policy if exists "club_poll_votes_member_select" on public.club_poll_votes;
create policy "club_poll_votes_member_select"
  on public.club_poll_votes for select
  using (
    exists (
      select 1 from public.club_polls p
      where p.id = poll_id and public.user_is_active_club_member(p.club_id)
    )
  );

drop policy if exists "club_poll_votes_own_insert" on public.club_poll_votes;
create policy "club_poll_votes_own_insert"
  on public.club_poll_votes for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.club_polls p
      where p.id = poll_id and public.user_is_active_club_member(p.club_id)
    )
  );

create or replace function public.create_club_poll(
  p_club_id uuid,
  p_question text,
  p_choices text[],
  p_closes_at timestamptz default null,
  p_allow_multiple boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_poll_id uuid;
  v_choice text;
  v_index integer := 0;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;
  if not public.user_has_paid_entitlement(v_user) then
    raise exception 'Club polls are a Bookmarked Plus feature. Subscribe in the Bookmarked iOS app.';
  end if;
  if not public.user_is_active_club_member(p_club_id) then
    raise exception 'Forbidden';
  end if;
  if p_question is null or length(trim(p_question)) = 0 then
    raise exception 'Add a poll question.';
  end if;
  if p_choices is null or cardinality(p_choices) < 2 or cardinality(p_choices) > 8 then
    raise exception 'Polls need 2 to 8 choices.';
  end if;

  insert into public.club_polls (club_id, created_by, question, allow_multiple, closes_at)
  values (p_club_id, v_user, trim(p_question), coalesce(p_allow_multiple, false), p_closes_at)
  returning id into v_poll_id;

  foreach v_choice in array p_choices loop
    insert into public.club_poll_choices (poll_id, label, sort_order)
    values (v_poll_id, trim(v_choice), v_index);
    v_index := v_index + 1;
  end loop;

  return v_poll_id;
end;
$$;

create or replace function public.vote_club_poll(
  p_poll_id uuid,
  p_choice_ids uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_poll public.club_polls%rowtype;
  v_choice_id uuid;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;
  if not public.user_has_paid_entitlement(v_user) then
    raise exception 'Club polls are a Bookmarked Plus feature. Subscribe in the Bookmarked iOS app.';
  end if;

  select * into v_poll from public.club_polls where id = p_poll_id;
  if v_poll.id is null then
    raise exception 'Poll not found';
  end if;
  if not public.user_is_active_club_member(v_poll.club_id) then
    raise exception 'Forbidden';
  end if;
  if v_poll.closes_at is not null and v_poll.closes_at <= now() then
    raise exception 'This poll is closed.';
  end if;
  if p_choice_ids is null or cardinality(p_choice_ids) = 0 then
    raise exception 'Choose an option.';
  end if;
  if not v_poll.allow_multiple and cardinality(p_choice_ids) > 1 then
    raise exception 'This poll allows one vote.';
  end if;

  delete from public.club_poll_votes
  where poll_id = p_poll_id and user_id = v_user;

  foreach v_choice_id in array p_choice_ids loop
    if not exists (
      select 1 from public.club_poll_choices c
      where c.id = v_choice_id and c.poll_id = p_poll_id
    ) then
      raise exception 'Invalid choice';
    end if;
    insert into public.club_poll_votes (poll_id, choice_id, user_id)
    values (p_poll_id, v_choice_id, v_user);
  end loop;

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.club_analytics_snapshot(p_club_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_snapshot jsonb;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;
  if not public.user_has_paid_entitlement(v_user) then
    raise exception 'Club analytics are a Bookmarked Plus feature. Subscribe in the Bookmarked iOS app.';
  end if;
  if not public.user_has_club_role(p_club_id, array['owner', 'host']) then
    raise exception 'Forbidden';
  end if;

  select jsonb_build_object(
    'memberCount', (
      select count(*) from public.book_club_members
      where club_id = p_club_id and membership_status = 'active'
    ),
    'activeMembers', (
      select count(*) from public.book_club_members
      where club_id = p_club_id and membership_status = 'active'
    ),
    'discussions', (
      select count(*) from public.book_club_discussions where club_id = p_club_id
    ),
    'replies', (
      select count(*) from public.book_club_discussion_replies where club_id = p_club_id
    ),
    'events', (
      select count(*) from public.book_club_events where club_id = p_club_id
    ),
    'rsvpsGoing', (
      select count(*) from public.book_club_event_attendees
      where club_id = p_club_id and rsvp_status = 'going'
    ),
    'booksCompleted', (
      select count(*) from public.book_club_books
      where club_id = p_club_id and category = 'previous'
    ),
    'growth30d', (
      select count(*) from public.book_club_members
      where club_id = p_club_id
        and membership_status = 'active'
        and joined_at >= now() - interval '30 days'
    ),
    'pollCount', (
      select count(*) from public.club_polls where club_id = p_club_id
    ),
    'pollVotes', (
      select count(*) from public.club_poll_votes v
      join public.club_polls p on p.id = v.poll_id
      where p.club_id = p_club_id
    )
  ) into v_snapshot;

  return v_snapshot;
end;
$$;

-- ---------------------------------------------------------------------------
-- AI companion cache + daily rate limit (costs stay server-side)
-- ---------------------------------------------------------------------------
create table if not exists public.ai_companion_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  cache_key text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, cache_key)
);

create table if not exists public.ai_companion_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null default (timezone('utc', now()))::date,
  request_count integer not null default 0,
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  primary key (user_id, day)
);

alter table public.ai_companion_cache enable row level security;
alter table public.ai_companion_usage enable row level security;

drop policy if exists "ai_companion_cache_own" on public.ai_companion_cache;
create policy "ai_companion_cache_own"
  on public.ai_companion_cache for select
  using (auth.uid() = user_id);

drop policy if exists "ai_companion_usage_own" on public.ai_companion_usage;
create policy "ai_companion_usage_own"
  on public.ai_companion_usage for select
  using (auth.uid() = user_id);

create or replace function public.try_increment_ai_companion_usage(
  p_limit integer default 20,
  p_prompt_tokens integer default 0,
  p_completion_tokens integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_day date := (timezone('utc', now()))::date;
  v_count integer;
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'error', 'Not authenticated');
  end if;
  if not public.user_has_paid_entitlement(v_user) then
    return jsonb_build_object('ok', false, 'error', 'plus_required');
  end if;

  insert into public.ai_companion_usage (user_id, day, request_count)
  values (v_user, v_day, 0)
  on conflict (user_id, day) do nothing;

  select request_count into v_count
  from public.ai_companion_usage
  where user_id = v_user and day = v_day
  for update;

  if v_count >= p_limit then
    return jsonb_build_object('ok', false, 'error', 'rate_limited', 'count', v_count, 'limit', p_limit);
  end if;

  update public.ai_companion_usage
  set request_count = v_count + 1,
      prompt_tokens = prompt_tokens + greatest(p_prompt_tokens, 0),
      completion_tokens = completion_tokens + greatest(p_completion_tokens, 0)
  where user_id = v_user and day = v_day;

  return jsonb_build_object('ok', true, 'count', v_count + 1, 'limit', p_limit);
end;
$$;

revoke all on function public.create_club_poll(uuid, text, text[], timestamptz, boolean) from public;
revoke all on function public.vote_club_poll(uuid, uuid[]) from public;
revoke all on function public.club_analytics_snapshot(uuid) from public;
revoke all on function public.try_increment_ai_companion_usage(integer, integer, integer) from public;

grant execute on function public.create_club_poll(uuid, text, text[], timestamptz, boolean) to authenticated;
grant execute on function public.vote_club_poll(uuid, uuid[]) to authenticated;
grant execute on function public.club_analytics_snapshot(uuid) to authenticated;
grant execute on function public.try_increment_ai_companion_usage(integer, integer, integer) to authenticated;
