import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { canStartPlusPurchase } from "./iap";
import { PLUS_WEB_SUBSCRIBE_GUIDANCE, STATS_SECTION_ORDER } from "./plusLockedCopy";
import { READING_ROOM_TAB_OPTIONS } from "./readingRoomTabs";
import { canAccessFeature } from "./subscription";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function source(relativePath: string): string {
  return readFileSync(resolve(repoRoot, relativePath), "utf8");
}

const activePlus = {
  subscription_tier: "plus" as const,
  subscription_status: "active" as const,
  subscription_expires_at: new Date(Date.now() + 86_400_000).toISOString(),
};

const expiredPlus = {
  subscription_tier: "plus" as const,
  subscription_status: "expired" as const,
  subscription_expires_at: new Date(Date.now() - 86_400_000).toISOString(),
};

describe("Sprint 2 progress migration", () => {
  it("keeps the Reading Room bar on Overview, Reviews, Notes, and Stats", () => {
    expect(READING_ROOM_TAB_OPTIONS.map((option) => option.label)).toEqual([
      "Overview",
      "Reviews",
      "Notes",
      "Stats",
    ]);
    const web = source("apps/web/src/components/reading-room/ReadingRoomTabs.tsx");
    const mobile = source("apps/mobile/app/(app)/index.tsx");
    expect(web).toContain("READING_ROOM_TAB_OPTIONS");
    expect(mobile).toContain("READING_ROOM_TAB_OPTIONS");
    expect(web).not.toContain('label: "Progress"');
    expect(mobile).not.toContain('label: "Progress"');
  });

  it("keeps Reading Goal under Currently Reading and edits that same goal", () => {
    for (const file of [
      "apps/web/src/components/reading-room/OverviewTab.tsx",
      "apps/mobile/src/components/reading-room/OverviewTab.tsx",
    ]) {
      const text = source(file);
      expect(text.indexOf("CurrentlyReadingCarousel")).toBeLessThan(text.indexOf("ReadingGoalCard"));
    }
    expect(source("apps/web/src/components/reading-room/ReadingGoalCard.tsx")).toContain(
      "ReadingGoalPanel"
    );
    expect(source("apps/mobile/src/components/reading-room/ReadingGoalCard.tsx")).toContain(
      "ReadingGoalPanel"
    );
    expect(source("apps/web/src/components/reading-room/ReadingRoomTabs.tsx")).not.toContain(
      "ReadingGoalPanel"
    );
    expect(source("apps/mobile/app/(app)/index.tsx")).not.toContain("ReadingGoalPanel");
  });

  it("puts the calendar and statistics on Stats, in that order", () => {
    const web = source("apps/web/src/components/reading-room/ReadingRoomTabs.tsx");
    const mobile = source("apps/mobile/app/(app)/index.tsx");
    expect(web.indexOf("ReadingCalendar")).toBeLessThan(web.indexOf("Reading Statistics"));
    expect(web.indexOf("Reading Statistics")).toBeLessThan(
      web.indexOf("STATS_PLUS_FEATURES.analytics.title")
    );
    expect(web.indexOf("STATS_PLUS_FEATURES.analytics.title")).toBeLessThan(
      web.indexOf("STATS_PLUS_FEATURES.insights.title")
    );
    expect(mobile.lastIndexOf("Reading Calendar")).toBeLessThan(mobile.lastIndexOf("Reading Statistics"));
    expect(mobile.lastIndexOf("Reading Statistics")).toBeLessThan(
      mobile.lastIndexOf("<ReadingInsightsSection")
    );
    expect(STATS_SECTION_ORDER).toEqual([
      "Reading Calendar",
      "Reading Statistics",
      "Advanced Reading Analytics",
      "AI Insights",
    ]);
  });

  it("shows free users a locked preview that points to the iOS app", () => {
    expect(PLUS_WEB_SUBSCRIBE_GUIDANCE).toMatch(/Bookmarked Plus/);
    expect(PLUS_WEB_SUBSCRIBE_GUIDANCE).toMatch(/iOS app/);
    expect(PLUS_WEB_SUBSCRIBE_GUIDANCE).not.toMatch(/checkout|stripe|card number/i);
    const webLock = source("apps/web/src/components/premium/PlusLockedFeature.tsx");
    expect(webLock).toContain("PLUS_WEB_SUBSCRIBE_GUIDANCE");
    expect(webLock).toContain("PlusBadge");
    expect(webLock).not.toContain("/upgrade/");
    expect(webLock).not.toContain("stripe");
    const insights = source("apps/web/src/lib/services/aiInsights.ts");
    const insightsBody = insights.slice(insights.indexOf("export async function getAiInsights"));
    expect(insightsBody.indexOf('canAccessFeature("ai_insights"')).toBeLessThan(
      insightsBody.indexOf("tryOpenAiInsights")
    );
  });

  it("starts the existing Apple purchase only when the Plus product is listed", () => {
    expect(
      canStartPlusPurchase({ iapEnabled: true, connected: true, productListed: false })
    ).toBe(false);
    expect(
      canStartPlusPurchase({ iapEnabled: false, connected: true, productListed: true })
    ).toBe(false);
    expect(
      canStartPlusPurchase({ iapEnabled: true, connected: true, productListed: true })
    ).toBe(true);
    const hook = source("apps/mobile/src/hooks/useAppleSubscriptionPurchase.ts");
    const lock = source("apps/mobile/src/components/PlusLockedFeature.tsx");
    const section = source("apps/mobile/src/components/ReadingInsightsSection.tsx");
    expect(hook).toContain("requestPurchase");
    expect(hook).toContain("verifyApplePurchaseOnServer");
    expect(hook).toContain("restorePurchases");
    expect(hook).toContain("canStartPlusPurchase");
    expect(lock).toContain("Subscribe");
    expect(lock).toContain("Restore purchases");
    expect(lock).not.toContain("card number");
    expect(section).toContain("requireListed: true");
    expect(section).toContain("AiInsightsPanel");
    expect(section).toContain("ReadingActivityPanel");
  });

  it("unlocks analytics and AI insights for an active Plus account", () => {
    expect(canAccessFeature("advanced_analytics", activePlus)).toBe(true);
    expect(canAccessFeature("ai_insights", activePlus)).toBe(true);
    expect(canAccessFeature("advanced_analytics", null)).toBe(false);
    expect(canAccessFeature("ai_insights", null)).toBe(false);
  });

  it("removes Plus access when the subscription expires without touching reading sessions", () => {
    const sessions = [{ id: "session-1", pages_read: 24, activity_kind: "session" }];
    const snapshot = sessions.map((session) => ({ ...session }));
    expect(canAccessFeature("advanced_analytics", expiredPlus)).toBe(false);
    expect(canAccessFeature("ai_insights", expiredPlus)).toBe(false);
    expect(sessions).toEqual(snapshot);
  });
});
