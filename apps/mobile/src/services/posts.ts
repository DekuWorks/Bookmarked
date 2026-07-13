import { supabase } from "./supabase";

/**
 * Mobile posts service. Minimal port of apps/web/src/lib/services/posts.ts —
 * create a text post (the "What are you reading?" composer) against the `posts`
 * table + RLS. GIFs, mentions, drafts, likes/comments on posts are deferred
 * (see report); review reactions cover the primary feed engagement flow.
 */

export async function createPost(
  body: string,
  bookId?: string | null
): Promise<{ error?: string; postId?: string }> {
  const trimmed = body.trim();
  if (!trimmed) return { error: "Write something to share." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data, error } = await supabase
    .from("posts")
    .insert({ user_id: user.id, body: trimmed, book_id: bookId ?? null })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { postId: data.id as string };
}
