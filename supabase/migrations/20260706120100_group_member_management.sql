-- Group owners may add/remove members (leave remains self-delete policy)

drop policy if exists "conversation_participants_insert_owner" on public.conversation_participants;
create policy "conversation_participants_insert_owner"
  on public.conversation_participants for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.conversation_participants cp
      join public.conversations c on c.id = cp.conversation_id
      where cp.conversation_id = conversation_id
        and cp.user_id = auth.uid()
        and cp.role = 'owner'
        and c.type = 'group'
    )
  );

drop policy if exists "conversation_participants_delete_owner" on public.conversation_participants;
create policy "conversation_participants_delete_owner"
  on public.conversation_participants for delete
  to authenticated
  using (
    exists (
      select 1
      from public.conversation_participants cp
      join public.conversations c on c.id = cp.conversation_id
      where cp.conversation_id = conversation_id
        and cp.user_id = auth.uid()
        and cp.role = 'owner'
        and c.type = 'group'
        and conversation_participants.user_id <> auth.uid()
    )
  );
