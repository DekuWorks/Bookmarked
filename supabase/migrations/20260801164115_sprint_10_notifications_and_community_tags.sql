-- Sprint 10: reader-voted content signals. A reader may vote once per tag
-- after finishing the book; only aggregate totals are exposed publicly.
create table if not exists public.book_content_tag_votes (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  tag text not null check (tag in (
    'romance', 'smut', 'high_spice', 'slow_burn', 'dragons', 'magic',
    'cozy', 'emotional', 'found_family'
  )),
  created_at timestamptz not null default now(),
  unique (book_id, user_id, tag)
);

create index if not exists book_content_tag_votes_book_tag_idx
  on public.book_content_tag_votes (book_id, tag);

alter table public.book_content_tag_votes enable row level security;

create policy "content tag votes are publicly readable"
  on public.book_content_tag_votes for select
  to authenticated
  using (true);

create policy "finished readers can vote on content tags"
  on public.book_content_tag_votes for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.user_books ub
      where ub.user_id = auth.uid()
        and ub.book_id = book_content_tag_votes.book_id
        and ub.shelf_status = 'read'
    )
  );

create policy "readers can remove their own content-tag votes"
  on public.book_content_tag_votes for delete
  to authenticated
  using (user_id = auth.uid());

create or replace view public.book_content_tag_summary
with (security_invoker = true)
as
select
  book_id,
  tag,
  count(*)::integer as vote_count,
  round(
    100.0 * count(*) / nullif(sum(count(*)) over (partition by book_id), 0),
    1
  ) as vote_percentage
from public.book_content_tag_votes
group by book_id, tag;

comment on table public.book_content_tag_votes is
  'Community content signals. Votes require a completed user_books record.';
