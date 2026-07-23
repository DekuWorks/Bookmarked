"use client";

import { useId, useRef, useState } from "react";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { removeAvatar, uploadAvatar } from "@/lib/services/avatar";
import { cn } from "@/lib/utils/cn";
import type { Profile } from "@/types";

type Props = {
  userId: string;
  profile: Pick<Profile, "display_name" | "username" | "avatar_url">;
  onAvatarChange?: (avatarUrl: string | null) => void;
  className?: string;
};

export function AvatarUpload({ userId, profile, onAvatarChange, className }: Props) {
  const toast = useToast();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayProfile = { ...profile, avatar_url: avatarUrl };

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    setUploading(true);

    const result = await uploadAvatar(userId, file);
    setUploading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setAvatarUrl(result.url ?? null);
    onAvatarChange?.(result.url ?? null);
    toast.success("Saved");
  }

  async function handleRemove() {
    setError(null);
    setRemoving(true);

    const result = await removeAvatar(userId);
    setRemoving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setAvatarUrl(null);
    onAvatarChange?.(null);
    toast.success("Saved");
  }

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <ProfileAvatar profile={displayProfile} size="xl" />

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        disabled={uploading || removing}
        onChange={(event) => void handleFileChange(event)}
      />

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          loading={uploading}
          disabled={removing}
          onClick={() => inputRef.current?.click()}
        >
          {avatarUrl ? "Change photo" : "Upload photo"}
        </Button>
        {avatarUrl ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            loading={removing}
            disabled={uploading}
            onClick={() => void handleRemove()}
          >
            Remove
          </Button>
        ) : null}
      </div>

      <p className="max-w-xs text-center text-xs text-text-muted">
        JPEG, PNG, WebP, or GIF. Max 5 MB.
      </p>

      {error ? (
        <p className="text-center text-sm text-rust" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
