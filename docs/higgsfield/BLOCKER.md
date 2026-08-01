# Higgsfield blocker (Reading DNA assets)

**Status:** Partially unblocked for product — runtime assets exist; Higgsfield MCP generation still broken.

## What works

- Cursor image generation produced the four Reading DNA PNGs (prompts in `READING_DNA_PROMPTS.md`).
- Assets saved under `apps/web/public/assets/reading-dna/` and `apps/mobile/assets/reading-dna/`.
- Hero atmosphere wired on web `ReadingDnaDashboard` + iOS `reading-dna` route.

## What fails (Aug 1, 2026)

1. `mcp_auth` returns “Successfully authenticated”.
2. Immediately after, `generate_image`, `media_upload`, `balance`, `list_workspaces`, `show_generations` return:
   > Your Higgsfield session has expired or is no longer valid…
3. Catalog `models_explore(action: "get")` and `show_plans_and_credits` UI still respond.

This is **not** a prompt/model issue — OAuth session for job/media APIs does not stick after connector auth.

## Resume checklist (Higgsfield regen)

1. In Cursor: remove + re-add the Higgsfield MCP connector (reconnect alone is not enough).
2. Complete browser login until `balance` returns a number (not session expired).
3. Upload mockup via `media_upload` or `media_upload_widget`.
4. Regenerate with `nano_banana_pro` using prompts in `READING_DNA_PROMPTS.md`.
5. Overwrite PNGs in both app asset folders; update URLs in `READING_DNA_ASSET_MAP.md`.

Until then, ship with the Cursor-generated runtime assets already on disk.
