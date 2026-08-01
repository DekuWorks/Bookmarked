-- Reading DNA persistence + usage counter RPCs + reading challenges foundation.
-- Clients cannot write their own tier/usage; RPCs use security definer + auth.uid().

-- ---------------------------------------------------------------------------
-- reading_dna_profiles
-- ---------------------------------------------------------------------------
create table if not exists public.reading_dna_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  summary text,
  insight text,
  confidence text not null default 'low'
    check (confidence in ('none', 'low', 'medium', 'high')),
  confidence_score numeric(4,3) not null default 0
    check (confidence_score >= 0 and confidence_score <= 1),
  sample_size integer not null default 0 check (sample_size >= 0),
  public_top_traits_approved boolean not null default false,
  computed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists reading_dna_profiles_set_updated_at on public.reading_dna_profiles;
create trigger reading_dna_profiles_set_updated_at
  before update on public.reading_dna_profiles
  for each row
  execute function public.set_updated_at();

alter table public.reading_dna_profiles enable row level security;

drop policy if exists "reading_dna_profiles_select_own" on public.reading_dna_profiles;
create policy "reading_dna_profiles_select_own"
  on public.reading_dna_profiles for select
  using (auth.uid() = user_id);

drop policy if exists "reading_dna_profiles_select_public_approved" on public.reading_dna_profiles;
create policy "reading_dna_profiles_select_public_approved"
  on public.reading_dna_profiles for select
  using (public_top_traits_approved = true);

-- No client insert/update/delete — service role / security definer only.

-- ---------------------------------------------------------------------------
-- reading_dna_traits
-- ---------------------------------------------------------------------------
create table if not exists public.reading_dna_traits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null
    check (category in ('genre', 'vibe', 'emotion', 'trope', 'habit')),
  label text not null,
  score numeric not null default 0,
  percent numeric not null default 0,
  emoji text,
  persona text,
  is_top_trait boolean not null default false,
  is_public_approved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, category, label)
);

create index if not exists reading_dna_traits_user_id_idx
  on public.reading_dna_traits (user_id);

alter table public.reading_dna_traits enable row level security;

drop policy if exists "reading_dna_traits_select_own" on public.reading_dna_traits;
create policy "reading_dna_traits_select_own"
  on public.reading_dna_traits for select
  using (auth.uid() = user_id);

drop policy if exists "reading_dna_traits_select_public_top" on public.reading_dna_traits;
create policy "reading_dna_traits_select_public_top"
  on public.reading_dna_traits for select
  using (is_public_approved = true and is_top_trait = true);

-- ---------------------------------------------------------------------------
-- reading_dna_snapshots
-- ---------------------------------------------------------------------------
create table if not exists public.reading_dna_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  period_key text not null,
  payload jsonb not null default '{}'::jsonb,
  confidence text not null default 'low'
    check (confidence in ('none', 'low', 'medium', 'high')),
  created_at timestamptz not null default now(),
  unique (user_id, period_key)
);

create index if not exists reading_dna_snapshots_user_id_idx
  on public.reading_dna_snapshots (user_id);

alter table public.reading_dna_snapshots enable row level security;

drop policy if exists "reading_dna_snapshots_select_own" on public.reading_dna_snapshots;
create policy "reading_dna_snapshots_select_own"
  on public.reading_dna_snapshots for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- reading challenges (Free: 3 joins per calendar year)
-- ---------------------------------------------------------------------------
create table if not exists public.reading_challenges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  year integer not null,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.reading_challenge_members (
  challenge_id uuid not null references public.reading_challenges (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (challenge_id, user_id)
);

create index if not exists reading_challenge_members_user_id_idx
  on public.reading_challenge_members (user_id);

alter table public.reading_challenges enable row level security;
alter table public.reading_challenge_members enable row level security;

drop policy if exists "reading_challenges_select_active" on public.reading_challenges;
create policy "reading_challenges_select_active"
  on public.reading_challenges for select
  using (is_active = true);

drop policy if exists "reading_challenge_members_select_own" on public.reading_challenge_members;
create policy "reading_challenge_members_select_own"
  on public.reading_challenge_members for select
  using (auth.uid() = user_id);

drop policy if exists "reading_challenge_members_insert_own" on public.reading_challenge_members;
create policy "reading_challenge_members_insert_own"
  on public.reading_challenge_members for insert
  with check (auth.uid() = user_id);

drop policy if exists "reading_challenge_members_delete_own" on public.reading_challenge_members;
create policy "reading_challenge_members_delete_own"
  on public.reading_challenge_members for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Usage counter helpers (quote_graphics monthly, reading_challenges yearly)
-- ---------------------------------------------------------------------------
create or replace function public.get_usage_count(
  p_counter_key text,
  p_period_key text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select count into v_count
  from public.usage_counters
  where user_id = auth.uid()
    and counter_key = p_counter_key
    and period_key = p_period_key;

  return coalesce(v_count, 0);
end;
$$;

create or replace function public.try_increment_usage_counter(
  p_counter_key text,
  p_period_key text,
  p_limit integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_count integer;
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'Not authenticated');
  end if;

  if p_limit is null or p_limit < 0 then
    return jsonb_build_object('ok', false, 'error', 'Invalid limit');
  end if;

  insert into public.usage_counters (user_id, counter_key, period_key, count)
  values (v_user_id, p_counter_key, p_period_key, 0)
  on conflict (user_id, counter_key, period_key) do nothing;

  select count into v_count
  from public.usage_counters
  where user_id = v_user_id
    and counter_key = p_counter_key
    and period_key = p_period_key
  for update;

  if v_count >= p_limit then
    return jsonb_build_object(
      'ok', false,
      'error', 'limit',
      'count', v_count,
      'limit', p_limit
    );
  end if;

  update public.usage_counters
  set count = v_count + 1,
      updated_at = now()
  where user_id = v_user_id
    and counter_key = p_counter_key
    and period_key = p_period_key;

  return jsonb_build_object(
    'ok', true,
    'count', v_count + 1,
    'limit', p_limit,
    'remaining', greatest(p_limit - (v_count + 1), 0)
  );
end;
$$;

revoke all on function public.get_usage_count(text, text) from public;
revoke all on function public.try_increment_usage_counter(text, text, integer) from public;
grant execute on function public.get_usage_count(text, text) to authenticated;
grant execute on function public.try_increment_usage_counter(text, text, integer) to authenticated;
