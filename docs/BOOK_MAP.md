# Book Map

Dedicated Home destination for independent bookstores, libraries, and **explicit** reading cafés. Not the Overview / Home tab.

- **Nav label:** Book Map (secondary). Do not rename primary Home/Overview.
- **Access:** `canAccessFeature("book_map")` — Home only.
- **Data:** `book_map_places`. Business coordinates may be precise.
- **UI:** Web map + filter + list. iPhone map/list + sheet. iPad map/list + side panel.
- **Filters:** All / Bookstore / Library / Café.
- **Search This Area** is a button — not on every pan (`shouldSearchOnPan() === false`).
- **Near Me** after permission. City / ZIP / name still work if denied.
- **Directions** open OS maps (`osMapsDirectionsUrl`).
- **Reports** reuse `content_reports` (`book_map_place` + closed / wrong_info / duplicate / incorrect / inappropriate_place).
- **Cafés:** none seeded. Qualification is an open product decision (`reading_cafe_qualification`).
- **User submissions:** RPC `submit_book_map_place` requires Home + `book_map_user_submissions_enabled` (default off).
- **Map provider:** `MapProvider` / `BookMapService` / `PlaceSearchService`. No vendor SDK is wired; default is OSM tiles.

See `packages/utils/bookMap.ts`, `packages/utils/mapProvider.ts`.
