import { describe, expect, it } from "vitest";
import {
  NOTIFIABLE_SOCIAL_EVENTS,
  isNotifiableSocialEvent,
  shouldCreateStandardNotification,
} from "./notifiableEvents";

describe("notifiable events", () => {
  it("allows only social standard notifications", () => {
    expect([...NOTIFIABLE_SOCIAL_EVENTS]).toEqual([
      "message",
      "follow",
      "post_like",
      "post_comment",
      "post_comment_reply",
      "post_published",
      "challenge_invitation",
      "challenge_accepted",
      "challenge_completed",
      "challenge_community_milestone",
    ]);
    expect(isNotifiableSocialEvent("message")).toBe(true);
    expect(isNotifiableSocialEvent("post_like")).toBe(true);
    expect(isNotifiableSocialEvent("post_comment")).toBe(true);
    expect(isNotifiableSocialEvent("follow")).toBe(true);
    expect(isNotifiableSocialEvent("post_published")).toBe(true);
  });

  it("rejects review, shelf, start, finish, and progress notifications", () => {
    for (const kind of [
      "review_created",
      "review_reaction",
      "review_reply",
      "shelf_updated",
      "book_added",
      "reading_started",
      "book_finished",
      "progress_updated",
      "mention",
    ]) {
      expect(shouldCreateStandardNotification({ type: "feed", notificationKind: kind })).toBe(
        false
      );
    }
  });

  it("keeps club notifications and maps message/follow types", () => {
    expect(shouldCreateStandardNotification({ type: "club" })).toBe(true);
    expect(shouldCreateStandardNotification({ type: "challenge" })).toBe(true);
    expect(shouldCreateStandardNotification({ type: "message" })).toBe(true);
    expect(shouldCreateStandardNotification({ type: "follow" })).toBe(true);
  });
});
