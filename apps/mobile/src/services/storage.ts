import * as ImagePicker from "expo-image-picker";
import { supabase } from "./supabase";
import { MESSAGE_ATTACHMENT_BUCKET } from "../../../../packages/utils/messageAttachments";

/**
 * Image picking + Supabase Storage uploads for posts, comments, and messages.
 * Mirrors the web upload flow (apps/web posts.ts `uploadPostImage`, messages
 * attachment upload) against the same `post-images` / `message-attachments`
 * buckets + storage RLS. Uses expo-image-picker (native module — a native
 * rebuild is required for custom dev/production builds; works in Expo Go).
 */

export const POST_IMAGE_BUCKET = "post-images";
export const AVATAR_BUCKET = "avatars";
export { MESSAGE_ATTACHMENT_BUCKET };
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB (matches bucket limit)
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export type PickedImage = {
  base64: string;
  mimeType: string;
  /** Local uri for immediate preview before upload. */
  uri: string;
};

const B64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** Minimal base64 → bytes decoder (avoids relying on RN atob/Buffer). */
function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, "");
  const len = clean.length;
  const byteLength = Math.floor((len * 3) / 4);
  const bytes = new Uint8Array(byteLength);
  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const e1 = B64_CHARS.indexOf(clean[i]);
    const e2 = B64_CHARS.indexOf(clean[i + 1]);
    const e3 = B64_CHARS.indexOf(clean[i + 2]);
    const e4 = B64_CHARS.indexOf(clean[i + 3]);
    const chunk = (e1 << 18) | (e2 << 12) | ((e3 & 63) << 6) | (e4 & 63);
    if (p < byteLength) bytes[p++] = (chunk >> 16) & 0xff;
    if (e3 !== -1 && p < byteLength) bytes[p++] = (chunk >> 8) & 0xff;
    if (e4 !== -1 && p < byteLength) bytes[p++] = chunk & 0xff;
  }
  return bytes;
}

function extForMime(mime: string): string {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

function randomId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Launch the OS image library and return a base64-encoded image. Requests
 * media-library permission on demand.
 */
export async function pickImageFromLibrary(): Promise<{
  image?: PickedImage;
  error?: string;
  canceled?: boolean;
}> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return { error: "Photo library access is needed to attach an image." };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    base64: true,
    quality: 0.8,
    allowsMultipleSelection: false,
  });

  if (result.canceled) return { canceled: true };

  const asset = result.assets?.[0];
  if (!asset?.base64) return { error: "Could not read the selected image." };

  const mimeType =
    asset.mimeType && ALLOWED_MIME.has(asset.mimeType) ? asset.mimeType : "image/jpeg";

  const approxBytes = Math.floor((asset.base64.length * 3) / 4);
  if (approxBytes > MAX_IMAGE_BYTES) {
    return { error: "Image is too large (max 5 MB)." };
  }

  return { image: { base64: asset.base64, mimeType, uri: asset.uri } };
}

async function uploadBase64(
  bucket: string,
  path: string,
  base64: string,
  contentType: string,
  options?: { returnPath?: boolean; upsert?: boolean }
): Promise<{ url?: string; error?: string }> {
  const bytes = base64ToBytes(base64);
  const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
    contentType,
    upsert: options?.upsert ?? false,
  });
  if (error) return { error: error.message };

  if (options?.returnPath) {
    return { url: path };
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl };
}

/** Upload a post/comment image to the public `post-images` bucket. */
export async function uploadPostImage(
  image: PickedImage
): Promise<{ url?: string; error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const path = `${user.id}/${randomId()}.${extForMime(image.mimeType)}`;
  return uploadBase64(POST_IMAGE_BUCKET, path, image.base64, image.mimeType);
}

/** Comment/reply attachments reuse the post-images bucket (mirrors web). */
export const uploadCommentAttachment = uploadPostImage;

/**
 * Upload a message attachment. The `message-attachments` bucket RLS requires the
 * path to be `{conversationId}/{userId}/...` (participant + owner checks).
 */
