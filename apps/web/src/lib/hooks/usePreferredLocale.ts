"use client";

import { useEffect, useState } from "react";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { getProfile } from "@/lib/services/profile";
import { getBrowserLocale, localeFromLanguage } from "@/lib/utils/locale";

/** Locale for date/number formatting from profile or browser. */
export function usePreferredLocale(): string {
  const user = useAuthUser();
  const [locale, setLocale] = useState(getBrowserLocale);

  useEffect(() => {
    if (user === undefined) return;

    if (!user) {
      setLocale(getBrowserLocale());
      return;
    }

    let cancelled = false;

    void getProfile(user.id)
      .then((profile) => {
        if (cancelled) return;
        setLocale(localeFromLanguage(profile?.preferred_language));
      })
      .catch(() => {
        if (!cancelled) setLocale(getBrowserLocale());
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  return locale;
}
