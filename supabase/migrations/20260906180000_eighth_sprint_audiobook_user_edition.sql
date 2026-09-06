-- Eighth Sprint: reader-owned audiobook format + duration on user_books.
-- Additive only. Keeps catalog books.format / books.audiobook_duration_seconds
-- and existing second-based progress/session columns as fallback.

alter table public.user_books
  add column if not exists tracking_format text;

alter table public.user_books
  drop constraint if exists user_books_tracking_format_check;

alter table public.user_books
  add constraint user_books_tracking_format_check
  check (tracking_format is null or tracking_format in ('book', 'audiobook'));

comment on column public.user_books.tracking_format is
  'Reader-owned edition format. Catalog books.format is fallback only.';

alter table public.user_books
  add column if not exists audiobook_duration_seconds integer;

alter table public.user_books
  drop constraint if exists user_books_audiobook_duration_seconds_check;

alter table public.user_books
  add constraint user_books_audiobook_duration_seconds_check
  check (audiobook_duration_seconds is null or audiobook_duration_seconds > 0);

comment on column public.user_books.audiobook_duration_seconds is
  'Reader-owned audiobook length in seconds. Catalog duration is fallback only.';
