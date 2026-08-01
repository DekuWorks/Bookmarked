-- Sprint 8: audiobook-specific metadata and listening progress.
-- Page fields remain intact for print/ebook records; listening fields are used
-- only when books.format = 'audiobook'.

alter table public.books
  add column if not exists format text not null default 'book',
  add column if not exists audiobook_duration_seconds integer;

alter table public.books
  drop constraint if exists books_format_check;

alter table public.books
  add constraint books_format_check
    check (format in ('book', 'ebook', 'audiobook'));

alter table public.books
  drop constraint if exists books_audiobook_duration_seconds_check;

alter table public.books
  add constraint books_audiobook_duration_seconds_check
    check (audiobook_duration_seconds is null or audiobook_duration_seconds > 0);

alter table public.user_books
  add column if not exists listening_progress_seconds integer not null default 0;

alter table public.user_books
  drop constraint if exists user_books_listening_progress_seconds_check;

alter table public.user_books
  add constraint user_books_listening_progress_seconds_check
    check (listening_progress_seconds >= 0);

alter table public.reading_sessions
  add column if not exists session_format text not null default 'book',
  add column if not exists listening_start_seconds integer,
  add column if not exists listening_end_seconds integer,
  add column if not exists listening_seconds integer;

alter table public.reading_sessions
  drop constraint if exists reading_sessions_session_format_check;

alter table public.reading_sessions
  add constraint reading_sessions_session_format_check
    check (session_format in ('book', 'audiobook'));

alter table public.reading_sessions
  drop constraint if exists reading_sessions_listening_seconds_check;

alter table public.reading_sessions
  add constraint reading_sessions_listening_seconds_check
    check (
      (listening_start_seconds is null or listening_start_seconds >= 0)
      and (listening_end_seconds is null or listening_end_seconds >= 0)
      and (listening_seconds is null or listening_seconds >= 0)
    );

create index if not exists reading_sessions_audiobook_user_book_created_idx
  on public.reading_sessions (user_book_id, created_at desc)
  where session_format = 'audiobook';

comment on column public.books.format is
  'Content format. Audiobooks use duration and listening-progress fields.';
comment on column public.books.audiobook_duration_seconds is
  'Total audiobook duration in seconds, entered manually until provider metadata is available.';
comment on column public.user_books.listening_progress_seconds is
  'Current audiobook listening position in seconds.';
