-- Permanent message delete: hard-delete rows instead of soft-delete via deleted_at.

-- Remove any messages previously soft-deleted.
delete from public.messages
where deleted_at is not null;

-- Allow senders to permanently delete their own messages.
drop policy if exists "messages_delete_own" on public.messages;
create policy "messages_delete_own"
  on public.messages for delete
  to authenticated
  using (auth.uid() = sender_id);
