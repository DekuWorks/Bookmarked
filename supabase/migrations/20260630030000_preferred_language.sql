-- Preferred UI language on profiles (storage only — full i18n deferred)

alter table public.profiles
  add column if not exists preferred_language text not null default 'en'
  check (preferred_language in ('en', 'es', 'fr', 'de'));
