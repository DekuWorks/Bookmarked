"use client";

import { useEffect, useState } from "react";
import { useThemePreference } from "@/components/theme/ThemeProvider";
import { extractCoverPalette, type CoverPalette } from "@/lib/utils/coverColor";

export function useCoverPalette(coverUrl: string | null | undefined) {
  const { resolved } = useThemePreference();
  const [palette, setPalette] = useState<CoverPalette | null>(null);

  useEffect(() => {
    if (!coverUrl) {
      setPalette(null);
      return;
    }

    let cancelled = false;
    void extractCoverPalette(coverUrl).then((result) => {
      if (!cancelled) setPalette(result);
    });

    return () => {
      cancelled = true;
    };
  }, [coverUrl, resolved]);

  return palette;
}
