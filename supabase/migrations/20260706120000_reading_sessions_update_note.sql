-- Allow users to update notes on their own reading sessions

drop policy if exists "reading_sessions_update_own" on public.reading_sessions;
create policy "reading_sessions_update_own"
  on public.reading_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
