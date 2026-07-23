-- iMessage-style message reactions and inline replies

-- ---------------------------------------------------------------------------
-- messages.reply_to_id
-- ---------------------------------------------------------------------------
alter table public.messages
  add column if not exists reply_to_id uuid references public.messages (id) on delete set null;

create index if not exists messages_reply_to_id_idx
  on public.messages (reply_to_id)
  where reply_to_id is not null;

-- ---------------------------------------------------------------------------
-- message_reactions
-- ---------------------------------------------------------------------------
create table if not exists public.message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  emoji text not null check (char_length(emoji) between 1 and 8),
  created_at timestamptz not null default now(),
  unique (message_id, user_id, emoji)
);

create index if not exists message_reactions_message_id_idx
  on public.message_reactions (message_id);

create index if not exists message_reactions_user_id_idx
  on public.message_reactions (user_id);

alter table public.message_reactions enable row level security;

drop policy if exists "message_reactions_select_participant" on public.message_reactions;
create policy "message_reactions_select_participant"
  on public.message_reactions for select
  to authenticated
  using (
    exists (
      select 1
      from public.messages m
      where m.id = message_reactions.message_id
        and public.user_is_conversation_participant(m.conversation_id)
    )
  );

drop policy if exists "message_reactions_insert_own" on public.message_reactions;
create policy "message_reactions_insert_own"
  on public.message_reactions for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.messages m
      where m.id = message_reactions.message_id
        and public.user_is_conversation_participant(m.conversation_id)
    )
  );

drop policy if exists "message_reactions_delete_own" on public.message_reactions;
create policy "message_reactions_delete_own"
  on public.message_reactions for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- messages insert: validate reply_to_id is in the same conversation
-- ---------------------------------------------------------------------------
drop policy if exists "messages_insert_participant" on public.messages;
create policy "messages_insert_participant"
  on public.messages for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and public.user_is_conversation_participant(conversation_id)
    and (
      reply_to_id is null
      or exists (
        select 1
        from public.messages parent
        where parent.id = reply_to_id
          and parent.conversation_id = messages.conversation_id
      )
    )
  );

-- ---------------------------------------------------------------------------
-- Realtime for reactions
-- ---------------------------------------------------------------------------
alter table public.message_reactions replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.message_reactions;
exception
  when duplicate_object then null;
end $$;
