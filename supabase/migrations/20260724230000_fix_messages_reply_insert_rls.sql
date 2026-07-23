-- Fix messages INSERT RLS for replies: unqualified reply_to_id inside the
-- EXISTS subquery resolved to parent.reply_to_id (same table alias), so
-- parent.id = parent.reply_to_id was almost never true. Qualify new-row columns.

drop policy if exists "messages_insert_participant" on public.messages;
create policy "messages_insert_participant"
  on public.messages for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and public.user_is_conversation_participant(conversation_id)
    and (
      messages.reply_to_id is null
      or exists (
        select 1
        from public.messages parent
        where parent.id = messages.reply_to_id
          and parent.conversation_id = messages.conversation_id
      )
    )
  );
