import { describe, expect, it } from "vitest";
import {
  OVERVIEW_QUICK_ACTION_EVENTS,
  OVERVIEW_QUICK_ACTIONS_LIST,
} from "../../../../packages/utils/overviewQuickActions";

describe("overview Quick Actions (iOS)", () => {
  it("navigates to library, clubs, and challenges landings", () => {
    expect(OVERVIEW_QUICK_ACTIONS_LIST.map((action) => action.mobileHref)).toEqual([
      "/library",
      "/clubs",
      "/challenges",
    ]);
    expect(OVERVIEW_QUICK_ACTIONS_LIST.map((action) => action.analyticsEvent)).toEqual([
      OVERVIEW_QUICK_ACTION_EVENTS.openLibrary,
      OVERVIEW_QUICK_ACTION_EVENTS.bookClubs,
      OVERVIEW_QUICK_ACTION_EVENTS.readingChallenges,
    ]);
  });
});
