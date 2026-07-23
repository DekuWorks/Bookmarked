#!/usr/bin/env bash
# Wrapper for Supabase CLI in CI/agent shells: load root .env if present, disable agent login UX.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi
exec supabase --agent no "$@"
