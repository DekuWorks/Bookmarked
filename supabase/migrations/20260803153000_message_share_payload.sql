-- Structured share previews in DMs (SharePreviewCard).
-- Stores content type + id + snapshot so clients can render cards without
-- pasting raw URLs or full post bodies into message.text.

alter table public.messages
  add column if not exists share_payload jsonb;

comment on column public.messages.share_payload is
  'Optional structured share for in-app preview cards: { contentType, contentId, snapshot }.';

alter table public.messages
  drop constraint if exists messages_body_not_empty;

-- Allow empty body when a share card is attached (note-only or card-only messages).
alter table public.messages
  add constraint messages_body_or_share_check
  check (
    char_length(trim(body)) > 0
    or share_payload is not null
    or attachment_url is not null
  );

create index if not exists messages_share_payload_type_idx
  on public.messages ((share_payload->>'contentType'))
  where share_payload is not null;
