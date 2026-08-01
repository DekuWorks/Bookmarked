-- Replace the legacy Premium tier with the explicit Plus and Home membership tiers.
-- Existing paid subscribers retain their paid access as Plus members.
update public.user_subscriptions
set subscription_tier = 'plus'
where subscription_tier = 'premium';

do $$
declare
  tier_constraint text;
begin
  select con.conname
  into tier_constraint
  from pg_constraint con
  join pg_attribute attr
    on attr.attrelid = con.conrelid
    and attr.attnum = any (con.conkey)
  where con.conrelid = 'public.user_subscriptions'::regclass
    and con.contype = 'c'
    and attr.attname = 'subscription_tier'
  limit 1;

  if tier_constraint is not null then
    execute format(
      'alter table public.user_subscriptions drop constraint %I',
      tier_constraint
    );
  end if;
end
$$;

alter table public.user_subscriptions
  add constraint user_subscriptions_subscription_tier_check
  check (subscription_tier in ('free', 'plus', 'home'));
