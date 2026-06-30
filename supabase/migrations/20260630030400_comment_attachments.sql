-- Image/GIF attachments for post comments, review replies, and post comment replies

-- ---------------------------------------------------------------------------
-- post_comments
-- ---------------------------------------------------------------------------
alter table public.post_comments
  add column if not exists attachment_url text;

alter table public.post_comments
  alter column body set default '';

alter table public.post_comments
  drop constraint if exists post_comments_body_check;

alter table public.post_comments
  add constraint post_comments_body_or_attachment_check
  check (char_length(trim(body)) > 0 or attachment_url is not null);

-- ---------------------------------------------------------------------------
-- review_replies
-- ---------------------------------------------------------------------------
alter table public.review_replies
  add column if not exists attachment_url text;

alter table public.review_replies
  alter column body set default '';

alter table public.review_replies
  drop constraint if exists review_replies_body_check;

alter table public.review_replies
  add constraint review_replies_body_or_attachment_check
  check (char_length(trim(body)) > 0 or attachment_url is not null);

-- ---------------------------------------------------------------------------
-- post_comment_replies
-- ---------------------------------------------------------------------------
alter table public.post_comment_replies
  add column if not exists attachment_url text;

alter table public.post_comment_replies
  alter column body set default '';

alter table public.post_comment_replies
  drop constraint if exists post_comment_replies_body_check;

alter table public.post_comment_replies
  add constraint post_comment_replies_body_or_attachment_check
  check (char_length(trim(body)) > 0 or attachment_url is not null);
