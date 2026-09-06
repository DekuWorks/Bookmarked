-- Bookmarked Home tier: Book Map, Reader Map, experiences, concierge.
-- Additive only. Home mutations re-check user_has_home_entitlement().
-- Reader precise GPS is never selected by public RPCs.

-- ---------------------------------------------------------------------------
-- Entitlement helpers
-- ---------------------------------------------------------------------------
create or replace function public.user_has_home_entitlement(p_user_id uuid)
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
      and s.subscription_tier = 'home'
      and s.subscription_status in ('active', 'trialing', 'past_due', 'grace_period', 'canceled')
      and (
        s.subscription_expires_at is null
        and s.subscription_status <> 'canceled'
        or s.subscription_expires_at > now()
      )
  );
$$;

revoke all on function public.user_has_home_entitlement(uuid) from public;
grant execute on function public.user_has_home_entitlement(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Feature flags (product fills open decisions later)
-- ---------------------------------------------------------------------------
create table if not exists public.feature_flags (
  key text primary key,
  value jsonb not null default 'null'::jsonb,
  description text,
  updated_at timestamptz not null default now()
);

alter table public.feature_flags enable row level security;

drop policy if exists "feature_flags_select_authenticated" on public.feature_flags;
create policy "feature_flags_select_authenticated"
  on public.feature_flags for select
  to authenticated
  using (true);

insert into public.feature_flags (key, value, description) values
  ('reading_cafe_qualification', 'null'::jsonb, 'Open: what qualifies a Reading Café'),
  ('book_map_user_submissions_enabled', 'false'::jsonb, 'Open: can users submit Book Map places'),
  ('reader_map_coarseness_mode', '"city"'::jsonb, 'Open: city | neighborhood | randomized'),
  ('reader_map_extra_trust_required', 'false'::jsonb, 'Open: extra trust beyond adult opt-in'),
  ('reader_map_min_age', 'null'::jsonb, 'Open: minimum age. Do not invent a number.'),
  ('public_meetup_who_can_create', '"home_only"'::jsonb, 'Open: who can create public Meetups'),
  ('public_meetup_preapproval', 'true'::jsonb, 'Open: public Meetup pre-approval'),
  ('video_provider_default', '"external"'::jsonb, 'Open: production video provider. Not Zoom-by-default.'),
  ('reading_dna_recalc_hours', '24'::jsonb, 'Open: DNA recalc cadence hours'),
  ('home_beta_auto_enroll', 'false'::jsonb, 'Open: every beta automatic vs per-flag')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Profiles: optional hidden college + birth year for eligibility (not public by default)
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists college_name text;

alter table public.profiles
  add column if not exists birth_year integer;

alter table public.profiles
  drop constraint if exists profiles_birth_year_check;
alter table public.profiles
  add constraint profiles_birth_year_check
  check (birth_year is null or (birth_year >= 1900 and birth_year <= extract(year from now())::integer));

-- ---------------------------------------------------------------------------
-- Reading DNA personality cache (deterministic, not recomputed every render)
-- ---------------------------------------------------------------------------
alter table public.reading_dna_profiles
  add column if not exists personality_label text;

alter table public.reading_dna_profiles
  add column if not exists personality_explanation text;

alter table public.reading_dna_profiles
  add column if not exists share_personality_on_reader_map boolean not null default false;

-- ---------------------------------------------------------------------------
-- Book Map places (business coords may be precise)
-- ---------------------------------------------------------------------------
create table if not exists public.book_map_places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('bookstore', 'library', 'reading_cafe')),
  address_text text,
  city text,
  region text,
  postal_code text,
  country text,
  lat double precision not null,
  lng double precision not null,
  website text,
  phone text,
  hours jsonb,
  verified boolean not null default false,
  active boolean not null default true,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint book_map_places_name_not_empty check (char_length(trim(name)) > 0),
  constraint book_map_places_website_http check (website is null or website ~* '^https?://'),
  constraint book_map_places_unique_listing unique (name, city, category)
);

