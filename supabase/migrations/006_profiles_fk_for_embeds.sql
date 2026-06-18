-- PostgREST embeds require a direct FK to profiles.
-- activity_events/reviews.user_id already references auth.users; profiles.id is the same key.

alter table public.activity_events
  drop constraint if exists activity_events_user_id_profiles_fkey;

alter table public.activity_events
  add constraint activity_events_user_id_profiles_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;

alter table public.reviews
  drop constraint if exists reviews_user_id_profiles_fkey;

alter table public.reviews
  add constraint reviews_user_id_profiles_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;
