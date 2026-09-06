/**
 * Permanently delete the authenticated user's account and all app data.
 * Requires Authorization: Bearer <user JWT>.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

async function deleteUserData(
  admin: ReturnType<typeof createClient>,
  userId: string
): Promise<void> {
  const deletions: { table: string; column: string }[] = [
    { table: "moderation_decisions", column: "user_id" },
    { table: "moderation_logs", column: "user_id" },
    { table: "content_reports", column: "reporter_id" },
    { table: "user_blocks", column: "blocker_id" },
    { table: "user_blocks", column: "blocked_id" },
    { table: "review_reactions", column: "user_id" },
    { table: "review_replies", column: "user_id" },
    { table: "post_comment_reactions", column: "user_id" },
    { table: "post_comment_replies", column: "user_id" },
    { table: "post_likes", column: "user_id" },
    { table: "post_comments", column: "user_id" },
    { table: "reading_notes", column: "user_id" },
    { table: "reading_sessions", column: "user_id" },
    { table: "user_reading_note_categories", column: "user_id" },
    { table: "user_mood_tags", column: "user_id" },
    { table: "user_shelf_books", column: "user_id" },
    { table: "user_shelves", column: "user_id" },
    { table: "reviews", column: "user_id" },
    { table: "user_books", column: "user_id" },
    { table: "activity_events", column: "user_id" },
    { table: "posts", column: "user_id" },
    { table: "post_drafts", column: "user_id" },
    { table: "notifications", column: "user_id" },
    { table: "book_club_discussion_reactions", column: "user_id" },
    { table: "book_club_discussion_replies", column: "user_id" },
    { table: "book_club_discussions", column: "user_id" },
    { table: "book_club_event_attendees", column: "user_id" },
    { table: "book_club_announcements", column: "created_by" },
    { table: "book_club_invitations", column: "invitee_id" },
    { table: "book_club_invitations", column: "inviter_id" },
    { table: "book_club_join_requests", column: "user_id" },
    { table: "book_club_members", column: "user_id" },
    { table: "messages", column: "sender_id" },
    { table: "conversation_participants", column: "user_id" },
    { table: "user_subscriptions", column: "user_id" },
  ];

  for (const { table, column } of deletions) {
    const { error } = await admin.from(table).delete().eq(column, userId);
    if (error) throw new Error(`Failed to delete ${table}: ${error.message}`);
  }

  const { error: followsErr1 } = await admin
    .from("follows")
    .delete()
    .eq("follower_id", userId);
  if (followsErr1) throw new Error(`Failed to delete follows: ${followsErr1.message}`);

  const { error: followsErr2 } = await admin
    .from("follows")
    .delete()
    .eq("following_id", userId);
  if (followsErr2) throw new Error(`Failed to delete follows: ${followsErr2.message}`);

  const { error: clubsErr } = await admin
    .from("book_clubs")
    .delete()
    .eq("owner_id", userId);
  if (clubsErr) throw new Error(`Failed to delete book_clubs: ${clubsErr.message}`);

  const { error: profileErr } = await admin.from("profiles").delete().eq("id", userId);
  if (profileErr) throw new Error(`Failed to delete profile: ${profileErr.message}`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !serviceKey || !anonKey) {
    return jsonResponse({ error: "Server misconfigured" }, 500);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const jwt = authHeader.slice("Bearer ".length);
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser(jwt);
  if (userError || !userData.user) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const userId = userData.user.id;
  const admin = createClient(supabaseUrl, serviceKey);

  try {
    await deleteUserData(admin, userId);

    const { error: deleteAuthError } = await admin.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      throw new Error(`Failed to delete auth user: ${deleteAuthError.message}`);
    }

    return jsonResponse({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Account deletion failed";
    return jsonResponse({ error: message }, 500);
  }
});
