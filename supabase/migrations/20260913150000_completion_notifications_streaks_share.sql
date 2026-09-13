-- Completion / notifications / streaks / share polish.
-- Additive. Unfollow cleans post-notification subscriptions.
-- Feed share source_id becomes text so review/note UUIDs and challenge keys both work.

-- ---------------------------------------------------------------------------
-- posts.source_type / source_id for structured Feed shares
-- ---------------------------------------------------------------------------
alter table public.posts
  drop constraint if exists posts_source_type_check;

alter table public.posts
  add constraint posts_source_type_check
  check (
    source_type is null
    or source_type in (
      'review',
      'note',
      'post',
      'challenge_complete',
      'challenge_goal',
      'challenge_badge',
      'challenge_community_milestone'
    )
  );

-- Was uuid; challenge share keys are not UUIDs. Review/note IDs remain UUID strings.
alter table public.posts
  alter column source_id type text using source_id::text;

-- ---------------------------------------------------------------------------
-- Unfollow removes per-creator post notification preference
-- ---------------------------------------------------------------------------
create or replace function public.cleanup_post_notifications_on_unfollow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.post_notification_preferences
  where subscriber_id = OLD.follower_id
    and creator_id = OLD.following_id;
  return OLD;
end;
$$;

drop trigger if exists follows_cleanup_post_notifications on public.follows;
create trigger follows_cleanup_post_notifications
  after delete on public.follows
  for each row execute function public.cleanup_post_notifications_on_unfollow();

-- ---------------------------------------------------------------------------
-- create_notification: social whitelist stays (message / follow / post like /
-- comment / reply / post_published) plus clubs + challenges.
-- Reading activity (review/shelf/start/finish/progress/rating) still no-ops.
-- ---------------------------------------------------------------------------
-- Reaffirm notify_followers_of_activity is a no-op (Feed may still show activity).
create or replace function public.notify_followers_of_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  return NEW;
end;
$$;
