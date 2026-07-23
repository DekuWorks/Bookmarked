#!/usr/bin/env python3
"""Wipe all app data for a user while preserving auth.users row.

Requires env vars (set in scripts/.env or exported):
  SUPABASE_PROJECT_REF
  SUPABASE_SERVICE_ROLE_KEY
  WIPE_USER_ID  (or pass user UUID as first CLI argument)
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent


def load_env_file() -> None:
    env_path = SCRIPT_DIR / ".env"
    if not env_path.is_file():
        return
    for line in env_path.read_text().splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def require_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required env var: {name} (set in scripts/.env)")
    return value


def request(
    base_url: str,
    method: str,
    path: str,
    key: str,
    body: dict | None = None,
    prefer: str | None = None,
):
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(f"{base_url}/{path}", data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content_range = resp.headers.get("Content-Range", "")
            body_text = resp.read().decode()
            return resp.status, content_range, json.loads(body_text) if body_text else None
    except urllib.error.HTTPError as e:
        err_body = e.read().decode()
        raise RuntimeError(f"{method} {path} failed ({e.code}): {err_body}") from e


def count_rows(base_url: str, key: str, table: str, filter_expr: str, select_col: str = "id") -> int:
    _, content_range, _ = request(
        base_url,
        "GET",
        f"{table}?{filter_expr}&select={select_col}",
        key,
        prefer="count=exact",
    )
    if "/" in content_range:
        return int(content_range.split("/")[-1])
    return 0


def delete_rows(base_url: str, key: str, table: str, filter_expr: str, select_col: str = "id") -> int:
    before = count_rows(base_url, key, table, filter_expr, select_col)
    if before == 0:
        return 0
    request(base_url, "DELETE", f"{table}?{filter_expr}", key)
    after = count_rows(base_url, key, table, filter_expr, select_col)
    if after != 0:
        raise RuntimeError(f"Failed to delete all rows from {table}; {after} remain")
    return before


def main() -> int:
    load_env_file()

    project_ref = require_env("SUPABASE_PROJECT_REF")
    service_key = require_env("SUPABASE_SERVICE_ROLE_KEY")
    user_id = (sys.argv[1] if len(sys.argv) > 1 else os.environ.get("WIPE_USER_ID", "")).strip()
    if not user_id:
        raise RuntimeError("Missing user id: set WIPE_USER_ID or pass UUID as first argument")

    rest_url = f"https://{project_ref}.supabase.co/rest/v1"
    auth_url = f"https://{project_ref}.supabase.co/auth/v1"
    deleted: dict[str, int] = {}

    deletions = [
        ("review_reactions", f"user_id=eq.{user_id}", "review_id"),
        ("review_replies", f"user_id=eq.{user_id}", "id"),
        ("post_comment_reactions", f"user_id=eq.{user_id}", "comment_id"),
        ("post_comment_replies", f"user_id=eq.{user_id}", "id"),
        ("post_likes", f"user_id=eq.{user_id}", "post_id"),
        ("post_comments", f"user_id=eq.{user_id}", "id"),
        ("reading_notes", f"user_id=eq.{user_id}", "id"),
        ("reading_sessions", f"user_id=eq.{user_id}", "id"),
        ("user_reading_note_categories", f"user_id=eq.{user_id}", "id"),
        ("user_shelf_books", f"user_id=eq.{user_id}", "id"),
        ("user_shelves", f"user_id=eq.{user_id}", "id"),
        ("reviews", f"user_id=eq.{user_id}", "id"),
        ("user_books", f"user_id=eq.{user_id}", "id"),
        ("activity_events", f"user_id=eq.{user_id}", "id"),
        ("posts", f"user_id=eq.{user_id}", "id"),
        ("post_drafts", f"user_id=eq.{user_id}", "id"),
        ("follows", f"follower_id=eq.{user_id}", "follower_id"),
        ("follows", f"following_id=eq.{user_id}", "following_id"),
        ("notifications", f"user_id=eq.{user_id}", "id"),
        ("book_club_posts", f"user_id=eq.{user_id}", "id"),
        ("book_club_members", f"user_id=eq.{user_id}", "id"),
        ("messages", f"sender_id=eq.{user_id}", "id"),
        ("conversation_participants", f"user_id=eq.{user_id}", "user_id"),
        ("user_subscriptions", f"user_id=eq.{user_id}", "user_id"),
    ]

    for table, filter_expr, select_col in deletions:
        label = f"{table} ({filter_expr.split('=')[0]})"
        deleted[label] = delete_rows(rest_url, service_key, table, filter_expr, select_col)

    clubs_filter = f"owner_id=eq.{user_id}"
    deleted["book_clubs (owner_id)"] = delete_rows(rest_url, service_key, "book_clubs", clubs_filter)

    profile_reset = {
        "display_name": None,
        "bio": None,
        "avatar_url": None,
        "favorite_genres": None,
        "preferred_library_view": "bookshelf",
        "yearly_reading_goal": None,
        "shelf_visibility_want_to_read": "public",
        "shelf_visibility_currently_reading": "public",
        "shelf_visibility_read": "public",
        "notify_messages": True,
        "notify_follows": True,
        "notify_feed": True,
        "notify_browser": False,
        "notify_likes": True,
        "notify_comments": True,
        "notify_mentions": True,
        "preferred_language": "en",
    }
    request(rest_url, "PATCH", f"profiles?id=eq.{user_id}", service_key, profile_reset)

    auth_req = urllib.request.Request(
        f"{auth_url}/admin/users/{user_id}",
        headers={"apikey": service_key, "Authorization": f"Bearer {service_key}"},
    )
    with urllib.request.urlopen(auth_req) as resp:
        auth_user = json.loads(resp.read().decode())

    print(json.dumps({"user_id": user_id, "email": auth_user.get("email"), "deleted": deleted}, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
