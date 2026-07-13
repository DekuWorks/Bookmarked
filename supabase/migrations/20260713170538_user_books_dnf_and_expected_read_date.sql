-- Promote DNF ("did not finish") to a real state and add a real "Date to Read"
-- (expected read date) column on user_books.
--
-- Prior to this migration:
--   * DNF was only *derived* on mobile from `completion_tags` containing "dnf"
--     (a value nothing ever wrote), so the DNF tab was effectively always empty.
--   * "Date to Read" was *approximated* on mobile by `started_at ?? created_at`.
--
-- These are now first-class columns so web and mobile can read/write them
-- directly. RLS is unchanged: the existing row-level owner policies on
-- user_books (auth.uid() = user_id for select/insert/update/delete) already
-- cover every column, so no new policies are required.

alter table public.user_books
  add column if not exists dnf boolean not null default false,
  add column if not exists expected_read_date date;

-- Backfill DNF from any legacy completion_tags marker so nothing regresses.
update public.user_books
set dnf = true
where dnf = false
  and exists (
    select 1
    from unnest(completion_tags) as tag
    where lower(tag) = 'dnf'
  );

-- Partial index to keep the mobile DNF tab fast for readers with large shelves.
create index if not exists user_books_dnf_idx
  on public.user_books (user_id)
  where dnf = true;

-- Index the expected read date for the "Date to Read" sort.
create index if not exists user_books_expected_read_date_idx
  on public.user_books (user_id, expected_read_date)
  where expected_read_date is not null;

comment on column public.user_books.dnf is
  'Reader explicitly marked this book as did-not-finish. A real DNF state (was previously derived from completion_tags).';
comment on column public.user_books.expected_read_date is
  'Target/expected date the reader plans to read this book ("Date to Read"). Used by library sort.';
