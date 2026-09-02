import { describe, expect, it } from "vitest";
import {
  CURRENTLY_READING_ADD_COPY,
  OVERVIEW_QUICK_ACTIONS,
  OVERVIEW_SECTION_TITLES,
} from "@bookmarked/utils/overviewCopy";
import {
  currentlyReadingAddClearedSearchParams,
  currentlyReadingAddReturnHref,
  currentlyReadingAddSearchClearPath,
  currentlyReadingAddSearchHref,
  isCurrentlyReadingAddFromOverview,
} from "@bookmarked/utils/currentlyReadingAdd";

describe("overview copy (web)", () => {
  it("uses the shared Title Case Overview labels", () => {
    expect(OVERVIEW_SECTION_TITLES.currentlyReading).toBe("Currently Reading");
    expect(OVERVIEW_SECTION_TITLES.recentlyFinished).toBe("Recently Finished");
    expect(OVERVIEW_SECTION_TITLES.quickActions).toBe("Quick Actions");
    expect(OVERVIEW_SECTION_TITLES.recentActivity).toBe("Recent Activity");
    expect(OVERVIEW_QUICK_ACTIONS.openLibrary).toBe("Open Library");
    expect(OVERVIEW_QUICK_ACTIONS.bookClubs).toBe("Book Clubs");
    expect(OVERVIEW_QUICK_ACTIONS.readingChallenges).toBe("Reading Challenges");
    expect(OVERVIEW_QUICK_ACTIONS).not.toHaveProperty("searchBooks");
    expect(OVERVIEW_QUICK_ACTIONS).not.toHaveProperty("continueReading");
    expect(OVERVIEW_QUICK_ACTIONS).not.toHaveProperty("trail");
    expect(CURRENTLY_READING_ADD_COPY.chooseFromTbr).toBe("Choose from TBR");
  });

  it("routes Overview Add Book search back to the Reading Room", () => {
    expect(currentlyReadingAddSearchHref()).toContain("origin=home_overview_currently_reading");
    expect(currentlyReadingAddReturnHref()).toBe("/reading-room/");
    expect(isCurrentlyReadingAddFromOverview({ origin: "library" })).toBe(false);
  });

  it("treats a cleared Search URL as normal Search, not Overview add mode", () => {
    expect(isCurrentlyReadingAddFromOverview(currentlyReadingAddClearedSearchParams())).toBe(false);
    expect(currentlyReadingAddSearchClearPath()).toBe("/search");
  });
});
