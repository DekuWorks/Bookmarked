-- Gate book club descriptions through the existing UGC decision pipeline.
-- Additive: replaces require_ugc_moderation and widens the club trigger columns.

create or replace function public.require_ugc_moderation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_type text;
  v_text text;
  v_old text;
  v_meta jsonb;
  v_name_changed boolean;
  v_description_changed boolean;
begin
  v_type := tg_argv[0];

  if tg_table_name = 'book_clubs' then
    v_user := auth.uid();
    v_name_changed :=
      tg_op = 'INSERT'
      or public.normalize_for_moderation(coalesce(new.name, ''))
        <> public.normalize_for_moderation(coalesce(old.name, ''));
    v_description_changed :=
      tg_op = 'INSERT'
      or public.normalize_for_moderation(coalesce(new.description, ''))
        <> public.normalize_for_moderation(coalesce(old.description, ''));

    if v_name_changed and public.normalize_for_moderation(coalesce(new.name, '')) <> '' then
      v_meta := public.consume_moderation_decision(v_user, 'BOOK_CLUB_NAME', new.name);
      if v_meta is null then
        raise exception 'Content must be reviewed before it can be published.'
          using errcode = 'P0001';
      end if;
      new.moderation_meta := v_meta;
    end if;

    if v_description_changed
      and public.normalize_for_moderation(coalesce(new.description, '')) <> '' then
      v_meta := public.consume_moderation_decision(
        v_user,
        'BOOK_CLUB_DESCRIPTION',
        new.description
      );
      if v_meta is null then
        raise exception 'Content must be reviewed before it can be published.'
          using errcode = 'P0001';
      end if;
    end if;

    return new;
  end if;

  if tg_table_name = 'posts' then
    v_user := new.user_id;
    v_text := new.body;
    v_old := case when tg_op = 'UPDATE' then old.body else null end;
  elsif tg_table_name = 'post_comments' then
    v_user := new.user_id;
    v_text := new.body;
    v_old := case when tg_op = 'UPDATE' then old.body else null end;
  elsif tg_table_name = 'post_comment_replies' then
    v_user := new.user_id;
    v_text := new.body;
    v_old := case when tg_op = 'UPDATE' then old.body else null end;
  elsif tg_table_name = 'profiles' then
    v_user := new.id;
    v_text := coalesce(new.bio, '');
    v_old := case when tg_op = 'UPDATE' then coalesce(old.bio, '') else null end;
  elsif tg_table_name = 'book_club_discussions' then
    v_user := new.user_id;
    v_text := coalesce(new.title, '') || E'\n' || coalesce(new.body, '');
    v_old := case when tg_op = 'UPDATE' then coalesce(old.title, '') || E'\n' || coalesce(old.body, '') else null end;
  elsif tg_table_name = 'book_club_discussion_replies' then
    v_user := new.user_id;
    v_text := new.body;
    v_old := case when tg_op = 'UPDATE' then old.body else null end;
  else
    return new;
  end if;

  if tg_op = 'UPDATE' and public.normalize_for_moderation(coalesce(v_text, ''))
      = public.normalize_for_moderation(coalesce(v_old, '')) then
    return new;
  end if;

  if public.normalize_for_moderation(coalesce(v_text, '')) = '' then
    return new;
  end if;

  v_meta := public.consume_moderation_decision(v_user, v_type, v_text);
  if v_meta is null then
    raise exception 'Content must be reviewed before it can be published.'
      using errcode = 'P0001';
  end if;

  new.moderation_meta := v_meta;
  return new;
end;
$$;

drop trigger if exists book_clubs_require_moderation on public.book_clubs;
create trigger book_clubs_require_moderation
  before insert or update of name, description on public.book_clubs
  for each row execute function public.require_ugc_moderation('BOOK_CLUB_NAME');
