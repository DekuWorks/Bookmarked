# Home experiences, meetups, and video

- **Table:** `home_experiences` + `event_access` (prices as data) + `home_experience_rsvps`.
- **Kinds:** author Q&A, virtual event, 24h sprint, meetup, merch window, partner benefit.
- **Access:** `canAccessExperience` — Home-included vs ticketed vs lower-tier fees are row data. Do not invent which Q&As are free.
- **Sprints:** clock + progress (`sprintProgress`). No 24-hour stay-online requirement (`SPRINT_NO_STAY_ONLINE_COPY`).
- **Merch windows** and **priority RSVP windows** are per-event timestamps, not hardcoded.
- **Partner benefits:** entitlement-aware keys. No public codes.
- **Beta:** `is_beta` label. Auto-enrol vs per-flag is open (`home_beta_auto_enroll` default false).
- **Meetups:** `create_home_meetup` requires Home + age eligibility. Prefer public venues; UI warns on `arbitrary_address`. Who can create / pre-approval are flags.
- **Video:** `VideoEventProvider` + `video_provider` column (`external` | `unset`). Join URL is not on the public view; `get_experience_join_config` returns it only after Home + RSVP going. Do not pick Zoom as production default.

Club events still use `/events/` and existing RSVP. Home experiences appear on the same Events screen for Home members.
