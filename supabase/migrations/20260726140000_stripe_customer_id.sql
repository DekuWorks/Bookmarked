-- Link Stripe customers to Supabase users for webhook invoice events.

alter table public.user_subscriptions
  add column if not exists stripe_customer_id text;

create unique index if not exists user_subscriptions_stripe_customer_id_idx
  on public.user_subscriptions (stripe_customer_id)
  where stripe_customer_id is not null;
