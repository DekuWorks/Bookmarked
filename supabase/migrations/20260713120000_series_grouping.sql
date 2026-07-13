-- Series grouping: series columns were added (commented "Phase 3 deferred")
-- in 20260709120000_phase2_community_reading.sql. Series auto-detection from
-- ISBNdb title data is now live, so index series_name for the series view and
-- refresh the column comments to reflect the active feature.

create index if not exists books_series_name_lower_idx
  on public.books (lower(series_name))
  where series_name is not null;

comment on column public.books.series_name is
  'Series name auto-detected from ISBNdb title/title_long (e.g. "The Shadowshaper Cypher").';
comment on column public.books.series_position is
  'Position within the series, parsed from title patterns like "(Series, #1)". Supports decimals (e.g. 1.5).';
