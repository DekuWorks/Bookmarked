import type { MessageProfile } from "@/types";

type ProfileNameFields = Pick<MessageProfile, "display_name" | "username">;

export function profileDisplayName(profile: ProfileNameFields | null | undefined): string {
  return profile?.display_name?.trim() || profile?.username?.trim() || "Reader";
}

export function profileInitials(profile: ProfileNameFields): string {
  const name = profileDisplayName(profile);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
