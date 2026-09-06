import { describe, expect, it } from "vitest";
import {
  audiobookScheduleLabel,
  buildCompanionSystemPrompt,
  companionSafetyFor,
  endingExplanationBlocked,
} from "./aiCompanionSafety";

describe("AI companion safety", () => {
  it("blocks ending explanations until the reader confirms they are not finished", () => {
    expect(endingExplanationBlocked({ shelfStatus: "currently_reading", progressPercent: 40 }, false)).toBe(
      true
    );
    expect(endingExplanationBlocked({ shelfStatus: "read" }, false)).toBe(false);
    expect(
      endingExplanationBlocked({ shelfStatus: "currently_reading", progressPercent: 90 }, true)
    ).toBe(false);
  });

  it("keeps spoilers off for unfinished discussion prompts", () => {
    const safety = companionSafetyFor("discussion_questions", {
      shelfStatus: "currently_reading",
      progressPercent: 20,
    });
    expect(safety.allowSpoilers).toBe(false);
    const prompt = buildCompanionSystemPrompt({
      action: "discussion_questions",
      safety,
      bookTitle: "The Secret History",
      format: "book",
    });
    expect(prompt).toMatch(/Do not spoil/);
  });

  it("uses HH:MM listening for audiobook schedules", () => {
    expect(audiobookScheduleLabel(3600 * 10, 5)).toBe("02:00 listening / day");
    const prompt = buildCompanionSystemPrompt({
      action: "reading_schedule",
      safety: companionSafetyFor("reading_schedule", { finished: true }),
      bookTitle: "Project Hail Mary",
      format: "audiobook",
    });
    expect(prompt).toMatch(/HH:MM/);
    expect(prompt).not.toMatch(/pages/);
  });
});
