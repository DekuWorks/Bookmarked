-- Product rules: club create-as-owner consumes the Free 3-club cap;
-- official / featured challenge joins are free extras.
-- Additive only. Existing over-limit rows stay readable.

-- ---------------------------------------------------------------------------
-- Clubs: every active membership (owner + member) counts toward the Free cap.
-- Leave / delete already drop membership_status or the row, which frees a slot.
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
begin
  v_status := coalesce(new.membership_status, 'active');

  if v_status <> 'active' then
    return new;
  end if;

  if tg_op = 'UPDATE' and coalesce(old.membership_status, '') = 'active' then
    return new;
  end if;

  if public.user_has_paid_entitlement(new.user_id) then
    return new;
  end if;

  select count(*) into v_count
  from public.book_club_members
  where user_id = new.user_id
    and membership_status = 'active'
    and club_id <> new.club_id;

  if v_count >= 3 then
    raise exception 'Free members can be in 3 book clubs. Creating or joining both count. Upgrade to Bookmarked Plus for unlimited clubs.'
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
-- Challenges: official / featured do not consume a yearly slot.
-- user / community / club / friend joins do. Rejoin of the same challenge
-- (status left → active) does not consume a second slot.
-- ---------------------------------------------------------------------------
create or replace function public.challenge_membership_consumes_yearly_slot(
  p_owner_kind text,
  p_featured boolean
)
returns boolean
language sql
immutable
as $$
  select not (
    coalesce(p_owner_kind, '') = 'official'
    or coalesce(p_featured, false)
  );
$$;

create or replace function public.enforce_reading_challenge_join_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_kind text;
  v_featured boolean;
  v_year integer;
  v_count integer;
begin
  if tg_op = 'UPDATE' and old.challenge_id = new.challenge_id then
    -- Same challenge: rejoin / status change never consumes a second slot.
    return new;
  end if;

  if coalesce(new.status, 'active') not in ('active', 'completed') then
    return new;
  end if;

  select c.owner_kind, c.featured, c.year
    into v_owner_kind, v_featured, v_year
  from public.reading_challenges c
  where c.id = new.challenge_id;

  if not found then
    return new;
  end if;

  if not public.challenge_membership_consumes_yearly_slot(v_owner_kind, v_featured) then
    return new;
  end if;

  if public.user_has_paid_entitlement(new.user_id) then
    return new;
  end if;

  if v_year is null then
    v_year := extract(year from timezone('utc', now()))::integer;
  end if;

  select count(*) into v_count
  from public.reading_challenge_members m
  join public.reading_challenges c on c.id = m.challenge_id
  where m.user_id = new.user_id
    and m.challenge_id <> new.challenge_id
    and c.year = v_year
    and public.challenge_membership_consumes_yearly_slot(c.owner_kind, c.featured);

  if v_count >= 3 then
    raise exception 'Free members can join 3 community, club, or friend challenges per year. Official Bookmarked challenges do not use a slot. Upgrade to Bookmarked Plus for unlimited challenges.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists reading_challenge_members_enforce_free_limit on public.reading_challenge_members;
create trigger reading_challenge_members_enforce_free_limit
  before insert or update of status on public.reading_challenge_members
  for each row
  execute function public.enforce_reading_challenge_join_limit();
