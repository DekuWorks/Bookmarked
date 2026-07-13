-- Enable Supabase Realtime for book club discussions.
-- The book_clubs migration set `replica identity full` on book_club_posts but
-- did not add it to the supabase_realtime publication, so INSERTs were not
-- broadcast to subscribers. Add it here (idempotent) so the club detail page
-- can show new discussions live. RLS still gates which rows each subscriber
-- receives (members always; public-club posts to everyone).

alter table public.book_club_posts replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.book_club_posts;
exception
  when duplicate_object then null;
end $$;
