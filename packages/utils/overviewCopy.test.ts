import { describe, expect, it } from "vitest";
import {
  CURRENTLY_READING_ADD_COPY,
  OVERVIEW_ACTIVITY_VIEW_ALL,
  OVERVIEW_QUICK_ACTIONS,
  OVERVIEW_SECTION_TITLES,
} from "./overviewCopy";

describe("overviewCopy", () => {
  it("uses Title Case for Overview section headings", () => {
    expect(OVERVIEW_SECTION_TITLES.currentlyReading).toBe("Currently Reading");
    expect(OVERVIEW_SECTION_TITLES.recentlyFinished).toBe("Recently Finished");
    expect(OVERVIEW_SECTION_TITLES.quickActions).toBe("Quick Actions");
    expect(OVERVIEW_SECTION_TITLES.recentActivity).toBe("Recent Activity");
  });

  it("uses Title Case for Quick Action buttons", () => {
    expect(OVERVIEW_QUICK_ACTIONS.searchBooks).toBe("Search Books");
    expect(OVERVIEW_QUICK_ACTIONS.continueReading).toBe("Continue Reading");
    expect(OVERVIEW_QUICK_ACTIONS.openLibrary).toBe("Open Library");
    expect(OVERVIEW_QUICK_ACTIONS.trail).toBe("Trail");
  });

  it("keeps Recent Activity link copy and Add Book a11y labels", () => {
    expect(OVERVIEW_ACTIVITY_VIEW_ALL).toBe("View all activity");
    expect(CURRENTLY_READING_ADD_COPY.cardLabel).toBe("Add Book to Currently Reading");
    expect(CURRENTLY_READING_ADD_COPY.chooseFromTbr).toBe("Choose from TBR");
    expect(CURRENTLY_READING_ADD_COPY.searchForABook).toBe("Search for a Book");
    expect(CURRENTLY_READING_ADD_COPY.tbrEmpty).toBe("Your TBR is empty.");
  });
});
