import { describe, expect, it, vi } from "vitest";
import {
  CURRENTLY_READING_ADD_COPY,
  OVERVIEW_QUICK_ACTIONS,
  OVERVIEW_SECTION_TITLES,
} from "../../../../packages/utils/overviewCopy";
import {
  HOME_OVERVIEW_CURRENTLY_READING_ORIGIN,
  currentlyReadingAddClearedSearchParams,
  currentlyReadingAddMobileReturnPath,
  currentlyReadingAddSearchClearPath,
  currentlyReadingAddSearchPath,
  isCurrentlyReadingAddFromOverview,
  leaveCurrentlyReadingAddSearch,
} from "../../../../packages/utils/currentlyReadingAdd";

describe("overview copy (iOS)", () => {
  it("matches the shared Title Case Overview labels", () => {
    expect(OVERVIEW_SECTION_TITLES.currentlyReading).toBe("Currently Reading");
    expect(OVERVIEW_SECTION_TITLES.recentActivity).toBe("Recent Activity");
    expect(OVERVIEW_QUICK_ACTIONS.openLibrary).toBe("Open Library");
    expect(OVERVIEW_QUICK_ACTIONS.bookClubs).toBe("Book Clubs");
    expect(OVERVIEW_QUICK_ACTIONS.readingChallenges).toBe("Reading Challenges");
    expect(OVERVIEW_QUICK_ACTIONS).not.toHaveProperty("searchBooks");
    expect(OVERVIEW_QUICK_ACTIONS).not.toHaveProperty("continueReading");
    expect(OVERVIEW_QUICK_ACTIONS).not.toHaveProperty("trail");
    expect(CURRENTLY_READING_ADD_COPY.cardLabel).toBe("Add Book to Currently Reading");
  });

  it("uses the shared Add Book search origin", () => {
    expect(
      isCurrentlyReadingAddFromOverview({ origin: HOME_OVERVIEW_CURRENTLY_READING_ORIGIN })
    ).toBe(true);
    expect(currentlyReadingAddSearchPath()).toContain(HOME_OVERVIEW_CURRENTLY_READING_ORIGIN);
  });

  it("clears Search origin before returning Home so the tab is not left in add mode", () => {
    expect(isCurrentlyReadingAddFromOverview(currentlyReadingAddClearedSearchParams())).toBe(false);
    expect(currentlyReadingAddSearchClearPath()).toBe("/search");
    expect(currentlyReadingAddMobileReturnPath()).toBe("/");

    const setParams = vi.fn();
    const replace = vi.fn();
    leaveCurrentlyReadingAddSearch({ setParams, replace });
    expect(setParams).toHaveBeenCalledWith({ origin: undefined, shelf: undefined });
    expect(replace).toHaveBeenCalledWith("/");
  });
});
