-- Phase 2: Community & Reading Experience
-- Multiple reads, enriched reviews, completion tags, series prep (Phase 3 UI deferred)

alter table public.books
  add column if not exists series_name text,
  add column if not exists series_position numeric;

comment on column public.books.series_name is 'Phase 3: optional series name; series UI not yet implemented';
comment on column public.books.series_position is 'Phase 3: optional position in series; series UI not yet implemented';

alter table public.user_books
  add column if not exists read_count integer not null default 1,
  add column if not exists completion_tags text[] not null default '{}';

alter table public.user_books
  drop constraint if exists user_books_read_count_positive;

alter table public.user_books
  add constraint user_books_read_count_positive check (read_count >= 1);

alter table public.reading_sessions
  add column if not exists read_number integer not null default 1;

drop index if exists public.reviews_user_book_unique;

alter table public.reviews
  add column if not exists user_book_id uuid references public.user_books (id) on delete set null,
  add column if not exists read_number integer not null default 1,
  add column if not exists edition text,
  add column if not exists feelings text[] not null default '{}',
  add column if not exists plot numeric,
  add column if not exists characters numeric,
  add column if not exists writing_style numeric,
  add column if not exists world_building numeric,
  add column if not exists pacing numeric,
  add column if not exists emotional_impact numeric,
  add column if not exists rating_mode text not null default 'regular';

alter table public.reviews
  drop constraint if exists reviews_rating_mode_check;

alter table public.reviews
  add constraint reviews_rating_mode_check
  check (rating_mode in ('regular', 'advanced'));

alter table public.reviews
  drop constraint if exists reviews_rating_half_star;

alter table public.reviews
  add constraint reviews_rating_half_star check (
    rating is null
    or (
      rating >= 0.5
      and rating <= 5
      and (rating * 2) = floor(rating * 2)
    )
  );

alter table public.reviews
  drop constraint if exists reviews_aspect_rating_half_star;

alter table public.reviews
  add constraint reviews_aspect_rating_half_star check (
    (plot is null or (plot >= 0.5 and plot <= 5 and (plot * 2) = floor(plot * 2)))
    and (characters is null or (characters >= 0.5 and characters <= 5 and (characters * 2) = floor(characters * 2)))
    and (writing_style is null or (writing_style >= 0.5 and writing_style <= 5 and (writing_style * 2) = floor(writing_style * 2)))
    and (world_building is null or (world_building >= 0.5 and world_building <= 5 and (world_building * 2) = floor(world_building * 2)))
    and (pacing is null or (pacing >= 0.5 and pacing <= 5 and (pacing * 2) = floor(pacing * 2)))
    and (emotional_impact is null or (emotional_impact >= 0.5 and emotional_impact <= 5 and (emotional_impact * 2) = floor(emotional_impact * 2)))
  );

create unique index if not exists reviews_user_book_read_unique
  on public.reviews (user_id, book_id, read_number);

create index if not exists reviews_book_public_rating_idx
  on public.reviews (book_id)
  where visibility = 'public' and rating is not null;

update public.reviews r
set
  user_book_id = ub.id,
  read_number = coalesce(r.read_number, 1)
from public.user_books ub
where r.user_book_id is null
  and ub.user_id = r.user_id
  and ub.book_id = r.book_id;
