# Reader Map

Local social discovery for Home members. **Not live tracking.**

- **Default OFF.** Opt-in copy: `READER_MAP_OPT_IN_COPY`.
- **Access:** `canAccessFeature("reader_map")` plus `readerMapSocialAllowed`.
- **Public markers** expose only coarse lat/lng + visible profile fields. Never precise GPS, never “214 feet away.”
- **Device GPS** is used only for a private nearby calc, stored briefly (`PRECISE_LOCATION_MAX_RETENTION_MS`), then dropped. No location history table.
- **Age:** `reader_map_age_status`. If age is unknown or under a configured minimum, nearby-reader and meetup social stay off. The minimum age number is **not invented** (`reader_map_min_age` flag is null).
- **Blocks** excluded both ways. Private club membership never listed.
- **Viewport RPC** `list_reader_map_markers`: Home check, age check, rate limit (20/min), limit 40, cursor.
- **Downgrade:** losing Home entitlement sets `opted_in` / `discoverable` false and clears precise coords.
- **Placement** (Book Map vs separate vs Home Hub) is an open product decision. Interim: dedicated `/reader-map` linked from Book Map + Home Hub.

See `packages/utils/locationPrivacy.ts`, `packages/utils/readerMap.ts`.
