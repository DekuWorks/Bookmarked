-- Book metadata enrichment + one review per user per book

alter table public.books
  add column if not exists publisher text;

alter table public.books
  add column if not exists subjects text[];

create unique index if not exists reviews_user_book_unique
  on public.reviews (user_id, book_id);
