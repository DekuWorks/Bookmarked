import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { previewShelfItems, SHELF_PREVIEW_LIMIT, bookCountLabel } from "./overviewShelfPreview";
import {
  calendarMonthMotion,
  carouselIndexAfterMoves,
  currentlyReadingCoverSize,
  goalBarFillPercent,
  highestMilestoneCrossed,
  motionDuration,
  observeGoalProgress,
  statsCardMotion,
  progressMotion,
  readingGoalRealPercent,
  READING_ROOM_MOTION,
  relocateLibraryBook,
  relocateOverviewBook,
  shelfEnterIds,
  shelfExitIds,
} from "./readingRoomMotion";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function source(relativePath: string): string {
  return readFileSync(resolve(repoRoot, relativePath), "utf8");
}

describe("reading room motion", () => {
  it("keeps rapid carousel clicks on one committed index", () => {
    expect(carouselIndexAfterMoves(0, [1, 1, 1, 1], 3)).toBe(2);
    expect(carouselIndexAfterMoves(2, [-1, -1, -1], 3)).toBe(0);
    expect(carouselIndexAfterMoves(0, [1], 1)).toBe(0);
  });

  it("does not animate progress unless the underlying value changes", () => {
    const first = progressMotion({ previous: null, next: 40, reducedMotion: false });
    const same = progressMotion({ previous: 40, next: 40, reducedMotion: false });
    const next = progressMotion({ previous: 10, next: 40, reducedMotion: false });
    const reduced = progressMotion({ previous: 10, next: 40, reducedMotion: true });
    expect(first).toEqual({ fill: 0.4, displayPercent: 40, animate: false });
    expect(same.animate).toBe(false);
    expect(next).toEqual({ fill: 0.4, displayPercent: 40, animate: true });
    expect(next.displayPercent).toBe(40);
    expect(reduced.animate).toBe(false);
    expect(reduced.displayPercent).toBe(40);
    expect(source("packages/utils/readingRoomMotion.ts")).not.toContain("recordNavVisit");
    expect(source("apps/web/src/components/reading-room/MotionProgressBar.tsx")).not.toContain(
      "recordNavVisit"
    );
  });

  it("caps the goal fill at 100 while the real percent stays exact", () => {
    expect(goalBarFillPercent(140)).toBe(100);
    expect(goalBarFillPercent(100)).toBe(100);
    expect(goalBarFillPercent(0)).toBe(0);
    expect(goalBarFillPercent(-4)).toBe(0);
    expect(readingGoalRealPercent(7, 5)).toBe(140);
    expect(readingGoalRealPercent(5, 5)).toBe(100);
    expect(readingGoalRealPercent(0, 5)).toBe(0);
    expect(readingGoalRealPercent(3, null)).toBeNull();
  });

  it("does not celebrate a milestone on hydrate, refresh, or an unchanged value", () => {
    let observed = observeGoalProgress({ settled: false, baseline: null }, 80, false);
    expect(observed.milestone).toBeNull();
    expect(observed.state.settled).toBe(false);

    observed = observeGoalProgress(observed.state, 80, true);
    expect(observed.milestone).toBeNull();
    expect(observed.state.baseline).toBe(80);

    observed = observeGoalProgress(observed.state, 80, true);
    expect(observed.milestone).toBeNull();

    observed = observeGoalProgress(observed.state, 100, true);
    expect(observed.milestone).toBe(100);
    expect(highestMilestoneCrossed(20, 80)).toBe(75);
    expect(highestMilestoneCrossed(80, 80)).toBeNull();
    expect(highestMilestoneCrossed(null, 100)).toBeNull();
  });

  it("uses a zero duration when reduced motion is on", () => {
    expect(motionDuration(READING_ROOM_MOTION.carouselMs, true)).toBe(0);
    expect(motionDuration(READING_ROOM_MOTION.milestoneMs, false)).toBe(900);
    expect(READING_ROOM_MOTION.carouselMs).toBeGreaterThanOrEqual(220);
    expect(READING_ROOM_MOTION.carouselMs).toBeLessThanOrEqual(350);
    expect(READING_ROOM_MOTION.tabIndicatorMs).toBeGreaterThanOrEqual(180);
    expect(READING_ROOM_MOTION.tabIndicatorMs).toBeLessThanOrEqual(280);
    expect(READING_ROOM_MOTION.tabContentMs).toBeGreaterThanOrEqual(150);
    expect(READING_ROOM_MOTION.tabContentMs).toBeLessThanOrEqual(250);
    expect(READING_ROOM_MOTION.shelfHoverLiftPx).toBeGreaterThanOrEqual(4);
    expect(READING_ROOM_MOTION.shelfHoverLiftPx).toBeLessThanOrEqual(8);
  });

  it("caps shelf covers at five and only animates membership changes", () => {
    const shelf = ["a", "b", "c", "d", "e", "f"];
    const visible = previewShelfItems(shelf);
    expect(visible).toHaveLength(SHELF_PREVIEW_LIMIT);
    expect(bookCountLabel(shelf.length)).toBe("6 books");
    expect(bookCountLabel(1)).toBe("1 book");
    expect(shelfEnterIds(null, visible)).toEqual([]);
    expect(shelfEnterIds(["a", "b", "c", "d", "e"], previewShelfItems(["f", ...shelf]))).toEqual([
      "f",
    ]);
    expect(shelfExitIds(["a", "b", "c"], ["a", "c"])).toEqual(["b"]);
  });

  it("moves a user book once and can roll the list back", () => {
    const books = [
      { id: "tbr-1", shelf_status: "want_to_read" },
      { id: "cr-1", shelf_status: "currently_reading" },
    ];
    const moved = relocateLibraryBook(books, "tbr-1", "currently_reading");
    expect(moved.map((book) => book.id)).toEqual(["tbr-1", "cr-1"]);
    expect(moved.filter((book) => book.id === "tbr-1")).toHaveLength(1);
    expect(moved[0]?.shelf_status).toBe("currently_reading");

    const shelves = [
      { status: "want_to_read", items: [books[0]!] },
      { status: "currently_reading", items: [books[1]!] },
      { status: "read", items: [] as typeof books },
    ];
    const overview = relocateOverviewBook({
      currentlyReading: [books[1]!],
      shelves,
      book: books[0]!,
      toStatus: "currently_reading",
    });
    expect(overview.currentlyReading.map((book) => book.id)).toEqual(["tbr-1", "cr-1"]);
    expect(overview.shelves.find((shelf) => shelf.status === "want_to_read")?.items).toEqual([]);
    expect(
      overview.shelves.find((shelf) => shelf.status === "currently_reading")?.items.map((book) => book.id)
    ).toEqual(["tbr-1", "cr-1"]);
  });

  it("enlarges desktop covers and keeps phone covers compact", () => {
    const previousDesktop = 128;
    const desktop = currentlyReadingCoverSize(1440, "web");
    const tablet = currentlyReadingCoverSize(800, "web");
    const phone = currentlyReadingCoverSize(390, "web");
    const iphone = currentlyReadingCoverSize(390, "ios");
    const ipad = currentlyReadingCoverSize(1024, "ios");
    expect(desktop.width / previousDesktop).toBeGreaterThanOrEqual(1.3);
    expect(desktop.width / previousDesktop).toBeLessThanOrEqual(1.5);
    expect(desktop.height / desktop.width).toBeCloseTo(1.5);
    expect(tablet.width).toBeGreaterThan(phone.width);
    expect(tablet.width).toBeLessThan(desktop.width);
    expect(phone).toEqual({ width: 96, height: 144 });
    expect(iphone).toEqual({ width: 96, height: 144 });
    expect(ipad.width).toBeGreaterThan(iphone.width);
    expect(ipad.height / ipad.width).toBeCloseTo(1.5);
  });

  it("uses the existing tab timing for stats polish and turns it off for reduced motion", () => {
    const still = statsCardMotion(true);
    const moving = statsCardMotion(false);
    expect(still.durationMs).toBe(0);
    expect(still.shiftPx).toBe(0);
    expect(still.delayMs(3)).toBe(0);
    expect(moving.durationMs).toBe(READING_ROOM_MOTION.tabContentMs);
    expect(moving.shiftPx).toBe(READING_ROOM_MOTION.tabContentShiftPx);
    expect(moving.delayMs(3)).toBe(120);
    expect(calendarMonthMotion(true).durationMs).toBe(0);
    expect(calendarMonthMotion(false).shiftPx).toBe(READING_ROOM_MOTION.tabContentShiftPx);

    expect(source("apps/web/src/components/reading-room/ReadingGoalCard.tsx")).toContain(
      "MotionProgressBar"
    );
    expect(source("apps/mobile/src/components/reading-room/ReadingGoalCard.tsx")).toContain(
      "<ProgressBar percent={real} animate />"
    );
    expect(source("apps/web/src/components/premium/PlusLockedFeature.tsx")).toContain("rr-plus-lock");
    expect(source("apps/web/src/components/calendar/ReadingCalendar.tsx")).toContain("rr-calendar-month");
    expect(source("apps/web/src/components/reading-room/StatsSectionSkeleton.tsx")).toContain(
      'aria-busy="true"'
    );
    expect(source("apps/mobile/src/components/PlusLockedFeature.tsx")).toContain(
      "usePrefersReducedMotion"
    );
    expect(source("apps/mobile/src/components/ReadingInsightsSection.tsx")).toContain("canAccess");
    expect(source("apps/mobile/src/components/ReadingInsightsSection.tsx")).not.toContain("purchasedLocally");
    expect(source("apps/web/src/app/globals.css")).toContain(".rr-plus-lock:hover");
    expect(source("apps/web/src/app/globals.css")).toContain(".rr-stats-card,\n  .rr-calendar-month");
  });
});
