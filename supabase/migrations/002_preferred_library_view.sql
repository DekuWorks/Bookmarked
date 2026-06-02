-- Add preferred library view mode to profiles

alter table public.profiles
  add column if not exists preferred_library_view text not null default 'bookshelf'
  check (preferred_library_view in ('bookshelf', 'grid', 'reading_room'));
