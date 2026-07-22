-- Premium subscription state (owner-only via RLS; not exposed on public profiles)

create table if not exists public.user_subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  subscription_tier text not null default 'free'
    check (subscription_tier in ('free', 'premium')),
  subscription_status text not null default 'inactive'
    check (subscription_status in ('inactive', 'active', 'trialing', 'past_due', 'canceled')),
  subscription_provider text
    check (
      subscription_provider is null
      or subscription_provider in ('stripe', 'apple', 'google', 'manual')
    ),
  subscription_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_subscriptions_status_idx
  on public.user_subscriptions (subscription_status);

drop trigger if exists user_subscriptions_set_updated_at on public.user_subscriptions;
create trigger user_subscriptions_set_updated_at
  before update on public.user_subscriptions
  for each row
  execute function public.set_updated_at();

alter table public.user_subscriptions enable row level security;

drop policy if exists "user_subscriptions_select_own" on public.user_subscriptions;
create policy "user_subscriptions_select_own"
  on public.user_subscriptions
  for select
  using (auth.uid() = user_id);

drop policy if exists "user_subscriptions_insert_own" on public.user_subscriptions;
create policy "user_subscriptions_insert_own"
  on public.user_subscriptions
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_subscriptions_update_own" on public.user_subscriptions;
create policy "user_subscriptions_update_own"
  on public.user_subscriptions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Ensure every profile owner has a subscription row for feature gating.
create or replace function public.ensure_user_subscription()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_subscriptions (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists profiles_ensure_subscription on public.profiles;
create trigger profiles_ensure_subscription
  after insert on public.profiles
  for each row
  execute function public.ensure_user_subscription();

-- Backfill existing profiles.
insert into public.user_subscriptions (user_id)
select id from public.profiles
on conflict (user_id) do nothing;
