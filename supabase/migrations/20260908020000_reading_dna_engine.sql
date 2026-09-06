-- Reading DNA engine: visibility, match vectors, immutable snapshots, stale marks.
-- Additive only. Clients still cannot INSERT/UPDATE reading_dna_* directly.

-- ---------------------------------------------------------------------------
-- Profile cache + privacy
-- ---------------------------------------------------------------------------
alter table public.reading_dna_profiles
  add column if not exists visibility text not null default 'followers';

alter table public.reading_dna_profiles
  drop constraint if exists reading_dna_profiles_visibility_check;
alter table public.reading_dna_profiles
  add constraint reading_dna_profiles_visibility_check
  check (visibility in ('public', 'followers', 'private'));

alter table public.reading_dna_profiles
  add column if not exists match_enabled boolean;

alter table public.reading_dna_profiles
  add column if not exists stale_at timestamptz;

alter table public.reading_dna_profiles
  add column if not exists match_vector jsonb not null default '{}'::jsonb;

alter table public.reading_dna_profiles
  add column if not exists data_points_count integer not null default 0
    check (data_points_count >= 0);

alter table public.reading_dna_profiles
  add column if not exists dna_version text not null default '2026.09.1';

alter table public.reading_dna_profiles
  add column if not exists forming boolean not null default true;

-- ---------------------------------------------------------------------------
-- Snapshots: version + period type; unique becomes (user, type, key)
-- ---------------------------------------------------------------------------
alter table public.reading_dna_snapshots
  add column if not exists dna_version text not null default '2026.09.1';

alter table public.reading_dna_snapshots
  add column if not exists period_type text not null default 'yearly';

alter table public.reading_dna_snapshots
  drop constraint if exists reading_dna_snapshots_period_type_check;
alter table public.reading_dna_snapshots
  add constraint reading_dna_snapshots_period_type_check
  check (period_type in ('monthly', 'yearly'));

alter table public.reading_dna_snapshots
  drop constraint if exists reading_dna_snapshots_user_id_period_key_key;

create unique index if not exists reading_dna_snapshots_user_period_uidx
  on public.reading_dna_snapshots (user_id, period_type, period_key);

-- ---------------------------------------------------------------------------
-- RLS: private DNA cannot leak via public trait/profile select
-- ---------------------------------------------------------------------------
drop policy if exists "reading_dna_profiles_select_public_approved" on public.reading_dna_profiles;
create policy "reading_dna_profiles_select_public_approved"
  on public.reading_dna_profiles for select
  using (
    public_top_traits_approved = true
    and visibility = 'public'
  );

drop policy if exists "reading_dna_traits_select_public_top" on public.reading_dna_traits;
create policy "reading_dna_traits_select_public_top"
  on public.reading_dna_traits for select
  using (
    is_public_approved = true
    and is_top_trait = true
    and exists (
      select 1
      from public.reading_dna_profiles p
      where p.user_id = reading_dna_traits.user_id
        and p.visibility = 'public'
        and p.public_top_traits_approved = true
    )
  );

-- Followers may see approved top traits when visibility = followers.
drop policy if exists "reading_dna_traits_select_followers_top" on public.reading_dna_traits;
create policy "reading_dna_traits_select_followers_top"
  on public.reading_dna_traits for select
  using (
    is_top_trait = true
    and exists (
      select 1
      from public.reading_dna_profiles p
      where p.user_id = reading_dna_traits.user_id
        and p.visibility = 'followers'
        and exists (
          select 1 from public.follows f
          where f.follower_id = auth.uid()
            and f.following_id = p.user_id
        )
    )
  );

drop policy if exists "reading_dna_profiles_select_followers" on public.reading_dna_profiles;
create policy "reading_dna_profiles_select_followers"
  on public.reading_dna_profiles for select
  using (
    visibility = 'followers'
    and exists (
      select 1 from public.follows f
      where f.follower_id = auth.uid()
        and f.following_id = reading_dna_profiles.user_id
    )
  );

-- ---------------------------------------------------------------------------
-- mark stale
-- ---------------------------------------------------------------------------
create or replace function public.mark_reading_dna_stale(p_user_id uuid default auth.uid())
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'error', 'Not authenticated');
  end if;
  if p_user_id is distinct from auth.uid() then
    return jsonb_build_object('ok', false, 'error', 'Forbidden');
  end if;

  insert into public.reading_dna_profiles (user_id, stale_at, forming)
  values (p_user_id, now(), true)
  on conflict (user_id) do update
  set stale_at = now();

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.mark_reading_dna_stale(uuid) from public;
grant execute on function public.mark_reading_dna_stale(uuid) to authenticated;