export async function uploadMessageAttachment(
  conversationId: string,
  image: PickedImage
): Promise<{ url?: string; error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const path = `${conversationId}/${user.id}/${randomId()}.${extForMime(image.mimeType)}`;
  return uploadBase64(MESSAGE_ATTACHMENT_BUCKET, path, image.base64, image.mimeType, {
    returnPath: true,
  });
}

async function uploadAvatarImage(
  path: string,
  image: PickedImage
): Promise<{ url?: string; error?: string }> {
  const result = await uploadBase64(AVATAR_BUCKET, path, image.base64, image.mimeType, {
    upsert: true,
  });
  if (result.error || !result.url) return result;
  return { url: `${result.url}?v=${Date.now()}` };
}

/** Upload a group chat avatar (owner only; mirrors web entityAvatar). */
export async function uploadGroupAvatar(
  conversationId: string,
  image: PickedImage
): Promise<{ url?: string; error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const path = `groups/${conversationId}/avatar.${extForMime(image.mimeType)}`;
  const result = await uploadAvatarImage(path, image);
  if (result.error || !result.url) return result;

  const { error } = await supabase
    .from("conversations")
    .update({ avatar_url: result.url, updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  if (error) return { error: error.message };
  return { url: result.url };
}

export async function removeGroupAvatar(conversationId: string): Promise<{ error?: string }> {
  const prefix = `groups/${conversationId}`;
  const { data: files, error: listError } = await supabase.storage.from(AVATAR_BUCKET).list(prefix);
  if (listError) return { error: listError.message };

  const paths = (files ?? [])
    .filter((file) => file.name.startsWith("avatar."))
    .map((file) => `${prefix}/${file.name}`);

  if (paths.length > 0) {
    const { error: removeError } = await supabase.storage.from(AVATAR_BUCKET).remove(paths);
    if (removeError) return { error: removeError.message };
  }

  const { error } = await supabase
    .from("conversations")
    .update({ avatar_url: null, updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  if (error) return { error: error.message };
  return {};
}

/** Upload the signed-in user's profile avatar. */
export async function uploadProfileAvatar(
  image: PickedImage
): Promise<{ url?: string; error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const path = `${user.id}/avatar.${extForMime(image.mimeType)}`;
  const result = await uploadAvatarImage(path, image);
  if (result.error || !result.url) return result;

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: result.url, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { error: error.message };
  return { url: result.url };
}

export async function removeProfileAvatar(): Promise<{ error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: files, error: listError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .list(user.id);

  if (listError) return { error: listError.message };

  const paths = (files ?? [])
    .filter((file) => file.name.startsWith("avatar."))
    .map((file) => `${user.id}/${file.name}`);

  if (paths.length > 0) {
    const { error: removeError } = await supabase.storage.from(AVATAR_BUCKET).remove(paths);
    if (removeError) return { error: removeError.message };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { error: error.message };
  return {};
}

/** Upload a book club avatar (owner only; stored in book_clubs.image_url). */
export async function uploadClubAvatar(
  clubId: string,
  image: PickedImage
): Promise<{ url?: string; error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const path = `clubs/${clubId}/avatar.${extForMime(image.mimeType)}`;
  const result = await uploadAvatarImage(path, image);
  if (result.error || !result.url) return result;

  const { error } = await supabase
    .from("book_clubs")
    .update({ image_url: result.url, updated_at: new Date().toISOString() })
    .eq("id", clubId);

  if (error) return { error: error.message };
  return { url: result.url };
}

export async function removeClubAvatar(clubId: string): Promise<{ error?: string }> {
  const prefix = `clubs/${clubId}`;
  const { data: files, error: listError } = await supabase.storage.from(AVATAR_BUCKET).list(prefix);
  if (listError) return { error: listError.message };

  const paths = (files ?? [])
    .filter((file) => file.name.startsWith("avatar."))
    .map((file) => `${prefix}/${file.name}`);

  if (paths.length > 0) {
    const { error: removeError } = await supabase.storage.from(AVATAR_BUCKET).remove(paths);
    if (removeError) return { error: removeError.message };
  }

  const { error } = await supabase
    .from("book_clubs")
    .update({ image_url: null, updated_at: new Date().toISOString() })
    .eq("id", clubId);

  if (error) return { error: error.message };
  return {};
}
