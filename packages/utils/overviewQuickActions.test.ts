import { describe, expect, it } from "vitest";
import { OVERVIEW_QUICK_ACTIONS } from "./overviewCopy";
import {
  BOOKMARKED_PURPLE,
  OVERVIEW_QUICK_ACTION_COLORS,
  OVERVIEW_QUICK_ACTION_EVENTS,
  OVERVIEW_QUICK_ACTION_FOURTH_SLOT,
  OVERVIEW_QUICK_ACTIONS_LIST,
  contrastRatio,
  quickActionContrastText,
} from "./overviewQuickActions";

describe("overviewQuickActions", () => {
  it("ships the three required Title Case actions and no removed ones", () => {
    expect(OVERVIEW_QUICK_ACTIONS_LIST.map((action) => action.id)).toEqual([
      "openLibrary",
      "bookClubs",
      "readingChallenges",
    ]);
    expect(OVERVIEW_QUICK_ACTIONS_LIST.map((action) => action.label)).toEqual([
      "Open Library",
      "Book Clubs",
      "Reading Challenges",
    ]);
    expect(OVERVIEW_QUICK_ACTIONS).not.toHaveProperty("searchBooks");
    expect(OVERVIEW_QUICK_ACTIONS).not.toHaveProperty("continueReading");
    expect(OVERVIEW_QUICK_ACTIONS).not.toHaveProperty("trail");
  });

  it("maps approved fills, official purple, and landing routes", () => {
    expect(BOOKMARKED_PURPLE).toBe("#B89DBB");
    expect(OVERVIEW_QUICK_ACTION_COLORS.openLibrary).toBe("#e7a4a6");
    expect(OVERVIEW_QUICK_ACTION_COLORS.bookClubs).toBe("#eb9f8e");
    expect(OVERVIEW_QUICK_ACTION_COLORS.readingChallenges).toBe(BOOKMARKED_PURPLE);
    expect(OVERVIEW_QUICK_ACTION_COLORS.reservedFourth).toBe("#d18dbe");

    const byId = Object.fromEntries(OVERVIEW_QUICK_ACTIONS_LIST.map((action) => [action.id, action]));
    expect(byId.openLibrary?.webHref).toBe("/library/");
    expect(byId.openLibrary?.mobileHref).toBe("/library");
    expect(byId.bookClubs?.webHref).toBe("/clubs/");
    expect(byId.bookClubs?.mobileHref).toBe("/clubs");
    expect(byId.readingChallenges?.webHref).toBe("/challenges/");
    expect(byId.readingChallenges?.mobileHref).toBe("/challenges");
  });

  it("uses QA analytics names and keeps the fourth slot empty", () => {
    expect(OVERVIEW_QUICK_ACTION_EVENTS.openLibrary).toBe("quick_action_open_library");
    expect(OVERVIEW_QUICK_ACTION_EVENTS.bookClubs).toBe("quick_action_book_clubs");
    expect(OVERVIEW_QUICK_ACTION_EVENTS.readingChallenges).toBe("quick_action_reading_challenges");
    expect(OVERVIEW_QUICK_ACTION_EVENTS).not.toHaveProperty("searchBooks");
    expect(OVERVIEW_QUICK_ACTION_EVENTS).not.toHaveProperty("continueReading");
    expect(OVERVIEW_QUICK_ACTION_EVENTS).not.toHaveProperty("trail");
    expect(OVERVIEW_QUICK_ACTION_FOURTH_SLOT).toBeNull();
  });

  it("picks text that meets 4.5:1 contrast on each shipped fill", () => {
    for (const action of OVERVIEW_QUICK_ACTIONS_LIST) {
      expect(action.textColor).toBe(quickActionContrastText(action.color));
      expect(contrastRatio(action.textColor, action.color)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