create index if not exists book_map_places_category_active_idx
  on public.book_map_places (category, active);

create index if not exists book_map_places_city_idx
  on public.book_map_places (lower(city));

drop trigger if exists book_map_places_set_updated_at on public.book_map_places;
create trigger book_map_places_set_updated_at
  before update on public.book_map_places
  for each row execute function public.set_updated_at();

alter table public.book_map_places enable row level security;

drop policy if exists "book_map_places_select_active" on public.book_map_places;
create policy "book_map_places_select_active"
  on public.book_map_places for select
  to authenticated
  using (active = true);

-- Curated public venues only. No invented cafés.
insert into public.book_map_places (
  name, category, address_text, city, region, postal_code, country,
  lat, lng, website, verified, active, source
) values
  (
    'The Strand Bookstore', 'bookstore',
    '828 Broadway', 'New York', 'NY', '10003', 'US',
    40.733182, -73.990837, 'https://www.strandbooks.com', true, true, 'curated'
  ),
  (
    'Powell''s City of Books', 'bookstore',
    '1005 W Burnside St', 'Portland', 'OR', '97209', 'US',
    45.523064, -122.681356, 'https://www.powells.com', true, true, 'curated'
  ),
  (
    'The Last Bookstore', 'bookstore',
    '453 S Spring St', 'Los Angeles', 'CA', '90013', 'US',
    34.047630, -118.249580, 'https://www.lastbookstorela.com', true, true, 'curated'
  ),
  (
    'Shakespeare and Company', 'bookstore',
    '37 Rue de la Bûcherie', 'Paris', null, '75005', 'FR',
    48.852568, 2.347025, 'https://shakespeareandcompany.com', true, true, 'curated'
  ),
  (
    'New York Public Library — Stephen A. Schwarzman Building', 'library',
    '476 5th Ave', 'New York', 'NY', '10018', 'US',
    40.753182, -73.982253, 'https://www.nypl.org', true, true, 'curated'
  ),
  (
    'Boston Public Library — Central Library', 'library',
    '700 Boylston St', 'Boston', 'MA', '02116', 'US',
    42.349596, -71.078010, 'https://www.bpl.org', true, true, 'curated'
  )
on conflict do nothing;

-- User submissions stay off until product decides (flag + RPC).
create or replace function public.submit_book_map_place(
  p_name text,
  p_category text,
  p_address text,
  p_city text,
  p_lat double precision,
  p_lng double precision
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_enabled boolean;
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'error', 'Not authenticated');
  end if;
  if not public.user_has_home_entitlement(v_user) then
    return jsonb_build_object('ok', false, 'error', 'Home membership required');
  end if;

  select (value = 'true'::jsonb) into v_enabled
  from public.feature_flags
  where key = 'book_map_user_submissions_enabled';

  if coalesce(v_enabled, false) is not true then
    return jsonb_build_object('ok', false, 'error', 'Place submissions are not open yet');
  end if;

  if p_category not in ('bookstore', 'library', 'reading_cafe') then
    return jsonb_build_object('ok', false, 'error', 'Invalid category');
  end if;

  insert into public.book_map_places (
    name, category, address_text, city, lat, lng, verified, active, source
  ) values (
    trim(p_name), p_category, nullif(trim(p_address), ''), nullif(trim(p_city), ''),
    p_lat, p_lng, false, false, 'user_submission'
  );

  return jsonb_build_object('ok', true, 'pending', true);
end;
$$;

revoke all on function public.submit_book_map_place(text, text, text, text, double precision, double precision) from public;
grant execute on function public.submit_book_map_place(text, text, text, text, double precision, double precision) to authenticated;