create or replace function public.tg_mark_reading_dna_stale()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
begin
  v_user := coalesce(new.user_id, old.user_id);
  if v_user is null then
    return coalesce(new, old);
  end if;
  insert into public.reading_dna_profiles (user_id, stale_at, forming)
  values (v_user, now(), true)
  on conflict (user_id) do update
  set stale_at = now();
  return coalesce(new, old);
end;
$$;

drop trigger if exists user_books_mark_reading_dna_stale on public.user_books;
create trigger user_books_mark_reading_dna_stale
  after insert or update of rating, is_favorite, shelf_status, dnf, completion_tags, tracking_format, read_count
  on public.user_books
  for each row
  execute function public.tg_mark_reading_dna_stale();

drop trigger if exists reviews_mark_reading_dna_stale on public.reviews;
create trigger reviews_mark_reading_dna_stale
  after insert or update of feelings, rating
  on public.reviews
  for each row
  execute function public.tg_mark_reading_dna_stale();

drop trigger if exists reading_sessions_mark_reading_dna_stale on public.reading_sessions;
create trigger reading_sessions_mark_reading_dna_stale
  after insert or update of pages_read, listening_seconds, mood, session_format
  on public.reading_sessions
  for each row
  execute function public.tg_mark_reading_dna_stale();

-- ---------------------------------------------------------------------------
-- Privacy writer (own row only)
-- ---------------------------------------------------------------------------
create or replace function public.update_reading_dna_privacy(
  p_visibility text,
  p_match_enabled boolean default null,
  p_public_top_traits_approved boolean default null,
  p_share_personality_on_reader_map boolean default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'error', 'Not authenticated');
  end if;
  if p_visibility is null or p_visibility not in ('public', 'followers', 'private') then
    return jsonb_build_object('ok', false, 'error', 'Invalid visibility');
  end if;

  insert into public.reading_dna_profiles (user_id, visibility)
  values (v_user, p_visibility)
  on conflict (user_id) do update
  set
    visibility = excluded.visibility,
    match_enabled = coalesce(p_match_enabled, public.reading_dna_profiles.match_enabled),
    public_top_traits_approved = coalesce(
      p_public_top_traits_approved,
      public.reading_dna_profiles.public_top_traits_approved
    ),
    share_personality_on_reader_map = coalesce(
      p_share_personality_on_reader_map,
      public.reading_dna_profiles.share_personality_on_reader_map
    ),
    updated_at = now();

  if p_visibility <> 'public' then
    update public.reading_dna_traits
    set is_public_approved = false
    where user_id = v_user;
  elsif p_public_top_traits_approved = true then
    update public.reading_dna_traits
    set is_public_approved = is_top_trait
    where user_id = v_user;
  end if;

  return jsonb_build_object('ok', true, 'visibility', p_visibility);
end;
$$;

