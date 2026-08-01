# Audiobook research

Sprint 8 stores audiobook duration and listening progress in seconds so manual
tracking works without a provider account or background timer.

## Future integrations

- **Audible:** investigate whether a reader-authorized export or supported API
  can provide title, edition, duration, and listening position. Do not scrape
  playback pages or collect Audible credentials.
- **Spotify:** Spotify audiobook entitlement and playback APIs vary by market
  and plan. A future integration must use explicit OAuth scopes and treat
  playback position as optional, user-controlled data.
- **Timer:** an on-device timer can create listening sessions while the app is
  foregrounded. iOS background execution must use approved audio/background
  modes and must never claim elapsed time that was not observed.

Provider sync should be opt-in, disclose exactly which listening data is read,
deduplicate against manually created sessions, and preserve a manual override.
