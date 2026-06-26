-- Allow authenticated users to enrich shared catalog metadata (descriptions, subjects, etc.)

drop policy if exists "books_update_authenticated" on public.books;
create policy "books_update_authenticated"
  on public.books for update
  to authenticated
  using (true)
  with check (true);
