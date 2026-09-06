import { describe, expect, it } from "vitest";
import { shouldCreateStandardNotification } from "../../../../packages/utils/notifiableEvents";
import { collectStreakDateKeys, sessionQualifiesForStreak } from "../../../../packages/utils/readingStreak";
import { shouldPromptReviewShareToFeed } from "../../../../packages/utils/reviewSharePrompt";
import { isQuoteTitleRequired, noteContentIsValid } from "../../../../packages/utils/quoteTitle";
import { rememberedEmailStorageValue } from "../../../../packages/utils/rememberMeEmail";

describe("thirteenth sprint polish", () => {
  it("notifies only social events", () => {
    expect(shouldCreateStandardNotification({ type: "follow" })).toBe(true);
    expect(
      shouldCreateStandardNotification({ type: "feed", notificationKind: "book_finished" })
    ).toBe(false);
  });

  it("counts streaks on session_date with real reading only", () => {
    expect(
      sessionQualifiesForStreak({ session_date: "2026-09-04", pages_read: 10, activity_kind: "session" })
    ).toBe(true);
    expect(
      sessionQualifiesForStreak({ session_date: "2026-09-04", pages_read: 10, activity_kind: "import" })
    ).toBe(false);
    expect(
      collectStreakDateKeys([
        {
          session_date: "2026-09-01",
          created_at: "2026-09-06T00:00:00.000Z",
          pages_read: 8,
        },
      ])
    ).toEqual(["2026-09-01"]);
  });

  it("does not store a password for remember-me and does not require quote titles", () => {
    expect(rememberedEmailStorageValue({ rememberMe: true, email: "a@b.com" })).toBe("a@b.com");
    expect(rememberedEmailStorageValue({ rememberMe: false, email: "a@b.com" })).toBeNull();
    expect(isQuoteTitleRequired()).toBe(false);
    expect(noteContentIsValid({ quote: "hi", title: "" })).toBe(true);
  });

  it("prompts share-to-feed for public reviews only", () => {
    expect(shouldPromptReviewShareToFeed({ visibility: "public", isNewPublish: true })).toBe(true);
    expect(shouldPromptReviewShareToFeed({ visibility: "private", isNewPublish: true })).toBe(false);
  });
});
