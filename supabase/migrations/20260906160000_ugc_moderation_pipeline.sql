create extension if not exists pgcrypto with schema extensions;

-- Layered UGC moderation + report hardening.
-- Tightens writes: user-authored text requires a server-issued decision.
-- Does not weaken existing RLS.

-- ---------------------------------------------------------------------------
-- Helpers: normalize + hash (must match edge function via this RPC)
-- ---------------------------------------------------------------------------

create or replace function public.normalize_for_moderation(p_text text)
returns text
language sql
immutable
as $$
  select trim(both from regexp_replace(
    regexp_replace(
      normalize(coalesce(p_text, ''), NFKC),
      E'[\u200B-\u200D\uFEFF\u2060\u180E\u00AD]',
      '',
      'g'
    ),
    E'\\s+',
    ' ',
    'g'
  ));
$$;

create or replace function public.moderation_content_hash(p_text text)
returns text
language sql
immutable
as $$
  select encode(
    extensions.digest(convert_to(public.normalize_for_moderation(p_text), 'UTF8'), 'sha256'),
    'hex'
  );
$$;

revoke all on function public.normalize_for_moderation(text) from public, anon;
revoke all on function public.moderation_content_hash(text) from public, anon;
grant execute on function public.normalize_for_moderation(text) to authenticated, service_role;
grant execute on function public.moderation_content_hash(text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- moderation_decisions — short-lived server tokens required before UGC write
-- ---------------------------------------------------------------------------

create table if not exists public.moderation_decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  content_type text not null,
  content_hash text not null,
  status text not null check (status in ('allow', 'warn')),
  categories text[] not null default '{}',
  spans jsonb not null default '[]'::jsonb,
  reason_code text,
  moderation_version text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  consumed_at timestamptz
);

create index if not exists moderation_decisions_lookup_idx
  on public.moderation_decisions (user_id, content_type, content_hash)
  where consumed_at is null;

alter table public.moderation_decisions enable row level security;

-- Users cannot read or write decisions. Edge function uses the service role.

-- ---------------------------------------------------------------------------
-- moderation_logs — no user text, tokens, or passwords
-- ---------------------------------------------------------------------------

create table if not exists public.moderation_logs (
  id uuid primary key default gen_random_uuid(),
  content_type text not null,
  content_id uuid,
  user_id uuid references auth.users (id) on delete set null,
  decision text not null,
  categories text[] not null default '{}',
  moderation_version text not null,
  created_at timestamptz not null default now()
);

create index if not exists moderation_logs_created_idx
  on public.moderation_logs (created_at desc);

create index if not exists moderation_logs_user_idx
  on public.moderation_logs (user_id, created_at desc);

alter table public.moderation_logs enable row level security;

-- ---------------------------------------------------------------------------
-- Stored metadata on UGC tables (original text is never rewritten)
-- ---------------------------------------------------------------------------

alter table public.posts
  add column if not exists moderation_meta jsonb;

alter table public.post_comments
  add column if not exists moderation_meta jsonb;

alter table public.post_comment_replies
  add column if not exists moderation_meta jsonb;

alter table public.profiles
  add column if not exists moderation_meta jsonb;

alter table public.book_clubs
  add column if not exists moderation_meta jsonb;

alter table public.book_club_discussions
  add column if not exists moderation_meta jsonb;

alter table public.book_club_discussion_replies
  add column if not exists moderation_meta jsonb;

-- ---------------------------------------------------------------------------
-- Consume a matching unused decision. Returns meta jsonb or null.
-- ---------------------------------------------------------------------------