-- ---------------------------------------------------------------------------
-- Reader Map (opt-in, coarse, no location history)
-- ---------------------------------------------------------------------------
create table if not exists public.reader_map_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  opted_in boolean not null default false,
  discoverable boolean not null default false,
  share_personality boolean not null default false,
  share_college boolean not null default false,
  coarseness_mode text not null default 'city'
    check (coarseness_mode in ('city', 'neighborhood', 'randomized')),
  city_label text,
  college_label text,
  birth_year integer,
  extra_trust_ok boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

drop trigger if exists reader_map_settings_set_updated_at on public.reader_map_settings;
create trigger reader_map_settings_set_updated_at
  before update on public.reader_map_settings
  for each row execute function public.set_updated_at();

alter table public.reader_map_settings enable row level security;

drop policy if exists "reader_map_settings_select_own" on public.reader_map_settings;
create policy "reader_map_settings_select_own"
  on public.reader_map_settings for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "reader_map_settings_insert_own" on public.reader_map_settings;
create policy "reader_map_settings_insert_own"
  on public.reader_map_settings for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "reader_map_settings_update_own" on public.reader_map_settings;
create policy "reader_map_settings_update_own"
  on public.reader_map_settings for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.reader_map_presence (
  user_id uuid primary key references auth.users (id) on delete cascade,
  precise_lat double precision,
  precise_lng double precision,
  precise_captured_at timestamptz,
  coarse_lat double precision not null,
  coarse_lng double precision not null,
  coarse_label text,
  updated_at timestamptz not null default now()
);

alter table public.reader_map_presence enable row level security;

-- Owner may read their own row (including precise) for private nearby calc.
-- Nobody else can select this table — public markers go through the RPC.
drop policy if exists "reader_map_presence_select_own" on public.reader_map_presence;
create policy "reader_map_presence_select_own"
  on public.reader_map_presence for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "reader_map_presence_upsert_own" on public.reader_map_presence;
create policy "reader_map_presence_insert_own"
  on public.reader_map_presence for insert
  to authenticated
  with check (false);

drop policy if exists "reader_map_presence_update_own" on public.reader_map_presence;
create policy "reader_map_presence_update_deny"
  on public.reader_map_presence for update
  to authenticated
  using (false);

