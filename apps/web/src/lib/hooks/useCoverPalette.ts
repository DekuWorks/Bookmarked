"use client";

import { useEffect, useState } from "react";
import { useThemePreference } from "@/components/theme/ThemeProvider";
import { extractCoverPalette, type CoverPalette } from "@/lib/utils/coverColor";
import { resolveCoverDisplayUrl } from "@bookmarked/utils/mediaDisplayUrl";

export function useCoverPalette(coverUrl: string | null | undefined) {
  const { resolved } = useThemePreference();
  const [palette, setPalette] = useState<CoverPalette | null>(null);

  useEffect(() => {
    if (!coverUrl) {
      setPalette(null);
      return;
    }

    let cancelled = false;
    const sampleUrl = resolveCoverDisplayUrl(coverUrl, "thumb") ?? coverUrl;
    void extractCoverPalette(sampleUrl).then((result) => {
      if (!cancelled) setPalette(result);
    });

    return () => {
      cancelled = true;
    };
  }, [coverUrl, resolved]);

  return palette;
}
