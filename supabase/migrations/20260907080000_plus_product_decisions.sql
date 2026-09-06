-- Plus product decisions: 5-star half-star review extras.
-- Additive only. No data deleted. No invented 1–10 scale.

comment on column public.reviews.reread_likelihood is
  'Reread likelihood on the shared 5-star half-star scale (0.5–5). Null if unset.';
comment on column public.reviews.reread_likelihood_scale is
  'Scale key. Product decision: stars_5_half (same as reviews).';

alter table public.reviews
  drop constraint if exists reviews_reread_likelihood_check;
alter table public.reviews
  add constraint reviews_reread_likelihood_check
  check (
    reread_likelihood is null
    or reread_likelihood in (0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5)
  );

comment on column public.review_character_ratings.score is
  'Optional 5-star half-star score. Not required to publish a review.';

alter table public.review_character_ratings
  drop constraint if exists review_character_ratings_score_check;
alter table public.review_character_ratings
  add constraint review_character_ratings_score_check
  check (
    score is null
    or score in (0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5)
  );
