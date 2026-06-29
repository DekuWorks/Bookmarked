-- Message image attachments (Supabase Storage + messages.attachment_url)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'message-attachments',
  'message-attachments',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.messages
  add column if not exists attachment_url text;

alter table public.messages
  drop constraint if exists messages_body_not_empty;

alter table public.messages
  add constraint messages_body_or_attachment check (
    char_length(trim(body)) > 0 or attachment_url is not null
  );

create policy "Message attachments are readable by conversation participants"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'message-attachments'
    and public.user_is_conversation_participant((storage.foldername(name))[1]::uuid)
  );

create policy "Senders can upload message attachments"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'message-attachments'
    and (storage.foldername(name))[2] = auth.uid()::text
    and public.user_is_conversation_participant((storage.foldername(name))[1]::uuid)
  );

create policy "Senders can update their message attachments"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'message-attachments'
    and (storage.foldername(name))[2] = auth.uid()::text
    and public.user_is_conversation_participant((storage.foldername(name))[1]::uuid)
  )
  with check (
    bucket_id = 'message-attachments'
    and (storage.foldername(name))[2] = auth.uid()::text
    and public.user_is_conversation_participant((storage.foldername(name))[1]::uuid)
  );

create policy "Senders can delete their message attachments"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'message-attachments'
    and (storage.foldername(name))[2] = auth.uid()::text
    and public.user_is_conversation_participant((storage.foldername(name))[1]::uuid)
  );