revoke all on function public.update_reading_dna_privacy(text, boolean, boolean, boolean) from public;
grant execute on function public.update_reading_dna_privacy(text, boolean, boolean, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- Persist: do not rewrite historical snapshots
-- ---------------------------------------------------------------------------
drop function if exists public.upsert_reading_dna(text, text, text, numeric, integer, jsonb, boolean, text, jsonb);

create or replace function public.upsert_reading_dna(
  p_summary text,
  p_insight text,
  p_confidence text,
  p_confidence_score numeric,
  p_sample_size integer,
  p_traits jsonb,
  p_write_snapshot boolean default true,
  p_period_key text default null,
  p_payload jsonb default '{}'::jsonb,
  p_match_vector jsonb default '{}'::jsonb,
  p_data_points_count integer default 0,
  p_dna_version text default '2026.09.1',
  p_forming boolean default false,
  p_period_type text default 'yearly',
  p_personality_label text default null,
  p_personality_explanation text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_period text;
  v_period_type text;
  v_trait jsonb;
  v_top_labels text[] := array[]::text[];
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'Not authenticated');
  end if;

  if p_confidence is null or p_confidence not in ('none', 'low', 'medium', 'high') then
    return jsonb_build_object('ok', false, 'error', 'Invalid confidence');
  end if;

  if p_confidence_score is null or p_confidence_score < 0 or p_confidence_score > 1 then
    return jsonb_build_object('ok', false, 'error', 'Invalid confidence_score');
  end if;

  if p_sample_size is null or p_sample_size < 0 then
    return jsonb_build_object('ok', false, 'error', 'Invalid sample_size');
  end if;

  if p_traits is null or jsonb_typeof(p_traits) <> 'array' then
    return jsonb_build_object('ok', false, 'error', 'traits must be a JSON array');
  end if;

  v_period_type := coalesce(nullif(trim(p_period_type), ''), 'yearly');
  if v_period_type not in ('monthly', 'yearly') then
    return jsonb_build_object('ok', false, 'error', 'Invalid period_type');
  end if;

  insert into public.reading_dna_profiles (
    user_id,
    summary,
    insight,
    confidence,
    confidence_score,
    sample_size,
    computed_at,
    stale_at,
    match_vector,
    data_points_count,
    dna_version,
    forming,
    personality_label,
    personality_explanation
  )
  values (
    v_user_id,
    p_summary,
    p_insight,
    p_confidence,
    p_confidence_score,
    p_sample_size,
    now(),
    null,
    coalesce(p_match_vector, '{}'::jsonb),
    coalesce(p_data_points_count, 0),
    coalesce(nullif(trim(p_dna_version), ''), '2026.09.1'),
    coalesce(p_forming, false),
    p_personality_label,
    p_personality_explanation
  )
  on conflict (user_id) do update
  set
    summary = excluded.summary,
    insight = excluded.insight,
    confidence = excluded.confidence,
    confidence_score = excluded.confidence_score,
    sample_size = excluded.sample_size,
    computed_at = excluded.computed_at,
    stale_at = null,
    match_vector = excluded.match_vector,
    data_points_count = excluded.data_points_count,
    dna_version = excluded.dna_version,
    forming = excluded.forming,
    personality_label = excluded.personality_label,
    personality_explanation = excluded.personality_explanation,
    updated_at = now();

  delete from public.reading_dna_traits where user_id = v_user_id;

  for v_trait in select * from jsonb_array_elements(p_traits)
  loop
    if coalesce(v_trait->>'category', '') not in ('genre', 'vibe', 'emotion', 'trope', 'habit') then
      continue;
    end if;
    if coalesce(nullif(trim(v_trait->>'label'), ''), '') = '' then
      continue;
    end if;

    insert into public.reading_dna_traits (
      user_id,
      category,
      label,
      score,
      percent,
      emoji,
      persona,
      is_top_trait,
      is_public_approved
    )
    values (
      v_user_id,
      v_trait->>'category',
      lower(trim(v_trait->>'label')),
      coalesce((v_trait->>'score')::numeric, 0),
      coalesce((v_trait->>'percent')::numeric, 0),
      nullif(trim(v_trait->>'emoji'), ''),
      nullif(trim(v_trait->>'persona'), ''),
      coalesce((v_trait->>'is_top_trait')::boolean, false),
      false
    )
    on conflict (user_id, category, label) do update
    set
      score = excluded.score,
      percent = excluded.percent,
      emoji = excluded.emoji,
      persona = excluded.persona,
      is_top_trait = excluded.is_top_trait;

    if coalesce((v_trait->>'is_top_trait')::boolean, false) then
      v_top_labels := array_append(v_top_labels, lower(trim(v_trait->>'label')));
    end if;
  end loop;

  update public.reading_dna_traits t
  set is_public_approved = t.is_top_trait
  from public.reading_dna_profiles p
  where t.user_id = v_user_id
    and p.user_id = v_user_id
    and p.visibility = 'public'
    and p.public_top_traits_approved = true;

  if p_write_snapshot then
    v_period := coalesce(nullif(trim(p_period_key), ''), to_char(timezone('utc', now()), 'YYYY-MM'));
    insert into public.reading_dna_snapshots (
      user_id,
      period_key,
      period_type,
      payload,
      confidence,
      dna_version
    )
    values (
      v_user_id,
      v_period,
      v_period_type,
      coalesce(p_payload, '{}'::jsonb),
      p_confidence,
      coalesce(nullif(trim(p_dna_version), ''), '2026.09.1')
    )
    on conflict (user_id, period_type, period_key) do nothing;
  end if;

  return jsonb_build_object(
    'ok', true,
    'user_id', v_user_id,
    'trait_count', jsonb_array_length(p_traits),
    'top_labels', to_jsonb(v_top_labels)
  );
end;
$$;

revoke all on function public.upsert_reading_dna(
  text, text, text, numeric, integer, jsonb, boolean, text, jsonb,
  jsonb, integer, text, boolean, text, text, text
) from public;
grant execute on function public.upsert_reading_dna(
  text, text, text, numeric, integer, jsonb, boolean, text, jsonb,
  jsonb, integer, text, boolean, text, text, text
) to authenticated;

-- ---------------------------------------------------------------------------
-- Match candidates: Home only, privacy-safe, narrowed, no private DNA
-- ---------------------------------------------------------------------------
create or replace function public.list_reading_dna_match_candidates(
  p_limit integer default 20
)
returns table (
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  match_vector jsonb,
  personality_label text,
  visibility text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_limit integer := least(greatest(coalesce(p_limit, 20), 1), 40);
  v_self public.reading_dna_profiles%rowtype;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;
  if not public.user_has_home_entitlement(v_user) then
    raise exception 'Home membership required';
  end if;

  select * into v_self from public.reading_dna_profiles where reading_dna_profiles.user_id = v_user;
  if v_self.user_id is null then
    return;
  end if;
  if v_self.visibility = 'private' or v_self.match_enabled = false then
    return;
  end if;

  return query
  select
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    dna.match_vector,
    case
      when dna.visibility = 'public' then dna.personality_label
      when dna.visibility = 'followers' and exists (
        select 1 from public.follows f
        where f.follower_id = v_user and f.following_id = p.id
      ) then dna.personality_label
      else null
    end,
    dna.visibility
  from public.reading_dna_profiles dna
  join public.profiles p on p.id = dna.user_id
  where dna.user_id <> v_user
    and dna.visibility <> 'private'
    and coalesce(dna.match_enabled, true) = true
    and dna.forming = false
    and jsonb_typeof(dna.match_vector) = 'object'
    and (
      dna.visibility = 'public'
      or exists (
        select 1 from public.follows f
        where f.follower_id = v_user and f.following_id = dna.user_id
      )
    )
    and not exists (
      select 1 from public.user_blocks b
      where (b.blocker_id = v_user and b.blocked_id = dna.user_id)
         or (b.blocker_id = dna.user_id and b.blocked_id = v_user)
    )
    and exists (
      select 1
      from jsonb_object_keys(coalesce(dna.match_vector->'genre', '{}'::jsonb)) k
      where k in (
        select jsonb_object_keys(coalesce(v_self.match_vector->'genre', '{}'::jsonb))
      )
    )
  order by dna.user_id
  limit v_limit;
end;
$$;

revoke all on function public.list_reading_dna_match_candidates(integer) from public;
grant execute on function public.list_reading_dna_match_candidates(integer) to authenticated;

-- Reader Map personality requires explicit DNA consent, not just Home.
create or replace function public.list_reader_map_markers(
  p_min_lat double precision,
  p_max_lat double precision,
  p_min_lng double precision,
  p_max_lng double precision,
  p_limit integer default 40,
  p_cursor uuid default null
)
returns table (
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  city_label text,
  college_label text,
  personality_label text,
  favorite_genres text[],
  public_club_names text[],
  coarse_lat double precision,
  coarse_lng double precision
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_limit integer := least(greatest(coalesce(p_limit, 40), 1), 40);
  v_period text := to_char(timezone('utc', now()), 'YYYYMMDDHH24MI');
  v_rate jsonb;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;
  if not public.user_has_home_entitlement(v_user) then
    raise exception 'Home membership required';
  end if;
  if public.reader_map_age_status(v_user) <> 'eligible' then
    raise exception 'Age eligibility required';
  end if;

  v_rate := public.try_increment_usage_counter('reader_map_query', v_period, 20);
  if coalesce(v_rate ->> 'ok', 'false') <> 'true' then
    raise exception 'Reader Map rate limit';
  end if;

  return query
  select
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    s.city_label,
    case when s.share_college then s.college_label else null end,
    case
      when s.share_personality
        and dna.visibility is not null
        and dna.visibility <> 'private'
      then dna.personality_label
      else null
    end,
    p.favorite_genres,
    coalesce((
      select array_agg(c.name order by c.name)
      from public.book_club_members m
      join public.book_clubs c on c.id = m.club_id
      where m.user_id = p.id
        and c.visibility = 'public'
    ), '{}'::text[]),
    pr.coarse_lat,
    pr.coarse_lng
  from public.reader_map_settings s
  join public.reader_map_presence pr on pr.user_id = s.user_id
  join public.profiles p on p.id = s.user_id
  left join public.reading_dna_profiles dna on dna.user_id = s.user_id
  where s.opted_in = true
    and s.discoverable = true
    and public.user_has_home_entitlement(s.user_id)
    and public.reader_map_age_status(s.user_id) = 'eligible'
    and pr.coarse_lat between p_min_lat and p_max_lat
    and pr.coarse_lng between p_min_lng and p_max_lng
    and s.user_id <> v_user
    and (p_cursor is null or s.user_id > p_cursor)
    and not exists (
      select 1 from public.user_blocks b
      where (b.blocker_id = v_user and b.blocked_id = s.user_id)
         or (b.blocker_id = s.user_id and b.blocked_id = v_user)
    )
  order by s.user_id
  limit v_limit;
end;
$$;

revoke all on function public.list_reader_map_markers(double precision, double precision, double precision, double precision, integer, uuid) from public;
grant execute on function public.list_reader_map_markers(double precision, double precision, double precision, double precision, integer, uuid) to authenticated;
