-- Saved post drafts (multiple per user)

create table if not exists public.post_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null default '',
  image_url text,
  book_id uuid references public.books (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists post_drafts_user_id_updated_idx
  on public.post_drafts (user_id, updated_at desc);

drop trigger if exists post_drafts_set_updated_at on public.post_drafts;
create trigger post_drafts_set_updated_at
  before update on public.post_drafts
  for each row execute function public.set_updated_at();

alter table public.post_drafts enable row level security;

drop policy if exists "post_drafts_select_own" on public.post_drafts;
create policy "post_drafts_select_own"
  on public.post_drafts for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "post_drafts_insert_own" on public.post_drafts;
create policy "post_drafts_insert_own"
  on public.post_drafts for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "post_drafts_update_own" on public.post_drafts;
create policy "post_drafts_update_own"
  on public.post_drafts for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "post_drafts_delete_own" on public.post_drafts;
create policy "post_drafts_delete_own"
  on public.post_drafts for delete
  to authenticated
  using (auth.uid() = user_id);
