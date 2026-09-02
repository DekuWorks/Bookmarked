/**
 * Lightweight product analytics hook — mirrors web `productAnalytics`.
 * Wire to the shared provider here when ready. Do not add a second platform.
 */

import type { CurrentlyReadingAddEvent } from "../../../../packages/utils/currentlyReadingAdd";

export type ProductAnalyticsEvent =
  | "reading_completed"
  | "reading_completed_missing_page_count"
  | "reading_page_count_entered"
  | "reading_completed_with_manual_page_count"
  | CurrentlyReadingAddEvent;

type EventPayload = Record<string, string | number | boolean | null | undefined>;

export function trackProductEvent(event: ProductAnalyticsEvent, payload: EventPayload = {}): void {
  if (__DEV__) {
    console.debug("[analytics]", event, payload);
  }
}
