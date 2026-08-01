-- Sprint 6: make DNF a permanent built-in shelf rather than a custom collection.
-- Move associations from legacy custom "DNF" shelves into user_books, then remove
-- those legacy shelves. A book remains in every other custom shelf it belongs to.

alter table public.user_books
  drop constraint if exists user_books_shelf_status_check;

alter table public.user_books
  add constraint user_books_shelf_status_check
  check (shelf_status in ('want_to_read', 'currently_reading', 'read', 'dnf'));

insert into public.user_books (user_id, book_id, shelf_status, dnf)
select distinct shelf.user_id, membership.book_id, 'dnf', true
from public.user_shelves as shelf
join public.user_shelf_books as membership on membership.shelf_id = shelf.id
where lower(trim(shelf.name)) = 'dnf'
   or shelf.slug = 'dnf'
on conflict (user_id, book_id) do update
set shelf_status = 'dnf',
    dnf = true,
    updated_at = now();

delete from public.user_shelves
where lower(trim(name)) = 'dnf'
   or slug = 'dnf';

alter table public.user_shelves
  drop constraint if exists user_shelves_name_not_dnf,
  drop constraint if exists user_shelves_slug_not_dnf;

alter table public.user_shelves
  add constraint user_shelves_name_not_dnf
    check (lower(trim(name)) <> 'dnf'),
  add constraint user_shelves_slug_not_dnf
    check (slug <> 'dnf');

alter table public.profiles
  add column if not exists shelf_visibility_dnf text not null default 'private'
    check (shelf_visibility_dnf in ('public', 'followers', 'private'));
