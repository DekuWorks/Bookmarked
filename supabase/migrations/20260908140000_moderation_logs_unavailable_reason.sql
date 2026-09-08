-- Store the outage class for Content Review without user text or secrets.
-- Additive only: new nullable columns on moderation_logs.

alter table public.moderation_logs
  add column if not exists unavailable_reason text;

alter table public.moderation_logs
  add column if not exists latency_ms integer;

comment on column public.moderation_logs.unavailable_reason is
  'Provider/outage class only (timeout, http_401, missing_provider_key). Never user text or secrets.';

comment on column public.moderation_logs.latency_ms is
  'Edge function wall time in milliseconds for this review call.';
