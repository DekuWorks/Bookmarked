import { env } from "../constants/env";
import { isAllowedPostImageUrl, isGiphyImageUrl, resolveGiphyImageUrl } from "./giphy";

/**
 * Comment/reply attachment URL helpers. Mirror of
 * apps/web/src/lib/utils/attachments.ts so mobile stores the same normalized
 * `attachment_url` values (a Giphy media URL or an uploaded post-images URL).
 */

function supabaseStorageHost(): string | null {
  const url = env.supabaseUrl?.trim();
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
