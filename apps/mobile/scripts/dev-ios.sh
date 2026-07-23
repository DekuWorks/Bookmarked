#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

DEVICE="${IOS_SIMULATOR_DEVICE:-iPhone 17 Pro}"

if lsof -ti:8081 >/dev/null 2>&1; then
  echo "Killing stale process on port 8081..."
  lsof -ti:8081 | xargs kill -9 2>/dev/null || true
  sleep 1
fi

npx expo start --clear &
METRO_PID=$!
cleanup() { kill "$METRO_PID" 2>/dev/null || true; }
trap cleanup EXIT INT TERM

echo "Waiting for Metro (http://localhost:8081/status)..."
for _ in $(seq 1 90); do
  if curl -sf http://localhost:8081/status 2>/dev/null | grep -q running; then
    echo "Metro is running."
    break
  fi
  sleep 1
done

if ! curl -sf http://localhost:8081/status 2>/dev/null | grep -q running; then
  echo "Metro failed to start on port 8081." >&2
  exit 1
fi

exec npx expo run:ios --device "$DEVICE" --no-bundler
