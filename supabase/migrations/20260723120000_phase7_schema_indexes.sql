-- Phase 7: schema audit — performance indexes and duplicate-prevention constraints

-- ---------------------------------------------------------------------------
-- Hot-path indexes (library, feed, messages, notifications, reviews)
-- ---------------------------------------------------------------------------

create index if not exists user_books_user_shelf_status_idx
  on public.user_books (user_id, shelf_status);

create index if not exists user_books_user_updated_idx
  on public.user_books (user_id, updated_at desc);

create index if not exists activity_events_user_created_idx
  on public.activity_events (user_id, created_at desc);

create index if not exists reviews_user_created_idx
  on public.reviews (user_id, created_at desc);

create index if not exists user_shelf_books_book_id_idx
  on public.user_shelf_books (book_id);

create index if not exists conversation_participants_user_conversation_idx
  on public.conversation_participants (user_id, conversation_id);

create index if not exists post_likes_post_id_idx
  on public.post_likes (post_id);

-- ---------------------------------------------------------------------------
-- Duplicate prevention
-- books: unique (external_source, external_id) already exists (001)
-- reviews: unique (user_id, book_id, read_number) already exists (phase2)
-- user_books: unique (user_id, book_id) already exists (001)
-- user_shelves: unique (user_id, slug) already exists; add name dedup per user
-- ---------------------------------------------------------------------------

create unique index if not exists user_shelves_user_lower_name_unique
  on public.user_shelves (user_id, lower(trim(name)));
