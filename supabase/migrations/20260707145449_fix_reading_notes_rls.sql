-- Fix reading_notes INSERT: SELECT policy must include direct owner check so
-- INSERT ... RETURNING succeeds (same pattern as custom_shelves fix).
-- Also use a security definer helper for user_book ownership in WITH CHECK
-- so the EXISTS subquery is not blocked by user_books RLS edge cases.

grant select, insert, update, delete on public.reading_notes to authenticated;

create or replace function public.user_owns_user_book(
  p_user_book_id uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_books ub
    where ub.id = p_user_book_id
      and ub.user_id = p_user_id
  );
$$;

grant execute on function public.user_owns_user_book(uuid, uuid) to authenticated;

drop policy if exists "reading_notes_select_visible" on public.reading_notes;
create policy "reading_notes_select_visible"
  on public.reading_notes for select
  to authenticated
  using (
    auth.uid() = user_id
    or public.reading_note_visible_to_viewer(id, auth.uid())
  );

drop policy if exists "reading_notes_insert_own" on public.reading_notes;
create policy "reading_notes_insert_own"
  on public.reading_notes for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.user_owns_user_book(user_book_id, auth.uid())
  );

drop policy if exists "reading_notes_update_own" on public.reading_notes;
create policy "reading_notes_update_own"
  on public.reading_notes for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "reading_notes_delete_own" on public.reading_notes;
create policy "reading_notes_delete_own"
  on public.reading_notes for delete
  to authenticated
  using (auth.uid() = user_id);
