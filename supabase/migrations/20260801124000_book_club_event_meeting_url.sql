-- Allow club events to link directly to their Zoom, Google Meet, or other
-- hosted meeting room. The link stays protected by the event's parent-club RLS.
alter table public.book_club_events
  add column if not exists meeting_url text;

alter table public.book_club_events
  drop constraint if exists book_club_events_meeting_url_http;

alter table public.book_club_events
  add constraint book_club_events_meeting_url_http
  check (meeting_url is null or meeting_url ~* '^https?://');
