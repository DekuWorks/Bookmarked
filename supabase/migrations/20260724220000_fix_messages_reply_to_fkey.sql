-- Ensure messages.reply_to_id FK exists (add column if not exists skips REFERENCES when column already present).
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'messages_reply_to_id_fkey'
      and conrelid = 'public.messages'::regclass
  ) then
    alter table public.messages
      add constraint messages_reply_to_id_fkey
      foreign key (reply_to_id) references public.messages (id) on delete set null;
  end if;
end $$;
