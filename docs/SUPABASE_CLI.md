# Supabase CLI authentication (macOS)

Bookmarked project ref: `xtdfeorhdlpnbxycpone` (already linked via `supabase link`).

## Where the CLI stores credentials

The Supabase CLI **does not** use `~/.supabase/access-token`. On macOS, `supabase login` saves your personal access token in the **login keychain**:

- Service: `Supabase CLI`
- Account: `supabase`

Verify (no secret printed):

```bash
security find-generic-password -s "Supabase CLI" 2>&1 | head -3
```

`~/.supabase/` only holds telemetry/traces; that is normal.

## One-time setup (interactive Terminal)

From a normal Terminal.app or iTerm session (TTY required):

```bash
supabase login
```

Or paste a token from [Supabase Dashboard → Account → Access tokens](https://supabase.com/dashboard/account/tokens):

```bash
supabase login --token 'sbp_...'
```

Do **not** commit tokens or paste them into chat.

## Why Cursor / agent shells keep asking to sign in

1. **Non-TTY environments** — `supabase login` without `--token` fails in agent shells with a message about automatic login. Use Terminal once, or set a token via env (below).
2. **`--agent auto` (default)** — In automated environments the CLI may wait on an interactive browser flow instead of using the keychain immediately. Prefer `--agent no` for scripts and agents when you are already logged in.
3. **`SUPABASE_ACCESS_TOKEN` overrides keychain** — If this variable is set to an empty or invalid value, API calls fail even when Keychain has a valid token. Unset it or fix the value.
4. **Shell config** — Agent terminals often **do not** source `~/.zshrc`. That is fine if Keychain auth works; do not rely on `export SUPABASE_ACCESS_TOKEN=...` in zshrc unless you maintain it yourself.

## Optional: project `.env` for local agents (gitignored)

Root `.env` is gitignored. For Cursor agents or CI on your machine only:

1. Copy `.env.example` to `.env` in the repo root.
2. Add `SUPABASE_ACCESS_TOKEN=sbp_...` (from the dashboard or after `supabase login`).

Or use the wrapper (loads `.env` and forces non-agent mode):

```bash
./scripts/supabase-cli.sh projects list
./scripts/supabase-cli.sh db push
```

## Common commands (linked project)

```bash
supabase projects list --agent no
supabase db push --agent no
supabase functions deploy <name> --agent no
```

`supabase link` is already done for this repo; re-link only if you change Supabase projects.

## Troubleshooting

| Symptom | Fix |
|--------|-----|
| Hangs with spinner, no output | Run with `--agent no`; ensure `supabase login` completed in Terminal |
| `Invalid access token format` | Clear bad `SUPABASE_ACCESS_TOKEN` in env or `.env` |
| `LegacyLoginMissingTokenError` | Run `supabase login` in Terminal or set `SUPABASE_ACCESS_TOKEN` |
| Keychain prompt every time | Allow Terminal/Cursor to access Keychain; or use `.env` token for agents |

## Cursor Supabase plugin

`.cursor/settings.json` may enable the Supabase plugin separately from the CLI. Plugin auth and CLI Keychain auth are independent; CLI steps above apply to terminal and agent commands only.
