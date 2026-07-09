"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { saveProfile, type AuthActionState } from "@/lib/auth/actions";
import { staticRedirect } from "@/lib/navigation/staticRedirect";
import { getProfile } from "@/lib/services/profile";
import { createClient } from "@/lib/supabase/client";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { PREFERRED_LANGUAGES } from "@/lib/constants/languages";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import type { Profile } from "@/types";

const initial: AuthActionState = {};

export function ProfileSetupForm() {
  const [state, formAction, pending] = useActionState(saveProfile, initial);
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setProfile(null);
        return;
      }
      void getProfile(user.id).then((loaded) => {
        setProfile(loaded);
        setUserId(user.id);
      });
    });
  }, []);

  useEffect(() => {
    if (state.redirect) staticRedirect(state.redirect);
  }, [state.redirect]);

  if (profile === undefined) {
    return <LoadingState message="Loading profile…" />;
  }

  const isEditing = Boolean(profile?.username?.trim());
  const genresValue = profile?.favorite_genres?.join(", ") ?? "";

  return (
    <form action={formAction} className="w-full max-w-lg">
      {userId && profile ? (
        <AvatarUpload
          userId={userId}
          profile={profile}
          onAvatarChange={(avatarUrl) =>
            setProfile((current) => (current ? { ...current, avatar_url: avatarUrl } : current))
          }
          className="mb-6"
        />
      ) : null}
      <input
        type="hidden"
        name="redirect"
        value={isEditing ? "/profile" : "/dashboard"}
      />
      <Input
        label="Username"
        name="username"
        autoComplete="username"
        required
        defaultValue={profile?.username ?? ""}
      />
      <Input
        label="Display name"
        name="display_name"
        autoComplete="name"
        defaultValue={profile?.display_name ?? ""}
      />
      <Textarea
        label="Bio"
        name="bio"
        placeholder="A few words about your reading taste…"
        defaultValue={profile?.bio ?? ""}
      />
      <Input
        label="Favorite genres"
        name="favorite_genres"
        placeholder="fiction, fantasy, memoir"
        defaultValue={genresValue}
      />
      <p className="-mt-2 mb-4 text-xs text-text-muted">Separate genres with commas.</p>
      <div className="mb-4">
        <label htmlFor="preferred_language" className="mb-1.5 block text-sm font-medium text-text">
          Preferred language
        </label>
        <select
          id="preferred_language"
          name="preferred_language"
          defaultValue={profile?.preferred_language ?? "en"}
          className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {PREFERRED_LANGUAGES.map(({ code, label }) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-text-muted">UI translation coming soon.</p>
      </div>
      {state.error ? (
        <p className="mb-4 text-sm text-rust" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" variant="primary" className="flex-1" loading={pending}>
          {isEditing ? "Save changes" : "Save and continue"}
        </Button>
        {isEditing ? (
          <Link
            href="/profile"
            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-lg border-2 border-border px-4 text-center text-sm font-semibold text-puce-red hover:bg-primary/10"
          >
            Cancel
          </Link>
        ) : null}
      </div>
    </form>
  );
}
