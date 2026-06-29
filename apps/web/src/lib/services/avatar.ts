import { createClient } from "@/lib/supabase/client";

const AVATAR_BUCKET = "avatars";
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

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

function avatarObjectPath(userId: string, mime: string): string {
  return `${userId}/avatar.${extensionForMime(mime)}`;
}

export function validateAvatarFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return "Please choose a JPEG, PNG, WebP, or GIF image.";
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return "Image must be 5 MB or smaller.";
  }
  return null;
}

export async function uploadAvatar(
  userId: string,
  file: File
): Promise<{ url?: string; error?: string }> {
  const validationError = validateAvatarFile(file);
  if (validationError) return { error: validationError };

  const supabase = createClient();
  const path = avatarObjectPath(userId, file.type);

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { error: uploadError.message };

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  const url = `${data.publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: url })
    .eq("id", userId);

  if (updateError) return { error: updateError.message };

  return { url };
}

export async function removeAvatar(userId: string): Promise<{ error?: string }> {
  const supabase = createClient();

  const { data: files, error: listError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .list(userId);

  if (listError) return { error: listError.message };

  const avatarFiles = (files ?? [])
    .filter((file) => file.name.startsWith("avatar."))
    .map((file) => `${userId}/${file.name}`);

  if (avatarFiles.length > 0) {
    const { error: removeError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .remove(avatarFiles);

    if (removeError) return { error: removeError.message };
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", userId);

  if (updateError) return { error: updateError.message };

  return {};
}
