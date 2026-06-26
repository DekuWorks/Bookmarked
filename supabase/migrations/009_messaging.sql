-- Messaging MVP: direct and group conversations

-- ---------------------------------------------------------------------------
-- conversations
-- ---------------------------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_type_check check (type in ('direct', 'group'))
);

create index if not exists conversations_updated_at_idx
  on public.conversations (updated_at desc);

drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- conversation_participants
-- ---------------------------------------------------------------------------
create table if not exists public.conversation_participants (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  unique (conversation_id, user_id),
  constraint conversation_participants_role_check check (role in ('owner', 'member'))
);

create index if not exists conversation_participants_user_id_idx
  on public.conversation_participants (user_id);

create index if not exists conversation_participants_conversation_id_idx
  on public.conversation_participants (conversation_id);

-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint messages_body_not_empty check (char_length(trim(body)) > 0)
);

create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at asc);

drop trigger if exists messages_set_updated_at on public.messages;
create trigger messages_set_updated_at
  before update on public.messages
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Helper: is the current user a participant?
-- ---------------------------------------------------------------------------
create or replace function public.user_is_conversation_participant(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = p_conversation_id
      and cp.user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS: conversations
-- ---------------------------------------------------------------------------
alter table public.conversations enable row level security;

drop policy if exists "conversations_select_participant" on public.conversations;
create policy "conversations_select_participant"
  on public.conversations for select
  to authenticated
  using (public.user_is_conversation_participant(id));

drop policy if exists "conversations_insert_authenticated" on public.conversations;
create policy "conversations_insert_authenticated"
  on public.conversations for insert
  to authenticated
  with check (auth.uid() = created_by);

drop policy if exists "conversations_update_participant" on public.conversations;
create policy "conversations_update_participant"
  on public.conversations for update
  to authenticated
  using (public.user_is_conversation_participant(id))
  with check (public.user_is_conversation_participant(id));

-- ---------------------------------------------------------------------------
-- RLS: conversation_participants
-- ---------------------------------------------------------------------------
alter table public.conversation_participants enable row level security;

drop policy if exists "conversation_participants_select_member" on public.conversation_participants;
create policy "conversation_participants_select_member"
  on public.conversation_participants for select
  to authenticated
  using (public.user_is_conversation_participant(conversation_id));

drop policy if exists "conversation_participants_insert" on public.conversation_participants;
create policy "conversation_participants_insert"
  on public.conversation_participants for insert
  to authenticated
  with check (
    auth.uid() = user_id
    or exists (
      select 1
      from public.conversations c
      where c.id = conversation_id
        and c.created_by = auth.uid()
    )
  );

drop policy if exists "conversation_participants_delete_self" on public.conversation_participants;
create policy "conversation_participants_delete_self"
  on public.conversation_participants for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "conversation_participants_update_self" on public.conversation_participants;
create policy "conversation_participants_update_self"
  on public.conversation_participants for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- RLS: messages
-- ---------------------------------------------------------------------------
alter table public.messages enable row level security;

drop policy if exists "messages_select_participant" on public.messages;
create policy "messages_select_participant"
  on public.messages for select
  to authenticated
  using (public.user_is_conversation_participant(conversation_id));

drop policy if exists "messages_insert_participant" on public.messages;
create policy "messages_insert_participant"
  on public.messages for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and public.user_is_conversation_participant(conversation_id)
  );

drop policy if exists "messages_update_own" on public.messages;
create policy "messages_update_own"
  on public.messages for update
  to authenticated
  using (auth.uid() = sender_id)
  with check (auth.uid() = sender_id);

-- Realtime (optional — enable new message subscriptions)
alter table public.messages replica identity full;

-- PostgREST profile embeds
alter table public.conversation_participants
  drop constraint if exists conversation_participants_user_id_profiles_fkey;

alter table public.conversation_participants
  add constraint conversation_participants_user_id_profiles_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;

alter table public.messages
  drop constraint if exists messages_sender_id_profiles_fkey;

alter table public.messages
  add constraint messages_sender_id_profiles_fkey
  foreign key (sender_id) references public.profiles (id) on delete cascade;
