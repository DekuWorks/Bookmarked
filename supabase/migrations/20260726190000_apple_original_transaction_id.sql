-- Link Apple subscriptions to Bookmarked users for Server Notifications / renewals.

alter table public.user_subscriptions
  add column if not exists apple_original_transaction_id text;

create unique index if not exists user_subscriptions_apple_original_transaction_id_idx
  on public.user_subscriptions (apple_original_transaction_id)
  where apple_original_transaction_id is not null;
