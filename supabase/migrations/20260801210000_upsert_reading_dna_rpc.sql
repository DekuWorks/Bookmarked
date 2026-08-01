-- Authenticated users may persist their own Reading DNA via security definer RPC.
-- Direct client INSERT/UPDATE on reading_dna_* remains denied by RLS.

create or replace function public.upsert_reading_dna(
  p_summary text,
  p_insight text,
  p_confidence text,
  p_confidence_score numeric,
  p_sample_size integer,
  p_traits jsonb,
  p_write_snapshot boolean default true,
  p_period_key text default null,
  p_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_period text;
  v_trait jsonb;
  v_top_labels text[] := array[]::text[];
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'Not authenticated');
  end if;

  if p_confidence is null or p_confidence not in ('none', 'low', 'medium', 'high') then
    return jsonb_build_object('ok', false, 'error', 'Invalid confidence');
  end if;

  if p_confidence_score is null or p_confidence_score < 0 or p_confidence_score > 1 then
    return jsonb_build_object('ok', false, 'error', 'Invalid confidence_score');
  end if;

  if p_sample_size is null or p_sample_size < 0 then
    return jsonb_build_object('ok', false, 'error', 'Invalid sample_size');
  end if;

  if p_traits is null or jsonb_typeof(p_traits) <> 'array' then
    return jsonb_build_object('ok', false, 'error', 'traits must be a JSON array');
  end if;

  insert into public.reading_dna_profiles (
    user_id,
    summary,
    insight,
    confidence,
    confidence_score,
    sample_size,
    computed_at
  )
  values (
    v_user_id,
    p_summary,
    p_insight,
    p_confidence,
    p_confidence_score,
    p_sample_size,
    now()
  )
  on conflict (user_id) do update
  set
    summary = excluded.summary,
    insight = excluded.insight,
    confidence = excluded.confidence,
    confidence_score = excluded.confidence_score,
    sample_size = excluded.sample_size,
    computed_at = excluded.computed_at,
    updated_at = now();

  -- Replace trait set for this user (idempotent full refresh).
  delete from public.reading_dna_traits where user_id = v_user_id;

  for v_trait in select * from jsonb_array_elements(p_traits)
  loop
    if coalesce(v_trait->>'category', '') not in ('genre', 'vibe', 'emotion', 'trope', 'habit') then
      continue;
    end if;
    if coalesce(nullif(trim(v_trait->>'label'), ''), '') = '' then
      continue;
    end if;

    insert into public.reading_dna_traits (
      user_id,
      category,
      label,
      score,
      percent,
      emoji,
      persona,
      is_top_trait,
      is_public_approved
    )
    values (
      v_user_id,
      v_trait->>'category',
      lower(trim(v_trait->>'label')),
      coalesce((v_trait->>'score')::numeric, 0),
      coalesce((v_trait->>'percent')::numeric, 0),
      nullif(trim(v_trait->>'emoji'), ''),
      nullif(trim(v_trait->>'persona'), ''),
      coalesce((v_trait->>'is_top_trait')::boolean, false),
      false
    )
    on conflict (user_id, category, label) do update
    set
      score = excluded.score,
      percent = excluded.percent,
      emoji = excluded.emoji,
      persona = excluded.persona,
      is_top_trait = excluded.is_top_trait;

    if coalesce((v_trait->>'is_top_trait')::boolean, false) then
      v_top_labels := array_append(v_top_labels, lower(trim(v_trait->>'label')));
    end if;
  end loop;

  if p_write_snapshot then
    v_period := coalesce(nullif(trim(p_period_key), ''), to_char(timezone('utc', now()), 'YYYY-MM'));
    insert into public.reading_dna_snapshots (
      user_id,
      period_key,
      payload,
      confidence
    )
    values (
      v_user_id,
      v_period,
      coalesce(p_payload, '{}'::jsonb),
      p_confidence
    )
    on conflict (user_id, period_key) do update
    set
      payload = excluded.payload,
      confidence = excluded.confidence;
  end if;

  return jsonb_build_object(
    'ok', true,
    'user_id', v_user_id,
    'trait_count', jsonb_array_length(p_traits),
    'top_labels', to_jsonb(v_top_labels)
  );
end;
$$;

revoke all on function public.upsert_reading_dna(
  text, text, text, numeric, integer, jsonb, boolean, text, jsonb
) from public;
grant execute on function public.upsert_reading_dna(
  text, text, text, numeric, integer, jsonb, boolean, text, jsonb
) to authenticated;
