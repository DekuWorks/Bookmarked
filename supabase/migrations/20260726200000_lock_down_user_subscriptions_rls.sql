-- Prevent authenticated clients from self-granting Premium.
--
-- Subscription rows are still readable by their owner for feature gating. Rows are
-- created by the security-definer profile trigger and updated by service-role
-- billing functions, which bypass RLS.

drop policy if exists "user_subscriptions_insert_own" on public.user_subscriptions;
drop policy if exists "user_subscriptions_update_own" on public.user_subscriptions;

drop policy if exists "user_subscriptions_select_own" on public.user_subscriptions;
create policy "user_subscriptions_select_own"
  on public.user_subscriptions
  for select
  using (auth.uid() = user_id);
