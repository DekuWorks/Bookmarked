import { describe, expect, it } from "vitest";
import {
  CLUB_POLL_MULTI_SELECT_DEFAULT,
  pollIsOpen,
  tallyClubPollVotes,
  validateClubPollDraft,
  validateClubPollVote,
} from "./clubPolls";

describe("club polls", () => {
  it("defaults to one vote and validates choices", () => {
    expect(CLUB_POLL_MULTI_SELECT_DEFAULT).toBe(false);
    expect(
      validateClubPollDraft({
        question: "Next pick?",
        choices: [
          { label: "Book A", sortOrder: 0 },
          { label: "Book B", sortOrder: 1 },
        ],
      }).ok
    ).toBe(true);
    expect(
      validateClubPollDraft({
        question: "Next pick?",
        choices: [{ label: "Only one", sortOrder: 0 }],
      }).ok
    ).toBe(false);
  });

  it("tallies percents and the viewer's vote", () => {
    const tallies = tallyClubPollVotes({
      choices: [
        { id: "a", label: "A" },
        { id: "b", label: "B" },
      ],
      votes: [
        { choiceId: "a", userId: "u1" },
        { choiceId: "a", userId: "u2" },
        { choiceId: "b", userId: "u3" },
      ],
      viewerId: "u1",
    });
    expect(tallies[0]).toMatchObject({ votes: 2, percent: 66.7, selectedByViewer: true });
    expect(tallies[1]).toMatchObject({ votes: 1, percent: 33.3, selectedByViewer: false });
  });

  it("closes after the optional close time", () => {
    expect(pollIsOpen("2026-01-01T00:00:00.000Z", Date.parse("2026-02-01"))).toBe(false);
    expect(pollIsOpen(null, Date.parse("2026-02-01"))).toBe(true);
  });

  it("enforces single-select unless the creator opted in", () => {
    expect(
      validateClubPollVote({ allowMultiple: false, choiceIds: ["a", "b"] }).ok
    ).toBe(false);
    expect(
      validateClubPollVote({ allowMultiple: true, choiceIds: ["a", "b"] })
    ).toMatchObject({ ok: true, choiceIds: ["a", "b"] });
    expect(validateClubPollVote({ allowMultiple: true, choiceIds: [] }).ok).toBe(false);
  });
});
