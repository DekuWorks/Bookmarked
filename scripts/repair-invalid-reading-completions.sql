/**
 * Idempotent repair for invalid reading completions.
 *
 * Run via Supabase SQL editor or:
 *   supabase db execute --file scripts/repair-invalid-reading-completions.sql
 *
 * Rollback: this script only marks sessions missing; it does not delete rows.
 * To undo a mistaken repair, restore from backup or manually set page_count_status
 * back to 'known' with valid total_pages/pages_read for affected session ids.
 */

-- Audit counts (read-only)
select
  count(*) filter (
    where ub.shelf_status = 'read'
      and rs.percent_complete >= 100
      and coalesce(rs.pages_read, 0) = 0
      and (rs.total_pages is null or rs.total_pages = 0)
      and coalesce(rs.page_count_status, 'known') <> 'missing'
  ) as broken_sessions,
  count(*) filter (where rs.page_count_status = 'missing') as already_missing
from public.reading_sessions rs
join public.user_books ub on ub.id = rs.user_book_id;

-- Repair broken completion sessions
with broken as (
  select rs.id
  from public.reading_sessions rs
  join public.user_books ub on ub.id = rs.user_book_id
  where ub.shelf_status = 'read'
    and rs.percent_complete >= 100
    and coalesce(rs.pages_read, 0) = 0
    and (rs.total_pages is null or rs.total_pages = 0)
    and coalesce(rs.page_count_status, 'known') <> 'missing'
),
updated as (
  update public.reading_sessions rs
  set
    total_pages = null,
    pages_read = 0,
    page_count_status = 'missing',
    page_count_source = 'unavailable',
    completed_at = coalesce(rs.completed_at, rs.created_at)
  from broken b
  where rs.id = b.id
  returning rs.id
)
select
  (select count(*) from updated) as repaired_count,
  (select count(*) from public.reading_sessions where page_count_status = 'missing') as needs_user_input_count;
