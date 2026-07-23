-- Fix infinite recursion in conversation_participants RLS policies.
-- Policies that subquery conversation_participants during INSERT/DELETE/SELECT
-- re-trigger RLS on the same table. Use security-definer helpers with row_security off.

create or replace function public.user_is_conversation_participant(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = p_conversation_id
      and cp.user_id = auth.uid()
  );
$$;

create or replace function public.user_is_conversation_owner(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.conversation_participants cp
    join public.conversations c on c.id = cp.conversation_id
    where cp.conversation_id = p_conversation_id
      and cp.user_id = auth.uid()
      and cp.role = 'owner'
      and c.type = 'group'
  );
$$;

drop policy if exists "conversation_participants_insert_owner" on public.conversation_participants;
create policy "conversation_participants_insert_owner"
  on public.conversation_participants for insert
  to authenticated
  with check (public.user_is_conversation_owner(conversation_id));

drop policy if exists "conversation_participants_delete_owner" on public.conversation_participants;
create policy "conversation_participants_delete_owner"
  on public.conversation_participants for delete
  to authenticated
  using (
    public.user_is_conversation_owner(conversation_id)
    and conversation_participants.user_id <> auth.uid()
  );

grant execute on function public.user_is_conversation_participant(uuid) to authenticated;
grant execute on function public.user_is_conversation_owner(uuid) to authenticated;
