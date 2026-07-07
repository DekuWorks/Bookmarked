-- Per-user custom reading note categories

create table public.user_reading_note_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null check (char_length(trim(label)) >= 2 and char_length(label) <= 40),
  emoji text check (emoji is null or char_length(emoji) <= 8),
  created_at timestamptz not null default now()
);

create unique index user_reading_note_categories_user_id_lower_label_idx
  on public.user_reading_note_categories (user_id, lower(label));

create index user_reading_note_categories_user_id_idx
  on public.user_reading_note_categories (user_id, created_at);

-- Allow built-in categories or custom:<uuid> references
alter table public.reading_notes
  drop constraint if exists reading_notes_category_check;

alter table public.reading_notes
  add constraint reading_notes_category_check check (
    category in (
      'favorite_quote',
      'character_development',
      'important_plot_point',
      'theory',
      'favorite_scene',
      'emotional_moment',
      'general_note'
    )
    or category ~ '^custom:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  );

alter table public.user_reading_note_categories enable row level security;

drop policy if exists "user_reading_note_categories_select" on public.user_reading_note_categories;
create policy "user_reading_note_categories_select"
  on public.user_reading_note_categories for select
  using (true);

drop policy if exists "user_reading_note_categories_insert_own" on public.user_reading_note_categories;
create policy "user_reading_note_categories_insert_own"
  on public.user_reading_note_categories for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_reading_note_categories_update_own" on public.user_reading_note_categories;
create policy "user_reading_note_categories_update_own"
  on public.user_reading_note_categories for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_reading_note_categories_delete_own" on public.user_reading_note_categories;
create policy "user_reading_note_categories_delete_own"
  on public.user_reading_note_categories for delete
  using (auth.uid() = user_id);
