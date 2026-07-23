"use client";

import { useState } from "react";
import { createPost } from "@/lib/services/posts";
import { bookDetailsPath } from "@/lib/routes/book";
import { absoluteAppUrl } from "@/lib/utils/copyLink";
import type { UserReviewWithBook } from "@/lib/services/readingRoom";
import { buildReviewSharePostBody } from "@bookmarked/utils/readingRoomReviews";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

type Props = {
  review: UserReviewWithBook;
};

export function ShareReviewButton({ review }: Props) {
  const toast = useToast();
  const [sharing, setSharing] = useState(false);
  const book = review.books;

  if (!book?.id) return null;

  async function handleShare() {
    setSharing(true);
    try {
      const body = buildReviewSharePostBody({
        title: book!.title,
        author: book!.author,
        rating: review.rating,
        reviewBody: review.review_body,
        feelings: review.feelings,
        hasSpoilers: review.has_spoilers,
        bookUrl: absoluteAppUrl(bookDetailsPath(book!.id)),
      });

      const result = await createPost({ body, bookId: book!.id });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Review shared to your feed.");
    } catch {
      toast.error("Could not share this review.");
    } finally {
      setSharing(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      loading={sharing}
      onClick={() => void handleShare()}
      aria-label={`Share review of ${book.title}`}
    >
      Share review
    </Button>
  );
}
