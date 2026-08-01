# Sprint 2 — Final Feedback Fixes

Status: implemented on web + native iOS (Aug 2026).

## Notes / Reading Room

| Fix | Status | Notes |
|-----|--------|-------|
| Note location `Page X • Chapter Y` | ✅ | Shared `formatNoteLocation` in `packages/utils/noteLocation.ts` |
| Colored note tags (incl. custom) | ✅ | Shared `NoteTag` + `resolveNoteTagTone` |
| Home Notes tab: 5 most recent | ✅ | DB `limit: 5` on web `ReadingRoomTabs` + mobile Home |
| Open Full Notes Page at TOP | ✅ | Web Reading Room Notes tab + mobile `NotesPanel` |
| Return to Home Notes at BOTTOM | ✅ | Web `/notes/` → `/reading-room/?tab=notes`; iOS `/?tab=notes` |
| Bookmark badge flush top-left on cover | ✅ | Shared `SavedBookBadge` / `BookCover` |

## Schema note

`user_reading_note_categories` has **no `color` column** yet. `NoteTag` accepts optional `color` for future stored custom colors; until then category defaults → Bookmarked purple.
