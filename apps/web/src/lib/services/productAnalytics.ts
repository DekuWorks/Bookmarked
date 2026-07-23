/**
 * Lightweight product analytics hooks for reading-completion flows.
 * Wire to your analytics provider here when ready.
 */

export type ProductAnalyticsEvent =
  | "reading_completed"
  | "reading_completed_missing_page_count"
  | "reading_page_count_entered"
  | "reading_completed_with_manual_page_count";

type EventPayload = Record<string, string | number | boolean | null | undefined>;

export function trackProductEvent(event: ProductAnalyticsEvent, payload: EventPayload = {}): void {
  if (process.env.NODE_ENV === "development") {
    console.debug("[analytics]", event, payload);
  }
}

export function trackReadingCompleted(payload: {
  source: string;
  bookId: string;
  pageCountStatus: string;
  pageCountSource: string;
  pagesRead: number | null;
}): void {
  const event: ProductAnalyticsEvent =
    payload.pageCountStatus === "missing"
      ? "reading_completed_missing_page_count"
      : payload.pageCountSource === "user"
        ? "reading_completed_with_manual_page_count"
        : "reading_completed";

  trackProductEvent(event, {
    source: payload.source,
    book_id: payload.bookId,
    page_count_status: payload.pageCountStatus,
    page_count_source: payload.pageCountSource,
    pages_read: payload.pagesRead,
  });
}

export function trackPageCountEntered(payload: { bookId: string; pages: number }): void {
  trackProductEvent("reading_page_count_entered", {
    book_id: payload.bookId,
    pages: payload.pages,
  });
}
