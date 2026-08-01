# Notes Architecture

## Shared formatters (`packages/utils`)

| Export | Purpose |
|--------|---------|
| `formatNoteLocation({ pageNumber, chapterNumber })` | `Page 48 • Chapter 2` / page-only / chapter-only / `null` |
| `HOME_NOTES_PREVIEW_LIMIT` | `5` |
| `resolveNoteTagTone` / `readingNoteTagTone` | Colored tag backgrounds |
| `NoteTagInput` | label, optional stored color, category, isCustom |

## UI components

| Component | Web | iOS |
|-----------|-----|-----|
| `NoteTag` | `apps/web/src/components/notes/NoteTag.tsx` | `apps/mobile/src/components/NoteTag.tsx` |
| Note cards | `ReadingNoteCard`, `NotesSearchResultCard`, `ProfileNotesSection` | `ReadingNotesSection`, `NotesPanel`, `/notes` |
| Recent preview | Reading Room Notes tab | `NotesPanel` |
| Full notes | `/notes/` | `app/(app)/notes.tsx` |

## Routes

- Home Notes tab (web): `/reading-room/?tab=notes`
- Home Notes tab (iOS): `/?tab=notes` (Home / Reading Room)
- Full notes: `/notes/` (web), `/notes` (iOS)

## Custom tag colors

Schema currently has **no** `user_reading_note_categories.color`. Pass `color` into `NoteTag` when added; until then category palette + Bookmarked purple apply.