create or replace function public.reader_map_age_status(p_user_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_min numeric;
  v_year integer;
  v_age integer;
begin
  select case
    when jsonb_typeof(value) = 'number' then (value #>> '{}')::numeric
    else null
  end
  into v_min
  from public.feature_flags
  where key = 'reader_map_min_age';

  select coalesce(s.birth_year, p.birth_year)
  into v_year
  from public.profiles p
  left join public.reader_map_settings s on s.user_id = p.id
  where p.id = p_user_id;

  if v_min is null then
    return 'unknown';
  end if;
  if v_year is null then
    return 'unknown';
  end if;

  v_age := extract(year from now())::integer - v_year;
  if v_age < v_min then
    return 'under_minimum';
  end if;
  return 'eligible';
end;
$$;

revoke all on function public.reader_map_age_status(uuid) from public;
grant execute on function public.reader_map_age_status(uuid) to authenticated;

create or replace function public.upsert_reader_map_presence(
  p_lat double precision,
  p_lng double precision,
  p_city_label text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_mode text := 'city';
  v_step numeric := 0.08;
  v_coarse_lat numeric;
  v_coarse_lng numeric;
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'error', 'Not authenticated');
  end if;
  if not public.user_has_home_entitlement(v_user) then
    return jsonb_build_object('ok', false, 'error', 'Home membership required');
  end if;
  if public.reader_map_age_status(v_user) <> 'eligible' then
    return jsonb_build_object('ok', false, 'error', 'Age eligibility required');
  end if;
  if not exists (
    select 1 from public.reader_map_settings s
    where s.user_id = v_user and s.opted_in = true
  ) then
    return jsonb_build_object('ok', false, 'error', 'Reader Map opt-in required');
  end if;

  select coalesce(s.coarseness_mode, 'city') into v_mode
  from public.reader_map_settings s
  where s.user_id = v_user;

  if v_mode = 'neighborhood' then
    v_step := 0.02;
  end if;

  v_coarse_lat := round((round(p_lat / v_step) * v_step)::numeric, 4);
  v_coarse_lng := round((round(p_lng / v_step) * v_step)::numeric, 4);

  if v_mode = 'randomized' then
    v_coarse_lat := round((v_coarse_lat + (((ascii(substr(v_user::text, 1, 1)) % 10) - 5) * 0.003))::numeric, 4);
    v_coarse_lng := round((v_coarse_lng + (((ascii(substr(v_user::text, 2, 1)) % 10) - 5) * 0.003))::numeric, 4);
  end if;

  insert into public.reader_map_presence (
    user_id, precise_lat, precise_lng, precise_captured_at,
    coarse_lat, coarse_lng, coarse_label, updated_at
  ) values (
    v_user, p_lat, p_lng, now(), v_coarse_lat, v_coarse_lng, nullif(trim(p_city_label), ''), now()
  )
  on conflict (user_id) do update set
    precise_lat = excluded.precise_lat,
    precise_lng = excluded.precise_lng,
    precise_captured_at = excluded.precise_captured_at,
    coarse_lat = excluded.coarse_lat,
    coarse_lng = excluded.coarse_lng,
    coarse_label = excluded.coarse_label,
    updated_at = now();

  if p_city_label is not null then
    update public.reader_map_settings
    set city_label = nullif(trim(p_city_label), '')
    where user_id = v_user;
  end if;

  return jsonb_build_object(
    'ok', true,
    'coarse_lat', v_coarse_lat,
    'coarse_lng', v_coarse_lng
  );
end;
$$;

revoke all on function public.upsert_reader_map_presence(double precision, double precision, text) from public;
grant execute on function public.upsert_reader_map_presence(double precision, double precision, text) to authenticated;

create or replace function public.clear_reader_map_precise(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.reader_map_presence
  set precise_lat = null,
      precise_lng = null,
      precise_captured_at = null
  where user_id = p_user_id;
end;
$$;

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
      when s.share_personality then dna.personality_label
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

-- Losing Home automatically disables Reader Map discoverability and drops precise GPS.
create or replace function public.disable_reader_map_on_home_loss()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.user_has_home_entitlement(new.user_id) then
    update public.reader_map_settings
    set opted_in = false,
        discoverable = false
    where user_id = new.user_id;
    perform public.clear_reader_map_precise(new.user_id);
  end if;
  return new;
end;
$$;

drop trigger if exists user_subscriptions_disable_reader_map on public.user_subscriptions;
create trigger user_subscriptions_disable_reader_map
  after update of subscription_tier, subscription_status, subscription_expires_at
  on public.user_subscriptions
  for each row
  execute function public.disable_reader_map_on_home_loss();

-- ---------------------------------------------------------------------------
-- Home experiences + access prices as data
-- ---------------------------------------------------------------------------
create table if not exists public.home_experiences (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in (
    'author_qa', 'virtual_event', 'reading_sprint', 'meetup', 'merch_window', 'partner_benefit'
  )),
  title text not null,
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  visibility text not null default 'home' check (visibility in ('public', 'home', 'ticketed')),
  is_beta boolean not null default false,
  venue_kind text check (venue_kind in ('public_venue', 'virtual', 'arbitrary_address')),
  venue_name text,
  city_label text,
  address_text text,
  coarse_lat double precision,
  coarse_lng double precision,
  video_provider text not null default 'external' check (video_provider in ('external', 'unset')),
  join_url text,
  join_label text,
  required_tier text not null default 'home' check (required_tier in ('free', 'plus', 'home')),
  merch_window_starts_at timestamptz,
  merch_window_ends_at timestamptz,
  partner_benefit_key text,
  rsvp_priority_window_starts_at timestamptz,
  rsvp_priority_window_ends_at timestamptz,
  moderation_status text not null default 'approved'
    check (moderation_status in ('pending', 'approved', 'rejected')),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint home_experiences_title_not_empty check (char_length(trim(title)) > 0),
  constraint home_experiences_join_url_http check (join_url is null or join_url ~* '^https?://')
);

create index if not exists home_experiences_starts_idx
  on public.home_experiences (starts_at);

drop trigger if exists home_experiences_set_updated_at on public.home_experiences;
create trigger home_experiences_set_updated_at
  before update on public.home_experiences
  for each row execute function public.set_updated_at();

alter table public.home_experiences enable row level security;

drop policy if exists "home_experiences_select_visible" on public.home_experiences;
create policy "home_experiences_select_visible"
  on public.home_experiences for select
  to authenticated
  using (
    moderation_status = 'approved'
    and (
      visibility = 'public'
      or (visibility in ('home', 'ticketed') and public.user_has_home_entitlement(auth.uid()))
    )
  );

create table if not exists public.event_access (
  experience_id uuid primary key references public.home_experiences (id) on delete cascade,
  required_tier text not null default 'home' check (required_tier in ('free', 'plus', 'home')),
  price_cents integer,
  lower_tier_fee_cents integer,
  currency text not null default 'usd',
  included_for_home boolean not null default true
);

alter table public.event_access enable row level security;

drop policy if exists "event_access_select" on public.event_access;
create policy "event_access_select"
  on public.event_access for select
  to authenticated
  using (true);

create table if not exists public.home_experience_rsvps (
  experience_id uuid not null references public.home_experiences (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rsvp_status text not null default 'going' check (rsvp_status in ('going', 'maybe', 'not_going')),
  created_at timestamptz not null default now(),
  primary key (experience_id, user_id)
);

alter table public.home_experience_rsvps enable row level security;

drop policy if exists "home_experience_rsvps_select_own" on public.home_experience_rsvps;
create policy "home_experience_rsvps_select_own"
  on public.home_experience_rsvps for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "home_experience_rsvps_insert_own" on public.home_experience_rsvps;
create policy "home_experience_rsvps_insert_own"
  on public.home_experience_rsvps for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.user_has_home_entitlement(auth.uid())
  );

drop policy if exists "home_experience_rsvps_update_own" on public.home_experience_rsvps;
create policy "home_experience_rsvps_update_own"
  on public.home_experience_rsvps for update
  to authenticated
  using (user_id = auth.uid());

create or replace function public.create_home_meetup(
  p_title text,
  p_description text,
  p_venue_kind text,
  p_venue_name text,
  p_city_label text,
  p_address_text text,
  p_starts_at timestamptz,
  p_ends_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_who text;
  v_preapprove boolean;
  v_status text := 'approved';
  v_id uuid;
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'error', 'Not authenticated');
  end if;
  if not public.user_has_home_entitlement(v_user) then
    return jsonb_build_object('ok', false, 'error', 'Home membership required');
  end if;
  if public.reader_map_age_status(v_user) <> 'eligible' then
    return jsonb_build_object('ok', false, 'error', 'Age eligibility required');
  end if;
  if p_venue_kind not in ('public_venue', 'arbitrary_address', 'virtual') then
    return jsonb_build_object('ok', false, 'error', 'Invalid venue');
  end if;

  select coalesce(value #>> '{}', 'home_only') into v_who
  from public.feature_flags where key = 'public_meetup_who_can_create';
  if v_who = 'staff_only' then
    return jsonb_build_object('ok', false, 'error', 'Public meetup creation is staff-only for now');
  end if;

  select coalesce(value = 'true'::jsonb, true) into v_preapprove
  from public.feature_flags where key = 'public_meetup_preapproval';
  if coalesce(v_preapprove, true) then
    v_status := 'pending';
  end if;

  insert into public.home_experiences (
    kind, title, description, starts_at, ends_at, visibility, venue_kind,
    venue_name, city_label, address_text, required_tier, moderation_status, created_by
  ) values (
    'meetup', trim(p_title), nullif(trim(p_description), ''), p_starts_at, p_ends_at,
    'home', p_venue_kind, nullif(trim(p_venue_name), ''), nullif(trim(p_city_label), ''),
    nullif(trim(p_address_text), ''), 'home', v_status, v_user
  )
  returning id into v_id;

  return jsonb_build_object('ok', true, 'id', v_id, 'moderation_status', v_status);
end;
$$;

revoke all on function public.create_home_meetup(text, text, text, text, text, text, timestamptz, timestamptz) from public;
grant execute on function public.create_home_meetup(text, text, text, text, text, text, timestamptz, timestamptz) to authenticated;

-- Join URL is hidden until Home + RSVP (or staff). Never returned from the list policy.
create or replace function public.get_experience_join_config(p_experience_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_row public.home_experiences%rowtype;
  v_rsvp text;
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'error', 'Not authenticated');
  end if;
  if not public.user_has_home_entitlement(v_user) then
    return jsonb_build_object('ok', false, 'error', 'Home membership required');
  end if;

  select * into v_row from public.home_experiences where id = p_experience_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Not found');
  end if;

  select r.rsvp_status into v_rsvp
  from public.home_experience_rsvps r
  where r.experience_id = p_experience_id and r.user_id = v_user;

  if v_rsvp is distinct from 'going' then
    return jsonb_build_object('ok', false, 'error', 'RSVP required', 'join_url', null);
  end if;

  return jsonb_build_object(
    'ok', true,
    'provider', v_row.video_provider,
    'join_url', v_row.join_url,
    'label', v_row.join_label
  );
end;
$$;

revoke all on function public.get_experience_join_config(uuid) from public;
grant execute on function public.get_experience_join_config(uuid) to authenticated;

-- Hide join_url on direct table selects for non-owners.
create or replace function public.home_experiences_hide_join_url()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is distinct from new.created_by then
    new.join_url := null;
  end if;
  return new;
end;
$$;

-- Column grant: clients should use the list view without join_url.
create or replace view public.home_experiences_public
with (security_invoker = true)
as
select
  id, kind, title, description, starts_at, ends_at, visibility, is_beta,
  venue_kind, venue_name, city_label, video_provider, required_tier,
  merch_window_starts_at, merch_window_ends_at, partner_benefit_key,
  rsvp_priority_window_starts_at, rsvp_priority_window_ends_at,
  moderation_status, created_at
from public.home_experiences
where moderation_status = 'approved';

grant select on public.home_experiences_public to authenticated;

revoke select on public.home_experiences from authenticated;
grant select (
  id, kind, title, description, starts_at, ends_at, visibility, is_beta,
  venue_kind, venue_name, city_label, address_text, coarse_lat, coarse_lng,
  video_provider, required_tier, merch_window_starts_at, merch_window_ends_at,
  partner_benefit_key, rsvp_priority_window_starts_at, rsvp_priority_window_ends_at,
  moderation_status, created_by, created_at, updated_at
) on public.home_experiences to authenticated;

-- ---------------------------------------------------------------------------
-- Club events: video_provider column (attach external meeting)
-- ---------------------------------------------------------------------------
alter table public.book_club_events
  add column if not exists video_provider text;

alter table public.book_club_events
  drop constraint if exists book_club_events_video_provider_check;
alter table public.book_club_events
  add constraint book_club_events_video_provider_check
  check (video_provider is null or video_provider in ('external', 'unset'));

-- ---------------------------------------------------------------------------
-- Concierge: feature requests + support tickets (priority server-derived)
-- ---------------------------------------------------------------------------
create table if not exists public.feature_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text not null,
  category text not null default 'other',
  problem text not null,
  screenshot_url text,
  priority text not null default 'standard' check (priority in ('standard', 'home_priority')),
  status text not null default 'open' check (status in ('open', 'reviewing', 'closed')),
  created_at timestamptz not null default now()
);

create index if not exists feature_requests_user_idx
  on public.feature_requests (user_id, created_at desc);

alter table public.feature_requests enable row level security;

drop policy if exists "feature_requests_select_own" on public.feature_requests;
create policy "feature_requests_select_own"
  on public.feature_requests for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "feature_requests_insert_own" on public.feature_requests;
create policy "feature_requests_insert_own"
  on public.feature_requests for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.user_has_home_entitlement(auth.uid())
    and priority = 'standard'
  );

create or replace function public.submit_feature_request(
  p_title text,
  p_description text,
  p_category text,
  p_problem text,
  p_screenshot_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_priority text := 'standard';
  v_id uuid;
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'error', 'Not authenticated');
  end if;
  if not public.user_has_home_entitlement(v_user) then
    return jsonb_build_object('ok', false, 'error', 'Home membership required');
  end if;

  v_priority := 'home_priority';

  insert into public.feature_requests (
    user_id, title, description, category, problem, screenshot_url, priority
  ) values (
    v_user, trim(p_title), trim(p_description), coalesce(nullif(trim(p_category), ''), 'other'),
    trim(p_problem), nullif(trim(p_screenshot_url), ''), v_priority
  )
  returning id into v_id;

  return jsonb_build_object('ok', true, 'id', v_id, 'priority', v_priority);
end;
$$;

revoke all on function public.submit_feature_request(text, text, text, text, text) from public;
grant execute on function public.submit_feature_request(text, text, text, text, text) to authenticated;

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject text not null,
  body text not null,
  priority_tag text not null default 'standard' check (priority_tag in ('standard', 'Priority Support')),
  status text not null default 'open' check (status in ('open', 'reviewing', 'closed')),
  created_at timestamptz not null default now()
);

