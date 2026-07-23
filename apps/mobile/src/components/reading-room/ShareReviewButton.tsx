import { useState } from "react";
import { Alert, Pressable, Text } from "react-native";
import { createPost } from "../../services/posts";
import type { UserReviewWithBook } from "../../services/readingRoom";
import { buildReviewSharePostBody } from "../../../../../packages/utils/readingRoomReviews";

const BOOK_URL_BASE = "https://bookmarked.online/book/?id=";

type Props = {
  review: UserReviewWithBook;
};

export function ShareReviewButton({ review }: Props) {
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
        bookUrl: `${BOOK_URL_BASE}${encodeURIComponent(book!.id)}`,
      });

      const result = await createPost({ body, bookId: book!.id });
      if (result.error) {
        Alert.alert("Could not share", result.error);
        return;
      }
      Alert.alert("Shared", "Your review was posted to your feed.");
    } catch {
      Alert.alert("Could not share", "Please try again in a moment.");
    } finally {
      setSharing(false);
    }
  }

  return (
    <Pressable
      onPress={() => void handleShare()}
      disabled={sharing}
      accessibilityRole="button"
      accessibilityLabel={`Share review of ${book.title}`}
      className={`rounded-full border border-brand-border bg-background px-3 py-1.5 active:opacity-80 ${
        sharing ? "opacity-60" : ""
      }`}
    >
      <Text className="text-xs font-semibold text-primary-dark">
        {sharing ? "Sharing…" : "Share review"}
      </Text>
    </Pressable>
  );
}
