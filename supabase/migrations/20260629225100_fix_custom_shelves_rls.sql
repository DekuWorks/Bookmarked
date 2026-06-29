-- Fix custom shelf RLS: owner SELECT must not depend only on the visibility
-- function (which queries user_shelves and breaks INSERT ... RETURNING).

grant select, insert, update, delete on public.user_shelves to authenticated;
grant select, insert, delete on public.user_shelf_books to authenticated;

drop policy if exists "user_shelves_select_visible" on public.user_shelves;
drop policy if exists "user_shelves_insert_own" on public.user_shelves;
drop policy if exists "user_shelves_update_own" on public.user_shelves;
drop policy if exists "user_shelves_delete_own" on public.user_shelves;

create policy "user_shelves_select"
  on public.user_shelves for select
  to authenticated
  using (
    auth.uid() = user_id
    or public.custom_shelf_visible_to_viewer(id, auth.uid())
  );

create policy "user_shelves_insert"
  on public.user_shelves for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "user_shelves_update"
  on public.user_shelves for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_shelves_delete"
  on public.user_shelves for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_shelf_books_select_visible" on public.user_shelf_books;
drop policy if exists "user_shelf_books_insert_own" on public.user_shelf_books;
drop policy if exists "user_shelf_books_delete_own" on public.user_shelf_books;

create policy "user_shelf_books_select"
  on public.user_shelf_books for select
  to authenticated
  using (
    auth.uid() = user_id
    or public.custom_shelf_visible_to_viewer(shelf_id, auth.uid())
  );

create policy "user_shelf_books_insert"
  on public.user_shelf_books for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.user_shelves s
      where s.id = shelf_id
        and s.user_id = auth.uid()
    )
  );

create policy "user_shelf_books_delete"
  on public.user_shelf_books for delete
  to authenticated
  using (auth.uid() = user_id);
