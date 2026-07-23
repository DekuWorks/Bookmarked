-- Deduplicate follower feed notifications for the same activity event.
-- The activity trigger bypassed create_notification's dedup_key logic via bulk INSERT.

create or replace function public.notify_followers_of_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_name text;
  activity_body text;
  actor_username text;
  follower_id uuid;
  link_url text;
  metadata jsonb;
begin
  if NEW.visibility = 'private' then
    return NEW;
  end if;

  if NEW.event_type not in (
    'book_added', 'shelf_updated', 'book_finished', 'reading_finished',
    'reading_started', 'review_created', 'review_added', 'review_updated'
  ) then
    return NEW;
  end if;

  select
    coalesce(nullif(trim(display_name), ''), nullif(trim(username), ''), 'A reader'),
    nullif(trim(username), '')
  into actor_name, actor_username
  from public.profiles
  where id = NEW.user_id;

  activity_body := case NEW.event_type
    when 'review_created' then actor_name || ' wrote a review'
    when 'review_updated' then actor_name || ' updated a review'
    when 'review_added' then actor_name || ' wrote a review'
    when 'book_finished' then actor_name || ' finished a book'
    when 'reading_finished' then actor_name || ' finished a book'
    when 'reading_started' then actor_name || ' started reading a book'
    when 'book_added' then actor_name || ' added a book to their library'
    when 'shelf_updated' then actor_name || ' updated their shelves'
    else actor_name || ' shared a reading update'
  end;

  link_url := case
    when actor_username is not null then '/reader/?username=' || actor_username
    else '/feed/'
  end;

  metadata := jsonb_build_object(
    'activity_id', NEW.id,
    'event_type', NEW.event_type,
    'dedup_key', 'feed_activity:' || NEW.id::text
  );

  for follower_id in
    select f.follower_id
    from public.follows f
    inner join public.profiles fp on fp.id = f.follower_id
    where f.following_id = NEW.user_id
      and f.follower_id <> NEW.user_id
      and fp.notify_feed = true
  loop
    perform public.create_notification(
      follower_id,
      'feed',
      'New from ' || actor_name,
      activity_body,
      NEW.user_id,
      link_url,
      metadata
    );
  end loop;

  return NEW;
end;
$$;
