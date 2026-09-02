import { describe, expect, it } from "vitest";
import {
  CURRENTLY_READING_ADD_COPY,
  OVERVIEW_QUICK_ACTIONS,
  OVERVIEW_SECTION_TITLES,
} from "../../../../packages/utils/overviewCopy";
import {
  HOME_OVERVIEW_CURRENTLY_READING_ORIGIN,
  currentlyReadingAddSearchPath,
  isCurrentlyReadingAddFromOverview,
} from "../../../../packages/utils/currentlyReadingAdd";

describe("overview copy (iOS)", () => {
  it("matches the shared Title Case Overview labels", () => {
    expect(OVERVIEW_SECTION_TITLES.currentlyReading).toBe("Currently Reading");
    expect(OVERVIEW_SECTION_TITLES.recentActivity).toBe("Recent Activity");
    expect(OVERVIEW_QUICK_ACTIONS.searchBooks).toBe("Search Books");
    expect(OVERVIEW_QUICK_ACTIONS.openLibrary).toBe("Open Library");
    expect(CURRENTLY_READING_ADD_COPY.cardLabel).toBe("Add Book to Currently Reading");
  });

  it("uses the shared Add Book search origin", () => {
    expect(
      isCurrentlyReadingAddFromOverview({ origin: HOME_OVERVIEW_CURRENTLY_READING_ORIGIN })
    ).toBe(true);
    expect(currentlyReadingAddSearchPath()).toContain(HOME_OVERVIEW_CURRENTLY_READING_ORIGIN);
  });
});
