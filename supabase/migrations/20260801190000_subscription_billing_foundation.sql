-- Phase 3 billing foundation:
-- - Align subscription_status with active|trialing|past_due|canceled|expired|grace_period (+ inactive)
-- - Harden RLS so clients cannot write their own tier/usage
-- - Add subscription_events (idempotent webhook log), usage_counters, subscription_entitlements

-- ---------------------------------------------------------------------------
-- user_subscriptions: status constraint
-- ---------------------------------------------------------------------------
do $$
declare
  status_constraint text;
begin
  select con.conname
  into status_constraint
  from pg_constraint con
  join pg_attribute attr
    on attr.attrelid = con.conrelid
    and attr.attnum = any (con.conkey)
  where con.conrelid = 'public.user_subscriptions'::regclass
    and con.contype = 'c'
    and attr.attname = 'subscription_status'
  limit 1;

  if status_constraint is not null then
    execute format(
      'alter table public.user_subscriptions drop constraint %I',
      status_constraint
    );
  end if;
end
$$;

alter table public.user_subscriptions
  add constraint user_subscriptions_subscription_status_check
  check (
    subscription_status in (
      'inactive',
      'active',
      'trialing',
      'past_due',
      'canceled',
      'expired',
      'grace_period'
    )
  );

-- Clients may read their own row; only service role (webhooks / verify) may write.
drop policy if exists "user_subscriptions_insert_own" on public.user_subscriptions;
drop policy if exists "user_subscriptions_update_own" on public.user_subscriptions;

-- ---------------------------------------------------------------------------
-- subscription_events — idempotent provider event log
-- ---------------------------------------------------------------------------
create table if not exists public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  provider text not null
    check (provider in ('stripe', 'apple', 'google', 'manual')),
  event_id text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (provider, event_id)
);

create index if not exists subscription_events_user_id_idx
  on public.subscription_events (user_id);

create index if not exists subscription_events_processed_at_idx
  on public.subscription_events (processed_at desc);

alter table public.subscription_events enable row level security;

drop policy if exists "subscription_events_select_own" on public.subscription_events;
create policy "subscription_events_select_own"
  on public.subscription_events
  for select
  using (auth.uid() = user_id);

-- No insert/update/delete policies for authenticated clients (service role bypasses RLS).

-- ---------------------------------------------------------------------------
-- usage_counters — monthly/yearly entitlement usage (server-managed)
-- ---------------------------------------------------------------------------
create table if not exists public.usage_counters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  counter_key text not null,
  period_key text not null,
  count integer not null default 0 check (count >= 0),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, counter_key, period_key)
);

create index if not exists usage_counters_user_id_idx
  on public.usage_counters (user_id);

alter table public.usage_counters enable row level security;

drop policy if exists "usage_counters_select_own" on public.usage_counters;
create policy "usage_counters_select_own"
  on public.usage_counters
  for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- subscription_entitlements — server-written snapshot after purchase/restore
-- ---------------------------------------------------------------------------
create table if not exists public.subscription_entitlements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  subscription_tier text not null default 'free'
    check (subscription_tier in ('free', 'plus', 'home')),
  reading_dna_access text not null default 'top_three'
    check (reading_dna_access in ('top_three', 'full', 'advanced')),
  entitlements jsonb not null default '{}'::jsonb,
  refreshed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists subscription_entitlements_set_updated_at on public.subscription_entitlements;
create trigger subscription_entitlements_set_updated_at
  before update on public.subscription_entitlements
  for each row
  execute function public.set_updated_at();

alter table public.subscription_entitlements enable row level security;

drop policy if exists "subscription_entitlements_select_own" on public.subscription_entitlements;
create policy "subscription_entitlements_select_own"
  on public.subscription_entitlements
  for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Helper: refresh entitlement snapshot (security definer for triggers / RPC)
-- ---------------------------------------------------------------------------
create or replace function public.refresh_subscription_entitlements(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tier text;
  v_dna text;
begin
  select subscription_tier
  into v_tier
  from public.user_subscriptions
  where user_id = p_user_id;

  if v_tier is null then
    v_tier := 'free';
  end if;

  v_dna := case v_tier
    when 'home' then 'advanced'
    when 'plus' then 'full'
    else 'top_three'
  end;

  insert into public.subscription_entitlements (
    user_id,
    subscription_tier,
    reading_dna_access,
    entitlements,
    refreshed_at
  )
  values (
    p_user_id,
    v_tier,
    v_dna,
    jsonb_build_object(
      'tier', v_tier,
      'readingDNAAccess', v_dna
    ),
    now()
  )
  on conflict (user_id) do update
  set
    subscription_tier = excluded.subscription_tier,
    reading_dna_access = excluded.reading_dna_access,
    entitlements = excluded.entitlements,
    refreshed_at = excluded.refreshed_at,
    updated_at = now();
end;
$$;

revoke all on function public.refresh_subscription_entitlements(uuid) from public;
grant execute on function public.refresh_subscription_entitlements(uuid) to service_role;
