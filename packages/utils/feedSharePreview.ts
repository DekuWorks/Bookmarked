import type { FeedSourceType } from "./feedShare";

/** Shared Share-to-Feed preview model for web + iOS. */
export type FeedSharePreview = {
  sourceType: FeedSourceType;
  sourceId: string;
  bookId?: string | null;
  bookTitle?: string | null;
  bookCoverUrl?: string | null;
  rating?: number | null;
  body: string;
};

export function withOptionalCaption(body: string, caption?: string | null): string {
  const captionText = caption?.trim() ?? "";
  if (!captionText) return body;
  return `${captionText}\n\n${body}`;
}
