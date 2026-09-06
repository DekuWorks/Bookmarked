-- Follow-up: review_visible_to_viewer must be SECURITY DEFINER + executable
-- by clients, matching activity_visible_to_viewer. Without this, RLS can
-- deny every reviews SELECT.
--
-- Rollback:
--   revoke execute on function public.review_visible_to_viewer(text, uuid, uuid) from authenticated, anon;
--   -- function itself can stay; policy still works for the table owner.

create or replace function public.review_visible_to_viewer(
  p_visibility text,
  p_owner_id uuid,
  p_viewer_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (p_viewer_id is not null and p_viewer_id = p_owner_id)
    or coalesce(p_visibility, 'public') = 'public';
$$;

grant execute on function public.review_visible_to_viewer(text, uuid, uuid)
  to authenticated, anon;
