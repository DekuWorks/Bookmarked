-- Fix messaging RLS chicken-and-egg: creators must read conversations before participants exist.
-- INSERT ... RETURNING and setup flows require SELECT/UPDATE access for created_by.

drop policy if exists "conversations_select_participant" on public.conversations;
create policy "conversations_select_participant"
  on public.conversations for select
  to authenticated
  using (
    public.user_is_conversation_participant(id)
    or auth.uid() = created_by
  );

drop policy if exists "conversations_update_participant" on public.conversations;
create policy "conversations_update_participant"
  on public.conversations for update
  to authenticated
  using (
    public.user_is_conversation_participant(id)
    or auth.uid() = created_by
  )
  with check (
    public.user_is_conversation_participant(id)
    or auth.uid() = created_by
  );

drop policy if exists "conversation_participants_select_member" on public.conversation_participants;
create policy "conversation_participants_select_member"
  on public.conversation_participants for select
  to authenticated
  using (
    public.user_is_conversation_participant(conversation_id)
    or exists (
      select 1
      from public.conversations c
      where c.id = conversation_id
        and c.created_by = auth.uid()
    )
  );
