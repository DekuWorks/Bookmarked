-- Per-user pinned conversations in the inbox (max 3 enforced in app layer)

alter table public.conversation_participants
  add column if not exists pinned_at timestamptz;

create index if not exists conversation_participants_user_pinned_idx
  on public.conversation_participants (user_id, pinned_at desc nulls last)
  where pinned_at is not null;
