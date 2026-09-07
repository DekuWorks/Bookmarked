-- Additive custom-shelf icon emoji support.
-- Keeps icon_key (custom_icon_1..5) and adds icon_type + icon_emoji.
-- Existing rows stay valid: null type/emoji → clients treat as bookmarked fallback.
--
-- Rollback:
--   alter table public.user_shelves drop constraint if exists user_shelves_icon_selection_check;
--   alter table public.user_shelves drop constraint if exists user_shelves_icon_emoji_check;
--   alter table public.user_shelves drop constraint if exists user_shelves_icon_type_check;
--   alter table public.user_shelves drop column if exists icon_emoji;
--   alter table public.user_shelves drop column if exists icon_type;

alter table public.user_shelves
  add column if not exists icon_type text;

alter table public.user_shelves
  add column if not exists icon_emoji text;

alter table public.user_shelves
  drop constraint if exists user_shelves_icon_type_check;

alter table public.user_shelves
  add constraint user_shelves_icon_type_check
  check (
    icon_type is null
    or icon_type in ('bookmarked', 'emoji')
  );

alter table public.user_shelves
  drop constraint if exists user_shelves_icon_emoji_check;

alter table public.user_shelves
  add constraint user_shelves_icon_emoji_check
  check (
    icon_emoji is null
    or (
      char_length(icon_emoji) between 1 and 32
      and icon_emoji !~ '[\\/]'
      and icon_emoji !~* 'https?:'
      and icon_emoji !~* 'blob:'
      and icon_emoji !~* 'data:'
      and icon_emoji !~* '\.(png|svg|jpe?g|gif|webp)$'
    )
  );

alter table public.user_shelves
  drop constraint if exists user_shelves_icon_selection_check;

alter table public.user_shelves
  add constraint user_shelves_icon_selection_check
  check (
    icon_type is distinct from 'emoji'
    or icon_emoji is not null
  );

comment on column public.user_shelves.icon_type is
  'bookmarked (PNG key) or emoji. Null → client treats as bookmarked.';

comment on column public.user_shelves.icon_emoji is
  'Sanitized emoji grapheme when icon_type = emoji. Never paths or blobs.';
