-- Free-tier server enforcement + yearly reading goals (user_id, year).
-- Additive only. Existing over-limit rows stay; new inserts beyond Free caps fail.

-- ---------------------------------------------------------------------------
-- yearly_reading_goals
-- ---------------------------------------------------------------------------
create table if not exists public.yearly_reading_goals (
  user_id uuid not null references auth.users (id) on delete cascade,
  year integer not null check (year >= 1970 and year <= 2100),
  target integer not null check (target >= 1 and target <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, year)
);

create index if not exists yearly_reading_goals_year_idx
  on public.yearly_reading_goals (year);

alter table public.yearly_reading_goals enable row level security;

drop policy if exists "yearly_reading_goals_select_own" on public.yearly_reading_goals;
create policy "yearly_reading_goals_select_own"
  on public.yearly_reading_goals for select
  using (auth.uid() = user_id);

drop policy if exists "yearly_reading_goals_insert_own" on public.yearly_reading_goals;
create policy "yearly_reading_goals_insert_own"
  on public.yearly_reading_goals for insert
  with check (auth.uid() = user_id);

drop policy if exists "yearly_reading_goals_update_own" on public.yearly_reading_goals;
create policy "yearly_reading_goals_update_own"
  on public.yearly_reading_goals for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "yearly_reading_goals_delete_own" on public.yearly_reading_goals;
create policy "yearly_reading_goals_delete_own"
  on public.yearly_reading_goals for delete
  using (auth.uid() = user_id);

drop trigger if exists yearly_reading_goals_set_updated_at on public.yearly_reading_goals;
create trigger yearly_reading_goals_set_updated_at
  before update on public.yearly_reading_goals
  for each row
  execute function public.set_updated_at();

insert into public.yearly_reading_goals (user_id, year, target)
select
  p.id,
  extract(year from timezone('utc', now()))::integer,
  p.yearly_reading_goal
from public.profiles p
where p.yearly_reading_goal is not null
  and p.yearly_reading_goal >= 1
on conflict (user_id, year) do nothing;

-- ---------------------------------------------------------------------------
-- Paid bypass helper (already exists from challenges engine; recreate if needed)
-- ---------------------------------------------------------------------------
create or replace function public.user_has_paid_entitlement(p_user_id uuid)
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
      and s.subscription_tier in ('plus', 'home')
      and s.subscription_status in ('active', 'trialing', 'past_due', 'grace_period', 'canceled')
      and (
        s.subscription_expires_at is null
        and s.subscription_status <> 'canceled'
        or s.subscription_expires_at > now()
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- Custom shelves: block the 2nd+ create for Free. Existing shelves stay.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_custom_shelf_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if public.user_has_paid_entitlement(new.user_id) then
    return new;
  end if;

  select count(*) into v_count
  from public.user_shelves
  where user_id = new.user_id;

  if v_count >= 1 then
    raise exception 'Free members can create 1 custom shelf. Upgrade to Bookmarked Plus for unlimited shelves.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists user_shelves_enforce_free_limit on public.user_shelves;
create trigger user_shelves_enforce_free_limit
  before insert on public.user_shelves
  for each row
  execute function public.enforce_custom_shelf_limit();

-- ---------------------------------------------------------------------------
-- Club joins: 3 active memberships for Free.
-- Owner-create rows (role = owner) do not consume the join cap.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_book_club_join_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_status text;
  v_role text;
begin
  v_status := coalesce(new.membership_status, 'active');
  v_role := coalesce(new.role, 'member');

  if v_status <> 'active' then
    return new;
  end if;

  -- Create-as-owner is flagged separately and does not consume the join slot.
  if v_role = 'owner' then
    return new;
  end if;

  if tg_op = 'UPDATE'
     and coalesce(old.membership_status, '') = 'active'
     and coalesce(old.role, 'member') <> 'owner' then
    return new;
  end if;

  if public.user_has_paid_entitlement(new.user_id) then
    return new;
  end if;

  select count(*) into v_count
  from public.book_club_members
  where user_id = new.user_id
    and membership_status = 'active'
    and coalesce(role, 'member') <> 'owner'
    and club_id <> new.club_id;

  if v_count >= 3 then
    raise exception 'Free members can join 3 book clubs. Upgrade to Bookmarked Plus for unlimited clubs.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists book_club_members_enforce_free_limit on public.book_club_members;
create trigger book_club_members_enforce_free_limit
  before insert or update of membership_status, role on public.book_club_members
  for each row
  execute function public.enforce_book_club_join_limit();

-- ---------------------------------------------------------------------------
-- Favorite quotes: 25 for Free. Notes without quote text stay unlimited.
-- ---------------------------------------------------------------------------
create or replace function public.note_counts_as_saved_quote(
  p_quote text,
  p_category text
)
returns boolean
language sql
immutable
as $$
  select coalesce(length(trim(p_quote)), 0) > 0
    or p_category = 'favorite_quote';
$$;

create or replace function public.enforce_saved_quote_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_was_quote boolean := false;
begin
  if not public.note_counts_as_saved_quote(new.quote, new.category) then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    v_was_quote := public.note_counts_as_saved_quote(old.quote, old.category);
    if v_was_quote then
      return new;
    end if;
  end if;

  if public.user_has_paid_entitlement(new.user_id) then
    return new;
  end if;

  select count(*) into v_count
  from public.reading_notes
  where user_id = new.user_id
    and (
      coalesce(length(trim(quote)), 0) > 0
      or category = 'favorite_quote'
    );

  if v_count >= 25 then
    raise exception 'Free members can save 25 quotes. Upgrade to Bookmarked Plus for unlimited quote vault space.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists reading_notes_enforce_quote_limit on public.reading_notes;
create trigger reading_notes_enforce_quote_limit
  before insert or update of quote, category on public.reading_notes
  for each row
  execute function public.enforce_saved_quote_limit();

-- ---------------------------------------------------------------------------
-- Quote graphics: refund a slot when generation fails after consume.
-- ---------------------------------------------------------------------------
create or replace function public.try_decrement_usage_counter(
  p_counter_key text,
  p_period_key text
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

  select count into v_count
  from public.usage_counters
  where user_id = v_user_id
    and counter_key = p_counter_key
    and period_key = p_period_key
  for update;

  if v_count is null or v_count <= 0 then
    return jsonb_build_object('ok', true, 'count', 0, 'remaining', null);
  end if;

  update public.usage_counters
  set count = v_count - 1,
      updated_at = now()
  where user_id = v_user_id
    and counter_key = p_counter_key
    and period_key = p_period_key;

  return jsonb_build_object('ok', true, 'count', v_count - 1);
end;
$$;

revoke all on function public.try_decrement_usage_counter(text, text) from public;
grant execute on function public.try_decrement_usage_counter(text, text) to authenticated;

revoke all on function public.user_has_paid_entitlement(uuid) from public;
grant execute on function public.user_has_paid_entitlement(uuid) to authenticated;
