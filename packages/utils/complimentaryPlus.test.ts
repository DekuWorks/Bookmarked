import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { hasComplimentaryPlus } from "./complimentaryPlus";
import {
  applyComplimentaryPlus,
  canAccessFeature,
  subscriptionIsActive,
  toSubscriptionAccessFromRow,
} from "./subscription";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const founderId = "8bd36e7e-dd38-4385-8afb-ab595fe712f6";
const ellieId = "e3243532-077e-4df6-929a-94733bfd0e14";
const dekuworksId = "89ed2bcf-a37d-4e2c-aa0e-6577af9979d1";

const freeRow = {
  subscription_tier: "free" as const,
  subscription_status: "inactive" as const,
  subscription_expires_at: null,
};

const expiredPlus = {
  subscription_tier: "plus" as const,
  subscription_status: "expired" as const,
  subscription_expires_at: new Date(Date.now() - 86_400_000).toISOString(),
};

const activeHome = {
  subscription_tier: "home" as const,
  subscription_status: "active" as const,
  subscription_expires_at: null,
};

describe("complimentary Plus allowlist", () => {
  it("entitles the confirmed founder, Ellie, and dekuworks accounts", () => {
    for (const identity of [
      { username: "CaiteeD" },
      { username: "caiteed" },
      { userId: founderId },
      { username: "ellienoblin" },
      { userId: ellieId },
      { username: "dekuworks" },
      { username: "DekuWorks" },
      { userId: dekuworksId },
    ]) {
      const access = applyComplimentaryPlus(freeRow, identity);
      expect(subscriptionIsActive(access)).toBe(true);
      expect(access.subscription_tier).toBe("plus");
      expect(access.subscription_status).toBe("active");
      expect(canAccessFeature("ai_insights", access)).toBe(true);
      expect(canAccessFeature("advanced_analytics", access)).toBe(true);
      expect(canAccessFeature("book_map", access)).toBe(false);
    }
  });

  it("does not entitle a random user, an unmatched handle, or an ambiguous Leighton", () => {
    for (const identity of [
      { userId: "11111111-1111-4111-8111-111111111111", username: "reader" },
      { username: "zmokeafterdark" },
      { username: "leighton" },
      { username: "leighton.cook" },
      { username: "ellie" },
      { username: "CaiteeD-extra" },
    ]) {
      expect(hasComplimentaryPlus(identity)).toBe(false);
      const access = toSubscriptionAccessFromRow(expiredPlus, identity);
      expect(access.subscription_status).toBe("expired");
      expect(subscriptionIsActive(access)).toBe(false);
      expect(canAccessFeature("ai_insights", access)).toBe(false);
    }
  });

  it("keeps an expired paid row expired for everyone else and keeps real Home", () => {
    const stranger = toSubscriptionAccessFromRow(expiredPlus, {
      userId: "22222222-2222-4222-8222-222222222222",
    });
    expect(stranger).toEqual(expiredPlus);
    expect(subscriptionIsActive(stranger)).toBe(false);

    const founderExpired = toSubscriptionAccessFromRow(
      { ...expiredPlus, user_id: founderId },
    );
    expect(founderExpired.subscription_tier).toBe("plus");
    expect(founderExpired.subscription_status).toBe("active");
    expect(subscriptionIsActive(founderExpired)).toBe(true);

    const founderHome = applyComplimentaryPlus(activeHome, { username: "CaiteeD" });
    expect(founderHome.subscription_tier).toBe("home");
    expect(canAccessFeature("book_map", founderHome)).toBe(true);
  });

  it("uses the same helper in the paid edge functions", () => {
    const shared = readFileSync(
      resolve(repoRoot, "supabase/functions/_shared/complimentaryPlus.ts"),
      "utf8"
    );
    expect(shared).toContain("packages/utils/complimentaryPlus.ts");
    expect(shared).toContain("toSubscriptionAccessFromRow");

    for (const relativePath of [
      "supabase/functions/ai-insights/index.ts",
      "supabase/functions/quote-scanner/index.ts",
    ]) {
      const source = readFileSync(resolve(repoRoot, relativePath), "utf8");
      expect(source).toContain("toSubscriptionAccessFromRow");
      expect(source).toContain("userData.user.id");
    }

    const companion = readFileSync(
      resolve(repoRoot, "supabase/functions/ai-reading-companion/index.ts"),
      "utf8"
    );
    expect(companion).toContain("hasComplimentaryPlus");
    expect(companion).toContain("plus_required");
  });
});
