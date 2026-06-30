"use client";

import { useEffect, useState } from "react";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { getProfile } from "@/lib/services/profile";
import { preferredLanguageToOpenLibrary } from "@/lib/utils/searchLanguage";

/** Open Library language code from the signed-in user's profile preference. */
export function usePreferredOpenLibraryLanguage(): string | undefined {
  const user = useAuthUser();
  const [language, setLanguage] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (user === undefined) return;

    if (!user) {
      setLanguage(undefined);
      return;
    }

    let cancelled = false;

    void getProfile(user.id)
      .then((profile) => {
        if (cancelled) return;
        setLanguage(preferredLanguageToOpenLibrary(profile?.preferred_language));
      })
      .catch(() => {
        if (!cancelled) setLanguage(undefined);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  return language;
}
