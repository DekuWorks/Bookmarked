-- Custom shelf icon assignments.
-- Persist a stable logical key only — never blobs, paths, or emoji.
-- Nullable: existing shelves stay valid. Clients fall back to custom_icon_1.
--
-- Rollback:
--   alter table public.user_shelves drop constraint if exists user_shelves_icon_key_check;
--   alter table public.user_shelves drop column if exists icon_key;

alter table public.user_shelves
  add column if not exists icon_key text;

alter table public.user_shelves
  drop constraint if exists user_shelves_icon_key_check;

alter table public.user_shelves
  add constraint user_shelves_icon_key_check
  check (
    icon_key is null
    or icon_key in (
      'custom_icon_1',
      'custom_icon_2',
      'custom_icon_3',
      'custom_icon_4',
      'custom_icon_5'
    )
  );

comment on column public.user_shelves.icon_key is
  'Stable custom shelf icon key (custom_icon_1..5). Null → client fallback custom_icon_1.';
