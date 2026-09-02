"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { trackProductEvent } from "@/lib/services/productAnalytics";
import {
  CURRENTLY_READING_ADD_EVENTS,
  currentlyReadingAddReturnHref,
  isCurrentlyReadingAddFromOverview,
} from "@bookmarked/utils/currentlyReadingAdd";
import { CURRENTLY_READING_ADD_COPY } from "@bookmarked/utils/overviewCopy";

export function CurrentlyReadingAddBanner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (!isCurrentlyReadingAddFromOverview({ origin: searchParams.get("origin") })) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3">
      <p className="text-sm text-text">{CURRENTLY_READING_ADD_COPY.addingBanner}</p>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          trackProductEvent(CURRENTLY_READING_ADD_EVENTS.canceled);
          router.replace(currentlyReadingAddReturnHref());
        }}
      >
        Cancel
      </Button>
    </div>
  );
}
