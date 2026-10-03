import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CURRENTLY_READING_CARD_SIZE } from "./currentlyReadingCard";
import { originBackLink } from "./navigationOrigin";
import {
  FAVORITES_LISTING,
  OVERVIEW_ACTIVITY_VIEW_ALL,
  OVERVIEW_SECTION_ORDER,
  OVERVIEW_SECTION_TITLES,
  overviewContentPhase,
} from "./overviewCopy";
import {
  OVERVIEW_QUICK_ACTION_FOURTH_SLOT,
  OVERVIEW_QUICK_ACTIONS_LIST,
} from "./overviewQuickActions";
import { OVERVIEW_SHELF_COVER } from "./overviewShelfCover";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function source(relativePath: string): string {
  return readFileSync(resolve(repoRoot, relativePath), "utf8");
}

describe("Sprint 1 Overview contracts", () => {
  it("renders section order Currently Reading, shelves, Quick Actions, Recent Activity", () => {
    expect(OVERVIEW_SECTION_ORDER.map((id) => OVERVIEW_SECTION_TITLES[id])).toEqual([
      "Currently Reading",
      "Recently Finished",
      "Favorites",
      "Quick Actions",
      "Recent Activity",
    ]);
    const web = source("apps/web/src/components/reading-room/OverviewTab.tsx");
    const mobile = source("apps/mobile/src/components/reading-room/OverviewTab.tsx");
    for (const file of [web, mobile]) {
      const currently = file.indexOf("OVERVIEW_SECTION_TITLES.currentlyReading");
      const finished = file.indexOf("OVERVIEW_SECTION_TITLES.recentlyFinished");
      const favorites = file.indexOf("OVERVIEW_SECTION_TITLES.favorites");
      const actions = file.indexOf("OVERVIEW_SECTION_TITLES.quickActions");
      const activity = file.indexOf("<ActivityFeed");
      expect(currently).toBeGreaterThan(-1);
      expect(currently).toBeLessThan(finished);
      expect(finished).toBeLessThan(favorites);
      expect(favorites).toBeLessThan(actions);
      expect(actions).toBeLessThan(activity);
    }
  });

  it("uses the shared card box for Add Book and Currently Reading", () => {
    for (const platform of ["web", "native"] as const) {
      const size = CURRENTLY_READING_CARD_SIZE[platform];
      expect(size.heightPx).toBeGreaterThan(size.widthPx);
      expect(size.borderRadiusPx).toBe(12);
    }
    expect(source("apps/web/src/components/reading-room/AddBookCoverCard.tsx")).toContain(
      "currentlyReadingCardBoxStyle"
    );
    expect(source("apps/mobile/src/components/reading-room/AddBookCoverCard.tsx")).toContain(
      "currentlyReadingCardBoxStyle"
    );
  });

  it("routes Favorites View All to Favorites, not the finished shelf", () => {
    expect(FAVORITES_LISTING.webPath).toBe("/library/favorites/");
    expect(FAVORITES_LISTING.mobilePath).toBe("/library/favorites");
    expect(FAVORITES_LISTING.webPath).not.toContain("/library/read");
    const web = source("apps/web/src/components/reading-room/OverviewTab.tsx");
    expect(web).toContain("FAVORITES_LISTING.webPath");
    expect(web).toContain('withOriginQuery("/library/read/"');
  });

  it("sends Overview shelf back to Overview and Library shelf back to Library", () => {
    const fromOverview = originBackLink("home_overview", "web", {
      href: "/library/",
      label: "← Back to Library",
    });
    expect(fromOverview.href).toBe("/reading-room/");
    expect(fromOverview.label).toBe("← Back to Overview");

    const fromLibrary = originBackLink("library_shelf", "mobile", {
      href: "/library",
      label: "← Back to Library",
    });
    expect(fromLibrary.href).toBe("/library");

    const deepLink = originBackLink(null, "web", {
      href: "/library/",
      label: "← Back to Library",
    });
    expect(deepLink.href).toBe("/library/");
    expect(deepLink.origin).toBeNull();
  });

  it("keeps a single back control on shelves opened from Overview", () => {
    const mobileShelf = source("apps/mobile/app/(app)/library/[shelf].tsx");
    expect(mobileShelf).toContain("ScreenHeader");
    expect(mobileShelf).not.toContain("Back to Overview");
    expect(mobileShelf).not.toContain("originBackLink");

    const webShelf = source("apps/web/src/app/(app)/library/[shelf]/ShelfPageClient.tsx");
    expect(webShelf).toContain("explicit");
    expect(webShelf).not.toContain("Back to Overview");
    expect(webShelf.match(/<OriginBackNav/g)?.length).toBe(3);
  });

  it("ships the three approved Quick Actions and no removed ones", () => {
    expect(OVERVIEW_QUICK_ACTIONS_LIST.map((action) => action.label)).toEqual([
      "Open Library",
      "Book Clubs",
      "Reading Challenges",
    ]);
    expect(OVERVIEW_QUICK_ACTIONS_LIST.map((action) => action.id)).not.toContain("continueReading");
    expect(OVERVIEW_QUICK_ACTIONS_LIST.map((action) => action.id)).not.toContain("searchBooks");
    expect(OVERVIEW_QUICK_ACTIONS_LIST.map((action) => action.id)).not.toContain("trail");
    expect(OVERVIEW_QUICK_ACTION_FOURTH_SLOT).toBeNull();
    const web = source("apps/web/src/components/reading-room/OverviewTab.tsx");
    expect(web).not.toContain("Continue Reading");
    expect(web).not.toContain("Search Books");
  });

  it("centers Recent Activity and the view-all link", () => {
    expect(OVERVIEW_ACTIVITY_VIEW_ALL).toBe("View all activity");
    expect(source("apps/web/src/components/reading-room/ActivityFeed.tsx")).toContain(
      'actionLayout="stacked"'
    );
    expect(source("apps/mobile/src/components/reading-room/ActivityFeed.tsx")).toContain(
      'actionLayout="stacked"'
    );
  });

  it("does not treat a loading shelf as empty", () => {
    expect(overviewContentPhase(true, 0)).toBe("loading");
    expect(overviewContentPhase(false, 0)).toBe("empty");
    expect(overviewContentPhase(false, 2)).toBe("content");
  });

  it("keeps Recently Finished and Favorites covers on a contain frame", () => {
    expect(OVERVIEW_SHELF_COVER.fit).toBe("contain");
    expect(OVERVIEW_SHELF_COVER.heightPx).toBeGreaterThan(OVERVIEW_SHELF_COVER.widthPx);
    for (const file of [
      "apps/web/src/components/reading-room/OverviewBookShelf.tsx",
      "apps/mobile/src/components/reading-room/OverviewBookShelf.tsx",
    ]) {
      const text = source(file);
      expect(text).toContain("OVERVIEW_SHELF_COVER.fit");
    }
  });
});