create or replace function public.consume_moderation_decision(
  p_user_id uuid,
  p_content_type text,
  p_text text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text;
  v_row public.moderation_decisions%rowtype;
  v_meta jsonb;
begin
  if p_user_id is null then
    return null;
  end if;

  if public.normalize_for_moderation(p_text) = '' then
    return jsonb_build_object(
      'status', 'allow',
      'categories', '[]'::jsonb,
      'spans', '[]'::jsonb,
      'reasonCode', 'ALLOW',
      'moderationVersion', '2026.09.1'
    );
  end if;

  v_hash := public.moderation_content_hash(p_text);

  select *
    into v_row
  from public.moderation_decisions
  where user_id = p_user_id
    and content_type = p_content_type
    and content_hash = v_hash
    and consumed_at is null
    and expires_at > now()
  order by created_at desc
  limit 1
  for update skip locked;

  if not found then
    return null;
  end if;

  update public.moderation_decisions
  set consumed_at = now()
  where id = v_row.id;

  v_meta := jsonb_build_object(
    'status', v_row.status,
    'categories', to_jsonb(v_row.categories),
    'spans', coalesce(v_row.spans, '[]'::jsonb),
    'reasonCode', coalesce(v_row.reason_code, 'ALLOW'),
    'moderationVersion', v_row.moderation_version
  );
  return v_meta;
end;
$$;

revoke all on function public.consume_moderation_decision(uuid, text, text) from public, anon, authenticated;
grant execute on function public.consume_moderation_decision(uuid, text, text) to service_role;

create or replace function public.require_ugc_moderation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_type text;
  v_text text;
  v_old text;
  v_meta jsonb;
begin
  v_type := tg_argv[0];

  if tg_table_name = 'posts' then
    v_user := new.user_id;
    v_text := new.body;
    v_old := case when tg_op = 'UPDATE' then old.body else null end;
  elsif tg_table_name = 'post_comments' then
    v_user := new.user_id;
    v_text := new.body;
    v_old := case when tg_op = 'UPDATE' then old.body else null end;
  elsif tg_table_name = 'post_comment_replies' then
    v_user := new.user_id;
    v_text := new.body;
    v_old := case when tg_op = 'UPDATE' then old.body else null end;
  elsif tg_table_name = 'profiles' then
    v_user := new.id;
    v_text := coalesce(new.bio, '');
    v_old := case when tg_op = 'UPDATE' then coalesce(old.bio, '') else null end;
  elsif tg_table_name = 'book_clubs' then
    v_user := auth.uid();
    v_text := new.name;
    v_old := case when tg_op = 'UPDATE' then old.name else null end;
  elsif tg_table_name = 'book_club_discussions' then
    v_user := new.user_id;
    v_text := coalesce(new.title, '') || E'\n' || coalesce(new.body, '');
    v_old := case when tg_op = 'UPDATE' then coalesce(old.title, '') || E'\n' || coalesce(old.body, '') else null end;
  elsif tg_table_name = 'book_club_discussion_replies' then
    v_user := new.user_id;
    v_text := new.body;
    v_old := case when tg_op = 'UPDATE' then old.body else null end;
  else
    return new;
  end if;

  if tg_op = 'UPDATE' and public.normalize_for_moderation(coalesce(v_text, ''))
      = public.normalize_for_moderation(coalesce(v_old, '')) then
    return new;
  end if;

  if public.normalize_for_moderation(coalesce(v_text, '')) = '' then
    return new;
  end if;

  -- Discussions: title and body are reviewed as one payload (same hash as the edge function).
  v_meta := public.consume_moderation_decision(v_user, v_type, v_text);
  if v_meta is null then
    raise exception 'Content must be reviewed before it can be published.'
      using errcode = 'P0001';
  end if;

  new.moderation_meta := v_meta;
  return new;
end;
$$;

drop trigger if exists posts_require_moderation on public.posts;
create trigger posts_require_moderation
  before insert or update of body on public.posts
  for each row execute function public.require_ugc_moderation('FEED_POST');

drop trigger if exists post_comments_require_moderation on public.post_comments;
create trigger post_comments_require_moderation
  before insert or update of body on public.post_comments
  for each row execute function public.require_ugc_moderation('COMMENT');

drop trigger if exists post_comment_replies_require_moderation on public.post_comment_replies;
create trigger post_comment_replies_require_moderation
  before insert or update of body on public.post_comment_replies
  for each row execute function public.require_ugc_moderation('COMMENT');

drop trigger if exists profiles_require_moderation on public.profiles;
create trigger profiles_require_moderation
  before insert or update of bio on public.profiles
  for each row execute function public.require_ugc_moderation('PROFILE_BIO');

drop trigger if exists book_clubs_require_moderation on public.book_clubs;
create trigger book_clubs_require_moderation
  before insert or update of name on public.book_clubs
  for each row execute function public.require_ugc_moderation('BOOK_CLUB_NAME');

drop trigger if exists book_club_discussions_require_moderation on public.book_club_discussions;
create trigger book_club_discussions_require_moderation
  before insert or update of title, body on public.book_club_discussions
  for each row execute function public.require_ugc_moderation('BOOK_CLUB_DISCUSSION');

drop trigger if exists book_club_discussion_replies_require_moderation on public.book_club_discussion_replies;
create trigger book_club_discussion_replies_require_moderation
  before insert or update of body on public.book_club_discussion_replies
  for each row execute function public.require_ugc_moderation('BOOK_CLUB_REPLY');

-- ---------------------------------------------------------------------------
-- Reports: expand types/reasons/status, add reviewed_by, dedup
-- ---------------------------------------------------------------------------

alter table public.content_reports
  add column if not exists reviewed_by uuid references auth.users (id) on delete set null;

update public.content_reports
set reason = case reason
  when 'harassment' then 'harassment_bullying'
  when 'hate_speech' then 'hate_discrimination'
  when 'inappropriate' then 'sexual_inappropriate'
  else reason
end
where reason in ('harassment', 'hate_speech', 'inappropriate');

update public.content_reports
set status = case status
  when 'reviewed' then 'resolved'
  when 'actioned' then 'resolved'
  else status
end
where status in ('reviewed', 'actioned');

update public.content_reports
set content_type = 'club_discussion'
where content_type = 'club_post'
  and not exists (
    select 1 from public.content_reports x
    where x.id <> content_reports.id
      and x.reporter_id = content_reports.reporter_id
      and x.content_type = 'club_discussion'
      and x.content_id = content_reports.content_id
  );

alter table public.content_reports
  drop constraint if exists content_reports_content_type_check;
alter table public.content_reports
  add constraint content_reports_content_type_check
  check (content_type in (
    'post',
    'comment',
    'message',
    'review',
    'club_post',
    'club_discussion',
    'club_reply',
    'club',
    'profile'
  ));

alter table public.content_reports
  drop constraint if exists content_reports_reason_check;
alter table public.content_reports
  add constraint content_reports_reason_check
  check (reason in (
    'hate_discrimination',
    'harassment_bullying',
    'threats_violence',
    'sexual_inappropriate',
    'spam',
    'impersonation',
    'other'
  ));

alter table public.content_reports
  drop constraint if exists content_reports_status_check;
alter table public.content_reports
  add constraint content_reports_status_check
  check (status in ('pending', 'reviewing', 'resolved', 'dismissed'));

create unique index if not exists content_reports_reporter_target_uidx
  on public.content_reports (reporter_id, content_type, content_id);

-- Users still create + read own reports only. No update/delete for clients.
drop policy if exists "content_reports_update_own" on public.content_reports;
drop policy if exists "content_reports_delete_own" on public.content_reports;

-- ---------------------------------------------------------------------------
-- Realtime: replies already published; keep replica identity full
-- ---------------------------------------------------------------------------

alter table public.book_club_discussion_replies replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.book_club_discussion_replies;
  exception when others then null;
  end;
end $$;
