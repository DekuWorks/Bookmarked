"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProfileSetupForm } from "@/components/auth/ProfileSetupForm";
import { createClient } from "@/lib/supabase/client";
import { getProfile } from "@/lib/services/profile";
import { LoadingState } from "@/components/ui/LoadingState";
import { layout } from "@/lib/constants/layout";

export default function ProfileSetupPage() {
  const [isEditing, setIsEditing] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setIsEditing(false);
        return;
      }
      void getProfile(user.id).then((profile) => {
        setIsEditing(Boolean(profile?.username?.trim()));
      });
    });
  }, []);

  if (isEditing === null) {
    return <LoadingState message="Loading…" />;
  }

  return (
    <div className={`${layout.pageStack} max-w-lg`}>
      {isEditing ? (
        <Link href="/profile" className="inline-block text-sm font-medium text-primary hover:underline">
          ← Back to profile
        </Link>
      ) : null}
      <h1 className="mt-2 text-3xl font-bold text-puce-red sm:text-4xl">
        {isEditing ? "Edit your profile" : "Set up your profile"}
      </h1>
      <p className="mx-auto mt-2 max-w-md text-pretty text-text-muted">
        {isEditing
          ? "Update how you appear to other readers on Bookmarked."
          : "Tell other readers a bit about you. You can change this anytime."}
      </p>
      <div className="mx-auto mt-8 max-w-md text-left">
        <ProfileSetupForm />
      </div>
    </div>
  );
}
