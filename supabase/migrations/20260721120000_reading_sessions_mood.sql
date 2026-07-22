-- Session mood tags for reading journal entries (matches REVIEW_FEELINGS)

alter table public.reading_sessions
  add column if not exists mood text;

alter table public.reading_sessions
  drop constraint if exists reading_sessions_mood_check;

alter table public.reading_sessions
  add constraint reading_sessions_mood_check
  check (
    mood is null
    or mood in (
      'Happy',
      'Emotional',
      'Heartwarming',
      'Thought-provoking',
      'Dark',
      'Funny',
      'Suspenseful',
      'Romantic',
      'Adventurous',
      'Melancholy',
      'Inspiring',
      'Cozy'
    )
  );
