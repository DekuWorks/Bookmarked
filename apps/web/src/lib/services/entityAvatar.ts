import { createClient } from "@/lib/supabase/client";
import { validateAvatarFile } from "@/lib/services/avatar";

const AVATAR_BUCKET = "avatars";

function extensionForMime(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
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

function groupAvatarPath(conversationId: string, mime: string): string {
  return `groups/${conversationId}/avatar.${extensionForMime(mime)}`;
}

function clubAvatarPath(clubId: string, mime: string): string {
  return `clubs/${clubId}/avatar.${extensionForMime(mime)}`;
}

function challengeCoverPath(mime: string): string {
  const stamp = Date.now();
  return `challenges/covers/${stamp}.${extensionForMime(mime)}`;
}

export async function uploadChallengeCover(
  file: File
): Promise<{ url?: string; error?: string }> {
  return uploadEntityAvatar(challengeCoverPath(file.type), file);
}

async function uploadEntityAvatar(
  path: string,
  file: File
): Promise<{ url?: string; error?: string }> {
  const validationError = validateAvatarFile(file);
  if (validationError) return { error: validationError };

  const supabase = createClient();
  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { error: uploadError.message };

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return { url: `${data.publicUrl}?v=${Date.now()}` };
}

export async function uploadGroupAvatar(
  conversationId: string,
  file: File
): Promise<{ url?: string; error?: string }> {
  const path = groupAvatarPath(conversationId, file.type);
  const result = await uploadEntityAvatar(path, file);
  if (result.error || !result.url) return result;

  const supabase = createClient();
  const { error } = await supabase
    .from("conversations")
    .update({ avatar_url: result.url, updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  if (error) return { error: error.message };
  return { url: result.url };
}

export async function removeGroupAvatar(
  conversationId: string
): Promise<{ error?: string }> {
  const supabase = createClient();
  const prefix = `groups/${conversationId}`;

  const { data: files, error: listError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .list(`groups/${conversationId}`);

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

export async function uploadClubAvatar(
  clubId: string,
  file: File
): Promise<{ url?: string; error?: string }> {
  const path = clubAvatarPath(clubId, file.type);
  const result = await uploadEntityAvatar(path, file);
  if (result.error || !result.url) return result;

  const supabase = createClient();
  const { error } = await supabase
    .from("book_clubs")
    .update({ image_url: result.url, updated_at: new Date().toISOString() })
    .eq("id", clubId);

  if (error) return { error: error.message };
  return { url: result.url };
}

export async function removeClubAvatar(clubId: string): Promise<{ error?: string }> {
  const supabase = createClient();
  const prefix = `clubs/${clubId}`;

  const { data: files, error: listError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .list(prefix);

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
