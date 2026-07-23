-- App Store compliance: user-generated content moderation + blocking

-- ---------------------------------------------------------------------------
-- content_reports — users flag objectionable content for developer review
-- ---------------------------------------------------------------------------

create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  content_type text not null check (
    content_type in ('post', 'comment', 'message', 'review', 'club_post', 'profile')
  ),
  content_id uuid not null,
  reported_user_id uuid references auth.users (id) on delete set null,
  reason text not null default 'other' check (
    reason in ('harassment', 'spam', 'inappropriate', 'hate_speech', 'other')
  ),
  details text,
  status text not null default 'pending' check (
    status in ('pending', 'reviewed', 'actioned', 'dismissed')
  ),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists content_reports_status_created_idx
  on public.content_reports (status, created_at desc);

create index if not exists content_reports_reported_user_idx
  on public.content_reports (reported_user_id)
  where reported_user_id is not null;

alter table public.content_reports enable row level security;

create policy "content_reports_insert_own"
  on public.content_reports for insert
  to authenticated
  with check (auth.uid() = reporter_id);

create policy "content_reports_select_own"
  on public.content_reports for select
  to authenticated
  using (auth.uid() = reporter_id);

-- ---------------------------------------------------------------------------
-- user_blocks — block abusive users; linked report notifies developer
-- ---------------------------------------------------------------------------

create table if not exists public.user_blocks (
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  report_id uuid references public.content_reports (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint user_blocks_not_self check (blocker_id <> blocked_id)
);

create index if not exists user_blocks_blocked_idx
  on public.user_blocks (blocked_id);

alter table public.user_blocks enable row level security;

create policy "user_blocks_select_own"
  on public.user_blocks for select
  to authenticated
  using (auth.uid() = blocker_id);

create policy "user_blocks_insert_own"
  on public.user_blocks for insert
  to authenticated
  with check (auth.uid() = blocker_id);

create policy "user_blocks_delete_own"
  on public.user_blocks for delete
  to authenticated
  using (auth.uid() = blocker_id);