alter table public.support_tickets enable row level security;

drop policy if exists "support_tickets_select_own" on public.support_tickets;
create policy "support_tickets_select_own"
  on public.support_tickets for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "support_tickets_insert_own" on public.support_tickets;
create policy "support_tickets_insert_own"
  on public.support_tickets for insert
  to authenticated
  with check (user_id = auth.uid() and priority_tag = 'standard');

create or replace function public.submit_support_ticket(p_subject text, p_body text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_tag text := 'standard';
  v_id uuid;
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'error', 'Not authenticated');
  end if;
  if public.user_has_home_entitlement(v_user) then
    v_tag := 'Priority Support';
  end if;

  insert into public.support_tickets (user_id, subject, body, priority_tag)
  values (v_user, trim(p_subject), trim(p_body), v_tag)
  returning id into v_id;

  return jsonb_build_object('ok', true, 'id', v_id, 'priority_tag', v_tag);
end;
$$;

revoke all on function public.submit_support_ticket(text, text) from public;
grant execute on function public.submit_support_ticket(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Reports: Book Map places + Home UGC
-- ---------------------------------------------------------------------------
alter table public.content_reports
  drop constraint if exists content_reports_content_type_check;
alter table public.content_reports
  add constraint content_reports_content_type_check
  check (content_type in (
    'post',
    'comment',
    'message',
    'review',
    'club_post',
    'club_discussion',
    'club_reply',
    'club',
    'profile',
    'book_map_place',
    'home_meetup',
    'home_experience'
  ));

alter table public.content_reports
  drop constraint if exists content_reports_reason_check;
alter table public.content_reports
  add constraint content_reports_reason_check
  check (reason in (
    'hate_discrimination',
    'harassment_bullying',
    'threats_violence',
    'sexual_inappropriate',
    'spam',
    'impersonation',
    'other',
    'closed',
    'wrong_info',
    'duplicate',
    'incorrect',
    'inappropriate_place'
  ));
