-- Seed a few public starter challenges for the current year so /challenges/ is not empty.
-- Idempotent on slug. Join still goes through joinReadingChallenge + Free yearly caps.

insert into public.reading_challenges (
  slug,
  title,
  description,
  year,
  starts_at,
  ends_at,
  is_active
)
values
  (
    'bookmark-52-in-2026',
    '52 Books in 2026',
    'One book a week — build a reading rhythm that fills your shelves and your Reading DNA.',
    2026,
    '2026-01-01T00:00:00Z',
    '2026-12-31T23:59:59Z',
    true
  ),
  (
    'cozy-corner-2026',
    'Cozy Corner Challenge',
    'Read warm, comforting stories that feel like a favorite chair and a soft blanket.',
    2026,
    '2026-01-01T00:00:00Z',
    '2026-12-31T23:59:59Z',
    true
  ),
  (
    'new-to-me-authors-2026',
    'New-to-Me Authors',
    'Discover voices you have never read before and expand the genres in your Reading DNA.',
    2026,
    '2026-01-01T00:00:00Z',
    '2026-12-31T23:59:59Z',
    true
  ),
  (
    'pages-with-friends-2026',
    'Pages with Friends',
    'Finish books alongside your book clubs — discuss, quote, and celebrate together.',
    2026,
    '2026-01-01T00:00:00Z',
    '2026-12-31T23:59:59Z',
    true
  ),
  (
    'finish-what-you-started-2026',
    'Finish What You Started',
    'Clear the currently-reading pile and turn half-finished stories into finished shelves.',
    2026,
    '2026-01-01T00:00:00Z',
    '2026-12-31T23:59:59Z',
    true
  )
on conflict (slug) do update
set
  title = excluded.title,
  description = excluded.description,
  year = excluded.year,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  is_active = excluded.is_active;
