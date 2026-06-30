import { isAllowedPostImageUrl, isGiphyImageUrl, resolveGiphyImageUrl } from "@/lib/utils/giphy";

function supabaseStorageHost(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) return null;
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/** Whether a URL points at an uploaded image in the post-images bucket. */
export function isSupabasePostImageUrl(url: string): boolean {
  const host = supabaseStorageHost();
  if (!host) return false;

  try {
    const parsed = new URL(url.trim());
    if (parsed.hostname.toLowerCase() !== host) return false;
    return parsed.pathname.includes("/storage/v1/object/public/post-images/");
  } catch {
    return false;
  }
}

/** Allowed attachment URLs for comments and replies (Giphy or uploaded post images). */
export function isAllowedCommentAttachmentUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  return isAllowedPostImageUrl(trimmed) || isGiphyImageUrl(trimmed) || isSupabasePostImageUrl(trimmed);
}

/** Normalize a comment attachment URL (resolves Giphy links to direct media URLs). */
export function normalizeCommentAttachmentUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (isAllowedPostImageUrl(trimmed) || isGiphyImageUrl(trimmed)) {
    return resolveGiphyImageUrl(trimmed) ?? trimmed;
  }

  if (isSupabasePostImageUrl(trimmed)) {
    return trimmed;
  }

  return null;
}
