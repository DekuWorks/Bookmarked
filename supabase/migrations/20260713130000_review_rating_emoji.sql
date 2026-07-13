-- Custom rating emoji (Fable-style): a single signature emoji per review.
-- e.g. ⚡ for Harry Potter. Distinct from multi-select feelings tags.

alter table public.reviews
  add column if not exists rating_emoji text;

comment on column public.reviews.rating_emoji is
  'Optional single signature emoji shown next to the star rating (Fable-style).';

alter table public.reviews
  drop constraint if exists reviews_rating_emoji_length;

alter table public.reviews
  add constraint reviews_rating_emoji_length check (
    rating_emoji is null
    or char_length(rating_emoji) between 1 and 16
  );
