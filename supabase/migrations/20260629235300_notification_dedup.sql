-- Prevent duplicate in-app notifications for the same social action.

create or replace function public.create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_actor_id uuid default null,
  p_link_url text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_actor uuid;
  v_dedup_key text;
begin
  v_actor := coalesce(p_actor_id, auth.uid());

  if p_user_id is null or v_actor is null then
    return null;
  end if;

  if p_user_id = v_actor then
    return null;
  end if;

  if auth.uid() is not null and v_actor is distinct from auth.uid() then
    raise exception 'Forbidden';
  end if;

  if p_type = 'message' and not exists (
    select 1 from public.profiles where id = p_user_id and notify_messages = true
  ) then
    return null;
  end if;

  if p_type = 'follow' and not exists (
    select 1 from public.profiles where id = p_user_id and notify_follows = true
  ) then
    return null;
  end if;

  if p_type = 'feed' and not exists (
    select 1 from public.profiles where id = p_user_id and notify_feed = true
  ) then
    return null;
  end if;

  v_dedup_key := coalesce(p_metadata, '{}'::jsonb)->>'dedup_key';
  if v_dedup_key is not null and exists (
    select 1
    from public.notifications n
    where n.user_id = p_user_id
      and n.metadata_json->>'dedup_key' = v_dedup_key
  ) then
    return null;
  end if;

  insert into public.notifications (
    user_id, type, title, body, actor_id, link_url, metadata_json
  )
  values (
    p_user_id, p_type, p_title, p_body, v_actor, p_link_url, coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_id;

  return v_id;
end;
$$;

create index if not exists notifications_dedup_key_idx
  on public.notifications ((metadata_json->>'dedup_key'))
  where metadata_json ? 'dedup_key';
